---
uid: report-23c1e31b
id: REPORT-1662
type: report
title: 'Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
  (level=uat)'
created_by: xgd
created_at: '2026-08-07T23:46:43.235775+00:00'
updated_at: '2026-08-07T23:46:43.235775+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-2049c9ec
  level: uat
  violations: 2
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
# Level: uat

**Result**: FAIL
**Violations**: 2
**Warnings**: 2
**Needs review**: 0

CAP-71 (`capability-2049c9ec`) holds two stories with **16 ACs each** — STORY-84
(`story-8acc338d`, the fold) and STORY-86 (`story-24098299`, the 3-probe gate +
cross-gate reconciliation). All 32 are `kind: behavior`; AC-696 is
`regression_only: true`. Since the last uat cycle (REPORT-1320, 2026-08-05, 24 ACs)
eight ACs were added on 2026-08-06 — AC-812/813/814 and AC-852–AC-856.

**Working reference and its caveat.** At `uat` level the AC body is the working
reference. That holds for 29 of the 32 ACs. It does **not** hold for AC-691,
AC-731 and AC-736: the ac-level cycle ran earlier today (REPORT-1658 /
`report-f3b0654d` — 5 violations, 3 warnings) and closed without repair (no AC in
this tree has been touched since 2026-08-06), and it found AC-691 and AC-731 each
state as their criterion the exact behaviour a reconciled BUG was filed to remove.
For those three I escalated to intent + code rather than grading a test against a
body known to be stale; the outcome is recorded as info 1–3 below, **not** as UAT
violations, because their resolution category is `ac-edit`/`ac-add` and no uat
editor can act on them.

**Evidence executed.** All 32 matrix UATs were run this session:

```
npx vitest run tests/reconciliation-l1-fold.test.ts \
  tests/reconciliation-l1-fold-full-language.test.ts \
  tests/reconciliation-l1-fold-seams-and-refold.test.ts \
  tests/reconciliation-3probe-gate.test.ts \
  tests/reconciliation-3probe-gate-evaluator.test.ts \
  tests/reconciliation-cross-gate-reconciliation.test.ts
```

→ **6 files passed, 32 tests passed, 1.28s.** No test is skipped at the `it()`
level; one in-test branch skips (warning 1, re-verified this session).

**Coverage at a glance.** Every one of the 32 ACs has **exactly one**
`test_UAT_AC<n>_*` test, each driving a real entry point (`foldToL1`,
`cmdCapturePage`, `renderL1Document`, `validateL1`, `sampleFidelityProbe`,
`offSampleProbe`, `contentRobustnessProbe`, `evaluateLayout`, `promoteToFlow`,
`threeProbeGate`, `cmdL1Gate`, `cmdGate`, `referenceCoverage`, `formatGateReport`,
and `cli.run(argv)` for `refold` / `gate` / `adopt-values`). No AST-only or
structural-only test stands in for behaviour, and there is no `uat-add` gap. Both
violations are **consistency** failures — a UAT that does not exercise a named
clause of its own AC — and both are re-raises of REPORT-1320 that were never
repaired.

## Cumulative Intent Considered

Both stories carry `intent_uid: bundle-31e474b9` (BUNDLE-7, merged at `edeb1c2c`)
and `updated_by: bundle-ee56a66e` (BUNDLE-8, `merged_at_commit: f9a415a8`). The
per-intent decomposition is carried forward from REPORT-1658, which derived it this
morning from the bundle contents, each intent's scope statement and its code
attribution comments; it is restated only as far as the UAT layer needs it.

