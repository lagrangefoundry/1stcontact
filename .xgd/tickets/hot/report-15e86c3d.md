---
uid: report-15e86c3d
id: REPORT-5409
type: report
title: 'Resync resolve conflicts: 6ba006de764d843fa7f4357df2b341e72f20e2f6'
created_by: xgd
created_at: '2026-09-28T23:28:52.324945+00:00'
updated_at: '2026-09-28T23:28:52.324945+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-78370159.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), rule **2e** applied. Both sides are
  `xgd(ticket): update request request-78370159` commits descending from the
  same base (`70c125f5`, status `free_coding`).

  Field-level comparison of the two sides against the merge base:

  | field | ours (HEAD, resync branch) | theirs (`139c79de`, incoming) |
  |---|---|---|
  | `commits` (2 working_sha entries) | added, identical | added, identical |
  | `version` | `0.2.26` | `0.2.26` |
  | `status` | `bundled` | `free_coded` |
  | `story_points` | 13 | 8 |
  | `bundled_in` | `bundle-87be4669` | *(absent)* |
  | `updated_at` | 2026-09-09T21:32:50 | 2026-09-01T00:53:57 |
  | body (300+ lines) | unchanged from base | unchanged from base except stripped trailing newline |

  No field is changed differently-but-concurrently in a way requiring a
  per-fact merge: every field theirs touches, ours touches identically or
  supersedes. Ours is a strict superset carrying the later state
  (`free_coding → free_coded → bundled`), so under 2e's "one side a strict
  superset: keep the superset" the resolution is ours verbatim, byte for byte
  (index blob `9c6d321c8b13840940fd0f2800f0edab053050f4`, including the
  trailing newline theirs had stripped).

  Staged via `git checkout-index --stage=2` + `git add --sparse` — the path is
  outside the sparse-checkout cone (11% of tracked files present), so the
  conflict existed only in the index with no working-tree markers.

## Incoming changes preserved

No code/implementation files were in conflict; the sole conflicted path is a
bookkeeping ticket.

Every change the incoming commit `139c79de` makes to
`.xgd/tickets/hot/request-78370159.md` is present in the resolved version:

- the two `commits` entries (`855dd57a…`, `482a1f98…`, both with null
  `reconcile_sha`/`main_sha`) — byte-identical on both sides, present;
- `version: 0.2.26` — identical on both sides, present;
- the `free_coding → free_coded` status transition — present as its successor
  state `bundled`, which is reachable only *through* `free_coded`. Taking
  theirs here would have regressed the ticket backwards, dropped
  `bundled_in: bundle-87be4669`, and reverted the 8→13 story-point
  re-estimate.

No hunk was dropped under the BUG-1301 precedence exception; the exception was
not invoked. Nothing from the incoming side was discarded.

The resolved index content is identical to HEAD, so the staged diff is empty —
this cherry-pick is a no-op whose effect already landed on the resync branch.
Per STEP 4, staging was left as-is and `--skip` was **not** called;
`CHERRY_PICK_HEAD` (`139c79dec2a17f0370d8e8eebc2e378cf24c8187`) remains present
for the finalize step.
