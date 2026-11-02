---
uid: report-c4ae74b8
id: REPORT-7992
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T00:23:55.989320+00:00'
updated_at: '2026-11-02T00:23:55.989320+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/request-7af3f4e4.md`: intent/bookkeeping ticket (2e). Same-fact conflict on lifecycle fields (`updated_at`, `completed_at`, `status`). Kept HEAD (`git checkout --ours` + `git add --sparse`).

## Incoming changes preserved

Incoming commit ec9a75a3ff (2026-09-05, "xgd(ticket): update request request-7af3f4e4") only transitions `status: draft -> free_coding` and bumps `updated_at`/`last_field_updated`. HEAD (updated 2026-11-01) has `status: free_and_reconciled` with `completed_at` set, which is a later state in the same request's lifecycle that already went through free_coding. Applying the incoming values would move the ticket back to an earlier status. Per the 2e per-fact rule, the later write (HEAD) wins. The incoming transition is superseded, not discarded. The incoming commit touches no other fields, so the staged result equals HEAD (no diff); the finalize step should skip the commit.

Unrelated uncommitted state (`.xgd/_changes/log.ndjson`, `.xgd/_changes/meta.json`, untracked `.xgd/tickets/hot/report-6b80a4bb.md`) left untouched.
