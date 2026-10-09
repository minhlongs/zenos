'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createApp } = require('../src/app');
const { validateUpstreamUrl } = require('../src/config');
const { redactSecrets } = require('../src/security');

function makeRawHttpRequest({ port, path, headers }) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path,
      method: 'GET',
      headers
    }, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data ? JSON.parse(data) : null
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

describe('Security & Protection Controls', () => {
  let proxyServer, proxyPort;

  before(async () => {
    const app = createApp({ upstreamUrl: 'http://127.0.0.1:1234' });
    proxyServer = http.createServer(app);
    await new Promise(r => proxyServer.listen(0, '127.0.0.1', () => {
      proxyPort = proxyServer.address().port;
      r();
    }));
  });

  after(async () => {
    if (proxyServer) await new Promise(r => proxyServer.close(r));
  });

  it('binds exclusively to loopback interface 127.0.0.1', () => {
    const addr = proxyServer.address();
    assert.equal(addr.address, '127.0.0.1');
    assert.notEqual(addr.address, '0.0.0.0');
  });

  it('blocks DNS rebinding attacks via spoofed Host headers', async () => {
    const res = await makeRawHttpRequest({
      port: proxyPort,
      path: '/health',
      headers: { Host: 'attacker.controlled.domain.com' }
    });
    assert.equal(res.status, 403);
    assert.equal(res.body.error.type, 'forbidden_error');
    assert.match(res.body.error.message, /Request host is not authorized/);
  });

  it('permits authorized loopback Host headers (localhost and 127.0.0.1)', async () => {
    const res1 = await makeRawHttpRequest({
      port: proxyPort,
      path: '/health',
      headers: { Host: `127.0.0.1:${proxyPort}` }
    });
    assert.equal(res1.status, 200);

    const res2 = await makeRawHttpRequest({
      port: proxyPort,
      path: '/health',
      headers: { Host: `localhost:${proxyPort}` }
    });
    assert.equal(res2.status, 200);
  });

  it('rejects CORS preflight from malicious external origins', async () => {
    const res = await fetch(`http://127.0.0.1:${proxyPort}/v1/messages`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://evil-hacker.com',
        'Access-Control-Request-Method': 'POST'
      }
    });
    const allowOrigin = res.headers.get('access-control-allow-origin');
    assert.notEqual(allowOrigin, 'https://evil-hacker.com');
  });

  it('validates and rejects non-loopback upstream URLs', () => {
    assert.throws(() => validateUpstreamUrl('http://192.168.1.100:1234'), /Upstream URL must target loopback/);
    assert.throws(() => validateUpstreamUrl('http://external-cloud.com/api'), /Upstream URL must target loopback/);
    assert.throws(() => validateUpstreamUrl('ftp://127.0.0.1:1234'), /Invalid upstream protocol/);
    assert.equal(validateUpstreamUrl('http://127.0.0.1:1234'), 'http://127.0.0.1:1234');
    assert.equal(validateUpstreamUrl('http://localhost:1234'), 'http://localhost:1234');
  });

  it('redacts API keys and tokens from strings and error output', () => {
    const sensitive = 'Error calling model: sk-ant-api03-abcdefghijklmnop123456789 with Bearer eyJhbGciOiJIUzI1NiJ9';
    const clean = redactSecrets(sensitive);
    assert.doesNotMatch(clean, /sk-ant-api03/);
    assert.doesNotMatch(clean, /eyJhbGciOiJIUzI1NiJ9/);
    assert.match(clean, /\[REDACTED_API_KEY\]/);
    assert.match(clean, /\[REDACTED_TOKEN\]/);
  });
});
