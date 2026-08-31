---
uid: report-9e877df7
id: REPORT-2824
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:56:47.895399+00:00'
updated_at: '2026-08-31T07:56:47.895399+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-dbdc904a.md` — class **AA** (both added), intent/bookkeeping ticket (rule 2e, "strict superset" branch). Both sides' commit subject is `xgd(ticket): update request request-dbdc904a`. Diffing the two index blobs (ours `0363e48731`, theirs `a36122fd7a`) shows a single difference: the incoming side adds one frontmatter field under `fields:`

      chat_comment: comment-ab46f06f

  Every other line — frontmatter and body ("# Complete DOC-30 — the L1 control surface API, and the gap list") — is byte-identical. This is not a competing edit on a shared fact: HEAD never touched `chat_comment`, so the incoming version is a strict superset and no per-fact timeline lookup was needed. Resolved with `git checkout --theirs`, then `git add --sparse` (path is under `.xgd/tickets/`, outside the sparse-checkout cone per DOC-986 §2/§4.1, so the conflict lived in the index only).

  The enrichment metadata's fallback rule ("intent unknown on one or both sides — take the more recent commit and flag for post-merge review") did not need to be exercised: the superset relationship is unambiguous, so no content from either side was dropped and there is nothing to flag.

## Incoming changes preserved

- `.xgd/tickets/hot/request-dbdc904a.md` — confirmed. The incoming commit `a08f8ed5bfcf56a6125fdfa3ee06657e14c19008` (Martin Westhead, Sun Aug 23 13:19:02 2026 -0700) adds this file whole (85 insertions). The resolved working-tree file is byte-identical to that commit's version, and the sole delta against HEAD — `chat_comment: comment-ab46f06f` at line 16 — is present. No conflict markers remain in the file.

No code/implementation files were involved in this conflict, so no BUG-1301 precedence exception was invoked and no hunks were dropped. No UAT test files were touched. The cherry-pick sequencer state (`CHERRY_PICK_HEAD`) was left intact for `cherry_pick_finalize_resolution`.
