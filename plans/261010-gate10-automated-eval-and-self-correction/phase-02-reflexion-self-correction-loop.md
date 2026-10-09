# Phase 2: Reflexion Self-Correction Loop Engine

## Context Links
- Plan: [plan.md](./plan.md)
- Diagnostics: [phase-01-diagnostic-and-eval-benchmarks.md](./phase-01-diagnostic-and-eval-benchmarks.md)

## Requirements
1. **`reflexion-loop.js`**:
   - Manages the multi-turn Critique-Revision self-healing cycle when code fails verification.
   - Accepts an initial task, workspace root, test runner function, and model client.
   - On test failure:
     1. Uses `DiagnosticExtractor` to generate a concise failure diagnostic.
     2. Generates a focused critique prompt: explains root cause without bloating tokens.
     3. Prompts model to generate a targeted patch or edit.
     4. Applies fix using `ToolHarness` or string replacement.
     5. Re-runs verification until PASS or `maxRetries` (default: 3) reached.
   - Emits events: `reflexion_start`, `reflexion_critique`, `reflexion_patch`, `reflexion_verified`, `reflexion_complete`.
   - Returns execution summary: `{ success, attempts, initialPassed, finalPassed, history }`.

## Target Files
- Create `proxy/src/workflow/reflexion-loop.js` (< 200 LOC)
- Create `proxy/tests/reflexion-loop.test.js` (< 200 LOC)
