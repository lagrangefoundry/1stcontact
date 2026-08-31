---
uid: report-ad666bef
id: REPORT-2782
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:02:09.498387+00:00'
updated_at: '2026-08-31T07:02:09.498387+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-58e96ad1.md` — class **AA** (both added), intent/bookkeeping ticket (`request-*`), rule **2e** (strict-superset case). Ours side was the `sync_working_to_main` commit "xgd: sync from xgd-working d3562e3b8285 (post-watermark)"; theirs side was the incoming free_coded commit `1ea6554e` "xgd(ticket): update request request-58e96ad1". The two versions are byte-identical apart from one added field: theirs adds `fields.chat_comment: comment-be9974ae`. No competing edit to any shared fact — theirs is a strict superset, so the superset was kept via `git checkout --theirs`, staged with `git add --sparse` (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).

  Note: the auto-enrichment classified this as "intent unknown on one side → take the more recent commit and flag for post-merge review." That tie-break was not needed here — the difference is a single non-overlapping added field, so both sides' content is retained by taking theirs. No post-merge review concern: nothing from the ours side was dropped.

## Incoming changes preserved

- `.xgd/tickets/hot/request-58e96ad1.md`: the incoming commit `1ea6554e` contributes the whole file (85 insertions, file creation on that side). The staged resolution is **byte-identical** to the incoming (stage-3) blob — verified by `diff` against `git show :3:<path>`, which reported no differences. Every incoming change, including the new `chat_comment: comment-be9974ae` field, is present.
- No hunks were dropped; the BUG-1301 precedence exception was not invoked.
- No code/implementation files, UAT tests, spec tickets, or config files were involved in this conflict.

Staging verified clean: `git status --porcelain` shows `M  .xgd/tickets/hot/request-58e96ad1.md` and no remaining conflict-class entries. The in-progress cherry-pick state (`CHERRY_PICK_HEAD`) was left untouched for `cherry_pick_finalize_resolution`.
