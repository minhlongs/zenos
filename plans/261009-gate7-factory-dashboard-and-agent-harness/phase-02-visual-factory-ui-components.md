# Phase 2: Visual Factory UI Components

## Context Links
- Plan: [plan.md](./plan.md)
- Wireframe: [factory-dashboard.html](../../docs/wireframes/factory-dashboard.html)
- Design Guidelines: [design-guidelines.md](../../docs/design-guidelines.md)

## Overview
- Priority: P1
- Status: Pending
- Description: Build visual, responsive React components styled with Tailwind CSS for Zen Studio, Cook Console, and Goal Pipeline.

## Requirements
- `ZenStudio.tsx`: Prompt entry, complexity gauge (1-5), local vs cloud model indicator, TDD strategy details.
- `CookConsole.tsx`: Terminal dark-mode stream view, iteration counter, LOC check badges.
- `GoalPipeline.tsx`: 5-step milestone stepper (`IDLE` -> `PLANNING` -> `COOKING` -> `VERIFYING` -> `COMPLETED`), pause/resume/abort buttons.
- All components strictly < 200 LOC per file.
- Integrate tabs into `frontend/src/app/page.tsx`.

## Related Code Files
- Create: `frontend/src/components/ZenStudio.tsx`
- Create: `frontend/src/components/CookConsole.tsx`
- Create: `frontend/src/components/GoalPipeline.tsx`
- Modify: `frontend/src/app/page.tsx`

## Todo List
- [ ] Implement `ZenStudio.tsx` (< 200 LOC).
- [ ] Implement `CookConsole.tsx` (< 200 LOC).
- [ ] Implement `GoalPipeline.tsx` (< 200 LOC).
- [ ] Update `frontend/src/app/page.tsx` with factory tabs.
