---
phase: 2
title: "Proxy Server"
status: completed
priority: P1
effort: "8h"
dependencies: [1]
---

# Phase 2: Proxy Server — ✅ Completed 2026-06-23

## Overview

Build ZenOS Proxy server — Anthropic-compatible API wrapper cho LM Studio.

## Implementation Completed

- ✅ Express server với 3 endpoints
- ✅ Model Router với auto-selection
- ✅ Anthropic Adapter format translation
- ✅ Context Manager với sql.js
- ✅ Error handling và timeouts
- ✅ Unit tests (17/17 passing)

## Architecture

```
┌─────────────────────────────────────────────┐
│           ZenOS Proxy (port 20129)           │
│                                             │
│  ┌─────────────┐  ┌──────────────────┐     │
│  │ Model Router │  │ Anthropic Adapter│     │
│  │ - Select    │  │ - toLMStudio()   │     │
│  │ - Forward   │  │ - fromLMStudio() │     │
│  │ - Switch    │  │ - toOpenAI()     │     │
│  └─────────────┘  └──────────────────┘     │
│                                             │
│  ┌──────────────────────────────────┐      │
│  │      Context Manager              │      │
│  │  - enrich(messages)               │      │
│  │  - saveMessage()                  │      │
│  │  - saveMemory()                   │      │
│  └──────────────────────────────────┘      │
└─────────────────────────────────────────────┘
```

## Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/models` | GET | List available models |
| `/v1/messages` | POST | Anthropic-compatible chat |
| `/v1/chat/completions` | POST | OpenAI-compatible chat |
| `/health` | GET | Health check |
| `/model/switch` | POST | Manual model switch |
| `/model/recommend` | GET | Auto-recommend model |

## Deliverables

| File | Purpose |
|------|---------|
| `proxy/src/index.js` | Express server entry |
| `proxy/src/services/model-router.js` | Model selection & routing |
| `proxy/src/services/anthropic-adapter.js` | Format translation |
| `proxy/src/services/context-manager.js` | SQLite context (sql.js) |
| `proxy/tests/test-router.js` | Unit tests (10 tests) |
| `proxy/tests/test-adapter.js` | Unit tests (7 tests) |
| `proxy/tests/test-integration.js` | Integration tests (E2E) |
| `proxy/package.json` | Dependencies |

## Success Criteria

- [x] Express server runs on port 20129
- [x] GET /v1/models returns 3 models
- [x] POST /v1/messages forwards to LM Studio
- [x] POST /v1/chat/completions forwards to LM Studio
- [x] Model auto-selection works (keyword scoring)
- [x] Model switching works (unload/load)
- [x] Context enrichment injects recent messages
- [x] Error handling covers LM Studio downtime
- [x] Health check endpoint returns status
- [x] All unit tests pass (17/17)

## Test Results

```
Testing Model Router...
  ✓ selectModel with explicit model ID
  ✓ selectModel with partial name
  ✓ selectModel with coding keywords
  ✓ selectModel with reasoning keywords
  ✓ selectModel with creative keywords
  ✓ selectModel respects system prompt
  ✓ recommend method
  ✓ fallback when no keywords match
  ✓ getAvailableModels returns correct structure
  ✓ getStatus returns correct structure

Testing Anthropic Adapter...
  ✓ toLMStudio basic conversion
  ✓ toLMStudio without system in messages
  ✓ fromLMStudio basic conversion
  ✓ fromLMStudio with tool calls
  ✓ toOpenAICompatible format
  ✓ toOpenAIResponse format
  ✓ Content formatting with thinking

All tests passed (17/17)
```

## Notes

- Database engine: `sql.js` (pure JS, no native compilation) để tránh Node 26 compatibility issues
- Keyword matching: Fixed bug — 'architecture' keyword maps to R1 model correctly
- Context limit: 10 recent messages, truncated to 200 chars each
