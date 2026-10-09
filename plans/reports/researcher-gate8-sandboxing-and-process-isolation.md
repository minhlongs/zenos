# Research: macOS Sandboxing and Process Isolation for AI Agents

## 1. Native macOS Sandboxing and Governance
- **Sandboxing (`sandbox-exec` / App Sandbox):** Apple's standard sandboxing mechanism is primarily for application-level constraints defined in entitlements. It relies on the Kernel Extension (KEXT) or system policies. For local CLI agent isolation, `sandbox-exec` (deprecated but still used via the `sandbox` profile files) allows forcing arbitrary executables into restricted profiles.
- **Process Governance:**
    - `posix_spawn` with `posix_spawnattr_setgid` for basic UID/GID limiting (risky inside GUI sessions).
    - `nice` / `renice` for CPU prioritization, not hard exclusion.
    - `ulimit` (POSIX shell limits) is effective for capping file descriptors, stack, and memory per-session, but difficult to apply dynamically to sub-child processes.
    - **Resource Limits:** macOS lacks `cgroups` (Linux native). The closest equivalent is `task_policy` (internal Apple API) or running tasks within discrete ephemeral `Containers` (requires System Integrity Protection context).

## 2. Local Execution Isolation
- **Containerless Jails:** Since Docker/Podman are heavy, "Jail" logic is achieved by:
    - **Filesystem Jail:** `chroot` (privileged) or strictly enforcing path-guard logic via `@/seed/proxy/src/security/path-guard.js`.
    - **User Isolation:** Executing child scripts as a low-privileged system user (`nobody` or specific sandbox user) to prevent lateral movement.
    - **Command Allowlisting:** Strict command parsing in `command-guard.js` prevents arbitrary shell interpretation (RCE mitigation).

## 3. IPC and Signal Handling
- **Process Tree Management:** Node.js `child_process` handles SIGTERM/SIGKILL signals natively. To manage trees across process boundaries:
    - Use `process.on('SIGTERM')` hooks.
    - Kill process trees by sending signals to the entire Process Group ID (PGID) rather than just the parent process.
    - `util.promisify` combined with recursive PID scanning ensures rogue sub-processes aren't orphaned.

## 4. Design Trade-offs
- **Performance vs. Security:** Over-sandboxing causes syscall latency.
- **Maintainability:** Apple's proprietary sandbox profiles (`.sb`) are poorly documented and change across major OS versions (e.g., Sequoia to current).
- **Recommendation:** Rely on software-defined guardrails (`path-guard`, `command-whitelist`) for logic isolation; use standard POSIX process management (`kill -9 -PGID`) for process lifecycle control.

Status: DONE
Summary: macOS lacks native Linux-style cgroups, so isolation relies on path/command guardrails at the application level and POSIX signal management for child process trees.
