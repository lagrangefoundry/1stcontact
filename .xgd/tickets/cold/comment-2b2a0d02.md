---
uid: comment-2b2a0d02
id: COMMENT-652
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-05T19:14:54.401362+00:00'
updated_at: '2026-08-05T19:14:54.401362+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-6a9c04b4
  kind: note
---

**Result: PASS** — REPORT-1296 (`report-6a9c04b4`), 0 violations, 0 warnings, 0 needs_review.

## What I found

CAP-73 was absorbed into CAP-71 by the 2026-08-05 structural rebalance. Its story tree is empty → AC layer empty → **UAT layer empty**. Consistency, coverage, and exclusivity are vacuously satisfied.

The one trap here: `xgd ticket list --type story --filter fields.capability_uid=capability-8108afab` still returns STORY-86, which would suggest a live tree. That's the stale index the capability body warns about — `xgd ticket get story-24098299` reads `capability_uid: capability-2049c9ec` at a newer timestamp. I confirmed ownership from authoritative ticket reads, not index listings.

Rather than stop at "empty, therefore pass", I checked the substantive question — whether the UAT evidence survived the move:

- All 11 departed ACs (AC-705–710, AC-724, AC-734–737) resolve to present UATs in `tests/reconciliation-3probe-gate.test.ts` and `tests/reconciliation-3probe-gate-evaluator.test.ts`. Zero resolve to NONE.
- Those suites are substantive, not stubs: 1362 lines, 210 assertions, and **zero `vi.mock`/`jest.mock`** — no internal mocking, so the evidence-validity rule holds.

Intent ledger (BUNDLE-7 / BUNDLE-8, both `free_and_reconciled`) shows no intent became unexpressed — ownership changed, existence didn't. BUNDLE-8's later refinements are visibly landed in the moved AC layer, each with a UAT.

## Two judgment calls worth flagging

**Warnings recorded as `info`, not counted.** Two real issues persist: CAP-73 is stuck at `status: active` with a now-vacuous `uat_coverage: pass`, and the story index is stale. Both are one upstream xgd tooling defect (`reject_deprecation_if_capability_has_stories` resolving against the canonical main store on a branch worktree), already filed in REPORT-1266 and already carried as warnings at story level. Counting them again at `uat` would triple-count a single defect across three levels, so they're cross-referenced as `info`. Neither is repairable from this project's tickets; both clear when the index is rebuilt on main.

**One item needs to survive this capability's deprecation.** STORY-86's body still calls CAP-71 an *external* dependency in three places, but post-absorption it lives *inside* CAP-71 alongside STORY-84. That's a `story-body-edit` against CAP-71, out of scope here — I repeated it in the report's editor notes because once CAP-73 is deprecated, its reports stop being read and the finding would otherwise be lost.
