'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {
  parseMarkdownMemory,
  serializeMarkdownMemory,
  saveMarkdownMemory,
  loadMarkdownMemory,
  listMarkdownMemories
} = require('../src/markdown-memory');

describe('Markdown Episodic Memory', () => {
  it('serializes and parses frontmatter markdown accurately', () => {
    const memory = {
      name: 'model-preference',
      description: 'Prefers Qwen for code tasks',
      metadata: { type: 'user', created: '2026-10-09' },
      content: 'User prefers local Qwen2.5-Coder for fast code synthesis.'
    };

    const serialized = serializeMarkdownMemory(memory);
    assert.ok(serialized.startsWith('---\n'));
    assert.ok(serialized.includes('name: model-preference'));

    const parsed = parseMarkdownMemory(serialized);
    assert.equal(parsed.name, 'model-preference');
    assert.equal(parsed.description, 'Prefers Qwen for code tasks');
    assert.equal(parsed.metadata.type, 'user');
    assert.equal(parsed.content.trim(), 'User prefers local Qwen2.5-Coder for fast code synthesis.');
  });

  it('saves and lists markdown memories in storage directory', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zenos-md-test-'));
    try {
      saveMarkdownMemory(tmpDir, {
        name: 'test-fact-1',
        description: 'First fact',
        metadata: { type: 'reference' },
        content: 'Fact 1 content'
      });
      saveMarkdownMemory(tmpDir, {
        name: 'test-fact-2',
        description: 'Second fact',
        metadata: { type: 'reference' },
        content: 'Fact 2 content'
      });

      const list = listMarkdownMemories(tmpDir);
      assert.equal(list.length, 2);
      const names = list.map(m => m.name).sort();
      assert.deepEqual(names, ['test-fact-1', 'test-fact-2']);

      const loaded = loadMarkdownMemory(tmpDir, 'test-fact-1');
      assert.equal(loaded.name, 'test-fact-1');
      assert.equal(loaded.content.trim(), 'Fact 1 content');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
