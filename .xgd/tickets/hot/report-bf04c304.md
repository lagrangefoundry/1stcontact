---
uid: report-bf04c304
id: REPORT-4426
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T12:37:14.364226+00:00'
updated_at: '2026-09-19T12:37:14.364226+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-034bf955.md` — **UU** (index-only; path is outside the
  sparse-checkout cone, so there were no working-tree markers). Rule **2e**
  (intent/bookkeeping ticket, `bug-*`): one side is a strict superset of the
  other, so the superset was kept. Resolved to the **ours/HEAD** blob
  (`a67d8704`) via `git checkout --ours` + `git add --sparse`.

  Per-fact comparison against the merge base (`a47ef055`):

  | fact | incoming (`488962bd`, 2026-09-01T21:16:50Z) | ours/HEAD (2026-09-16T01:48:34Z) |
  |---|---|---|
  | `status` | `free_coding` → `free_coded` | `free_coding` → `bundled` |
  | `fields.commits[0].working_sha` | adds `bd7612f9…` | adds `bd7612f9…` (identical) |
  | `fields.version` | adds `0.2.36` | adds `0.2.36` (identical) |
  | `completed_at` | unchanged (`null`) | `2026-09-14T10:29:07Z` |
  | `fields.story_points` | — | adds `3` |
  | `fields.bundled_in` | — | adds `bundle-8e1807f6` |
  | body | unchanged | unchanged |

  Every fact the incoming commit writes is present in ours, byte-identical for
  `commits`/`version`. The only contested fact is `status`, and ours carries the
  later lifecycle position (`bundled` is downstream of `free_coded`, set on
  2026-09-16 vs the incoming's 2026-09-01) — this very bundle,
  `bundle-8e1807f6`, is what `bundled_in` records. Taking incoming for `status`
  would demote the ticket back to `free_coded` and drop `completed_at`,
  `story_points` and `bundled_in`. No body/prose text differs between the sides,
  so there is nothing to compose.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-034bf955.md` — confirmed. `git show 488962bd -- <file>`
  changes the `commits` list, `version`, `status` and `updated_at`. The
  `commits` entry and `version: 0.2.36` appear verbatim in the resolved blob;
  `status` is present in a strictly later form (`bundled`, which the ticket
  could only have reached by passing through the incoming commit's
  `free_coded`); `updated_at` is a timestamp scalar, superseded by ours.
  Nothing from the incoming side was discarded.

No hunks were dropped under the BUG-1301 precedence exception. No code,
implementation or UAT files were involved in this conflict.

## Net staging result

The staged tree has **no diff vs HEAD** — HEAD already carries this commit's
effect (and more) through the later bundling update. Per STEP 4 this is not a
failure and `--skip` was not invoked; the cherry-pick sequencer state
(`CHERRY_PICK_HEAD` = `488962bd`) is left intact for
`cherry_pick_finalize_resolution` to detect the empty commit and skip it.
