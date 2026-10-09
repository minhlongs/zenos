'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  estimateTokens,
  estimateMessageTokens,
  compactMessages
} = require('../src/workflow/context-compactor');

test('context-compactor: estimates tokens roughly 4 chars per token', () => {
  assert.equal(estimateTokens('1234'), 1);
  assert.equal(estimateTokens('12345678'), 2);
  assert.equal(estimateTokens(''), 0);
});

test('context-compactor: estimates message tokens including frame overhead', () => {
  const msg = { role: 'user', content: '12345678' };
  // 2 tokens for content + 4 tokens overhead = 6 tokens
  assert.equal(estimateMessageTokens(msg), 6);
});

test('context-compactor: does not compact when within token limit', () => {
  const messages = [
    { role: 'system', content: 'You are an agent.' },
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: 'Hi there' }
  ];

  const res = compactMessages(messages, { maxTotalTokens: 1000 });
  assert.equal(res.compacted, false);
  assert.equal(res.messages.length, 3);
});

test('context-compactor: compacts older messages when limit is exceeded', () => {
  const messages = [
    { role: 'system', content: 'System instructions.' },
    { role: 'user', content: 'Turn 1: '.repeat(50) },
    { role: 'assistant', content: 'Reply 1: '.repeat(50) },
    { role: 'user', content: 'Turn 2: '.repeat(50) },
    { role: 'assistant', content: 'Reply 2: '.repeat(50) },
    { role: 'user', content: 'Latest query' }
  ];

  // Set limits low enough to trigger compaction
  const res = compactMessages(messages, {
    maxRecentTokens: 50,
    maxTotalTokens: 100
  });

  assert.equal(res.compacted, true);
  assert.ok(res.trimmedCount > 0);
  // System prompt is preserved at index 0
  assert.equal(res.messages[0].role, 'system');
  assert.equal(res.messages[0].content, 'System instructions.');
  // Summary message is injected
  assert.equal(res.messages[1].role, 'system');
  assert.ok(res.messages[1].content.includes('[COMPACTED CONTEXT'));
  // Most recent message is preserved at the end
  const lastMsg = res.messages[res.messages.length - 1];
  assert.equal(lastMsg.content, 'Latest query');
});
