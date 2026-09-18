---
uid: report-c5b4ff64
id: REPORT-4346
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T08:00:55.882278+00:00'
updated_at: '2026-09-18T08:00:55.882278+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — UU, intent/bookkeeping ticket (rule 2e;
  bundle ticket, sparse-excluded so index-only). Resolved to the OURS side via
  `git checkout --ours` + `git add --sparse`.

  Per-fact analysis (2e, per-fact not whole-file):
  - Incoming `eb58654` (2026-08-26T17:36Z) touched exactly two facts:
    `status: ready_to_reconcile -> reconciling` and the matching `updated_at` bump.
  - HEAD (`8e07e6015d`, 2026-08-31T14:23Z) touched a strict superset of those
    facts: `status -> free_and_reconciled`, `updated_at`, plus `completed_at`,
    `last_field_updated: result`, `result: pass`, `fields.commits` collapsed to a
    single landed entry with `main_sha: eef7a8b4`, and the newly added
    `fields.orphan_commits` (140 entries) and `fields.merged_at_commit`.
  - Both sides changed the SAME facts (`status`, `updated_at`) differently, so the
    timeline rule applies per fact — HEAD is the later-positioned side for both
    (2026-08-31 vs 2026-08-26). No fact exists on the incoming side that HEAD does
    not also carry in a later form, so ours-wholesale is identical to the per-fact
    composition here. Nothing disjoint was discarded.

## Incoming changes preserved

Not a code file, but the STEP 3 redundant-vs-discarded check was run explicitly and
resolves to REDUNDANT, not discarded:

- The incoming commit's key change is the bundle lifecycle transition into
  `status: reconciling`. That exact state IS present on HEAD's own line of history
  for this file: `4b7f40157d`
  ("xgd(ticket): seed_local_overlay bundle bundle-b3b7c399", 2026-08-30T22:06 -0700)
  introduces the file on this branch already at `status: reconciling`
  (`updated_at: 2026-08-31T05:05:42Z`), and the ~90 subsequent `update bundle
  bundle-b3b7c399` commits carry BUNDLE-20 forward through its reconcile run to the
  terminal `free_and_reconciled` / `result: pass` recorded in HEAD.
- So the incoming transition reached HEAD by a different route and was then
  superseded by the completion of that same bundle's reconcile. Re-applying the
  incoming side would REGRESS a completed bundle from `free_and_reconciled` back to
  `reconciling` and drop `orphan_commits`, `merged_at_commit`, `completed_at` and
  `result`.
- No BUG-1301 precedence exception was invoked; no hunk was dropped on
  refactor grounds.

## Staging state

`git ls-files -u` is empty; `git status --porcelain` is clean; `git diff --cached
HEAD` is empty — this cherry-pick nets to no diff vs HEAD because the commit is
genuinely redundant (BUG-1109/BUG-1122). Per STEP 4 this is not a @fail and
`--skip` was NOT called; `CHERRY_PICK_HEAD` (`eb58654`) is left intact for
`cherry_pick_finalize_resolution`.
