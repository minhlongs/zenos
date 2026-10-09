# Product Development Requirements (PDR) — ZenOS Gate 6

## Project Mission
Build an audit-first, local-first personal AI workstation engineered for Apple Silicon and solo founder workflows, delivering the AI Factory engine (`/zen`, `/cook`, `/goal`).

## Target User
Solo software founders and technical architects operating on macOS (M1/M2/M3/M4 Max with 64GB+ unified memory), running local LLMs alongside Claude Code.

## Functional Requirements

### FR-1: Cognitive Planning Engine (`/zen`)
- Accept natural language problem statements and evaluate complexity (score 1-5).
- Automatically route local vs cloud inference: score <= 3 to local LM Studio (e.g. Qwen 2.5 Coder 14B), score > 3 to cloud frontier models.
- Decompose requests into structured JSON plan specs with explicit test assertions and file mutation targets.

### FR-2: Deterministic TDD Execution Runner (`/cook`)
- Run iterative Red-Green-Refactor development cycles via `node:child_process`.
- Automatically invoke tests using `node --test` or workspace runners.
- Circuit breaker: halt after 5 consecutive failures and alert operator.
- Rollback: discard breaking changes on severe regression.
- Validate that all touched files adhere strictly to `< 200 LOC`.

### FR-3: Durable Milestone Manager (`/goal`)
- Provide long-running goal execution across multi-phase plans.
- Store transactional checkpoints in SQLite (`task_checkpoints`).
- Support pause, resume, and abort without context loss across workstation restarts.
- Integrate with Gate 4 `ApprovalGate` when high-risk commands are detected.

### FR-4: Factory REST & SSE APIs (`routes-factory.js`)
- Expose `/v1/factory/zen`, `/v1/factory/cook`, `/v1/factory/goal` endpoints.
- Broadcast real-time SSE stream on `/v1/factory/events`.

### FR-5: Thin CLI Dispatchers
- Provide `bin/zen`, `bin/cook`, `bin/goal` executable dispatchers (< 60 LOC each).

## Non-Functional Requirements
- Zero external proxy dependencies.
- 100% green test pass rate.
- Sub-10ms proxy overhead for routing and checkpointing.
