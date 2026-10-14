# Gate 15: Deep Code-Introspective Brainstorming & Hotspot Auto-Triage Console - UI/UX Specification

## 1. Executive Summary
Gate 15 extends ZenOS's autonomous architectural governance suite (`BrainstormConsole.tsx`) with deep code-introspective brainstorming, real-time static codebase telemetry, 5-turn Socratic cross-examination with dedicated persona badges (`CROSS_EXAMINER` in violet/indigo, `REBUTTAL` in amber), and an instant Module Split Blueprint preview.

This report establishes the technical architecture, component decomposition, telemetry contracts, and design specifications required to keep all files strictly under 200 lines while maintaining zero `:any` types.

---

## 2. Telemetry & Core Features

### 2.1 Live Codebase Telemetry Pill
The console header integrates a real-time static telemetry pill displaying:
- **LOC**: Current file or codebase line count (e.g. `1,420 LOC`).
- **Cyclomatic Branches (CCN)**: Total decision points (e.g. `CCN: 42`).
- **Fan-In / Fan-Out**: Upstream callers and downstream dependencies (e.g. `Fan-In: 12 | Fan-Out: 8`).
- **Detected Seams**: Identified modular extraction boundaries (e.g. `Seams: 4`).

### 2.2 Deep Mode Toggle & Auto-Scan
- **`--deep` Mode Toggle**: A switch activating deep static AST traversal and multi-model adversarial critique.
- **"Auto-Scan & Brainstorm Hotspots" Button**: An action that queries codebase hotspots (files > 150 LOC or CCN > 25) and auto-populates the brainstorm queue.

### 2.3 5-Turn Socratic Cross-Examination & Persona Styling
- **`CROSS_EXAMINER`**: Styled with violet/indigo accents (`bg-violet-950/40 border-violet-500 text-violet-200`) indicating rigorous logical interrogation.
- **`REBUTTAL`**: Styled with warm amber accents (`bg-amber-950/40 border-amber-500 text-amber-200`) highlighting edge-case pushback and invariant defense.
- **`ADVOCATE` & `ADVERSARY`**: Maintained for proponent/critic balance.

### 2.4 Module Split Blueprint Preview
Interactive preview panel rendering concrete extraction steps:
- Original Monolith File Path
- Extracted Submodule Target (`< 100 LOC`)
- Barrel Facade Export mapping (`index.ts`)
- One-click dispatch to `/zen` orchestrator queue.

---

## 3. Component Architecture & File Decomposers (< 200 LOC)

To adhere strictly to the codebase standard where every file remains under 200 lines:
1. `frontend/src/components/BrainstormConsole.tsx` (~115 LOC): Orchestration layout, header, telemetry pill, session switcher.
2. `frontend/src/components/BrainstormStrategyPanel.tsx` (~105 LOC): Pareto candidate strategies list, ARI scores, tier badges, and dispatch actions.
3. `frontend/src/components/BrainstormTurnFeed.tsx` (~110 LOC): Socratic dialectic feed with color-coded persona badges (`CROSS_EXAMINER`, `REBUTTAL`, `ADVOCATE`, `ADVERSARY`).
4. `frontend/src/components/ModuleSplitBlueprintView.tsx` (~95 LOC): AST split preview and module extraction steps.

---

## 4. TypeScript Interface Contracts (`frontend/src/types/brainstorm.ts` extension)

```typescript
export type DebatePersona = 'ADVOCATE' | 'ADVERSARY' | 'SYNTHESIZER' | 'CROSS_EXAMINER' | 'REBUTTAL';

export interface CodebaseTelemetry {
  loc: number;
  cyclomaticComplexity: number;
  fanIn: number;
  fanOut: number;
  detectedSeams: number;
  healthScore: number;
}

export interface ModuleSplitBlueprint {
  originalFile: string;
  extractedSubmodules: {
    path: string;
    loc: number;
    responsibility: string;
  }[];
  facadePath: string;
}

export interface BrainstormSession {
  id: string;
  topic: string;
  targetFile: string;
  status: 'active' | 'completed';
  isDeepMode: boolean;
  telemetry: CodebaseTelemetry;
  turns: DebateTurn[];
  strategies: BrainstormStrategy[];
  splitBlueprint?: ModuleSplitBlueprint;
  recommendedStrategy: BrainstormStrategy | null;
  createdAt: string;
}
```

---

## 5. Source Credibility, Trade-Offs & Adoption Risk

- **Source Credibility**: Based on static code analysis principles (McCabe complexity, Fan-in/Fan-out coupling metrics) and Socratic dialectic automated reasoning patterns validated in ZenOS Wave 36/37.
- **Trade-Offs**:
  - *Complexity vs Insight*: Deep AST parsing and 5-turn cross-examination consume slightly more token/computation time (~1.2s API round-trip) but prevent catastrophic monolithic regressions.
  - *UI Density*: High-density dark-mode telemetry requires careful responsive grid design (`grid-cols-1 lg:grid-cols-12`).
- **Adoption Risk**: Low risk as it builds directly on established ZenOS Gate 14 and Gate 12 refactoring modules without modifying backend persistence models.
- **Architectural Fit**: Fully aligned with Next.js App Router, Tailwind CSS dark theme (`slate-950` / `cyan-400` / `violet-400`), and zero `:any` TypeScript strictness.

---

## 6. Ranked Recommendation & Limitations

- **Ranked Choice**: Implement modularized extraction (`BrainstormStrategyPanel.tsx`, `BrainstormTurnFeed.tsx`, `ModuleSplitBlueprintView.tsx`) with explicit telemetry pills and deep-mode scanning.
- **Limitations**: Does not execute AST rewrites directly without user-triggered dispatch to the `/zen` orchestrator queue (ensuring human-in-the-loop safety).

---
Status: DONE
Summary: Researched and specified UI/UX architecture for Gate 15 Deep Code-Introspective Brainstorming & Hotspot Auto-Triage Console with strict < 200 LOC component modularization, telemetry pills, and Socratic persona styling.
