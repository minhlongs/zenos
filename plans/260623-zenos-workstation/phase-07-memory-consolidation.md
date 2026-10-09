---
title: "Memory Consolidation"
description: "Implement memory consolidation services: deduplication, importance scoring, and session summarization"
status: completed
priority: P2
effort: medium
phase: 7
blockedBy: []
blocks: []
created: "2026-06-26T17:43:00.000Z"
createdBy: "ck:cook"
source: skill
tags: ["memory", "consolidation", "dedup", "summarization"]
---

# Phase 7: Memory Consolidation — ✅ Completed 2026-06-27

## Overview

Implement memory consolidation services to manage the growing vector memory store. As sessions accumulate, raw memory entries become redundant and noisy. This phase adds:

1. **Deduplication** — Detect and merge semantically similar memory entries
2. **Importance Scoring** — Rank memories by relevance, recency, and access frequency
3. **Session Summarization** — Compress verbose session memories into concise summaries
4. **Consolidation Pipeline** — Automated periodic cleanup integrated with the context manager

**Update (2026-06-27):** Phase implementation complete and verified. All tests passing, documentation updated.

## Objectives

- [x] Create `memory-consolidator.js` — orchestration service for consolidation pipeline
- [x] Create `memory-dedup.js` — semantic deduplication using vector similarity
- [x] Extend `context-manager.js` with consolidation hooks
- [x] Update `config/zenos.json` with consolidation settings
- [x] Add `/memory/consolidate` API endpoint
- [x] Write unit tests for consolidator and dedup (12 tests passing)
- [x] Document consolidation in `docs/MEMORY.md`

## Implementation

### Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/services/memory-consolidator.js` | Created | Orchestrates consolidation pipeline (dedup, scoring, summarization) |
| `src/services/memory-dedup.js` | Created | Semantic deduplication using cosine similarity threshold |
| `src/services/context-manager.js` | Modified | Added `consolidate()`, `scoreImportance()` methods |
| `src/index.js` | Modified | Added `/memory/consolidate` endpoint |
| `config/zenos.json` | Modified | Added `consolidation` config block |
| `tests/test-memory-consolidator.js` | Created | Unit tests (7) |
| `tests/test-memory-dedup.js` | Created | Unit tests (5) |
| `docs/MEMORY.md` | Modified | Added consolidation section |

### API Endpoints

- `POST /memory/consolidate` — Run full consolidation pipeline (dedup + scoring + summarization)
- `GET /memory/stats` — Memory statistics (total entries, duplicates found, avg importance)
- `POST /memory/dedup` — Run deduplication only
- `POST /memory/score` — Re-score all memories by importance

### Configuration

```json
{
  "zenos": {
    "consolidation": {
      "enabled": true,
      "dedup": {
        "similarity_threshold": 0.92,
        "keep_strategy": "newest"
      },
      "importance": {
        "recency_weight": 0.4,
        "access_weight": 0.3,
        "relevance_weight": 0.3
      },
      "summarization": {
        "enabled": true,
        "min_entries_to_summarize": 10,
        "compression_ratio": 0.3
      },
      "schedule": {
        "auto_run": true,
        "interval_minutes": 60
      }
    }
  }
}
```

### Implementation Steps

1. **memory-dedup.js** — Implemented cosine similarity comparison between embedding vectors. Uses configurable threshold (default 0.92). Merges duplicates by keeping the newest entry and transferring access counts.

2. **memory-consolidator.js** — Pipeline service that orchestrates:
   - Phase 1: Deduplication (calls memory-dedup)
   - Phase 2: Importance scoring (weighted formula: recency + access frequency + semantic relevance)
   - Phase 3: Session summarization (compresses groups of related memories into summary entries)
   - Returns consolidation report with counts and actions taken

3. **context-manager.js** — Extended with:
   - `consolidate()` — triggers full pipeline, updates SQLite + Qdrant
   - `scoreImportance()` — calculates importance score for a memory entry
   - `getMemoryStats()` — returns aggregate statistics

4. **index.js** — Added 4 new endpoints wired to consolidator service.

5. **config/zenos.json** — Added `consolidation` block with dedup thresholds, importance weights, and scheduling options.

## Testing

**Unit Tests:**
- Memory Consolidator: 7/7 passing
- Memory Dedup: 5/5 passing
- Total unit: 12/12

**Full Suite:** Router (18) + Adapter (7) + Vector (8) + Embedding (11) + Consolidator (7) + Dedup (5) = **56/56 passing**

## Acceptance Criteria

- ✅ Deduplication detects similar entries above configurable threshold
- ✅ Importance scoring combines recency, access, and relevance
- ✅ Session summarization compresses verbose entries
- ✅ Consolidation pipeline runs end-to-end
- ✅ API endpoints return structured JSON responses
- ✅ All existing tests pass (no regression)
- ✅ Configuration supports tuning without code changes

## Notes

- Deduplication uses vector similarity (Qdrant) with SQLite fallback to keyword comparison
- Importance scores range 0.0–1.0, stored in SQLite metadata
- Summarization creates new memory entries with `type: "summary"` flag
- Auto-schedule runs consolidation every 60 minutes when proxy is idle

## Validation

- ✅ Code review passed (no breaking changes)
- ✅ All tests pass (56/56)
- ✅ No lint/type errors
- ✅ Public contracts stable (ContextManager extended, not changed)

---

**End of Phase 7 — All phases complete**
