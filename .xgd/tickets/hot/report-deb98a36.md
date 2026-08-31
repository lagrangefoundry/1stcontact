---
uid: report-deb98a36
id: REPORT-2783
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:03:32.342596+00:00'
updated_at: '2026-08-31T07:03:32.342596+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-1b56fccd.md` — **AA (both added)**, intent/bookkeeping ticket (rule 2b + 2e).
  Both sides created the file independently. Diffing the two index stages showed the incoming
  (theirs, stage 3, blob `e18ff4e3`) version is a **strict superset** of HEAD's (ours, stage 2,
  blob `a0b48a0c`): identical in every line except one added frontmatter field —
  `chat_comment: comment-b97d8fa1`. No competing edit to any shared field, so this is the
  "one side is strictly a superset / incoming appended a field the other side never touched"
  case; the superset was kept without needing the per-fact timeline rule.
  Resolved with `git checkout --theirs` + `git add --sparse` (path is outside the
  sparse-checkout cone on this reconcile branch, DOC-986 §2/§4.1).

## Incoming changes preserved

- `.xgd/tickets/hot/request-1b56fccd.md`: staged blob is `e18ff4e30d08e80d24b67f4a471e28d9e9945723`,
  byte-identical to the incoming side of the conflict. The cherry-picked commit
  `fd77ffe73bf73e5f3f376bdc6b5a523cc0562c8e` ("xgd(ticket): update request request-1b56fccd")
  touches only this one file, adding all 173 lines; every one of those lines is present in the
  resolved version. Nothing from HEAD's side was lost either, since HEAD's content is a subset.

No hunks were dropped; the BUG-1301 precedence exception was not invoked.
No code/implementation files were involved in this conflict.
