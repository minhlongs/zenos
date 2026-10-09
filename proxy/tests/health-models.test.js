'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createApp } = require('../src/app');

describe('Health and Models Contract', () => {
  let mockUpstream;
  let mockUpstreamPort;
  let mockUpstreamUrl;
  let proxyServer;
  let proxyPort;

  before(async () => {
    // 1. Start mock LM Studio upstream
    mockUpstream = http.createServer((req, res) => {
      if (req.url === '/v1/models' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          data: [
            { id: 'qwen2.5-coder-7b', object: 'model', created: 1718000000, owned_by: 'local' },
            { id: 'deepseek-coder-6.7b', object: 'model', created: 1718000001, owned_by: 'local' }
          ]
        }));
        return;
      }
      res.writeHead(404);
      res.end('Not found');
    });

    await new Promise(resolve => mockUpstream.listen(0, '127.0.0.1', () => {
      mockUpstreamPort = mockUpstream.address().port;
      mockUpstreamUrl = `http://127.0.0.1:${mockUpstreamPort}`;
      resolve();
    }));

    // 2. Start proxy server using mock upstream
    const app = createApp({ upstreamUrl: mockUpstreamUrl });
    proxyServer = http.createServer(app);
    await new Promise(resolve => proxyServer.listen(0, '127.0.0.1', () => {
      proxyPort = proxyServer.address().port;
      resolve();
    }));
  });

  after(async () => {
    if (proxyServer) await new Promise(r => proxyServer.close(r));
    if (mockUpstream) await new Promise(r => mockUpstream.close(r));
  });

  it('GET /health returns 200 with status ok and no secrets', async () => {
    const res = await fetch(`http://127.0.0.1:${proxyPort}/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.equal(typeof body.uptime, 'number');
    assert.equal(typeof body.timestamp, 'string');
    // Ensure no secrets leaked
    assert.equal(body.apiKey, undefined);
    assert.equal(body.secret, undefined);
    assert.equal(body.authorization, undefined);
  });

  it('GET /v1/models retrieves and formats models into Anthropic format', async () => {
    const res = await fetch(`http://127.0.0.1:${proxyPort}/v1/models`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(Array.isArray(body.data), true);
    assert.equal(body.data.length, 2);
    assert.equal(body.data[0].id, 'qwen2.5-coder-7b');
    assert.equal(body.data[0].type, 'model');
    assert.equal(body.data[0].display_name, 'qwen2.5-coder-7b');
    assert.equal(body.has_more, false);
  });

  it('GET /v1/models returns safe error envelope if upstream is unreachable', async () => {
    const brokenApp = createApp({ upstreamUrl: 'http://127.0.0.1:59999' });
    const brokenServer = http.createServer(brokenApp);
    await new Promise(r => brokenServer.listen(0, '127.0.0.1', r));
    const port = brokenServer.address().port;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/v1/models`);
      assert.equal(res.status, 502);
      const body = await res.json();
      assert.equal(body.type, 'error');
      assert.equal(body.error.type, 'api_error');
      assert.match(body.error.message, /Failed to connect to upstream/);
    } finally {
      await new Promise(r => brokenServer.close(r));
    }
  });
});
