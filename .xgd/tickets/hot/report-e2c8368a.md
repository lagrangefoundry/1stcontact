---
uid: report-e2c8368a
id: REPORT-3608
type: report
title: Fix 1c Capture & Diff Fidelity (uat) — attempt 7 (cont.)
created_by: xgd
created_at: '2026-09-10T00:35:39.389485+00:00'
updated_at: '2026-09-10T00:35:39.389485+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-aa030c83
  level: uat
  fixes_applied: 5
  progress_made: true
  needs_more_work: true
  violations_remaining: 2
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — 1c Capture & Diff Fidelity (uat)

**Attempt**: 7 (cont. — second call at level=uat)
**Fixes applied this call**: 5
**Violations remaining**: 2
**Needs more work**: true

This call took the two findings the previous call left as achievable and
browser-free: **finding 7** (AC-631's missing capture leg) and the first slice of
**finding 10** (the 13 `pending` ACs with no AC-named test). Both are closed with
mutation evidence. The two remaining violations (findings 3 and 4) are unchanged
and are blocked on an operator decision or on a runner with Chromium — see below.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-add | AC-631 (finding 7, warning) | New file `tests/reconciliation-capture-surface-fill.test.ts` — 3 tests driving the real `EXTRACT_SCRIPT` under jsdom, in the shape of AC-711's capture leg: `test_UAT_AC631_capture_records_the_composited_surface_not_the_declared_fill`, `…_same_effective_surface_is_captured_alike_from_different_declarations`, `…_an_opaque_card_hides_the_band_behind_it` |
| 2 | uat-add | AC-1609 (finding 10, warning) | New file `tests/reconciliation-values-diff-spacing-axes.test.ts` — 4 tests driving the real `diffManifests`: row-pair naming, `--tolerant` widening 6px→16px, non-stacked rows contributing no gap, side-by-side cards grouped as one row |
| 3 | uat-add | AC-1610 (finding 10, warning) | Same file — 2 tests: differing band padding with agreeing gaps raises no delta at all; identical band padding with a shifted row reports the `gap` axis and no padding axis |
| 4 | field-update | AC-631 | `uat_coverage`: `fail` → `pass` |
| 5 | field-update | AC-1609, AC-1610 | `uat_coverage`: `missing` → `pass` |

## Mutation Evidence

As in the previous call, each closed finding was proven by breaking the production
line it guards, re-running, and reverting. **Production code is unmodified** —
`git status` shows only the two new test files.

| Mutant | Result |
|---|---|
| `extract.ts` `surfaceFillOf` — `break` after the first painted fill instead of compositing until opaque (verbatim the pre-REQ-58 bug) | The new AC-631 capture leg went red with `expected '#ffffff' not to be '#ffffff'` — the historical symptom exactly. The existing compare-leg test `test_UAT_AC631_surface_fill_is_composited_alpha_colour` **stayed green**, confirming finding 7's diagnosis that it owns only half the AC |
| `values-diff.ts` `gapTol = tol(opts.gapTolerancePx, 6, 16)` → `(…, 6, 6)` so `--tolerant` no longer widens | **30 tests passed, 1 failed.** All 25 FC siblings in `req63-values-diff-coverage.test.ts` stayed green; only the new AC-1609 tolerant leg caught it — the direct demonstration that these tests add coverage the free-coded evidence does not have |

## Design Note — how the jsdom capture leg was made faithful

AC-631's capture leg initially reported the *band* colour rather than the card's
composite. The cause is worth recording: `surfaceChain` orders candidate surfaces
**tightest-first by area** (`values-diff`'s `SURFACE_INDEX.sort` on
`extract.ts:608`), and AC-711's harness stubs one identical
`getBoundingClientRect` for every element. With equal areas the sort ties, document
order wins, and the opaque `<section>` short-circuits the walk before the card is
reached. The harness here therefore gives each element a real box via a
`data-box="x,y,w,h"` attribute, which is what a real browser's layout supplies. Any
future jsdom capture test touching a surface axis needs the same.

## Verification

```
Test Files  10 passed (10)
     Tests  71 passed | 11 skipped (82)
```

Across both new files plus every adjacent suite: `req63-values-diff-coverage`,
`reconcile-values-diff-fidelity`, `reconciliation-capture-list-marker`,
`req58-wrapper-treatments`, and the four files edited in the previous call. No
regressions. The 11 skips are browser-gated (no Chromium in this environment).

## Finding 10 — remaining work, and one AC-body discrepancy found

11 of the 13 `pending` ACs still carry no `test_UAT_AC<n>_*`:

| AC | Sibling to build from |
|---|---|
| AC-1605 | `tests/bug25-multiline-run-geometry.test.ts:102-182` |
| AC-1606 | `tests/bug22-split-control-surface.test.ts:109-171` |
| AC-1607 | `tests/bug16-webfont-load-before-extract.test.ts:94-186` |
| AC-1608 | `tests/bug24-scrim-alpha.test.ts:82-202` |
| AC-1613 | `tests/req58-multi-viewport.test.ts:78-273` |
| AC-1614 / AC-1615 / AC-1616 | `tests/req63-values-diff-coverage.test.ts` (`:289`/`:306`, `:385`, `:329`/`:361`) |
| AC-1611, AC-1612, AC-1617 | No sibling under any name — author from the Verification directly |

**Discrepancy found while authoring AC-1610 (candidate `ac-edit`, not applied — I
am at level=uat).** AC-1610's Verification ends "…assert **exactly one delta** is
reported, on the `gap` axis." That is not satisfiable as written: shifting a row so
the measured gap differs also moves that element absolutely, which fires an
independent `position` delta (repair class B). Verified empirically — the diff
returns `[{position, 'Body copy'}, {gap, 'Heading → Body copy'}]`.

AC-1610's **Criterion** speaks only about band padding versus the gap axis, and is
fully satisfiable; that is what the test asserts, with the discrepancy documented
inline at the assertion. Suggested repair at the next ac-level pass: change the
Verification's last sentence to "assert the vertical-spacing signal reported is the
`gap` axis, and that no band-padding delta is emitted on any section". No behaviour
change is implied — only the AC's wording overreaches.

## Findings Not Addressed This Call

| Finding | Element | Status |
|---|---|---|
| 3 (**violation**) | AC-720 | Unchanged — forwarded again below. Needs an operator decision between a browser-gated e2e leg (blocked here) and an `ac-edit` dropping the end-to-end clause |
| 4 (**violation**) | AC-815 | Unchanged — fixture and assertions were authored last call but cannot be executed without Chromium. Now correctly reports SKIPPED rather than falsely green |

## Code Edits

None. Both mutation experiments were reverted; `git status` shows only
`tests/reconciliation-capture-surface-fill.test.ts` and
`tests/reconciliation-values-diff-spacing-axes.test.ts` as new, and no modified
files.

## needs_review Items Forwarded

| Element | Assessor said | Operator decision needed |
|---|---|---|
| AC-720 (finding 3) | "Either (a) add a browser-gated end-to-end leg … or (b) if judged genuinely un-automatable, **ac-edit** AC-720 to drop the end-to-end clause" | Which branch? (a) is blocked in this environment. Sixth consecutive filing. If the aligned-crops browser+sharp pipeline is expected to stay manually verified, (b) is the honest repair and I can apply it next iteration — but removing an assertion from an AC is a scope call I should not make unilaterally |
| AC-815 (finding 4) | "Extend `bug27-nested-backdrop.html` with (i) an `overflow: hidden` carousel … and (ii) a conventionally laid-out band" | Authored, but unexecutable here. Can this loop run on a host with Chromium? Otherwise AC-815 will keep failing uat validation regardless of what is written |
| AC-1610 | — (found by this step, not the assessor) | Verification sentence overreaches its own Criterion (see above). Needs an `ac-edit` at the next ac-level pass; not actionable at level=uat |
