---
uid: report-e9981afa
id: REPORT-5465
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T05:04:35.671713+00:00'
updated_at: '2026-09-29T05:04:35.671713+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

Incoming commit: `d22ba37c40a43407ecf0246d5c5b9f8758ccb4c7`
("xgd(ticket): update bug bug-3ade1af4", 2026-09-01 12:34:04 -0700).

## Files resolved

- `.xgd/tickets/hot/bug-3ade1af4.md` — UU, intent/bookkeeping ticket
  (STEP 2e). One conflict hunk over four frontmatter lines; `title`, the
  `fields:` block and the body merged cleanly. Resolved per-fact:

  | fact | base | ours (HEAD) | theirs (incoming) | taken |
  |---|---|---|---|---|
  | `status` | `free_coded` | `free_and_reconciled` | `ready_to_reconcile` | ours — later, and strictly downstream |
  | `updated_at` | 2026-09-01T19:30:16Z | 2026-09-19T15:15:31Z | 2026-09-01T19:34:04Z | ours (later) |
  | `last_field_updated` | `title` | `status` | `status` | **identical on both sides** — no conflict |
  | `completed_at` | `null` | 2026-09-14T10:29:13Z | `null` (unchanged) | ours |
  | `title`, `fields.commits[]`, `fields.version`, `story_points` | — | unchanged | unchanged | merged cleanly |
  | `fields.bundled_in` | absent | `bundle-8e1807f6` | absent | ours |

## Incoming changes preserved

The incoming commit touched exactly one file; its complete diff against the
merge base is three facts:

1. **`status: free_coded → ready_to_reconcile`** — the substantive change.
   Superseded on the same fact by ours' `free_and_reconciled`. This is not
   a discard: `ready_to_reconcile` is the state a ticket enters *before*
   reconciliation and `free_and_reconciled` is the state it lands in
   *after*, so ours' value strictly subsumes the incoming transition — the
   ticket has already passed through the state this commit was moving it
   to. Ours is also 18 days later (2026-09-19 vs 2026-09-01).
2. `updated_at: …19:30:16 → …19:34:04` — superseded on the same fact by
   ours' 2026-09-19 stamp, consistent with item 1.
3. `last_field_updated: title → status` — **present**: both sides
   independently set this to `status`, so the incoming value is in the
   resolved file verbatim, with no conflict to arbitrate.

No code/implementation files were in conflict. No BUG-1301 precedence
exception was invoked and no UAT test function was touched or deleted.

## Staging state

`git add --sparse` applied; `git status --porcelain` is empty — the staged
result is byte-identical to HEAD, because every fact this commit carried is
either already present in HEAD (`last_field_updated`) or superseded there
by a strictly later lifecycle state. Per STEP 4, `--skip` was NOT invoked;
CHERRY_PICK_HEAD is left in place for the finalize step, which will detect
the empty staged diff and skip the commit.
