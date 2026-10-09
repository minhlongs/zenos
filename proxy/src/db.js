'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  model TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  input TEXT,
  output TEXT,
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  tags TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

function initDatabase(options = {}) {
  let db;
  if (options.memory || !options.dbPath) {
    db = new DatabaseSync(':memory:');
  } else {
    const dir = path.dirname(options.dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db = new DatabaseSync(options.dbPath);
    try {
      db.exec('PRAGMA journal_mode = WAL;');
    } catch {
      // WAL may not be supported on in-memory or some systems
    }
  }

  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);

  const migration = db.prepare('SELECT version FROM schema_migrations WHERE version = 1').get();
  if (!migration) {
    db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (1, ?)')
      .run(new Date().toISOString());
  }

  const migration2 = db.prepare('SELECT version FROM schema_migrations WHERE version = 2').get();
  if (!migration2) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS task_checkpoints (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        phase TEXT NOT NULL,
        state TEXT NOT NULL,
        artifacts TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      );
    `);
    db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (2, ?)')
      .run(new Date().toISOString());
  }

  return db;
}

module.exports = { initDatabase };
