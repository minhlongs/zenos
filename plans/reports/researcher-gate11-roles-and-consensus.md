---
name: gate11-hierarchical-delegation
description: Research hierarchical role delegation and spec-driven dual-key consensus verification for autonomous SWE swarms.
metadata:
  type: project
---

# Hierarchical Role Delegation & Dual-Key Consensus

## Role Specialization Framework
The solo-founder workstation utilizes specialized agent roles to enforce modularity and robustness:
1. **Architect**: Extracts formal acceptance contracts (Zod/TSP) from user intent.
2. **Coder**: Implements logic limited to <200 LOC per file, strict adherence to `CLAUDE.md`.
3. **Auditor**: Adversarial analysis targeting failure mode assertions, invariant violations, and security gates.
4. **QA Verifier**: Executes deterministic test suites within an isolated ProcessJail, strictly rejecting non-green commits.

## Dual-Key Consensus Mechanism
Merge gating is achieved through a binary witness system:
- **Verifier Witness**: Automated test suite execution result (Pass/Fail).
- **Auditor Witness**: Signed verification of invariant safety and edge-case coverage.
Consensus is recorded in the SQLite session ledger; commit triggers are physically blocked until both witnesses are written to the database.

## Durable Blackboard
Using `node:sqlite`, the swarm maintains:
- `session_state`: Active task hierarchy and role handoffs.
- `artifact_ledger`: Versioned spec -> implementation mapping.
- `consensus_table`: Role-signed approvals for state transitions.

## Adoption Risk
- **Complexity**: Overhead of role orchestrations may exceed value for trivial edits.
- **Latency**: Multi-agent deliberative rounds increase Time-to-Merge.

## Architectural Fit
Optimal for mission-critical core logic; overhead mitigated by the existing <200 LOC chunking standards.
