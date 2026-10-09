'use strict';
const { EventEmitter } = require('node:events');

class TelemetryCollector extends EventEmitter {
  constructor(options = {}) {
    super();
    this.maxEvents = options.maxEvents || 50;
    this.maxLatencySamples = options.maxLatencySamples || 1000;
    this.reset();
  }

  reset() {
    this.startTime = Date.now();
    this.totalRequests = 0;
    this.activeRequests = 0;
    this.statusCodes = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0, other: 0 };
    this.latencies = [];
    this.models = new Map();
    this.recentEvents = [];
  }

  recordRequestStart(reqId, method, path) {
    this.activeRequests++;
    const event = {
      type: 'request_start',
      id: reqId,
      method,
      path,
      timestamp: new Date().toISOString()
    };
    this._addEvent(event);
    this.emit('telemetry_event', event);
    return event;
  }

  recordRequestEnd(reqId, { statusCode = 200, durationMs = 0, model = 'unknown', tokens = null, error = null }) {
    if (this.activeRequests > 0) this.activeRequests--;
    this.totalRequests++;

    const cat = `${Math.floor(statusCode / 100)}xx`;
    if (this.statusCodes[cat] !== undefined) {
      this.statusCodes[cat]++;
    } else {
      this.statusCodes.other++;
    }

    if (durationMs >= 0) {
      this.latencies.push(durationMs);
      if (this.latencies.length > this.maxLatencySamples) {
        this.latencies.shift();
      }
    }

    if (model) {
      const stats = this.models.get(model) || {
        requests: 0,
        errors: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      };
      stats.requests++;
      if (statusCode >= 400 || error) stats.errors++;
      if (tokens) {
        stats.promptTokens += (tokens.prompt || 0);
        stats.completionTokens += (tokens.completion || 0);
        stats.totalTokens += (tokens.total || (tokens.prompt || 0) + (tokens.completion || 0));
      }
      this.models.set(model, stats);
    }

    const event = {
      type: 'request_end',
      id: reqId,
      statusCode,
      durationMs,
      model,
      tokens,
      error: error ? String(error) : null,
      timestamp: new Date().toISOString()
    };
    this._addEvent(event);
    this.emit('telemetry_event', event);
    return event;
  }

  _addEvent(event) {
    this.recentEvents.push(event);
    if (this.recentEvents.length > this.maxEvents) {
      this.recentEvents.shift();
    }
  }

  getRecentEvents(limit = 20) {
    return this.recentEvents.slice(-limit).reverse();
  }

  _computePercentile(sorted, p) {
    if (sorted.length === 0) return 0;
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }

  getSummary() {
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, v) => acc + v, 0);
    const total = this.totalRequests;
    const errors = this.statusCodes['4xx'] + this.statusCodes['5xx'];

    const latency = {
      min: sorted.length ? sorted[0] : 0,
      max: sorted.length ? sorted[sorted.length - 1] : 0,
      avg: sorted.length ? Math.round(sum / sorted.length) : 0,
      p50: this._computePercentile(sorted, 50),
      p95: this._computePercentile(sorted, 95),
      p99: this._computePercentile(sorted, 99)
    };

    const modelsObj = {};
    for (const [k, v] of this.models.entries()) {
      modelsObj[k] = { ...v };
    }

    return {
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      totalRequests: this.totalRequests,
      activeRequests: this.activeRequests,
      statusCodes: { ...this.statusCodes },
      errorRate: total > 0 ? (errors / total) : 0,
      latency,
      models: modelsObj
    };
  }
}

module.exports = { TelemetryCollector };
