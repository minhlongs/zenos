# Phase 1: Swarm Blackboard & Dual-Key Consensus Gate

## Overview
Implement the persistent SQLite blackboard state machine (`swarm-blackboard.js`) and the dual-key consensus validation logic (`consensus-gate.js`) using native `node:sqlite`.

## Files
- `proxy/src/workflow/swarm-blackboard.js` (< 200 LOC)
- `proxy/src/workflow/consensus-gate.js` (< 200 LOC)
- `proxy/tests/swarm-blackboard.test.js` (< 200 LOC)
- `proxy/tests/consensus-gate.test.js` (< 200 LOC)

## Key Invariants & Design
- Tables:
  - `swarm_sessions`: `id`, `objective`, `status` (`PLANNING`, `CODING`, `VERIFYING`, `AUDITING`, `CONSENSUS_REACHED`, `FAILED`), `created_at`, `updated_at`.
  - `swarm_artifacts`: `id`, `session_id`, `role`, `artifact_type` (`SPEC`, `CODE_DIFF`, `TEST_OUTPUT`, `AUDIT_REPORT`), `content`, `created_at`.
  - `swarm_consensus`: `session_id`, `verifier_pass` (INTEGER 0/1), `auditor_pass` (INTEGER 0/1), `verdict` (`PENDING`, `APPROVED`, `REJECTED`), `notes`, `updated_at`.
- `ConsensusGate`:
  - `evaluate(verifierResult, auditorResult)`: Requires `verifierResult.passed === true` AND `auditorResult.approved === true`.
  - Returns `{ approved: boolean, reason: string, details: object }`.
- Zero external dependencies.
