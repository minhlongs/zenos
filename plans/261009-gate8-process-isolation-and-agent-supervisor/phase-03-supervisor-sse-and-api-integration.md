# Phase 3: Supervisor REST & SSE Integration

## Overview
Connect `AgentSupervisor` and `ProcessJail` to the factory HTTP endpoints in `routes-factory.js` and `factory-engine.js`.

## Requirements
- Add `/v1/factory/supervisor/status` endpoint reporting active PGIDs, last heartbeat, and reconciled tasks.
- Stream supervisor events (`supervisor_heartbeat`, `supervisor_reconcile`, `process_jail_spawn`, `process_jail_kill`) through SSE (`/v1/factory/events`).
- Replace direct `execFile` in `cook-runner.js` with `ProcessJail` execution for bulletproof process tree containment.
- Strictly < 200 LOC per file.

## Files
- Modify: `proxy/src/workflow/routes-factory.js`
- Modify: `proxy/src/workflow/cook-runner.js`
- Create: `proxy/tests/supervisor-integration.test.js`
