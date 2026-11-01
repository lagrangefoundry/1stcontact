---
uid: report-9602fc16
id: REPORT-7461
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T07:18:28.330835+00:00'
updated_at: '2026-11-01T07:18:28.330835+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-b813aa4a.md` (REQ-179). File class: 2e, intent/bookkeeping ticket (a request ticket in the hot tier). It is outside the sparse cone, so the conflict was index-only. Rule applied: the same field was changed differently on each side, so keep the later intent's value. That is OURS (HEAD). Resolved with `git checkout --ours` followed by `git add --sparse`.
  - Incoming `3fcdda9f40` ("update request request-b813aa4a", 2026-09-03) changes one fact: `story_points` from 2 to 3. It also touches `updated_at` and sets `last_field_updated` to `story_points`.
  - HEAD carries `story_points: 4` as part of the much later `bundled` state of the ticket (updated_at 2026-11-01, v0.2.69, bundled_in bundle-94dbe947). That supersedes the intermediate value of 3 on the working timeline.
  - Every other part of the ticket is unchanged by the incoming commit.

## Incoming changes preserved

There are no code files in this conflict. The incoming commit's only substantive change, an intermediate story_points estimate, has already been superseded in HEAD by a later value. The commit is redundant on this branch, not discarded: the staged diff against HEAD is empty.
