---
title: "Phase 1: Architectural Risk Index (ARI) Calculator"
status: complete
---

# Phase 1: Architectural Risk Index (ARI) Calculator

## Requirements
- Pure Node.js (`node:fs`, `node:path`).
- Computes quantitative ARI based on:
  - Blast Radius ($BR$) from `BlastRadiusEngine`.
  - Cyclomatic Complexity ($CC$) from `ComplexityEngine`.
  - Invariant Risk ($IR$) evaluating file size delta, coupling factor, and facade barrel integrity.
  - Churn Probability ($CP$) estimating change impact across codebase history.
- Categorizes proposals into `SAFE` ($ARI < 30$), `CAUTION` ($30 \le ARI < 60$), `CRITICAL` ($ARI \ge 60$).
- Strictly < 200 LOC per file.

## Status
- Module: `proxy/src/workflow/ari-calculator.js` (72 LOC).
- Test: `proxy/tests/ari-calculator.test.js` (54 LOC).
- Result: 5/5 tests passing green.
