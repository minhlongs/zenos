# Phase 3: Supervisor & SSE API Integration

## Overview
Expose `/v1/factory/agent/run` and `/v1/factory/agent/:id` endpoints in `proxy/src/workflow/routes-factory.js` with real-time SSE streaming for agent events.

## Requirements
1. `POST /v1/factory/agent/run`:
   - Accepts `{ prompt, workspaceRoot, maxIterations }`.
   - Starts `ReactAgentLoop` asynchronously or synchronously.
   - Registers task in `AgentSupervisor`.
   - Returns `{ taskId, status: 'running' }`.
2. `GET /v1/factory/agent/:id`:
   - Returns task status, history, and checkpoint data.
3. Stream SSE events to connected clients (`agent_thought`, `agent_tool_call`, `agent_tool_result`, `agent_complete`).
4. Maintain `routes-factory.js` strictly `< 200 LOC`.

## Related Files
- Modify: `proxy/src/workflow/routes-factory.js`
- Create: `proxy/tests/agent-routes.test.js`
