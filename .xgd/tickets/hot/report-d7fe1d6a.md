---
uid: report-d7fe1d6a
id: REPORT-7375
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:24:29.066804+00:00'
updated_at: '2026-11-01T06:24:29.066804+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-407a6fd8.md` (REQ-178) — class 2e (intent/bookkeeping request ticket). Rule: one side is a strict superset → keep the superset (HEAD / ours). Staged via `git checkout --ours` + `git add --sparse` (path is outside sparse cone).

Incoming 7becbf6410 (2026-09-03) is the early status transition free_coding → free_coded: it adds a `commits` list with both working SHAs and null reconcile SHAs, plus `version: 0.2.51`. HEAD (updated 2026-11-01) already carries the later state of the same ticket: status free_and_reconciled, completed_at set, story_points 4, the same two commits (68db3937 now with reconcile_sha da892c3e, plus working_sha_history), and the full body including the 2026-09-04 reopening amendment and later sections. The incoming body hunk is only a trailing-newline change to the old "Regression scope" paragraph, which HEAD has since rewritten and extended.

## Incoming changes preserved

No code files were involved. The incoming commit's substantive changes (the status advance and the commits list) are already in HEAD in a later, more advanced form, so this commit is redundant rather than discarded (STEP 4 / BUG-1109 shape). The staged result has no diff against HEAD. The one incoming-only field, `fields.version: 0.2.51`, is a transient snapshot value from the Sept state that later updates to this same ticket removed; it was not restored.