| Intent ID | Status | When | Asked / changed | Counts? | UAT cohort |
|---|---|---|---|---|---|
| REQ-79 | free_and_reconciled | BUNDLE-7, 2026-07-22 | Absolute-base L1 reproduction model | YES | AC-689/691 |
| REQ-83 | free_and_reconciled | BUNDLE-7, 2026-07-22 | capture→L1 fold, retained oracle, hint sidecar | YES | AC-689…AC-696 |
| REQ-86 | free_and_reconciled | BUNDLE-7, 2026-07-22 | End-to-end 3-probe gate | YES | AC-705…AC-710 |
| REQ-66 | free_and_reconciled | earlier | `adopt-values` — retired by the fold | YES (retired) | AC-696 |
| BUG-5 | free_and_reconciled | BUNDLE-8, 2026-07-29 | Occurrence-identity pairing + idempotence | YES | AC-705/AC-724 |
| BUG-6 | free_and_reconciled | BUNDLE-8, 2026-07-29 | Fold signals residuals, never drops | YES | AC-733 |
| BUG-7 / BUG-8 / BUG-9 | free_and_reconciled | BUNDLE-8, 2026-07-29 | Row tiling; half-open intervals; recursive promote | YES | AC-734/735/709 |
| REQ-90/91/92 | free_and_reconciled | BUNDLE-8, 2026-07-29 | Resource table, pixel-mover axes, full-language fold | YES | AC-689/729/730/732/737 |
| BUG-11 | free_and_reconciled | 2026-07-29 | Fold carries surfaceFill / surfaceGradient | YES | AC-730/731/736 |
| BUG-12 / BUG-13 | free_and_reconciled | 2026-08-05 | Font faces reach the table; CSS bg-images foldable | YES | AC-732/AC-812 |
| **BUG-14** | free_and_reconciled | 2026-08-05 | section-band → card → text; stop per-run boxing | YES | **see info 1** |
| **BUG-18** | free_and_reconciled | 2026-08-05 | Keyframe the numeric type axes per width | YES | **see info 2** |
| BUG-17 / BUG-19 / BUG-20 / BUG-21 | free_and_reconciled | 2026-08-05 | Padding; bar bands; chip self-surface; padded controls | YES | no AC yet (REPORT-1658 findings 4–5) |
| BUG-27 | free_and_reconciled | BUNDLE-11, 2026-08-06 | Backdrop edges are section edges | YES | AC-812 |
| REQ-94 | free_and_reconciled | BUNDLE-11, 2026-08-06 | Cross-gate reconciliation, floor, coverage, named causes | YES | AC-852…AC-856 |
| REQ-96 | free_and_reconciled | BUNDLE-11, 2026-08-06 | L1 `control` node; controls bind to module seams | YES | AC-733/AC-813 |
| REQ-88 | free_and_reconciled | 2026-08-05 | `1c repro` / `1c l1-gate` / `1c refold` | YES (partly) | AC-814/AC-737 |
| REQ-114 | free_and_reconciled | 2026-08-07 | L1 palette colour model | out of scope (CAP-70) | — |
| REQ-82/84/85, REQ-97–107; REQ-63, REQ-15/16/22/24 | free_and_reconciled | various | L1 schema/renderer/validator; capture & values-diff axes | out of scope (CAP-70 / CAP-63) | — |

## Alignment Ledger

### STORY-84 (fold) — 16 ACs

