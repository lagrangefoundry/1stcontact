---
uid: report-5dbc2b02
id: REPORT-4844
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-23T18:30:13.375463+00:00'
updated_at: '2026-09-23T18:30:13.375463+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-034bf955.md` — **UU**, intent/bookkeeping ticket
  (STEP 2e). Resolved to the HEAD side via `git checkout --ours`, staged
  with `git add --sparse` (path is outside the sparse-checkout cone on
  this resync branch, DOC-986 §2/§4.1).

  Incoming commit this attempt is `3df77005` (2026-09-01 14:16:53), the
  immediate successor of `488962bd` handled in the previous attempt. Its
  entire content is a single field addition plus the bookkeeping that
  accompanies it.

  Diff of the two conflict stages is confined to frontmatter — the
  markdown body is byte-identical (`git diff 89395722 db7db2f7` shows no
  hunks below `---`). Per-fact resolution:

  | fact | HEAD (main-rooted) | incoming `3df77005` | resolved | basis |
  |---|---|---|---|---|
  | `fields.story_points` | `3` | `3` | `3` | identical on both sides — no conflict in substance |
  | `fields.bundled_in` | `bundle-8e1807f6` | absent | kept | additive, HEAD-only |
  | `last_field_updated` | `status` | `story_points` | `status` | same field, differs — later intent wins |
  | `status` | `free_and_reconciled` | `free_coded` | `free_and_reconciled` | same field, differs — later intent wins |
  | `completed_at` | `2026-09-14T10:29:07` | `null` | `2026-09-14T10:29:07` | same field, differs — later intent wins |
  | `updated_at` | `2026-09-19T15:15:29` | `2026-09-01T21:16:53` | `2026-09-19T15:15:29` | same field, differs — later intent wins |

  Every genuinely-conflicting fact resolves to HEAD, which is why the
  net result equals HEAD's blob. HEAD's version originates in
  `21006caccb` (2026-09-19), already on main; the ticket has since been
  carried through reconciliation, stamped `completed_at`, and bundled
  into `bundle-8e1807f6`. `last_field_updated: status` on the HEAD side
  is internally consistent with that later status transition, so taking
  incoming's `story_points` there would leave the record self-
  contradictory.

## Incoming changes preserved

Not a code file, but the incoming commit's substantive contribution was
verified present rather than assumed discarded with the losing side:

- **`fields.story_points: 3`** — the whole point of `3df77005`. Present
  in the staged result at line 24. HEAD already carried it identically
  (added there by a later path), so the two sides agree on this fact and
  nothing was lost.
- `last_field_updated: story_points` and the `updated_at` bump to
  `21:16:53` — pure bookkeeping attached to the above, superseded by
  HEAD's 2026-09-19 status update. Not a dropped developer change: the
  field value it announces is present; only the "most recent edit was
  this one" marker is stale.

No hunk was dropped under the BUG-1301 precedence exception. No test
files were touched by this conflict.

Net effect: the resolved blob is identical to
`HEAD:.xgd/tickets/hot/bug-034bf955.md`, so this replay stages a clean
(empty) diff — `git diff --cached HEAD -- <path>` returns nothing. Left
for the finalize step to skip per STEP 4; `--skip` was not invoked here,
and `CHERRY_PICK_HEAD` remains at `3df77005`.
