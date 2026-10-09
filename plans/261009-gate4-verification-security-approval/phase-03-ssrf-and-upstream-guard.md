---
phase: 3
title: "ssrf-and-upstream-guard"
status: complete
effort: "medium"
---

# Phase 3: SSRF & Upstream Target Validator

## Overview
Implement `proxy/src/ssrf-guard.js` to protect against Server-Side Request Forgery and malicious upstream redirect targets.

## Status: Complete
- Created `proxy/src/ssrf-guard.js` (82 LOC).
- Created `proxy/tests/ssrf-guard.test.js` (64 LOC).
- 5/5 tests passing.
