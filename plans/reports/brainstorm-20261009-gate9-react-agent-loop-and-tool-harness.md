# Strategic Brainstorming Report: Gate 9 — Autonomous ReAct Agent Loop & Local Tool Harness

**Date**: 2026-10-09  
**Status**: APPROVED / READY FOR IMPLEMENTATION  
**Authors**: ZenOS Architecture Core (Antigravity & Claude Fable 5)  

---

## 1. Executive Summary

ZenOS has established core local LLM proxy routing (Gate 2), durable SQLite state (Gate 3), command & path guards with human approvals (Gate 4), operational observability (Gate 5), deterministic TDD pipelines (Gate 6), visual portal UI (Gate 7), and detached process jail sandboxing with crash recovery (Gate 8).

**Gate 9 delivers the autonomous cognitive engine**: an autonomous multi-turn **ReAct (Reason + Act)** agent loop (`react-agent-loop.js`) and a native zero-dependency **Local Tool Harness** (`tool-harness.js`). It allows local models (e.g. Qwen 2.5 Coder 14B on LM Studio/Ollama) to autonomously inspect, plan, write, and execute code within the workspace, under strict Apple Silicon Metal concurrency guard, process jail timeouts, and SQLite persistence.

---

## 2. Core Architectural Pillars

### Pillar A: Native Zero-Dependency Local Tool Harness (`tool-harness.js`)
Expose five essential developer tools to local LLMs, wrapped in workspace security guards:
1. `read_file`: PathGuard-sanitized `fs.readFileSync` with optional `startLine` and `endLine` bounds. Truncated to 200 lines max per turn.
2. `write_file`: PathGuard-sanitized atomic write (write to temp file, then `fs.renameSync`).
3. `edit_file`: Exact string search-and-replace with uniqueness validation before writing.
4. `list_files`: Recursive filesystem walk ignoring `node_modules`, `.git`, `.next`, `dist`, capped at 100 entries.
5. `execute_command`: CommandGuard-validated, ProcessJail-isolated command execution with detached PGID and strict timeout (default 30s).

### Pillar B: Autonomous Multi-Turn ReAct Agent Loop (`react-agent-loop.js`)
A deterministic state-machine loop orchestrating:
1. **Thought**: Model generates reasoning and intent.
2. **Action / Tool Call**: `tool-parser.js` extracts structured `<tool_call name="...">`.
3. **Observation / Tool Result**: `tool-harness.js` executes the call and formats the observation.
4. **Context Compaction**: `context-compactor.js` slides the conversation window to prevent token explosion.
5. **Durability & Safety**:
   - Max iterations ceiling (default: 8 turns) to prevent infinite hallucination loops.
   - Every turn checkpointed in SQLite `task_store`.
   - Heartbeats registered with `agent-supervisor.js`.
   - Single-concurrency queued through `concurrency-gate.js`.

### Pillar C: Real-Time SSE Stream & REST API
Expose `/v1/factory/agent/run` and `/v1/factory/agent/:id` with real-time SSE streaming:
- `agent_start`: Task initialized.
- `agent_thought`: Thought reasoning generated.
- `agent_tool_call`: Tool invocation initiated.
- `agent_tool_result`: Tool execution result observed.
- `agent_compact`: Conversation compacted.
- `agent_complete`: Final outcome reached or max iterations hit.

### Pillar D: Frontend Live Agent Terminal Component (`AgentConsole.tsx`)
A cyber-minimalist terminal view in `frontend/src/components/AgentConsole.tsx` allowing operators to launch autonomous agent sessions, follow live ReAct thoughts and tool executions in real time, and inspect checkpointed state.

---

## 3. Strict Invariants

1. **Zero External Dependencies**: Standard Node.js (`node:fs`, `node:path`, `node:child_process`, `node:events`, `node:crypto`).
2. **File Size Limit**: Strictly `< 200 LOC` per file across all new source and test files.
3. **Metal GPU Safety**: All inference calls queued through `ConcurrencyGate` (limit = 1).
4. **Sandboxed Execution**: All commands executed in `ProcessJail` with detached PGID.
5. **100% Green Test Suite**: Full unit and integration coverage.
