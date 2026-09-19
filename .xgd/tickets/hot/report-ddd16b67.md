---
uid: report-ddd16b67
id: REPORT-4427
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T12:38:51.173355+00:00'
updated_at: '2026-09-19T12:38:51.173355+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-034bf955.md` — **UU** (index-only; the path is outside
  the sparse-checkout cone, so there were no working-tree markers). Rule **2e**
  (intent/bookkeeping ticket, `bug-*`): one side is a strict superset of the
  other, so the superset was kept. Resolved to the **ours/HEAD** blob
  (`a67d8704`) via `git checkout --ours` + `git add --sparse`.

  Incoming commit is `3df77005` ("xgd(ticket): update bug bug-034bf955",
  2026-09-01T21:16:53Z), whose parent blob `040ee98c` is the merge base.
  Per-fact comparison:

  | fact | incoming (`3df77005`) | ours/HEAD (updated 2026-09-16T01:48:34Z) |
  |---|---|---|
  | `fields.story_points` | adds `3` | already `3` (identical) |
  | `last_field_updated` | `status` → `story_points` | stays `status` |
  | `updated_at` | `…21:16:50` → `…21:16:53` | `2026-09-16T01:48:34` |
  | `status` | `free_coded` (untouched) | `bundled` |
  | `completed_at` | `null` (untouched) | `2026-09-14T10:29:07` |
  | `fields.bundled_in` | — | `bundle-8e1807f6` |
  | body | unchanged | unchanged |

  The incoming commit's only substantive change is `story_points: 3`, and ours
  already carries it verbatim. The remaining two differences, `updated_at` and
  `last_field_updated`, are derived bookkeeping scalars that record the most
  recent field write: ours was written 15 days later, and its own most recent
  write was `status` (→ `bundled`, the very bundle being reconciled,
  `bundle-8e1807f6`). Taking incoming for those two scalars would have
  back-dated `updated_at` and made `last_field_updated` disagree with the actual
  latest edit, while taking incoming's whole file would additionally have
  demoted `status` to `free_coded` and dropped `completed_at` and `bundled_in`.
  No body/prose text differs between the sides, so there is nothing to compose.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-034bf955.md` — confirmed. `git show 3df77005 -- <file>`
  adds `story_points: 3` and bumps `last_field_updated`/`updated_at`. The
  `story_points: 3` line is present verbatim in the resolved blob
  (`git diff 040ee98c a67d8704` shows it as an ours-side addition too); the two
  timestamp/marker scalars are superseded by ours' strictly later values.
  Nothing from the incoming side was discarded.

No hunks were dropped under the BUG-1301 precedence exception. No code,
implementation or UAT files were involved in this conflict.

## Net staging result

The staged tree has **no diff vs HEAD** — HEAD already carries this commit's
effect (and more) through the later bundling update. Per STEP 4 this is not a
failure and `--skip` was not invoked; the cherry-pick sequencer state
(`CHERRY_PICK_HEAD` = `3df77005`) is left intact for
`cherry_pick_finalize_resolution` to detect the empty commit and skip it.

This is the second consecutive commit in this bundle to resolve this way
(the previous was `488962bd`, REPORT-4426): xgd-working recorded the
`free_coded` → `version`/`commits` → `story_points` field writes as a run of
separate ticket commits, all of whose effects are already folded into the
HEAD-side blob.
