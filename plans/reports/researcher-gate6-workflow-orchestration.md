# Workflow Orchestration Architecture Report: ZenOS AI Station

## Architecture Overview
ZenOS leverages a tri-service architecture built on pure Node.js (zero dependencies) to maintain the <200 LOC per file invariant and ensure seamless Apple Silicon resource management.

### Service Roles
1.  **`/zen` (Dispatcher)**: Orchestrates model routing.
    *   **Logic**: Implements model escalation. Validates prompt complexity → routes to local models (e.g., Qwen/DeepSeek) if compliant → escalates to cloud (Claude) via API gate.
    *   **Metal Constraint**: Dispatches via a task-queue to prevent GPU saturation. Yields if Metal utilization > 80%.
2.  **`/cook` (TDD Engine)**: The worker process.
    *   **Logic**: Executes the iteration loop (Build -> Test -> Fix).
    *   **Invariants**: Validates LOC/file < 200 before every commit. Enforces 100% green tests locally.
3.  **`/goal` (Durable Runner)**: State machine & persistence.
    *   **Logic**: Uses `node:sqlite` for transactional state checkpoints. Implements human-in-the-loop interlocks.
    *   **Persistence**: Streams progress/events via Server-Sent Events (SSE) to `/dashboard`.

## Metal Scheduling & Resource Gate
*   **Concurrency Gate**: Atomic semaphore in the proxy layer controls access to the NPU/Metal unit.
*   **Yield Mechanism**: Non-blocking event loop integration. The orchestrator polls `sysctl` for GPU pressure and uses `setImmediate()` to ensure the proxy's concurrency gate responds to incoming HTTP requests while waiting for long-running inferences.

## State Management (`task-store.js`)
*   **Checkpointing**: Every state machine transition saves a transactionally atomic blob to SQLite.
*   **SSE Bridge**: The `/dashboard` service hooks into a pub/sub listener on the SQLite write-ahead log (WAL) to provide real-time UI updates without polling overhead.

## Implementation Pattern
*   **KISS/YAGNI**: No heavy frameworks. Every service is a class-based module exposed via local Unix Domain Sockets (UDS) for low-latency, secure communication within the ZenOS environment.
*   **Memory Efficiency**: Stateless worker processes for `/cook`. State is offloaded to the `/goal` durable store.

## Adoption Risk
*   **High**: Apple Silicon NPU availability is driver-dependent.
*   **Mitigation**: Fallback path always defaults to CPU-bound inference or remote Claude API if local hardware performance metrics return error status.

## Unresolved Questions
1.  Optimal WAL-journal size for frequent state checkpoints on sustained high-throughput workloads.
2.  Handling partial inference failures in the escalation pipeline when streaming long-context responses.
