# Phase 3: REST & SSE Endpoints and Next.js SwarmConsole

## Overview
Expose swarm management routes under `/v1/factory/swarm/*` and implement the cyber-minimalist dark Next.js `SwarmConsole.tsx` operator component.

## Files
- `proxy/src/workflow/routes-swarm.js` (< 200 LOC)
- `frontend/src/types/swarm.ts` (< 200 LOC)
- `frontend/src/lib/zenos-swarm-client.ts` (< 200 LOC)
- `frontend/src/components/SwarmConsole.tsx` (< 200 LOC)
- `frontend/src/app/page.tsx` (update to mount `SwarmConsole`)
- `proxy/tests/swarm-routes.test.js` (< 200 LOC)

## Endpoints
- `POST /v1/factory/swarm/run`: Launch a swarm session with `{ objective, maxRounds, workspaceDir }`.
- `GET /v1/factory/swarm/sessions`: List past swarm sessions.
- `GET /v1/factory/swarm/sessions/:id`: Get full session detail with artifacts and consensus status.
- SSE events: `swarm_turn_start`, `swarm_artifact_posted`, `swarm_consensus_eval`, `swarm_session_complete`.

## Frontend UI
- Active role pipeline badge (Architect -> Coder -> Verifier -> Auditor).
- Dual-key visual lock status (Verifier Key + Auditor Key).
- Expandable artifact ledger viewer (Spec, Code Diff, Test Output, Audit Report).
- Real-time SSE streaming updates.
