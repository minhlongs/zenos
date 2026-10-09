'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { TelemetryCollector } = require('../src/telemetry');

describe('TelemetryCollector Engine (Gate 5)', () => {
  it('initializes with zeroed counters and records request start/end', () => {
    const collector = new TelemetryCollector();
    const summary0 = collector.getSummary();
    assert.equal(summary0.totalRequests, 0);
    assert.equal(summary0.activeRequests, 0);

    collector.recordRequestStart('req_1', 'POST', '/v1/messages');
    assert.equal(collector.getSummary().activeRequests, 1);

    collector.recordRequestEnd('req_1', {
      statusCode: 200,
      durationMs: 45,
      model: 'claude-3-5-sonnet',
      tokens: { prompt: 10, completion: 20 }
    });

    const summary1 = collector.getSummary();
    assert.equal(summary1.totalRequests, 1);
    assert.equal(summary1.activeRequests, 0);
    assert.equal(summary1.statusCodes['2xx'], 1);
    assert.equal(summary1.latency.min, 45);
    assert.equal(summary1.latency.max, 45);
    assert.equal(summary1.latency.avg, 45);
    assert.equal(summary1.latency.p50, 45);
  });

  it('calculates latency percentiles correctly (p50, p95, p99)', () => {
    const collector = new TelemetryCollector();
    const latencies = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    latencies.forEach((ms, idx) => {
      const id = `req_${idx}`;
      collector.recordRequestStart(id, 'POST', '/v1/messages');
      collector.recordRequestEnd(id, { statusCode: 200, durationMs: ms });
    });

    const summary = collector.getSummary();
    assert.equal(summary.totalRequests, 10);
    assert.equal(summary.latency.min, 10);
    assert.equal(summary.latency.max, 100);
    assert.equal(summary.latency.avg, 55);
    assert.equal(summary.latency.p50, 50);
    assert.ok(summary.latency.p95 >= 90);
    assert.ok(summary.latency.p99 >= 90);
  });

  it('tracks error rates and categorization', () => {
    const collector = new TelemetryCollector();
    collector.recordRequestEnd('req_1', { statusCode: 200, durationMs: 15 });
    collector.recordRequestEnd('req_2', { statusCode: 400, durationMs: 20 });
    collector.recordRequestEnd('req_3', { statusCode: 502, durationMs: 50 });

    const summary = collector.getSummary();
    assert.equal(summary.totalRequests, 3);
    assert.equal(summary.statusCodes['2xx'], 1);
    assert.equal(summary.statusCodes['4xx'], 1);
    assert.equal(summary.statusCodes['5xx'], 1);
    assert.equal(Math.round(summary.errorRate * 100), 67);
  });

  it('tracks model token and request usage breakdown', () => {
    const collector = new TelemetryCollector();
    collector.recordRequestEnd('req_1', {
      statusCode: 200,
      durationMs: 30,
      model: 'qwen2.5-coder',
      tokens: { prompt: 100, completion: 50 }
    });
    collector.recordRequestEnd('req_2', {
      statusCode: 500,
      durationMs: 40,
      model: 'qwen2.5-coder',
      error: 'Upstream timeout'
    });

    const summary = collector.getSummary();
    const modelStats = summary.models['qwen2.5-coder'];
    assert.ok(modelStats);
    assert.equal(modelStats.requests, 2);
    assert.equal(modelStats.errors, 1);
    assert.equal(modelStats.promptTokens, 100);
    assert.equal(modelStats.completionTokens, 50);
    assert.equal(modelStats.totalTokens, 150);
  });

  it('emits real-time events and maintains rolling event buffer', () => {
    const collector = new TelemetryCollector({ maxEvents: 5 });
    const events = [];
    collector.on('telemetry_event', (evt) => events.push(evt));

    collector.recordRequestStart('req_a', 'GET', '/health');
    collector.recordRequestEnd('req_a', { statusCode: 200, durationMs: 5 });

    assert.equal(events.length, 2);
    assert.equal(events[0].type, 'request_start');
    assert.equal(events[1].type, 'request_end');

    const recent = collector.getRecentEvents();
    assert.equal(recent.length, 2);
  });
});
