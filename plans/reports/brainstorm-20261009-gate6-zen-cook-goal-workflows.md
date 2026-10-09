# Brainstorm Report: Gate 6 — `/zen`, `/cook`, `/goal` Integration & AI Factory Workflows

**Date:** 2026-10-09  
**Status:** PROPOSED & CTO-APPROVED  
**Target:** ZenOS Local AI Workstation — Gate 6 AI Factory Automation Engine  
**Author:** Principal Software Architect & AI Workstation CTO  
**Work Context:** `/Users/macbook/ZenOS`  
**Reports Path:** `/Users/macbook/ZenOS/plans/reports/`  
**Plans Path:** `/Users/macbook/ZenOS/plans/`  

---

## 1. Problem-First Inversion

### 1.1 Solution-Jumping Diagnosis
- **The Impulsive Solution:** Hasty implementation of three disconnected CLI scripts or adopting heavyweight multi-agent frameworks (e.g., LangGraph, AutoGen, CrewAI, Temporal) to run recursive prompt loops for coding and project execution.
- **The Hidden Pain:** 
  1. *Unbounded Hallucination & Resource Exhaustion:* Naive recursive coding loops burn CPU, consume massive context windows, and thrash Apple Silicon unified memory without arriving at verified code.
  2. *State Fragmentation & Amnesia:* Independent CLI scripts lose state between planning, coding, and verification steps. If the process crashes or encounters an approval gate, state is wiped.
  3. *Metal GPU Contention:* Multiple uncoordinated agent threads trigger simultaneous prompt evaluation passes on local LM Studio / Ollama, exceeding Metal GPU memory limits (causing macOS kernel memory compression, thermal throttling, or OOM crashes).
  4. *Destructive File Mutations:* Ungoverned agent actions write files without strict LOC limit checks (< 200 LOC invariant) and without red-green-refactor automated test validation.

### 1.2 Underlying Problem
A personal AI workstation for a solo founder requires a **deterministic, resource-governed workflow pipeline** that coordinates cognitive architectural reasoning (`/zen`), deterministic TDD code construction (`/cook`), and durable milestone management (`/goal`) while integrating seamlessly with Gate 1–5 foundations:
- Gate 1: Anthropic-to-OpenAI translation and streaming.
- Gate 2: Model aliasing, failover, and Metal GPU concurrency gating (`ConcurrencyGate`).
- Gate 3: SQLite durable task tracking (`task-store.js`) and Markdown episodic memory (`markdown-memory.js`).
- Gate 4: Path jail (`path-guard.js`), dangerous command classifier (`command-guard.js`), and human approval interlocks (`approval-gate.js`).
- Gate 5: Telemetry streaming (`telemetry.js`, SSE `/v1/telemetry/events`) and dashboard control (`/dashboard` & Next.js).

### 1.3 Assumption Challenges
1. **Assumption 1: `/zen`, `/cook`, and `/goal` should be three independent CLI utilities.**
   - *Challenge & Critique:* If built as isolated standalone scripts, each tool must maintain its own database connection, duplicate LLM clients, manage its own retry loops, and handle approvals in silos. This fragments task history and bypasses Gate 5 dashboard observability.
   - *Resolution:* Build a unified **Workstation-Native Factory Engine** hosted inside the ZenOS Proxy (`proxy/src/workflow/`), exposing unified REST endpoints and SSE streams. The CLI commands (`zen`, `cook`, `goal`) become ultra-thin client dispatchers (~50 LOC each) that invoke the proxy engine.
2. **Assumption 2: Autonomous AI coding loops can run hands-off until a task is done.**
   - *Challenge & Critique:* Completely open-ended build-test-repair loops easily enter cyclic repair traps (fixing test A breaks test B, ad infinitum) and can blow past token budgets or corrupt existing codebase structure.
   - *Resolution:* Strict deterministic circuit breakers: maximum iteration ceiling (default 5 loops), diff-size budgets, atomic git rollback on repeated regressions, and mandatory LOC ceiling checks (< 200 LOC per file) on every file mutation.
