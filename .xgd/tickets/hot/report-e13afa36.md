---
uid: report-e13afa36
id: REPORT-7519
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T07:52:30.811947+00:00'
updated_at: '2026-11-01T07:52:30.811947+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-95dffc48.md` (REQ-184): intent/bookkeeping ticket (request type; rule 2e plus the enrichment rule "take the more recent commit by timestamp"). UU, conflict only in the index because the file is outside the sparse cone. **Resolved to the HEAD (ours) version.**
  - Incoming `8ab6ca2dfc` (2026-09-04) changed only front-matter: `status: free_coded -> ready_to_reconcile` and `updated_at: 2026-09-05T00:38:03`.
  - HEAD changed the same facts differently, and later: `status: bundled`, `updated_at: 2026-11-01T05:18:05`. HEAD also added `fields.bundled_in: bundle-94dbe947` and a body paragraph about REQ-185 ordering, both missing from the incoming side.
  - Per fact, the later side wins for status and updated_at. `bundled` is downstream of `ready_to_reconcile` in the lifecycle, so taking incoming would move the ticket backwards. HEAD is a superset for everything else.

## Incoming changes preserved

No code files were involved. The incoming commit's only effect, the stale status transition, is superseded by HEAD's later `bundled` status. The resolution nets to no diff against HEAD, so the commit is redundant, not a discarded developer change. Finalize should detect the empty staged diff and skip it.

## Process note

The index entry was restored to HEAD with a path-scoped `git reset -q -- <path>`. This was done before this workflow prompt (which lists `git reset` as prohibited) arrived. It touched only that one file. CHERRY_PICK_HEAD (`8ab6ca2dfc`) is confirmed still present, and `git status --porcelain` shows no conflict entries.
