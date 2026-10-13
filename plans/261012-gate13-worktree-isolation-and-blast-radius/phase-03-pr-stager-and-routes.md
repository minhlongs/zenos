# Phase 3: Automated PR Stager, Dual-Key Consensus & REST Endpoints

## Context Links
- Plan: [plan.md](./plan.md)
- Swarm Consensus: `proxy/src/workflow/consensus-gate.js`
- Factory Router: `proxy/src/workflow/routes-factory.js`

## Overview
Implement `PrStager` for automated conventional commit creation, diff summaries, and Dual-Key consensus gating, exposed via `/v1/factory/worktree` REST and SSE endpoints.

## Requirements
- Formulate structured Conventional Commits (`feat(...)`, `fix(...)`, `refactor(...)`).
- Generate file diff summaries between ephemeral worktree branch and base branch.
- Dual-Key consensus enforcement: Key 1 (`ProcessJail` test run pass in worktree) + Key 2 (LOC & Blast Radius invariant audit pass).
- REST endpoints:
  - `GET /v1/factory/worktree/list`
  - `POST /v1/factory/worktree/create`
  - `DELETE /v1/factory/worktree/:id`
  - `POST /v1/factory/worktree/blast-radius`
  - `POST /v1/factory/worktree/stage-pr`
  - `POST /v1/factory/worktree/promote`
- SSE event streaming on `/v1/factory/events` (`worktree_created`, `worktree_removed`, `pr_staged`).
- Strict `< 200 LOC` per file with 0 external npm dependencies.

## Related Code Files
- Create: `proxy/src/workflow/pr-stager.js`
- Create: `proxy/src/workflow/routes-worktree.js`
- Modify: `proxy/src/workflow/routes-factory.js`
- Create: `proxy/tests/routes-worktree.test.js`
