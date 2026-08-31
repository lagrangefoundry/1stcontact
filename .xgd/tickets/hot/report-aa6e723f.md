---
uid: report-aa6e723f
id: REPORT-2876
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:58:54.937120+00:00'
updated_at: '2026-08-31T08:58:54.937120+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/bug-29b55835.md` — class **AA** (both added), intent/bookkeeping
  ticket (rule 2e). Incoming (free_coded, `e4383cd5`) is a **strict superset** of
  HEAD: the two versions are byte-identical except that incoming adds one
  frontmatter field, `fields.chat_comment: comment-96ff771b`. No field is changed
  differently on the two sides, so there is no per-fact conflict and no
  timeline lookup was needed. Resolved by taking the incoming version
  (`git checkout --theirs`), staged with `git add --sparse` (path is under
  `.xgd/tickets/`, outside the sparse-checkout cone — DOC-986 §2/§4.1).

No other conflicted paths existed: `git status --porcelain` reported exactly one
conflict-class line (the AA above). The remaining `??` entries are pre-existing
untracked `comment-*.md` tickets, not conflicts.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-29b55835.md` — verified. `git show e4383cd5 --stat` shows
  the incoming commit touching only this file. The staged diff vs HEAD is exactly
  the incoming addition:

      +  chat_comment: comment-96ff771b

  The full incoming body (BUG-14 description, root cause, fix direction,
  acceptance, and the free-coded Resolution section) is present verbatim in the
  resolved file. Nothing from the HEAD side was dropped — HEAD's content is a
  subset of incoming's.

No hunks were dropped, so the BUG-1301 precedence exception was not invoked.
No code/implementation files, UAT test files, or spec tickets were involved in
this conflict.

Cherry-pick sequencer state (`CHERRY_PICK_HEAD` = `e4383cd5fa787ae573ae4a7343e0ed61188cf194`)
left intact for `cherry_pick_finalize_resolution`.
