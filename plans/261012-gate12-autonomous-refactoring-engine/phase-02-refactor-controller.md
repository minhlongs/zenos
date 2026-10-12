# Phase 2: AST-Guided Refactor Controller & Consensus Gating Pipeline

## Context Links
- Plan: [plan.md](./plan.md)
- Phase 1: [phase-01-complexity-engine.md](./phase-01-complexity-engine.md)
- Research: [researcher-gate12-ast-refactoring-engine.md](../reports/researcher-gate12-ast-refactoring-engine.md)
- Existing Reference: `proxy/src/workflow/consensus-gate.js:3` (`ConsensusGate`)
- Existing Reference: `proxy/src/workflow/cook-runner.js:10` (`CookRunner`)
- Existing Reference: `proxy/src/workflow/loc-guard.js:48` (`validateFiles`)
- Existing Reference: `proxy/src/workflow/process-jail.js:8` (`ProcessJail`)

## Overview
Implement `proxy/src/workflow/refactor-controller.js` to autonomously plan and execute module decomposition. The controller extracts AST-lite semantic nodes (classes, helper functions, types, constants), splits files exceeding the 200 LOC threshold into structured submodules, generates backward-compatible barrel facades, validates the refactoring via `CookRunner` inside a `ProcessJail`, submits the results to `ConsensusGate` for dual-key verification, and executes atomic rollback if any validation fails.

## Requirements

### 1. AST-Lite Node Extraction
- Implement a zero-dependency lexical block scanner that identifies top-level declarations:
  - Functions: `function name(...)`, `const name = (...) => ...`, `async function ...`
  - Classes: `class Name { ... }`
  - Constants / Config: `const CONFIG = { ... }`
  - Export statements: `module.exports = ...`, `export { ... }`, `export default ...`
- Collect dependencies between symbols (e.g., function `A` calls helper `B`).

### 2. Slicing Algorithm & Plan Generation
- Given a target file with `LOC > 200`:
  - Identify cohesive clusters: group functions that share internal calls into separate sub-units (e.g., `helpers.js`, `parsers.js`, `core.js`).
  - Generate a `RefactorPlan`:
    - `targetFile`: Original file path.
    - `newFiles`: Array of `{ relativePath, content, symbolsExported }`.
    - `barrelFacade`: Replacement for `targetFile` that re-exports all original public symbols to preserve backward compatibility.
    - `estimatedLocs`: Target LOC for each new file, strictly `<= 180 LOC`.

### 3. Execution Pipeline with Dual-Key Consensus Gate
- **Pre-execution Snapshot**: Record initial git working tree state or create file backups in a temporary `.refactor_backup` directory.
- **File Write**: Write generated submodules and barrel facade to disk.
- **Key 1 (Verifier)**:
  - Run test suite via `CookRunner.runCycle({ testCommand, targetFiles })`.
  - Tests must exit with status `0`.
- **Key 2 (Auditor)**:
  - Run `validateFiles(targetFiles)` via `loc-guard.js:48`.
  - Every created and modified file must have `lines <= 200`.
- **Consensus Evaluation**:
  - Feed results to `ConsensusGate.evaluate({ verifierResult, auditorResult })`.
  - If `status === 'APPROVED'`: commit refactor, clean up backup, return success.
  - If `status !== 'APPROVED'`: trigger rollback immediately.

### 4. Atomic Rollback Engine
- On any exception, syntax error, test failure, or consensus rejection:
  - Revert all modified files from `.refactor_backup` (or `git checkout/restore`).
  - Delete newly generated submodule files.
  - Emit failure diagnostic event with exact cause.

## Related Code Files
- Create: `proxy/src/workflow/refactor-controller.js` (< 200 LOC)
- Create: `proxy/tests/refactor-controller.test.js` (< 200 LOC)

## Implementation Steps
1. Create `proxy/src/workflow/refactor-controller.js`:
   - Import `ConsensusGate` from `./consensus-gate.js`.
   - Import `CookRunner` from `./cook-runner.js`.
   - Import `validateFiles` from `./loc-guard.js`.
   - Implement `extractDeclarations(source)` to locate top-level declarations and their line ranges.
   - Implement `generateSlicePlan(filePath, options)` building the modular split and barrel facade.
   - Implement `applyPlan(plan, options)`:
     - Snapshot target files.
     - Write extracted submodules and barrel facade.
     - Execute `CookRunner` test validation (Key 1).
     - Execute `validateFiles` LOC verification (Key 2).
     - Evaluate via `ConsensusGate`.
     - Roll back on failure or finalize on approval.
2. Ensure strict adherence to `< 200 LOC` invariant in `refactor-controller.js`.
3. Create `proxy/tests/refactor-controller.test.js`:
   - Test plan generation on a mock 300-line monolithic module.
   - Test successful decomposition into 2 submodules + 1 barrel facade.
   - Test dual-key consensus approval when tests and LOC pass.
   - Test automatic rollback when tests fail or LOC exceeds 200.
   - Run tests with `node --test proxy/tests/refactor-controller.test.js`.

## Success Criteria
- [ ] `refactor-controller.js` is under 200 LOC.
- [ ] Seamless integration with `ConsensusGate` (`consensus-gate.js:3`) and `CookRunner` (`cook-runner.js:10`).
- [ ] Generates valid barrel facades that preserve external contracts without breaking callers.
- [ ] Atomic rollback cleanly restores original files on failure.
- [ ] 100% test pass rate in `proxy/tests/refactor-controller.test.js`.

## Risk Assessment & Mitigation
- **Risk**: Circular dependencies between extracted submodules.
- **Mitigation**: Scan extracted submodule imports for circular references using a simple directed cycle check; extract shared types and constants into a dedicated `common.js` / `types.js` layer.
