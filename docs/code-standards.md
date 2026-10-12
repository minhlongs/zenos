# ZenOS Code Standards & Architectural Invariants

## Core Principles
- **YAGNI**: Implement only what is required by current milestone contracts.
- **KISS**: Favor standard Node.js runtime primitives over heavy external frameworks.
- **DRY**: Factor shared logic into cohesive helpers without monolithic coupling.

## Strict Invariants

### 1. File Size Management (< 200 LOC Ceiling)
- Every single file in `proxy/src/`, `proxy/tests/`, and `frontend/src/` must remain **strictly < 200 lines of code**.
- When a file approaches 180 lines, proactively split or extract helper modules.
- New modules must be focused, single-responsibility units.

### 2. Zero External Dependencies in Proxy
- `proxy/` core must rely **exclusively on native Node.js built-ins**:
  - `node:http`, `node:net`, `node:url` for networking
  - `node:sqlite` for transactional state storage
  - `node:crypto` for tokens, UUIDs, and hashing
  - `node:fs` and `node:path` for workspace operations
  - `node:events` for internal messaging and telemetry
  - `node:child_process` for local test and tool execution

### 3. Apple Silicon Metal Protection
- Concurrency limit is strictly enforced (default: 1) on local LLM calls to prevent Metal GPU memory exhaustion and thermal throttling.
- Heavy operations must be non-blocking with cooperative event-loop yielding.

### 4. Deterministic TDD Execution
- Always write failing tests first (Red phase).
- Implement minimal code to pass (Green phase).
- Refactor with strict LOC check (< 200 LOC) and code style checks (Refactor phase).
- Circuit breaker: maximum 5 automated iterations per step before escalating to human.

### 5. Security & Sandbox Boundaries
- All workspace file reads/writes must pass through `path-guard.js`.
- Destructive commands must be intercepted by `command-guard.js`.
- Consequential actions require human approval via `approval-gate.js`.

### 6. Refactoring Engine & Facade Barrel Standards (Gate 12)
- Monolith decomposition must output submodules strictly < 100 LOC.
- Decomposed modules must preserve backwards compatibility via facade barrel exports (`export * from ...` or `module.exports = { ... }`).
- Slicing operations must execute atomic pre-flight backups with rollback on test failure or LOC violation.
