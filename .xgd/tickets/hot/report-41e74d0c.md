---
uid: report-41e74d0c
id: REPORT-4186
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T00:30:51.420538+00:00'
updated_at: '2026-09-14T00:30:51.420538+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-3ade1af4.md` — UU, index-only (sparse-excluded on the
  reconcile branch, so no working-tree markers). Class 2e (intent/bookkeeping
  ticket). Rule applied: per-fact comparison; HEAD is a superset of the
  incoming side on every fact the incoming commit touched, so HEAD's blob is
  the resolution (`git checkout --ours` + `git add --sparse`). Ours stage blob
  (963294b5) is identical to HEAD, so taking ours discarded no auto-merged
  content.

Incoming commit is d975830c `xgd(ticket): update bug bug-3ade1af4` (the
immediate successor of 08bbde06, resolved in the previous step). Base has
advanced to 2a59e08e (08bbde06's blob).

Per-fact breakdown (base 2a59e08e -> ours 963294b5 / theirs 4df13eff):

| fact | base | theirs (incoming d975830c) | ours (HEAD) | resolution |
|---|---|---|---|---|
| `fields.story_points` | `5` | `5` (unchanged) | `5` | identical everywhere; the commit re-set the value it already had |
| `last_field_updated` | `status` | `story_points` | `status` | coupled with `updated_at` as one fact ("what the most recent edit touched"); both sides changed that fact, later intent wins -> ours |
| `updated_at` | 09-01 19:28:24Z | 09-01 19:28:25Z | 09-11 18:53:54Z | later wins -> ours |
| `title` | "23 failures...ten UATs" | unchanged | "27 failures + 30 collection errors...eleven UATs" | ours-only edit, incoming never touched it -> kept ours |
| `status` | `free_coded` | unchanged | `bundled` | ours-only advance -> kept ours |
| `fields.bundled_in` | absent | absent | `bundle-8e1807f6` | ours-only addition -> kept |

Note on `last_field_updated`: taking the incoming `story_points` value while
keeping ours' later `updated_at` (09-11, when the actual edit was
status -> bundled) would produce an internally inconsistent record. The two
fields describe a single fact, so they are resolved together to the later side
rather than split. No content was invented; every value in the result is
present on at least one side.

## Incoming changes preserved

Commit d975830c's entire diff is two lines: an `updated_at` bump of 784ms and
`last_field_updated: status -> story_points`. Its substantive payload -
`fields.story_points: 5` - is byte-identical in HEAD, so the developer's data
intent is fully present. Nothing from the incoming diff is absent; the only
non-carried lines are the bookkeeping timestamp pair, superseded by a strictly
later edit already in HEAD. This is a redundant commit, not a discard
(STEP 3 / BUG-1109 distinction).

Consequence: the staged diff vs HEAD is empty. Per STEP 4 this is not a failure
and `--skip` was NOT called; the finalize step will detect the clean staged
diff and skip the commit.

No code/implementation files, no UAT test files, and no spec tickets were
involved. No hunks were dropped under the BUG-1301 precedence exception.
