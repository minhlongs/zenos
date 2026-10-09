# Strategic Brainstorming Report: Gate 11 — Multi-Agent Swarm Orchestration, Hierarchical Role Delegation & Dual-Key Consensus

**Date**: 2026-10-10  
**Status**: APPROVED / READY FOR ARCHITECTURAL SPECIFICATION & PLANNING  
**Authors**: ZenOS Architecture Core (Antigravity & Claude Fable 5)  
**Domain**: Multi-Agent Swarm Orchestration, Blackboard State Machine & Spec-Driven Verification  

---

## 1. Executive Summary & Problem Statement

ZenOS has established the foundational workstation substrate across Gates 1 through 10:
- **Gate 1-2**: Model routing, Apple Silicon Metal GPU concurrency gating (limit = 1), and upstream failover.
- **Gate 3-5**: SQLite durability (`node:sqlite`), process sandboxing (`PathGuard`, `CommandGuard`, `ApprovalGate`), and observability.
- **Gate 6-7**: AI factory workflows (`/zen`, `/cook`, `/goal`), visual web portals, and local harnesses.
- **Gate 8-9**: Detached process group sandboxing (`ProcessJail`), crash recovery supervisor (`AgentSupervisor`), and autonomous multi-turn ReAct loops (`ReactAgentLoop`, `ToolHarness`).
- **Gate 10**: Automated evaluation, deterministic SWE micro-benchmarks, and Reflexion self-correction loop (`ReflexionLoop`, `EvalStore`, `EvalConsole`).

### The Challenge
While individual ReAct loops and Reflexion self-repairs work for isolated functions, **complex full-stack and multi-file software engineering tasks fail when driven by a single homogeneous agent persona.**
1. **Persona Confusion**: A single agent attempting to plan, write, audit, and test simultaneously exhibits cognitive bias—overlooking its own edge-case flaws and accepting brittle code.
2. **Context Bloat on Apple Silicon**: Multi-agent chat setups (e.g. Autogen/CrewAI) stream dialog back and forth, blowing token windows and thrashing unified memory.
3. **Hardware Realities**: On Apple Silicon (M1–M4 Max), running concurrent LLM inferences in parallel causes catastrophic Metal GPU context switching and memory bus saturation.

**Gate 11 delivers the Multi-Agent Swarm Orchestration Engine (`SwarmOrchestrator`)**:
A **Turn-Based Blackboard State Machine** backed by SQLite that coordinates 4 specialized agent roles (Architect, Coder, Auditor, QA Verifier) via atomic artifact handoffs and enforces **Dual-Key Consensus** (Automated Test Pass + Auditor Sign-Off) before any code is approved.

---

