---
uid: report-d3192ed4
id: REPORT-2806
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:34:02.117415+00:00'
updated_at: '2026-08-31T07:34:02.117415+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-a6740b4a.md` — **AA (both added)**, intent/bookkeeping
  ticket (REQ-115, a `request`). Rules 2b + 2e applied: the incoming side is a
  **strict superset** of ours. Diffing the two index stages (ours
  `222c90dc`, theirs `39b4eac3`) shows exactly one differing line — the incoming
  side appends `chat_comment: comment-fe2ff8e0` under `fields:`; every other byte
  of the 214-line ticket is identical on both sides. No competing edit to any
  shared field, so no timeline lookup was needed. Resolved by taking the incoming
  version whole (`git checkout --theirs`), which loses nothing from HEAD because
  HEAD's content is contained in it.

  Note (DOC-986 §2/§4.1): the path is outside the sparse-checkout cone, so the
  conflict existed only in the index — the working-tree file held the ours-side
  content with no conflict markers. Staged with `git add --sparse`.

## Incoming changes preserved

- `.xgd/tickets/hot/request-a6740b4a.md` — confirmed. The incoming commit
  `e7eb9cae82ec67d765380db64fc33f86b576ad01`
  ("xgd(ticket): update request request-a6740b4a", Martin Westhead,
  2026-08-23) touches only this file. Its sole change relative to the HEAD side,
  `fields.chat_comment: comment-fe2ff8e0`, is present at line 25 of the resolved
  file, and the staged blob hashes to `39b4eac3` — byte-identical to the incoming
  stage-3 blob. Nothing was dropped; the BUG-1301 precedence exception was not
  invoked.

No code/implementation files were in conflict. `git ls-files -u` is empty and
`git status --porcelain` shows the file as `M ` (staged). The in-progress
cherry-pick was left untouched — CHERRY_PICK_HEAD is still present for
`cherry_pick_finalize_resolution`.