3. **Assumption 3: Cloud escalation (Opus / Sonnet) should happen automatically via LLM heuristics.**
   - *Challenge & Critique:* Cloud escalation without deterministic thresholds leaks proprietary code, breaks offline-first privacy contracts, and causes unexpected API cost spikes.
   - *Resolution:* Cloud escalation is policy-governed: triggered only by an explicit heuristic complexity score, repeated local-model verification failures, or explicit developer approval via Gate 4 `ApprovalGate`.
4. **Assumption 4: Durable milestone orchestration requires an external workflow engine (e.g. Temporal, Redis, BullMQ).**
   - *Challenge & Critique:* Adding external services violates the zero-external-dependency rule and bloats a lightweight solo founder workstation.
   - *Resolution:* Native Node.js `node:sqlite` transactions with atomic checkpoints and `node:events` provide 100% crash durability with sub-millisecond execution and zero operational overhead.

### 1.4 Problem Statement
- **Context:** Solo founder building complex systems on an Apple Silicon workstation (M1–M4 Max) using local models (Qwen 2.5 Coder 7B/14B, DeepSeek Coder) augmented by frontier cloud models when necessary.
- **Struggle:** Bridging the gap between high-level architectural brainstorming (`/zen`), deterministic TDD code implementation (`/cook`), and long-running verifiable milestone execution (`/goal`) without crashing Metal memory, running wild mutation loops, or losing task state.
- **Root Cause:** Absence of a centralized, event-driven workflow engine that enforces TDD red-green verification, LOC ceilings, durable state transitions, and Gate 4 security bounds.
- **Consequence:** Manual babysitting, inconsistent code quality, frequent file LOC bloat, high token costs, and loss of continuity across workstation reboots.
- **Success Criteria:** A unified Factory Workflow Engine where `/zen` generates structured execution plans, `/cook` executes deterministic red-green TDD loops with strict LOC checks, and `/goal` durably manages multi-step milestones with full pause/resume, Gate 4 security approvals, and Gate 5 dashboard observability.

### 1.5 Three Alternative Framings
- **Framing A (Tool-centric / CLI-First):** Standalone bash or node scripts in `.claude/skills` that directly invoke Claude Code or curl commands against `/v1/messages`.
  *Trade-off:* Fast to prototype, but completely disconnected from SQLite task stores, SSE telemetry, dashboard controls, and centralized approval queues.
- **Framing B (Heavyweight Agent Mesh):** Embedded LangGraph/Temporal runtime running multi-agent consensus nodes in background daemon containers.
  *Trade-off:* Extreme complexity, heavy memory footprint, fragile dependency tree, violates KISS/YAGNI.
- **Framing C (Proxy-Integrated Workflow Engine — Selected):** Modular workflow engine embedded directly in `proxy/src/workflow/` leveraging existing SQLite, ConcurrencyGate, ApprovalGate, and TelemetryCollector, with thin CLI bridges.
  *Trade-off:* Optimal balance: 0 external dependencies, 100% testable via Node native test runner, strict < 200 LOC per module, instant dashboard integration.

### 1.6 Evidence Status
- **Empirical Baseline:** 100/100 tests currently green in `proxy/` covering Gates 1–5.
- **Hardware Telemetry:** M-series unified memory handles single-stream local 14B Q4_K_M inference smoothly (~8–10 GB unified memory), but dual concurrent generation causes memory pressure and token generation slowdown from 45 tok/s to < 10 tok/s.
- **Codebase Health:** All existing source files in `proxy/src/` strictly adhere to the < 200 LOC ceiling (largest is 164 LOC).

### 1.7 Validation Plan
1. Unit tests for each workflow component (`workflow-engine.js`, `zen-director.js`, `cook-runner.js`, `goal-manager.js`, `loc-checker.js`).
2. Integration contract tests validating `/v1/factory/zen`, `/v1/factory/cook`, `/v1/factory/goal` endpoints.
3. TDD circuit-breaker verification: test that `/cook` aborts cleanly with failure status when a test fails consecutively for > 5 iterations without improvement.
4. LOC ceiling verification: test that file modifications exceeding 200 LOC are rejected or split automatically.
5. Pause/resume persistence test: start a `/goal` milestone, simulate proxy restart, verify resume from last checkpoint.

