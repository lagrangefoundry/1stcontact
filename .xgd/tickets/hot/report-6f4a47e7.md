---
uid: report-6f4a47e7
id: REPORT-2874
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:57:14.628907+00:00'
updated_at: '2026-08-31T08:57:14.628907+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-11bf4b9a.md` — **AA** (both added), intent/bookkeeping
  ticket (STEP 2 rule **2e**). Path is outside the sparse-checkout cone
  (`!/.xgd/tickets/**`), so the conflict existed in the index only with no
  working-tree markers (DOC-986 §2/§4.1) — resolved with
  `git checkout --theirs` + `git add --sparse`.

  **Why incoming:** the two sides are byte-identical except that the incoming
  side adds one field, `fields.chat_comment: comment-7db961ca`. Incoming is
  therefore a *strict superset* — 2e's "keep the superset" case, not a
  competing-fact case, so no `xgd working-timeline` adjudication was needed.
  The auto-enrichment's fallback rule (take the more recent commit by
  timestamp) points the same way: incoming `51ca83c5` is 2026-08-23 13:35:30
  -0700, the HEAD-side commit `3d4a6afe` is 2026-08-22 14:57:15 -0700.

  **Corroborating evidence:** the referenced comment ticket already exists on
  the HEAD side — `.xgd/tickets/hot/comment-7db961ca.md`, added by `dd3e0c06`
  at 2026-08-22 14:57:29 -0700, i.e. 14 seconds *after* HEAD's own version of
  this request. HEAD created the comment but never wrote the back-reference
  onto the request; the incoming commit is what completes that half-finished
  operation. Taking incoming makes the link bidirectional and resolvable
  rather than dangling; taking ours would have dropped it.

  No fields were invented, and no field was modified beyond the single
  addition present on the incoming side.

## Incoming changes preserved

- `.xgd/tickets/hot/request-11bf4b9a.md` — **confirmed present.** The incoming
  commit adds this file whole on its side (106 insertions), so the meaningful
  delta against HEAD is the one field. `git diff --cached HEAD` on the
  resolved file shows exactly that field addition and nothing else:

  ```
  @@ -13,6 +13,7 @@ fields:
     priority: medium
     auto_merge_back: true
     needs_review: false
  +  chat_comment: comment-7db961ca
   ---
  ```

  The only other byte-level difference between the two sides is trailing
  whitespace: the incoming blob has no final newline while HEAD's does, so
  the staged file now ends `\ No newline at end of file`. This carries no
  ticket content and follows from taking the incoming blob verbatim.

No hunks were dropped, so the BUG-1301 precedence exception was not invoked.
No code/implementation files were involved in this conflict — the single
conflicted path is a bookkeeping ticket — so there is no developer source
code at risk in this resolution.

Final state: `git status --porcelain` reports no UU/AA/DU/UD/AU/UA lines; the
resolved file is staged as `M`. `CHERRY_PICK_HEAD` (51ca83c5) is left in
place for `cherry_pick_finalize_resolution`.
