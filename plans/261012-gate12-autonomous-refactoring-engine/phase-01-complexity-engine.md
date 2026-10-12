# Phase 1: Lightweight Code Complexity Engine & Metrics Analyzer

## Context Links
- Plan: [plan.md](./plan.md)
- Research: [researcher-gate12-complexity-heatmaps-and-self-healing.md](../reports/researcher-gate12-complexity-heatmaps-and-self-healing.md)
- Research: [researcher-gate12-ast-refactoring-engine.md](../reports/researcher-gate12-ast-refactoring-engine.md)
- Existing Reference: `proxy/src/workflow/loc-guard.js:31` (`validateFile`)

## Overview
Implement `proxy/src/workflow/complexity-engine.js` as a pure Node.js (zero external dependencies) static analysis module. It inspects JavaScript (`.js`, `.jsx`, `.mjs`, `.cjs`) and TypeScript (`.ts`, `.tsx`) source files to measure physical lines of code, code lines excluding comments/blank lines, branching keyword density, module coupling (fan-in and fan-out), and an aggregated Monolith Risk Score (0-100).

## Requirements

### 1. File Inspection & Line Categorization
- Read files using `node:fs` synchronously or streaming.
- Strip block comments (`/* ... */`) and single-line comments (`// ...`) cleanly without external parsers.
- Count:
  - `totalLines`: Raw line count (`\n`).
  - `codeLines`: Executable non-blank, non-comment lines.
  - `commentLines`: Lines containing comment text.
  - `blankLines`: Whitespace-only lines.

### 2. Branching Complexity (Cyclomatic Proxy)
- Tokenize/scan lines for decision points:
  - Keywords: `if`, `else if`, `switch`, `case`, `for`, `while`, `catch`, `do`.
  - Expressions: `&&`, `||`, `??`, ternary operator `?`.
  - Callback iterations: `.map(`, `.filter(`, `.reduce(`, `.forEach(`.
- Compute `branchingCount` and `branchingDensity` (`branchingCount / max(1, codeLines)`).

### 3. Coupling Analysis (AST-Lite Imports & Exports)
- Scan for import signatures:
  - ES Imports: `import ... from '...'` and dynamic `import('...')`.
  - CommonJS: `require('...')`.
- Scan for export signatures:
  - `export default`, `export const/function/class`, `module.exports =`, `exports.xyz =`.
- Calculate:
  - `fanOut`: Count of unique modules imported/required by this file.
  - `exportsCount`: Count of symbols exported by this file.

### 4. Monolith Risk Score Formulation
Compute a normalized score between 0 and 100:
```
score = Math.min(100, Math.round(
  (Math.min(totalLines, 500) / 200 * 40) +
  (Math.min(branchingCount, 50) / 15 * 40) +
  (Math.min(fanOut, 20) / 10 * 20)
))
```
- `riskLevel`:
  - `CRITICAL`: score >= 75 or totalLines >= 250
  - `HIGH`: score >= 50 or totalLines >= 200
  - `MODERATE`: score >= 25
  - `LOW`: score < 25

### 5. Directory Traversal & Summary
- `analyzeFile(filePath)`: Analyzes a single file and returns structured metrics.
- `analyzeDirectory(dirPath, options = {})`: Recursively scans `.js`, `.ts`, `.tsx`, `.jsx` (ignoring `node_modules`, `.git`, `.next`, `dist`, `coverage`), returning:
  - `files`: Array of file metrics sorted descending by `monolithScore`.
  - `summary`: `{ totalFiles, totalLines, averageComplexity, highRiskFilesCount, workspaceHealthScore }`.

## Related Code Files
- Create: `proxy/src/workflow/complexity-engine.js` (< 200 LOC)
- Create: `proxy/tests/complexity-engine.test.js` (< 200 LOC)

## Implementation Steps
1. Create `proxy/src/workflow/complexity-engine.js`:
   - Implement comment-stripping regex helper without catastrophic backtracking.
   - Implement `countLines(source)` returning `{ totalLines, codeLines, commentLines, blankLines }`.
   - Implement `countBranching(source)` identifying keyword matches and ternary operators.
   - Implement `extractCoupling(source)` parsing `require(...)` and `import ... from '...'`.
   - Implement `calculateMonolithScore({ totalLines, branchingCount, fanOut })`.
   - Implement `analyzeFile(filePath)` and `analyzeDirectory(dirPath, options)`.
2. Ensure strict adherence to `< 200 LOC` invariant in `complexity-engine.js`.
3. Create `proxy/tests/complexity-engine.test.js`:
   - Unit test with mock code samples: single-line comments, multi-line comments, chained ternaries, complex imports.
   - Verify calculation correctness and boundary condition handling.
   - Run tests with `node --test proxy/tests/complexity-engine.test.js`.

## Success Criteria
- [ ] `complexity-engine.js` is under 200 LOC.
- [ ] Accurate calculation of LOC, branching density, fan-out, and monolith risk score.
- [ ] Ignored folders (`node_modules`, `.git`, `.next`) are respected.
- [ ] 100% test coverage in `proxy/tests/complexity-engine.test.js` passing with 0 errors.

## Risk Assessment & Mitigation
- **Risk**: Regex comment stripper breaks on strings containing `//` or `/*` (e.g., URLs).
- **Mitigation**: Use a lightweight character-level or token-based scanner state machine for comment blocks to avoid falsely stripping string literals.
