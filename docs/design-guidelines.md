# ZenOS Design Guidelines & UI Standards (Gate 11 & Gate 12)

## 1. Visual Theme & Philosophy
- **Aesthetic**: Modern Cyber-Minimalist Dark Mode engineered for developer focus.
- **Background Palette**:
  - Deep Surface: `#09090b` (zinc-950) / `#020617` (slate-950)
  - Card / Panel Surface: `#18181b` (zinc-900) / `#0f172a` (slate-900)
  - Elevated Border: `#27272a` (zinc-800) / `#1e293b` (slate-800)
  - Subtle Border: `#3f3f46` (zinc-700) / `#334155` (slate-700)
- **Accent & Status Palette**:
  - Primary Action / Health Clean / Local Route: `#34d399` (emerald-400) & `#064e3b` (emerald-950)
  - Swarm / Orchestrator / Architect: `#6366f1` (indigo-500) & `#1e1b4b` (indigo-950)
  - AST Slicing / Decomposition / Frontier Route: `#a78bfa` (violet-400) & `#2e1065` (violet-950)
  - Warning / LOC Threshold / Slicing Candidate: `#fbbf24` (amber-400) & `#451a03` (amber-950)
  - Critical / Circuit Breaker / Failsafe Rollback: `#fb7185` (rose-400) & `#4c0519` (rose-950)
  - Telemetry Stream / Live SSE / PGID Monitor: `#38bdf8` (sky-400) & `#082f49` (sky-950)
  - Refactoring & AST Slicing Accent: `#2dd4bf` (teal-400) & `#042f2e` (teal-950)
  - Git Worktree & Branch Isolation Accent: `#3b82f6` (blue-500) & `#172554` (blue-950)
  - Blast Radius Risk & Impact Accent: `#f59e0b` (amber-500) & `#451a03` (amber-950)

## 2. Typography & Hierarchy
- **Primary Font**: `Inter`, system-ui, -apple-system, sans-serif (bilingual VN+EN support)
- **Code / Monospace**: `JetBrains Mono`, `Fira Code`, `ui-monospace`, monospace
- **Scale**:
  - Page Titles: `text-2xl font-bold tracking-tight`
  - Section Headers: `text-lg font-semibold text-zinc-200`
  - Body & Labels: `text-sm text-zinc-300`
  - Metadata & Badges: `text-xs font-mono font-medium`
  - Telemetry & Micro-Metrics: `text-[11px] font-mono leading-relaxed`

## 3. Component Design System
- **Cards**: `bg-zinc-900 border border-zinc-800 rounded-lg p-5 shadow-sm`
- **Pills / Badges**: `px-2.5 py-0.5 rounded-full text-xs font-medium border font-mono`
- **Swarm Pipeline Track**: 4-step role cards (Architect, Coder, Verifier, Auditor) displaying active turn and artifact badges.
- **Dual-Key Consensus Gauge**: Side-by-side verification lock status displaying Test Witness (Key 1) and Audit Witness (Key 2) with atomic rollback failsafe trigger.
- **Refactor Console (Gate 12)**:
  - **Workspace Health Radial**: Circular visual score (e.g. 94.2% Healthy) flanked by scanned count, >150 LOC count, and cyclomatic complexity (CCN).
  - **Monolith Candidate Hotlist**: High-density interactive table showing File Path, LOC, Branching Density, Risk Score badges, and one-click "Auto-Slice" actions.
  - **AST Dependency & Slicing Visualizer**: Interactive split view showing Original Monolith AST symbols mapped to sliced submodules (< 100 LOC) and backwards-compatible barrel facade.
  - **Dual-Key Safety Witness Gauge**: Key 1 (Deterministic TDD Pass) and Key 2 (Adversarial Invariant Audit) with instantaneous rollback switch.
  - **Live SSE Operation Feed**: Real-time streaming terminal log displaying extraction, syntax verification, test run, and barrel rewiring with event filter controls.
- **Worktree & Blast Radius Console (Gate 13)**:
  - **Worktree Active Fleet Tracker**: Ephemeral worktree cards with branch name, absolute path, commit hash, created timestamp, and one-click "Purge" or "Promote" buttons.
  - **Blast Radius Interactive Cartography**: Interactive node card with Upstream Callers (Fan-in), Downstream Deps (Fan-out), Max Transitive Depth, and numerical Blast Radius index with color-coded safety levels (`SAFE`, `CAUTION`, `CRITICAL`).
  - **Automated PR Staging Dialog**: Conventional commit generator preview, changed files inventory, Dual-Key consensus checklist, and instant branch promotion trigger.
- **Process Group Monitor**: Monospace PID / PGID badge with live uptime meter and dead-man switch countdown.
- **Crash Recovery Pill**: Status indicator showing `SYNCHRONIZED` (emerald) or `RECONCILING` (amber).
- **Buttons**:
  - Primary: `bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-md`
  - Swarm / Slicing Action: `bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-3 py-1.5 rounded-md`
  - Secondary: `bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold px-3 py-1.5 rounded-md border border-zinc-700`
  - Destructive: `bg-rose-950 hover:bg-rose-900 text-rose-300 text-xs font-semibold px-3 py-1.5 rounded-md border border-rose-800`
- **Console / Log View**: `bg-zinc-950 border border-zinc-800 rounded-md p-4 font-mono text-xs text-zinc-300`
