'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('node:path');
const {
  BODY_LIMIT,
  LMSTUDIO_URL,
  UPSTREAM_URLS,
  DEFAULT_MODEL,
  MODEL_ALIASES,
  CONCURRENCY_LIMIT,
  MAX_QUEUE_DEPTH,
  QUEUE_TIMEOUT_MS
} = require('./config');
const { dnsRebindingGuard, safeLogger, redactSecrets } = require('./security');
const { sendAnthropicError, mapErrorToAnthropic } = require('./errors');
const { translateAnthropicToOpenAI, translateOpenAIToAnthropic } = require('./translator');
const { fetchUpstream } = require('./upstream');
const { handleStreamingResponse } = require('./streaming');
const { resolveModel, validateCapabilities } = require('./router');
const { ConcurrencyGate } = require('./queue');
const { executeWithFailover } = require('./failover');
const { initDatabase } = require('./db');
const { TaskStore } = require('./task-store');
const { createMemoryRouter } = require('./routes-memory');
const { ApprovalGate } = require('./approval-gate');
const { createSecurityRouter } = require('./routes-security');

function createApp(options = {}) {
  const app = express();
  const upstreamUrls = options.upstreamUrls || (options.upstreamUrl ? [options.upstreamUrl] : UPSTREAM_URLS);
  const aliasMap = options.modelAliases !== undefined ? options.modelAliases : MODEL_ALIASES;
  const defaultModel = options.defaultModel !== undefined ? options.defaultModel : (process.env.LMSTUDIO_DEFAULT_MODEL || null);

  const gate = options.gate || new ConcurrencyGate({
    concurrency: options.concurrency ?? CONCURRENCY_LIMIT,
    maxQueueDepth: options.maxQueueDepth ?? MAX_QUEUE_DEPTH,
    queueTimeoutMs: options.queueTimeoutMs ?? QUEUE_TIMEOUT_MS
  });

  const db = options.db || initDatabase({
    memory: options.memoryDb !== undefined ? options.memoryDb : (!process.env.ZENOS_DB_PATH),
    dbPath: options.dbPath || process.env.ZENOS_DB_PATH
  });
  const taskStore = options.taskStore || new TaskStore(db);
  taskStore.recoverDanglingTasks();

  const markdownDir = options.markdownDir || process.env.ZENOS_MARKDOWN_DIR || path.join(__dirname, '../../memory/markdown');
  const approvalGate = options.approvalGate || new ApprovalGate();

  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isLoopback = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      if (isLoopback) return callback(null, true);
      return callback(new Error('CORS not allowed for non-loopback origin'));
    }
  }));
  app.use(dnsRebindingGuard);
  app.use(safeLogger);
  app.use(express.json({ limit: options.bodyLimit || BODY_LIMIT }));

  // Mount memory, tasks, and session routes
  app.use('/v1', createMemoryRouter({ taskStore, markdownDir }));
  app.use('/v1', createSecurityRouter({ approvalGate, allowedRoots: options.allowedRoots }));

  // GET /health
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      queue: gate.getMetrics(),
      upstreams: upstreamUrls
    });
  });

  // GET /v1/models
  app.get('/v1/models', async (req, res) => {
    try {
      const upstreamRes = await executeWithFailover(upstreamUrls, async (url) => {
        return fetchUpstream('/v1/models', { method: 'GET' }, req.signal, url);
      }, { clientSignal: req.signal });

      if (!upstreamRes.ok) {
        return sendAnthropicError(res, 502, 'api_error', `Upstream models returned ${upstreamRes.status}`);
      }
      const data = await upstreamRes.json();
      const models = Array.isArray(data.data) ? data.data : [];
      res.status(200).json({
        data: models.map(m => ({
          id: m.id,
          type: 'model',
          display_name: m.id,
          created_at: new Date((m.created || 0) * 1000).toISOString()
        })),
        has_more: false
      });
    } catch (err) {
      const { status, type } = mapErrorToAnthropic(err);
      sendAnthropicError(res, status, type, redactSecrets(err.message));
    }
  });

  // POST /v1/messages
  app.post('/v1/messages', async (req, res) => {
    let openAiReq;
    const requestedModel = req.body && req.body.model;

    try {
      if (!requestedModel || typeof requestedModel !== 'string') {
        const err = new Error('Missing required field: model');
        err.status = 400;
        throw err;
      }
      const resolvedModel = resolveModel(requestedModel, aliasMap, defaultModel);
      validateCapabilities(resolvedModel, req.body, options.capabilities || {});
      openAiReq = translateAnthropicToOpenAI(req.body);
      openAiReq.model = resolvedModel;
    } catch (err) {
      const { status, type } = mapErrorToAnthropic(err, 400);
      return sendAnthropicError(res, status, type, redactSecrets(err.message));
    }

    const bypass = req.headers['x-zenos-bypass-queue'] === 'true' || req.headers['x-bypass-queue'] === 'true';

    try {
      await gate.enqueue(async () => {
        return executeWithFailover(upstreamUrls, async (url) => {
          const upstreamRes = await fetchUpstream(
            '/v1/chat/completions',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(openAiReq)
            },
            req.signal,
            url
          );

          if (!upstreamRes.ok) {
            let errDetail = `Upstream error ${upstreamRes.status}`;
            try {
              const errBody = await upstreamRes.json();
              if (errBody && errBody.error && errBody.error.message) errDetail = errBody.error.message;
            } catch { /* ignore */ }
            const err = new Error(errDetail);
            err.status = upstreamRes.status;
            throw err;
          }

          if (openAiReq.stream) {
            return handleStreamingResponse(upstreamRes, res, req, requestedModel);
          }

          const openAiData = await upstreamRes.json();
          const anthropicEnvelope = translateOpenAIToAnthropic(openAiData, requestedModel);
          return res.status(200).json(anthropicEnvelope);
        }, { clientSignal: req.signal });
      }, req.signal, { bypass });
    } catch (err) {
      if (res.headersSent) return;
      const { status, type } = mapErrorToAnthropic(err, 502);
      return sendAnthropicError(res, status, type, redactSecrets(err.message));
    }
  });

  // 404 handler
  app.use((req, res) => {
    sendAnthropicError(res, 404, 'not_found_error', `Endpoint ${req.method} ${req.path} not found`);
  });

  // Global error handler
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    if (err.type === 'entity.too.large' || err.status === 413) {
      return sendAnthropicError(res, 413, 'request_too_large', 'Request body exceeds maximum size limit');
    }
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return sendAnthropicError(res, 400, 'invalid_request_error', 'Malformed JSON in request body');
    }
    const { status, type } = mapErrorToAnthropic(err, 500);
    return sendAnthropicError(res, status, type, redactSecrets(err.message));
  });

  return app;
}

module.exports = { createApp };
