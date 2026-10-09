'use strict';

const express = require('express');
const { sendAnthropicError, mapErrorToAnthropic } = require('./errors');
const { translateAnthropicToOpenAI, translateOpenAIToAnthropic } = require('./translator');
const { fetchUpstream } = require('./upstream');
const { handleStreamingResponse } = require('./streaming');
const { resolveModel, validateCapabilities } = require('./router');
const { executeWithFailover } = require('./failover');
const { redactSecrets } = require('./security');

function createAnthropicRouter({ upstreamUrls, aliasMap, defaultModel, gate, capabilities = {} }) {
  const router = express.Router();

  router.get('/models', async (req, res) => {
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

  router.post('/messages', async (req, res) => {
    let openAiReq;
    const requestedModel = req.body && req.body.model;

    try {
      if (!requestedModel || typeof requestedModel !== 'string') {
        const err = new Error('Missing required field: model');
        err.status = 400;
        throw err;
      }
      const resolvedModel = resolveModel(requestedModel, aliasMap, defaultModel);
      validateCapabilities(resolvedModel, req.body, capabilities);
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

  return router;
}

module.exports = { createAnthropicRouter };
