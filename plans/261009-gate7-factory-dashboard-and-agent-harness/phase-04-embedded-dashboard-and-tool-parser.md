# Phase 4: Embedded Dashboard Extension & Local Tool Runner

## Context Links
- Plan: [plan.md](./plan.md)
- Existing Embedded Dashboard: `proxy/src/dashboard-html.js`
- Workflow Engine: `proxy/src/workflow/`

## Overview
- Priority: P1
- Status: Pending
- Description: Extend the zero-dependency embedded dashboard (`/dashboard`) with factory indicators, and implement `tool-parser.js` for local model XML tool call extraction.

## Requirements
- `proxy/src/dashboard-html.js`: Add lightweight factory badges and SSE listener while keeping under 200 LOC.
- `proxy/src/workflow/tool-parser.js`: Robust XML/JSON tool extraction supporting `<tool_call name="...">` and `<function_calls>` formats with parameter validation.
- All files strictly < 200 LOC.

## Related Code Files
- Modify: `proxy/src/dashboard-html.js`
- Create: `proxy/src/workflow/tool-parser.js`
- Create: `proxy/tests/tool-parser.test.js`

## Todo List
- [ ] Extend `proxy/src/dashboard-html.js` (< 200 LOC).
- [ ] Implement `proxy/src/workflow/tool-parser.js` (< 200 LOC).
- [ ] Write unit tests in `proxy/tests/tool-parser.test.js`.
