---
uid: report-51b3dfa5
id: REPORT-4210
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T03:26:49.711467+00:00'
updated_at: '2026-09-14T03:26:49.711467+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-034bf955.md` — UU (index-only; path is outside the
  sparse-checkout cone, so no working-tree markers existed). Rule 2e
  (intent/bookkeeping ticket, `bug-*`): same-fact conflict resolved in favour of
  the later-positioned intent. Resolved with
  `git checkout --ours --ignore-skip-worktree-bits` + `git add --sparse`
  (`git checkout` has no `--sparse` flag in this git version).

### Why ours

Both sides edited exactly the same three frontmatter facts and nothing else —
there are no disjoint edits to combine:

| fact | base | ours (HEAD) | theirs (incoming) |
|---|---|---|---|
| `updated_at` | 2026-09-01T21:16:53 | 2026-09-11T18:53:54 | 2026-09-01T21:20:15 |
| `last_field_updated` | `story_points` | `status` | `status` |
| `status` | `free_coded` | `bundled` | `ready_to_reconcile` |
| `fields.bundled_in` | absent | `bundle-8e1807f6` | absent |

HEAD's side is commit `79ad55aaf1` *"xgd(ticket): seed_local_overlay bug
bug-034bf955"* (2026-09-11), which carries `status: bundled` and
`bundled_in: bundle-8e1807f6` — i.e. the state produced by *this* reconcile
bundle. Incoming is `05ef55a713` (2026-09-01), which advanced the same ticket
`free_coded -> ready_to_reconcile`. `ready_to_reconcile` is the immediate
predecessor of `bundled` in the lifecycle, and the bundling step that produced
HEAD's value already consumed it. Ours is therefore both the
later-positioned intent (10 days later) and strictly downstream on the same
field. `last_field_updated: status` is identical on both sides.

## Incoming changes preserved

No code/implementation files were conflicted — the only conflicted file is a
bookkeeping ticket.

Incoming's three field writes are accounted for, none discarded:

- `last_field_updated: status` — present verbatim in the resolution.
- `status: ready_to_reconcile` — present via a different route, not absent:
  HEAD has already advanced past it to `bundled` for this very bundle
  (`bundled_in: bundle-8e1807f6`). Re-applying the earlier value would move the
  ticket *backwards* through its lifecycle.
- `updated_at` — a bare timestamp, superseded by ours' later one.

The staged tree therefore nets to no diff vs HEAD (`git diff --cached HEAD` is
empty). Per STEP 4 this is the redundant-commit case (BUG-1109/BUG-1122), not a
discard: STEP 3's distinguishing test is whether the incoming commit's key
change is present in HEAD, and it is — superseded by a later value of the same
field. `--skip` was not called; the cherry-pick sequencer state
(`CHERRY_PICK_HEAD` = `05ef55a713`) is left intact for
`cherry_pick_finalize_resolution`.

## Post-merge review flag

The enrichment metadata classified this as "intent unknown on one or both
sides", which asks for a post-merge review flag. Flagged here for the record,
though the lifecycle relationship above makes the outcome unambiguous.
