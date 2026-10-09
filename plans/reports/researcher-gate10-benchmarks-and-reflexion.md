# Research Report: Local Agent Benchmarks & Reflexion Suite

## 1. Micro-Benchmarks (Apple Silicon, <30s, `node --test`)
Targeted deterministic units focusing on M-series inference throughput:
1. **Algorithmic Fix:** Sort validation with edge-case null handling (Time: ~1.2s).
2. **API Handler:** Express-like request validator (400 vs 200) for schema-defined payloads (Time: ~1.8s).
3. **LOC Refactor:** Flatten nested conditional logic in config builder (Time: ~1.5s).
4. **Test Gen:** Generate missing CRUD coverage for valid Zod schemas (Time: ~3.5s).
5. **Schema Validation:** JSON-to-interface parsing & constraint verification (Time: ~1.0s).

## 2. Self-Correction & Reflexion Pattern
Utilize **"Mini-Stack Extraction"**:
- **Strategy:** Isolate top 3 lines of stack trace + 5 lines surrounding `ERROR_LINE` from `fs.readFileSync`.
- **System Prompt:** "Error: {extracted_stack}. Task: {original_task}. Critique: Identify one logical flaw. Propose minimal edit to resolve."
- **Benefit:** Prevents context explosion by stripping deep dependencies while preserving local semantic fault.

## 3. SQLite TaskStore Scoring
Schema: `executions (id, task, pass_bool, token_cost, repair_attempts, duration_ms)`.
- **Pass@1:** `COUNT(pass_bool=1) / COUNT(*)`.
- **Recovery Rate:** `SUM(repair_attempts > 0 AND pass_bool=1) / SUM(repair_attempts > 0)`.
- **Token Efficiency:** `SUM(tokens) / COUNT(pass_bool=1)`.

## 4. Compliance & Constraints
- **Zero Dependencies:** Use standard `node:test`, `node:assert`, `node:fs`, `node:sqlite`.
- **Architecture:** Monolithic file-slicing logic applied to benchmarks; max 200 LOC per benchmark script.

---
Status: DONE
Summary: Established a deterministic micro-benchmark suite and a localized extraction pattern for self-repair to optimize Apple Silicon inference cycles. Ready for implementation.
Work context: /Users/macbook/ZenOS
Reports: /Users/macbook/ZenOS/plans/reports/
Plans: /Users/macbook/ZenOS/plans/
