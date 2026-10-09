'use strict';

const EventEmitter = require('node:events');
const crypto = require('node:crypto');
const { ToolHarness } = require('./tool-harness');
const { parseToolCalls } = require('./tool-parser');
const { compactMessages, estimateTokens } = require('./context-compactor');

class ReactAgentLoop extends EventEmitter {
  constructor(options = {}) {
    super();
    this.modelClient = options.modelClient || null;
    this.concurrencyGate = options.concurrencyGate || null;
    this.taskStore = options.taskStore || null;
    this.supervisor = options.supervisor || null;
    this.toolHarness = options.toolHarness || new ToolHarness({ workspaceRoot: options.workspaceRoot });
    this.maxIterations = options.maxIterations || 8;
    this.systemPrompt = options.systemPrompt || this.buildSystemPrompt();
    this.model = options.model || 'qwen2.5-coder-14b';
  }

  buildSystemPrompt() {
    const toolDefs = this.toolHarness.getToolDefinitions();
    const toolsJson = JSON.stringify(toolDefs, null, 2);
    return `You are ZenOS Autonomous ReAct Agent.
You solve tasks step-by-step using reasoning and tool executions.

Available Tools:
${toolsJson}

Tool Calling Convention:
To invoke a tool, output:
<tool_call name="tool_name">
{"param1": "value1"}
</tool_call>

Workflow Rules:
1. Provide your Thought on what to do next.
2. If actions are needed, output one or more <tool_call> tags.
3. If the task is finished, explain the result directly without <tool_call> tags.`;
  }

  async run({ prompt, taskId = null, workspaceRoot = null, maxIterations = null } = {}) {
    if (!prompt) throw new Error('prompt is required');
    const id = taskId || `agent_${crypto.randomUUID()}`;
    const limit = maxIterations || this.maxIterations;

    if (this.supervisor) {
      this.supervisor.registerActiveTask(id, { prompt, type: 'react_agent' });
    }
    if (this.taskStore) {
      this.taskStore.createTask({ id, name: 'ReAct Agent Task', input: prompt });
      this.taskStore.updateTaskStatus(id, 'running');
    }

    const messages = [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: prompt }
    ];

    this.emit('agent_start', { taskId: id, prompt, maxIterations: limit });

    let iteration = 0;
    let finalAnswer = null;

    try {
      while (iteration < limit) {
        iteration++;
        if (this.supervisor) this.supervisor.recordHeartbeat(id);

        // Compact context before generation
        const { messages: compacted } = compactMessages(messages, {
          maxRecentTokens: 4000,
          maxTotalTokens: 6000
        });

        // Query model (optionally guarded by ConcurrencyGate)
        const responseText = await this._callModel(compacted);
        const { calls, remainingText } = parseToolCalls(responseText);

        this.emit('agent_thought', { taskId: id, iteration, thought: remainingText || responseText });

        // Save iteration checkpoint
        if (this.taskStore) {
          this.taskStore.saveCheckpoint({
            taskId: id,
            phase: `iteration_${iteration}`,
            state: JSON.stringify({ iteration, toolCallsCount: calls.length }),
            artifacts: { thought: remainingText, calls }
          });
        }

        // If no tool calls, model completed the task
        if (calls.length === 0) {
          finalAnswer = responseText;
          break;
        }

        // Execute tool calls
        messages.push({ role: 'assistant', content: responseText });
        for (const call of calls) {
          this.emit('agent_tool_call', { taskId: id, iteration, tool: call.name, args: call.arguments });
          const result = await this.toolHarness.execute(call.name, call.arguments);
          this.emit('agent_tool_result', { taskId: id, iteration, tool: call.name, result });

          const obsContent = `Tool [${call.name}] result:\n${JSON.stringify(result, null, 2)}`;
          messages.push({ role: 'user', content: obsContent });
        }
      }

      if (!finalAnswer) {
        finalAnswer = `Agent reached maximum iteration limit (${limit}) without final answer.`;
      }

      if (this.taskStore) {
        this.taskStore.updateTaskStatus(id, 'completed', { output: finalAnswer });
      }
      if (this.supervisor) {
        this.supervisor.unregisterActiveTask(id, { reason: 'completed' });
      }

      const summary = {
        taskId: id,
        status: 'completed',
        iterations: iteration,
        output: finalAnswer
      };
      this.emit('agent_complete', summary);
      return summary;
    } catch (err) {
      if (this.taskStore) {
        this.taskStore.updateTaskStatus(id, 'failed', { error: err.message });
      }
      if (this.supervisor) {
        this.supervisor.unregisterActiveTask(id, { reason: 'failed' });
      }
      this.emit('agent_error', { taskId: id, error: err.message });
      throw err;
    }
  }

  async _callModel(messages) {
    if (!this.modelClient) {
      // Default mock completion for standalone test harnesses if no client provided
      return 'I have completed the task with no tools required.';
    }

    const invoke = () => this.modelClient.chatCompletion({
      model: this.model,
      messages
    });

    if (this.concurrencyGate) {
      return await this.concurrencyGate.enqueue(invoke);
    }
    return await invoke();
  }
}

module.exports = { ReactAgentLoop };
