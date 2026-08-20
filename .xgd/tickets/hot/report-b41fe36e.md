---
uid: report-b41fe36e
id: REPORT-2448
type: report
title: 'Fix L1 Reproduction Pipeline: Fold & Acceptance Gate (uat) — attempt 7'
created_by: xgd
created_at: '2026-08-20T13:42:18.545069+00:00'
updated_at: '2026-08-20T13:42:18.545069+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-2049c9ec
  level: uat
  fixes_applied: 7
  progress_made: true
  needs_more_work: true
  violations_remaining: 8
  anchor_report_uid: report-2485c83c
---

# Fix Summary — L1 Reproduction Pipeline: Fold & Acceptance Gate (uat)

**Attempt**: 7
**Fixes applied this call**: 7
**Violations remaining**: 8
**Needs more work**: true

This is the first `fix_structural_validation` call at `level=uat` for this
capability (attempts 7–12 in the ledger were `story`, 8–9 were `ac`). This call
took the **seven `uat-edit` findings** (six violations + the one warning) — every
finding whose repair is widening an existing AC-named UAT. The eight `uat-add`
findings (AC-1345…AC-1352) are untouched and are the whole of the remaining work.

Order was chosen from the report's own "Notes for the Editor": findings 10/11/12
share one mechanism with **no** coverage of any kind (FC or AC), so they went
first; finding 9 carried the latent-regression risk; the rest followed.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-edit | AC-710 (finding 10) | Added the pinned-box content-overflow case to `test_UAT_AC710_probe_findings_are_diagnostic`: a stack pinned to 40px whose three in-flow rows stack to 86px → one `clip` whose detail names **both** magnitudes (`content height 86px` / `pinned box height 40px`) and whose `paths` is the **container's** `0.0`, asserted distinct from the leaf paths `0.0.0…0.0.2`. Both negatives asserted: pin that accommodates the content → no finding; keyframes carrying no height at all → no finding. |
| 2 | uat-edit | AC-706 (finding 11) | Added the intermediate-width overrun to `test_UAT_AC706_off_sample_envelope_holds_at_unsampled_widths`: the middle row is visible across `[400, 700)` only, so every captured rung holds 64px inside a 70px pin while the off-sample 500px holds 86px and overruns. Asserts `pass=false`, the finding at 500 naming `0.0`, empty findings at 900, **and** `evaluateLayout` clean at every captured width — the AC's "captured widths stay clean" half. |
| 3 | uat-edit | AC-707 (finding 12) | Added the pinned/unpinned pair to `test_UAT_AC707_content_robustness_under_grown_content`: a container pinned to exactly the 86px its unperturbed rows fill is clean at `scale: 1`; at 2.5× the rows wrap to three lines each and the interior stacks to 218px → `clip` at every captured width naming the container. The same subtree left unpinned sizes to its content and passes with empty findings. |
| 4 | uat-edit | AC-691 (finding 9) | Widened `test_UAT_AC691_each_node_carries_keyframe_per_width_matching_box` with the two unasserted clauses: no text keyframe carries a `height`, and the varying `fontSizePx` (24/32/44) emits a `responsive.fontSizePx` track whose keyframes match the captured values at 320/768/1280. Added a second run with a constant 20px size and asserted **no** track is emitted. This closes the latent risk the assessor named — the fixture already varied the size and asserted only the widest value. |
| 5 | uat-edit | AC-736 (finding 13) | Added the load-bearing discriminator to `test_UAT_AC736_backing_surface_is_not_an_overlap_but_still_clips`: two intersecting **captured** `box-*` surfaces → one overlap naming both; the identical geometry under synthesized ids (`section-band-0` / `card-1`) → none, so the difference is the id and not the shape; a captured surface under content it appears to back → still reported; a slot past the viewport edge → `clip` reported. |
| 6 | uat-edit | AC-731 (finding 14) | Widened `test_UAT_AC731_*` with the four unproven paragraphs. **Adopted rect**: a captured 280×120 surface around a 180×40 run sets the card keyframe verbatim at every width, and a row whose surface the capture missed falls back to its run box alone. **Band guard**: a viewport-wide resolved surface keeps the run box — made non-vacuous by the same row with a surface 1px narrower, which *does* adopt. **Accent-bearer fallback**: a fill-less run bearing a `borderLeft` folds to a box at the wrapper's `accentBox` rect and carries no corner radius. **Grouping identity**: same fill + signature + proximity but different captured rects → two cards; one shared rect → one card at that rect. |
| 7 | uat-edit | AC-689 (finding 15, warning) | Added the multi-kind assertion: a capture carrying a run, media and a painted panel folds to leaves of more than one kind, with `text` and `image` both present — the "full-language" half of the AC's own title, previously proven only adjacently under AC-705/AC-731. |

