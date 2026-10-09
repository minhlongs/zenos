# Phase 2: Autonomous ReAct Agent Loop Engine

## Overview
Implement `proxy/src/workflow/react-agent-loop.js` orchestrating multi-turn Reason+Act execution with local LLMs, tool invocation via `tool-parser.js`, context window sliding via `context-compactor.js`, and SQLite state checkpoints.

## Requirements
1. `ReactAgentLoop`:
   - Configurable `maxIterations` (default: 8).
   - Generates system prompt detailing available tools and XML invocation schema `<tool_call name="...">`.
   - Iterates through Thought -> Tool Call -> Tool Execution -> Observation -> Compaction.
   - Halts when model provides final response without tool calls, or when max iterations reached.
   - Emits events: `agent_start`, `agent_thought`, `agent_tool_call`, `agent_tool_result`, `agent_compact`, `agent_complete`.
2. Integrates with:
   - `ConcurrencyGate`: guarantees single inference on Metal GPU.
   - `TaskStore`: saves checkpoints at each iteration.
   - `AgentSupervisor`: registers active task and records heartbeats.
3. Strictly `< 200 LOC`.

## Related Files
- Create: `proxy/src/workflow/react-agent-loop.js`
- Create: `proxy/tests/react-agent-loop.test.js`
