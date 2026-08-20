---
uid: report-420214de
id: REPORT-2447
type: report
title: 'Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
  (level=uat)'
created_by: xgd
created_at: '2026-08-20T13:29:32.550506+00:00'
updated_at: '2026-08-20T13:29:32.550506+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-2049c9ec
  level: uat
  violations: 14
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
# Level: uat

**Result**: FAIL
**Violations**: 14
**Warnings**: 1
**Needs review**: 0

Anchor report: report-2485c83c · Capability: capability-2049c9ec (CAP-71)
Stories: STORY-84 (story-8acc338d), STORY-86 (story-24098299) — both `story_kind: upgrade`
Active ACs: 42 · ACs with a `test_UAT_AC<n>_*` UAT: 34 · without: 8

**Test execution evidence**: all seven AC-named suites were run in this session —
`npm test -- tests/reconciliation-l1-fold.test.ts tests/reconciliation-l1-fold-full-language.test.ts
tests/reconciliation-l1-fold-framing-and-adjustment.test.ts tests/reconciliation-l1-fold-seams-and-refold.test.ts
tests/reconciliation-3probe-gate.test.ts tests/reconciliation-3probe-gate-evaluator.test.ts
tests/reconciliation-cross-gate-reconciliation.test.ts` → **7 files / 34 tests, all passing.**
Every one drives a real entry point (`foldToL1`, `renderL1Document`, `validateL1`, `cmdGate`,
`cmdL1Gate`, `cli.run`) over real components; the only mock is a browser driver at the external
engine boundary. No structural/AST-only checks. Substantiveness of the 34 is not in question —
the findings below are about *what those tests leave unasserted*, and about the 8 ACs with no
test at all.

## Cumulative Intent Considered

At `uat` level the AC bodies are the working reference (the `ac` level passed at
2026-08-20 13:19, report-34a49913, 0 violations). Intent was consulted only to date the
capability's widenings and to locate where each unevidenced clause is already proven.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (bundle-31e474b9) — REQ-63/79/82/83/84 +2 | free_and_reconciled | merged @ edeb1c2c | Originating intent for both stories: capture → fold → render → gate | YES |
| BUNDLE-11 (bundle-ee56a66e) — BUG-27/REQ-94/96/97/98 +10 | free_and_reconciled | merged @ f9a415a8 | Widened STORY-86: cross-gate verdict, control composition | YES |
| REQ-136 (request-8a132869) | free_and_reconciled | merged @ a23c4c51 | Widened STORY-84: image framing + colour adjustment (AC-1133/1134) | YES |
| REQ-88 (free-coded) | reconciled into main | — | nowrap threshold, viewport-height probe, content column, column anchor, padding track, surface attribution, form labelling | YES |
| REQ-96 (free-coded) | reconciled into main | — | control composition; a captured control binds to its module seam, not the residual channel | YES |
| BUG-13/14/17/18/23/24 (free-coded) | reconciled into main | — | section background, surface hierarchy, fold padding, responsive text axes, repro local assets, scrim alpha | YES |

