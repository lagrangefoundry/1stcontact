---
uid: report-7914abbf
id: REPORT-5486
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T07:03:14.520128+00:00'
updated_at: '2026-09-29T07:03:14.520128+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-034bf955.md` — **UU**, intent/bookkeeping ticket
  (`bug-*`), STEP 2e. Sole conflicted path. Incoming commit is
  `3df77005` ("xgd(ticket): update bug bug-034bf955", 2026-09-01
  14:16:53 -0700). Conflict confined entirely to the YAML frontmatter —
  body (Symptom / Root cause / Fix / Test plan) is identical on ours and
  theirs modulo a trailing newline that ours adds. Resolved to the HEAD
  side.

  The incoming commit's full diff is three lines:

  | field | base | ours (HEAD) | theirs (`3df77005`) | taken |
  |---|---|---|---|---|
  | `fields.story_points` | *(absent)* | `3` | `3` *(added)* | **identical — already in ours** |
  | `last_field_updated` | `status` | `status` | `story_points` | ours |
  | `updated_at` | `09-01T21:16:50` | **`09-19T15:15:29`** | `09-01T21:16:53` | ours |

  Plus the ours-only lifecycle state HEAD already carries and theirs
  does not touch: `status: free_and_reconciled` (vs base/theirs
  `free_coded`), `completed_at: 2026-09-14T10:29:07`, and
  `fields.bundled_in: bundle-8e1807f6`.

  Per 2e: `story_points` is not in conflict at all — both sides assert
  the same value, so there is no fact to choose between. The only two
  genuinely-differing facts are the derived bookkeeping pair
  `last_field_updated` / `updated_at`, and on those HEAD is
  later-positioned by 18 days. Taking theirs would rewind `updated_at`
  from 09-19 back to 09-01 and would be inconsistent with HEAD's
  `status`/`completed_at`/`bundled_in`, which postdate it.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-034bf955.md` — verified against
  `git show 3df77005 -- .xgd/tickets/hot/bug-034bf955.md`. The commit's
  one substantive addition, `fields.story_points: 3`, is present
  verbatim in the resolved blob (line 24 of the staged version,
  confirmed by `git show :<path> | grep story_points`). Nothing the
  incoming commit asserts is absent from the result.

  The two metadata lines not taken (`last_field_updated`, `updated_at`)
  are derived bookkeeping that xgd rewrites on every field update, not
  developer content; HEAD's values are strictly later and already
  reflect subsequent edits to this ticket.

- No hunks dropped under the BUG-1301 precedence exception. No code
  files, no UAT test files, no spec tickets were in conflict.

## Staging state

`git status --porcelain` is empty: the UU line is gone and the resolved
blob is staged. `CHERRY_PICK_HEAD` (`3df77005`) is intact and untouched —
`--continue`/`--skip`/`--quit`/`--abort` were not invoked.

Mechanics: the path is `skip-worktree` (sparse config excludes
`/.xgd/tickets/**`; xgd writes these files out-of-band), so it never
materialised in the working tree during the conflict. Resolved content
was written back to disk to match its siblings, the exact stage-2 blob
(`64c6c0f1`) staged via `git update-index --cacheinfo`, and the
`skip-worktree` bit restored.

Note for the finalize step: `git diff --cached --stat HEAD` is empty.
HEAD already contains a strict superset of this commit's effect
(`story_points: 3` landed earlier via a different path), so this
cherry-pick is empty and is expected to be skipped, not committed.
