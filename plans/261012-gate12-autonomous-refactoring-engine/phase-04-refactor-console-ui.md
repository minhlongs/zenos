# Phase 4: Frontend RefactorConsole UI & Visualizations

## Context Links
- Plan: [plan.md](./plan.md)
- Phase 1: [phase-01-complexity-engine.md](./phase-01-complexity-engine.md)
- Phase 2: [phase-02-refactor-controller.md](./phase-02-refactor-controller.md)
- Phase 3: [phase-03-factory-endpoints.md](./phase-03-factory-endpoints.md)
- Research: [researcher-gate12-complexity-heatmaps-and-self-healing.md](../reports/researcher-gate12-complexity-heatmaps-and-self-healing.md)
- Existing Reference: `frontend/src/app/page.tsx:1` (Dashboard Tabs)
- Existing Reference: `frontend/src/components/EvalConsole.tsx:1` (Console Pattern)

## Overview
Implement `frontend/src/components/RefactorConsole.tsx` and its supporting client SDK in `frontend/src/lib/zenos-refactor-client.ts` and types in `frontend/src/types/refactor.ts`. The RefactorConsole provides a factory dashboard interface with workspace health metrics, monolith risk ranking tables, slice plan previews, dual-key consensus status indicators, and one-click autonomous refactoring execution.

## Requirements

### 1. TypeScript Types (`frontend/src/types/refactor.ts`)
- `FileComplexity`:
  ```ts
  export interface FileComplexity {
    filePath: string;
    totalLines: number;
    codeLines: number;
    branchingCount: number;
    monolithScore: number;
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    fanOut: number;
  }
  ```
- `WorkspaceAnalysis`:
  ```ts
  export interface WorkspaceAnalysis {
    workspaceHealthScore: number;
    totalFiles: number;
    highRiskFilesCount: number;
    averageComplexity: number;
    files: FileComplexity[];
  }
  ```
- `SlicePlan`:
  ```ts
  export interface SlicePlan {
    targetFile: string;
    currentLoc: number;
    slices: Array<{ submodule: string; estimatedLoc: number; symbols: string[] }>;
    barrelFacade: string;
    postRefactorTargetLoc: number;
  }
  ```
- `RefactorConsensusResult`:
  ```ts
  export interface RefactorConsensusResult {
    approved: boolean;
    status: 'APPROVED' | 'REJECTED';
    reason: string;
    key1: { passed: boolean; reason: string };
    key2: { approved: boolean; reason: string };
    createdFiles?: string[];
    modifiedFiles?: string[];
  }
  ```

### 2. Client SDK (`frontend/src/lib/zenos-refactor-client.ts`)
- `fetchAnalysis(path?: string): Promise<WorkspaceAnalysis | null>`
- `generatePlan(filePath: string): Promise<SlicePlan | null>`
- `applyRefactor(plan: SlicePlan, options?: { dryRun?: boolean }): Promise<RefactorConsensusResult | null>`

### 3. UI Component (`frontend/src/components/RefactorConsole.tsx`)
- Keep strictly under 200 lines of code.
- **Header & Workspace Health Gauge**:
  - Health Score (0-100%) with color coding (Green: >=80, Yellow: 50-79, Red: <50).
  - High Risk File Count & Total Lines inspected.
  - Scan Trigger button (`Scan Workspace`).
- **Monolith Ranking Table**:
  - Lists top high-risk files sorted by `monolithScore`.
  - Badges for `riskLevel` (`CRITICAL`, `HIGH`, etc.).
  - Action button: `Plan Slicing` for target file.
- **Slice Plan & Consensus Modal/Drawer**:
  - Displays proposed submodules, estimated LOCs, and barrel facade preview.
  - Dual-Key Status preview: Key 1 (Test Suite Verifier) + Key 2 (LOC Auditor).
  - Action button: `Execute Refactor` with execution spinner and live SSE feedback.
- **Real-Time SSE Subscription**:
  - Connects to factory SSE stream `/v1/factory/events` and updates live status on `refactor_*` events.

### 4. Integration into Dashboard (`frontend/src/app/page.tsx`)
- Add `RefactorConsole` to dashboard tab list alongside `EvalConsole`, `SwarmConsole`, etc.
- Verify zero TypeScript compiler warnings or errors (`npm run build`).

## Related Code Files
- Create: `frontend/src/types/refactor.ts` (< 100 LOC)
- Create: `frontend/src/lib/zenos-refactor-client.ts` (< 100 LOC)
- Create: `frontend/src/components/RefactorConsole.tsx` (< 200 LOC)
- Modify: `frontend/src/app/page.tsx` (< 200 LOC)

## Implementation Steps
1. Create `frontend/src/types/refactor.ts` with strict TypeScript contracts (no `any`).
2. Create `frontend/src/lib/zenos-refactor-client.ts` with typed fetch helpers.
3. Create `frontend/src/components/RefactorConsole.tsx`:
   - Implement state management for `analysis`, `activePlan`, `isAnalyzing`, `isRefactoring`, `lastResult`.
   - Implement clean Tailwind UI cards and risk table.
   - Wire SSE event listener for `refactor_start`, `refactor_complete`, `refactor_rollback`.
4. Update `frontend/src/app/page.tsx`:
   - Import `RefactorConsole`.
   - Add tab trigger and panel.
5. Validate frontend build:
   - Run `cd frontend && npm run build` (or Next.js typecheck).
   - Ensure 0 errors and 0 `:any` violations.

## Success Criteria
- [ ] `RefactorConsole.tsx` is under 200 LOC.
- [ ] `frontend/src/types/refactor.ts` and `frontend/src/lib/zenos-refactor-client.ts` each under 100 LOC.
- [ ] UI displays workspace health score, monolith files, and slicing plans accurately.
- [ ] Executes refactor with dual-key consensus visualization.
- [ ] `npm run build` passes with zero TypeScript errors.

## Risk Assessment & Mitigation
- **Risk**: Large repositories cause slow `/analyze` rendering on the frontend.
- **Mitigation**: Paginate or truncate table to display top 10 highest-risk monoliths with search/filter capabilities.
