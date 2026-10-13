// proxy/tests/routes-worktree.test.js - Unit & Integration Tests for Worktree Routes & PR Stager
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const express = require('express');
const http = require('node:http');
const { execFileSync } = require('node:child_process');
const { createWorktreeRouter } = require('../src/workflow/routes-worktree');
const { WorktreeJail } = require('../src/workflow/worktree-jail');
const { BlastRadiusEngine } = require('../src/workflow/blast-radius-engine');
const { PrStager } = require('../src/workflow/pr-stager');

function makeRequest(app, method, urlPath, body = null) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      const payload = body ? JSON.stringify(body) : null;
      const req = http.request({
        hostname: '127.0.0.1',
        port,
        path: urlPath,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          server.close();
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      });
      req.on('error', (err) => {
        server.close();
        reject(err);
      });
      if (payload) req.write(payload);
      req.end();
    });
  });
}

test('Worktree routes handle list, create, blast-radius, stage-pr, and delete', async (t) => {
  const tmpRepo = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'zenos-route-test-')));
  execFileSync('git', ['init', '-b', 'main'], { cwd: tmpRepo });
  execFileSync('git', ['config', 'user.name', 'ZenOS Tester'], { cwd: tmpRepo });
  execFileSync('git', ['config', 'user.email', 'test@zenos.local'], { cwd: tmpRepo });
  fs.writeFileSync(path.join(tmpRepo, 'index.js'), 'console.log("main");\n', 'utf-8');
  execFileSync('git', ['add', '.'], { cwd: tmpRepo });
  execFileSync('git', ['commit', '-m', 'Initial commit'], { cwd: tmpRepo });

  const jail = new WorktreeJail({ workspaceRoot: tmpRepo });
  const blastEngine = new BlastRadiusEngine({ rootDir: tmpRepo });
  const prStager = new PrStager({ workspaceRoot: tmpRepo, blastRadiusEngine: blastEngine });

  const app = express();
  app.use(express.json());
  app.use('/v1/factory/worktree', createWorktreeRouter({
    workspaceRoot: tmpRepo,
    worktreeJail: jail,
    blastRadiusEngine: blastEngine,
    prStager
  }));

  await t.test('GET /list returns active worktrees', async () => {
    const res = await makeRequest(app, 'GET', '/v1/factory/worktree/list');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.worktrees));
    assert.strictEqual(res.body.worktrees.length, 1);
  });

  await t.test('POST /create spawns new ephemeral worktree', async () => {
    const res = await makeRequest(app, 'POST', '/v1/factory/worktree/create', { id: 'test-agent' });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.worktree.id, 'test-agent');
    assert.ok(fs.existsSync(res.body.worktree.path));
  });

  await t.test('POST /blast-radius computes file metrics', async () => {
    const res = await makeRequest(app, 'POST', '/v1/factory/worktree/blast-radius', { targetPath: 'index.js' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.target, 'index.js');
    assert.strictEqual(res.body.riskLevel, 'SAFE');
  });

  await t.test('POST /stage-pr validates consensus and diff', async () => {
    const wtPath = path.join(tmpRepo, '.zenos', 'worktrees', 'test-agent');
    fs.writeFileSync(path.join(wtPath, 'feature.js'), 'module.exports = { feature: true };\n');
    execFileSync('git', ['add', '.'], { cwd: wtPath });
    execFileSync('git', ['commit', '-m', 'feat(core): add feature'], { cwd: wtPath });

    const res = await makeRequest(app, 'POST', '/v1/factory/worktree/stage-pr', {
      worktreePath: wtPath,
      type: 'feat',
      scope: 'core',
      subject: 'add feature'
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.approved, true);
    assert.strictEqual(res.body.consensus.status, 'APPROVED');
    assert.strictEqual(res.body.diffSummary.changedFilesCount, 1);
  });

  await t.test('DELETE /:id cleans up worktree', async () => {
    const res = await makeRequest(app, 'DELETE', '/v1/factory/worktree/test-agent');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
  });

  t.after(() => {
    try {
      fs.rmSync(tmpRepo, { recursive: true, force: true });
    } catch {}
  });
});
