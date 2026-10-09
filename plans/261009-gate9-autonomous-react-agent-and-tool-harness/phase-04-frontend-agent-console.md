# Phase 4: Frontend Agent Console Component

## Overview
Implement `frontend/src/components/AgentConsole.tsx` allowing operators to trigger autonomous agent tasks and monitor live ReAct reasoning and tool observations via SSE.

## Requirements
1. `AgentConsole.tsx`:
   - Input prompt bar with Run and Abort controls.
   - Live stream display showing Thought, Tool Call, and Observation cards.
   - Status badge indicating active iteration and token estimations.
   - Dark-mode cyber-minimalist style consistent with ZenOS portal.
   - Zero `:any` TypeScript types.
   - Strictly `< 200 LOC`.
2. Connect client methods in `frontend/src/lib/zenos-client.ts`.
3. Update `frontend/src/types/factory.ts` with agent types.
4. Mount in `frontend/src/app/page.tsx`.

## Related Files
- Create: `frontend/src/components/AgentConsole.tsx`
- Modify: `frontend/src/types/factory.ts`
- Modify: `frontend/src/lib/zenos-client.ts`
- Modify: `frontend/src/app/page.tsx`
