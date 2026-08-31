---
uid: report-be8d55c0
id: REPORT-2717
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T05:45:41.035373+00:00'
updated_at: '2026-08-31T05:45:41.035373+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-c2d25c7b.md` — class **AA** (both added), intent/bookkeeping ticket (rule 2b + 2e). Incoming side is a strict superset of HEAD: identical 665-line file plus one added frontmatter field `chat_comment: comment-69a7aea9`. Kept the superset via `git checkout --theirs`, staged with `git add --sparse`.

## Incoming changes preserved

- `.xgd/tickets/hot/request-c2d25c7b.md`: the incoming commit `18d89dc0` adds the file whole (667 insertions). Diffed stage-2 (ours) against stage-3 (theirs): the only delta is `+  chat_comment: comment-69a7aea9`. The resolved worktree file is byte-identical to the incoming blob `b6283d90`, and the staged diff vs HEAD is exactly that 1 insertion. No HEAD-side content was lost; no incoming content discarded.

No code/implementation files were in conflict. No hunks were dropped, so the BUG-1301 precedence exception was not invoked. Cherry-pick sequencer state (CHERRY_PICK_HEAD) left intact for `cherry_pick_finalize_resolution`.
