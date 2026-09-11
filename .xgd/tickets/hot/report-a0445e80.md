---
uid: report-a0445e80
id: REPORT-3623
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-10T01:17:45.261437+00:00'
updated_at: '2026-09-10T01:17:45.261437+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — UU, index-only (path is outside the
  sparse-checkout cone, so there were no working-tree conflict markers).
  Class: intent/bookkeeping ticket (STEP 2 §2e). Rule applied: **strict
  superset / later-positioned side wins, per fact**. Resolved to the OURS
  (HEAD) blob via `git checkout --ours` + `git add --sparse`.

  Both sides touched only frontmatter — the merge base, ours, and theirs
  bodies are byte-identical, so there was no disjoint content edit to
  compose.

  Per-fact adjudication (base `2d6d161` → ours `ffdcef9` / theirs `ad25504`):

  | fact | base | ours (HEAD) | theirs (incoming `bffb6b3`, 2026-08-26) | kept |
  |---|---|---|---|---|
  | `status` | `free_coded` | `bundled` | `ready_to_reconcile` | ours |
  | `updated_at` | `2026-08-25T23:28:10Z` | `2026-08-31T05:05:09Z` | `2026-08-26T18:31:09Z` | ours |
  | `last_field_updated` | `story_points` | `status` | `status` | same on both sides |
  | `fields.bundled_in` | absent | `bundle-8eef3846` | absent | ours (only side that has it) |

  Rationale: ours is not a competing edit, it is the *downstream* lifecycle
  state of theirs. `bundled` is reachable only by passing through
  `ready_to_reconcile`, and ours additionally carries `fields.bundled_in:
  bundle-8eef3846`, which theirs never had. Ours is therefore a strict
  superset on every contested fact, and it is also the later-positioned side
  by ticket `updated_at` (2026-08-31 vs 2026-08-26) — the tie-breaker the
  auto-enrichment note prescribed ("take the more recent commit by
  timestamp"). Taking theirs would have regressed the ticket's lifecycle and
  dropped `bundled_in`.

## Incoming changes preserved

No code/implementation files were in this conflict set — the only conflicted
path is a bookkeeping ticket.

STEP 3 discard check for `.xgd/tickets/hot/bug-23d1ec27.md`: **not a
discard — redundant.** The incoming commit's entire intent was to advance
this bug off `free_coded`. That advance is present in HEAD, via a later
route: HEAD already carries `status: bundled` (a strictly later state than
the incoming's `ready_to_reconcile`) plus `fields.bundled_in`. This is the
STEP 4 / BUG-1109 case, not the STEP 3 case — the incoming change is present
in HEAD through a different route rather than absent from it.

No hunks were dropped under the BUG-1301 precedence exception; no test
functions were touched or deleted.

## Staging state

`git status --porcelain` shows no UU/AA/DU/UD/AU/UA lines. The staged diff
against HEAD is empty, which is the expected outcome of taking ours on the
sole conflicted file — per STEP 4 this is not a failure, and
`cherry_pick_finalize_resolution` will detect the clean staged diff and skip
the commit. `CHERRY_PICK_HEAD` (`bffb6b34faf48d7c750ccafbec0005964840184a`)
was left in place; no `--continue`/`--skip`/`--quit`/`--abort`/`reset` was
run.
