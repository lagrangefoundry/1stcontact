---
uid: report-d7fd35f4
id: REPORT-2793
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:17:21.882666+00:00'
updated_at: '2026-08-31T07:17:21.882666+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-105ad942.md` — class **AA** (both added), intent/bookkeeping ticket (§2e).
  Ours = `sync_working_to_main` (sync from xgd-working d3562e3b8285, post-watermark);
  theirs = incoming free_coded `xgd(ticket): update request request-105ad942` (2cdd6316de62).
  The two blobs are byte-identical except that the incoming side adds one field:
  `fields.chat_comment: comment-1b70d417`. Incoming is therefore a **strict superset**
  of ours, so the superset was kept (`git checkout --theirs`, then `git add --sparse`,
  the file being outside the sparse-checkout cone on this branch per DOC-986 §2/§4.1).
  No per-fact timeline arbitration was needed: no field is changed differently on the
  two sides, so the "more recent commit" rule from the enrichment metadata and the
  superset rule agree on the same result. Nothing from either side was dropped and no
  content was invented.

## Incoming changes preserved

- `.xgd/tickets/hot/request-105ad942.md` — the incoming commit's only effective change
  relative to HEAD (`+  chat_comment: comment-1b70d417` inside `fields:`) is present in
  the resolved file at line 22. The commit's raw stat reads `122 insertions` only
  because the file is an *add* on the incoming side; diffing the two conflict stages
  (`7bed72db` ours vs `b3469410` theirs) shows the single added line as the entire
  delta. Staged diff vs HEAD is exactly `1 file changed, 1 insertion(+)`, matching.

No code/implementation files were in conflict, so no BUG-1301 precedence exception was
invoked and no hunk was dropped. Cherry-pick sequencer state (CHERRY_PICK_HEAD) left
untouched for `cherry_pick_finalize_resolution`.