### 1.8 Stakeholder Message
> "Gate 6 brings the AI Factory to ZenOS: `/zen` architects the plan, `/cook` executes strict red-green-refactor TDD cycles under our 200 LOC ceiling, and `/goal` guarantees long-running milestone durability with pause/resume and human approval gates—all running locally on Apple Silicon with 0 external dependencies and real-time dashboard visibility."

---

## 2. Technical Architecture & Approach Evaluation

### 2.1 Evaluated Approaches

| Dimension | Option 1: Standalone CLI Scripts | Option 2: Heavy Distributed Engine | Option 3: Proxy-Integrated Workflow Engine (Chosen) |
|---|---|---|---|
| **Architecture** | Disconnected Bash / Node scripts | External containerized agent runtime | Native Node.js modular engine in `proxy/src/workflow/` |
| **State Persistence** | Ephemeral files / stdout | Heavy distributed database (Postgres/Redis) | Native `node:sqlite` via Gate 3 `TaskStore` + JSON checkpoints |
| **Memory / Metal Safety** | Uncontrolled (spawns multiple LLM calls) | Heavy RAM overhead (>2GB) | Strictly gated by Gate 2 `ConcurrencyGate` (1 active inference) |
| **Security & Approvals** | Shell-level ad-hoc checks | Complex RBAC microservice | Direct Gate 4 `command-guard`, `path-guard`, `approval-gate` |
| **Observability** | Terminal logs only | Dedicated third-party UI | Direct Gate 5 SSE `/v1/telemetry/events` & `/dashboard` |
| **Code Footprint** | ~500 LOC loosely coupled | >4,000 LOC + multi-container | ~750 LOC across 6 tightly focused modules (< 150 LOC each) |
| **Dependencies** | External CLI dependencies | 15+ npm/python packages | **0 new npm dependencies** (pure Node.js built-ins) |
| **TDD / LOC Enforcer** | None (manual) | Abstract agent prompt | Deterministic Node.js file parser & child test runner |

### 2.2 Selected Modular Architecture

The Gate 6 AI Factory architecture resides inside `proxy/src/workflow/` and integrates with `proxy/src/app.js` and `frontend/`.

```
proxy/src/workflow/
├── zen-director.js        (~120 LOC) — Cognitive architect, prompt analyzer, local vs cloud router
├── cook-runner.js         (~140 LOC) — TDD execution loop: red -> green -> refactor with circuit breakers
├── goal-manager.js        (~130 LOC) — Milestone runner, state checkpoints, pause/resume/abort
├── loc-guard.js           (~90 LOC)  — Deterministic LOC ceiling checker (<200 LOC validator & splitter alert)
├── factory-engine.js      (~140 LOC) — Master orchestrator coordinating Zen -> Cook -> Goal pipelines
└── routes-factory.js      (~130 LOC) — Express REST routes (/v1/factory/*) and SSE stream broadcaster

cli/ (Ultra-thin dispatchers in ZenOS root)
├── bin/zen               (~60 LOC)  — CLI command dispatching to POST /v1/factory/zen
├── bin/cook              (~60 LOC)  — CLI command dispatching to POST /v1/factory/cook
└── bin/goal              (~60 LOC)  — CLI command dispatching to POST /v1/factory/goal
```

#### Detailed File-by-File Breakdown (< 200 LOC Invariant):

1. **`proxy/src/workflow/zen-director.js` (~120 LOC):**
   - Analyzes incoming problem statements or user goals.
   - Evaluates complexity score (1 to 5) based on dependency depth, file counts, and risk classification.
   - Local vs. Cloud Routing Decision:
     - Complexity ≤ 3: Routes to local model (`qwen2.5-coder-7b/14b`) via Gate 2 model router.
     - Complexity > 3: Recommends escalation to frontier model (`claude-3-5-sonnet` / `claude-opus-4`), triggering Gate 4 approval if policy requires.
   - Decomposes problem into structured execution phases, TDD unit test specs, and file mutation budgets.
   - Outputs JSON Plan Spec compliant with ZenOS planning conventions.

