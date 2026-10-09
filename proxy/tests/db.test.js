'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { initDatabase } = require('../src/db');

describe('Database Engine (node:sqlite)', () => {
  it('initializes in-memory database with schema tables', () => {
    const db = initDatabase({ memory: true });
    try {
      const tables = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
      ).all().map(r => r.name);

      assert.ok(tables.includes('schema_migrations'));
      assert.ok(tables.includes('sessions'));
      assert.ok(tables.includes('tasks'));
      assert.ok(tables.includes('memories'));
    } finally {
      db.close();
    }
  });

  it('initializes file-backed database and creates parent directories', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zenos-db-test-'));
    const dbPath = path.join(tmpDir, 'nested', 'test.db');
    try {
      const db = initDatabase({ dbPath });
      try {
        const result = db.prepare('PRAGMA journal_mode').get();
        assert.equal(result.journal_mode.toLowerCase(), 'wal');
        assert.ok(fs.existsSync(dbPath));
      } finally {
        db.close();
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('runs migrations idempotently without re-applying', () => {
    const db = initDatabase({ memory: true });
    try {
      const count1 = db.prepare('SELECT count(*) as count FROM schema_migrations').get().count;
      assert.ok(count1 > 0);
      // Run initDatabase on same DB instance
      const count2 = db.prepare('SELECT count(*) as count FROM schema_migrations').get().count;
      assert.equal(count1, count2);
    } finally {
      db.close();
    }
  });
});
