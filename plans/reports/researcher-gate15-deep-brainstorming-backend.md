# Research & Technical Specification: Gate 15 Deep Code-Introspective Brainstorming & Dashboard Modularization

## 1. Executive Summary
Gate 15 elevates ZenOS from static heuristic-based architectural brainstorming to **Deep Code-Introspective Brainstorming & Socratic Cross-Examination (`/brainstorming --deep`)**. By uniting `ComplexityEngine` (`analyzeFile`, `analyzeDirectory`) and `BlastRadiusEngine` (`calculateBlastRadius`) into a unified `DeepCodeInspector`, the system automatically extracts real codebase metrics (LOC, branching count, fan-in, fan-out, transitive upstream, exports count, sliceable seams) and powers a rigorous **5-Turn Socratic Protocol** (`ADVOCATE` -> `ADVERSARY` -> `CROSS_EXAMINER` Socratic Seam Audit -> `REBUTTAL` -> `SYNTHESIZER`) with Pareto strategy ranking. Additionally, the largest monolith in the repository (`proxy/src/dashboard-html.js`, 189 LOC) is decomposed into `dashboard-html.js` (< 110 LOC) and `dashboard-client-script.js` (< 100 LOC), preserving 100% test compatibility.

---

## 2. DeepCodeInspector Architecture (`proxy/src/workflow/deep-code-inspector.js`)
- **Purpose**: Unifies static AST/lexical metrics and dependency cartography into a single queryable inspector.
- **Key Methods**:
  - `inspectFile(targetFile)`: Merges `ComplexityEngine.analyzeFile(targetFile)` with `BlastRadiusEngine.calculateBlastRadius(targetFile)` to yield a unified telemetry object (`{ totalLines, codeLines, branchingCount, branchingDensity, fanIn, fanOut, maxDepth, hasCycle, transitiveUpstream, transitiveDownstream, exportsCount, monolithScore, riskLevel }`).
  - `discoverHotspots(limit = 10)`: Scans the workspace directory via `BlastRadiusEngine.analyzeWorkspace()` and `ComplexityEngine.analyzeDirectory()`, ranking files by combined monolith score and blast radius to identify top refactoring hotspots.
  - `proposeSeams(targetFile)`: Analyzes export count, function boundaries, and branching clusters in `targetFile` to compute recommended sliced module sub-files (e.g. `[ { moduleName: 'core', estLoc: 85 }, { moduleName: 'handlers', estLoc: 95 } ]`).

---

## 3. BrainstormEngine & DebateProtocol `--deep` Mode Extensions
- **Deep Socratic Protocol (5 Turns)**:
  1. `ADVOCATE`: Velocity & decoupling champion proposing modular decomposition.
  2. `ADVERSARY`: Invariant & safety inquisitor assessing blast radius and dependency cycles.
  3. `CROSS_EXAMINER`: Socratic questioning & seam audit examining whether extracted submodules maintain strict < 200 LOC ceilings and zero circular imports.
  4. `REBUTTAL`: Defends the proposed architectural seams against adversary warnings.
  5. `SYNTHESIZER`: Pareto consensus arbitrator ranking strategies via `AriCalculator` and producing concrete slicing blueprints.
- **Auto-Hotspots Endpoint (`POST /v1/factory/brainstorm/auto-hotspots`)**:
  - Automatically scans workspace hotspots using `DeepCodeInspector.discoverHotspots()`.
  - Automatically triggers deep brainstorming sessions for the top $N$ candidates, returning structured JSON containing ranked strategies, ARI scores, and recommended sliced modules.

---

## 4. Slicing Blueprint for `proxy/src/dashboard-html.js`
- **Current State**: 189 LOC (monolithic HTML template with embedded CSS and client-side JavaScript).
- **Target State**:
  - `proxy/src/dashboard-html.js` (~85 LOC): Exports `getDashboardHtml()` which interpolates or requires `getDashboardClientScript()`.
  - `proxy/src/dashboard-client-script.js` (~95 LOC): Exports `getDashboardClientScript()` returning the vanilla JavaScript string for SSE telemetry, approvals table rendering, and Jails supervision.
- **Compatibility**: Both files maintain exact DOM element IDs (`#active-jails`, `#total-req`, `#active-req`, `#latency-stats`, `#error-rate`, `#approvals-tbody`, `#events-log`) and endpoint contracts (`/dashboard/api/overview`, `/v1/approvals/...`, `/v1/telemetry/events`), ensuring 100% green test suite.

---

## 5. Unresolved Questions
None. All architectural contracts align with ZenOS strict invariants (< 200 LOC per file, zero external dependencies, robust async SSE streaming).

Status: DONE
Summary: Researched and designed the backend specification for Gate 15 Deep Code-Introspective Brainstorming (`/brainstorming --deep`), 5-turn Socratic cross-examination, auto-hotspots endpoint, and dashboard HTML modularization.