2. **`proxy/src/workflow/cook-runner.js` (~140 LOC):**
   - Executes deterministic TDD cycle:
     - **Phase Red:** Generates or executes test file first using `node:child_process` (expects failure).
     - **Phase Green:** Implements minimal code to satisfy test failure.
     - **Phase Refactor:** Runs lint/type check, invokes `loc-guard.js` to ensure < 200 LOC, cleans up implementation.
   - Sandboxing: Wraps all workspace modifications in `path-guard.js` and all shell execution in `command-guard.js`. If a command is high-risk (e.g., `git reset --hard`, `rm -rf`), halts and queues a Gate 4 approval request.
   - Circuit Breakers:
     - Max iterations per step: 5 attempts. If step fails 5 times, pauses and alerts operator.
     - Diff cap: limits edits per cycle to prevent wholesale file obliteration.
     - Rollback on regression: automatically discards breaking changes via git worktree or stash.

3. **`proxy/src/workflow/goal-manager.js` (~130 LOC):**
   - Durable milestone manager supporting long-running goals across multiple `/cook` phases.
   - State Machine: `IDLE` -> `PLANNING` -> `COOKING` -> `VERIFYING` -> `PAUSED` -> `COMPLETED` / `FAILED`.
   - Persists state checkpoints directly into SQLite via `TaskStore` (`task_checkpoints` table).
   - Exposes lifecycle methods: `startGoal()`, `pauseGoal()`, `resumeGoal()`, `abortGoal()`, `getGoalStatus()`.
   - On completion, writes episodic summary to `markdown-memory.js` for long-term workstation recall.

4. **`proxy/src/workflow/loc-guard.js` (~90 LOC):**
   - High-speed deterministic file LOC analyzer.
   - Scans specified source files before and after modifications.
   - Rules:
     - Rejects any file generation or modification resulting in ≥ 200 LOC.
     - Surfaces exact line count and breakdown (code, comments, whitespace).
     - Provides decomposition recommendations when a file approaches 180 LOC.

5. **`proxy/src/workflow/factory-engine.js` (~140 LOC):**
   - Master orchestrator connecting `ZenDirector`, `CookRunner`, and `GoalManager`.
   - Coordinates the pipeline:
     `Goal Trigger` → `Zen Planning` → `Human Approval (if escalated)` → `Cook Execution (TDD Loop)` → `Verification Gate` → `Episodic Memory Archive`.
   - Listens to internal events and broadcasts telemetry via `TelemetryCollector` and SSE.
   - Enforces Apple Silicon single-concurrency policy so cognitive reasoning and code synthesis never run concurrently on Metal GPU.

6. **`proxy/src/workflow/routes-factory.js` (~130 LOC):**
   - Mounts under `/v1/factory`:
     - `POST /v1/factory/zen` — Run architectural analysis & planning.
     - `POST /v1/factory/cook` — Run deterministic TDD execution on a spec.
     - `POST /v1/factory/goal` — Create and run durable multi-step goal.
     - `GET  /v1/factory/goal/:id` — Get goal status, phase progress, and checkpoints.
     - `POST /v1/factory/goal/:id/pause` — Pause running goal.
     - `POST /v1/factory/goal/:id/resume` — Resume paused goal.
     - `POST /v1/factory/goal/:id/abort` — Abort goal with rollback.
     - `GET  /v1/factory/events` — SSE stream of real-time factory events.

### 2.3 Sequence and Data Flow

