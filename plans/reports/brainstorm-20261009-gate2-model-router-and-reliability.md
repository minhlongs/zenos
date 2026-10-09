# Brainstorm Report: Gate 2 — Model Router, Failover & Concurrency Management

**Date:** 2026-10-09  
**Status:** PROPOSED / APPROVED BY USER ("Cả hai: Aliasing + Failover, Queue + Direct")  
**Target:** ZenOS Local AI Workstation — Gate 2 Reliability Engine  
**Author:** Principal Software Architect & AI Runtime Engineer  

---

## 1. Problem-First Inversion

### 1.1 Solution-Jumping Diagnosis
- **The Impulsive Solution:** Adding heavyweight multi-agent frameworks, complex distributed routing meshes, or external load balancers to route LLM requests.
- **The Hidden Pain:** Claude Code hardcodes Anthropic model strings (`claude-3-5-sonnet`, `claude-3-haiku`), while local LM Studio hosts models with arbitrary local identifiers (`qwen2.5-coder-7b-instruct`, `deepseek-coder-6.7b`). Concurrently, running multiple Metal GPU inference passes on Apple Silicon triggers unified memory thrashing, thermal throttling, or GPU driver crashes. When LM Studio is unloading or reloading a model, calls instantly fail with unrecoverable connection errors.

### 1.2 Underlying Problem
The local workstation lacks an intelligent, resource-aware mediation layer between client model assumptions and local hardware execution realities:
1. Protocol and identifier mismatch between Claude Code and local models.
2. Fragility to transient local runtime hiccups (model loading latencies, memory pressure, restarts).
3. Risk of hardware starvation/OOM panics under uncontrolled burst concurrency.

### 1.3 Assumption Challenges
1. *Assumption:* Claude Code only needs exact model name pass-through.  
   *Risk:* Claude Code fails immediately because it sends `claude-3-5-sonnet-20241022`, which local LM Studio does not recognize.  
   *Validation:* Verify request payloads from Claude Code CLI and map them deterministically.
2. *Assumption:* Local LM Studio handles arbitrary concurrent requests gracefully.  
   *Risk:* Metal GPU out-of-memory or high latency degradation when 2+ requests invoke context processing concurrently.  
   *Validation:* Concurrency gating queue (default limit = 1 on M-series chips, configurable).
3. *Assumption:* Failover requires an external cloud provider.  
   *Risk:* Violates local-first / offline-first privacy contract.  
   *Validation:* Support local-first secondary endpoints (e.g. secondary LM Studio instance, Ollama fallback on port 11434, or optional external upstream).

### 1.4 Problem Statement
- **Context:** Solo developer running Claude Code against local models on Apple Silicon.
- **Struggle:** Commands fail if model names don't match, or if multiple agent loops hit the local server at the same instant.
- **Root Cause:** Lack of alias resolution, lack of admission control/queueing, and lack of resilient retry/failover logic.
- **Consequence:** Developer gets interrupted mid-task, loses context, or crashes the local model server.
- **Success:** Seamless drop-in compatibility where any Anthropic model request routes to the optimal available local model, queues safely, and recovers transparently from transient hiccups.

### 1.5 Three Alternative Framings
- **Frame A (Client-driven):** Force Claude Code environment configurations to always match local model names manually. *Downside: High friction, fragile across updates.*
- **Frame B (Proxy-level Gateway - Selected):** Proxy manages model aliasing, admission control queue, and upstream failover cleanly and transparently. *Upside: Zero client configuration changes, 100% reliable execution.*
- **Frame C (Distributed mesh):** Full microservice router with Redis queues and telemetry daemons. *Downside: Extreme over-engineering, violates KISS/YAGNI.*

### 1.6 Evidence Status
- **Status: Strong.**
  - Verified by actual local proxy tests: 29/29 passing on Gate 1 baseline.
  - Verified hardware characteristic: Unified memory on Apple Silicon is shared between OS, display, and Metal GPU shaders.

