# Phase 4: Frontend Supervisor & Process Isolation Monitor

## Overview
Expose live process trees, dead-man timers, and crash recovery status inside the Next.js 14 dashboard and embedded HTML portal.

## Requirements
- Create `frontend/src/components/SupervisorMonitor.tsx` displaying:
  - Active Process Groups with uptime and emergency kill trigger.
  - SQLite Crash Recovery status indicator.
  - Apple Silicon Metal inference admission queue.
- Update `frontend/src/types/factory.ts` and `frontend/src/lib/zenos-client.ts`.
- Update embedded fallback `proxy/src/dashboard-html.js` with live supervisor status.
- Zero `:any` types in TypeScript.
- Strictly < 200 LOC per file.

## Files
- Create: `frontend/src/components/SupervisorMonitor.tsx`
- Modify: `frontend/src/types/factory.ts`
- Modify: `frontend/src/lib/zenos-client.ts`
- Modify: `frontend/src/app/page.tsx`
- Modify: `proxy/src/dashboard-html.js`
