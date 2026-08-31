---
uid: report-75acf299
id: REPORT-2843
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:19:15.154051+00:00'
updated_at: '2026-08-31T08:19:15.154051+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/bug-5908809a.md` — class **AA** (both added), intent/bookkeeping
  ticket (2e). Both sides are byte-identical except that the incoming
  (`free_coded`, 40049b1cfc54684e60f681d8b43356b0a518de07) side adds one field:
  `fields.chat_comment: comment-501e7128`. Incoming is a strict superset of HEAD,
  so 2e's "keep the superset" rule applies — no per-fact timeline lookup needed,
  since no fact present on both sides differs. Resolved with
  `git checkout --theirs` + `git add --sparse` (path is under `.xgd/tickets/`,
  DOC-986 §2/§4.1).

## Incoming changes preserved

- `.xgd/tickets/hot/bug-5908809a.md`: the incoming commit adds the file with 84
  lines. The staged resolution is byte-for-byte the incoming version — verified
  the distinguishing field is present in the staged blob
  (`git show :.xgd/tickets/hot/bug-5908809a.md` → line 25
  `chat_comment: comment-501e7128`). Nothing from the HEAD side was lost: HEAD's
  content is a subset of incoming's. No hunks were dropped; the BUG-1301
  precedence exception was not invoked.

No code/implementation files were in conflict — the incoming commit touches only
this one ticket file.
