---
uid: report-949d32d2
id: REPORT-7499
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T07:41:41.005416+00:00'
updated_at: '2026-11-01T07:41:41.005416+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-407a6fd8.md` (REQ-178) — intent/bookkeeping ticket (2e). Conflict was on frontmatter (`updated_at`, `completed_at`, `status`) and on the tail of the body. Kept HEAD (ours) wholesale via `git checkout --ours` + `git add --sparse`.
  - Frontmatter, same facts changed on each side: incoming 6e3dbdf3cc is dated 2026-09-04/05 and sets `status: free_coding`, `completed_at: null` (the state at the DOC-42 reopen). HEAD is dated 2026-11-01 with `status: free_and_reconciled` and a completed_at. Per the enrichment rule (more recent by timestamp), HEAD wins.
  - Body: HEAD is a strict superset. The incoming side ends at "([[REQ-180]] D5), not a model concept." HEAD has that same line plus the later sections "What the amendment landed…", "Test plan (amendment)" and "A fourth commit…". Superset kept.

## Incoming changes preserved

No code files were in conflict. The incoming commit's only change (an older status/timestamp update to REQ-178) has since been superseded by later updates to the same ticket that are already in HEAD, so it is redundant here, not discarded. The staged diff vs HEAD is empty, and the finalize step is expected to skip the empty commit.

## Arbitration of last resort (BUG-1460)

Not invoked. Resolved directly under 2e (superset rule plus later-timestamp rule for the frontmatter facts). Flagged for post-merge review per the enrichment rule ("intent unknown on one or both sides").
