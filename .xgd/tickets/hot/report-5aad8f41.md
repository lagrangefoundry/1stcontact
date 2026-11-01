---
uid: report-5aad8f41
id: REPORT-7739
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:44:55.580588+00:00'
updated_at: '2026-11-01T15:44:55.580588+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-407a6fd8.md` (REQ-178): intent/bookkeeping ticket (2e), UU on frontmatter. Resolved to OURS (HEAD) with `git checkout --ours` + `git add --sparse` (outside the sparse cone).
  - Incoming 19775c0327 (2026-09-04 17:25:00 -0700) appends the body section "A fourth commit: REQ-184's UAT lost the same observable" and bumps updated_at / last_field_updated=body.
  - HEAD's body already contains that section (verified with `git grep` on HEAD), so the substantive change is already present.
  - The conflicting hunk is status/updated_at/completed_at/last_field_updated. HEAD (2026-11-01, `free_and_reconciled`, completed_at set) is the later state, so it is kept per fact (more recent by timestamp, per the enrichment rule).

## Incoming changes preserved

Not a code file. Incoming's only content change (the appended body section) is present in HEAD. The resolution stages with no net diff vs HEAD: the commit is redundant, not discarded.
