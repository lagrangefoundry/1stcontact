---
uid: report-f08fc644
id: REPORT-2744
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:16:27.765129+00:00'
updated_at: '2026-08-31T06:16:27.765129+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/bug-ad50b1df.md` — AA (both added), intent/bookkeeping ticket (rule 2e).
  Both sides added an identical BUG-2 ticket body except that the incoming
  (`free_coded`, commit `6b640d55`) side carries one extra frontmatter field,
  `fields.chat_comment: comment-e2cd0ddf`. The HEAD side
  (`sync_working_to_main`, "sync from xgd-working 715a993ebead") never touched
  that field. Incoming is therefore a strict superset — resolved with
  `git checkout --theirs` and staged with `git add --sparse`. No timeline
  arbitration was needed: there is no fact changed differently on both sides.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-ad50b1df.md`: the incoming commit adds the file whole
  (48 insertions). The resolved working-tree file is byte-identical to stage 3
  (`diff -u` against `git show :3:` is empty), so 100% of the incoming content
  — including the sole distinguishing line `chat_comment: comment-e2cd0ddf` —
  is present. Nothing from the HEAD side was lost: HEAD's version is a subset
  of the incoming one.

No code/implementation files were in conflict. No hunks were dropped; the
BUG-1301 precedence exception was not invoked. Cherry-pick sequencer state
(CHERRY_PICK_HEAD = `6b640d55f55495ee34e87b96ea69412cc0e5cdb3`) left intact for
`cherry_pick_finalize_resolution`.
