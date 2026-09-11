---
uid: report-25b3db68
id: REPORT-3543
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-09T22:26:37.091078+00:00'
updated_at: '2026-09-09T22:26:37.091078+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/request-94e93caa.md` — class `UU`, intent/bookkeeping ticket (rule 2e, "one side is a strict superset"). Resolved to the HEAD side via `git checkout --ours` + `git add --sparse` (path is outside the sparse-checkout cone).

  Three-way detail:
  - base (`ee4b757813`): `status: ready_to_reconcile`, no `chat_comment`, no `bundled_in`.
  - ours / HEAD (`ca45d92f6c`): adds `chat_comment: comment-18e5a285` **and** `bundled_in: bundle-b3b7c399`, advances `status` to `free_and_reconciled` with matching `updated_at`/`completed_at`.
  - theirs / incoming `082425ccd3` (`94dc843dc4`): adds `chat_comment: comment-18e5a285` only.

  The two sides do not compete on any fact. Every field the incoming commit touches is already set to the identical value on HEAD; HEAD additionally carries operator-owned status advancement and bundle membership that the incoming side never had. Taking the incoming whole file would have reverted `status` to `ready_to_reconcile` and dropped `bundled_in` — a regression, not a resolution. No timeline lookup was needed because there is no per-fact disagreement to arbitrate.

## Incoming changes preserved

- `.xgd/tickets/hot/request-94e93caa.md`: the incoming commit's sole change is `+  chat_comment: comment-18e5a285`. That line is present verbatim in the resolved file (it was already in HEAD, having landed through an earlier route). Verified against `git show 082425ccd333debca6a7cb520dfdeca19ca4eaa8 -- <file>`.

No hunks were dropped, so the BUG-1301 precedence exception does not apply here. No code, test, or UAT files were involved in this conflict.

## Note on the staged result

`git diff --cached HEAD` is empty: this cherry-pick is redundant, its effect having already reached HEAD by another route (BUG-1109/BUG-1122). Per STEP 4 this is not a failure and `--skip` was not called — the staged tree is left for `cherry_pick_finalize_resolution` to detect and skip. This is the "redundant" branch of STEP 3's discriminator, not the "discarded" one: the incoming commit's key change is verifiably present in HEAD rather than simply absent.
