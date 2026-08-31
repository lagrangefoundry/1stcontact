---
uid: report-2653b42f
id: REPORT-2707
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T05:35:23.813862+00:00'
updated_at: '2026-08-31T05:35:23.813862+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-d9407f80.md` — class **AA** (both added), intent/bookkeeping
  ticket (`request-*`). Rule **2e** applied: the two sides are byte-identical except that the
  incoming (free_coded) side adds one field, `chat_comment: comment-68897577`, under `fields:`.
  HEAD's side never touched that field, so incoming is a strict superset — kept the superset
  via `git checkout --theirs` + `git add --sparse`. No timeline lookup was needed: there is no
  fact changed differently on both sides, only an addition on one side.

## Incoming changes preserved

- `.xgd/tickets/hot/request-d9407f80.md` — confirmed. `git diff --cached` against HEAD shows
  exactly the one incoming addition (`+  chat_comment: comment-68897577`) and nothing else,
  which matches the full ours-vs-theirs blob diff. Every line present on the HEAD side is
  retained; nothing from either side was dropped.

No code/implementation files were in conflict, so no BUG-1301 precedence exception was
invoked and no hunk was dropped.

Staging verified clean: `git status --porcelain` shows no UU/AA/DU/UD/AU/UA entries; the
resolved file appears as `M ` (staged modification). The in-progress cherry-pick state
(CHERRY_PICK_HEAD) was left untouched for `cherry_pick_finalize_resolution`.
