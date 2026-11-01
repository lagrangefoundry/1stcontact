---
uid: report-5fea999a
id: REPORT-7741
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:45:33.955993+00:00'
updated_at: '2026-11-01T15:45:33.955993+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-407a6fd8.md` (REQ-178): intent/bookkeeping ticket (2e), UU on frontmatter. Resolved to OURS (HEAD) with `git checkout --ours` + `git add --sparse` (outside the sparse cone).
  - Incoming 1ccd778186 (2026-09-04 17:33:53 -0700) only advances status `free_coded` -> `ready_to_reconcile`, with updated_at 2026-09-05.
  - HEAD (2026-11-01) holds status `free_and_reconciled` with completed_at set, which is the lifecycle successor of `ready_to_reconcile` (the ticket has since reconciled).
  - Same fact (status) changed on both sides, so the later state (HEAD) is kept (more recent by timestamp, per the enrichment rule).

## Incoming changes preserved

Not a code file. Incoming's only change, a status transition, is superseded by HEAD's later status. The resolution stages with no net diff vs HEAD: the commit is redundant, not discarded.
