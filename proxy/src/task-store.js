'use strict';

const crypto = require('node:crypto');

const VALID_STATUSES = new Set(['pending', 'running', 'completed', 'failed', 'interrupted', 'cancelled']);

class TaskStore {
  constructor(db) {
    this.db = db;
  }

  createSession({ id, title, model, metadata = {} }) {
    const sessionId = id || `sess_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const metaStr = typeof metadata === 'string' ? metadata : JSON.stringify(metadata);

    this.db.prepare(
      'INSERT INTO sessions (id, title, model, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(sessionId, title || 'Untitled Session', model || null, metaStr, now, now);

    return this.getSession(sessionId);
  }

  getSession(id) {
    const row = this.db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
    if (!row) return null;
    return {
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : {}
    };
  }

  listSessions(limit = 50) {
    const rows = this.db.prepare('SELECT * FROM sessions ORDER BY updated_at DESC LIMIT ?').all(limit);
    return rows.map(r => ({ ...r, metadata: r.metadata ? JSON.parse(r.metadata) : {} }));
  }

  createTask({ id, sessionId, name, input }) {
    const taskId = id || `task_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const inputStr = input ? (typeof input === 'string' ? input : JSON.stringify(input)) : null;

    this.db.prepare(
      'INSERT INTO tasks (id, session_id, name, status, input, output, error, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, ?)'
    ).run(taskId, sessionId || null, name, 'pending', inputStr, now, now);

    return this.getTask(taskId);
  }

  getTask(id) {
    const row = this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    return row || null;
  }

  listTasks(sessionId = null, limit = 50) {
    if (sessionId) {
      return this.db.prepare('SELECT * FROM tasks WHERE session_id = ? ORDER BY created_at DESC LIMIT ?').all(sessionId, limit);
    }
    return this.db.prepare('SELECT * FROM tasks ORDER BY created_at DESC LIMIT ?').all(limit);
  }

  updateTaskStatus(id, status, { output, error } = {}) {
    if (!VALID_STATUSES.has(status)) {
      throw new Error(`Invalid task status: ${status}`);
    }
    const now = new Date().toISOString();
    const outputStr = output !== undefined ? (typeof output === 'string' ? output : JSON.stringify(output)) : null;
    const errorStr = error !== undefined ? (typeof error === 'string' ? error : JSON.stringify(error)) : null;

    this.db.prepare(
      'UPDATE tasks SET status = ?, output = COALESCE(?, output), error = COALESCE(?, error), updated_at = ? WHERE id = ?'
    ).run(status, outputStr, errorStr, now, id);

    return this.getTask(id);
  }

  recoverDanglingTasks() {
    const now = new Date().toISOString();
    const result = this.db.prepare(
      "UPDATE tasks SET status = 'interrupted', error = 'Interrupted by server restart', updated_at = ? WHERE status = 'running'"
    ).run(now);
    return result.changes;
  }

  saveCheckpoint({ id, taskId, phase, state, artifacts = null }) {
    if (!taskId || !phase || !state) {
      throw new Error('taskId, phase, and state are required to save checkpoint');
    }
    const checkpointId = id || `chk_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const artifactsStr = artifacts ? (typeof artifacts === 'string' ? artifacts : JSON.stringify(artifacts)) : null;

    this.db.prepare(
      'INSERT INTO task_checkpoints (id, task_id, phase, state, artifacts, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(checkpointId, taskId, phase, state, artifactsStr, now);

    return this.getCheckpoint(checkpointId);
  }

  getCheckpoint(id) {
    const row = this.db.prepare('SELECT * FROM task_checkpoints WHERE id = ?').get(id);
    if (!row) return null;
    return {
      ...row,
      artifacts: row.artifacts ? JSON.parse(row.artifacts) : null
    };
  }

  getLatestCheckpoint(taskId) {
    const row = this.db.prepare(
      'SELECT * FROM task_checkpoints WHERE task_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 1'
    ).get(taskId);
    if (!row) return null;
    return {
      ...row,
      artifacts: row.artifacts ? JSON.parse(row.artifacts) : null
    };
  }

  listCheckpoints(taskId, limit = 50) {
    const rows = this.db.prepare(
      'SELECT * FROM task_checkpoints WHERE task_id = ? ORDER BY created_at DESC, rowid DESC LIMIT ?'
    ).all(taskId, limit);
    return rows.map(r => ({
      ...r,
      artifacts: r.artifacts ? JSON.parse(r.artifacts) : null
    }));
  }
}

module.exports = { TaskStore, VALID_STATUSES };
