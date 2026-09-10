---
uid: report-cd423fe9
id: REPORT-3750
type: report
title: 'Fix L1 Reproduction Pipeline: Fold & Acceptance Gate (uat) — attempt 8'
created_by: xgd
created_at: '2026-09-10T15:20:14.510049+00:00'
updated_at: '2026-09-10T15:20:14.510049+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-2049c9ec
  level: uat
  fixes_applied: 9
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — L1 Reproduction Pipeline: Fold & Acceptance Gate (uat)

**Attempt**: 8 (see *Attempt numbering* below)
**Fixes applied this call**: 9
**Violations remaining**: 0
**Needs more work**: false

This call closed **the five remaining violations and all four warnings**. Every
finding in REPORT-3748 (`report-7f31793a`) — violations 1-10 and warnings 11-14 —
is now addressed across the two calls.

## Attempt numbering

The invocation prompt read "You are at attempt 7" on **both** this call and the
previous one, but the previous call filed REPORT-3749 (`report-4dffa7f4`) under
attempt 7 and its five mutations are committed (`0c91039eaf`, verified present in
the worktree at the start of this call). This is therefore the eighth attempt and
is titled as such; the fields below are what the loop reads.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-add | AC-1625 (`acceptance_criterion-ee8ba69f`) | `test_UAT_AC1625_varying_axis_folds_to_a_track_and_a_constant_one_stays_scalar` — **violation 2** |
| 2 | uat-add | AC-1626 (`acceptance_criterion-1e5570ac`) | `test_UAT_AC1626_per_side_padding_folds_and_insets_within_the_pinned_box` — **violation 3** |
| 3 | uat-add | AC-1627 (`acceptance_criterion-96ccb3ce`) | `test_UAT_AC1627_height_probe_yields_a_measured_response_and_is_never_a_keyframe` — **violation 4** |
| 4 | uat-add | AC-1628 (`acceptance_criterion-3bce83ba`) | `test_UAT_AC1628_bundle_materializes_as_a_servable_site_with_localized_assets` — **violation 5** |
| 5 | uat-add | AC-1631 (`acceptance_criterion-12581128`) | `test_UAT_AC1631_nowrap_threshold_is_the_ladders_single_line_suffix` — **violation 7** |
| 6 | uat-edit | AC-694 (`acceptance_criterion-c8dd43d2`) | Enriched `CANNED_HINTS`; moved all six sidecar dimensions onto the always-run path — **warning 11**, a fifth-time re-raise |
| 7 | uat-edit | AC-812 (`acceptance_criterion-fd94d9ab`) | Asserted the backdrop's **peer** half of the layering rule — **warning 12**, a fourth-time re-raise |
| 8 | uat-edit | AC-729 (`acceptance_criterion-39597704`) | Painted framing + adjustment + finishing on ONE image fixture; extended the closed `toEqual` — **warning 13** |
| 9 | uat-edit | AC-729 / AC-733 | Deleted the src-less residual tail that duplicated `test_UAT_AC733` — **warning 14** |

Two new files carry items 1-5:
`tests/reconciliation-l1-fold-responsive-axes.test.ts` (AC-1625, AC-1626,
AC-1627, AC-1631 — the BUG-17 / BUG-18 / REQ-88 span) and
`tests/reconciliation-l1-bundle-materialization.test.ts` (AC-1628). Both follow
the capability's existing one-file-per-span convention and its one-UAT-per-AC
rule; the symbol map was re-checked at declaration level and **every one of the
eleven ACs touched across both calls has exactly one `it('test_UAT_AC<n>_…')`**.

### 1 — AC-1625, the responsive track (violation 2)

One fixture, two runs. The varying run moves **all three** numeric type axes
(`fontSizePx`, `lineHeightPx`, `letterSpacingPx`) and its left/right padding while
top/bottom hold — so a single element carries a varying and a constant side, which
is the pair the AC exists to separate. For each type axis: one keyframe per sampled
width equal to that width's captured value, `segments` **undefined** (so the default
is `interpolate`), and the widest keyframe `toBe` the leaf's scalar. The constant
run carries `responsive === undefined` **and** `responsivePadding === undefined`
while its scalars stay intact — "no track", not "no axis".

The render half closes on negative space: the base rule carries 28px and
`padding-left: 12px`, and `expect(base).not.toMatch(/font-size: 72px/)` — if the
track were dropped and the scalar replayed everywhere, the desktop value would sit
in the base rule. A `mediaBlock()` helper slices each breakpoint's own block so an
assertion cannot drift into a neighbouring one, and the padding step is asserted to
land on **its** rung (1024), not the type axis's.

### 2 — AC-1626, padding insets rather than inflates (violation 3)