| AC | UAT | Intents | Outcome |
|---|---|---|---|
| AC-689 | `reconciliation-l1-fold.test.ts:207` | REQ-83, REQ-92 | **drift** — validated doc / ladder widths / root kind / explicit empty-ladder error proven; the capture is still text-only so the full-language clause is unexercised (**violation 2**, re-raise) |
| AC-690 | `…l1-fold.test.ts:233` | REQ-83 | aligned — oracle artifact present, widths equal the folded document's |
| AC-691 | `…l1-fold.test.ts:256` | REQ-79, REQ-92 | **drift** — keyframe widths / x / y / width / widest-sample typography proven; **both height clauses still unasserted** (**violation 1**, re-raise). Body itself stale vs BUG-18 (info 2) |
| AC-692 | `…l1-fold.test.ts:292` | REQ-83 | aligned — fluid → `interpolate`, reflow → `snap` |
| AC-693 | `…l1-fold.test.ts:319` | REQ-83 | aligned — bounded `fromPx` on the subrange node, `undefined` on the always-present node |
| AC-694 | `…l1-fold.test.ts:345` | REQ-83 | **weak** — four of six sidecar dimensions gated behind a chromium branch that still skips here (**warning 1**, re-raise) |
| AC-695 | `…l1-fold.test.ts:392` | REQ-83 | aligned — renders from the folded doc alone, no sidecar in scope |
| AC-696 | `…l1-fold.test.ts:413` | REQ-66 retirement | aligned — unknown-command + exit 1 + no surviving symbol + `adopt-gaps` carve-out |
| AC-729 | `…full-language.test.ts:83` | REQ-92 | aligned — src/alt/fallback, omitted-axis discipline, four-side pinning, visibility, render, src-less → residual |
| AC-730 | `…full-language.test.ts:209` | REQ-92, BUG-11 | aligned — full surface axes, single-axis divider proves omission, height-bearing track, CSS paints |
| AC-731 | `…full-language.test.ts:298` | BUG-11, **BUG-14** | **test right / AC stale** — the UAT asserts the shipped band+card model (1 `section-band-*`, 2 `card-*` for 5 runs); AC-731's body still specifies the retired per-run model (info 1) |
| AC-732 | `…full-language.test.ts:379` | REQ-90, REQ-92, BUG-12 | aligned — five treatments fold + render, transform/mask deliberately absent, re-fold identity, painted-only font table |
| AC-733 | `…full-language.test.ts:497` | BUG-6, REQ-96 | aligned — five typed residuals with kind/reason/axes/widths; updated for REQ-96 (a geometry-bearing control now binds, only the geometry-less one is a residual); no raw `<input>`; opt-in channel |
| AC-812 | `…seams-and-refold.test.ts:101` | BUG-13, BUG-27 | aligned with a gap — image handle + fill + four-side track, ordering ahead of the headline (asserted in the leaf list **and** the rendered HTML), band clamp proven by counterfactual, page base from measured evidence; the "after the section-background boxes it is a peer of" half of the layering clause is unasserted (**warning 2**) |
| AC-813 | `…seams-and-refold.test.ts:229` | REQ-96, REQ-93 | aligned — one seam per form at the union rect (incl. submit) at all six widths, three `control` leaves, per-width rebase checked **against the retained oracle**, field heights preserved, submit inline-vs-stacked reproduced |
| AC-814 | `…seams-and-refold.test.ts:498` | REQ-88 | aligned — real `cli.run(['refold'])`, `fetch` spy proves offline, sha256 fingerprint of every bundle file proves only `l1.json`/`forms.json` are rewritten, re-fold ≡ fresh fold, ladderless bundle rejected with the re-capture message and no artifacts written |

### STORY-86 (gate + cross-gate) — 16 ACs

