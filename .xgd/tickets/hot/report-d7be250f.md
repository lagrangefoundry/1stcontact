---
uid: report-d7be250f
id: REPORT-2124
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-18'
created_by: xgd
created_at: '2026-08-16T21:40:33.351040+00:00'
updated_at: '2026-08-16T21:40:33.351040+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-18
---

## Files resolved

- `tests/reconciliation-beyond-l1-authoring.test.ts` — class **UU**, code/test
  file → rule **2c** (UU on implementation/code files; incoming authoritative).
  Single conflict hunk at line 1106. Resolved by rule 2c.3.a: HEAD's version is a
  strict superset of the incoming change in the conflicted region, so the region
  was taken whole from HEAD after confirming it already contains the incoming
  commit's edits.

  Detail: both sides made the *same* REQ-137 palette change
  (`primary: { value: '#0f3f52' }` plus the `palette.ink` assertion). Git merged
  that portion cleanly two lines above the conflict. The hunk conflicted only
  because HEAD *additionally* rewrote the adjacent asset assertions. Taking the
  incoming side of the hunk verbatim would have produced assertions that
  contradict the merged test body, which now calls `write_image ... replace: true`
  (line 1079) and the CLI with `--force` (line 1001) — after which the stored
  bytes are `REDRAWN`, not `MARK`.

  No test function was deleted from either side (rule 2f respected): both sides'
  `test_UAT_AC*` functions are present in the resolved file.

## Incoming changes preserved

Verified exhaustively, not by spot check. Every non-blank line added by the
incoming commit `b7eb44708` in this file was extracted from the stage-1 → stage-3
diff and matched against the staged resolution:

- incoming added lines (non-blank, unique): **30**
- added lines absent from the resolution: **0**

Key incoming changes confirmed present:

1. `PALETTE` reshaped — named `steps` deleted, split into `surface`,
   `surface-raised`, `surface-sunken` (lines 113–114, 177–178).
2. The typography merge-depth block — `typographyBefore` / `typographyAfter` /
   `baseSizePx: 19` (lines 182–186). This was **new** in the incoming commit
   (not in the merge base), and it survives intact.
3. `accent: { value: 'cornflower' }` with `steps` removed (line 258).
4. `primary: { value: '#0f3f52' }` at all four sites (lines 172, 1051, 1092, 1104).

No `steps` references remain anywhere in the file except the explanatory comment
at line 107 that records why REQ-137 deleted them.

## Net effect

The staged blob is `cc50d5fc`, byte-identical to stage 2, and `git diff --cached HEAD`
is empty. This is the redundant-commit case (BUG-1109/BUG-1122): HEAD
(`d0a569a3e`, `feat(palette): shade on the reference replaces named steps
[FREE-CODED]`) already landed REQ-137's effect through a different route. The
incoming changes are **present in HEAD, not absent** — redundant, not discarded,
which is precisely the distinction STEP 3 exists to draw. Per STEP 4 the tree is
staged and left for `cherry_pick_finalize_resolution` to skip the commit; no
`--skip`/`--continue`/`--abort` was issued, and `CHERRY_PICK_HEAD` is intact.

## Note for post-merge review

The auto-enrichment flagged this file for post-merge review ("Intent unknown on
one or both sides"). The flag can be cleared: both sides are the same REQ-137
work, and the exhaustive line check above confirms no developer code was lost.

## Verification limitation (not a resolution defect)

The suite cannot be validly executed from this worktree, so the resolution is
verified by the line-level check above rather than by a green run here.
`tests/reconciliation-beyond-l1-authoring.test.ts` reports 11/15 failures in this
worktree but passes 15/15 in the main checkout. Cause is environmental and
pre-existing: the shared `@lagrangefoundry/*` packages are installed at
`/Users/martin/lagrangefoundry/node_modules/`, a parent of the main checkout but
not of `/Users/martin/.xgd/worktrees/...`, so Node's upward resolution never
reaches them. `vitest.config.ts` anticipates exactly this and builds aliases via
`webuiPackageDir`, but that helper uses `require.resolve`, which fails the same
way from an out-of-tree worktree — so no alias is produced. The config comment
says the suites then "report their skip", but this suite carries no
`WEBUI_INSTALLED` guard, so it hard-fails instead of skipping. Worth a separate
ticket: a missing out-of-band install currently presents as 11 red tests rather
than a skip, which will mislead any future reconcile run in a worktree.
