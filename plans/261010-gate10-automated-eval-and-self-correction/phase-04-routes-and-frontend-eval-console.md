# Phase 4: Factory REST/SSE Endpoints & Frontend Eval Console

## Context Links
- Plan: [plan.md](./plan.md)
- Evaluation Runner: [phase-03-eval-runner-and-sqlite-store.md](./phase-03-eval-runner-and-sqlite-store.md)

## Requirements
1. **`routes-factory.js` Expansion**:
   - `GET /v1/factory/eval/benchmarks`: Returns available micro-benchmarks.
   - `POST /v1/factory/eval/run`: Triggers benchmark evaluation in background with options `{ benchmarkId, maxRetries }`.
   - `GET /v1/factory/eval/runs`: Returns past evaluation runs.
   - `GET /v1/factory/eval/runs/:id`: Returns details of a specific evaluation run.
   - Dispatches SSE events via `/v1/factory/events` (`eval_start`, `eval_case_start`, `eval_case_critique`, `eval_case_repair`, `eval_case_complete`, `eval_summary`).
2. **`EvalConsole.tsx`**:
   - Dark-mode cyber-minimalist Next.js operator component.
   - Benchmark selection (Run All vs Single).
   - Real-time Pass@1, Recovery Rate, and Latency metric cards.
   - Live streaming terminal log of critiques, test failures, and surgical fixes.
   - Zero `:any` types; clean Tailwind styling. Mounted in `frontend/src/app/page.tsx`.

## Target Files
- Modify `proxy/src/workflow/routes-factory.js` (maintain < 200 LOC)
- Create `frontend/src/components/EvalConsole.tsx` (< 200 LOC)
- Modify `frontend/src/app/page.tsx`
- Modify `frontend/src/types/zenos.ts` & `frontend/src/lib/zenos-client.ts`
