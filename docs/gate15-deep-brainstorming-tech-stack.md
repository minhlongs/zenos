# Gate 15: Deep Code-Introspective Brainstorming & Hotspot Auto-Refactor Pipeline (`/brainstorming --deep`)

## 1. Architectural Overview
Gate 15 elevates ZenOS's Architectural Brainstorming Engine from heuristic parameters to live AST/lexical codebase introspection and 5-turn Socratic Cross-Examination (`/brainstorming --deep`), paired with proactive monolith slicing (`proxy/src/dashboard-html.js` decomposed from 189 LOC into `dashboard-html.js` + `dashboard-client-script.js`).

## 2. Core Tech Stack & Invariants
- **Runtime**: Node.js 22+ native standard library (`node:fs`, `node:path`, `node:events`, `node:crypto`).
- **Zero External Proxy Dependencies**: 100% self-contained static analysis and dependency cartography.
- **Strict File Size Ceiling**: Every backend and frontend file strictly `< 200 LOC`.
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript 5 (`0 :any` types), Tailwind CSS v4.
- **Hardware Safety**: Cooperative event-loop tick yields between Socratic turns to preserve Apple Silicon Metal GPU responsiveness.

## 3. Core Modules
1. **`DeepCodeInspector` (`proxy/src/workflow/deep-code-inspector.js`)**:
   - Unites `ComplexityEngine` (`analyzeFile`, `analyzeDirectory`) and `BlastRadiusEngine` (`calculateBlastRadius`) to extract live telemetry (`totalLines`, `codeLines`, `branchingCount`, `fanIn`, `fanOut`, `maxDepth`, `exportsCount`, `detectedSeams`, `monolithScore`).
   - `proposeSeams(targetFile)`: Identifies function/method boundaries and generates a concrete `splitBlueprint` (`originalFile`, `extractedSubmodules` with target path, estimated LOC, and responsibility, plus `facadePath`).
   - `discoverHotspots(limit)`: Scans workspace files and ranks the top refactoring candidates by combined monolith score and blast radius.
2. **5-Turn Deep Socratic Protocol (`proxy/src/workflow/debate-protocol.js` & `brainstorm-engine.js`)**:
   - `ADVOCATE` -> `ADVERSARY` -> `CROSS_EXAMINER` (Socratic Seam Audit) -> `REBUTTAL` -> `SYNTHESIZER`.
   - `autoBrainstormHotspots(limit)`: Scans top codebase hotspots and runs deep Socratic sessions automatically.
3. **Dashboard Monolith Slicing (`proxy/src/dashboard-html.js` & `dashboard-client-script.js`)**:
   - Decomposes the 189 LOC `dashboard-html.js` into `dashboard-html.js` (~100 LOC) and `dashboard-client-script.js` (~95 LOC) with 100% test compatibility.
4. **Modular Next.js Deep Brainstorm Console (`BrainstormConsole.tsx` + `BrainstormStrategyPanel.tsx`)**:
   - Live Codebase Telemetry Pill (`LOC`, `CCN`, `Fan-In/Out`, `Seams`), `--deep` mode toggle, one-click **"Auto-Scan & Brainstorm Hotspots"**, 5-turn Socratic transcript, and Module Split Blueprint preview.
