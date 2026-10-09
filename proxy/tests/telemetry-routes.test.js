'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const { TelemetryCollector } = require('../src/telemetry');
const { createTelemetryRouter } = require('../src/routes-telemetry');

describe('Telemetry REST & SSE Routes (Gate 5)', () => {
  it('GET /v1/telemetry returns summary and recent events', async () => {
    const collector = new TelemetryCollector();
    collector.recordRequestStart('req_test_1', 'POST', '/v1/messages');
    collector.recordRequestEnd('req_test_1', {
      statusCode: 200,
      durationMs: 35,
      model: 'qwen2.5-coder'
    });

    const app = express();
    app.use(express.json());
    app.use('/v1', createTelemetryRouter({ telemetry: collector }));

    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/v1/telemetry`);
      assert.equal(res.status, 200);
      const data = await res.json();

      assert.equal(data.totalRequests, 1);
      assert.equal(data.latency.p50, 35);
      assert.ok(Array.isArray(data.recentEvents));
      assert.equal(data.recentEvents.length, 2);
    } finally {
      server.close();
    }
  });

  it('GET /v1/telemetry/events streams initial snapshot and real-time events over SSE', async () => {
    const collector = new TelemetryCollector();
    const app = express();
    app.use('/v1', createTelemetryRouter({ telemetry: collector }));

    const server = http.createServer(app);
    await new Promise(r => server.listen(0, r));
    const port = server.address().port;

    try {
      const controller = new AbortController();
      const res = await fetch(`http://127.0.0.1:${port}/v1/telemetry/events`, {
        signal: controller.signal
      });

      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'text/event-stream');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      // Read initial connection event
      const { value: chunk1 } = await reader.read();
      const text1 = decoder.decode(chunk1);
      assert.ok(text1.includes('event: init'));

      // Emit new telemetry event while client is connected
      collector.recordRequestEnd('req_stream_1', {
        statusCode: 200,
        durationMs: 42,
        model: 'test-model'
      });

      const { value: chunk2 } = await reader.read();
      const text2 = decoder.decode(chunk2);
      assert.ok(text2.includes('event: telemetry'));
      assert.ok(text2.includes('req_stream_1'));

      controller.abort();
    } finally {
      server.close();
    }
  });
});
