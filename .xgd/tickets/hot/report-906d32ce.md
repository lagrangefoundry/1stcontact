---
uid: report-906d32ce
id: REPORT-2449
type: report
title: 'Fix L1 Reproduction Pipeline: Fold & Acceptance Gate (uat) — attempt 7 (call
  2)'
created_by: xgd
created_at: '2026-08-20T13:48:10.806123+00:00'
updated_at: '2026-08-20T13:48:10.806123+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-2049c9ec
  level: uat
  fixes_applied: 8
  progress_made: true
  needs_more_work: true
  violations_remaining: 4
  anchor_report_uid: report-2485c83c
---

# Fix Summary — L1 Reproduction Pipeline: Fold & Acceptance Gate (uat)

**Attempt**: 7 (call 2)
**Fixes applied this call**: 8
**Violations remaining**: 4
**Needs more work**: true

Call 1 (report-b41fe36e) closed all seven `uat-edit` findings (9–15). This call
starts the eight `uat-add` findings and closes **four** of them: AC-1345, AC-1346,
AC-1347, AC-1352. Four remain: AC-1348, AC-1349, AC-1350, AC-1351.

## Actions Taken — by Resolution Category

All eight ACs in this group belong to **story-8acc338d** (STORY-84, the fold
story), so the four tests went into one new reconciliation suite following the
existing per-upgrade-span file convention:

**`tests/reconciliation-l1-fold-measured-axes.test.ts`** — the criteria whose
common shape is *an axis the fold measures off the reference rather than
authoring* (the REQ-88 / BUG-17 / BUG-24 span).

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-add | AC-1345 (finding 1) | Authored `test_UAT_AC1345_section_background_box_folds_on_image_or_scrim`. Covers the AC's whole Verification paragraph: photo + veil → **one** box carrying both axes with all four sides pinned at every width; render asserts the alpha survives (`#0206184d`) and is layered *ahead* of the image in one `background-image`; scrim-without-image folds; image-without-scrim emits no scrim axis; neither → no box. The **per-axis widest read** is the clause no FC UAT covered — a section painting the image only at 1440 and the veil only at 768 folds one box carrying both, keyframed at `[768, 1440]`. |
| 2 | uat-add | AC-1346 (finding 2) | Authored `test_UAT_AC1346_per_side_padding_folds_and_a_varying_side_earns_a_track`. A run, an image and a painted panel each fold their four captured sides; an all-zero element emits no axis; render asserts `box-sizing: border-box` + the typed longhands (inset, not inflated). Responsive half: a side varying at 1024 earns a per-width track matching the captured values while the unvarying sides stay plain scalars, and a leaf padded identically everywhere emits no track. |
| 3 | uat-add | AC-1347 (finding 3) | Authored `test_UAT_AC1347_nowrap_threshold_is_the_measured_single_line_suffix`. Threshold-equals-middle-rung (768); the **suffix rule** (one line at 1024, two at 1280 → 1440, not 1024); wraps-everywhere → no axis; unmeasurable line count → no axis; and the render clause — the pin is gated by `@media (min-width: 768px)` with nothing before the first media block carrying it, against a floor-pinned run that *is* unconditional. |
| 4 | uat-add | AC-1352 (finding 8) | Authored `test_UAT_AC1352_probe_pair_folds_a_measured_snapped_height_response`. The probe skips the keyframe ladder (`doc.widths` is the ladder; `partitionProbes` splits `1280x1000` out; no node carries a duplicated or off-ladder rung); hero band `heightFactor: 1`, the band below `yFactor: 1`, keyframes carry their `atHeight`; the section-edge attribution rule (the still hero title does not suppress the band's growth); zero-response emits nothing; **snapping** — 199.5/200 folds to exactly 1 while 60/200 is carried as the measured 0.3; and the pair requirement — no probe → no response anywhere, and a re-shoot at the *same* viewport height contributes none rather than dividing by a zero difference. |
| 5–8 | uat-add (field) | AC-1345, AC-1346, AC-1347, AC-1352 | `uat_coverage` moved `fail` → `pass` on each, paired with its test in the same call. |

## Test Execution Evidence

```
npm test -- tests/reconciliation-l1-fold-measured-axes.test.ts
→ Test Files 1 passed (1) · Tests 4 passed (4)
```

Regression check over the eight AC-named reconciliation suites plus the three FC
suites the assertions were sourced from:

```
npm test -- tests/reconciliation-l1-fold.test.ts tests/reconciliation-l1-fold-full-language.test.ts \
  tests/reconciliation-l1-fold-framing-and-adjustment.test.ts tests/reconciliation-l1-fold-seams-and-refold.test.ts \
  tests/reconciliation-l1-fold-measured-axes.test.ts tests/reconciliation-3probe-gate.test.ts \
  tests/reconciliation-3probe-gate-evaluator.test.ts tests/reconciliation-cross-gate-reconciliation.test.ts \
  tests/req88-viewport-relative-and-nowrap.test.ts tests/bug17-fold-padding.test.ts tests/bug24-scrim-alpha.test.ts
→ Test Files 11 passed (11) · Tests 72 passed | 3 skipped (75)
```

The three skips are pre-existing and are not coverage this call relies on: two
browser-gated (`chromiumAvailable`) and one gated on the gitignored
`storage/references/` bundle. Every assertion above runs headlessly.

Each test drives real entry points (`foldToL1`, `validateL1`, `renderL1Document`,
`partitionProbes`) over synthetic multi-viewport captures. No mocks. The new file
typechecks clean under the project's `tsconfig.base.json` settings.

Two fixture calibrations against real behaviour, neither a defect:
- A folded standalone painted surface is identified by its `box-*` id; my first
  predicate (`kind === 'box'` minus `section-*`) matched the **root** box instead.
- The section-background fold only records a width where that section actually
  painted something, so the split-axis fixture keyframes at `[768, 1440]` rather
  than across the whole ladder. The test asserts that explicitly.

## Code Edits (if any)

None this call.

## needs_review Items Forwarded

None. The report carried `needs_review_count: 0`.

## Remaining Work (next iteration)

| Finding | AC | Behaviour | Notes |
|---|---|---|---|
| 4 | AC-1348 | Seam behavioural-config derivation | Six-item enumeration + the honest-default / derivation-gap clause and channel separation. Source: `tests/req88-form-labelling-and-submit.test.ts`. |
| 5 | AC-1349 | `1c repro <slug> --ref <bundle>` materialization | CLI-surface, not fold-surface — belongs in its own reconciliation file with AC-1348, not in the measured-axes suite. Source: `tests/bug23-repro-local-assets.test.ts`. |
| 6 | AC-1350 | Content-column recovery | Seven clauses (modal origin, own-runs extent, inset/container agreement, content cap, full-bleed exclusion, per-sample rejection, three-width minimum). Belongs in the measured-axes suite. |
| 7 | AC-1351 | Per-axis column anchoring | Pairs with AC-1350 (same fixture family) — independent per-axis fit, capped extent, keyframed fallback, full-bleed refusal, the two coincidence guards. Source: the REQ-88 anchor FC UATs. |

Plan: AC-1350 + AC-1351 together in `tests/reconciliation-l1-fold-measured-axes.test.ts`
(they share the `columnPage` fixture family), then AC-1348 + AC-1349 in a new
`tests/reconciliation-l1-repro-and-seam-config.test.ts`.
