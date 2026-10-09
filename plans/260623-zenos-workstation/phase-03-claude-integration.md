---
phase: 3
title: "Claude Integration"
status: completed
priority: P1
effort: "4h"
dependencies: [2]
---

# Phase 3: Claude Integration — ✅ Completed 2026-06-23

## Overview

Integrate ZenOS với Claude Code: /model slash command, settings.json configuration, auto-recommendation.

## Implementation Completed

- ✅ /model slash command skill created
- ✅ Claude Code configuration template
- ✅ LM Studio manager script (Python)
- ✅ Model router script (Bash)
- ✅ Auto-recommendation integrated
- ✅ Installation & verification scripts

## Architecture

```
Claude Code
├── settings.json (ANTHROPIC_BASE_URL)
├── /model skill (~/.claude/skills/model-router/SKILL.md)
└── model-router.sh (backend handler)
    └── lmstudio-manager.py (LM Studio CLI)
```

## Deliverables

| File | Purpose |
|------|---------|
| `skills/model-router/SKILL.md` | Claude Code /model skill |
| `scripts/lmstudio-manager.py` | LM Studio CLI (status, switch, preset) |
| `scripts/model-router.sh` | /model command handler |
| `scripts/install.sh` | Installation automation |
| `scripts/verify-setup.sh` | Setup verification |

## /model Commands

| Command | Description |
|---------|-------------|
| `/model` | Show all models (formatted output) |
| `/model qwen` | Switch to Qwen3.6 35B |
| `/model r1` | Switch to DeepSeek R1 Distill 32B |
| `/model gemma` | Switch to Gemma 4 26B A4B-it |
| `/model suggest "prompt"` | Auto-recommend model |
| `/model status` | Show LM Studio status |
| `/model preset <name>` | Apply preset (qwen|r1|gemma) |

## UX Output

```
──────────────────
Available Models
① Qwen3.6 35B A3B
Best for: ✓ Coding ✓ Repo Analysis ✓ Agent Tasks ✓ Tool Use
Command: /model qwen
──────────────────
② DeepSeek R1 Distill 32B
Best for: ✓ Reasoning ✓ Architecture ✓ Research ✓ Planning
Command: /model r1
──────────────────
③ Gemma 4 26B A4B-it
Best for: ✓ Creative ✓ Brainstorm ✓ Writing ✓ General Chat
Command: /model gemma
──────────────────
Current: Qwen3.6 35B A3B
```

## Success Criteria

- [x] /model hiển thị danh sách models đúng format
- [x] /model qwen switch sang Qwen
- [x] /model r1 switch sang DeepSeek R1
- [x] /model gemma switch sang Gemma
- [x] /model suggest "prompt" recommend model
- [x] /model status show LM Studio status
- [x] Claude Code connect qua proxy thành công
- [x] settings.json config đúng
- [x] CLAUDE.md có ZenOS section
- [x] Auto-recommendation hoạt động (proxy level)

## Configuration

**~/.claude/settings.json:**
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:20129",
    "ANTHROPIC_API_KEY": "zenos-local",
    "ZENOS_HOME": "~/ZenOS",
    "LMSTUDIO_URL": "http://localhost:1234"
  }
}
```

**~/.claude/CLAUDE.md** (append):
```markdown
## ZenOS Integration
- Proxy endpoint: http://localhost:20129
- LM Studio endpoint: http://localhost:1234
- Context: ~/ZenOS/memory/sqlite/context.db
- Model skill: /model (qwen, r1, gemma)
- Auto-recommend: Proxy tự động recommend model dựa trên prompt
```

## Keyword Dictionaries

- **Qwen:** refactor, typescript, react, python, bug, repo, mcp, api, function, class, import, export, debug, fix, implement, test, code, coding, git, commit, merge, deploy, docker, database, query, endpoint, component, hook, state, props, async, await
- **R1:** architecture, reasoning, design, research, system, planning, tradeoff, analyze, compare, evaluate, strategy, complex, algorithm, performance, optimization, scalability, pattern, paradigm, theory, philosophy, trade-off, decision, assessment, investigation
- **Gemma:** idea, brainstorm, writing, creative, content, story, essay, blog, article, copy, narrative, fiction, poem, lyrics, draft, rewrite, polish, tone, style, voice, imagine, concept, theme
