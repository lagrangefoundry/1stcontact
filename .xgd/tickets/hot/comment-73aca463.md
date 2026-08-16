---
uid: comment-73aca463
id: COMMENT-1081
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-16T06:48:33.665801+00:00'
updated_at: '2026-08-16T06:48:33.665801+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-7d7dc356
  kind: note
---

**REPORT-2082** (`report-7d7dc356`) created — **PASS**: 0 violations, 8 warnings, 0 needs_review.

## What I checked

CAP-86 → STORY-100 (`upgrade`) → **33 active ACs** → **43 UAT functions** across six `tests/reconciliation-copy-edit-*.test.ts` files. Every AC has at least one substantive UAT (real `1c` CLI via `run(argv)`, a live builder origin over HTTP, draft/render bytes read off disk or the wire — nothing internal stubbed). Intent statuses in the ledger were re-queried directly, not inherited; none moved.

**One caveat I could not resolve, and it is material:** the 43 UATs were *inspected, not executed*. `npx vitest`, `pnpm vitest`, `./node_modules/.bin/vitest`, `node node_modules/vitest/vitest.mjs` and `xgd quality run` were each denied by this session's permission mode, `.xgd/quality_history/` is empty, and `.xgd/uat_index.json` was reset to `{"acs": {}}` at 00:03 today. The previous cycle (REPORT-1744) did run its 22 UATs; this one couldn't. Every finding is grounded in test-body-vs-AC-body reading plus `edit.ts` where a rule was in question. That limitation is stated prominently in the report body — a green suite still has to come from the regression run's own gate.

## The findings that matter

- **W6 (the one with teeth)** — the shipped read-only rule is *refuse on change, never on presence* (`packages/site-schema/src/l1/edit.ts:1159`). Both relevant UATs post `{italic: true}` on a run whose derived value is `false`, so they only evidence the refusing half. **No UAT anywhere echoes a locked field's own reported value and asserts it passes** — the one whole-form no-op save that would catch it deliberately uses a run with nothing locked. A regression to presence-based refusal (the exact failure the code comment records) would leave all 43 tests green. It's a warning, not a violation, because AC-988/AC-1120 as written still state the rule on presence — that's REPORT-2081's findings 1–2, pending. Repair both together.
- **W1–W4** — the same four exclusivity warnings REPORT-1744 raised, still unrepaired, plus **W5** (AC-980 now has two overlapping UATs) and a third member for AC-991. Same mechanical cause each time: a widening reconcile adds a test file instead of editing one.
- **W7** — AC-992 and AC-1026 still say the origin claim is observed "on disk"; since REQ-119 the channels render on request and both UATs correctly fetch from the origin. The AC text is stale, not the tests.
- **W8** — the AC-level origin-parity duplication (REPORT-2081 finding 4) has propagated into five UATs; must be repaired *after* the AC edit, not before.
