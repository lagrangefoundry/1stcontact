---
uid: report-c2467f93
id: REPORT-7635
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T14:35:22.631941+00:00'
updated_at: '2026-11-01T14:35:22.631941+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-e53d068f.md` (REQ-173). File class: intent/bookkeeping ticket (2e). Rule: the same fields were changed differently on each side, so per-fact I kept the later side. That matches the enrichment rule "take the more recent commit by timestamp."
  - The conflicting fields were `updated_at`, `completed_at`, `last_field_updated` and `status`. Nothing else in the file conflicted.
  - HEAD has `status: free_and_reconciled`, completed and updated 2026-11-01T05:03Z.
  - Incoming (62aafcb115, 2026-09-03T02:34Z) has `status: ready_to_reconcile` and `completed_at: null`.
  - I kept HEAD, which is the later state of the same request lifecycle. Applying the incoming side would reopen a ticket that is already reconciled.
  - The file is outside the sparse cone, so I staged it with `git add --sparse`.

## Incoming changes preserved

There are no code files in this conflict. The incoming commit only advanced REQ-173's status to `ready_to_reconcile`, and HEAD has already moved that same lifecycle further (to `free_and_reconciled`). So the commit is redundant, not discarded. The staged diff against HEAD is empty, and finalize should detect that and skip the commit.

Flagged for post-merge review, as the enrichment rule asks: REQ-173 status fields.
