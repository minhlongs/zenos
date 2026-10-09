# Research Report: Autonomous Supervisor, Heartbeat, and Recovery (Gate 8)

## 1. Heartbeat & Dead-man Switch
For long-running ZenOS tasks (e.g., `/cook` iterations), implement a native Node.js ping-pong mechanism:
- **Heartbeat**: Worker increments `last_active_ts` in SQLite `task_checkpoints` every 5s.
- **Dead-man Switch**: Supervisor daemon checks `(now - last_active_ts) > threshold`. If unresponsive, triggers `SIGTERM` cleanup then restarts from last checkpoint.
- **Why**: Ensures no ghost processes lock shared resources (Metal GPU) indefinitely.

## 2. SQLite Crash Recovery
ZenOS uses `task_checkpoints` for state machine persistence:
- **Write-Ahead Logging (WAL)**: Enable WAL mode in SQLite for concurrency.
- **Transactional State**: Every `/cook` step must commit to `task_checkpoints` (e.g., `state`, `iteration_count`, `artifacts_path`) before `node:child_process` execution.
- **Startup Resume**: `factory_engine.js` queries active `task_checkpoints` on boot to resume from the last successful state, re-invoking the `GoalManager` state machine.

## 3. Concurrency & GPU Load Management
- **Metal Gate**: Admission controller enforces `max_tasks = 1` for local inference.
- **Priority Queue**: Tasks assigned weights: `DEBUG` (P0), `CODE_GEN` (P1), `TEST_RUN` (P1), `PLANNING` (P2). P0 can preempt if necessary.
- **Anomaly Detection**: Monitor `loadavg` and `metal_usage`. Force-throttle frequency if thermal limits are breached; reject new tasks if swap usage exceeds 20%.

## 4. Design Trade-offs
| Dimension | Recommendation | Trade-off |
| :--- | :--- | :--- |
| **Recovery** | SQLite Atomic Commits | Higher disk I/O; required for durability. |
| **Heartbeat** | Lightweight `task_checkpoints` | Minimal RAM overhead; increases SQLite contention. |
| **GPU Gate** | FIFO/Priority Buffer | Latency on P2 tasks; prevents system hangs. |

## 5. Architectural Fit
- **Integration**: Leverage existing `task_store.js` and `GoalManager` state.
- **Constraint**: Strict zero external dependencies; use native `node:sqlite`.

Status: DONE
Summary: Established a robust heartbeat/recovery pattern using SQLite checkpoints and a priority-based concurrency gate to ensure system integrity during long-running tasks.
