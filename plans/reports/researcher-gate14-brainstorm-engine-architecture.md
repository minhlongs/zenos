---
name: gate14-brainstorm-engine-architecture
description: Research and architecture design for the ZenOS Autonomous Brainstorming Engine (Gate 14).
---

# Gate 14: Autonomous Architectural Brainstorming Engine

## 1. Requirements
- Pure Node.js (0 external deps).
- Multi-strategy evaluation: Scoring matrix for proposed architectural changes.
- Socratic debate mechanism: Automated "Advocate" vs "Adversary" personas.
- Synthesis into actionable `/zen` plan specification.
- Compliance: < 200 LOC per module, metal GPU awareness.

## 2. Quantitative Scoring Formula (Architectural Risk Index)
$ARI = (w_1 \cdot \text{BlastRadius}) + (w_2 \cdot \text{Complexity}) + (w_3 \cdot \text{InvariantRisk}) + (w_4 \cdot \text{ChurnProbability})$

Where:
- **BlastRadius**: Transitive dependency depth & breadth.
- **Complexity**: Branching density & cyclomatic metric.
- **InvariantRisk**: Delta against project code standards (coupling, file size).
- **ChurnProbability**: Historical git stability (git blame/log frequency).

## 3. Socratic Debate Mechanism
- **Advocate**: Generates architectural hypothesis based on goal contract. Optimizes for feature velocity.
- **Adversary**: Probes for edge-case failure, invariant violations, and blast-radius escalation.
- **Synthesizer**: Evaluates debate, weights via ARI scoring, and commits final artifact to Blackboard if ARI < Threshold.

## 4. Implementation Strategy
- `BrainstormEngine`: State machine orchestrating debate interaction.
- `DebateAgent`: Specialized personas within `swarm-roles.js`.
- `SynthesisLog`: SQLite storage of arguments and final weighted decisions.

## 5. Unresolved Questions
- Integration threshold for ARI: Need to tune against `BlastRadiusEngine` output.
- Concurrency control: Ensure debate turns respect Metal CPU/GPU throughput limits during intensive AST traversal.

Status: DONE
Summary: Architecture finalized for autonomous socratic brainstorming engine relying on ARI scoring.
Concerns/Blockers: None
