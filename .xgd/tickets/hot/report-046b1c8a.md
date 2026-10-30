---
uid: report-046b1c8a
id: REPORT-5464
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T05:03:26.092821+00:00'
updated_at: '2026-09-29T05:03:26.092821+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

Incoming commit: `cb4ece9296fb0d6a7ec89011a1058a5120078a31`
("xgd(ticket): update bug bug-3ade1af4", 2026-09-01 12:30:16 -0700).

## Files resolved

- `.xgd/tickets/hot/bug-3ade1af4.md` — UU, intent/bookkeeping ticket
  (STEP 2e). One conflict hunk over four frontmatter lines; `title`, the
  `fields:` block and the body all merged cleanly. Resolved per-fact:

  | fact | base | ours (HEAD) | theirs (incoming) | taken |
  |---|---|---|---|---|
  | `title` | "23 failures … ten UATs" | "27 failures + 30 collection errors … eleven UATs" | **identical to ours** | both — no conflict, see below |
  | `updated_at` | 2026-09-01T19:28:25Z | 2026-09-19T15:15:31Z | 2026-09-01T19:30:16Z | ours (later) |
  | `last_field_updated` | `story_points` | `status` | `title` | ours — composite-fact note below |
  | `completed_at` | `null` | 2026-09-14T10:29:13Z | `null` (unchanged) | ours |
  | `status` | `free_coded` | `free_and_reconciled` | `free_coded` (unchanged) | ours |
  | `fields.bundled_in` | absent | `bundle-8e1807f6` | absent | ours |
  | `fields.commits[]`, `fields.version`, `story_points` | present | unchanged | unchanged | merged cleanly |

  **Note on `last_field_updated`.** Both sides moved it off the base value
  `story_points` (ours → `status`, theirs → `title`), so this is a genuine
  same-fact conflict and the later intent wins outright. It is also the
  coherent choice: `last_field_updated` describes the event stamped in
  `updated_at`, and ours' 2026-09-19 event is the reconcile that set
  `status: free_and_reconciled`. Taking theirs' `title` alongside ours'
  09-19 `updated_at` would mislabel that event.

## Incoming changes preserved

The incoming commit touched exactly one file; its complete diff against the
merge base is three facts:

1. **`title`** — the substantive content of this commit: "23 failures … ten
   UATs" → "27 failures + 30 collection errors … a half-finished install, a
   stale asset build, and eleven UATs superseded by later work". **Present
   verbatim in the resolved file** — ours already carried byte-identical
   text, so git auto-merged it with no conflict. Nothing was discarded; the
   developer's edit is in the tree.
2. `updated_at: …19:28:25 → …19:30:16` — superseded on the same fact by
   ours' 2026-09-19 value (2e later-intent rule).
3. `last_field_updated: story_points → title` — superseded on the same fact
   by ours' `status` (both sides changed it; ours is later). No content is
   lost: this field is a label naming which field the `updated_at` event
   touched, and the field it labelled (`title`) is itself fully preserved
   per item 1.

No code/implementation files were in conflict. No BUG-1301 precedence
exception was invoked and no UAT test function was touched or deleted.

## Staging state

`git add --sparse` applied; `git status --porcelain` is empty — the staged
result is byte-identical to HEAD, because this commit's only substantive
change (the title rewrite) is already present in HEAD and its two
bookkeeping stamps are superseded there. Per STEP 4, `--skip` was NOT
invoked; CHERRY_PICK_HEAD is left in place for the finalize step, which
will detect the empty staged diff and skip the commit.
