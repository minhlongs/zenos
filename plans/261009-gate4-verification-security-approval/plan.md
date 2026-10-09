---
title: "Gate 4: Verification, Security, and Human Approval Boundaries"
description: "Comprehensive security boundaries, command risk classification, path traversal jail, SSRF filters, and human approval interlocks."
status: complete
priority: P1
branch: "main"
tags: [security, sandbox, human-in-the-loop, approval, path-jail, ssrf, tdd]
blockedBy: ["261009-gate3-durable-task-state-and-memory"]
blocks: []
created: "2026-10-09T19:00:00.000Z"
createdBy: "ck:plan"
source: skill
---

# Gate 4: Verification, Security, and Human Approval Boundaries

## Overview

Architect and implement the security foundation and execution boundaries for ZenOS local workstation.
This gate establishes containment for local-first tool and model operations:
1. **Command Risk Classifier (`command-guard.js`)**: Categorize tool/bash commands into `SAFE`, `MUTATING`, `DANGEROUS`, and `BLOCKED` tiers.
2. **Workspace Path Jail (`path-guard.js`)**: Guard against path traversal, symlink escapes, and unauthorized access outside designated workspace roots.
3. **Human Approval Engine (`approval-gate.js`)**: Mandatory human confirmation interlock with TTL expiration for destructive actions (`rm -rf`, `git reset --hard`, destructive scripts).
4. **SSRF & Upstream Validator (`ssrf-guard.js`)**: Protect local runtime against SSRF, cloud IMDS, and forbidden network pivoting.
5. **Security & Approval Endpoints (`routes-security.js`)**: Expose `/v1/approvals` and `/v1/security/evaluate` REST contracts mounted into the proxy.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [command-risk-classifier](./phase-01-command-risk-classifier.md) | Complete |
| 2 | [workspace-path-jail](./phase-02-workspace-path-jail.md) | Complete |
| 3 | [ssrf-and-upstream-guard](./phase-03-ssrf-and-upstream-guard.md) | Complete |
| 4 | [human-approval-engine](./phase-04-human-approval-engine.md) | Complete |
| 5 | [routes-and-verification](./phase-05-routes-and-verification.md) | Complete |

## Architectural Invariants

1. **Zero External Dependencies**: Native Node.js built-ins (`node:path`, `node:crypto`, `node:fs`, `node:url`, `node:net`).
2. **Strict File LOC Bounds**: All source and test modules strictly < 200 lines of code.
3. **Fail-Closed Security**: Default deny on ambiguous commands, unresolvable paths, or unapproved destructive operations.
4. **Deterministic TDD**: 100% test coverage with automated unit, edge-case, and attack payload tests.
