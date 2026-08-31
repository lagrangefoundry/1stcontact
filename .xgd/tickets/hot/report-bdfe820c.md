---
uid: report-bdfe820c
id: REPORT-2957
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T15:10:24.097670+00:00'
updated_at: '2026-08-31T15:10:24.097670+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/request-94e93caa.md` — class **UU**, intent/bookkeeping ticket (rule **2e**), resolved by **keeping the strict superset (HEAD/ours)**.
  - Incoming (`082425ccd333debca6a7cb520dfdeca19ca4eaa8`, `xgd(ticket): update request request-94e93caa`) added exactly one line: `fields.chat_comment: comment-18e5a285`.
  - HEAD (`cf4b475c93`, `xgd(ticket): seed_local_overlay request request-94e93caa`) contains that same `chat_comment` line **plus** additional, non-overlapping advancement: `status: ready_to_reconcile` → `bundled`, `fields.bundled_in: bundle-b3b7c399`, and a later `updated_at` (`2026-08-24T02:10:41` vs `2026-08-23T03:29:52`).
  - `git diff <theirs> <ours>` shows ours adds only and removes nothing from theirs, so ours is a strict superset. No per-fact timeline tiebreak was needed — the two sides do not disagree about any fact.
  - Path is outside the sparse-checkout cone (`!/.xgd/tickets/**`, DOC-986 §2/§4.1), so the conflict existed only in the index with no working-tree markers; staged with `git add --sparse`.

## Incoming changes preserved

- `.xgd/tickets/hot/request-94e93caa.md`: **preserved**. The incoming commit's sole change, `chat_comment: comment-18e5a285`, is present verbatim in the resolved file (frontmatter `fields:` block). Verified against `git show 082425ccd333debca6a7cb520dfdeca19ca4eaa8 -- <file>`.

No hunks were dropped; the BUG-1301 precedence exception was not invoked.

## Note for the finalize step

The resolution is byte-identical to HEAD, so the staged diff against HEAD is empty — this commit's effect (the `chat_comment` field) had already landed on the bundle branch via the `seed_local_overlay` route. This is the redundant-commit case (BUG-1109/BUG-1122), not a discard: STEP 3's check confirms the incoming change is *present* in HEAD rather than absent. `--skip` was deliberately not called; `CHERRY_PICK_HEAD` is intact for `cherry_pick_finalize_resolution` to detect the clean staged diff and skip the commit.
