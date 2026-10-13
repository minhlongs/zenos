# Research Report: Git Worktree Isolation & Automated PR Staging (Gate 13)

### 1. Git Worktree Orchestration
Native `git worktree` commands provide robust isolation without cloning multiple repos.
- **Commands**: `git worktree add <path> <branch>`, `git worktree remove <path>`, `git worktree list`.
- **Implementation**: Node.js `child_process.execFile` with absolute paths. Must handle `lock` files in `.git/worktrees` to prevent concurrent modifications.
- **Constraints**: Absolute paths mandated. `prune` should run periodically to clean orphaned worktrees.

### 2. Workspace Isolation
- **Node Modules**: To save space/speed, use `npm link` or common symlinks for large dependencies, but **must** isolate build artifacts (dist/build/node_modules) to prevent state cross-contamination between parallel agent cycles.
- **OS Level**: macOS `TMPDIR` provides ephemeral scratch space. Use per-worktree `/tmp/zenos-worktree-<timestamp>/` stores for volatile build caches.
- **Risk**: Symlink hell. Prefer localized `node_modules` copies for mission-critical CI runs to ensure atomicity.

### 3. Conflict Prevention
- **Agent Sandbox**: Run each agent in its own isolated worktree based on a unique `feature/*` branch.
- **Atomic Promotion**: Use `git merge --squash` followed by `git commit` to collapse ephemeral cycles into the main branch before `git worktree remove`.

### 4. PR Staging & Dual-Key Consensus
- **Automated Workflow**:
  1. Agent creates branch.
  2. Commits generated via raw standard FS calls.
  3. Pre-commit hooks run inside the specific worktree.
  4. Merge approval requested via `Dual-Key Consensus` (Memory [[sbv-pdpd-compliance-hardening]]).
  5. PR created via `gh pr create` (CLI only).

### 5. Architectural Fit
- **YAGNI/KISS**: Use standard `child_process` and `fs` modules. Do not introduce task-runner bloat. Follow the `< 200 LOC` invariant strictly.
- **Scalability**: Worktrees are significantly faster than full clones; efficient for concurrent research/implementation clusters.

### Trade-off Matrix

| Option | Complexity | Performance | Isolation Level |
| :--- | :--- | :--- | :--- |
| **New Clone** | Low | Low | Max |
| **Worktree** | Medium | High | High |
| **Monorepo/Folder**| High | Medium | Low |

### Recommendation
Adopt `git worktree` for all concurrent agent operations. It provides the best isolation-to-overhead ratio on macOS while supporting atomic branch promotion.

### Limitations
- Requires careful handling of local git hooks; hooks must recognize `GIT_WORK_TREE` environment variables.

---
Status: DONE
Summary: Git worktrees offer the optimal balance of isolation and performance for concurrent agent cycles. Implementing using pure Node.js child_process will maintain the project's KISS/YAGNI architecture.
