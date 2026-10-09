# Phase 3: Real-Time SSE Stream Hook & State Sync

## Context Links
- Plan: [plan.md](./plan.md)
- Endpoint: `GET /v1/factory/events`

## Overview
- Priority: P1
- Status: Pending
- Description: Build a custom React hook `useFactoryEvents.ts` utilizing `EventSource` with auto-reconnection and zero-cascade state updates for real-time factory operations.

## Requirements
- Consume `/v1/factory/events` SSE stream.
- Buffer live log lines for Cook Console.
- Update Goal status reactively.
- Handle connection states (`connecting`, `connected`, `disconnected`).
- File size strictly < 200 LOC.

## Related Code Files
- Create: `frontend/src/hooks/useFactoryEvents.ts`

## Todo List
- [ ] Implement `frontend/src/hooks/useFactoryEvents.ts` (< 200 LOC).
- [ ] Connect hook into `frontend/src/app/page.tsx` and child factory components.
- [ ] Verify flicker-free real-time rendering.
