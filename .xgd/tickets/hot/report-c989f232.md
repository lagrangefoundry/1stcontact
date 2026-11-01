---
uid: report-c989f232
id: REPORT-7759
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:56:27.379986+00:00'
updated_at: '2026-11-01T15:56:27.379986+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-420e1a6e.md`: intent/bookkeeping ticket (2e), UU, outside the sparse cone (only in the index). Rule: same fact changed differently on each side, so I kept the later side for that fact. That is HEAD (`git checkout HEAD -- <path>`).
  - Incoming ba689ae648 (2026-09-05 02:18) sets `status: free_coding` and `last_field_updated: status`, and removes the trailing newline at end of file.
  - HEAD (2026-11-01 14:13) has `status: bundled` and `last_field_updated: status`, plus `commits`, `version: 0.2.71` and `bundled_in: bundle-39edf66d`. It also has the same trailing-newline change.
  - `bundled` comes after `free_coding` in the request lifecycle (draft → free_coding → free_coded → bundled). It is also the later write by timestamp. Taking incoming would roll status back and drop the bundle fields.

## Incoming changes preserved

The incoming commit is a status-marker update for a free_coding transition that HEAD has since moved past. Its only other change, the end-of-file newline, already matches HEAD. Nothing incoming is lost, and the staged diff against HEAD is empty. Finalize should detect a no-op.

Unrelated state was left untouched: unstaged `.xgd/_changes/log.ndjson` and `.xgd/_changes/meta.json`, and the untracked `.xgd/tickets/hot/report-9cc066a1.md`.
