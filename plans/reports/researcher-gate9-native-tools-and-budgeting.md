---
name: gate9-native-tools-budgeting-report
description: Research on native tool definitions and token budgeting for ZenOS Gate 9.
metadata:
  type: project
---

# Gate 9: Native Tooling & Context Strategy

## 1. Native Tool Set (Zero-Dependency)
To minimize attack surface and dependency hell, implement these tools using native Node.js (`fs`, `child_process`, `crypto`) within a path-restricted jail:

*   **`read_file`**: `fs.readFileSync` with optional `startLine`/`endLine`. Must resolve paths against a workspace root to prevent directory traversal.
*   **`write_file`**: Atomic write (write to temp, then `renameSync`).
*   **`edit_file`**: Line-based search-replace; verify unique match in context before applying to prevent partial updates.
*   **`list_files`**: `fs.readdir` (recursive). Exclude `.git`, `node_modules`, `dist` by default.
*   **`execute_command`**: Use `child_process.spawn`. Must be strictly sandboxed; no interactive shells.

## 2. LLM Tool Invocation Strategy
Open models (Qwen 2.5 Coder, DeepSeek) exhibit erratic behavior with unstructured tool calls.

*   **Format**: Enforce strict XML tool calls (e.g., `<tool_call name="read_file">...</tool_call>`).
*   **Prompting**: Include tool schemas in the system prompt with concrete example invocations.
*   **Validation**: Add a middleware layer to parse/validate the tool call schema against the defined interface BEFORE invoking the underlying Node code. If schema fails, return error immediately to the model.

## 3. Token Budgeting & Truncation
Context management prevents runaway token consumption from heavy codebase operations.

*   **Output Truncation**: Default to 100-line limits for `list_files` and grep results. For files, limit reading to 200 LOC per agent turn.
*   **Streaming**: Use streaming for command outputs in `execute_command`. Monitor token count in real-time; stop execution if threshold exceeded.
*   **Semantic Compression**: For directory dumps, offer tree visualization; for logs, offer error summary extraction rather than raw dumps.

## 4. Invariants
*   **Dependencies**: Zero `npm` pkgs. Raw Node.js stdlib only.
*   **Maintainability**: All tool logic files capped at 200 LOC.
*   **Performance**: Apple Silicon friendly; `spawn` processes use low-latency non-blocking IO.

## Unresolved Questions
*   How to handle massive diff sets for automated patches without exceeding token limits on long-file refactors?
*   Should `execute_command` support streaming binary artifacts?

Status: DONE
