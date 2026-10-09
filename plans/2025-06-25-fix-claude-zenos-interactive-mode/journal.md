---
title: "Fix: claude-zenos interactive mode support"
date: 2025-06-25
type: fix
status: completed
---

## Context
`claude-zenos` được tạo ra như unified launcher với auto-routing + direct LM Studio. Tuy nhiên, ban đầu nó chỉ hỗ trợ task mode (có prompt) và error khi chạy không có arguments.

## Problem
```
$ claude-zenos
❌ Error: No task specified
Usage: claude-zenos "your task"
   or: claude-zenos (for interactive Claude Code)
```

## Root Cause
`scripts/claude-zenos.py` thiếu branch xử lý interactive mode — khi `prompt` rỗng, code exit với error thay vì exec Claude Code shell.

## Solution
Thêm logic vào `main()`:
```python
# Case: Interactive mode (no prompt, not dry-run)
if not prompt:
    log("Interactive mode - executing Claude Code")
    clean_claude_env()
    claude_bin = get_claude_bin_path()
    os.execvp(claude_bin, [claude_bin])
    return
```

## Changes
- **scripts/claude-zenos.py**: Added interactive mode support (lines ~393-399)
- **scripts/verify-setup.sh**: Added 3 tests for `claude-zenos` (availability, dry-run, status)
- **config/zenos.json**: Already had `display_names` for ZenOS branding (previously added)
- **README.md**: Already documented `claude-zenos` usage (previously updated)

## Verification
```bash
# Status display (dry-run no prompt)
claude-zenos --dry-run ✅

# Task mode with routing
claude-zenos --dry-run "implement API" ✅

# Interactive mode (fixed)
claude-zenos ✅ → launches Claude Code shell with direct LM Studio
```

All 11 verification tests pass.

## Impact
- **Backward compatible**: No changes to `claude`, `claude-lm`
- **Blast radius**: Only `claude-zenos.py` (1 file)
- **UX improvement**: `claude-zenos` now fully functional as unified launcher
