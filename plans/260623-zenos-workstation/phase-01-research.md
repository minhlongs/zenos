---
phase: 1
title: "Research"
status: completed
priority: P1
effort: "4h"
dependencies: []
---

# Phase 1: Research — ✅ Completed 2026-06-23

## Overview

Nghiên cứu LM Studio API, Claude Code integration capabilities, và M1 Max constraints để validate architecture.

## Implementation Completed

- ✅ LM Studio API endpoints documented (`/v1/chat/completions`, `/v1/models`)
- ✅ Claude Code configuration identified (`ANTHROPIC_BASE_URL`, skills)
- ✅ M1 Max constraints analyzed (64GB memory, model swap required)
- ✅ Format translation requirements defined
- ✅ Architecture validated (proxy approach confirmed)

## Key Findings

### LM Studio API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/models` | GET | List loaded models |
| `/v1/chat/completions` | POST | Chat completion (recommended) |
| `/v1/responses` | POST | Reasoning + stateful chats |
| `/api/v1/models/load` | POST | Load model |
| `/api/v1/models/unload` | POST | Unload model |

**Note:** LM Studio KHÔNG hỗ trợ `/v1/messages` (Anthropic format).

### Claude Code Configuration

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:20129"
  }
}
```

Custom commands tạo qua skills system (`~/.claude/skills/<name>/SKILL.md`).

### Model Constraints

| Model | Params | Q4_K_M Size | Load Time |
|-------|--------|-------------|-----------|
| Qwen3.6 35B | 35B | ~19GB | ~15s |
| DeepSeek R1 32B | 32B | ~17GB | ~12s |
| Gemma 4 27B | 27B | ~14GB | ~10s |

**Total: 50GB** — không đủ RAM để load simultaneously (64GB - 8GB OS = 56GB available).

## Success Criteria

- [x] LM Studio API endpoints documented
- [x] Claude Code integration method identified
- [x] M1 Max constraints analyzed
- [x] Format translation requirements defined
- [x] Architecture validated (proxy approach confirmed)

## Deliverables

- `docs/BRAINSTORM-SUMMARY.md`
- `README.md`
- `config/zenos.json`
