'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createApp } = require('../src/app');

describe('Proxy State & Memory Routes (/v1/sessions, /v1/tasks, /v1/memory)', () => {
  let proxyServer;
  let proxyPort;
  let tmpDir;

  before(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zenos-proxy-mem-'));
    const app = createApp({
      memoryDb: true,
      markdownDir: path.join(tmpDir, 'markdown')
    });
    proxyServer = http.createServer(app);
    await new Promise(r => proxyServer.listen(0, '127.0.0.1', r));
    proxyPort = proxyServer.address().port;
  });

  after(async () => {
    if (proxyServer) await new Promise(r => proxyServer.close(r));
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('POST & GET /v1/sessions creates and lists sessions', async () => {
    const postRes = await fetch(`http://127.0.0.1:${proxyPort}/v1/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test Session', model: 'local-qwen' })
    });
    assert.equal(postRes.status, 201);
    const created = await postRes.json();
    assert.equal(created.title, 'Test Session');
    assert.ok(created.id);

    const getRes = await fetch(`http://127.0.0.1:${proxyPort}/v1/sessions`);
    assert.equal(getRes.status, 200);
    const list = await getRes.json();
    assert.ok(Array.isArray(list));
    assert.ok(list.some(s => s.id === created.id));
  });

  it('POST & PATCH /v1/tasks manages task state', async () => {
    const postRes = await fetch(`http://127.0.0.1:${proxyPort}/v1/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Compile Proxy' })
    });
    assert.equal(postRes.status, 201);
    const task = await postRes.json();
    assert.equal(task.name, 'Compile Proxy');
    assert.equal(task.status, 'pending');

    const patchRes = await fetch(`http://127.0.0.1:${proxyPort}/v1/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed', output: { success: true } })
    });
    assert.equal(patchRes.status, 200);
    const updated = await patchRes.json();
    assert.equal(updated.status, 'completed');
  });

  it('POST & GET /v1/memory stores and retrieves episodic markdown memories', async () => {
    const postRes = await fetch(`http://127.0.0.1:${proxyPort}/v1/memory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'user-preference',
        description: 'Preferred tool',
        content: 'Prefers native node tools'
      })
    });
    assert.equal(postRes.status, 201);

    const getRes = await fetch(`http://127.0.0.1:${proxyPort}/v1/memory`);
    assert.equal(getRes.status, 200);
    const memories = await getRes.json();
    assert.ok(Array.isArray(memories));
    assert.ok(memories.some(m => m.name === 'user-preference'));
  });
});
