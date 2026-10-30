---
uid: report-4af0e141
id: REPORT-5483
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T06:57:15.444007+00:00'
updated_at: '2026-09-29T06:57:15.444007+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-8b33a146.md` — **UU** (both modified), intent/bookkeeping
  ticket (`request-*`), rule **2e**. Not a matrix-defining spec ticket, so 2d's
  ledger-replay composition does not apply.

  Three-way stages:
  - base `e3626c4d` — Sep 1 draft: `title: Untitled`, `status: draft`, body `(new ticket)`
  - theirs `df6c01f6` (incoming, CHERRY_PICK_HEAD `a705404b3e`) — that same draft plus
    exactly one added line: `chat_comment: comment-972387b5`
  - ours `284e1e08` (HEAD) — Sep 19 state: titled, `completed_at` set,
    `status: free_and_reconciled`, `commits`/`version`/`bundled_in`, full ~130-line body,
    **and the incoming `chat_comment: comment-972387b5` line already present**

  OURS is a strict superset of THEIRS — 2e's "one side a strict superset: keep the
  superset". Resolved to ours verbatim. No per-fact conflict arose: the only fact THEIRS
  contributes is already held identically on the ours side, so nothing was traded away.
  This also agrees with the auto-enriched metadata's fallback (later timestamp wins:
  ours `updated_at` 2026-09-19 vs theirs 2026-09-01).

  Mechanics: the path is outside the sparse-checkout cone (worktree is at 11% of tracked
  files; DOC-986 §2/§4.1), so the conflict existed only in the index with no working-tree
  markers. Resolved by pointing the index entry at the ours blob and restoring the
  `skip-worktree` bit, keeping the entry consistent with the sparse config rather than
  reading as a deletion.

## Incoming changes preserved

- `.xgd/tickets/hot/request-8b33a146.md` — **preserved in full.** The incoming commit's
  entire contribution is the single line `chat_comment: comment-972387b5`; it appears in
  the resolved stage-0 content at line 16, inside the `fields:` map, in the same position
  the incoming diff placed it. Verified by diffing `git show a705404b3e -- <path>` against
  `git show :<path>`. No hunk was dropped, so the BUG-1301 precedence exception was not
  invoked anywhere in this resolution.

## State

`git ls-files -u` is empty and `git status --porcelain` is clean — no conflict-class
entries remain. CHERRY_PICK_HEAD (`a705404b3e`) is still present and untouched; no
`--continue`/`--skip`/`--quit`/`--abort` was issued.

Note for finalize: because the resolution equals HEAD exactly, the staged diff against
HEAD is empty (`HEAD:<path>` resolves to `284e1e08`, the same blob as the resolution).
The replayed Sep 1 update is fully superseded by the Sep 19 state the branch already
carries. Per STEP 4 this was left staged rather than skipped here — finalize should
detect the clean staged diff and skip the commit.
