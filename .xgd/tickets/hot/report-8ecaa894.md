---
uid: report-8ecaa894
id: REPORT-7099
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T22:55:03.275109+00:00'
updated_at: '2026-10-31T22:55:03.275109+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/request-3f8737f2.md` (REQ-157). File class: intent/bookkeeping ticket (2e, request), outside the sparse cone. Rule applied: same field changed differently on each side, so the later side wins (enrichment rule: most recent by timestamp). Resolved with `git checkout --ours` followed by `git add --sparse`.
  - Incoming (67248766a3, updated_at 2026-09-02T23:24:57): versus the merge base, its only change is `status: ready_to_reconcile -> free_coded` (plus `updated_at`). The body is identical to the base.
  - HEAD (updated_at 2026-10-30T21:51:53): `status: free_and_reconciled`, `completed_at` set, `reconcile_sha` e2676a77 recorded, `bundled_in: bundle-5607a08d`. It also has later edits to the body: the consultant rename from REQ-174, the restored "Field evidence" section from CHAT-35, "Behaviour the build settled", and a correction to the `createL1Toolbox` paragraph.
  - HEAD is the later position in the ticket's lifecycle. Taking incoming would move the status backwards and drop that body content. Incoming has nothing that HEAD lacks.

## Incoming changes preserved

There are no code files in this conflict. The incoming commit's only fact, the status change to `free_coded`, has been superseded on HEAD by the later `free_and_reconciled`. The commit is redundant on this branch, not discarded: its lifecycle step has already happened and moved past it. Staging the resolution gives no diff against HEAD, so finalize should skip this commit.
