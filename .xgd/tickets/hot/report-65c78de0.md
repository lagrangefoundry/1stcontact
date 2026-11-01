---
uid: report-65c78de0
id: REPORT-7785
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T16:13:17.397850+00:00'
updated_at: '2026-11-01T16:13:17.397850+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/bug-61165116.md` — intent/bookkeeping ticket (2e). Rule: one side is a strict superset → keep the superset (HEAD / `--ours`), staged with `git add --sparse` (outside sparse cone).
  - Incoming (378aacc1e3, "update bug bug-61165116"): draft → `status: free_coded`, `last_field_updated: status`, adds `fields.commits` (working_sha a6f66c33…, cfe4cce2…) and `fields.version: 0.2.74`, trailing-newline change.
  - HEAD: the same `commits` entries, the same `version: 0.2.74`, the same trailing-newline change, plus `status: bundled` (a later lifecycle stage than free_coded) and `fields.bundled_in: bundle-39edf66d`, with a later `updated_at` (2026-11-01 vs 2026-09-05).
  - HEAD therefore contains everything the incoming commit adds and also records the later state. Taking incoming would wrongly regress the status to free_coded and drop `bundled_in`.

## Incoming changes preserved

No code files were in conflict. For the ticket, every fact the incoming commit introduces (commits list, version, status advance past draft) is already present in HEAD. The resolution leaves no diff against HEAD: the incoming commit is redundant here, and nothing was discarded. Finalize should detect the empty staged diff and skip the commit.
