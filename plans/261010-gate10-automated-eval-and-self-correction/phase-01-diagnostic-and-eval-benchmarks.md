# Phase 1: Diagnostic Extractor & SWE Micro-Benchmark Suite

## Context Links
- Plan: [plan.md](./plan.md)
- Brainstorming Report: [brainstorm-20261009-gate10-eval-and-self-correction.md](../reports/brainstorm-20261009-gate10-eval-and-self-correction.md)

## Requirements
1. **`diagnostic-extractor.js`**:
   - Parses `stderr`, test assertion failures (from `node --test` or test runners), and syntax/LOC errors.
   - Extracts top 3-5 lines of stack trace without flooding context.
   - Reads 5 lines before and after the fault line if source file is identifiable.
   - Returns a structured diagnostic payload: `{ faultFile, faultLine, failureMessage, stackSnippet, codeContext }`.
2. **`eval-benchmarks.js`**:
   - Implements 5 deterministic SWE micro-benchmarks:
     1. `bug_sort_null`: Fix numeric sorting with null/undefined handling.
     2. `api_request_validator`: Express-style JSON request validator (400 vs 200).
     3. `refactor_loc_guard`: Flatten nested conditionals to meet LOC criteria.
     4. `test_generator_crud`: Generate missing unit tests for a CRUD state machine.
     5. `json_transform_stream`: Transform nested JSON into flat key-value records.
   - Provides methods: `listBenchmarks()`, `getBenchmark(id)`, and `createWorkspace(benchmarkId, targetDir)`.

## Target Files
- Create `proxy/src/workflow/diagnostic-extractor.js` (< 200 LOC)
- Create `proxy/src/workflow/eval-benchmarks.js` (< 200 LOC)
- Create `proxy/tests/diagnostic-extractor.test.js` (< 200 LOC)
- Create `proxy/tests/eval-benchmarks.test.js` (< 200 LOC)
