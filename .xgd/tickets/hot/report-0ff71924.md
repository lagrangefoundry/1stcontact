---
uid: report-0ff71924
id: REPORT-818
type: report
title: Fix Framework Responsive Per-Breakpoint Dials (story) — attempt 5
created_by: xgd
created_at: '2026-07-23T09:21:24.511440+00:00'
updated_at: '2026-07-23T09:21:24.511440+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-bd0b722e
  level: story
  fixes_applied: 4
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-9260fc31
---

# Fix Summary — Framework Responsive Per-Breakpoint Dials (story)

**Attempt**: 5
**Fixes applied this call**: 4 (the operator disposition, applied across this attempt-5 task)
**Violations remaining**: 0
**Needs more work**: false

## What resolved the block

The sole finding (report-0801bb53 #1) was a `needs_review`: both reconciled
intents (BUNDLE-6, BUNDLE-7) retired CAP-68's delivery and re-homed the surviving
per-viewport behaviour to L1 (CAP-70/CAP-71), but neither stated the disposition
of the now-behaviourless CAP-68 *container*. The assessor's own note: resolution
"requires an operator to record the CAP-68 retire-vs-retain decision as intent
(a comment/field on the capability or a new disposition ticket)."

The operator decision — **RETIRE (superseded)** — has now been recorded, using
exactly those mechanisms. This is the retire path the assessor named
(`ac-deprecate` category); it manifests as retiring the container itself because
STORY-81 is already hollow (0 ACs — the module-dial ACs were removed in an
earlier attempt).

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-deprecate (retire path) | CAP-68 (capability-bd0b722e) | Set `status=superseded`, `superseded_by_uid=capability-ae9d65d6` (CAP-70). |
| 2 | ac-deprecate (retire path) | CAP-68 body | Rewrote body: "Disposition (operator decision) — RETIRE, do not retain", citing the BUNDLE-7 deletion (commit 1a2faeee) and the L1 re-homing (CAP-70/CAP-71). |
| 3 | story-body-edit | STORY-81 (story-3569e1a4) | Replaced the "open disposition / escalated / no repointing AC" hedge with the decided retirement, consistent with the superseded capability. |
| 4 | ac-deprecate (retire path) | CAP-68 comment | Added disposition `note` (COMMENT-357) recording the retire decision with explicit BUNDLE-6/BUNDLE-7 lineage — the "comment on the capability" mechanism the assessor named. |

No AC-level `ac-deprecate` was possible or needed: STORY-81 has 0 ACs (verified).

## Code Edits (if any)

None. Read-only against source; retirement is a matrix/intent disposition only.
`navCollapse`/`perBreakpoint`/`breakpointDial`: 0 hits in `packages/` + `tools/`
(delivery already gone). L1 successor present (`l1KeyframeSchema`/`l1SegmentSchema`,
`foldToL1`).

## Post-state consistency (verified this call)

| Check | Result |
|---|---|
| CAP-68 status | `superseded`, `superseded_by_uid=capability-ae9d65d6` |
| STORY-81 status | `archived` (correct under a superseded capability) |
| STORY-81 body | decided-retire language present; "open disposition"/"escalated in report" absent |
| ACs under STORY-81 | 0 |
| Disposition recorded as intent | capability field + body + COMMENT-357 note |

## needs_review Items Forwarded

None remaining. The single `needs_review` (container disposition) is resolved by
the recorded operator decision above. The intent ledger is no longer silent.
