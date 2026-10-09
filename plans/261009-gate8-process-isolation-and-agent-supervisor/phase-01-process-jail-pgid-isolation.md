# Phase 1: Process Jail & PGID Tree Isolation

## Overview
Implement `proxy/src/workflow/process-jail.js` to execute child processes in detached Process Groups, ensuring 100% of child and grandchild processes are terminated on timeout or abort via `process.kill(-pgid, signal)`.

## Requirements
- Spawn child execution with `detached: true`.
- Support configurable timeout with dead-man timer escalation (`SIGTERM` -> grace period -> `SIGKILL`).
- Capture stdout, stderr, and exit codes.
- Zero external dependencies (`node:child_process`, `node:events`).
- Strictly < 200 LOC.

## Files
- Create: `proxy/src/workflow/process-jail.js`
- Create: `proxy/tests/process-jail.test.js`
