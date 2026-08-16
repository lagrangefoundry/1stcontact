---
uid: comment-b30106aa
id: COMMENT-1090
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-08-16T08:05:47.916414+00:00'
updated_at: '2026-08-16T08:05:47.916414+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-2a0fed77
  kind: note
---

Assessment complete. **REPORT-2091** (`report-2a0fed77`) — **FAIL**: 8 violations, 3 warnings, 0 needs_review.

## Verdicts written
- **34 ACs**: 31 pass, 3 fail (AC-689, AC-691, AC-694). AC-1133/AC-1134 graded for the first time (added by REQ-136 after the last cycle) — both pass with unusually strong tests that pin the negative space.
- **Both stories**: fail. **Capability**: fail.

## What I could and couldn't do
`npx vitest` was refused in this harness mode (as it was last cycle), so I graded test bodies against AC bodies statically. That's the right instrument for *"does this test substantively exercise the claim?"* — and all three failing ACs fail on **what their tests assert**, not on whether they pass, so execution wouldn't move them. I've said so plainly in the report rather than implying a green suite.

## The finding that changes the editor's work
Previous cycles recorded four STORY-84 items as coverage holes. They aren't. Each behavior is live in `fold.ts` **and already proven** by a substantive free-coded suite — `bug17-fold-padding`, `bug18-responsive-text-axes` (incl. a mobile≠desktop discriminator), `bug20-chip-self-surface`, `req88-viewport-relative-and-nowrap` (asserts `kf.atHeight` per width). They're named `test_UAT_FC_<INTENT>_*`, traceable to intent but not to an AC. So the defect is that the **matrix under-describes the fold**, not that the fold is unproven — the repair is story-body-edit + ac-add with the UAT *re-attributed*, not authored from scratch.

## Genuinely uncovered
One behavior in this whole capability has zero evidence anywhere: **pinned-box content overflow** (`probes.ts:410-415`, detail `content height Npx exceeds pinned box height Mpx`). The story body claims it, no AC states it, and no test reaches it. AC-710's clip assertion takes the *viewport-edge* clip and only checks `/\d+px/` — which both details match, so it doesn't discriminate. Fourth consecutive cycle unrepaired; I flagged it as the priority.

Also worth the editor's attention: AC-694's substantive half sits behind a silent `if (!(await chromiumAvailable())) return`, and its always-run half asserts properties of `CANNED_HINTS` — a constant the test itself feeds the driver. A UAT whose real assertions can vanish without changing the result isn't evidence; making the skip explicit is part of the fix.

Intent statuses in my ledger were re-read from live tickets rather than inherited from the prior reports.
