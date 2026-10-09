---
phase: 1
title: "command-risk-classifier"
status: complete
effort: "medium"
---

# Phase 1: Command Risk Classifier & Safety Policy

## Overview
Implement `proxy/src/command-guard.js` to inspect and classify shell and tool commands into distinct security tiers:
- `SAFE`: read-only inspection (e.g. `ls`, `cat`, `git status`, `git diff`, `pwd`, `node -v`, `grep`, `wc`).
- `MUTATING`: normal build and development (e.g. `npm test`, `git add`, `touch`, `mkdir`, `npm run build`).
- `DANGEROUS`: destructive or irreversible changes requiring explicit human confirmation (e.g. `rm -rf`, `git reset --hard`, `git clean -fd`, `chmod 777`, `kill -9`).
- `BLOCKED`: catastrophic or unrecoverable system attacks (e.g. `rm -rf /`, `rm -rf /*`, fork bombs, dumping `~/.ssh/id_rsa`).

## Status: Complete
- Created `proxy/src/command-guard.js` (101 LOC).
- Created `proxy/tests/command-guard.test.js` (82 LOC).
- 5/5 tests passing.
