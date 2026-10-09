'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { ReactAgentLoop } = require('../src/workflow/react-agent-loop');
const { ToolHarness } = require('../src/workflow/tool-harness');

test('ReactAgentLoop: completes task when model finishes in single turn', async () => {
  const mockClient = {
    chatCompletion: async () => 'Task is finished! Everything is in order.'
  };

  const loop = new ReactAgentLoop({ modelClient: mockClient });
  const events = [];
  loop.on('agent_start', (e) => events.push(e));
  loop.on('agent_thought', (e) => events.push(e));
  loop.on('agent_complete', (e) => events.push(e));

  const result = await loop.run({ prompt: 'Check the status' });
  assert.equal(result.status, 'completed');
  assert.equal(result.iterations, 1);
  assert.match(result.output, /Task is finished/);
  assert.equal(events.length, 3);
});

test('ReactAgentLoop: executes multi-turn tool call and returns final answer', async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zenos-loop-test-'));
  t.after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const harness = new ToolHarness({ workspaceRoot: tmpDir });
  let turn = 0;
  const mockClient = {
    chatCompletion: async () => {
      turn++;
      if (turn === 1) {
        return `I need to write a greeting file first.
<tool_call name="write_file">
{"filePath": "greeting.txt", "content": "Hello Autonomous Agent"}
</tool_call>`;
      }
      return 'I have successfully created greeting.txt and verified the task.';
    }
  };

  const loop = new ReactAgentLoop({ modelClient: mockClient, toolHarness: harness });
  const toolCalls = [];
  const toolResults = [];

  loop.on('agent_tool_call', (e) => toolCalls.push(e));
  loop.on('agent_tool_result', (e) => toolResults.push(e));

  const res = await loop.run({ prompt: 'Create greeting file' });
  assert.equal(res.status, 'completed');
  assert.equal(res.iterations, 2);
  assert.equal(toolCalls.length, 1);
  assert.equal(toolCalls[0].tool, 'write_file');
  assert.equal(toolResults.length, 1);
  assert.equal(toolResults[0].result.success, true);

  // Verify file was actually written to disk
  assert.equal(fs.existsSync(path.join(tmpDir, 'greeting.txt')), true);
  assert.equal(fs.readFileSync(path.join(tmpDir, 'greeting.txt'), 'utf8'), 'Hello Autonomous Agent');
});

test('ReactAgentLoop: stops when maxIterations reached', async () => {
  const mockClient = {
    chatCompletion: async () => `<tool_call name="list_files">{}</tool_call>`
  };

  const loop = new ReactAgentLoop({ modelClient: mockClient, maxIterations: 3 });
  const res = await loop.run({ prompt: 'Infinite loop test' });
  assert.equal(res.status, 'completed');
  assert.equal(res.iterations, 3);
  assert.match(res.output, /maximum iteration limit/);
});
