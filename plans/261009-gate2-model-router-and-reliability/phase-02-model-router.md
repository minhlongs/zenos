---
phase: 2
title: "model-router"
status: complete
effort: "medium"
---

# Phase 2: Model Router & Capability Validation

## Overview

Implement the model routing subsystem in `proxy/src/router.js` to translate Anthropic model IDs sent by Claude Code (`claude-3-5-sonnet*`, `claude-3-opus*`, `claude-3-haiku*`, `claude-3-7-sonnet*`) into available local LM Studio models. Validate incoming requests against model capabilities to fail early before dispatching invalid workloads to the local runtime.

## Key Insights

- Claude Code dynamically passes Anthropic model identifiers in `/v1/messages`.
- LM Studio loads specific model weights identified by custom names (e.g., `qwen2.5-coder-7b-instruct`, `deepseek-r1-distill-qwen-14b`).
- Clean separation: pure functions for alias resolution and validation, completely decoupled from HTTP transport.
- Code budget: `proxy/src/router.js` strictly < 200 LOC.

## Related Code Files

- Create: `proxy/src/router.js`
- Modify: `proxy/src/config.js` (add model alias configuration parser)
- Test: `proxy/tests/router.test.js`

## Implementation Steps

1. **Update `proxy/src/config.js`:**
   - Parse `MODEL_ALIASES` environment variable with safe JSON parsing or comma-separated pairs.
   - Provide robust default alias mappings:
     - `claude-3-5-sonnet*` -> `DEFAULT_MODEL` (fallback: `local-model`)
     - `claude-3-7-sonnet*` -> `DEFAULT_MODEL`
     - `claude-3-opus*` -> `DEFAULT_MODEL`
     - `claude-3-haiku*` -> `DEFAULT_MODEL`
   - Expose `DEFAULT_MODEL` (defaults to `local-model` or `LMSTUDIO_DEFAULT_MODEL`).

2. **Implement `proxy/src/router.js`:**
   - Function `resolveModel(requestedModel, aliasMap, defaultModel)`:
     - Exact match lookup in `aliasMap`.
     - Prefix / wildcard lookup (e.g., matching wildcard pattern `claude-3*` or prefix matching).
     - Fallback to `defaultModel` if no pattern matches.
   - Function `validateCapabilities(resolvedModel, requestBody, capabilitiesMap)`:
     - Check if request contains tools (`tools` array present and non-empty).
     - If tools are present and the model lacks tool-calling capabilities, throw standard `InvalidRequestError` ("Model does not support function calling / tools").
     - Validate prompt token budget against context limit if configured.

3. **Verify with TDD Suite:**
   - Run `node --test tests/router.test.js`.
   - Verify all tests transition from Red to Green.

## Success Criteria

- [ ] `proxy/src/router.js` implemented with pure, testable functions strictly < 200 LOC.
- [ ] Config supports dynamic `MODEL_ALIASES` and fallback `DEFAULT_MODEL`.
- [ ] 100% of unit tests in `proxy/tests/router.test.js` pass cleanly.