| AC | UAT | Intents | Outcome |
|---|---|---|---|
| AC-705 | `…3probe-gate.test.ts:299` | REQ-86, BUG-5, REQ-96 | aligned — clean base, residual with dx/dy/dw at the last width, unmatched, repeated-text occurrence pairing, kind-keyed non-text pairing, measured-scope exclusion |
| AC-706 | `…3probe-gate.test.ts:448` | REQ-86, BUG-9 | aligned — pass at 500/900, `narrowOracle` degradation at 500 only, multi-region overlay holds |
| AC-707 | `…3probe-gate.test.ts:481` | REQ-86, BUG-9 | aligned — pinned base fails, flowed passes, multi-region collisions span >2 children then clear |
| AC-708 | `…3probe-gate.test.ts:524` | REQ-86 | aligned — both non-vacuity arms, fidelity on base, sub-reports carried |
| AC-709 | `…3probe-gate.test.ts:551` | BUG-9 | aligned — own-path single region, three nested paths, per-region gaps, zero pinned descendants, validity, byte-identical base fidelity, roomy page unpromoted |
| AC-710 | `…3probe-gate.test.ts:636` | REQ-86 | aligned **to its (text-only) AC body** — residual names run/width/deltas; overlap and clip findings name kind/detail/paths. Pinned-box overflow uncovered because no AC states it (info 3) |
| AC-724 | `…3probe-gate.test.ts:673` | BUG-5 | aligned — double-evaluation identity at every ladder width, 3 uncollapsed runs, per-occurrence x/y within 2px |
| AC-734 | `…gate-evaluator.test.ts:114` | BUG-7 | aligned — main-axis tiling at ascending x, row height = tallest child, fixed-width mix, genuine clip, stack and grid |
| AC-735 | `…gate-evaluator.test.ts:303` | BUG-8 | aligned — keyframe at the breakpoint, `snap` precondition, post-reflow boxes at exactly 768, closed-bound counterfactual, ladder ends |
| AC-736 | `…gate-evaluator.test.ts:382` | BUG-11, BUG-14 | aligned to code — finding-signature equality vs the surface-free fold across 8 widths × 2 scales, `sawGenuineOverlap` guard, surface clip, slot exclusion. AC wording is broader than the code's fold-synthesized-only rule (info 4) |
| AC-737 | `…gate-evaluator.test.ts:591` | REQ-92, REQ-86 | aligned — three channels distinct, per-residual kind/reason/axes/widths, human-readable line, JSON form, passing gate still reports residuals |
| AC-852 | `…cross-gate-reconciliation.test.ts:250` | REQ-94 | aligned — all four signals in one report + verdict/diagnosis/nextStep, `neverDriver` proves browser-free ordering on both the happy path and the manifest-less refusal, artifacts written, CLI exit 0/1 |
| AC-853 | `…cross-gate.test.ts:343` | REQ-94 | aligned — mean-only breach with l1Pass=true and zero deltas, pct-only breach (mean within floor), floor echoed in report and formatted output for both within/over, per-run tightening flips a pass to a fail, non-numeric `--mean-floor` refused naming the flag |
| AC-854 | `…cross-gate.test.ts:425` | REQ-94, BUG-27 | aligned — 9/2 media counts + unreferenced paths + finding + truncation, 4900px/2 sections density finding, clean bundle still reports every count, coverage finding alone does not fail, and the "measured once at the widest resting projection on the primary engine" clause proven by a three-way narrow/wide/wrong-engine fixture |
| AC-855 | `…cross-gate.test.ts:557` | REQ-94 | aligned — all five named causes exercised with distinct verdicts **and** distinct next steps (`size === 5` on both), plus the coverage-before-deltas precedence case |
| AC-856 | `…cross-gate.test.ts:659` | REQ-94 | aligned — passing verdict with non-zero deltas via API and CLI (exit 0), deltas read out as evidence, manifest-less and empty-manifest bundles both hard-error naming the bundle and instructing re-capture |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-691 (`acceptance_criterion-304cae4c`) / `test_UAT_AC691_each_node_carries_keyframe_per_width_matching_box` | uat-edit | AC-691's criterion turns on a **height** distinction — "A box, image or backing-surface leaf additionally pins its height at every keyframe … a text leaf's keyframes carry no height, leaving its height natural from flow" — and its Verification names both halves ("and no keyframe carries a height"; "For a folded image leaf and a folded box leaf, assert every keyframe carries a height"). The UAT (`tests/reconciliation-l1-fold.test.ts:256-290`) asserts keyframe widths, x/y/width and widest-sample `fontSizePx`, and makes **no height assertion at all** (`:280-288`). Keyframe-height assertions exist elsewhere only on image/box leaves (`…full-language.test.ts:163,272,358`, under AC-729/730/731), so the **text-leaf "no height" invariant has zero executable evidence anywhere in the repo**. The distinction is live in code (`tools/generate/src/l1/fold.ts`, `buildGeometry(withHeight)`) and is load-bearing downstream: AC-707's content-robustness probe grows text runs, which is only meaningful because text height is natural rather than pinned — if a regression started pinning text heights, all 32 UATs in this capability would still pass. **Re-raise: filed as REPORT-1320 violation 1 on 2026-08-05 and never repaired** (`tests/reconciliation-l1-fold.test.ts` last changed at `f0367940d`, 2026-07-22). | In `test_UAT_AC691`, assert `kfs.every((k) => k.height === undefined)` for the `Headline` text leaf, and extend the same fixture with one media element and one painted panel, asserting each of their keyframes carries `height` equal to the captured box height |
| 2 | violation | consistency | AC-689 (`acceptance_criterion-7785b92a`) / `test_UAT_AC689_capture_emits_one_validated_l1_document` | uat-edit | AC-689 states the document "is emitted in the **full** L1 language, not text alone: it may carry text leaves, image leaves, box leaves and backing-surface leaves", and its Verification asks to "Fold a capture containing runs, media and painted panels and assert the document contains leaves of more than one kind". The UAT (`tests/reconciliation-l1-fold.test.ts:207-231`) drives `cmdCapturePage` with `FakeDriver`, whose signals (`:103-133`) carry exactly **one** text run, `items: []`, `fields: []` and `images: []` — so the folded document has exactly one leaf kind and the clause REQ-92/BUNDLE-8 added to this AC is never exercised. The four assertions present cover only the REQ-83-era criterion (artifact exists, validates, `widths` = ladder, root kind, explicit empty-ladder throw). Nearest coverage is `…full-language.test.ts:330` (`new Set(kinds).size > 1`), but that is AC-731's UAT and runs on `foldToL1` directly, **not** the capture path AC-689 governs. **Re-raise: filed as REPORT-1320 violation 2 on 2026-08-05 and never repaired.** | Add a media element and a painted panel to `signalsFor()`, then assert the `l1.json` read back from the bundle carries leaves of more than one kind (e.g. `new Set(children.map((n) => n.kind)).size > 1`) |
| 3 | warning | consistency | AC-694 (`acceptance_criterion-c8dd43d2`) / `test_UAT_AC694_capture_emits_advisory_structural_hint_sidecar` | uat-edit | AC-694 enumerates six sidecar dimensions (ancestry, parent computed layout, authored sizing unit, position mode, sibling-repetition count, ascending `@media` breakpoints). The substantive assertions — parent layout mode, `justify-content`, real percent unit, real breakpoint 600 — sit behind `if (!(await chromiumAvailable())) return` (`tests/reconciliation-l1-fold.test.ts:364`). **Re-verified skipped on this runner this session**: `playwright.chromium.launch()` fails with `Executable doesn't exist at …/chromium_headless_shell-1228/…` while the cache holds `chromium_headless_shell-1234`; the UAT completes in 192ms with only the pre-branch assertions running. On the always-run path the two remaining assertions (`:358` breakpoints ascending, `:359` some node `widthUnit === 'percent'`) are satisfied by the test's own `CANNED_HINTS` (`:135-153`), so they prove the sidecar round-trips to disk, not that extraction computes those values. Ancestry (`parentId`), position mode and `repeatCount` are asserted on **neither** path, and `CANNED_HINTS.parentLayout` is `null`. **Re-raise of REPORT-1320 warning 3.** | Move the *contract* assertions (per-node `parentId`, `position`, `repeatCount`, and a non-null `parentLayout` — which needs `CANNED_HINTS` enriched) onto the canned-driver path so they always run, leaving only extraction *accuracy* engine-gated. Do **not** repair by deleting the skip: chromium genuinely cannot launch here |
| 4 | warning | consistency | AC-812 (`acceptance_criterion-fd94d9ab`) / `test_UAT_AC812_backdrop_folds_behind_content_bounds_bands_and_feeds_the_page_base` | uat-edit | AC-812's layering clause has two halves — the backdrop is placed "behind the text runs of the band it sits under, **and after the section-background boxes it is a peer of**". The UAT proves the first half twice over (`…seams-and-refold.test.ts:144-153`: leaf index before the first text leaf, and `id=` before `Nested Hero` in the rendered HTML) but asserts **nothing** about the backdrop's position relative to the band/section-bg boxes, even though the same fixture materialises those peers (`heroBands`, `:160-163`). The rule is live in code (`fold.ts:2195`, `children: [...bandNodes, ...sectionBgNodes, ...backdropNodes, ...cardNodes, ...body, ...slotNodes]`) and load-bearing: absolutely-positioned siblings with no z-index paint in source order, so a backdrop emitted *before* its band would have the band's opaque fill paint over the hero photograph — the mirror image of the defect the asserted half guards against. | Add one assertion to `test_UAT_AC812`: `expect(leaves.indexOf(backdrop)).toBeGreaterThan(Math.max(...heroBands.map((b) => leaves.indexOf(b))))` — the fixture already produces both node sets |
| 5 | info | consistency | AC-731 (`acceptance_criterion-6a5e0eec`) / `test_UAT_AC731_…` | — | The UAT was updated for BUG-14 (`38280dace`, 2026-08-05) and now asserts the shipped model: three band runs coalesce into **one** `section-band-*` box and the two surface-differing runs fold **two** `card-*` boxes — three boxes for five runs (`…full-language.test.ts:333-351`), with an in-test comment naming BUG-14. AC-731's body still specifies the retired per-run model ("Every run whose composited surface differs … folds an additional backing box leaf carrying that fill/gradient and **the run's geometry**"), and its Verification clause "runs on that fill emit no backing box" is unasserted and **not assertable as worded** — the band runs do produce a (shared, full-bleed) band box. The test is right against code; the AC is stale. Resolution is `ac-edit`, filed today as REPORT-1658 finding 3 and unrepaired. | none at this level; a `uat-edit` follows once AC-731 is rewritten |
| 6 | info | consistency | AC-691 / BUG-18 | — | Separate from finding 1: AC-691's closing sentence ("A node's authored typography axes are taken from its widest present sample") is the behaviour BUG-18 (free_and_reconciled, 2026-08-05) was filed to remove. `responsiveTextTracks()` (`fold.ts:611-639`, `RESPONSIVE_TEXT_AXES` at `:605-610`) now emits a per-width keyframe track for `fontSizePx`/`lineHeightPx`/`letterSpacingPx` whenever the axis varies across the ladder. The AC-691 fixture varies `fontSizePx` (24/32/44 at 320/768/1280), so the folded leaf **does** carry such a track — and the UAT asserts only `axes.fontSizePx === 44` (`…l1-fold.test.ts:288`), which still holds because the widest keyframe equals the scalar. The UAT is therefore consistent with its (stale) AC while silent on BUG-18's shipped behaviour. Resolution is `ac-edit`, filed today as REPORT-1658 finding 2 and unrepaired. | none at this level; a `uat-edit` adding the track assertion follows the AC rewrite |
| 7 | info | coverage | pinned-box content overflow | — | The evaluator raises **three** envelope violations (`probes.ts:409-416` and its docstring at `:429-433`): sibling overlap, horizontal clip beyond the viewport, and pinned-box content overflow. `test_UAT_AC710` exercises only overlap (`…3probe-gate.test.ts:654-660`) and the viewport-edge clip (`:664-670`), because **no AC states the third**. This is the finding first filed as REPORT-1319 finding 1 (2026-08-05) and re-filed as REPORT-1658 finding 1 today — it has now survived two ac-level cycles unrepaired. The repair is `ac-add` at ac level; a UAT written now would trace to no matrix element. | none at this level; a `uat-add` follows once the AC lands |
| 8 | info | consistency | AC-736 (`acceptance_criterion-76d9ee68`) | — | AC-736 excludes "a painted surface leaf — a childless box carrying a card/panel/section fill" from the sibling-overlap check. The code is narrower: only **fold-synthesized** surfaces are excluded (`isSynthesizedSurfaceId` — `section-band-*` / `section-bg-*` / `card-*`), while a captured standalone `box-*` still participates. `test_UAT_AC736` asserts the code's narrower rule and passes. Recorded so the AC editor knows the UAT will need no change once AC-736 is tightened. Cascades from REPORT-1658 finding 10. | none |
| 9 | info | coverage | AC-852 slug-driven path | — | AC-852's sentence "Given a slug, the graded artifacts are the same ones the three commands produce by hand (`--source draft\|published`, `--size mobile\|tablet\|desktop`)" is not exercised — that path requires a headless browser, which cannot launch on this runner (finding 3). AC-852's own **Verification** asks only for the offline `--actual-image`/`--actual-manifest` mode, which the UAT drives fully (including the CLI form and both exit codes). Not a gap against the AC as written. | none |
| 10 | info | exclusivity | AC-733 + AC-813; AC-731 + AC-812; AC-705 + AC-724; AC-707 + AC-709 | — | Checked for duplication at uat level. AC-733's UAT and AC-813's UAT both fold a geometry-bearing form control, but assert disjoint things — "binding is not dropping" (empty `field` residuals, one slot, control names) vs the seam union rect, the per-width origin rebase against the oracle, preserved field heights and the submit's inline-vs-stacked reproduction. AC-731's and AC-812's UATs both touch page-base inference, but from dominant-run-fill and from a captured backdrop respectively. AC-705/AC-724 share the `repeatedTextOracle` fixture and AC-707/AC-709 share `multiRegionOracle`, in each case asserting probe verdict vs. determinism/recovery. **No duplicates.** | none |
| 11 | info | — | AC-812, AC-813, AC-814, AC-852–AC-856 | — | REPORT-1658 finding 12 flagged that these eight ACs carry no `uat_coverage` field (the other 24 carry `pass`) and pointed the uat cycle at them. Resolved: all eight have a substantive UAT and all eight pass (`tests/reconciliation-l1-fold-seams-and-refold.test.ts`, `tests/reconciliation-cross-gate-reconciliation.test.ts`, both authored 2026-08-05). The absent field is matrix bookkeeping, not a coverage gap. STORY-84's `uat_coverage: needs_review` and CAP-71's `uat_coverage: fail` are explained by findings 1–2, not by these eight. | none |

