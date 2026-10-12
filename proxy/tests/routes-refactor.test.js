// proxy/tests/routes-refactor.test.js - Unit tests for Refactor routes
const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createRefactorRouter } = require('../src/workflow/routes-refactor.js');

function createTestServer(router) {
  const app = express();
  app.use(express.json());
  app.use('/refactor', router);
  const server = http.createServer(app);
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({
        port,
        close: () => new Promise((res) => server.close(res)),
        url: `http://127.0.0.1:${port}/refactor`
      });
    });
  });
}

test('POST /refactor/analyze scans directory complexity', async () => {
  const router = createRefactorRouter();
  const server = await createTestServer(router);

  const res = await fetch(`${server.url}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: path.join(__dirname, '../src/workflow') })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.summary);
  assert.ok(data.summary.totalFiles > 0);
  assert.ok(Array.isArray(data.files));

  await server.close();
});

test('POST /refactor/plan generates decomposition plan', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'routes-refactor-'));
  const testFile = path.join(tempDir, 'sample-mod.js');
  fs.writeFileSync(testFile, 'function a() { return 1; }\nfunction b() { return 2; }\nmodule.exports = { a, b };\n');

  const router = createRefactorRouter();
  const server = await createTestServer(router);

  const res = await fetch(`${server.url}/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath: testFile })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.targetFile, testFile);
  assert.equal(data.plan.newFiles.length, 2);

  await server.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
});
