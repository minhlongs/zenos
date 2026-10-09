# Brainstorming Report: Gate 7 Frontend Visual Factory Dashboard & Local Agent Harness

**Date:** 2026-10-09  
**Target:** ZenOS Local AI Workstation Platform (`minhlongs/zenos`)  
**Domain:** Gate 7 Factory Observability, Visual Controls & Autonomous Local Execution  
**Authors:** Claude Fable 5 & ZenOS Technical Architecture Team  
**Status:** DRAFT & STRATEGIC RECOMMENDATION  

---

## 1. Executive Summary & Problem Framing

With the completion of **Gate 6** (AI Factory Workflows: `/zen`, `/cook`, `/goal`), ZenOS possesses a deterministic, audit-first backend workflow engine with:
- Strict `< 200 LOC` invariant per file enforced via `loc-guard.js`.
- Transactional SQLite checkpoint durability in `task_checkpoints`.
- Single-concurrency Apple Silicon Metal GPU protection.
- 5-iteration circuit breakers on test-driven development cycles.

However, the operator experience remains divided:
1. **Lack of Visual Factory Controls**: The operator currently monitors workflows via CLI scripts (`bin/zen`, `bin/cook`, `bin/goal`) or raw curl commands. While Gate 5 established the telemetry foundation, the Next.js 14 dashboard does not yet surface the Factory Workflows (`/zen` complexity & routing, `/cook` live test execution logs, and `/goal` lifecycle state transitions).
2. **Local Model Tool Autonomy**: Local open-weight models (Qwen 2.5 Coder 14B, DeepSeek Coder) on LM Studio require a structured tool invocation harness and sliding-window context compaction to work reliably within 16k context constraints without GPU memory exhaustion.
3. **Emergency Rescue View**: When the Next.js frontend is not running or under deployment, the embedded zero-dependency `/dashboard` must provide a high-availability fallback.

---

## 2. Architectural Dimensions & Comparative Options

### Option 1: Frontend-Centric Visual Factory Portal
- **Focus**: Deliver rich, responsive React/Tailwind components in `frontend/src/` connected via Server-Sent Events (SSE).
- **Key Modules**:
  - `ZenStudio.tsx`: Interactive prompt input, complexity score (1-5) radial gauge, local vs. cloud routing pill, and planned phases accordion.
  - `CookConsole.tsx`: Terminal-style streaming log buffer, LOC invariant indicator, and circuit breaker status badge.
  - `GoalTracker.tsx`: Visual state machine timeline (`PLANNING` ➔ `COOKING` ➔ `VERIFYING` ➔ `COMPLETED`/`PAUSED`), with inline pause/resume/abort buttons.
  - `FactoryEventsHook.ts`: Optimized `useSyncExternalStore` hook consuming `/v1/factory/events` without re-render cascades.
- **Pros**: Immediate visual clarity for the developer; intuitive one-click approvals; zero impact on proxy runtime complexity.
- **Cons**: Does not solve local model tool execution limitations.

### Option 2: Headless Local Autonomous Tool Runner & Context Engine
- **Focus**: Build the execution harness in `proxy/src/workflow/` for local models.
- **Key Modules**:
  - `tool-parser.js`: Robust XML tag parser (`<tool_code>`, `<function_calls>`) resilient against 14B model formatting drift.
  - `context-compactor.js`: Dual-buffer context management (4k recent dialogue buffer + 2k dynamic rolling summary).
  - `local-harness.js`: Single-concurrency tool execution loop executing workspace edits and tests within Gate 4 security jail.
- **Pros**: Enables fully autonomous local agent runs without human CLI intervention.
- **Cons**: Lacks visual visibility; operator still blind without UI dashboards.

### Option 3: Unified Hybrid Factory Portal & Lightweight Tool Runner (RECOMMENDED)
- **Focus**: Ship the complete developer experience by delivering both the **Visual Factory Dashboard** (Next.js 14 + Embedded `/dashboard` fallback) and the **Native Tool Runner Bridge** (`tool-parser.js` & `context-compactor.js`) under strict `< 200 LOC` modularity.
- **Architecture**:
  ```
  ┌─────────────────────────────────────────────────────────────┐
  │                 Next.js 14 Visual Dashboard                 │
  │  [Zen Studio]   │   [Cook Console]   │   [Goal Pipeline]    │
  │         ▲                   ▲                   ▲           │
  └─────────┼───────────────────┼───────────────────┼───────────┘
            │                   │                   │
            └───────────┬───────┴───────────────────┘
                        │ HTTP / SSE (/v1/factory/events)
  ┌─────────────────────▼───────────────────────────────────────┐
  │                     ZenOS Proxy Core                        │
  │  - routes-factory.js: REST endpoints & SSE broadcasting     │
  │  - factory-engine.js: Pipeline coordinator                  │
  │  - tool-parser.js: Robust XML/JSON tool extraction (<200L)  │
  │  - context-compactor.js: Dual-buffer sliding window (<200L) │
  │  - dashboard-html.js: Embedded zero-dep diagnostic view     │
  └─────────────────────┬───────────────────────────────────────┘
                        │ Loopback HTTP (ConcurrencyGate: 1)
  ┌─────────────────────▼───────────────────────────────────────┐
  │          Local LM Studio (Apple Silicon Metal GPU)          │
  │         Qwen 2.5 Coder 14B / DeepSeek Coder 14B             │
  └─────────────────────────────────────────────────────────────┘
  ```