## 2. Core Architectural Pillars

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Gate 11 Multi-Agent Swarm Engine                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
┌──────────────┐             ┌──────────────┐             ┌──────────────┐
│  Turn-Based  │             │ 4-Role State │             │   Dual-Key   │
│  Blackboard  │             │   Machine    │             │  Consensus   │
│  (SQLite)    │             │              │             │  Validator   │
│ Artifact-Led │             │  Architect   │             │ Verifier Pass│
│ State Hub    │             │  Coder       │             │       +      │
│ No Chat Bloat│             │  Auditor     │             │ Auditor Pass │
│              │             │  QA Verifier │             │              │
└──────┬───────┘             └──────┬───────┘             └──────┬───────┘
       │                            │                            │
       └────────────────────────────┼────────────────────────────┘
                                    ▼
                     ┌──────────────────────────────┐
                     │ Metal GPU Concurrency Guard │
                     │ Sequential Turn Dispatcher   │
                     │  Zero GPU Context Thrashing  │
                     └──────────────┬───────────────┘
                                    ▼
                     ┌──────────────────────────────┐
                     │ REST API & SSE / Frontend UI │
                     │  /v1/factory/swarm/*         │
                     │  SwarmConsole.tsx (Zero :any)│
                     └──────────────────────────────┘
```

### Pillar A: Turn-Based Blackboard Architecture (`swarm-blackboard.js`)
Instead of quadratic $O(N^2)$ inter-agent conversational message passing, all swarm coordination is mediated through a durable **Blackboard Ledger** in SQLite:
- Agents read only the latest task spec, code diff, or audit verdict.
- **Zero Conversation Bloat**: Context windows receive only structured inputs ($< 2$k tokens) rather than accumulated conversational history.
- **Crash-Resilient**: If a turn fails or the workstation restarts, the state machine resumes from the exact SQLite checkpoint.

### Pillar B: Hierarchical 4-Role State Machine (`swarm-roles.js`)
1. **Architect (`ARCHITECT`)**: Decomposes the user's objective into formal acceptance criteria, file targets, and verification test requirements.
2. **Coder (`CODER`)**: Implements minimal surgical code modifications adhering strictly to `< 200 LOC` per file.
3. **Auditor (`AUDITOR`)**: Adversarial reviewer that examines code diffs against security boundaries, invariants, and edge cases.
4. **QA Verifier (`VERIFIER`)**: Executes unit/integration test suites inside `ProcessJail` and captures exit codes and assertion diagnostics.

### Pillar C: Dual-Key Consensus Engine (`consensus-gate.js`)
Autonomous operations must not merge or conclude on self-reported success alone:
- **Key 1 (Deterministic)**: The QA Verifier's test suite must exit 0 in `ProcessJail` with 100% assertions green.
- **Key 2 (Adversarial)**: The Auditor role must sign off on security, invariants, and absence of regressions.
- If either key is withheld, the state transitions to `REVISION` and feeds structured diagnostics back to the Coder.

### Pillar D: Hardware-Aware Sequential Turn Dispatcher (`swarm-orchestrator.js`)
- Strictly honors `ConcurrencyGate` (limit = 1) for local LLM inference.
- Executes roles sequentially: `ARCHITECT -> CODER -> VERIFIER -> AUDITOR -> CONSENSUS`.
- Dispatches real-time SSE telemetry across every role handoff and artifact transition.

### Pillar E: Operator Interface & REST API (`SwarmConsole.tsx` & `routes-swarm.js`)
- `GET /v1/factory/swarm/sessions`: List swarm sessions.
- `POST /v1/factory/swarm/run`: Launch a multi-agent swarm task.
- `GET /v1/factory/swarm/sessions/:id`: Get full session blackboard, role turns, and dual-key signatures.
- Real-time SSE streaming over `/v1/factory/events` (`swarm_turn_start`, `swarm_artifact_posted`, `swarm_consensus_eval`).
- Modern dark cyber-minimalist Next.js console (`SwarmConsole.tsx`) displaying the active role pipeline, dual-key status, and artifact viewer.

---

## 3. Strict Invariants

1. **Zero External Dependencies**: Pure Node.js standard libraries (`node:fs`, `node:path`, `node:child_process`, `node:sqlite`, `node:events`).
2. **File Size Invariant**: Strictly `< 200 LOC` per file across all new source and test files.
3. **Apple Silicon Metal Safety**: All LLM calls serialized via `ConcurrencyGate` (concurrency limit = 1).
4. **Process Tree Isolation**: Verifier tests executed via `ProcessJail` with detached PGID.
5. **Durable Persistence**: All sessions, turns, and consensus keys recorded in SQLite `task_store`.
6. **Zero TypeScript `:any`**: Full static type safety in frontend components.

---

## 4. Architectural Component Breakdown (< 200 LOC Each)

1. `proxy/src/workflow/swarm-blackboard.js`: SQLite schema, session state, artifact storage (~140 LOC).
2. `proxy/src/workflow/swarm-roles.js`: System prompt generators and output parsers for the 4 roles (~150 LOC).
3. `proxy/src/workflow/consensus-gate.js`: Dual-key witness validation and sign-off evaluation (~120 LOC).
4. `proxy/src/workflow/swarm-orchestrator.js`: Turn-based state machine coordinating role handoffs (~160 LOC).
5. `proxy/src/workflow/routes-swarm.js`: Express sub-router mounted at `/v1/factory/swarm/*` (~95 LOC).
6. `frontend/src/types/swarm.ts`: TypeScript contracts for sessions, roles, and consensus (~70 LOC).
7. `frontend/src/lib/zenos-swarm-client.ts`: Client library for swarm endpoints (~80 LOC).
8. `frontend/src/components/SwarmConsole.tsx`: Next.js 14 cyber-minimalist operator portal (~175 LOC).

---

## 5. Strategic Verdict

**APPROVED**. Proceed immediately to parallel planning (`/ck:plan --parallel`) for Gate 11, delivering multi-agent swarm orchestration, turn-based blackboard state, and dual-key consensus gating.
