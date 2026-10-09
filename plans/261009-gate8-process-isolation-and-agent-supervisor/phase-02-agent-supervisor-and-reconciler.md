# Phase 2: Agent Supervisor & SQLite Crash Reconciler

## Overview
Implement `proxy/src/workflow/agent-supervisor.js` to manage background heartbeat tracking, monitor active tasks, and reconcile in-flight states upon daemon startup.

## Requirements
- Periodically check active tasks and update `last_active_ts` in SQLite `task_checkpoints`.
- Reconcile orphaned tasks on startup: find tasks in `COOKING` or `PLANNING` state without recent heartbeat and transition to `INTERRUPTED`.
- Provide programmatic interface to register/unregister running tasks and track active PIDs.
- Zero external dependencies (`node:sqlite`, `node:events`).
- Strictly < 200 LOC.

## Files
- Create: `proxy/src/workflow/agent-supervisor.js`
- Create: `proxy/tests/agent-supervisor.test.js`
