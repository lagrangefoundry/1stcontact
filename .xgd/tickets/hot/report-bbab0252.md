---
uid: report-bbab0252
id: REPORT-2770
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T06:49:25.525719+00:00'
updated_at: '2026-08-31T06:49:25.525719+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/bug-3bf390f7.md` — class **AA** (both added), intent/bookkeeping
  ticket (BUG-23). Rule **2e** applied ("one side is a strict superset — keep the
  superset"), consistent with 2b's superset clause for AA.

  The two sides are byte-identical apart from a single added frontmatter field on
  the incoming (free_coded, `315d1cde`) side:

  ```
   fields:
     ...
     bundled_in: bundle-4ff83a8b
  +  chat_comment: comment-2c339d7a
  ```

  No field is set differently on the two sides, so there is no per-fact conflict
  and no timeline lookup was needed. Resolved with
  `git checkout --theirs` + `git add --sparse` (path is outside the sparse-checkout
  cone, DOC-986 §2/§4.1 — the conflict existed only in the index, the working-tree
  file carried no conflict markers and held the OURS content until checkout).

  Note on the enrichment metadata: it flagged intent as unknown on both sides and
  prescribed "take the more recent commit by timestamp, flag for post-merge review."
  That rule did not need to arbitrate here — the sides are not competing, incoming is
  a pure superset, so taking incoming both satisfies the superset rule and loses
  nothing from HEAD. No post-merge review concern arises from a single added
  `chat_comment` pointer.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-3bf390f7.md` — the resolved working-tree file is byte-identical
  to the incoming commit's blob (`b9f5a18b`, stage 3). Verified two ways:
  a full-file diff of the resolution against stage 3 is empty, and
  `grep chat_comment` finds the incoming field at line 26. The staged diff vs HEAD is
  exactly `1 insertion(+)` — the incoming field, nothing more, nothing dropped.

No code/implementation files were in conflict. No hunks were dropped; the BUG-1301
precedence exception was not invoked. No test functions were touched.

Final tree state: no UU/AA/DU/UD lines remain; the file is staged as `M`.
CHERRY_PICK_HEAD left intact for `cherry_pick_finalize_resolution`.
