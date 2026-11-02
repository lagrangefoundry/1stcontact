---
uid: report-297a98e5
id: REPORT-8230
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T01:48:19.710766+00:00'
updated_at: '2026-11-02T01:48:19.710766+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/request-4a4ca4a1.md` — intent/bookkeeping ticket (2e), conflict existed only in the index (outside the sparse cone). Both sides changed the same facts (`status`, `last_field_updated`, `updated_at`) differently:
  - Ours (HEAD, 2026-11-01T23:18:48, seed_local_overlay_batch): `status: bundled`, plus `fields.bundled_in: bundle-5052a63c`.
  - Incoming (32bc691412, 2026-09-06T19:44:00): `status: free_coded -> ready_to_reconcile`.
  Rule applied: same field changed differently on each side, so take the later side per fact (the enrichment rule also says to take the more recent commit by timestamp). HEAD is later by about two months and already includes the incoming transition's downstream result (the ticket was bundled into BUNDLE-37, the bundle being reconciled). Resolved with `git checkout --ours` + `git add --sparse`. HEAD has the only non-conflicting addition (`bundled_in`), and it is kept.
  Flagged for post-merge review per the enrichment rule (intent unknown on one side).

## Incoming changes preserved

No code files were involved. The incoming commit's only change was the older status transition to `ready_to_reconcile`, which the later `bundled` state on HEAD supersedes. Keeping it would move the ticket's status backwards. The resolution has no net diff vs HEAD, so the commit is redundant, not discarded: its lifecycle effect, advancing past free_coded, is already on HEAD.
