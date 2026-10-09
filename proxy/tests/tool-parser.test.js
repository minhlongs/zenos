'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseToolCalls, formatToolResponse } = require('../src/workflow/tool-parser');

test('tool-parser: parses named XML tool call', () => {
  const input = `I will read the file.
<tool_call name="read_file">{"path":"src/store.js"}</tool_call>
Let me know if you need more details.`;

  const res = parseToolCalls(input);
  assert.equal(res.valid, true);
  assert.equal(res.calls.length, 1);
  assert.equal(res.calls[0].name, 'read_file');
  assert.deepEqual(res.calls[0].arguments, { path: 'src/store.js' });
  assert.ok(!res.remainingText.includes('<tool_call'));
});

test('tool-parser: parses generic XML tool call with nested JSON', () => {
  const input = `Executing:
<tool_call>
{
  "name": "run_command",
  "arguments": { "command": "npm test" }
}
</tool_call>`;

  const res = parseToolCalls(input);
  assert.equal(res.valid, true);
  assert.equal(res.calls.length, 1);
  assert.equal(res.calls[0].name, 'run_command');
  assert.deepEqual(res.calls[0].arguments, { command: 'npm test' });
});

test('tool-parser: parses markdown json code block fallback', () => {
  const input = `Here is the tool request:
\`\`\`json
{
  "name": "write_file",
  "arguments": { "path": "test.txt", "content": "hello" }
}
\`\`\``;

  const res = parseToolCalls(input);
  assert.equal(res.valid, true);
  assert.equal(res.calls.length, 1);
  assert.equal(res.calls[0].name, 'write_file');
  assert.deepEqual(res.calls[0].arguments, { path: 'test.txt', content: 'hello' });
});

test('tool-parser: handles plain text without tool calls gracefully', () => {
  const input = 'Just a normal chat response with no tool tags.';
  const res = parseToolCalls(input);
  assert.equal(res.valid, true);
  assert.equal(res.calls.length, 0);
  assert.equal(res.remainingText, input);
});

test('tool-parser: formats tool responses with xml wrapper', () => {
  const formatted = formatToolResponse('read_file', { content: 'test content' });
  assert.ok(formatted.includes('<tool_response name="read_file">'));
  assert.ok(formatted.includes('test content'));
  assert.ok(formatted.includes('</tool_response>'));
});
