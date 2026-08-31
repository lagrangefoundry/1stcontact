---
uid: report-3a92f5e2
id: REPORT-2994
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T16:19:48.315467+00:00'
updated_at: '2026-08-31T16:19:48.315467+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `.xgd/tickets/hot/bug-6612c4b7.md` — **UU**, index-only conflict (path is
  outside the sparse-checkout cone, so no working-tree markers existed;
  resolved via `git checkout --ours` + `git add --sparse`, DOC-986 §2/§4.1).
  Rule applied: **2e** (intent/bookkeeping ticket — `bug-*`, user-authored
  content, not matrix state), per-fact, superset branch.

  Per-fact breakdown of the three-way diff:

  - **Body prose** — the incoming commit's entire body change (replacing
    `## Still outstanding (not in this ticket)` with `## Observability — added
    here` plus the new `## Deployment` section) is **byte-identical on both
    sides**. `diff ours theirs` shows zero differences below the frontmatter.
    Not a competing fact; taken as-is.
  - **`status`** — ours `bundled`, incoming `free_coded`. Ours is the later
    intent and is this bundle's own bookkeeping.
  - **`updated_at`** — ours `2026-08-26T17:36:27`, incoming
    `2026-08-24T21:55:26`. Ours later.
  - **`fields.version`** — ours `0.2.13`, incoming `0.2.11`. Ours higher.
  - **`fields.sha_of_record`** — ours is a strict superset: it contains the
    incoming's single entry (`2058a164…`) plus `0fe586d1…`, `999579b3…`, and
    `working_sha_history: []`.
  - **`fields.bundled_in`** — `bundle-78f4e2fe` exists only on ours.

  Timeline: HEAD-side commit `501a0595d1` (2026-08-31 07:24:25 -0700) is
  later-positioned than incoming `a9248d6756` (2026-08-24 14:55:27 -0700), and
  ours is a strict superset on every conflicting field. Both 2e tests — "keep
  the superset" and "take the later-positioned intent per fact" — select ours
  for all six facts. Taking the incoming frontmatter would have reverted
  `status` from `bundled` back to `free_coded` and dropped
  `bundled_in: bundle-78f4e2fe`, corrupting the in-flight bundle's own state.

  No content was invented; every line in the resolved file is present on at
  least one side.

## Incoming changes preserved

Confirmed. This ticket is a documentation/bookkeeping file, not code, but the
STEP 3 check was performed anyway against `git show a9248d6756 --
.xgd/tickets/hot/bug-6612c4b7.md`:

- Every prose line the incoming commit added is present verbatim in the
  resolved file at lines 142–169: the `## Observability — added here` heading,
  the `head_sampling_rate = 1` / inheritable-list paragraph, the
  `[env.production.observability]`-before-`routes` TOML-table hazard paragraph
  naming `test_UAT_FC_BUG-37_the_production_route_survives_the_new_table`, the
  `wrangler deploy --env production --dry-run` verification line, and the whole
  `## Deployment` section.
- The incoming's frontmatter deltas (`updated_at`, `last_field_updated: body`,
  `status: free_coded`) are not carried forward. They are not discarded work:
  HEAD already applied the incoming's body edit and then advanced the same
  fields further along the same timeline. These are superseded bookkeeping
  scalars, not developer code.

No hunks were dropped under the BUG-1301 precedence exception; no test function
on either side was deleted.

**Net result vs HEAD is an empty staged diff.** This is the BUG-1109/BUG-1122
redundant-commit case, not a discard: HEAD already contains the incoming
commit's key changes (identical body text), which is exactly the distinction
STEP 3 draws — present via a different route, not absent. Per STEP 4, no
`--skip` was called; the tree is staged and left for
`cherry_pick_finalize_resolution` to detect and skip.

Cherry-pick sequencer state (`CHERRY_PICK_HEAD` = `a9248d6756…`) left intact.
`git status --porcelain` reports zero conflict-class entries.
