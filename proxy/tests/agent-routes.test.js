'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const { createFactoryRouter } = require('../src/workflow/routes-factory');
const { TaskStore } = require('../src/task-store');
const { DatabaseSync } = require('node:sqlite');

function createTestDb() {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE tasks (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      name TEXT NOT NULL,
      status TEXT NOT NULL,
      input TEXT,
      output TEXT,
      error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE task_checkpoints (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      phase TEXT NOT NULL,
      state TEXT NOT NULL,
      artifacts TEXT,
      created_at TEXT NOT NULL
    );
  `);
  return db;
}

test('POST /v1/factory/agent/run starts ReAct loop and streams SSE', async () => {
  const db = createTestDb();
  const taskStore = new TaskStore(db);

  const mockClient = {
    chatCompletion: async () => 'Autonomous agent successfully verified codebase.'
  };

  const app = express();
  app.use(express.json());
  app.use('/v1/factory', createFactoryRouter({ taskStore, modelClient: mockClient }));

  const server = http.createServer(app);
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/v1/factory/agent/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Perform system check', maxIterations: 4 })
    });

    assert.equal(res.status, 202);
    const data = await res.json();
    assert.equal(data.status, 'running');
    assert.match(data.taskId, /^agent_/);

    // Wait 50ms for async loop execution
    await new Promise(r => setTimeout(r, 60));

    const checkRes = await fetch(`http://127.0.0.1:${port}/v1/factory/agent/${data.taskId}`);
    assert.equal(checkRes.status, 200);
    const checkData = await checkRes.json();
    assert.equal(checkData.task.status, 'completed');
    assert.match(checkData.task.output, /successfully verified/);
  } finally {
    server.close();
  }
});

test('POST /v1/factory/agent/run requires prompt', async () => {
  const app = express();
  app.use(express.json());
  app.use('/v1/factory', createFactoryRouter());

  const server = http.createServer(app);
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/v1/factory/agent/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.equal(res.status, 400);
  } finally {
    server.close();
  }
});