---

## 3. Detailed Component Specifications

### 3.1 Next.js 14 Visual Factory Dashboard
1. **Zen Studio Component (`ZenStudio.tsx`)**:
   - Visual slider/meter showing prompt complexity score (1–5).
   - Dynamic Model Badge: Green pill for "Local Apple Silicon (Qwen 14B)", Purple pill for "Cloud Frontier (Claude 3.5 Sonnet)".
   - Structured plan display: lists suggested test files, target source files, and strategy (`TDD_STRICT`).
2. **Cook Console Component (`CookConsole.tsx`)**:
   - Monospace dark-mode test execution console with autoscroll.
   - Real-time iteration tracker (e.g. "Iteration 2 / 5").
   - Target files LOC audit chips: displays exact line count per file with green/yellow status (<180 LOC: green, 180-200: yellow).
   - Circuit breaker status: active vs triggered indicator.
3. **Goal Pipeline Component (`GoalPipeline.tsx`)**:
   - Visual milestone timeline displaying current state (`PLANNING`, `COOKING`, `VERIFYING`, `COMPLETED`, `PAUSED`, `FAILED`).
   - Quick action controls: `Pause Goal`, `Resume Goal`, `Abort Goal`.
   - Gate 4 Human Approval Card: Appears inline whenever a command requires confirmation with one-click `Approve` / `Reject`.

### 3.2 Embedded Dashboard Fallback (`dashboard-html.js`)
- Maintain zero external dependencies.
- Keep file size strictly `< 200 LOC`.
- Embed minimal SVG gauges and live SSE EventSource listener for factory status.
- Serves as the high-availability "first responder" view if Next.js dev server is offline.

### 3.3 Native Local Tool Runner & Context Compactor
- **`tool-parser.js`**:
  - Regex-based parser for XML tool blocks (`<tool_call name="...">...</tool_call>`) and fallback JSON tool calls.
  - Deterministic argument extraction and schema validation.
- **`context-compactor.js`**:
  - Sliding-window tokenizer estimator (~4 chars per token).
  - Keeps system prompt + recent 4k tokens active; summarizes older history into a compact bulleted context note.
  - Zero memory leaks; non-blocking async execution.

---

## 4. Invariants & Guardrails

| Invariant | Standard | Enforcement Mechanism |
|---|---|---|
| **File Length** | Strictly < 200 LOC per file | Static inspection via `loc-guard.js` |
| **Metal GPU Safety** | Concurrency = 1 for local inference | Serial queuing via `ConcurrencyGate` |
| **Workspace Security** | Zero reads/writes outside workspace | Jail validation via `PathGuard` |
| **Command Safety** | Destructive commands gated | Interception via `CommandGuard` & `ApprovalGate` |
| **Zero Proxy Deps** | 0 external npm dependencies | Native Node.js built-ins only |
| **Code Quality** | 100% green tests | Pre-commit test suite verification |

---

## 5. Phased Implementation Roadmap for Gate 7

- **Phase 1: Factory Frontend Types & API Client Extension**
  - Define TypeScript interfaces in `frontend/src/types/factory.ts`.
  - Extend `frontend/src/lib/zenos-client.ts` with factory methods (`triggerZen`, `runCook`, `getGoal`, `pauseGoal`, `resumeGoal`).
- **Phase 2: Visual Factory UI Components**
  - Implement `ZenStudio.tsx`, `CookConsole.tsx`, and `GoalPipeline.tsx` (< 200 LOC each).
  - Integrate into `frontend/src/app/page.tsx` with responsive tabs (`Observability` vs `AI Factory`).
- **Phase 3: Real-Time SSE Stream Hook & State Sync**
  - Implement `useFactoryEvents.ts` with `EventSource` reconnection logic and zero-cascade state updates.
  - Real-time event streaming to Cook Console and Goal Pipeline.
- **Phase 4: Embedded Dashboard Extension & Local Tool Runner**
  - Update `proxy/src/dashboard-html.js` with lightweight factory badges (< 200 LOC).
  - Implement `proxy/src/workflow/tool-parser.js` and `proxy/src/workflow/context-compactor.js` (< 200 LOC each).
- **Phase 5: E2E Verification & LOC Invariant Audit**
  - Write focused tests in `proxy/tests/` for tool parser and context compactor.
  - Build frontend (`npm run build`) with zero TypeScript errors.
  - Run full repository-wide LOC audit verifying 100% compliance (< 200 LOC).

---

## 6. Strategic Verdict

**Approve Option 3 (Unified Hybrid Factory Portal & Tool Runner)** as the optimal, high-leverage implementation for Gate 7. It delivers immediate visual control for the developer while strengthening local open-weight model autonomy on Apple Silicon hardware.
