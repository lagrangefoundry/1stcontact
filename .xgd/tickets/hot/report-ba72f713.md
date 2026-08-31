---
uid: report-ba72f713
id: REPORT-2989
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T16:11:23.007847+00:00'
updated_at: '2026-08-31T16:11:23.007847+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — UU, intent/bookkeeping ticket (rule 2e),
  out of the sparse-checkout cone (index-only conflict, no working-tree markers).
  Resolved per-fact to the HEAD-side content via `git checkout --ours` +
  `git add --sparse`.

  Incoming (`1975a687`, 2026-08-24 14:09:26 -0700, `xgd(ticket): update bug
  bug-6612c4b7`) is a single-line addition: it adds
  `fields.chat_comment: comment-a4e77428`. It changes nothing else — not even
  `updated_at`.

  HEAD (`seed_local_overlay`, ticket `updated_at 2026-08-26T17:36:27`) is the
  same ticket two days later and already carries `chat_comment:
  comment-a4e77428` — the identical key and identical value — in its `fields`
  block, alongside the rest of the downstream lifecycle (`status: bundled`,
  `bundled_in: bundle-78f4e2fe`, `version: 0.2.13`, the three `commits` entries,
  and the rewritten body).

  Per-fact resolution: `fields.chat_comment` — both sides assert the same value,
  so there is no competing fact and HEAD already satisfies the incoming's
  intent; every other field/section — present only on the HEAD side and
  preserved. Nothing was invented, and no fact present only on the incoming side
  was dropped.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-6612c4b7.md` — the incoming commit's sole change is
  `chat_comment: comment-a4e77428`. Confirmed present in the resolved file at
  line 18 (`grep -n chat_comment`). Verified with `git show 1975a687 -- <path>`
  against the resolved worktree file (`git hash-object` =
  `54e03170f8615a3a40cd150fa569cca6d1e49ff9`, the ours-side blob).

This resolution nets to no diff versus HEAD (`git status --porcelain` reports no
tracked entries at all). That is the redundant-commit case, not a discard:
STEP 3's check passes because the incoming commit's key change is *present* in
HEAD, verbatim, via a later route rather than absent. Per STEP 4 the file was
staged and left for `cherry_pick_finalize_resolution` to skip;
`--skip`/`--continue`/`--abort` were not called and `CHERRY_PICK_HEAD`
(`1975a6876b6a366ea6354226d9e23c37de42d5d2`) is intact.

No code, UAT, or spec-ticket files were involved in this conflict, so no
BUG-1301 precedence exception was needed.
