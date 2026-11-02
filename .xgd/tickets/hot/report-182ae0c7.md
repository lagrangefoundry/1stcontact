---
uid: report-182ae0c7
id: REPORT-8142
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T01:18:39.457088+00:00'
updated_at: '2026-11-02T01:18:39.457088+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/bug-b6268a25.md` — intent/bookkeeping ticket (bug), rule 2e. Out of sparse cone, index-only conflict.
  - Base: `status: free_coded`, `updated_at: 2026-09-06T00:53`.
  - Incoming (3e5bef0d65, "update bug bug-b6268a25", 2026-09-06): `status: ready_to_reconcile`, `updated_at: 2026-09-06T18:10`.
  - HEAD (seed_local_overlay_batch, 2026-11-01): `status: bundled`, `updated_at: 2026-11-01T23:18`, added `fields.bundled_in: bundle-5052a63c`.
  - Same fact (status/updated_at) changed differently on each side, so I applied the later-intent rule per fact. HEAD is about two months later and records the bug's real current lifecycle state: it's bundled in BUNDLE-37, the bundle being reconciled. HEAD is also a superset of what the incoming side touched, because it adds `bundled_in`. Resolved to HEAD's version (blob 482bd11) via `git add --sparse`. This matches the enrichment rule ("take the more recent commit by timestamp").

## Incoming changes preserved

No code files involved. The incoming status advance (free_coded -> ready_to_reconcile) is an earlier lifecycle step that HEAD's `bundled` status already supersedes. The resolution nets to no diff vs HEAD (redundant/superseded commit); finalize step should detect the empty staged diff.

## Flag for post-merge review

Per enrichment rule, flagging bug-b6268a25 for post-merge review: confirm `status: bundled` / `bundled_in: bundle-5052a63c` is the intended state.
