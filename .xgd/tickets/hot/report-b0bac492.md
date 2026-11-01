---
uid: report-b0bac492
id: REPORT-7349
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:08:42.528271+00:00'
updated_at: '2026-11-01T06:08:42.528271+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-631866be.md`: intent/bookkeeping ticket (2e). Rule: one side is a strict superset, so keep the superset. Resolved with `git checkout --ours` and `git add --sparse` (the path is outside the sparse cone).
  - Incoming (36b72fc0c7, 2026-09-02T23:38): status draft → free_coding, plus a bump to updated_at and last_field_updated. Those are its only changes from the merge base.
  - HEAD (ours): the later lifecycle state of the same ticket. Status free_and_reconciled, updated_at 2026-10-30T21:51:52, completed_at set, fields.commits / version 0.2.48 / bundled_in bundle-5607a08d, and the "What landed" and "Test plan" body sections. The incoming status change is an earlier step that HEAD has already moved past. HEAD also has the later timestamp, which agrees with the enrichment's "more recent commit" rule.

## Incoming changes preserved

There are no code files in this conflict. The incoming commit only made an intermediate status change, free_coding. HEAD already includes that step and has moved past it to free_and_reconciled, so the commit is redundant rather than discarded. The staged result has no diff against HEAD, which is expected: finalize will detect the empty diff and skip the commit. Taking the incoming side instead would have rolled the ticket back and lost its completion record and body.

Flag for post-merge review, per the enrichment rule: request-631866be. Confirm that free_and_reconciled is the intended final status.
