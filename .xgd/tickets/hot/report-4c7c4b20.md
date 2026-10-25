---
uid: report-4c7c4b20
id: REPORT-6728
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-25T23:40:45.802667+00:00'
updated_at: '2026-10-25T23:40:45.802667+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

- `.xgd/tickets/hot/request-3f8737f2.md`: intent/bookkeeping ticket (2e). Rule: one side is a strict superset, so keep the superset (ours/HEAD). The file is outside the sparse cone, so it was resolved with `git checkout --ours` + `git add --sparse`.
  - Incoming d25cd431 (2026-09-02 15:27) changes only: status free_coded -> ready_to_reconcile, plus updated_at.
  - HEAD has status `bundled`, `bundled_in: bundle-5607a08d`, updated_at 2026-10-25, plus body edits. `bundled` comes after `ready_to_reconcile` in the lifecycle, and HEAD's timestamp is more recent, which matches the enrichment's "take the more recent" rule.

## Incoming changes preserved

There are no code files. The incoming status change has been superseded by HEAD's later `bundled` status, so the commit is redundant and the staged result nets to no diff vs HEAD. Finalize should skip it.

Flagged for post-merge review per the enrichment rule (intent unknown on the ours side).
