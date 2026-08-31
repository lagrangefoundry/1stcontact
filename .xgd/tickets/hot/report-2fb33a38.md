---
uid: report-2fb33a38
id: REPORT-2848
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:26:36.184931+00:00'
updated_at: '2026-08-31T08:26:36.184931+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-2e01ed95.md` — class **AA** (both added), intent/bookkeeping ticket (`request-*`) → **rule 2e**, superset branch.
  - Ours (HEAD): `sync_working_to_main` — "xgd: sync from xgd-working 597681c166c6 (post-watermark)".
  - Theirs (incoming, `e05179edcad460a38ffaae9d6460927fa22baf05`): `free_coded` — "xgd(ticket): update request request-2e01ed95".
  - The two blobs (`ff675e5927` ours / `6fb498f564` theirs) are byte-identical except for a single added frontmatter field under `fields:`:
    `chat_comment: comment-523ed988`. Incoming is a strict superset — no competing fact, no field changed differently on the two sides, so no timeline adjudication was required.
  - Resolved via `git checkout --theirs`, staged with `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).

The enrichment metadata flagged this file for post-merge review on the grounds that intent was unknown on one side. Recording that here: the actual content divergence turned out to be a one-line, additive, non-overlapping field, so the "take the more recent commit and flag" fallback and the 2e superset rule agree on the same result.

## Incoming changes preserved

- `.xgd/tickets/hot/request-2e01ed95.md`: the incoming commit's entire diff for this file is the addition of `chat_comment: comment-523ed988`. Verified present at line 22 of the resolved file, and the resolved working-tree blob hashes to `6fb498f56463a1921bba3f92adfcbbe54277051b` — an exact match for the incoming (stage 3) blob. Nothing from the ours side was dropped, since ours was a proper subset.

No hunks were dropped. The BUG-1301 precedence exception was not invoked. No code, test, or UAT files were in conflict.

Staged diff vs HEAD is exactly `1 file changed, 1 insertion(+)`, matching the incoming commit's intent. `git status --porcelain` reports no remaining conflict-class entries. The cherry-pick sequencer state (`CHERRY_PICK_HEAD`) was left untouched for `cherry_pick_finalize_resolution`.
