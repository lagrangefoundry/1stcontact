---
uid: report-92ad9f15
id: REPORT-4055
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-11T22:04:55.236994+00:00'
updated_at: '2026-09-11T22:04:55.236994+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-34dd9049.md` — class **AA** (both added; index-only
  conflict, outside the sparse cone, so no working-tree markers). Rule applied:
  **2b / 2e** — ours is a strict per-fact superset, so the superset was kept.
  Resolved with `git show :2: > <path>` then `git add --sparse`.

  Incoming commit: `3e9239d6` "xgd(ticket): update request request-34dd9049",
  2026-08-23 12:56:28 -0700.
  HEAD-side commit: `43c2dac7`, same subject, 2026-08-31 07:22:33 -0700.
  The enrichment rule for this file ("intent unknown on one or both sides —
  take the more recent commit by timestamp") selects HEAD, which is 8 days
  later.

  The two sides differ in frontmatter only; the ticket body is byte-identical.
  Per-fact comparison, all four differences favouring HEAD:

  | field | ours (HEAD) | theirs (incoming) |
  |---|---|---|
  | `updated_at` | 2026-08-31T14:22:33 | 2026-08-22T21:54:23 |
  | `completed_at` | 2026-08-31T14:22:33 | `null` |
  | `status` | `free_and_reconciled` | `ready_to_reconcile` |
  | `bundled_in` | `bundle-b3b7c399` | *(absent)* |

  Taking the incoming side would have reverted the ticket lifecycle from
  `free_and_reconciled` back to `ready_to_reconcile`, nulled `completed_at`,
  and dropped bundle membership. There is no fact on the incoming side that
  HEAD does not already carry at an equal-or-later value.

## Incoming changes preserved

No code/implementation files were in this conflict — the single conflicted
path is a bookkeeping (request) ticket.

The incoming commit's substantive change was nevertheless verified present in
the resolved version, rather than assumed:

- `3e9239d6`'s parent-relative net change to this file is the addition of
  `chat_comment: comment-c6092b70` (confirmed by diffing the incoming blob
  `83ccab3f` against the HEAD-side blob at the corresponding timeline point,
  `b5838695` / blob `d00a8d89` — the only differing line is that field).
- The resolved file (HEAD blob `b8dbec48`) contains
  `chat_comment: comment-c6092b70`. It appears as an unchanged context line in
  the ours-vs-theirs diff, i.e. both sides agree on it.

So the incoming commit's intent reached this branch through a different route
and was then advanced past by `43c2dac7`. This is the redundant-commit case of
STEP 4 (BUG-1109/BUG-1122), not a discard: the incoming change is *present* in
HEAD, not merely absent. Per STEP 4 the staged tree nets to no diff vs HEAD;
`--skip` was NOT invoked and the cherry-pick sequencer state
(`CHERRY_PICK_HEAD` = `3e9239d6`) is left intact for
`cherry_pick_finalize_resolution` to handle.

No BUG-1301 precedence exception was needed, and no test function was deleted.
