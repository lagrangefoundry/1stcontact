---
uid: report-cfdefdbb
id: REPORT-1065
type: report
title: 'Resync resolve conflicts: f5f29fb9f01dfd222dd5a744af7374b1e371be99'
created_by: xgd
created_at: '2026-07-29T06:57:29.318101+00:00'
updated_at: '2026-07-29T06:57:29.318101+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-510318c4
---

Cherry-pick 60df91bbf — "feat(l1): responsive layout track + wrapping rows on container [FREE-CODED]".

## Files resolved

- `tools/generate/src/l1/probes.ts` — class **UU**, rule **2c (code file, incoming authoritative)**.
  The only conflict in the pick; the other 9 files applied cleanly.

  The conflict was **comment-only**. The incoming code change at that
  hunk (`responsiveLayout: undefined` in `rebuilt`) merged cleanly on
  both sides — git flagged only the adjacent comment block, where each
  side documents a different, non-overlapping fact:

  - OURS (HEAD, `feat(l1): let a text run declare its own measure`):
    why a recovered node is forced to `stack` — only vertical stacking
    is unconditionally overlap- and clip-free under growth.
  - THEIRS (60df91bbf, REQ-104): why the per-width layout track must be
    dropped alongside it — the track owns the mode at render time, so a
    leftover one would re-row the region the probe just flowed.

  Per 2c step 1 ("non-overlapping changes: keep BOTH"), both were kept,
  with the REQ-104 note rephrased as a continuation ("that forcing has
  to take any per-width layout track with it") so the block reads as one
  argument rather than two stacked headers. No incoming statement was
  dropped or weakened. Nothing was mutually exclusive, so the
  incoming-wins tiebreak was never reached.

  Note on the enrichment hint ("take the more recent commit by
  timestamp"): taking either side wholesale would have discarded a true
  and load-bearing rationale. Since the two comments are complementary
  rather than competing, 2c's keep-both rule governs. No post-merge
  review is needed for this file — see the verification below.

## Incoming changes preserved

Verified by extracting `60df91bbf:tools/generate/src/l1/probes.ts` and
diffing it against the resolved file. All six incoming REQ-104 hunks
are present:

- `resolveLayoutMode` added to the `@1stcontact/site-schema` import.
- `packRowLines()` — the greedy wrapping-row line packer.
- `resolveLayoutMode(node, width) === 'row'` — per-width mode resolution
  replacing the static `node.layout` read.
- `const wrapping = row && ... node.wrap === true`.
- `packRowLines(widths, box.width, gap, opts.epsilonPx)` in the row
  layout branch.
- `responsiveLayout: undefined` in `rebuilt` (the conflicted hunk).

The diff-vs-incoming shows only HEAD-side content that the pick
predates and must not be discarded: the `isSynthesizedSurfaceId` import
and the three BUG-14 synthesized-backing-surface exclusions (overlap
filter, fidelity queue skip, and the `'unknown'` comment). Both sides'
work is therefore intact.

## Verification

- `pnpm -r build` clean; `tsc --noEmit` on `tools/generate` exits 0.
  This mattered: the pick adds `resolveLayoutMode` to site-schema and
  consumes it from tools/generate, so a stale `dist` would have given a
  misleading result.
- `tests/req104-responsive-layout.test.ts` + `tests/req100-scroll-reveal.test.ts`
  (the pick's own tests): 19 passed.
- 8 probes-adjacent suites (bug9-region-aware-promote, bug7-row-layout,
  bug8-reflow-breakpoint, req82-l1-substrate, req107-authored-l1-envelope,
  reconciliation-l1-substrate, + the two above): 53 passed.

## Pre-existing failures — NOT caused by this pick

Two tests fail on this branch both before and after the pick:

- `reconciliation-3probe-gate.test.ts` > `test_UAT_AC705_sample_fidelity_matches_oracle_within_tolerance`
  (an extra `'slot'` leaf kind)
- `reconciliation-3probe-gate-evaluator.test.ts` > `test_UAT_AC737_gate_reports_fold_residuals_as_their_own_channel`
  (expects a `'field'` leaf kind that the evaluator no longer yields)

Both are REQ-96 leaf-kind rename fallout (`field` -> `slot`/`control`);
the pick's `probes.ts` diff touches no leaf-kind code at all.

Confirmed rather than assumed: the working tree was reverted to the
pre-pick contents (staged index preserved), both suites re-run, and the
failures were byte-identical — same tests, same assertions. The tree was
then restored from the index (`git checkout-index -f -a`), and the
working tree now matches the index exactly. These are a separate fix,
outside the resync scope.

Method note for whoever picks that up: proving this via a detached
worktree at HEAD with symlinked `node_modules` does NOT work here — the
symlinks resolve back into the main worktree and break Astro's
compile-metadata cache before any test runs. The in-place swap is the
reliable approach.

## Staging state

All 10 files staged; no UU/AA/DU/UD lines remain; net change vs HEAD is
non-empty (10 files, +1428 / -1693). `CHERRY_PICK_HEAD` (60df91bbf) is
intact — no `--continue` / `--skip` / `--quit` / `--abort` was run.