No retired or abandoned intent bears on this capability's UAT layer; nothing in the
34 passing tests asserts behaviour that intent has withdrawn.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-689 → `test_UAT_AC689_capture_emits_one_validated_l1_document` | BUNDLE-7 | aligned (minor: "more than one leaf kind" clause unasserted — warning 1) |
| AC-690, AC-692..696 → their UATs | BUNDLE-7 | aligned |
| AC-691 → `test_UAT_AC691_each_node_carries_keyframe_per_width_matching_box` | BUNDLE-7, BUG-18 | **gap**: BUG-18's per-width type track and the text-keyframe-height rule unasserted |
| AC-705, AC-708, AC-709, AC-724 → their UATs | BUNDLE-7 | aligned |
| AC-706 → `test_UAT_AC706_off_sample_envelope_holds_at_unsampled_widths` | BUNDLE-7 | **gap**: pinned-container overrun clause unasserted |
| AC-707 → `test_UAT_AC707_content_robustness_under_grown_content` | BUNDLE-7 | **gap**: pinned-container clip clause unasserted |
| AC-710 → `test_UAT_AC710_probe_findings_are_diagnostic` | BUNDLE-7 | **gap**: pinned-box content-overflow finding unasserted |
| AC-729, AC-730, AC-732, AC-733 → their UATs | BUNDLE-7, REQ-96 | aligned (AC-732's re-fold idempotence and font-table clauses both asserted) |
| AC-731 → `test_UAT_AC731_dominant_run_fill_becomes_band_and_differing_surfaces_back_their_runs` | BUNDLE-7, BUG-14, REQ-88 | **gap**: adopted-rect / band-guard / accent-bearer / grouping-identity clauses unasserted |
| AC-734, AC-735, AC-737 → their UATs | BUNDLE-7, REQ-96 | aligned (AC-735's closed-upper-bound guard and AC-737's REQ-96 control clause both asserted) |
| AC-736 → `test_UAT_AC736_backing_surface_is_not_an_overlap_but_still_clips` | BUG-14 | **gap**: the discriminating half (captured `box-*` surfaces DO overlap) unasserted |
| AC-812, AC-813, AC-814 → their UATs | BUNDLE-7 | aligned |
| AC-852..856 → their UATs | BUNDLE-11 (REQ-94) | aligned |
| AC-1133, AC-1134 → their UATs | REQ-136 | aligned |
| AC-1345..AC-1352 (8 ACs, created 2026-08-20 12:47–12:53) | REQ-88, BUG-17, BUG-23, BUG-24 | **gap**: zero AC-named UATs; behaviour implemented and proven only by `test_UAT_FC_*` |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-1345 (acceptance_criterion-4d1802d9) | uat-add | No `test_UAT_AC1345_*` exists. Behaviour (section background box on image **or** scrim, each axis from the widest width carrying *it*) is implemented — `tools/generate/src/l1/fold.ts` (`scrim`), `packages/framework/src/l1/render.ts` — and proven only by free-coded UATs `test_UAT_FC_BUG-24_hero_scrim_folds_onto_the_section_background_box`, `…_scrim_without_a_background_image_still_folds`, `…_a_section_with_neither_image_nor_scrim_folds_no_box`, `…_scrim_over_image_renders_as_a_translucent_layer_above_it` in `tests/bug24-scrim-alpha.test.ts` | Author `test_UAT_AC1345_*` covering the AC's Verification paragraph; re-home or mirror the four BUG-24 FC assertions rather than writing new fixtures |
| 2 | violation | coverage | AC-1346 (acceptance_criterion-2f46402b) | uat-add | No `test_UAT_AC1346_*` exists. Per-side padding axis + per-width track is implemented (`packages/site-schema/src/l1/schema.ts:668-671` `topPx/rightPx/bottomPx/leftPx` scalar tracks; `packages/site-schema/src/l1/validate.ts`) and proven only by `tests/bug17-fold-padding.test.ts` (7 FC UATs) plus `test_UAT_FC_REQ-88_padding_that_varies_across_the_ladder_gets_a_track` | Author `test_UAT_AC1346_*`: four sides equal captured values, all-zero emits no axis, varying side earns a per-width track, render insets content within the pinned box |
| 3 | violation | coverage | AC-1347 (acceptance_criterion-0e12e8aa) | uat-add | No `test_UAT_AC1347_*` exists. The no-wrap threshold is implemented (`nowrapFromPx` in `packages/site-schema/src/l1/schema.ts`, `tools/generate/src/l1/fold.ts`, `packages/framework/src/l1/render.ts`) and proven only by `test_UAT_FC_REQ-88_single_line_runs_fold_unbreakable_and_render_nowrap`, `…_the_pin_starts_only_where_every_wider_sample_is_single_line`, `…_a_run_that_wraps_at_any_captured_width_stays_breakable`, `…_an_unmeasurable_line_count_is_not_read_as_one_line` (`tests/req88-viewport-relative-and-nowrap.test.ts`) and `tests/req88-nowrap-x-browser.test.ts` | Author `test_UAT_AC1347_*` covering threshold-equals-middle-rung, the suffix rule, no-threshold-when-always-wrapping, unmeasurable-breaks-the-suffix, and the below-threshold render |
| 4 | violation | coverage | AC-1348 (acceptance_criterion-ca0d19f1) | uat-add | No `test_UAT_AC1348_*` exists. Seam behavioural-config derivation (field list, label, label placement from a11y name source, type, endpoint, submit copy) is proven only by `tests/req88-form-labelling-and-submit.test.ts` (7 FC UATs incl. `…_a_placeholder_named_control_folds_to_placeholder_labelling`, `…_the_real_capture_derives_placeholder_labels_and_both_submit_buttons`) | Author `test_UAT_AC1348_*` walking the AC's six-item enumeration plus the honest-default / derivation-gap clause |
| 5 | violation | coverage | AC-1349 (acceptance_criterion-2ffbebad) | uat-add | No `test_UAT_AC1349_*` exists. `1c repro <slug> --ref <bundle>` materialization is implemented (`tools/generate/src/cli/repro.ts` `cmdRepro`, registered in `tools/generate/src/cli/index.ts`) and proven only by `tests/bug23-repro-local-assets.test.ts` (6 FC UATs incl. `…_unmirrored_handle_fails_the_import_rather_than_hotlinking`, `…_unreferenced_mirrored_assets_are_reported_as_a_fold_gap`) and `tests/req86-e2e-repro.test.ts` | Author `test_UAT_AC1349_*`: seams mounted by name, definition validated before disk, every handle localized, unmirrored handle fails the run, unreferenced-mirrored reported as the opposite channel |
| 6 | violation | coverage | AC-1350 (acceptance_criterion-2d1d275c) | uat-add | No `test_UAT_AC1350_*` exists. Content-column recovery is implemented (`columnFit` / `columnOrigin` / `columnExtent` in `tools/generate/src/l1/fold.ts`; `columnOriginCss` / `columnExtentCss` in `packages/framework/src/l1/render.ts`) and proven only by `test_UAT_FC_REQ-88_a_centred_column_is_recovered_and_anchored_to` and `…_a_page_with_no_centred_column_keeps_its_keyframes` | Author `test_UAT_AC1350_*`: modal-origin (not minimum), extent among the column's own runs, inset from the narrowest width, container agreement to within a pixel, content cap, and rejection unless every sample reproduces on both axes |
| 7 | violation | coverage | AC-1351 (acceptance_criterion-186df008) | uat-add | No `test_UAT_AC1351_*` exists. Per-axis column anchoring is implemented (`pxTrack` anchor terms, `packages/framework/src/l1/render.ts:1526-1661`) and proven only by `test_UAT_FC_REQ-88_x_anchors_even_when_width_is_not_a_column_function`, `…_a_full_bleed_band_is_never_anchored_to_the_column`, `…_an_anchor_without_a_column_is_rejected_by_the_envelope`, `…_column_anchored_css_is_exact_between_and_above_the_samples` | Author `test_UAT_AC1351_*`: independent per-axis fit, the capped extent, the keyframed inset fallback, the full-bleed refusal, the two coincidence guards (≥2 distinct extents, plausible fraction) |
| 8 | violation | coverage | AC-1352 (acceptance_criterion-87e0402d) | uat-add | No `test_UAT_AC1352_*` exists. The viewport-height probe pair is implemented (`yFactor` / `heightFactor` in `tools/generate/src/l1/fold.ts`, `packages/site-schema/src/l1/schema.ts`, `packages/framework/src/l1/render.ts`) and proven only by `test_UAT_FC_REQ-88_a_height_probe_makes_the_hero_track_the_viewport`, `…_a_probe_is_partitioned_out_of_the_width_ladder`, `…_without_a_height_probe_no_height_response_is_invented`, `…_content_below_a_viewport_hero_is_pushed_down_with_it`, `…_the_fidelity_probe_does_not_count_a_probe_as_a_coverage_gap` | Author `test_UAT_AC1352_*`: probe skips the keyframe ladder, pair required (same width + engine, differing heights), measured derivative, eighth-snapping, zero-response emits nothing, and the two attribution rules |
| 9 | violation | consistency | AC-691 (acceptance_criterion-304cae4c) | uat-edit | `tests/reconciliation-l1-fold.test.ts:256-290` asserts keyframe widths, x/y/width, and the widest-sample base typography — but not two clauses the AC states: (a) "a text leaf's keyframes carry no height"; (b) "a numeric type axis whose measured value *varies* across the ladder additionally carries its own per-width scalar track … an axis holding one value stays a plain scalar with no track". The fixture at line 263 already varies fontSizePx (24/32/44) yet asserts only `axes.fontSizePx === 44`. The track is implemented at `packages/site-schema/src/l1/schema.ts:96-103` (`l1TextResponsiveSchema`) and proven only by `tests/bug18-responsive-text-axes.test.ts` | Widen the AC-691 UAT: assert no text keyframe carries `height`; assert `responsive.fontSizePx` keyframes match the captured 24/32/44; add a uniform-type run and assert no track is emitted |
| 10 | violation | consistency | AC-710 (acceptance_criterion-beb4d907) | uat-edit | The AC's "Pinned-box content overflow" paragraph demands a `clip` finding whose detail names both the flowed content height and the pinned box height, plus the container's index path, and its absence when the pinned height accommodates the content or is absent. Implemented at `tools/generate/src/l1/probes.ts:412-413` (`content height Npx exceeds pinned box height Mpx`). **No test anywhere asserts that string** — `grep -r "exceeds pinned box height" tests` returns nothing. `tests/reconciliation-3probe-gate.test.ts:636-671` covers only the fidelity residual, the sibling overlap and the viewport clip | Add the pinned-container case to `test_UAT_AC710_probe_findings_are_diagnostic`: a flow container whose pinned keyframe height is under its stacked children's height → `clip` with both magnitudes and the container path; plus the two negative cases |
| 11 | violation | consistency | AC-706 (acceptance_criterion-83e8a724) | uat-edit | The AC states "Construct a document whose pinned container only overruns its pinned height at an intermediate width, and assert the probe reports that finding at that width with pass = false while the captured widths stay clean." `tests/reconciliation-3probe-gate.test.ts:448-479` covers the clean case, the narrow-oracle clip at 500px, and multi-region recovery — but has no pinned-container case at all | Add the intermediate-width pinned-container overrun case to `test_UAT_AC706_off_sample_envelope_holds_at_unsampled_widths` (shares the fixture with finding 10) |
| 12 | violation | consistency | AC-707 (acceptance_criterion-415d7f85) | uat-edit | The AC's "Pinned container" paragraph demands: grown content in a container pinned to the height its unperturbed content exactly fills produces a `clip` finding naming that container with pass = false, while the same container left unpinned passes. `tests/reconciliation-3probe-gate.test.ts:481-522` covers only sibling overlap, the flow-structured equivalent and multi-region recovery | Add the pinned-vs-unpinned container pair to `test_UAT_AC707_content_robustness_under_grown_content` |
| 13 | violation | consistency | AC-736 (acceptance_criterion-76d9ee68) | uat-edit | The AC's load-bearing discriminator — "Exemption is keyed on synthesized identity, not on being a painted surface: construct a document holding **two genuinely captured standalone surface boxes that intersect** and assert an overlap finding **is** reported naming both" — is unasserted. `tests/reconciliation-3probe-gate-evaluator.test.ts:382-477` proves only that *synthesized* surfaces are exempt (`card-wide`, slots) and that surfaces still clip; it never constructs a `box-*` pair. The predicate is `isSynthesizedSurfaceId` (`tools/generate/src/l1/fold.ts:893-897`, prefixes `section-band-`/`section-bg-`/`card-`); the discriminator is proven only by `test_UAT_FC_BUG-14_only_synthesized_surfaces_are_exempt_from_overlap` in `tests/bug14-fold-surface-hierarchy.test.ts` | Add to `test_UAT_AC736_*`: two intersecting `box-*` leaves → overlap reported naming both; a captured surface under content it backs → still reported; a slot beyond the viewport → clip reported |
| 14 | violation | consistency | AC-731 (acceptance_criterion-6a5e0eec) | uat-edit | `tests/reconciliation-l1-fold-full-language.test.ts:303-380` proves the AC's first paragraph thoroughly (dominant fill → band, differing/gradient runs → cards, ordering, render) but none of its four later paragraphs: **Adopted rect** (captured surface box larger than the run union sets the card keyframe; dropping it falls back to the run box), **Band guard** (a full-viewport-width resolved surface keeps the run box), **Accent-bearer fallback** (fill-less run with an asymmetric accent folds to a box at the wrapper's rect and carries no corner radius), **Grouping identity** (same signature + different captured rects → two cards; one shared rect → one card). Proven only by FC UATs in `tests/req88-surface-attribution.test.ts` and `tests/bug14-fold-surface-hierarchy.test.ts` | Widen `test_UAT_AC731_*` with the four clauses, sourcing assertions from `test_UAT_FC_REQ-88_tightest_surface_wins_over_the_band_behind_it`, `…_sibling_painted_accent_bar_is_found`, `…_band_does_not_tile_past_its_section_into_the_next` and `test_UAT_FC_BUG-14_distinct_card_fill_becomes_its_own_box_not_the_band` |
| 15 | warning | consistency | AC-689 (acceptance_criterion-7785b92a) | uat-edit | The AC's Verification says "Fold a capture containing runs, media and painted panels and assert the document contains leaves of more than one kind" — the "full-language" half of the AC's own title. `tests/reconciliation-l1-fold.test.ts:207-231` asserts only `root.kind === 'box'`, the widths, envelope validity and the empty-ladder error. The multi-kind property is proven adjacently (AC-705's test asserts `['box','image','image','slot','text']`; AC-731's asserts `new Set(kinds).size > 1`), so this is drift in traceability rather than an evidence hole | Add a one-line multi-kind assertion to `test_UAT_AC689_*` over a mixed fixture |

