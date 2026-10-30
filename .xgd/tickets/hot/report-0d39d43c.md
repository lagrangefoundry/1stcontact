---
uid: report-0d39d43c
id: REPORT-4748
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T14:52:00.672031+00:00'
updated_at: '2026-09-21T14:52:00.672031+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-01ea4eec.md` — **UU**, intent/bookkeeping ticket (STEP 2e).
  Outside the sparse-checkout cone (DOC-986 §2/§4.1): conflict existed only in the index,
  no working-tree markers. Resolved by materialising the stage-2 blob (`e2c2f78b19d4`)
  and staging with `git add --sparse`.

  Cherry-pick in flight is `1596690add7` ("xgd(ticket): update request request-01ea4eec",
  Sep 1 11:58:00 -0700), whose parent is `e0795d9332` — the commit resolved in the
  previous attempt. Merge base blob is therefore `bb33d558` (the `free_coded` state).

  Per-fact composition against that base:

  | fact | base (`bb33d558`) | ours (HEAD `f8f42b8e54`) | theirs (`1596690add7`) | taken |
  |---|---|---|---|---|
  | `updated_at` | 2026-09-01T18:57:55 | 2026-09-19T15:15:32 | 2026-09-01T18:57:59 | **ours** |
  | `last_field_updated` | `status` | `status` (unchanged) | `story_points` | **ours** |
  | `completed_at` | `null` | 2026-09-14T10:29:15 | `null` (unchanged) | **ours** |
  | `status` | `free_coded` | `free_and_reconciled` | `free_coded` (unchanged) | **ours** |
  | `fields.bundled_in` | absent | `bundle-8e1807f6` | absent (unchanged) | **ours** |
  | everything else | — | identical | identical | — |

  The incoming commit's entire net contribution is two coupled lines: `updated_at`
  advanced ~5s and `last_field_updated` flipped `status` → `story_points`. The
  `story_points` **value** (`13`) is byte-identical on all three sides — theirs records
  that a story_points update occurred, not a new value. Body text (all ~170 lines through
  `## Origin`) is identical apart from theirs' missing trailing newline; ours' trailing
  newline, matching base, is preserved.

  On `last_field_updated` specifically: 2e's "non-overlapping fields — apply BOTH" does
  not apply, because this field is not independent. It names the field whose edit produced
  the adjacent `updated_at`. Composing it field-by-field would yield the pair
  (`2026-09-19T15:15:32`, `story_points`) — a record asserting the most recent edit was to
  story_points on Sep 1 while carrying a timestamp from the Sep 19 status change. The two
  must travel together; `updated_at` is genuinely competing and ours is 18 days later, so
  the pair resolves to ours. Every other differing fact was changed on ours' side only,
  with theirs sitting at the base value.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a bookkeeping
ticket, so STEP 3 applies as a per-fact rather than per-hunk check. Ours' state is strictly
downstream of the incoming Sep-1 free-coding sequence on the lifecycle (`free_coding` →
`free_coded` → `free_and_reconciled`), and additionally carries `completed_at` and
`bundled_in`. The one fact unique to the incoming side, `last_field_updated: story_points`,
is superseded by ours' later `status` edit for the coupling reason above; it is not a
silently dropped disjoint edit. No BUG-1301 precedence exception was invoked, and no UAT
test function was touched.

## Staging state

`git status --porcelain` empty, `git ls-files -u` empty, `CHERRY_PICK_HEAD`
(`1596690add7`) intact. The staged tree is identical to HEAD, so this cherry-pick has no
net effect. Per STEP 4, `--skip` was NOT invoked; finalize will detect the empty staged
diff and skip the commit.
