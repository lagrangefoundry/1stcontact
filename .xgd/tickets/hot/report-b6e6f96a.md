---
uid: report-b6e6f96a
id: REPORT-7095
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T22:52:03.348049+00:00'
updated_at: '2026-10-31T22:52:03.348049+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/request-3bc4b835.md` (REQ-167). Class: intent/bookkeeping ticket (2e; it's a request ticket even though it lives in hot/). Rule: one side is a strict superset, so keep the superset. Resolved to HEAD (`git checkout --ours` + `git add --sparse`).
  - Incoming 9eb0360774 (2026-09-02T23:17) made a body edit: it appended the "Note: the account/business split came after this ticket" section and set `last_field_updated: body`.
  - HEAD already has that exact section, plus later metadata: `updated_at` 2026-09-09T21:32, `last_field_updated: status`, `bundled_in: bundle-87be4669`.
  - Conflict hunk 1 (`updated_at`): HEAD's value is later, so HEAD's was kept.
  - Conflict hunk 2 (last line of the body): the two sides had the same text and differed only by a trailing newline at EOF.

## Incoming changes preserved

The incoming commit changed one thing, the appended account/business-split note, and it is present verbatim in the staged blob (checked with grep). The incoming `updated_at` and `last_field_updated` values are older than HEAD's for the same facts, so HEAD's later values win per fact. The staged diff against HEAD is empty: the commit is redundant because HEAD already landed its effect (BUG-1109/BUG-1122 shape). Its changes are present, not discarded. No unmerged index entries remain, and there are no conflict markers. CHERRY_PICK_HEAD is still present for finalize.
