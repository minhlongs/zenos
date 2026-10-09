'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { BODY_LIMIT, LMSTUDIO_URL } = require('./config');
const { dnsRebindingGuard, safeLogger, redactSecrets } = require('./security');
const { sendAnthropicError } = require('./errors');
const { translateAnthropicToOpenAI, translateOpenAIToAnthropic } = require('./translator');
const { fetchUpstream } = require('./upstream');
const { handleStreamingResponse } = require('./streaming');

function createApp(options = {}) {
  const app = express();
  const upstreamUrl = options.upstreamUrl || LMSTUDIO_URL;

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

  // GET /health
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    });
  });

  // GET /v1/models
  app.get('/v1/models', async (req, res) => {
    try {
      const upstreamRes = await fetchUpstream('/v1/models', { method: 'GET' }, req.signal, upstreamUrl);
      if (!upstreamRes.ok) {
        return sendAnthropicError(res, 502, 'api_error', `Upstream models endpoint returned ${upstreamRes.status}`);
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
      sendAnthropicError(res, err.status || 502, err.code || 'api_error', redactSecrets(err.message));
    }
  });

  // POST /v1/messages
  app.post('/v1/messages', async (req, res) => {
    let openAiReq;
    try {
      openAiReq = translateAnthropicToOpenAI(req.body);
    } catch (err) {
      return sendAnthropicError(res, 400, 'invalid_request_error', redactSecrets(err.message));
    }

    try {
      const upstreamRes = await fetchUpstream(
        '/v1/chat/completions',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(openAiReq)
        },
        req.signal,
        upstreamUrl
      );

      if (!upstreamRes.ok) {
        let errDetail = `Upstream error ${upstreamRes.status}`;
        try {
          const errBody = await upstreamRes.json();
          if (errBody && errBody.error && errBody.error.message) {
            errDetail = errBody.error.message;
          }
        } catch { /* ignore */ }
        return sendAnthropicError(res, 502, 'api_error', redactSecrets(errDetail));
      }

      if (openAiReq.stream) {
        return handleStreamingResponse(upstreamRes, res, req, req.body.model);
      }

      const openAiData = await upstreamRes.json();
      const anthropicEnvelope = translateOpenAIToAnthropic(openAiData, req.body.model);
      return res.status(200).json(anthropicEnvelope);
    } catch (err) {
      if (res.headersSent) return;
      return sendAnthropicError(res, err.status || 502, err.code || 'api_error', redactSecrets(err.message));
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
    return sendAnthropicError(res, err.status || 500, 'api_error', redactSecrets(err.message));
  });

  return app;
}

module.exports = { createApp };