### 1.7 Validation Plan
- Implement deterministic unit & contract tests for alias resolution.
- Test queue execution order (FIFO) and concurrency bounds with simulated delayed upstreams.
- Test failover mechanics when primary upstream returns 502/504 or connection refused.

### 1.8 Stakeholder Message
> "We are enhancing the Gate 1 proxy with Gate 2 reliability: intelligent model aliasing so Claude Code works out-of-the-box, a lightweight in-memory queue to protect Apple Silicon Metal GPU from OOM, and automated fallback when a model is reloading."

---

## 2. Technical Architecture & Approach Evaluation

### 2.1 Evaluated Approaches

| Dimension | Option 1: Naive Pass-through | Option 2: Full Heavy Mesh | Option 3: Lightweight Embedded Gating (Chosen) |
|---|---|---|---|
| **Model Resolution** | Literal match only | Regex / dynamic semantic embedding match | Static alias map with auto-discovery fallback |
| **Concurrency** | Unbounded (No limit) | Redis / BullMQ worker queue | Pure in-memory Async Queue (`p-limit` / native promise queue) |
| **Failover** | None (Single endpoint) | Distributed circuit breaker with consensus | Deterministic primary + fallback list with health checks |
| **Code Footprint** | ~50 LOC | >1,500 LOC + external Redis | ~180 LOC in 2-3 focused modules |
| **Dependencies** | 0 new | Redis, bull, ioredis | 0 new (built on native Node.js async primitives) |

### 2.2 Selected Architecture: Lightweight Embedded Router

#### Component Breakdown (<200 LOC per file):
1. **`proxy/src/model-router.js` (~80 LOC):**
   - Resolves incoming model names:
     - Exact match in upstream catalog.
     - Known alias mapping (`claude-3-5-sonnet*`, `claude-3-opus*`, `claude-3-haiku*` → configured default, e.g. `qwen2.5-coder-7b-instruct` or currently active LM Studio model).
     - Fallback to first available model from `GET /v1/models` if alias is unset.
   - Capability validation: Flags warning or falls back if tool-use is requested on a model that lacks tool support.

2. **`proxy/src/concurrency-gate.js` (~70 LOC):**
   - Zero-dependency in-memory FIFO queue.
   - Configurable `MAX_CONCURRENT_INFERENCE` (default: 1 on Apple Silicon to prevent Metal GPU thrashing; 0 = unthrottled).
   - Tracks active slots, enqueues pending promises, supports client abort (`req.on('close')` drops request from queue immediately without processing).
   - High-water mark telemetry for observability.

3. **`proxy/src/failover-manager.js` (~75 LOC):**
   - Manages ordered upstream targets: `[PRIMARY_UPSTREAM, SECONDARY_UPSTREAM]`.
   - On connection failure (`ECONNREFUSED`, 502, 504), attempts immediate retry or failover to secondary before returning error to client.
   - Avoids retry amplification on client abort or 4xx invalid requests.

---

## 3. Implementation Constraints & Quality Gates

- **Zero External Dependencies:** Built strictly using native Node.js (`node:events`, `node:http`, async promises).
- **Strict File Bounds:** All new modules strictly under 200 lines of code.
- **Contract Preservation:** Complete compatibility with Anthropic Messages API specification.
- **Zero Mock Testing:** End-to-end tests use native ephemeral HTTP servers (`http.createServer` on port 0).
- **Security:** Strict loopback validation maintained for all primary and failover upstream URLs.

---

## 4. Next Steps & Handoff

1. Offer `/ck:plan --tdd` for implementation of Gate 2 (Model Router, Concurrency Gate, Failover).
2. Write comprehensive contract tests verifying:
   - Alias translation (`claude-3-5-sonnet` → local model).
   - Concurrency queuing and abort handling.
   - Upstream failover upon primary outage.
