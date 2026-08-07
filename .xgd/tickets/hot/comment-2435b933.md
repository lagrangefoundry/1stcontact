---
uid: comment-2435b933
id: COMMENT-792
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-08-07T19:17:33.827573+00:00'
updated_at: '2026-08-07T19:17:33.827573+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-378dec0b
  kind: note
---

## UAT Coverage: CAP-88 (Site Asset Store) — **PASS**

**REPORT-1612** (`report-378dec0b`) · 0 violations · 2 warnings · 0 needs_review

### What I found

**CAP-88 is a retired shell — it owns nothing to assess.** `status: superseded`, `superseded_by_uid: capability-b4ac88fc` (CAP-89), set at 18:53 today by the story-level structural fix (REPORT-1608), which also copied CAP-88's otherwise-stranded scope statements into CAP-89's body. Its sole story STORY-102 now carries `capability_uid = capability-b4ac88fc`; its six criteria AC-1018…AC-1023 hang off that story. Zero stories and zero ACs point at CAP-88.

I verified this from the tickets themselves rather than the index — I fetched all 25 stories individually with `xgd ticket get --json`. That mattered: the index still answers `fields.capability_uid=capability-105cfacf` with STORY-102, and that stale answer is the only reason this capability was scheduled into the batch.

**The subject matter is genuinely evidenced, re-derived rather than inherited.** I ran `tests/reconciliation-site-asset-listing.test.ts` — **6/6 passed** in 820ms. The UATs drive real entry points: `run(['asset','list',slug,'--json'])` over real temp site trees, and `startBuilder` + live `fetch` over HTTP. Nothing internal is mocked. AC-1023 is the load-bearing one for "one listing, many consumers" — it asserts the CLI and the builder origin return the *same* entries, not that each separately matches a constant.

Intent ledger: REQ-118 (`free_and_reconciled`, merged `b2b9208c`) created this behavior; nothing of counting status retires it. CAP-88's retirement was structural consolidation, not intent.

I did **not** rewrite `uat_coverage` on STORY-102 or AC-1018…AC-1023 — they belong to CAP-89's tree and already carry `pass` from REPORT-1606. Writing them from a retired capability's assessment would give them two owners.

### Two workflow-level hazards worth your attention

1. **The prompt's AC→UAT lookup can never hit.** It builds the key as `.replace('-','').upper()` → `AC1018`, but `.xgd/uat_index.json` keys are lowercase (`ac1018`). Followed literally it returns `[]` for *every* AC in the project, which reads as "no test exists" — a coverage-gap generator. Should be `.lower()`.
2. **The index is unsafe as a retirement check.** `xgd ticket list --type capability --json` omits `superseded_by_uid` entirely, so an index-based "is this retired?" reads false for every retired capability. Combined with the stale story→capability mapping (already escalated in REPORT-1608, needs `xgd ticket rebuild-index` from `xgd-working`), any other capability retired in the same consolidation — CAP-80, CAP-83, CAP-81, CAP-84 — still in this batch will produce this same shaped report. One rebuild-index pass clears the cause for all of them.

No fix loop should run against CAP-88; there is nothing in its tree for one to edit.