Four elements: an asymmetric four-side badge, a padding-free run, an all-zero-sided
run, and a padded **image** (the AC names text, image and box leaves, so this proves
the axis is not text-only). The load-bearing assertion is the one the BUG-17 tests
do not make: **the geometry keyframes are unchanged by the fold of the padding** —
every keyframe's x/y/width still equals the captured border box at that width, so
the 28px of horizontal pad was not added to the extent. The render half asserts
`box-sizing: border-box` plus all four longhands, and that the badge's declared
width is still the captured border-box width.

### 3 — AC-1627, the height probe (violation 4)

A `min-h-screen` hero with content below it, a card below the fold, and a hero
title above it, folded with and without a 1280×1000 probe. Asserts the measured
`heightFactor`/`yFactor`; **a node unaffected by viewport height carrying no
response** (the hero title); `partitionProbes` keeping the ladder at six widths;
and — swept over *every* folded node — no duplicate keyframe width, every `at` on
the ladder, and `kf.atHeight` equal to that rung's captured height, which is what
makes `base + factor * (100vh - base)` reduce to the captured pixels at capture
size. The reconstructed **card** surface is asserted to carry the *same* response
object as the row it was reconstructed from, with a follow-up
`?.yFactor === 1` so the equality cannot be two `undefined`s.

The no-probe half is the strong form the AC asks for: not just "responses absent"
but `stripResponses(noProbe)` **deep-equal** `stripResponses(withProbe)` — the
probe contributed the height axis and nothing else.

### 4 — AC-1628, bundle → servable site (violation 5)

Drives the real `cmdRepro` over bundles written to a temp dir. Beyond node-count
parity it asserts the exact "copied verbatim" claim: the written page's `l1`
deep-equals the bundle's document with **only** the three media handles rebound,
so every keyframe, id, axis and width survives. The localized count is checked to
equal the number of `/assets/…` handles actually in the written document (three) —
not the bundle's five assets nor its four images — and the written JSON contains
neither the captured origin nor `fonts.gstatic.com`. Idempotence is a full
recursive **directory snapshot** compared across two runs, not a spot check.

All four rejection paths are covered: the unmirrored handle (naming `hero.png` and
the `1c capture page` fix), the missing `l1.json`, and **both** directions of the
seam/binding disagreement (a slot with no binding, and a `forms.json` binding a
slot the document lacks). The failed import is asserted to leave the previously
written good draft byte-for-byte intact — a discriminating negative rather than an
`existsSync` on a path that turned out to be wrong (see *Corrections* below).

### 5 — AC-1631, the nowrap suffix (violation 7)

Four folds through one `nowrapFrom()` helper. Single-line everywhere → **320**, the
narrowest rung. The suffix case is the one the FC tests shape differently: single
line at 320/375 **and** 1280/1440 but wrapping at 768 and 1024 → **1280**, the rung
above the widest wrapping one, with an explicit `not.toBe(320)`. The clause no FC
test closes: the **widest** sample alone has no `renderedTextBox` while every
narrower one reads as a clean single line → **no axis**, document still valid.
Plus wraps-everywhere → no axis, and a closing assertion that three runs on one
page resolve to three *different* thresholds — the "width, not a flag" claim.

Per the report's info 18 this test asserts the fold's derivation and carrying only;
it does not touch the renderer's wrapping floor, which is CAP-70 / STORY-83's
`reconciliation-nowrap-width-floor.test.ts`.

### 6 — AC-694, the sidecar contract (warning 11, fifth re-raise)

`CANNED_HINTS` had a single parentless node, so three of the six dimensions
(`parentId`, `position`, `repeatCount`) appeared only inside a literal and never in
an `expect`, and both dimensions the Verification names sat behind
`if (!(await chromiumAvailable())) return`. It now describes a flex `<section>`
with two repeated percentage-sized children, and all six dimensions are asserted on
the **always-run** path: ancestry (root `parentId: null`, every child's parent
present in the sidecar), non-null `parentLayout` with `justifyContent`, both sizing
axes, three distinct `position` values, `repeatCount >= 1` everywhere and `> 1`
somewhere, and a non-empty breakpoint list so the ascending check is not vacuous.

**The skip was not deleted**, as the finding instructed. The engine-gated branch is
retained and re-labelled: it proves extraction *accuracy* against real computed
styles; the contract above proves the shape without a browser.

### 7 — AC-812, the peer half (warning 12, fourth re-raise)

One rule, two assertions, on node sets the fixture already built: the backdrop's
leaf index is `toBeGreaterThan` the max index of the hero bands, and the same order
is asserted in the rendered HTML, where it is what actually paints. Absolutely-
positioned siblings with no z-index paint in source order, so a backdrop emitted
before its band would have the band's opaque fill paint over the hero photograph —
the mirror image of the defect the already-asserted half guards.

### 8 and 9 — AC-729 (warnings 13, 14)

