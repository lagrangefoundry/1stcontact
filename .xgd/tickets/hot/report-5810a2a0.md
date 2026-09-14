---
uid: report-5810a2a0
id: REPORT-4187
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T00:32:25.632453+00:00'
updated_at: '2026-09-14T00:32:25.632453+00:00'
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
  ticket). Rule applied: per-fact comparison; the one substantive fact the
  incoming commit changed (`title`) is byte-identical on both sides, and HEAD
  is the later side on every remaining fact, so HEAD's blob is the resolution
  (`git checkout --ours` + `git add --sparse`). Ours stage blob (963294b5) is
  identical to HEAD, so taking ours discarded no auto-merged content.

Incoming commit is cb4ece92 `xgd(ticket): update bug bug-3ade1af4`, third in
the chain resolved this session (after 08bbde06 and d975830c). Base has
advanced to 4df13eff (d975830c's blob).

Per-fact breakdown (base 4df13eff -> ours 963294b5 / theirs 50c13659):

| fact | base | theirs (incoming cb4ece92) | ours (HEAD) | resolution |
|---|---|---|---|---|
| `title` | "23 failures...ten UATs" | "27 failures + 30 collection errors...eleven UATs" | same new string, byte-identical | BOTH SIDES AGREE - no conflict on this fact; the incoming edit is present verbatim |
| `updated_at` | 09-01 19:28:25Z | 09-01 19:30:16Z | 09-11 18:53:54Z | later wins -> ours |
| `last_field_updated` | `story_points` | `title` | `status` | coupled with `updated_at` as one fact ("what the most recent edit touched"); later wins -> ours |
| `status` | `free_coded` | unchanged | `bundled` | ours-only advance -> kept ours |
| `fields.bundled_in` | absent | absent | `bundle-8e1807f6` | ours-only addition -> kept |

`git diff :2: :3:` confirms the title line appears only as diff CONTEXT, not as
a changed line - the two sides produced the identical string. This also
retroactively explains the HEAD-side title seen in the two previous steps of
this chain: it originated from this very developer edit, carried into HEAD by
the seed_local_overlay commit ahead of the cherry-pick replaying it.

No content was invented; every value in the result is present on at least one
side.

## Incoming changes preserved

Commit cb4ece92's substantive payload is the `title` rewrite, and that exact
string is in HEAD - not merely equivalent, byte-identical. The only lines not
carried are the bookkeeping pair `updated_at`/`last_field_updated`, superseded
by a strictly later edit already in HEAD (status -> bundled on 09-11). Nothing
from the incoming diff is absent. This is a redundant commit, not a discard
(STEP 3 / BUG-1109 distinction).

Consequence: the staged diff vs HEAD is empty. Per STEP 4 this is not a failure
and `--skip` was NOT called; the finalize step will detect the clean staged
diff and skip the commit.

No code/implementation files, no UAT test files, and no spec tickets were
involved. No hunks were dropped under the BUG-1301 precedence exception.
