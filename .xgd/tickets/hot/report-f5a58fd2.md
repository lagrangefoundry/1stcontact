---
uid: report-f5a58fd2
id: REPORT-7976
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T00:18:55.079903+00:00'
updated_at: '2026-11-02T00:18:55.079903+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/bug-61165116.md` (BUG-51): AA conflict, intent/bookkeeping ticket (2e/2b). HEAD's version is a strict superset of the incoming one, so HEAD was kept (`git checkout --ours`, `git add --sparse`).
  - Incoming `3cde6368a5` ("xgd(ticket): create bug bug-61165116", 2026-09-05) is the original 18-line creation stub: title `Untitled`, status `draft`, `updated_at` = `created_at`, no body.
  - HEAD ("update bug bug-61165116", updated 2026-11-01) is the same ticket later in its life: same uid/id/created_at, real title, status `free_and_reconciled`, the full symptom and mechanism write-up, the commits list, version 0.2.74 and bundled_in bundle-39edf66d.
  - Every fact in the stub is either identical in HEAD or was superseded by a later update to the same ticket. The more-recent-timestamp rule from the enrichment gives the same result.

## Incoming changes preserved

There are no code files. The incoming commit's only effect is creating this ticket, and the ticket already exists in HEAD in a later state, so the commit is redundant rather than discarded. The staged diff against HEAD is empty, which leaves the commit for finalize to skip (BUG-1109/BUG-1122 shape).

## Post-merge review flag

The enrichment rule asks for this file to be flagged. It is low risk: incoming is a pure creation stub that HEAD's lifecycle updates fully supersede.
