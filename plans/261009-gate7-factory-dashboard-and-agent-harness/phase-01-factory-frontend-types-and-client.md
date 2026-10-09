# Phase 1: Factory Frontend Types & API Client Extension

## Context Links
- Plan: [plan.md](./plan.md)
- Wireframe: [factory-dashboard.html](../../docs/wireframes/factory-dashboard.html)
- Existing Client: `/Users/macbook/ZenOS/frontend/src/lib/zenos-client.ts`

## Overview
- Priority: P1
- Status: In Progress
- Description: Define TypeScript interfaces for Factory entities (`ZenPlan`, `CookCycleResult`, `GoalStatus`, `FactoryEvent`) and extend `ZenosClient` with factory methods.

## Requirements
- Zero `:any` types in `factory.ts`.
- Typed responses matching proxy `/v1/factory/*` contract.
- Keep `frontend/src/types/factory.ts` and `frontend/src/lib/zenos-client.ts` strictly < 200 LOC.

## Related Code Files
- Create: `frontend/src/types/factory.ts`
- Modify: `frontend/src/lib/zenos-client.ts`

## Todo List
- [ ] Create `frontend/src/types/factory.ts` with strict interfaces.
- [ ] Add `triggerZen`, `runCook`, `getGoal`, `pauseGoal`, `resumeGoal`, `abortGoal` to `ZenosClient`.
- [ ] Verify TypeScript types without errors.
