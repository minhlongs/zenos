# Phase 2: Swarm Role Definitions & Turn-Based Orchestrator

## Overview
Implement the 4 specialized agent role personas (`swarm-roles.js`) and the sequential state machine coordinator (`swarm-orchestrator.js`).

## Files
- `proxy/src/workflow/swarm-roles.js` (< 200 LOC)
- `proxy/src/workflow/swarm-orchestrator.js` (< 200 LOC)
- `proxy/tests/swarm-roles.test.js` (< 200 LOC)
- `proxy/tests/swarm-orchestrator.test.js` (< 200 LOC)

## Key Roles
1. **ARCHITECT**: Emits structured specification (acceptance criteria, target files, test requirements).
2. **CODER**: Produces code changes / diffs adhering to `< 200 LOC` constraint.
3. **VERIFIER**: Runs test commands via `ProcessJail` and captures test outcomes.
4. **AUDITOR**: Inspects diffs for invariants, edge cases, and security vulnerabilities.

## Turn-Based Flow
1. Architect receives Objective -> writes `SPEC` artifact to Blackboard.
2. Coder reads `SPEC` -> implements changes -> writes `CODE_DIFF` artifact.
3. Verifier reads `CODE_DIFF` -> executes tests in `ProcessJail` -> writes `TEST_OUTPUT`.
4. Auditor reads `SPEC` + `CODE_DIFF` -> evaluates code -> writes `AUDIT_REPORT`.
5. `ConsensusGate` evaluates `TEST_OUTPUT` + `AUDIT_REPORT`.
   - If approved -> Session transitions to `CONSENSUS_REACHED`.
   - If rejected -> Loop back to Coder (up to `maxRounds = 3`).
