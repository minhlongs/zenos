# Brainstorming Report: Gate 8 Workstation Sandboxing, Process Isolation & Agent Supervisor

**Date:** 2026-10-09  
**Domain:** Gate 8 Workstation Sandboxing, Process Tree Isolation & Autonomous Agent Supervisor  
**Authors:** Claude Fable 5 & ZenOS Technical Architecture Team  
**Status:** DRAFT & STRATEGIC RECOMMENDATION  

---

## 1. Executive Summary & Problem Framing

With Gate 6 (AI Factory Engines) and Gate 7 (Next.js 14 Dashboard & Local Agent Harness) completed, ZenOS executes autonomous test-driven iterations and local model tool invocations.

However, two critical production workstation risks emerge:
1. **Unbounded Process Trees & Runaway Children**: When `/cook` or agent tools trigger background test runners (`node --test`, compiler daemons, Vitest), sub-child processes can leak memory or become orphaned, pinning Apple Silicon CPU cores and unified memory.
2. **Ghost Tasks & Crash Unawareness**: If the proxy process terminates unexpectedly during an active `/goal` or `/cook` pipeline, in-flight state is preserved in SQLite checkpoints, but there is no supervisor daemon to auto-reconcile interrupted tasks or kill hanging child process groups.

---

## 2. Architectural Dimensions & Comparative Options

### Option 1: Native macOS Sandbox-Profile Isolation (`sandbox-exec`)
- **Focus**: Wrap all child process executions in macOS `.sb` sandbox profiles restricting disk and network.
- **Pros**: Kernel-level enforcement.
- **Cons**: `sandbox-exec` is officially deprecated by Apple; profile syntaxes differ across macOS versions; fragile on developer workstations.

### Option 2: External Container Runtime (Docker / Podman)
- **Focus**: Force all code execution into isolated lightweight Linux containers.
- **Pros**: Strict namespace isolation and memory limits.
- **Cons**: Violates zero-dependency workstation invariant; high memory overhead; requires hypervisor virtualization on macOS.

### Option 3: Process Group Supervisor & SQLite Heartbeat Reconciler (RECOMMENDED)
- **Focus**: Pure zero-dependency Node.js architecture with:
  1. `ProcessJail` (`process-jail.js`): Spawns child executions in detached Process Groups (`detached: true`), managing recursive process group termination via `kill(-pgid, 'SIGTERM'/'SIGKILL')` with timeout dead-man switches.
  2. `AgentSupervisor` (`agent-supervisor.js`): Heartbeat monitor and boot reconciler scanning `task_checkpoints` for abandoned active tasks, auto-recovering or flagging them as interrupted.
  3. Strict `< 200 LOC` per module using native `node:child_process`, `node:sqlite`, and `node:events`.

---

## 3. Detailed Component Specifications

### 3.1 Process Jail (`proxy/src/workflow/process-jail.js`)
- Detached process spawn with isolated process group ID (PGID).
- Execution timeout guard with graceful `SIGTERM` followed by hard `SIGKILL` to entire process tree (`-pid`).
- Invariant: strictly < 200 LOC, zero external dependencies.

### 3.2 Agent Supervisor (`proxy/src/workflow/agent-supervisor.js`)
- Heartbeat loop checking active task checkpoints every 5 seconds.
- Startup reconciliation: detects tasks left in `COOKING` or `PLANNING` state on reboot and marks them `INTERRUPTED` or auto-resumes them.
- Priority queue manager with single-concurrency Metal GPU admission control.

---

## 4. Invariants & Guardrails

| Invariant | Standard | Enforcement |
|---|---|---|
| **Process Tree Cleanup** | 100% of spawned child processes killed on timeout | Process Group (`-pgid`) SIGKILL |
| **Recovery Durability** | Interrupted goals marked on boot | SQLite checkpoint query on startup |
| **File Length** | Strictly < 200 LOC per file | `loc-guard.js` |
| **Metal GPU Safety** | Single concurrency for local inference | `ConcurrencyGate` |
| **Zero Dependencies** | 0 external npm dependencies | Native Node.js built-ins only |

---

## 5. Strategic Verdict

**Approve Option 3 (Process Group Supervisor & SQLite Heartbeat Reconciler)** as the optimal, high-reliability design for Gate 8.
