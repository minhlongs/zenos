# Research Report: Gate 7 Local Autonomous Tool Runner & Context Management

## 1. Native Tool Execution Loop
- **Format Parsing**: For Qwen 2.5/DeepSeek Coder models, **XML tags** (`<tool_code>...</tool_code>` or standard `<function_calls>`) demonstrate lowest hallucination rate compared to raw JSON.
- **Proxy Bridge**: Tool calls must be intercepted by a `TaskGate` middleware that validates requested commands against `Gate 4` (PathGuard/CommandGuard) before passing to the Node.js process runtime. Use `worker_threads` for isolation, ensuring serial execution (ConcurrencyGate 1).

## 2. Context Window Compaction
- **Truncation Strategy**: Implement a **Sliding Window + Ephemeral Summary** pattern.
- **Mechanism**: Use a dual-buffer:
    - `Fixed Buffer (4k tokens)`: Recent user-agent interaction.
    - `Dynamic Summary (2k tokens)`: Periodic rolling summary of historical context, generated asynchronously.
- **Hardware constraints**: Target 16k context for M-series peak performance; exceeding risks thermal throttling under sustained GPU loads.

## 3. Hybrid Memory Search
- **Schema**: SQLite FTS5 BM25 (text relevance) + vector embeddings (semantic similarity).
- **Implementation**: Utilize `node:sqlite` for in-process indexing. Embeddings via local `sentence-transformers` via Python bridge (run in a separate, low-priority process to prevent UI blocking).
- **Optimization**: Use `LIMIT=5` on semantic search to minimize latency in the tool loop.

## 4. Hardware/Architectural Considerations
- **Memory**: Keep workspace indices in RAM. Limit sqlite page size to 4096.
- **Thermal**: Enforce `1 concurrency` on non-inference tasks; serialize tool execution to prevent context-switching penalties.

## Bottlenecks
- Synchronous vs. Asynchronous tool call overhead.
- Quantization drift in smaller models (14B) leads to inconsistent schema output.

## Recommendation
- Rank 1: **XML-based Tool Calling** (most reliable) with **Sliding Window Summary** (state-preservation).
- Rank 2: **JSON Schema** (standardized but prone to malformed output in sub-20B models).

Status: DONE
Summary: XML-based tool calling with dual-buffer context management provides the safest path for deterministic local tool execution in constrained Apple Silicon environments.
