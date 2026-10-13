---
title: "Phase 3: Brainstorm Routes and Factory Mount"
status: complete
---

# Phase 3: Brainstorm Routes & Factory Mount

## Requirements
- Sub-router `routes-brainstorm.js` mounted at `/v1/factory/brainstorm/*`.
- Endpoints:
  - `POST /start`: Launch Socratic debate on specified target file or goal.
  - `GET /sessions`: List active and historical brainstorming sessions.
  - `GET /session/:id`: Fetch session details, debate transcript, and candidate strategies.
  - `POST /dispatch-zen`: Convert chosen Pareto strategy into executable `/zen` plan or spin ephemeral worktree.
- Integrates with `routes-factory.js` and Server-Sent Events broadcasting.
- Strictly < 200 LOC per file.

## Status
- Modules:
  - `proxy/src/workflow/routes-brainstorm.js` (71 LOC).
  - `proxy/src/workflow/routes-goal.js` (59 LOC - sliced from factory to preserve < 200 LOC).
  - `proxy/src/workflow/routes-factory.js` (122 LOC).
- Test: `proxy/tests/routes-brainstorm.test.js` (73 LOC).
- Result: 5/5 tests passing green.
