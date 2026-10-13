# Phase 4: Next.js Worktree Console UI & Integration

## Context Links
- Plan: [plan.md](./plan.md)
- Wireframe: `docs/wireframes/worktree-console.html`
- Types: `frontend/src/types/worktree.ts`

## Overview
Implement the Next.js `WorktreeConsole` component for monitoring active ephemeral worktrees, visualizing blast radius cartography, and triggering one-click PR staging with Dual-Key safety gating.

## Requirements
- Cyber-minimalist dark theme (`#020617` / `#0f172a`, blue `#3b82f6` accent).
- Metric cards: Active Worktrees, Monitored Modules, Average Blast Radius, Dual-Key Status.
- Worktree Fleet list with branch, path, commit ID, Purge, and Promote actions.
- Interactive Blast Radius inspector calculating fan-in, fan-out, cascade depth, and risk rating.
- PR Staging modal with Conventional Commit generator and Dual-Key consensus checklist.
- Zero TypeScript `:any` types and strict `< 200 LOC` per file.

## Related Code Files
- Create: `frontend/src/types/worktree.ts`
- Create: `frontend/src/lib/zenos-worktree-client.ts`
- Create: `frontend/src/components/WorktreeConsole.tsx`
- Modify: `frontend/src/app/page.tsx`