The `hero-media` fixture now paints `objectPosition: '30% 70%'` and
`filter: 'saturate(0.6)'` alongside the six finishing axes, and the closed
`toEqual` was extended with `objectPosition: { xPct: 30, yPct: 70 }` and
`filter: { saturate: 0.6 }`. This is now the only fixture in the repo where one
image element paints all three families, which is what makes the closed assertion
prove AC-729's **union** claim rather than three separately-proven halves. The bare
`logo` gained the negative form (`not.toHaveProperty` for both).

The src-less residual tail was deleted, leaving that behaviour to
`test_UAT_AC733`, and replaced with a comment recording the boundary AC-729's own
body draws. The test's header comment was rewritten so the AC-1133/AC-1134
delegation and the union claim are both stated.

## Verification

All nine AC-traced files for this capability were executed in this worktree:

```
npm test -- tests/reconciliation-l1-fold.test.ts \
  tests/reconciliation-l1-fold-full-language.test.ts \
  tests/reconciliation-l1-fold-framing-and-adjustment.test.ts \
  tests/reconciliation-l1-fold-seams-and-refold.test.ts \
  tests/reconciliation-l1-fold-responsive-axes.test.ts \
  tests/reconciliation-l1-bundle-materialization.test.ts \
  tests/reconciliation-3probe-gate.test.ts \
  tests/reconciliation-3probe-gate-evaluator.test.ts \
  tests/reconciliation-cross-gate-reconciliation.test.ts
```

**9 files, 41 tests, all passing** (1.28s) — 34 at the assessor's run, 36 after
attempt 7, 41 now.

The five free-coded suites named as adjacent evidence were **also run**, which the
assessor's method boundary explicitly did not do: `bug18-responsive-text-axes`,
`bug17-fold-padding`, `bug23-repro-local-assets`, `bug24-scrim-alpha`,
`req88-viewport-relative-and-nowrap` — **45 passed, 1 skipped**. The skip is
`test_UAT_FC_BUG-17_fold_gigabytealchemy_badge_padding`, gated on a gitignored
capture artifact (`storage/references/`), and is pre-existing. No consolidation
regressed its source.

## Corrections made during this call

One assertion I wrote was **vacuous on the first pass and was fixed before
landing**: AC-1628's "nothing was written" check pointed at
`<cwd>/sites/<slug>/draft`, but `cmdRepro` writes under
`<cwd>/storage/<root>/<slug>/draft` (`tools/generate/src/store/paths.ts:35`), so
the `existsSync` was trivially false. It was replaced with a check that the
already-written good draft is byte-for-byte unchanged after the failed import —
which is both discriminating and a stronger claim. Recording it because a
silently-passing negative is exactly the class of defect this level exists to catch.

AC-1628 was also initially authored as two `it` blocks sharing the `AC1628`
prefix; they were merged into one before landing, to keep the one-UAT-per-AC
symbol map the assessor checks (info 15).

## Code Edits (if any)

None, across either call. Every mutation in attempts 7 and 8 is a test edit; no
production source was touched.

## Field Updates

**`uat_coverage` was again NOT set on any AC.** Same reasoning as attempt 7: the
field is owned by `check_uat_coverage` / `fix_uat_coverage`, and setting it here
would be the fix loop asserting a verdict the assessor is about to compute from
the tests themselves. Eleven ACs in this capability now have passing AC-traced
UATs; the coverage verdict should follow from them. Flagged for the operator in
case this workflow expects the field to be written by this prompt.

No AC's `status` was moved off `pending` either — every finding across both calls
was categorised `uat-add` / `uat-edit`, so a status flip is out of scope for a
uat-level repair (REPORT-3747: `pending` is authorship state, not retirement).

## Remaining Work

**None that this level can act on.** All 10 violations and all 4 warnings from
`report-7f31793a` are closed:

| Finding | Element | Closed by |
|---|---|---|
| v1 | AC-1630 | attempt 7 |
| v2, v3, v4, v5, v7 | AC-1625, AC-1626, AC-1627, AC-1628, AC-1631 | this call |
| v6 | AC-1629 | attempt 7 |
| v8, v9 | AC-691, AC-689 | attempt 7 |
| v10 | AC-710 | attempt 7 |
| w11, w12, w13, w14 | AC-694, AC-812, AC-729, AC-729/AC-733 | this call |

The report's info 17 also resolves as a side effect: AC-706 and AC-707 delegated
their third-envelope-violation clause to AC-1630, and AC-1630's UAT (attempt 7)
asserts the violation surfaces through **both** the off-sample and
content-robustness probes, which is what those two delegations were waiting on.

`needs_more_work: false`. The assessor should re-run the uat-level check.

## needs_review Items Forwarded

None. Every finding across both calls had an unambiguous resolution category and
an unambiguous AC body to grade against.
