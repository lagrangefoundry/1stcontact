---
uid: report-7f69f243
id: REPORT-4347
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T08:03:26.477630+00:00'
updated_at: '2026-09-18T08:03:26.477630+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — **UU**, out-of-cone (sparse), rule **2e**
  (intent/bookkeeping ticket: `bug-*`, user-authored lifecycle state, not matrix
  state). Resolved per-fact, not whole-file-by-timeline.

  Incoming commit: `bffb6b3` "xgd(ticket): update bug bug-23d1ec27" (2026-08-26).
  Ours (HEAD): blob `52bab41`.

  Per-fact analysis (base blob `2d6d161`: `status: free_coded`,
  `updated_at: 2026-08-25T23:28:10`):

  | fact | base | incoming (2026-08-26) | ours / HEAD (2026-08-31) | kept |
  |---|---|---|---|---|
  | `status` | `free_coded` | `ready_to_reconcile` | `bundled` | **ours** |
  | `updated_at` | 2026-08-25T23:28 | 2026-08-26T18:31 | 2026-08-31T05:05 | **ours** |
  | `last_field_updated` | `story_points` | `status` | `status` | identical |
  | `fields.bundled_in` | absent | absent | `bundle-8eef3846` | **ours** (ours-only addition) |
  | trailing newline at EOF | absent | absent | present | **ours** |

  Both sides changed the same fields, so the timeline rule applies per fact. The
  auto-enrichment reported intent unknown on the ours side (a
  `Merge branch 'free-BUG-39' into xgd-working` commit) and directed "take the more
  recent commit by timestamp." Ours is the more recent on every contested fact
  (2026-08-31 vs 2026-08-26), and it is also strictly forward of incoming in the
  ticket lifecycle: `free_coded` → `ready_to_reconcile` → `bundled`. Ours
  additionally carries `bundled_in: bundle-8eef3846`, a field incoming never
  touched, making it a strict superset. Nothing on the incoming side is
  non-overlapping, so there is nothing from incoming to compose in.

  Resolution is ours' blob byte-exact: written with
  `git cat-file blob 52bab41 > <path>`, verified `git cat-file -s` 7881 ==
  `wc -c` 7881 and `git hash-object` == `52bab41…`, then staged with
  `git add --sparse -- <path>` (the path is outside the sparse cone, so the
  conflict existed only in the index with no working-tree markers). No field was
  hand-edited and no content was invented.

## Incoming changes preserved

No code/implementation files were in this conflict — the single conflicted path is
a bookkeeping ticket.

STEP 3 check on the incoming commit's key change: `bffb6b3`'s entire intent is to
advance this bug out of `free_coded` (`status: free_coded` →
`ready_to_reconcile`, with the matching `updated_at` / `last_field_updated`
bookkeeping). That advance **is present in HEAD**, via a later route: HEAD already
carries `status: bundled` plus `fields.bundled_in: bundle-8eef3846`, i.e. the
ticket has moved past `ready_to_reconcile` to the next lifecycle state. This is the
redundant case, not the discarded case — re-applying incoming would *regress*
operator-owned lifecycle state and drop `bundled_in`.

Consequently the staged tree nets to no diff vs HEAD (`git diff --cached HEAD` is
empty). Per STEP 4 this is not a @fail: the commit is genuinely redundant, the
sequencer state (`CHERRY_PICK_HEAD` = `bffb6b3`) is left intact, and
`cherry_pick_finalize_resolution` will detect the clean staged diff and skip the
commit. No `--skip`/`--continue`/`--abort` was issued here.

No BUG-1301 precedence exception was invoked; no hunk was dropped on that basis.

`git status --porcelain` is empty: no UU/AA/DU/UD lines remain.
