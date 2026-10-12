---
name: gate12-complexity-heatmaps-and-self-healing
description: Research and design report for Gate 12 - ZenOS Autonomous Refactoring Engine
metadata:
  type: project
---

# Gate 12: Autonomous Refactoring Engine Research

## 1. Complexity Metrics (Pure Node.js)
- **LOC:** Parser-free `fs.readFileSync` line counting, categorizing via Regex (`//` / `/* */`).
- **Complexity Proxy:** Weighted sum of branching keywords (`if`, `switch`, `try`, `catch`, `for`, `while`, `map/filter/reduce` callbacks, `? :` ternary).
- **Coupling:** AST-lite static analysis for `import` statements; fan-in = incoming file references; fan-out = local/external dependencies.
- **Monolith Risk:** Score = `(LOC/200 * 0.4) + (Complexity/15 * 0.6)`. Threshold > 75 = HIGH RISK.

## 2. Verification & Safety Gating
- **CookRunner TDD Loop:**
    1. Snapshot workspace.
    2. Extract target module.
    3. Run `npm test`.
    4. Execute refactor module.
    5. Run `npm test` (Post-condition).
    6. Verify `LOC <= 200`.
- **ConsensusGate:** Dual-agent check (Agent A plans, Agent B validates invariant safety).
- **Rollback:** Atomic `git restore .` triggered via `child_process` on any non-zero exit code or post-refactor test failure.

## 3. Factory API (/v1/factory/refactor)
- `analyze`: Dir traversal + calculation + sorting by risk score.
- `plan`: AST-based module extraction plan (JSON format).
- `apply`: Execute stream with SSE updates (`/v1/factory/refactor/apply/stream`).

## 4. RefactorConsole.tsx (UI)
- **Dashboard:** Gauge chart (Workspace Health %), Monolith Table (Filename, LOC, Branching Density).
- **Viz:** D3-simplified graph view (Force-directed graph of folder coupling).
- **Status:** Witness-lock toggles for dual-key confirmation.

Status: DONE
Summary: Designed a lightweight AST-optional complexity engine using branching density and LOC tracking, coupled with a TDD-verified atomic refactoring loop. Implemented the architectural blueprint for the RefactorConsole factory UI and safety gating.