## Notes for the Editor

**Both violations are the same shape, both are cheap, and both are second
offences.** Each is a UAT that proves its AC's REQ-83-era clauses but not the
clause a later BUNDLE-8 intent (REQ-92) added — AC-691's height split and AC-689's
full-language emission. They were filed on 2026-08-05 as REPORT-1320 violations 1
and 2; `tests/reconciliation-l1-fold.test.ts` has not been touched since
2026-07-22 (`f0367940d`), so no repair was attempted. Both live in that one file
and can land in a single edit: AC-691 needs one `toBeUndefined`-style assertion
plus a media/panel element in the existing fixture; AC-689 needs `signalsFor()` to
carry a media element and a painted panel.

**Finding 1 is the more important of the two.** The image/box half of AC-691's
height rule is at least proven elsewhere in the suite (AC-729/730/731 UATs); the
text-leaf half is proven nowhere in the repo. That invariant is what makes AC-707's
content-robustness probe meaningful.

**Do not repair finding 3 by deleting the skip.** Chromium cannot launch on this
runner — playwright resolves build 1228 while the cache holds 1234, verified again
this session. Move the contract assertions onto the canned-driver path and leave
only extraction accuracy engine-gated.

**Findings 5, 6, 7 and 8 are deliberately not filed as UAT work.** All four are
ac-level repairs already filed in REPORT-1658 (findings 3, 2, 1, 10) and left
unrepaired when that cycle closed today. Authoring or editing UATs for them now
would either encode a fixed bug (AC-691's widest-sample sentence, AC-731's per-run
model) or trace to no matrix element (pinned-box overflow). Findings 6 and 7 in
particular each carry a follow-on `uat-edit`/`uat-add` that becomes actionable the
moment the AC lands — the next uat cycle should expect them.

**What the eight new ACs did well, for reference.** The 2026-08-05 UAT-generation
pass (`38280dace`, `774ca60d1`) is the strongest evidence in this capability:
AC-813 checks the rebase against the retained oracle rather than restating numbers
in the test; AC-814 fingerprints every file in the bundle by sha256 to prove the
"rewrites only what the fold derived" clause instead of spot-checking two paths;
AC-852/856 assert browser-free ordering with a driver factory that throws; AC-855
asserts `size === 5` over both the verdict set and the next-step set rather than
checking each string in isolation. Findings 1, 2 and 4 are all repairable to that
same standard.

**Verification performed.** Every claim above was checked in this worktree
(`regression-5096fbee`): all 32 UATs executed (6 files, 32 passed, 1.28s);
per-test timings taken with `--reporter=verbose` to confirm AC-694's branch skips;
`playwright.chromium.launch()` invoked directly from `tools/generate` to confirm
the 1228-vs-1234 build mismatch; `fold.ts:605-639` (`responsiveTextTracks`),
`fold.ts:2195` (child ordering) and `probes.ts:409-433` read directly; and
`git log` used on each of the six test files to establish which UATs have and have
not moved since REPORT-1320.
