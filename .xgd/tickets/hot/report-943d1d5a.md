---
uid: report-943d1d5a
id: REPORT-2697
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T05:25:46.852967+00:00'
updated_at: '2026-08-31T05:25:46.852967+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/chat-f7aa2074.md` — **AA** (both added), index-only
  conflict (path is outside the sparse-checkout cone, so no working-tree
  markers existed — DOC-986 §2/§4.1). Rules 2b / 2e: the incoming
  (`free_coded`, commit `0992519c`) version is a **strict superset** of the
  HEAD side. Resolved with `git checkout --theirs` + `git add --sparse`.

  The only content delta between the two sides is the frontmatter `fields`
  block: HEAD has `fields: {}`; incoming has
  `fields:\n  chat_comment: comment-f49ebbd6`. The 90-line design-record
  body is byte-identical on both sides (incoming additionally drops the
  trailing newline). No field is changed differently on the two sides, so
  the timeline rule in 2e was not needed — this is the superset case.

## Incoming changes preserved

- `.xgd/tickets/hot/chat-f7aa2074.md`: confirmed. `git show 0992519c -- <file>`
  adds the file with `chat_comment: comment-f49ebbd6` under `fields:`; the
  staged resolution is byte-identical to the incoming blob
  `b965c5acdab40c365239851abdf64421b2b8d0ac` (verified via
  `git diff --cached`, which shows exactly the `fields: {}` →
  `chat_comment: comment-f49ebbd6` change plus the trailing-newline
  difference). Nothing from the HEAD side was discarded — HEAD's body is
  identical and its `fields: {}` is the empty case the incoming populates.

No hunks were dropped; the BUG-1301 precedence exception was not invoked.
No code/implementation files were involved in this conflict.
