---
uid: report-1433eae6
id: REPORT-4843
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-23T18:28:23.996512+00:00'
updated_at: '2026-09-23T18:28:23.996512+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-034bf955.md` — **UU**, intent/bookkeeping ticket
  (STEP 2e). Resolved by taking HEAD wholesale; staged with
  `git add --sparse` (path is outside the sparse-checkout cone on this
  resync branch, DOC-986 §2/§4.1).

  Two conflicted hunks, both in the YAML frontmatter. Per-fact
  comparison of the two sides:

  | fact | HEAD (main-rooted) | incoming `488962bdea` (2026-09-01) |
  |---|---|---|
  | `status` | `free_and_reconciled` | `free_coded` |
  | `updated_at` | `2026-09-19T15:15:29` | `2026-09-01T21:16:50` |
  | `completed_at` | `2026-09-14T10:29:07` | `null` |
  | `fields.story_points` | `3` | absent |
  | `fields.bundled_in` | `bundle-8e1807f6` | absent |

  Every conflicted fact is a same-field-changed-differently case, so the
  2e timeline rule applies per fact — and it resolves to HEAD on all of
  them. The incoming commit's `free_coding → free_coded` transition is
  strictly upstream of the state main already holds: this ticket has
  since been carried through reconciliation, stamped `completed_at`, and
  bundled into `bundle-8e1807f6`. Accepting the incoming side would
  regress the lifecycle state and drop `story_points`/`bundled_in`.

  The markdown body below the frontmatter is byte-identical on both
  sides, including the absent trailing newline, so no body merge was
  needed.

## Incoming changes preserved

Not a code file, but the incoming side's substantive contributions were
checked individually rather than discarded with the losing side:

- `fields.commits` (`working_sha: bd7612f977e33b9f307e929f20d1a7cb38e37cee`,
  `reconcile_sha: null`, `main_sha: null`) and `fields.version: 0.2.36` —
  **added by the incoming commit and present verbatim in the resolved
  file.** These merged cleanly (git produced no marker around them)
  because HEAD already carries them identically; they are inside the
  unconflicted region between the two hunks. Verified against
  `git show 488962bdea -- .xgd/tickets/hot/bug-034bf955.md`.
- The `free_coding → free_coded` status transition — superseded, see
  table above. Not a dropped developer change: the lifecycle advanced
  past it on main.

No hunk was dropped under the BUG-1301 precedence exception; no test
files were touched by this conflict.

Net effect: the resolved blob is identical to `HEAD:.xgd/tickets/hot/bug-034bf955.md`,
so this replay stages a clean (empty) diff. Left for the finalize step
to skip per STEP 4 — `--skip` was not invoked here.