## Notes for the Editor

**The cross-cutting pattern — and it explains all 14 violations.** This capability's ACs have
been widened repeatedly by free-coded intents (REQ-88, REQ-96, BUG-13/14/17/18/23/24). Each
widening landed *with* substantive UATs — but named `test_UAT_FC_<INTENT>_*`, which carries no
AC traceability. The AC bodies were then brought up to date (the `ac` cycle passed today at
13:19). The `test_UAT_AC*` reconciliation suites were never widened to match. The net effect:
**every behaviour in this capability is implemented and tested; a growing share of it is not
traceable to the AC that claims it.** Nothing here is a code defect — no `code-issue` finding
is warranted, and none is filed.

**This means the repair is mostly mechanical, not authorial.** For all 8 `uat-add` findings and
for findings 13 and 14, an equivalent assertion already exists in a free-coded suite; the finding
text names the specific FC UAT for each. Prefer re-homing/renaming those assertions into the
AC-named reconciliation suites over writing fresh fixtures — it is cheaper and it avoids the
capability accumulating two independent proofs of the same behaviour. Where an FC suite proves
something broader than its AC, move only the AC's clause.

**Three findings share one fixture.** Findings 10, 11 and 12 (AC-710, AC-706, AC-707) are the
same unevidenced mechanism — the pinned-box content-overflow `clip` at
`tools/generate/src/l1/probes.ts:412` — seen from three probes. One fixture (a flow container
pinned to the height its unperturbed content exactly fills) satisfies all three: assert the
finding's shape under AC-710, its appearance at an unsampled intermediate width under AC-706,
and its appearance under 2.5× content growth with the unpinned control under AC-707. This is
the only mechanism in the capability with **no** test coverage of any kind, FC or AC — worth
doing first.

**Finding 9 is the one with a latent risk.** AC-691's fixture already varies `fontSizePx` across
the ladder and asserts only the widest value, so a regression that dropped the per-width
`responsive` track entirely would leave the AC-691 UAT green. The BUG-18 suite would catch it,
but AC-691 is where the matrix claims it.

**Metadata observation (not a finding).** The eight ACs created today (AC-1345…AC-1352) carry no
`intent_uid` field, unlike the stories above them, so the FC intents they reconcile
(REQ-88, BUG-17, BUG-23, BUG-24) are not machine-traceable from the AC. That is an `ac`-level
attribute and the `ac` cycle has already passed; flagging it here only so it is on record.
