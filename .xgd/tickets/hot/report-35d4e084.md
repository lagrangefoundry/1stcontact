---
uid: report-35d4e084
id: REPORT-3196
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T02:57:27.009247+00:00'
updated_at: '2026-09-01T02:57:27.009247+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — UU, intent/bookkeeping ticket (rule 2e).
  Incoming: `2c208ef37d` "xgd(ticket): update bug bug-a98fb3b0" (2026-08-24
  15:19:54 -0700), 3 insertions / 2 deletions. Merge base (`:1:` =
  `1e195c5928`) is exactly the previous attempt's incoming blob — sequential
  replay of the working-branch ticket history continues.
  Ours: `cbdfed2e2d` "xgd(ticket): seed_local_overlay bug bug-a98fb3b0"
  (2026-08-31 07:24:25 -0700), byte-identical to the HEAD blob (verified: empty
  `git diff :2: HEAD:<path>`).

  What the incoming commit does vs its base: ADDS `fields.story_points: 2`, and
  as bookkeeping sets `last_field_updated: status -> story_points` and bumps
  `updated_at`. Nothing else.

  `git diff :2: :3:` shows the only differences between the two sides:
    - `status`: ours `bundled` vs theirs `free_coded`
    - `last_field_updated`: ours `status` vs theirs `story_points`
    - `updated_at`: ours 2026-08-26T17:36:27 vs theirs 2026-08-24T22:19:54
    - ours additionally carries `bundled_in: bundle-78f4e2fe`

  `story_points: 2` — this commit's sole substantive addition — appears as
  unchanged CONTEXT in that diff, i.e. it is already present identically on the
  ours side. Ours is a superset on every fact except the three bookkeeping
  fields above.

  On those, 2e's per-fact rule selects ours: later by commit timestamp
  (2026-08-31 vs 2026-08-24 — also the enrichment block's stated fallback,
  "take the more recent commit by timestamp"), later by ticket lifecycle
  position (free_coded precedes bundled), and ours carries this reconcile run's
  own `bundled_in: bundle-78f4e2fe`. `last_field_updated` is a derived field
  naming whichever field was last written; ours reads `status`, consistent with
  ours' own later `status -> bundled` write, so keeping ours leaves the
  frontmatter internally coherent. Regressing `status` to `free_coded` and
  dropping `bundled_in` would corrupt the bundle state being reconciled.

  Resolved with `git checkout --ours`, staged with `git add --sparse` (path is
  outside the sparse-checkout cone, DOC-986 §2/§4.1). Working-tree markers at
  lines 9/14/19 and 32/34/35 are gone (0 remaining).

## Incoming changes preserved

- `.xgd/tickets/hot/bug-a98fb3b0.md`: the incoming commit's substantive
  addition, `fields.story_points: 2`, is PRESENT in the resolved file at line
  24 (confirmed by grep on the resolved working-tree file). Its
  `status: free_coded` and `last_field_updated: story_points` are not present
  *as such* because HEAD advanced both fields further along the same lifecycle
  (`status: bundled` line 12, `last_field_updated: status` line 11) —
  superseded facts, not discarded ones.

No BUG-1301 precedence exception was invoked; no hunk was dropped.

## Flagged for post-merge review

Per the enrichment block's "flag this file for post-merge review". As with the
three prior attempts the divergence is benign: ours is the seeded
post-bundling state of the same ticket this commit authored, not a competing
edit.

## Net-diff note (BUG-1109/BUG-1122)

Nets to no diff vs HEAD. Per STEP 4 this is the redundant-commit case, NOT the
discarded-changes case: STEP 3's check passes because the incoming commit's key
change (`story_points: 2`) is present in HEAD rather than absent. `--skip` was
not called; the sequencer state (`CHERRY_PICK_HEAD` =
`2c208ef37d63b2214dc1177872eb471d22d019ca`) is intact for
`cherry_pick_finalize_resolution`.

Fourth consecutive commit in this bundle to net redundant against the same
seeded ticket (`1c5985f87d` -> REPORT-3193, `82518d6099` -> REPORT-3194,
`04957574a5` -> REPORT-3195, now `2c208ef37d`). Expected given the bundle
branch seeded bug-a98fb3b0's final state, but note the cost: each such commit
consumes a full resolver invocation to reach a foregone conclusion. Worth a
look from whoever owns the seed_local_overlay-vs-replay interaction; out of
scope for this step.
