'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createApp } = require('../src/app');

describe('Streaming SSE Contract', () => {
  let mockUpstream, mockUpstreamPort, mockUpstreamUrl;
  let proxyServer, proxyPort;

  before(async () => {
    mockUpstream = http.createServer((req, res) => {
      if (req.url === '/v1/chat/completions' && req.method === 'POST') {
        let bodyStr = '';
        req.on('data', c => { bodyStr += c; });
        req.on('end', () => {
          const body = JSON.parse(bodyStr);

          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          });

          if (body.model === 'stream-tool') {
            res.write(`data: ${JSON.stringify({
              choices: [{ delta: { tool_calls: [{ index: 0, id: 'call_stream_1', function: { name: 'calculator', arguments: '' } }] } }]
            })}\n\n`);
            res.write(`data: ${JSON.stringify({
              choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: '{"expr":"' } }] } }]
            })}\n\n`);
            res.write(`data: ${JSON.stringify({
              choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: '1+1"}' } }] }, finish_reason: 'tool_calls' }]
            })}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
            return;
          }

          // Text stream
          res.write(`data: ${JSON.stringify({
            choices: [{ delta: { content: 'Hello' } }]
          })}\n\n`);
          res.write(`data: ${JSON.stringify({
            choices: [{ delta: { content: ' world!' } }],
            finish_reason: 'stop'
          })}\n\n`);
          res.write('data: [DONE]\n\n');
          res.end();
        });
        return;
      }
      res.writeHead(404);
      res.end();
    });

    await new Promise(r => mockUpstream.listen(0, '127.0.0.1', () => {
      mockUpstreamPort = mockUpstream.address().port;
      mockUpstreamUrl = `http://127.0.0.1:${mockUpstreamPort}`;
      r();
    }));

    const app = createApp({ upstreamUrl: mockUpstreamUrl });
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

  it('streams standard text events in exact Anthropic SSE order', async () => {
    const res = await fetch(`http://127.0.0.1:${proxyPort}/v1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5-coder',
        stream: true,
        messages: [{ role: 'user', content: 'Say hello' }]
      })
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'text/event-stream');

    const text = await res.text();
    const eventLines = text.split('\n').filter(l => l.startsWith('event: ')).map(l => l.slice(7));
    assert.deepEqual(eventLines, [
      'message_start',
      'content_block_start',
      'content_block_delta',
      'content_block_delta',
      'content_block_stop',
      'message_delta',
      'message_stop'
    ]);
  });

  it('streams tool-use calls and input_json_delta', async () => {
    const res = await fetch(`http://127.0.0.1:${proxyPort}/v1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'stream-tool',
        stream: true,
        messages: [{ role: 'user', content: 'Run calculator' }]
      })
    });
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.match(text, /"type":"tool_use"/);
    assert.match(text, /"type":"input_json_delta"/);
    assert.match(text, /"stop_reason":"tool_use"/);
  });
});
