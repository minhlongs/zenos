'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  executeWithFailover,
  AllUpstreamsFailedError,
  parseUpstreamEndpoints
} = require('../src/failover');

describe('Upstream Failover & High Availability', () => {
  describe('parseUpstreamEndpoints', () => {
    it('parses valid loopback endpoints array or csv', () => {
      const endpoints = 'http://127.0.0.1:1234, http://localhost:11434';
      const parsed = parseUpstreamEndpoints(endpoints);
      assert.deepEqual(parsed, ['http://127.0.0.1:1234', 'http://localhost:11434']);
    });

    it('rejects external non-loopback endpoints (SSRF protection)', () => {
      assert.throws(
        () => parseUpstreamEndpoints('http://example.com:1234'),
        /loopback/i
      );
    });

    it('defaults to primary LMSTUDIO_URL if empty', () => {
      const parsed = parseUpstreamEndpoints('', 'http://127.0.0.1:1234');
      assert.deepEqual(parsed, ['http://127.0.0.1:1234']);
    });
  });

  describe('executeWithFailover', () => {
    const upstreams = ['http://127.0.0.1:1234', 'http://127.0.0.1:11434'];

    it('returns primary result when primary succeeds', async () => {
      const attempts = [];
      const requestFn = async (url) => {
        attempts.push(url);
        return { ok: true, url, data: 'primary-ok' };
      };

      const result = await executeWithFailover(upstreams, requestFn);
      assert.equal(result.data, 'primary-ok');
      assert.deepEqual(attempts, ['http://127.0.0.1:1234']);
    });

    it('fails over to secondary when primary throws ECONNREFUSED', async () => {
      const attempts = [];
      const requestFn = async (url) => {
        attempts.push(url);
        if (url === 'http://127.0.0.1:1234') {
          const err = new Error('connect ECONNREFUSED 127.0.0.1:1234');
          err.code = 'ECONNREFUSED';
          throw err;
        }
        return { ok: true, url, data: 'secondary-ok' };
      };

      const result = await executeWithFailover(upstreams, requestFn);
      assert.equal(result.data, 'secondary-ok');
      assert.deepEqual(attempts, ['http://127.0.0.1:1234', 'http://127.0.0.1:11434']);
    });

    it('fails over to secondary when primary returns 502/503/504 error', async () => {
      const attempts = [];
      const requestFn = async (url) => {
        attempts.push(url);
        if (url === 'http://127.0.0.1:1234') {
          const err = new Error('Bad Gateway');
          err.status = 502;
          throw err;
        }
        return { ok: true, url, data: 'secondary-recovered' };
      };

      const result = await executeWithFailover(upstreams, requestFn);
      assert.equal(result.data, 'secondary-recovered');
      assert.deepEqual(attempts, ['http://127.0.0.1:1234', 'http://127.0.0.1:11434']);
    });

    it('does NOT fail over on non-retryable 4xx client errors', async () => {
      const attempts = [];
      const requestFn = async (url) => {
        attempts.push(url);
        const err = new Error('Bad Request: invalid prompt');
        err.status = 400;
        throw err;
      };

      await assert.rejects(
        () => executeWithFailover(upstreams, requestFn),
        (err) => {
          assert.equal(err.status, 400);
          return true;
        }
      );
      assert.deepEqual(attempts, ['http://127.0.0.1:1234']);
    });

    it('throws AllUpstreamsFailedError when all upstreams fail', async () => {
      const requestFn = async (url) => {
        const err = new Error(`Connection error on ${url}`);
        err.code = 'ECONNREFUSED';
        throw err;
      };

      await assert.rejects(
        () => executeWithFailover(upstreams, requestFn),
        AllUpstreamsFailedError
      );
    });
  });
});
