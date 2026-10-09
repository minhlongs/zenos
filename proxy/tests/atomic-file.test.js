'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { atomicWriteFile, atomicAppendJsonl, readJsonl } = require('../src/atomic-file');

describe('Atomic File Storage', () => {
  it('writes file atomically without leaving temporary artifacts', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zenos-atomic-test-'));
    const filePath = path.join(tmpDir, 'test.txt');
    try {
      atomicWriteFile(filePath, 'Hello ZenOS!');
      assert.equal(fs.readFileSync(filePath, 'utf8'), 'Hello ZenOS!');
      const remainingFiles = fs.readdirSync(tmpDir);
      assert.deepEqual(remainingFiles, ['test.txt']);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('creates nested directories automatically on atomic write', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zenos-atomic-test-'));
    const filePath = path.join(tmpDir, 'a', 'b', 'c', 'file.json');
    try {
      atomicWriteFile(filePath, JSON.stringify({ ok: true }));
      assert.deepEqual(JSON.parse(fs.readFileSync(filePath, 'utf8')), { ok: true });
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('appends and reads JSONL records safely', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zenos-atomic-test-'));
    const logPath = path.join(tmpDir, 'audit.jsonl');
    try {
      atomicAppendJsonl(logPath, { event: 'start', time: 100 });
      atomicAppendJsonl(logPath, { event: 'complete', time: 200 });

      const records = readJsonl(logPath);
      assert.equal(records.length, 2);
      assert.equal(records[0].event, 'start');
      assert.equal(records[1].event, 'complete');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
