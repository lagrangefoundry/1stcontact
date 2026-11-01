---
uid: report-db153703
id: REPORT-7359
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:14:28.751644+00:00'
updated_at: '2026-11-01T06:14:28.751644+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-631866be.md` (REQ-177): intent/bookkeeping ticket (2e, request type). Rule: strict superset / later state, so kept OURS (HEAD). Resolved by `git checkout --ours` + `git add --sparse` (outside the sparse cone, conflict was index-only).
  - HEAD: status `free_and_reconciled`, `completed_at` 2026-10-30T21:51:39, `updated_at` 2026-10-30T21:51:52, adds `fields.bundled_in: bundle-5607a08d`.
  - Incoming (9a428fdfbd): older snapshot, status `ready_to_reconcile`, `completed_at: null`, `updated_at` 2026-09-02, no `bundled_in`.
  - Markdown body identical on both sides; `commits`/other fields identical. The only differences are lifecycle fields where HEAD is the later state (also the more recent timestamp, matching the enrichment rule). Taking incoming would move the ticket's status backwards.

## Incoming changes preserved

No code files involved. The incoming commit only advanced REQ-177 to `ready_to_reconcile`. HEAD already contains that progression and goes further (reconciled + completed), so the incoming change is redundant rather than discarded. The staged result is identical to HEAD (no net diff), so the finalize step should skip the commit.

Flagged for post-merge review per the enrichment rule (intent unknown on both sides), though the resolution is low-risk.
