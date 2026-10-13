# Phase 1: Zero-Dependency Git Worktree Isolation Harness (`WorktreeJail`)

## Context Links
- Plan: [plan.md](./plan.md)
- Research: [researcher-gate13-worktree-isolation-and-pr-stager.md](../reports/researcher-gate13-worktree-isolation-and-pr-stager.md)
- Rules: `docs/code-standards.md`, `docs/development-rules.md`

## Overview
Implement `WorktreeJail` using native `node:child_process` and `node:fs` to create, list, inspect, and safely prune ephemeral git worktrees for isolated agent execution.

## Requirements
- Create ephemeral worktree on dedicated branch: `git worktree add -b <branch> <targetPath> <baseCommit>`.
- Isolate workspace: support `.zenos/worktrees/` directory structure with automatic `.gitignore` protection.
- List active worktrees with branch names, head commits, and paths.
- Remove worktrees cleanly: `git worktree remove --force <targetPath>` and `git worktree prune`.
- Strict `< 200 LOC` per file with 0 external npm dependencies.

## Related Code Files
- Create: `proxy/src/workflow/worktree-jail.js`
- Create: `proxy/tests/worktree-jail.test.js`

## Implementation Steps
1. Create `WorktreeJail` class wrapping `execFileSync` / `execFile` from `node:child_process`.
2. Implement `createWorktree({ id, baseBranch })`.
3. Implement `listWorktrees()`.
4. Implement `removeWorktree(id, { deleteBranch })`.
5. Implement unit tests in `proxy/tests/worktree-jail.test.js` using a temporary git repo.
