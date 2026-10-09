'use strict';
const express = require('express');

function createTelemetryRouter({ telemetry }) {
  const router = express.Router();

  router.get('/telemetry', (req, res) => {
    if (!telemetry) {
      return res.status(503).json({ error: 'Telemetry collector not initialized' });
    }
    const summary = telemetry.getSummary();
    const limit = parseInt(req.query.limit, 10) || 20;
    const recentEvents = telemetry.getRecentEvents(limit);
    return res.json({
      ...summary,
      recentEvents
    });
  });

  router.get('/telemetry/events', (req, res) => {
    if (!telemetry) {
      return res.status(503).json({ error: 'Telemetry collector not initialized' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Send initial snapshot
    const initPayload = JSON.stringify({
      summary: telemetry.getSummary(),
      recentEvents: telemetry.getRecentEvents(10)
    });
    res.write(`event: init\ndata: ${initPayload}\n\n`);

    // Stream live events
    const onEvent = (event) => {
      const payload = JSON.stringify(event);
      res.write(`event: telemetry\ndata: ${payload}\n\n`);
    };

    telemetry.on('telemetry_event', onEvent);

    // Keepalive ping every 15s
    const pingInterval = setInterval(() => {
      res.write(`event: ping\ndata: {"time":"${new Date().toISOString()}"}\n\n`);
    }, 15000);

    req.on('close', () => {
      clearInterval(pingInterval);
      telemetry.removeListener('telemetry_event', onEvent);
    });
  });

  return router;
}

function createTelemetryMiddleware(telemetry) {
  return function telemetryMiddleware(req, res, next) {
    if (!telemetry) return next();
    const start = Date.now();
    const reqId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    req.telemetryId = reqId;

    telemetry.recordRequestStart(reqId, req.method, req.path);

    res.on('finish', () => {
      const durationMs = Date.now() - start;
      const model = req.body?.model || req.selectedModel || 'unknown';
      const tokens = res.usageTokens || null;
      telemetry.recordRequestEnd(reqId, {
        statusCode: res.statusCode,
        durationMs,
        model,
        tokens
      });
    });

    next();
  };
}

module.exports = {
  createTelemetryRouter,
  createTelemetryMiddleware
};
