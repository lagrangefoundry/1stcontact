---
uid: report-c6d8ba77
id: REPORT-4245
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-09-14T06:51:56.966145+00:00'
updated_at: '2026-09-14T06:51:56.966145+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-3cf3d57b
---

I wrote the 14 UATs and ran them. Four real defects on this branch block most of them — none is a fault in the tests.

**Test files created**

- `tests/reconciliation-assistant-two-knowledge-bases.workers.test.ts` — 12 UATs (AC-1795–1799, AC-1802–1808), driven through the Worker's own `/api/ai/session` and `/api/ai/prompt` against real D1/R2, reading the assembled context via `modelSaw` (the reminder rides the message tail now, not `system`).
- `tests/reconciliation-assistant-arrival-notice-budget.test.ts` — 2 UATs (AC-1800, AC-1801), asserted on the notice itself since both are character-budget boundary claims.

**Results as the branch stands: 2 passed, 12 failed.** All 12 workers UATs fail on one line before reaching any assertion.

**The defects**

1. `tools/generate/src/cli/ai/host-core.ts:774` — `let seen = at` references an undeclared `at`; every turn throws `ReferenceError: at is not defined` and streams an error frame. `git log -S` shows BUG-43 added this line onto REQ-160's refactor, which had already moved the counter read out of `streamPrompt` into `reminderFor` — so the cherry-pick lost `const at = await store.counter(slug)`. `xgd-working` still has that line; this branch does not. `tsc` flags it (`TS2304: Cannot find name 'at'`). It is not story-specific but nothing in this story is assessable until it is restored.

I restored that one line locally to ground my assertions and then reverted it — `git status` shows only the two new test files. With it restored, **6 of 12 pass** and the remaining 6 isolate three genuine divergences from the ACs:

2. `apps/control-app/src/session-knowledge.ts:199,228` — `CoRankedKnowledge` calls the knowledge component with `source:`/`chunkSource:`, which the component replaced with `indexes:`/`chunkIndexes:` (its own REQ-112 landed upstream). Every conversation search now throws `knowledge base 'project' reads from source 'project', which this host has no index for (available: none)`. Breaks AC-1797, and the "retrievable through an ordinary search" half of AC-1798. `xgd-working` already uses `indexes:`.
3. `apps/control-app/src/session-delta.ts:270` — the bookmark is persisted only when the sweep moved it *or* the chat ticket was absent. Upstream's archive now creates the chat ticket at `openSession`, so on a quiet first turn neither holds and `kb_cursor` is never written — the bookmark is recomputed as `now` on every turn. A conversation whose client map has never been built therefore **never announces an arrival**. Breaks AC-1798 (the criterion the story exists for), AC-1802, AC-1804's no-map half, AC-1805. I verified `kb_cursor` is `undefined` on the chat ticket after two turns.
4. `apps/control-app/src/session-knowledge.ts:389` — `sessionPriming` hard-codes `kb: [...SESSION_KBS]` instead of the bases that actually opened. A conversation with no client knowledge fails priming with `unknown knowledge base(s): project (declared: system)`, reports `ready: false`, and streams that error instead of an answer. That is exactly what AC-1808 forbids.

I did not weaken any assertion or touch runtime code. Fix (1) first — nothing else can be evaluated until turns run.

```
UATs generated for story story-3cf3d57b (plan item 6 of 10)

Story: story-3cf3d57b
Test file(s) created:
  - tests/reconciliation-assistant-two-knowledge-bases.workers.test.ts
  - tests/reconciliation-assistant-arrival-notice-budget.test.ts

Tests written: 14
Tests passed: 2
Tests failed: 12

⚠️ TESTS FAILING — downstream fix-it loop required (production code, not tests)

Blocking all 12 workers UATs:
  - host-core.ts:774 `let seen = at` — undeclared `at`, lost in the BUG-43
    cherry-pick onto REQ-160. Restore `const at = await store.counter(slug)`
    above it. Also a tsc error (TS2304).

With that line restored, 6/12 pass and these remain:
  - test_UAT_AC1797_*: session-knowledge.ts:199,228 pass `source:`/`chunkSource:`
    to a component that now takes `indexes:`/`chunkIndexes:`
  - test_UAT_AC1798_*: as above, plus session-delta.ts:270
  - test_UAT_AC1802_*, AC1804_*, AC1805_*: session-delta.ts:270 — bookmark never
    persisted on a quiet first turn, so a no-map conversation never announces
  - test_UAT_AC1808_*: session-knowledge.ts:389 grants a map for a KB that did
    not open; priming throws and the turn streams an error

test_files_created:
  - "tests/reconciliation-assistant-two-knowledge-bases.workers.test.ts"
  - "tests/reconciliation-assistant-arrival-notice-budget.test.ts"
```
