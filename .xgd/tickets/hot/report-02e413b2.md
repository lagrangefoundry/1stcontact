---
uid: report-02e413b2
id: REPORT-2393
type: report
title: Fix 1c Capture & Diff Fidelity (uat) — attempt 9
created_by: xgd
created_at: '2026-08-20T06:41:50.299376+00:00'
updated_at: '2026-08-20T06:41:50.299376+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-aa030c83
  level: uat
  fixes_applied: 21
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-2485c83c
---

# Fix Summary — 1c Capture & Diff Fidelity (uat)

**Attempt**: 9
**Fixes applied this call**: 21
**Violations remaining**: 0
**Needs more work**: false

V1 is closed at both halves the report specified, and W1 with it — they were the same
file and the same root cause, fixed in the same edit. Both halves of the new AC-815
evidence are **red-checked against reverted production code**, not merely observed
green. No production code was changed (`git diff tools/ packages/ src/` is empty).

The report's diagnosis was correct and its two suggested shapes were exactly right.
Its one factual error is recorded below: `bug27` was **not** the sole survivor of the
vacuous-wrapper anti-pattern.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-edit | `tests/bug27-nested-backdrop-capture.test.ts:80` | Replaced the vacuous `itA` wrapper with `it.runIf(browserOk)`; `browserOk` hoisted to module scope. The 6 Part-A tests now **skip honestly** where no Chromium exists instead of reporting PASS while asserting nothing (V1a) |
| 2 | uat-edit | `tests/bug27-nested-backdrop-capture.test.ts:65` | Moved the `if (!browserOk) return` guard **above** `serveDir(FIXTURES)`. The file no longer hard-fails on `listen EPERM`: it ran in **1.6s** instead of timing out at 180000ms (W1) |
| 3 | uat-add | AC-815 `acceptance_criterion-9ccc1de8` | Authored Part A′ — **5 headless UATs** driving the real `EXTRACT_SCRIPT` over jsdom with layout stubbed per class (the `req72:56-67` harness). All 5 pass; both halves red-checked (see below) |
| 4 | ac-edit | AC-815 `acceptance_criterion-9ccc1de8` | Added an `**Evidence gating.**` paragraph recording the headless/browser split and the red-check, mirroring the shape the report commended on AC-1307. Criterion and Verification preserved verbatim |
| 5 | field | AC-815 | `uat_coverage` `fail` → `pass` |
| 6 | uat-edit | `tests/req36-capture-settle.test.ts:78` | **Second instance of the same anti-pattern**, comment verbatim identical. Replaced with `it.runIf(browserOk)` + hook guard. Its 2 headless Part-A tests still run; its 2 browser tests now skip honestly |
| 7 | uat-edit | `tests/req47-fidelity-structural.test.ts:320` | **Third instance**, again verbatim identical. Same fix. 11 headless tests still pass; 3 browser tests now skip honestly |
| 8–14 | uat-edit | `req52`, `req59`, `req62`, `req88`, `capture`, `bug24`, `req72`, `req58-wrapper`, `req35`, `req31` | Guarded every remaining `serveDir`-before-`browserOk` hook in `tests/`. Gating in these was already honest (`it.runIf`); only the hard-fail hazard was latent. The class is now closed — **no `beforeAll` in `tests/` binds a socket before probing the browser** |
| 15–19 | field | AC-631, AC-639, AC-643, AC-657, AC-720 | Stale `uat_coverage: fail` → `pass` (report I3). **Independently re-verified**, not taken from the report: all five run under `--reporter=verbose`, plain `it`, no gating, 18/18 passed |

## Red-check evidence for the new AC-815 UATs

A passing test proves nothing until it is shown to fail on the behaviour it guards.
Both halves of AC-815 were reverted in `extract.ts` and the suite re-run:

| Mutation to `paintedExtent` | Result |
|---|---|
| Return the element's **own box** (pre-BUG-27 behaviour) | `…_collapsed_band_is_boxed_at_its_painted_subtree` ✗ and `…_collapsed_band_subtree_reaches_the_manifest` ✗ |
| Return the **unclamped union** (drop the canvas clamp) | `…_clipped_overflow_does_not_widen_a_band_past_the_document` ✗ and `…_offscreen_block_yields_no_band_and_inflates_none` ✗ |

`extract.ts` was restored from backup after each; `git diff --stat` on it is empty.
The fifth test (`…_a_conventional_band_box_is_unchanged`) is an over-correction guard
and passes under both mutations by design.

## Verification run

All 13 touched files: **85 passed, 41 skipped, 0 failures, 2.67s**.
`tsc --noEmit` clean for `tests/`. `bug27` alone: 12 passed, 6 skipped, 1.58s —
previously a 180s hook timeout and a FAILED suite.

## Code Edits

None. Only `tests/*.test.ts` changed; `git diff --stat -- tools/ packages/ src/` is empty.

## Correction to the validation report

`report-b99892f3` V1 states that after attempt 7 "every other gated file in this
capability now uses `it.runIf` — `bug27` is the sole survivor." That is **not
correct**. Two further files carried the identical wrapper, with the same
`// Chromium unavailable — skip silently` comment verbatim:

- `tests/req36-capture-settle.test.ts:78-82` (2 vacuous tests)
- `tests/req47-fidelity-structural.test.ts:320-324` (3 vacuous tests)

Both are now fixed. Neither carries an `AC<N>`-linked test — their tests are
`test_UAT_FC_REQ-36_*` / `test_UAT_FC_REQ-47_*` — which is plausibly why an
AC-name-index sweep did not reach them, and is the same blind spot in a different
coordinate: **the sweep enumerated ACs, so evidence indexed by REQ was outside its
frame entirely.** The report's own closing advice (reconcile files-executed against
files-carrying-ACs) would not have caught these either, since they carry no ACs.
A gating-shape grep over all of `tests/` — `grep -rn 'skip silently\|if (!capture) return'` —
is the check that finds them, and it now returns nothing.

## needs_review Items Forwarded

None. W2 (AC-1307, browser-gated oklch case) was explicitly a no-action finding: the
gating there is honest, headless siblings carry real assertions, and the AC already
documents the caveat. It needs a Chromium-provisioned runner, not a matrix or test
edit — as does the residual browser-gated tier the report names (the Part-A halves of
AC-816/1314/1316, and now the newly-honest skips in `req36`/`req47`, whose count of
never-executed tests this call increased from 6 to 11 by making previously-vacuous
passes visible as skips). That increase is a reporting correction, not a regression:
those 5 tests never asserted anything on this runner.
