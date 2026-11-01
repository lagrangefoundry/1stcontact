---
uid: report-84120c7b
id: REPORT-7723
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:34:51.020016+00:00'
updated_at: '2026-11-01T15:34:51.020016+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-407a6fd8.md` (REQ-178): intent/bookkeeping ticket (rule 2e, plus the enrichment's "more recent commit by timestamp" rule). Kept HEAD.
  - Frontmatter conflict: HEAD is dated 2026-11-01 with status `free_and_reconciled` and `completed_at` set. The incoming commit 6e3dbdf3cc is dated 2026-09-04 with status `free_coding` and `completed_at` null, so it is the older state. I kept the more recent side.
  - Body conflict: HEAD is a strict superset. The incoming side's only content there is the line `([[REQ-180]] D5), not a model concept.`, which HEAD already has, followed by the later sections "What the amendment landed, and its consequences", "Test plan (amendment)" and "A fourth commit". I kept the superset.
  - The resolved file matches HEAD byte for byte, so the staged diff is empty. It was staged with `git add --sparse`. I did not run `--skip`; finalize handles the empty diff.
  - Flagged for post-merge review, as the enrichment rule asks.

## Incoming changes preserved

No code files were involved. The incoming commit is a stale ticket-bookkeeping update, and all of its body content is already in HEAD. Only its older status fields were superseded.

## Observation

This branch's history shows repeated "update bundle" and "recover uncommitted .xgd/ state (BUG-603)" cycles. Each recent conflict has been a stale 2026-09-04 ticket-update commit that resolved to HEAD with an empty diff. That pattern is worth checking in case the reconcile is looping.