```
[Developer / CLI / Web UI]
       │
       ▼ (1) POST /v1/factory/goal { title, prompt, maxBudget }
┌─────────────────────────────────────────────────────────────┐
│                      FactoryEngine                          │
│  - Creates Goal Record in SQLite (TaskStore)                │
│  - Emits telemetry 'goal_started'                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ (2) Invoke ZenDirector
┌─────────────────────────────────────────────────────────────┐
│                       ZenDirector                           │
│  - Evaluates Complexity Score (1-5)                         │
│  - Routes: Local Model (Metal) vs Cloud Escalation (Gate 4) │
│  - Decomposes into Phases, Specs & TDD Test Definitions     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ (3) Plan Spec Ready (SQLite Checkpoint Saved)
┌─────────────────────────────────────────────────────────────┐
│                       CookRunner                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Iterative TDD Loop (Max 5 attempts)                   │  │
│  │  1. RED: Write & run failing test via child_process   │  │
│  │  2. GREEN: Implement minimal source code              │  │
│  │  3. REFACTOR: Check LOC (<200) via loc-guard.js       │  │
│  │  4. SECURE: Verify commands via command-guard.js      │  │
│  │     (Halts for ApprovalGate if high risk)             │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ (4) All Tests Pass & LOC < 200
┌─────────────────────────────────────────────────────────────┐
│                       GoalManager                           │
│  - Updates SQLite Status: 'completed'                       │
│  - Writes Episodic Log via MarkdownMemory                   │
│  - Broadcasts SSE event to Dashboard & Next.js frontend     │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Interface & Workflow Contracts

### 3.1 REST Endpoints Specification

#### 1. Cognitive Architecture: `/v1/factory/zen`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "prompt": "Architect a local SQLite-backed rate limiter with token bucket algorithm",
    "context": { "projectPath": "/Users/macbook/ZenOS", "constraints": ["<200 LOC", "zero-deps"] },
    "forceModel": "local" // or "cloud" or "auto" (default: "auto")
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "planId": "plan_7a8f9b2c",
    "complexity": 2,
    "routedModel": "qwen2.5-coder-14b-instruct",
    "escalationRequired": false,
    "phases": [
      {
        "phase": 1,
        "name": "token-bucket-core",
        "testFile": "tests/token-bucket.test.js",
        "sourceFiles": ["src/token-bucket.js"],
        "maxLoc": 150,
        "testAssertions": ["refills tokens over time", "blocks when empty"]
      }
    ],
    "estimatedCycles": 3
  }
  ```

