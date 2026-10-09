# Phase 1: Native Zero-Dependency Tool Harness

## Overview
Implement `proxy/src/workflow/tool-harness.js` providing the 5 essential local developer tools (`read_file`, `write_file`, `edit_file`, `list_files`, `execute_command`) guarded by `PathGuard`, `CommandGuard`, and `ProcessJail`.

## Requirements
1. `read_file(filePath, { startLine, endLine })`: Reads file contents safely, clamps to 200 lines per read.
2. `write_file(filePath, content)`: Atomic write via temp file within workspace.
3. `edit_file(filePath, oldString, newString)`: Verifies exact occurrence count == 1 before replacing.
4. `list_files(dirPath, { recursive, maxFiles })`: Lists directory entries, ignores node_modules/.git, caps at 100 entries.
5. `execute_command(command, { timeoutMs })`: Invokes `ProcessJail.run` with detached PGID and command safety verification.
6. Returns standard format: `{ success: boolean, output: string, error?: string }`.
7. Strictly `< 200 LOC`.

## Related Files
- Create: `proxy/src/workflow/tool-harness.js`
- Create: `proxy/tests/tool-harness.test.js`
