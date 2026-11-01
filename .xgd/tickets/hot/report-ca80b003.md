---
uid: report-ca80b003
id: REPORT-7631
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T14:33:01.885881+00:00'
updated_at: '2026-11-01T14:33:01.885881+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/bug-cb59cc4a.md` (BUG-48) — intent/bookkeeping ticket (2e). Non-overlapping fields: HEAD added `fields.commits` (three working/reconcile SHA pairs); incoming e0379b4286 added `fields.chat_comment: comment-2a38a753`. Applied BOTH. Header (status `free_and_reconciled`, timestamps) and body kept as HEAD; incoming did not touch them. Staged with `git add --sparse`.

## Incoming changes preserved

- Incoming diff adds `chat_comment: comment-2a38a753` — present in the resolved file (staged diff vs HEAD is exactly this one line). The incoming commit's only other change was dropping the trailing newline at EOF, a whitespace-only change that was not carried over. No content dropped from either side.