#### 2. Deterministic TDD Execution: `/v1/factory/cook`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "planId": "plan_7a8f9b2c",
    "phaseIndex": 0,
    "maxIterations": 5,
    "autoCommit": false
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "phaseIndex": 0,
    "iterations": 2,
    "testResults": { "passed": 4, "failed": 0, "durationMs": 42 },
    "locReport": [
      { "file": "src/token-bucket.js", "loc": 84, "status": "pass" },
      { "file": "tests/token-bucket.test.js", "loc": 65, "status": "pass" }
    ],
    "checkpoint": "chk_9d8e7f"
  }
  ```

#### 3. Goal Management Lifecycle: `/v1/factory/goal`
- **`POST /v1/factory/goal`**
  - **Body:** `{ "title": "Build Rate Limiter", "prompt": "...", "autoCook": true }`
  - **Returns:** `{ "goalId": "goal_12345", "status": "running" }`
- **`GET /v1/factory/goal/:id`**
  - **Returns:** Current state, active phase, completed phases, recent logs, pending approval ID (if blocked).
- **`POST /v1/factory/goal/:id/pause`**
  - Pauses execution gracefully at end of current TDD cycle.
- **`POST /v1/factory/goal/:id/resume`**
  - Resumes execution from last saved checkpoint.
- **`POST /v1/factory/goal/:id/abort`**
  - Aborts execution and rolls back uncommitted workspace changes.

### 3.2 CLI Interaction Model

The workstation provides 3 ultra-lightweight executable CLI commands in `cli/bin/`:

1. `zen "<prompt>"`:
   - Invokes `/v1/factory/zen`.
   - Streams reasoning output to stdout.
   - Displays proposed plan phases, complexity score, and estimated iterations.
   - Prompts operator: `Proceed to cook? [y/N/--auto]`.

2. `cook [<plan-id> | <path-to-plan.md>] [--auto] [--max-cycles 5]`:
   - Runs deterministic TDD loop against target plan.
   - Prints live color-coded progress:
     - `[RED]` Running test baseline (verifying expected failure)...
     - `[GREEN]` Applying patch & rerunning test...
     - `[REFACTOR]` Checking LOC limits (< 200 LOC)...
     - `[PASS]` Phase completed in 2 iterations (84 LOC).

3. `goal "<objective>" [--auto] [--resume <goal-id>]`:
   - End-to-end autonomous runner uniting `/zen` and `/cook`.
   - Handles background task execution, monitors checkpoints, handles approval pauses.
   - Supports `--pause`, `--resume`, and `--status` flags.

### 3.3 Event Lifecycle & SSE Streaming Contracts

The endpoint `GET /v1/factory/events` broadcasts Server-Sent Events with `Content-Type: text/event-stream`:
- `event: goal_created` — payload: `{ goalId, title, timestamp }`
- `event: zen_planning_start` — payload: `{ goalId, model, prompt }`
- `event: zen_plan_ready` — payload: `{ goalId, planId, phasesCount, complexity }`
- `event: cook_tdd_cycle` — payload: `{ goalId, phaseIndex, cycle, stage: "red"|"green"|"refactor", status }`
- `event: loc_check_result` — payload: `{ file, loc, status: "pass"|"violation" }`
- `event: approval_required` — payload: `{ goalId, approvalId, command, riskLevel }`
- `event: checkpoint_saved` — payload: `{ goalId, checkpointId, phaseIndex }`
- `event: goal_completed` — payload: `{ goalId, durationMs, artifacts }`

### 3.4 Error Handling & Circuit Breakers

1. **Iteration Ceiling:** If `/cook` fails to satisfy tests within 5 iterations, it aborts further attempts, sets status to `interrupted`, saves a checkpoint, and emits an `iteration_exhausted` event.
2. **Git Rollback Guard:** Before beginning each phase, `/cook` captures the git worktree status or creates an ephemeral stash. If an iteration introduces fatal syntax errors or deletes unexpected files, it reverts to the pre-iteration state.
3. **LOC Breach Interlock:** If generated code exceeds 199 LOC, the file write is blocked, and the model is prompted with a modular decomposition instruction (extract helper module or split classes).

### 3.5 Pause/Resume & Checkpoint Contracts

- **Checkpoint Structure (Stored in SQLite `task_checkpoints`):**
  ```json
  {
    "checkpointId": "chk_4a2c1f",
    "goalId": "goal_12345",
    "phaseIndex": 2,
    "completedPhases": [0, 1],
    "workingFiles": ["src/token-bucket.js"],
    "lastTestStatus": "passed",
    "gitCommit": "3f9a12b",
    "timestamp": "2026-10-09T19:50:00.000Z"
  }
  ```
- **Crash Recovery:** When `FactoryEngine` boots up, it scans for goals in `running` status and transitions them to `paused` with a notice in the log, allowing the developer to run `goal --resume <id>` without context loss.

---

## 4. Implementation Constraints, Security & Quality Gates

### 4.1 Workstation & Apple Silicon Hardware Constraints
- **Metal GPU Concurrency Protection:** Apple Silicon unified memory (64GB–128GB) can hold large context windows, but concurrent execution of multiple 14B+ models causes Metal shader pipeline contention and throttling. Gate 6 strictly routes all LLM calls through Gate 2 `ConcurrencyGate` (`concurrency = 1` for local inference).
- **Zero Heavyweight Python Dependencies:** The factory engine and CLI are 100% native Node.js built-ins. No local Python virtualenvs, no LangChain, no heavy daemons.

### 4.2 Security Sandbox Interlocks
- **File System Jail:** All file operations in `/cook` are validated via Gate 4 `PathGuard`. Attempting to read or write outside the configured workspace root throws an immediate 403 Security Error.
- **Command Guard & Human Approval:** Commands executed during test execution are filtered through Gate 4 `CommandGuard`. High-risk commands (`sudo`, `git push --force`, `rm -rf`, package publishing) trigger Gate 4 `ApprovalGate` and pause the goal until approved via terminal CLI or `/dashboard`.
- **SSRF Prevention:** Upstream requests are filtered via Gate 4 `SsrfGuard`.

### 4.3 Code Quality Ceilings
- **Strict LOC Limit:** Every source file in `proxy/src/workflow/` must remain strictly under 200 lines of code.
- **Strict Test Coverage:** Full unit and contract coverage for every factory component using native `node:test`. 100% test pass rate required before shipping.
- **Zero `:any` in TypeScript Frontend:** Strict interfaces in `frontend/src/types/` for all factory types.

### 4.4 Second-Order Effects & Downstream Impacts

| Approach Choice | Downstream Benefit | Potential Second-Order Risk | Mitigation Strategy |
|---|---|---|---|
| **Centralized Proxy Engine** | Unified telemetry, single SQLite store, single dashboard view | Proxy crash halts running goal | Atomic checkpoints in SQLite; resume in 1 CLI command |
| **Strict < 200 LOC Ceiling** | Exceptional modularity, easy code reviews, high LLM comprehension | Models may create too many tiny files | Architectural guidelines in `/zen` planning to group cohesive utilities |
| **Enforced TDD (Red-First)** | Near-zero regressions, provable functionality | Tests written by model might be trivial or tautological | `/zen` generates strict test assertions before `/cook` implements code |
| **Metal GPU Concurrency = 1** | Thermal stability, 0 GPU memory panic crashes | Sequential queuing when running multiple tasks | Fast local inference (45+ tok/s on M-series) minimizes queue wait times |

---

## 5. Phased Implementation Roadmap

### Phase 1: Workflow Foundation & State Engine (`factory-engine.js`, `loc-guard.js`)
- Implement `loc-guard.js` for deterministic file line counting and ceiling enforcement.
- Implement database migration in `db.js` for `task_checkpoints` and goal metadata.
- Create `factory-engine.js` event emitter coordinating states and integrating with `ConcurrencyGate` and `TelemetryCollector`.
- Target: 15 focused tests verifying LOC validation and goal state machine transitions.

### Phase 2: Cognitive Architecture Director (`zen-director.js`)
- Implement `zen-director.js` with prompt complexity scoring (1–5) and local/cloud routing logic.
- Create structured plan decomposition (phases, target files, test specifications).
- Add unit tests validating plan generation and model routing contracts.

### Phase 3: Deterministic TDD Execution Runner (`cook-runner.js`)
- Implement `cook-runner.js` with red-green-refactor loop using `node:child_process`.
- Integrate Gate 4 `PathGuard`, `CommandGuard`, and `ApprovalGate`.
- Implement circuit breaker (max 5 iterations) and git rollback mechanics.
- Add unit and integration tests simulating TDD repair cycles.

### Phase 4: Durable Milestone Manager & REST/SSE Routes (`goal-manager.js`, `routes-factory.js`)
- Implement `goal-manager.js` with full checkpoint, pause, resume, and abort lifecycle.
- Implement `routes-factory.js` mounting `/v1/factory/*` and SSE event broadcasting.
- Create thin CLI dispatchers (`cli/bin/zen`, `cli/bin/cook`, `cli/bin/goal`).
- Add comprehensive API route tests.

### Phase 5: Dashboard Integration & End-to-End Hardening
- Extend `/dashboard` embedded view and Next.js frontend with Factory Workflows tab (live progress, goal controls, pause/resume buttons).
- Run full regression suite (`npm test`) ensuring 100% pass rate.
- Conduct complete LOC audit verifying all files strictly < 200 LOC.

---

## 6. Recommendations & Final Decision

1. **Architectural Recommendation:** Approve **Option 3: Proxy-Integrated Workflow Engine**. It leverages our battle-tested Gate 1–5 infrastructure (SQLite TaskStore, ConcurrencyGate, ApprovalGate, TelemetryCollector) without introducing a single third-party dependency.
2. **Safety & Stability Mandate:** Enforce the single-concurrency rule for Apple Silicon Metal inference, the 5-iteration circuit breaker for TDD loops, and the strict < 200 LOC ceiling across all generated code.
3. **Next Step:** Invoke `/ck:plan` to generate the formal Gate 6 implementation plan (`261009-gate6-zen-cook-goal-workflows`) based on this approved brainstorm specification.
