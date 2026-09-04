---
uid: report-f000a39c
id: REPORT-3449
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-04T01:20:04.033989+00:00'
updated_at: '2026-09-04T01:20:04.033989+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-3bc4b835.md` — **UU**, intent/bookkeeping ticket
  (STEP 2 rule **2e**, strict-superset branch), path outside the
  sparse-checkout cone (conflict existed in the index only, no working-tree
  markers; resolved via `git checkout --ours` + `git add --sparse`, each
  issued as the sole content of its own call per BUG-1294).

  Incoming commit: `36728a6a` *"xgd(ticket): update request request-3bc4b835"*
  (free_coded, authored 2026-08-31 18:31:23 -0700).
  HEAD side: `737359c6` *"xgd(ticket): seed_local_overlay request
  request-3bc4b835"* (2026-09-02).
  Merge base blob: `e6b5619e` (the ticket state left by `14cd3cdd`, resolved
  at scope 240/0 immediately before this one).

  The incoming commit's **entire** diff against its own parent is two
  frontmatter lines — no field value, no body text, changes:

  | Fact | Incoming (theirs) | HEAD (ours) | Taken |
  |---|---|---|---|
  | `updated_at` | `2026-09-01T01:31:23` | `2026-09-02T17:48:27` | ours (later) |
  | `last_field_updated` | `story_points` | `status` | ours — audit marker for ours' later write |
  | `status` | `free_coded` | `bundled` | ours — same lifecycle, one step further |
  | `fields.bundled_in` | absent | `bundle-203b1dc2` | ours |
  | `fields.story_points: 3` | unchanged | **identical, unchanged** | no conflict in substance |
  | `fields.commits`, `fields.version: 0.2.29` | unchanged | **identical** | no conflict in substance |
  | body | unchanged | unchanged | identical |

  Note on `last_field_updated: story_points`: this is an audit marker naming
  which field the most recent write touched, not a value. The incoming commit
  does **not** change `story_points` itself — it stays `3` on both sides, an
  unchanged context line in every diff. So nothing about the story-points fact
  is at stake here; HEAD's `last_field_updated: status` is simply the correct
  marker for HEAD's own later write (`status` -> `bundled`).

  Ours is a **strict superset**: it carries every substantive field value the
  incoming side has, identical, with `status` advanced one further step
  (`free_coded` -> `bundled`) and `bundled_in` added. Rule 2e's superset
  branch selects ours, agreeing with the auto-enriched rule for this file
  ("take the more recent commit by timestamp"). Taking theirs would roll
  `status` backwards and drop `bundled_in: bundle-203b1dc2`, un-bundling the
  ticket from the bundle being reconciled.

## Incoming changes preserved

- `.xgd/tickets/hot/request-3bc4b835.md` — **preserved.** The incoming commit
  introduces no field values and no body content; its diff is confined to
  `updated_at` and the `last_field_updated` audit marker. Both are
  bookkeeping fields that HEAD supersedes with strictly later values from a
  later write to the same ticket. Every substantive field the incoming
  version carries (`story_points: 3`, `priority: high`, `fields.commits`
  `61a0becc…`/`deaf3f98…`, `version: 0.2.29`, `chat_comment`, the full body)
  is present byte-identical in the resolved blob `4de1054a`.

  No BUG-1301 precedence exception was invoked; no hunk was dropped, and no
  code or test files were in conflict.

## Note for the finalize step

The staged tree has **no net diff vs HEAD** (`git diff --cached HEAD` is
empty; resolved index entry is stage 0 blob `4de1054a`, which is also the HEAD
blob). The HEAD-side `seed_local_overlay` commit already captured this
ticket's end state, so `36728a6a` is redundant here (BUG-1109/BUG-1122), not
discarded — STEP 3's "present via a different route" case, demonstrated above
field by field. Per STEP 4, staged and exited @done as normal; `--skip` was
not called and the cherry-pick sequencer state (`CHERRY_PICK_HEAD` =
`36728a6a1a63437f2d2a7c5d39fcb96ad1f3c4b3`) is intact for
`cherry_pick_finalize_resolution`.

This is the **third consecutive** commit in this bundle to resolve this way
(236/0 handled `14ad6499`, 240/0 handled `14cd3cdd`). The pattern is
consistent and expected: `seed_local_overlay` on the HEAD side snapshotted
the ticket's final state, so each individual working-timeline update to
`request-3bc4b835` replays as a no-op. Further updates to this ticket in the
bundle should be expected to do the same.
