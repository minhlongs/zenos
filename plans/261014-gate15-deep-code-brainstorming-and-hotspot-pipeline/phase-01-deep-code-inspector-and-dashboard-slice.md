---
title: "Phase 1: DeepCodeInspector & Dashboard Monolith Slicing"
status: in_progress
---

# Phase 1: DeepCodeInspector & Dashboard Monolith Slicing

## Context Links
- `/Users/macbook/ZenOS/plans/reports/researcher-gate15-deep-brainstorming-backend.md`
- `/Users/macbook/ZenOS/proxy/src/workflow/complexity-engine.js`
- `/Users/macbook/ZenOS/proxy/src/workflow/blast-radius-engine.js`
- `/Users/macbook/ZenOS/proxy/src/dashboard-html.js`

## Requirements
- Create `proxy/src/workflow/deep-code-inspector.js` (< 140 LOC):
  - `inspectFile(targetFile)`: Combines `ComplexityEngine.analyzeFile` and `BlastRadiusEngine.calculateBlastRadius` to return live codebase telemetry (`totalLines`, `codeLines`, `branchingCount`, `fanIn`, `fanOut`, `maxDepth`, `exportsCount`, `detectedSeams`, `monolithScore`, `riskLevel`, `splitBlueprint`).
  - `proposeSeams(targetFile, metrics)`: Generates a concrete `splitBlueprint` (`originalFile`, `facadePath`, `extractedSubmodules` with `path`, `estimatedLoc`, `responsibility`).
  - `discoverHotspots(limit = 5)`: Scans workspace directory and returns the top refactoring hotspots ranked by combined `monolithScore` and `blastRadius`.
- Proactively slice `proxy/src/dashboard-html.js` (189 LOC) into:
  - `proxy/src/dashboard-client-script.js` (< 100 LOC) exporting `getDashboardClientScript()`.
  - `proxy/src/dashboard-html.js` (< 105 LOC) exporting `getDashboardHtml()`.
- Write deterministic tests in `proxy/tests/deep-code-inspector.test.js` (< 100 LOC).
