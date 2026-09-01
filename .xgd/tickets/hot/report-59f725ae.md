---
uid: report-59f725ae
id: REPORT-3195
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T02:56:14.666189+00:00'
updated_at: '2026-09-01T02:56:14.666189+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — UU, intent/bookkeeping ticket (rule 2e).
  Incoming: `04957574a5` "xgd(ticket): update bug bug-a98fb3b0" (2026-08-24
  15:19:51 -0700), 8 insertions / 3 deletions. Its merge base (`:1:` =
  `4ca0044cc4`) is exactly the previous attempt's incoming blob, confirming a
  sequential replay of the working-branch ticket history.
  Ours: `cbdfed2e2d` "xgd(ticket): seed_local_overlay bug bug-a98fb3b0"
  (2026-08-31 07:24:25 -0700) — the bundle branch's seeded final state,
  byte-identical to the HEAD blob (verified: empty `git diff :2: HEAD:<path>`).

  What the incoming commit does vs its base: advances `status: free_coding ->
  free_coded`, bumps `updated_at`, and ADDS `fields.commits` (working_sha
  `63df97c93542321a3d57d21e2e31a763ed3e4411`, reconcile_sha/main_sha null) and
  `fields.version: 0.2.14`.

  `git diff :2: :3:` shows the only remaining differences between the two sides:
    - `status`: ours `bundled` vs theirs `free_coded`
    - `updated_at`: ours 2026-08-26T17:36:27 vs theirs 2026-08-24T22:19:50
    - ours additionally carries `story_points: 2` and `bundled_in:
      bundle-78f4e2fe`

  Note what is NOT in that diff: the `commits` block and `version: 0.2.14` this
  commit introduces are already present, identically, on the ours side — so the
  commit's actual additions are fully carried by HEAD. Ours is a superset on
  every fact except `status`/`updated_at`.

  On that one genuinely-conflicting fact, 2e's per-fact rule selects ours: later
  by commit timestamp (2026-08-31 vs 2026-08-24 — also the enrichment block's
  own stated fallback, "take the more recent commit by timestamp"), later by
  ticket lifecycle position (free_coded precedes bundled), and ours carries the
  bundling metadata of THIS reconcile run (`bundled_in: bundle-78f4e2fe`).
  Regressing `status` to `free_coded` and dropping `bundled_in`/`story_points`
  would corrupt the bundle state currently being reconciled.

  Resolved with `git checkout --ours`, staged with `git add --sparse` (path is
  outside the sparse-checkout cone, DOC-986 §2/§4.1). Working-tree markers at
  lines 9/14/19 and 31/34/35 are gone (0 remaining).

## Incoming changes preserved

- `.xgd/tickets/hot/bug-a98fb3b0.md`: both substantive additions from
  `04957574a5` are PRESENT in the resolved file — `commits[0].working_sha:
  63df97c93542321a3d57d21e2e31a763ed3e4411` (line 20) and `version: 0.2.14`
  (line 23), confirmed by grep on the resolved working-tree file. The incoming
  `status: free_coded` is not present *as such* because HEAD has advanced that
  same field further along the same lifecycle to `bundled` (line 12) — a
  superseded fact, not a discarded one.

No BUG-1301 precedence exception was invoked; no hunk was dropped.

## Flagged for post-merge review

Per the enrichment block's "flag this file for post-merge review". As with the
two prior attempts the divergence is benign: ours is the seeded post-bundling
state of the same ticket this commit authored, not a competing edit.

## Net-diff note (BUG-1109/BUG-1122)

Nets to no diff vs HEAD. Per STEP 4 this is the redundant-commit case, NOT the
discarded-changes case: STEP 3's check passes because the incoming commit's key
changes (`commits`, `version`) are present in HEAD rather than absent. `--skip`
was not called; the sequencer state (`CHERRY_PICK_HEAD` =
`04957574a547c7ac4869d772bce7c42a5807c40a`) is intact for
`cherry_pick_finalize_resolution`.

Third consecutive commit in this bundle to net redundant against the same seeded
ticket (`1c5985f87d` -> REPORT-3193, `82518d6099` -> REPORT-3194, now
`04957574a5`). Expected: the bundle branch seeded bug-a98fb3b0's final state, so
every working-branch update that built up to that state replays as redundant.
