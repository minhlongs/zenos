---
name: swarm-orchestration-apple-silicon
description: Multi-agent swarm patterns for local LLMs on Apple Silicon (M-series) unified memory
metadata:
  type: reference
---

# Multi-Agent Swarm Orchestration on Apple Silicon

## 1. Local Hardware Realities
- **GPU Bottleneck**: Apple Silicon unified memory uses a single Metal GPU context. Parallel inference (e.g., streaming tokens from two models simultaneously) causes severe GPU content switching, leading to higher latency than sequential execution.
- **Concurrency Limit**: LM Studio/Ollama on Apple Silicon effectively serializes GPU tasks. Simultaneous multi-threading is an anti-pattern.
- **Architectural Solution**: Turn-Based Blackboard State Machine.
  - Agents read from a shared key-value or file-based state (e.g., SQLite, local files).
  - Only one agent processes at a time to maximize token-per-second (TPS) and minimize cache thrashing.

## 2. Swarm Coordination Models
- **Blackboard Architecture (Ranked: 1)**: Agents treat `/plans/` and local memory as the source of truth. Optimal for persistence and crash recovery.
- **Actor-Critic (Ranked: 2)**: Overhead for message passing between actors is high on local hardware.
- **Sequential Pipeline (Ranked: 3)**: Simplest implementation, but prone to failure if any single link in the chain breaks.

## 3. Context Budgeting & Compaction
- **Artifact Passing**: Pass references (file paths) and atomic summaries rather than full conversation history.
- **Compaction**: Use summary agents to condense state logs before handoffs. Maintain an `active-task.md` file rather than appending to massive session logs.

## 4. Adoption Risk/Fit
- **Maturity**: Low. Multi-agent local orchestration is in early R&D.
- **Risk**: Context drift if agent state is not strictly synchronized.
- **Architecture**: Perfectly compatible with the `ZenOS` persistence model.

**Recommendation**: Synchronous Turn-Based Blackboard State Machine utilizing `node:sqlite` as the shared state hub for subagent handoffs.
