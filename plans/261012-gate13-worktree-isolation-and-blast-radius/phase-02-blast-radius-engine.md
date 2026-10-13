# Phase 2: Dependency Cartography & Blast Radius Engine (`BlastRadiusEngine`)

## Context Links
- Plan: [plan.md](./plan.md)
- Research: [researcher-gate13-dependency-cartography-and-blast-radius.md](../reports/researcher-gate13-dependency-cartography-and-blast-radius.md)
- Complexity Engine: `proxy/src/workflow/complexity-engine.js`

## Overview
Implement `BlastRadiusEngine` to scan JavaScript and TypeScript files, extract an in-memory directed dependency graph (adjacency list), and compute quantitative blast radius impact indices for any target file.

## Requirements
- Parse `require(...)`, `import ... from ...`, `export ... from ...` using pure lexical regex scanning.
- Resolve relative local file paths to normalized workspace paths.
- Compute fan-in (callers importing the target) and fan-out (dependencies imported by the target).
- Compute transitive depth via BFS/DFS traversal and detect dependency cycles.
- Calculate Blast Radius score: $BR = (\text{Depth} \times \text{CouplingFactor}) + \text{ExposureMultiplier}$.
- Categorize risk into `SAFE` ($BR < 20$), `CAUTION` ($20 \le BR < 50$), and `CRITICAL` ($BR \ge 50$).
- Strict `< 200 LOC` per file with 0 external npm dependencies.

## Related Code Files
- Create: `proxy/src/workflow/blast-radius-engine.js`
- Create: `proxy/tests/blast-radius-engine.test.js`

## Implementation Steps
1. Build lexical import/export path resolver for CommonJS and ESM.
2. Build `buildDependencyGraph(rootDir)` traversing workspace files.
3. Compute transitive upstream callers and downstream dependencies.
4. Calculate Blast Radius metric and risk level.
5. Implement unit tests in `proxy/tests/blast-radius-engine.test.js`.
