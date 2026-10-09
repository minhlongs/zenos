'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('node:path');
const {
  BODY_LIMIT,
  UPSTREAM_URLS,
  MODEL_ALIASES,
  CONCURRENCY_LIMIT,
  MAX_QUEUE_DEPTH,
  QUEUE_TIMEOUT_MS
} = require('./config');
const { dnsRebindingGuard, safeLogger, redactSecrets } = require('./security');
const { sendAnthropicError, mapErrorToAnthropic } = require('./errors');
const { ConcurrencyGate } = require('./queue');
const { initDatabase } = require('./db');
const { TaskStore } = require('./task-store');
const { createMemoryRouter } = require('./routes-memory');
const { ApprovalGate } = require('./approval-gate');
const { createSecurityRouter } = require('./routes-security');
const { TelemetryCollector } = require('./telemetry');
const { createTelemetryRouter, createTelemetryMiddleware } = require('./routes-telemetry');
const { createDashboardRouter } = require('./routes-dashboard');
const { createAnthropicRouter } = require('./routes-anthropic');

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
  const telemetry = options.telemetry || new TelemetryCollector();

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
  app.use(createTelemetryMiddleware(telemetry));
  app.use(express.json({ limit: options.bodyLimit || BODY_LIMIT }));

  // Mount API routers
  app.use('/v1', createAnthropicRouter({
    upstreamUrls,
    aliasMap,
    defaultModel,
    gate,
    capabilities: options.capabilities || {}
  }));
  app.use('/v1', createMemoryRouter({ taskStore, markdownDir }));
  app.use('/v1', createSecurityRouter({ approvalGate, allowedRoots: options.allowedRoots }));
  app.use('/v1', createTelemetryRouter({ telemetry }));
  app.use('/dashboard', createDashboardRouter({ telemetry, approvalGate }));

  // GET /health
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      queue: gate.getMetrics(),
      upstreams: upstreamUrls,
      telemetry: telemetry.getSummary()
    });
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
