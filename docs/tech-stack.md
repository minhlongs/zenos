# ZenOS Tech Stack & Architectural Decisions (Gate 8)

## Core Technologies

### 1. Proxy Backend Runtime
- **Runtime**: Node.js >= 18.0.0 (Native ESM / CommonJS)
- **Zero-Dependency Core**: Exclusively native built-in modules (`node:http`, `node:sqlite`, `node:crypto`, `node:fs`, `node:events`, `node:child_process`, `node:net`).
- **HTTP Routing & Security**: Lightweight Express 4.x + Helmet + CORS strictly bound to loopback `127.0.0.1`.
- **Concurrency & Metal GPU Safety**: In-process `ConcurrencyGate` enforcing strict single-concurrency for Apple Silicon Metal inference.

### 2. Process Sandboxing & Isolation (Gate 8)
- **Process Jail**: Spawns executions with `detached: true` in isolated Process Groups (PGID).
- **Process Tree Cleanup**: Recursive termination via `process.kill(-pgid, 'SIGTERM'/'SIGKILL')` with configurable dead-man switches (default 30s).
- **Path & Command Jail**: Dynamic workspace confinement and strict command token allowlisting.

### 3. Autonomous Supervisor & Recovery (Gate 8)
- **Agent Supervisor**: Dedicated heartbeat monitor and crash reconciler daemon.
- **Heartbeat & Dead-Man**: 5s SQLite checkpoint heartbeat tracking in `task_checkpoints`.
- **Boot Reconciler**: Automatic startup reconciliation marking interrupted tasks (`INTERRUPTED`) and purging orphaned process trees.

### 4. Frontend Management Dashboard
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.x (Strict mode, zero `:any`)
- **Styling**: Tailwind CSS 3.x + Lucide React icons
- **State & Streaming**: Native `EventSource` (Server-Sent Events) with `useSyncExternalStore` for flicker-free real-time telemetry.

### 5. Local Inference Engine
- **Host**: LM Studio / Ollama bound to `http://localhost:1234`
- **Models**:
  - Code & TDD: Qwen 2.5 Coder 14B / DeepSeek Coder 14B
  - Planning & Synthesis: Gemma 2 27B / Llama 3.1 70B (or Cloud Claude 3.5 Sonnet for complexity > 3)

### 6. Storage & Memory Hierarchy
- **Transactional State**: Native `node:sqlite` database with WAL mode and versioned migrations (`tasks`, `task_checkpoints`, `schema_migrations`).
- **Episodic Memory**: Atomic filesystem writes with `.tmp` staging and SHA256 checksums.

### 7. Architectural Guardrails
- **File Length**: Strictly < 200 lines of code per file across all source and test modules.
- **Circuit Breaker**: Max 5 automated iterations per TDD loop.
- **Zero Secrets in Code**: Environment variable validation and regex secret redaction.
