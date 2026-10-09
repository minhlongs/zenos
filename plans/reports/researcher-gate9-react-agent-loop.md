# Research Report: ZenOS Gate 9 - Autonomous ReAct Agent Loop & Tool Harness

## Overview
Gate 9 implements a durable, secure, and performant ReAct (Reason+Act) agent loop for ZenOS, leveraging existing security (Gate 4) and orchestration (Gate 8) layers.

## 1. ReAct Architecture
- **Loop Structure**: Asynchronous `while` loop using sequential execution. State is persisted in `TaskStore` (SQLite) before/after every step to ensure durability against process crashes.
- **Node.js Implementation**: Pure native `async/await` pipeline. No external dependencies. Recursive LLM calls handled via `anthropic-sdk` (or raw fetch).

## 2. ZenOS Integration
- **Context Management**: `ContextCompactor` slides window before every Prompt construction to stay within token limits.
- **Tool Execution**: `ToolParser` extracts blocks; `CommandGuard` validates shell input against `/usr` whitelist; `ProcessJail` execution for tools via `spawn` with `PGID` isolation.
- **Concurrency**: `ConcurrencyGate` (Metal/Apple Silicon) handles high-throughput requests, ensuring single-agent-thread per task to avoid race conditions in tool state.
- **Checkpointing**: Every state change (Action, Observation, Thought) is committed to `TaskStore` SQLite.

## 3. Event Lifecycle (SSE)
Event stream pattern for real-time frontend integration:
1. `agent_started`: Initial input payload.
2. `thought_generated`: Model reasoning (streamed).
3. `tool_call_initiated`: Execution start, includes tool-id.
4. `tool_result_received`: Tool output, including security context.
5. `compacting_context`: Signal to UI during window management.
6. `agent_done`: Final summary output.

## 4. Risks & Mitigations
- **Infinite Loops**: MAX_ITERATION clamp (default 10) enforced by `AgentSupervisor`.
- **Hallucinated Tools**: Strict JSON-schema or regex-validation against `ToolRegistry` before `CommandGuard` triggers.
- **Timeouts**: `ProcessJail` enforces absolute CPU-time limits for shell tools (SIGKILL post-timeout).

## Ranked Strategy
1. **Durable-by-Default**: SQLite checkpointing for every transition.
2. **Tool-Isolation**: Mandatory `ProcessJail` wrapper for all external CLI calls.
3. **Stream-First**: SSE events for every state transition point.

Status: DONE