## Test Execution Evidence

All seven AC-named suites run this call:

```
npm test -- tests/reconciliation-l1-fold.test.ts tests/reconciliation-l1-fold-full-language.test.ts \
  tests/reconciliation-l1-fold-framing-and-adjustment.test.ts tests/reconciliation-l1-fold-seams-and-refold.test.ts \
  tests/reconciliation-3probe-gate.test.ts tests/reconciliation-3probe-gate-evaluator.test.ts \
  tests/reconciliation-cross-gate-reconciliation.test.ts
→ Test Files 7 passed (7) · Tests 34 passed (34)
```

Every added assertion drives a real entry point (`foldToL1`, `evaluateLayout`,
`offSampleProbe`, `contentRobustnessProbe`, `validateL1`, `renderL1Document`) over
real components. No mocks were added.

Typechecked the four edited files with the project's `tsconfig.base.json` settings
(`strict`, ES2022, bundler resolution). The only remaining errors in them are the
four pre-existing ones on untouched lines (`reconciliation-l1-fold.test.ts:62,104`
— the `run`/`signalsFor` helpers; `reconciliation-3probe-gate.test.ts:380,770` —
optional `.box` access in the fidelity fixtures). Nothing I added type-errors.

One calibration was needed against real behaviour rather than against the AC text:
the evaluator's stack advances the gap for a **hidden** child too, so the AC-706
two-row interior measures 64px, not 54px. The pin was set to 70px to match what the
evaluator actually does. This is an observation about the flow model, not a defect
— the AC says nothing about gap collapsing — but it is recorded here in case a
later reader expects 54.

## Code Edits (if any)

None this call. No `code-issue` finding was filed by the assessor and none was
warranted: every behaviour asserted above was already implemented and already
passed on first run, except the AC-706 pin calibration described above.

## needs_review Items Forwarded

None. The report carried `needs_review_count: 0`.

## Remaining Work (next iteration)

The eight `uat-add` findings, all of the same shape — behaviour implemented and
proven by `test_UAT_FC_*` suites that carry no AC traceability:

| Finding | AC | Behaviour | FC suite to re-home from |
|---|---|---|---|
| 1 | AC-1345 | Section background box on image **or** scrim | `tests/bug24-scrim-alpha.test.ts` |
| 2 | AC-1346 | Per-side padding axis + per-width track | `tests/bug17-fold-padding.test.ts` |
| 3 | AC-1347 | No-wrap threshold (`nowrapFromPx`) | `tests/req88-viewport-relative-and-nowrap.test.ts` |
| 4 | AC-1348 | Seam behavioural-config derivation | `tests/req88-form-labelling-and-submit.test.ts` |
| 5 | AC-1349 | `1c repro --ref` materialization | `tests/bug23-repro-local-assets.test.ts` |
| 6 | AC-1350 | Content-column recovery | `tests/req88-viewport-relative-and-nowrap.test.ts` |
| 7 | AC-1351 | Per-axis column anchoring | (REQ-88 anchor FC UATs) |
| 8 | AC-1352 | Viewport-height probe pair | (REQ-88 height-probe FC UATs) |

Per the assessor's note, the plan is to re-home/mirror the named FC assertions into
AC-named suites rather than author fresh fixtures, moving only the clause each AC
claims where the FC suite proves something broader. Each will also need its AC's
`uat_coverage` set to `pass` once its test lands.
