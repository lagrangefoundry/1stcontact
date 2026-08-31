---
uid: report-de6249e0
id: REPORT-2774
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:53:34.175808+00:00'
updated_at: '2026-08-31T06:53:34.175808+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-9b70eeca.md` — class **AA** (both added), intent/bookkeeping ticket
  (rule **2e**, superset branch). Both sides added the same 198/199-line request ticket
  independently. Full diff between the two stages was a single added frontmatter field on the
  incoming side:

  ```
  +  chat_comment: comment-535ef859
  ```

  No other line differs — incoming is a strict superset of HEAD, so 2e's "keep the superset"
  branch applies directly and no per-fact timeline lookup was needed (the enrichment's
  "intent unknown → take more recent by timestamp" fallback was not reached, because the
  sides are not competing on any fact). Resolved with `git checkout --theirs` +
  `git add --sparse` (path is outside the sparse-checkout cone per DOC-986 §2/§4.1; the
  conflict existed only in the index, with no working-tree markers).

## Incoming changes preserved

- `.xgd/tickets/hot/request-9b70eeca.md` — confirmed. `git diff --cached <CHERRY_PICK_HEAD> -- <path>`
  returns empty, i.e. the staged blob is byte-identical to the incoming commit
  `ae85d5342f022dead93be2808097bccb5b30cab1` version. The incoming commit's only change to this
  file, `chat_comment: comment-535ef859`, is present in the staged index at line 18.
  Nothing from the HEAD side was lost: HEAD's content is a proper subset of the resolved file.

No code/implementation files were in conflict, so no BUG-1301 precedence exception was invoked
and no hunk was dropped. `git status --porcelain` reports no remaining UU/AA/DU/UD/AU/UA lines;
the resolved file is staged as `M`. The in-progress cherry-pick state (CHERRY_PICK_HEAD) was
left untouched for `cherry_pick_finalize_resolution`.
