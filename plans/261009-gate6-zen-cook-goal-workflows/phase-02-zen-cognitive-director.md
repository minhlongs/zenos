# Phase 2: Zen Cognitive Director (`/zen`)

## Overview
Implement `proxy/src/workflow/zen-director.js`:
- Complexity scoring (1-5) based on intent heuristics, file count, and architectural risk.
- Intelligent model routing: score <= 3 to local Apple Silicon LLM (e.g., `qwen2.5-coder-14b`), score > 3 to cloud frontier model.
- Generation of structured TDD execution plan with test assertions and file mutation targets.

## Requirements
- `evaluateComplexity(prompt)` returns `{ score, rationale, route }`.
- `planExecution(prompt, options)` produces structured JSON plan with phases and test specs.
- Pure Node.js built-ins.
- Strict `< 200 LOC` invariant.

## Related Files
- Create: `proxy/src/workflow/zen-director.js`
- Create: `proxy/tests/zen-director.test.js`
