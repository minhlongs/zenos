'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createApp } = require('../src/app');

describe('Messages Non-Streaming Contract', () => {
  let mockUpstream, mockUpstreamPort, mockUpstreamUrl;
  let proxyServer, proxyPort;
  let lastUpstreamRequestBody = null;

  before(async () => {
    mockUpstream = http.createServer((req, res) => {
      let data = '';
      req.on('data', chunk => { data += chunk; });
      req.on('end', () => {
        if (req.url === '/v1/chat/completions' && req.method === 'POST') {
          try {
            lastUpstreamRequestBody = JSON.parse(data);
          } catch {
            lastUpstreamRequestBody = null;
          }

          if (lastUpstreamRequestBody?.model === 'error-trigger') {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: { message: 'Internal LM Studio GPU failure with key sk-ant-secret12345' } }));
            return;
          }

          if (lastUpstreamRequestBody?.tools) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              id: 'chatcmpl-tools-1',
              model: 'qwen2.5-coder',
              choices: [{
                message: {
                  role: 'assistant',
                  content: null,
                  tool_calls: [{
                    id: 'call_abc',
                    type: 'function',
                    function: { name: 'calculator', arguments: '{"expr":"2+2"}' }
                  }]
                },
                finish_reason: 'tool_calls'
              }],
              usage: { prompt_tokens: 20, completion_tokens: 10 }
            }));
            return;
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            id: 'chatcmpl-normal-1',
            model: 'qwen2.5-coder',
            choices: [{
              message: { role: 'assistant', content: 'ZenOS response' },
              finish_reason: 'stop'
            }],
            usage: { prompt_tokens: 12, completion_tokens: 4 }
          }));
          return;
        }
        res.writeHead(404);
        res.end();
      });
    });

    await new Promise(r => mockUpstream.listen(0, '127.0.0.1', () => {
      mockUpstreamPort = mockUpstream.address().port;
      mockUpstreamUrl = `http://127.0.0.1:${mockUpstreamPort}`;
      r();
    }));

    const app = createApp({ upstreamUrl: mockUpstreamUrl, bodyLimit: '10kb' });
    proxyServer = http.createServer(app);
    await new Promise(r => proxyServer.listen(0, '127.0.0.1', () => {
      proxyPort = proxyServer.address().port;
      r();
    }));
  });

  after(async () => {
    if (proxyServer) await new Promise(r => proxyServer.close(r));
    if (mockUpstream) await new Promise(r => mockUpstream.close(r));
  });

  it('translates standard Anthropic messages request and response envelope', async () => {
    const res = await fetch(`http://127.0.0.1:${proxyPort}/v1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5-coder',
        max_tokens: 100,
        messages: [{ role: 'user', content: 'Hello' }]
      })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.type, 'message');
    assert.equal(body.role, 'assistant');
    assert.deepEqual(body.content, [{ type: 'text', text: 'ZenOS response' }]);
    assert.equal(body.stop_reason, 'end_turn');
    assert.deepEqual(body.usage, { input_tokens: 12, output_tokens: 4 });
  });

  it('translates tool definitions and receives tool_use content blocks', async () => {
    const res = await fetch(`http://127.0.0.1:${proxyPort}/v1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5-coder',
        messages: [{ role: 'user', content: 'Calculate 2+2' }],
        tools: [{
          name: 'calculator',
          description: 'Calculates math',
          input_schema: { type: 'object', properties: { expr: { type: 'string' } } }
        }]
      })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.stop_reason, 'tool_use');
    assert.equal(body.content[0].type, 'tool_use');
    assert.equal(body.content[0].name, 'calculator');
    assert.deepEqual(body.content[0].input, { expr: '2+2' });
  });

  it('returns 400 invalid_request_error on missing required fields', async () => {
    const res = await fetch(`http://127.0.0.1:${proxyPort}/v1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hi' }] })
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.type, 'invalid_request_error');
    assert.match(body.error.message, /Missing required field: model/);
  });

  it('returns 400 invalid_request_error on unsupported block type', async () => {
    const res = await fetch(`http://127.0.0.1:${proxyPort}/v1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5-coder',
        messages: [{ role: 'user', content: [{ type: 'audio_blob_unsupported' }] }]
      })
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error.message, /Unsupported content block type/);
  });

  it('redacts secrets in upstream error messages', async () => {
    const res = await fetch(`http://127.0.0.1:${proxyPort}/v1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'error-trigger',
        messages: [{ role: 'user', content: 'Test' }]
      })
    });
    assert.equal(res.status, 502);
    const body = await res.json();
    assert.doesNotMatch(body.error.message, /sk-ant-secret12345/);
    assert.match(body.error.message, /\[REDACTED_API_KEY\]/);
  });

  it('returns 413 request_too_large when payload exceeds body limit', async () => {
    const hugeStr = 'A'.repeat(15000);
    const res = await fetch(`http://127.0.0.1:${proxyPort}/v1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5-coder',
        messages: [{ role: 'user', content: hugeStr }]
      })
    });
    assert.equal(res.status, 413);
    const body = await res.json();
    assert.equal(body.error.type, 'request_too_large');
  });

  it('returns 404 not_found_error for unknown route', async () => {
    const res = await fetch(`http://127.0.0.1:${proxyPort}/unknown/path`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error.type, 'not_found_error');
  });
});
