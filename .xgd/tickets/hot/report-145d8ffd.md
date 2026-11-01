---
uid: report-145d8ffd
id: REPORT-7443
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T07:08:12.087848+00:00'
updated_at: '2026-11-01T07:08:12.087848+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-72001560.md` — intent/bookkeeping ticket (2e), UU, index-only (outside sparse cone). Rule: same fields (`status`, `updated_at`) changed differently on each side -> take the later side per fact; also matches the enrichment's "take the more recent commit by timestamp" rule.
  - Ours (HEAD, last touched 756eaf4a54 / aa65018073, 2026-10-31): `status: bundled`, `updated_at: 2026-11-01T05:18:03`, adds `fields.bundled_in: bundle-94dbe947`.
  - Theirs (4e740e1fd1, 2026-09-03): `status: free_coded -> ready_to_reconcile`, `updated_at: 2026-09-03T19:38:13`.
  - The ours side is the later lifecycle state (the ticket is already bundled into this reconcile's intent bundle-94dbe947), so it is a strict superset of the incoming status advance. Resolved with `git checkout --ours` + `git add --sparse`.

## Incoming changes preserved

No code files involved. The incoming commit's only change (status advance to ready_to_reconcile plus a timestamp) has already been superseded on HEAD by the later `bundled` state. The staged result therefore has no diff vs HEAD (a redundant commit, not a discarded one — BUG-1109/BUG-1122). Left for cherry_pick_finalize_resolution to skip.
