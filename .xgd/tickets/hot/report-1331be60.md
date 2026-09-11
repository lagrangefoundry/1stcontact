---
uid: report-1331be60
id: REPORT-4058
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-11T22:11:24.200159+00:00'
updated_at: '2026-09-11T22:11:24.200159+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-a03967f2.md` — UU, intent/bookkeeping ticket (`request-*`), rule **2e**. Out of the sparse-checkout cone, so resolved with `git checkout --ours` + `git add --sparse`.

  Per-fact comparison against the merge base (`b6f1c0d`):

  | fact | base | ours (HEAD) | theirs (incoming `50fc10b`) |
  |---|---|---|---|
  | `fields.chat_comment` | absent | `comment-869ded75` | `comment-869ded75` |
  | `fields.bundled_in` | absent | `bundle-b3b7c399` | untouched |
  | `status` | `ready_to_reconcile` | `free_and_reconciled` | untouched |
  | `completed_at` | `null` | `2026-08-31T14:22:29Z` | untouched |
  | `updated_at` | `2026-08-23T03:29:49Z` | `2026-08-31T14:22:29Z` | untouched |

  No fact was changed differently on the two sides, so the timeline rule never engaged. Incoming's only edit — adding `fields.chat_comment: comment-869ded75` — is byte-identical to one of ours, and ours additionally adds `bundled_in` and advances the ticket to `free_and_reconciled`. HEAD is therefore a **strict superset** of incoming; 2e's superset clause says keep the superset. Taking theirs would have reverted the operator-advanced `status`/`completed_at` — a silent demotion, not a resolution.

## Incoming changes preserved

No code/implementation files were conflicted; the single conflict is a bookkeeping ticket.

`git show 50fc10b -- .xgd/tickets/hot/request-a03967f2.md` contains exactly one added line, `  chat_comment: comment-869ded75`. That line is present verbatim in the resolved file (confirmed against `git show HEAD:.xgd/tickets/hot/request-a03967f2.md`). Nothing from the incoming commit was discarded.

No hunk was dropped under the BUG-1301 precedence exception.

## Note on the empty staged diff

`git diff --cached HEAD` is empty: HEAD already carried the incoming commit's sole change (via `bundle-b3b7c399`'s own update to this ticket), so this cherry-pick is genuinely **redundant**, not discarded — STEP 3's distinction. Per STEP 4 this is not a failure and `--skip` was not called; `CHERRY_PICK_HEAD` (`50fc10b`) is intact for `cherry_pick_finalize_resolution` to detect the no-op and skip the commit itself.

`git status --porcelain` is empty — no conflict-class entries remain.
