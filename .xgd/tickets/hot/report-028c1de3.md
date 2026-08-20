---
uid: report-028c1de3
id: REPORT-2451
type: report
title: 'Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
  (level=uat)'
created_by: xgd
created_at: '2026-08-20T14:09:52.424834+00:00'
updated_at: '2026-08-20T14:09:52.424834+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-2049c9ec
  level: uat
  violations: 1
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
# Level: uat

**Result**: FAIL
**Violations**: 1
**Warnings**: 1
**Needs review**: 0

Anchor report: report-2485c83c · Capability: capability-2049c9ec (CAP-71)
Stories: STORY-84 (story-8acc338d), STORY-86 (story-24098299) — both `story_kind: upgrade`
Active ACs: 42 · ACs with a `test_UAT_AC<n>_*` UAT: **42** · without: **0**

**Test execution evidence (this session).**

```
npm test -- tests/reconciliation-l1-fold.test.ts tests/reconciliation-l1-fold-full-language.test.ts \
  tests/reconciliation-l1-fold-framing-and-adjustment.test.ts tests/reconciliation-l1-fold-seams-and-refold.test.ts \
  tests/reconciliation-l1-fold-measured-axes.test.ts tests/reconciliation-l1-seam-config-and-repro.test.ts \
  tests/reconciliation-3probe-gate.test.ts tests/reconciliation-3probe-gate-evaluator.test.ts \
  tests/reconciliation-cross-gate-reconciliation.test.ts
→ Test Files 9 passed (9) · Tests 42 passed (42)
```

42 AC-named UATs for 42 active ACs — one apiece, none skipped. Every one drives a real
entry point (`foldToL1`, `partitionProbes`, `validateL1`, `renderL1Document`, `cmdRepro`,
`cmdCapturePage`, `evaluateLayout`, `sampleFidelityProbe`, `offSampleProbe`,
`contentRobustnessProbe`, `promoteToFlow`, `threeProbeGate`, `cli.run`) over real
components; the only mock is a browser driver at the external engine boundary. No
structural/AST-only checks. **Coverage at this level is now complete** — the eight ACs that
had no test at the previous cycle (AC-1345…AC-1352) each have one, and the six `uat-edit`
findings plus the warning from report-420214de are all verifiably closed (see the ledger).

The single violation below is a clause of AC-1352 that is implemented in production code
and asserted by **no** test in the repository, FC or AC.

## Cumulative Intent Considered

At `uat` level the AC bodies are the working reference; the `ac` cycle passed at
2026-08-20 13:19 (report-34a49913, 0 violations). Intent was consulted only to date the
capability's widenings and to establish that nothing asserted has been retired.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (bundle-31e474b9) — REQ-63/79/82/83/84 +2 | free_and_reconciled | created 2026-07-22, merged @ edeb1c2c | Originating intent for both stories: capture → fold → render → gate | YES |
| BUNDLE-11 (bundle-ee56a66e) — BUG-27/REQ-94/96/97/98 +10 | free_and_reconciled | created 2026-08-05 | Widened STORY-86 (`updated_by`): cross-gate verdict, control composition | YES |
| REQ-136 (request-8a132869) | free_and_reconciled | created 2026-08-12 | Widened STORY-84 (`updated_by`): image framing + colour adjustment (AC-1133/AC-1134) | YES |
| REQ-88 (free-coded, reconciled into main) | reconciled | — | nowrap threshold, viewport-height probe, content column, column anchor, padding track, surface attribution, form labelling | YES |
| REQ-96 (free-coded, reconciled into main) | reconciled | — | control composition; a captured control binds to its module seam, not the residual channel | YES |
| BUG-13/14/17/18/23/24 (free-coded, reconciled into main) | reconciled | — | section background, surface hierarchy, fold padding, responsive text axes, repro local assets, scrim alpha | YES |

No retired, abandoned or deprecated intent bears on this capability's UAT layer; nothing in
the 42 passing tests asserts behaviour that intent has withdrawn.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-689 → `test_UAT_AC689_capture_emits_one_validated_l1_document` | BUNDLE-7 | aligned — prior warning 15 closed: the multi-kind clause is now asserted (`reconciliation-l1-fold.test.ts:292-295`) |
| AC-690, AC-692…AC-696 → their UATs | BUNDLE-7 | aligned |
| AC-691 → `test_UAT_AC691_each_node_carries_keyframe_per_width_matching_box` | BUNDLE-7, BUG-18 | aligned — prior finding 9 closed: text keyframes assert no `height` (`:364`), the varying `responsive.fontSizePx` track is asserted against the captured 24/32/44 (`:371-374`), and a uniform-type run asserts no track (`:379-384`) |
| AC-705, AC-708, AC-709, AC-724 → their UATs | BUNDLE-7 | aligned |
| AC-706 → `test_UAT_AC706_off_sample_envelope_holds_at_unsampled_widths` | BUNDLE-7 | aligned — prior finding 11 closed: the pinned-container overrun at the unsampled 500px is asserted, with every captured width clean (`reconciliation-3probe-gate.test.ts:531-551`) |
| AC-707 → `test_UAT_AC707_content_robustness_under_grown_content` | BUNDLE-7 | aligned — prior finding 12 closed: the pinned-vs-unpinned pair is asserted with both magnitudes and the container path (`:583-624`) |
| AC-710 → `test_UAT_AC710_probe_findings_are_diagnostic` | BUNDLE-7 | aligned — prior finding 10 closed: the pinned-box `clip` names `content height 86px` / `pinned box height 40px` and path `0.0`, with both negative cases (`:799-826`) |
| AC-729, AC-730, AC-732, AC-733 → their UATs | BUNDLE-7, REQ-96 | aligned |
| AC-731 → `test_UAT_AC731_dominant_run_fill_becomes_band_and_differing_surfaces_back_their_runs` | BUNDLE-7, BUG-14, REQ-88 | aligned — prior finding 14 closed: adopted rect (`:407-429`), band guard with its discriminating `w - 1` contrast (`:431-483`), accent-bearer fallback incl. the no-inherited-radius assertion (`:485-513`), grouping identity split-vs-merged (`:515-562`) |
| AC-734, AC-735, AC-737 → their UATs | BUNDLE-7, REQ-96 | aligned |
| AC-736 → `test_UAT_AC736_backing_surface_is_not_an_overlap_but_still_clips` | BUG-14 | aligned — prior finding 13 closed: two captured `box-3`/`box-7` surfaces report the overlap naming both, and the identical geometry under `section-band-0`/`card-1` reports nothing, so the discriminator is the id not the shape (`reconciliation-3probe-gate-evaluator.test.ts:489-559`) |
| AC-812, AC-813, AC-814 → their UATs | BUNDLE-7 | aligned |
| AC-852…AC-856 → their UATs | BUNDLE-11 (REQ-94) | aligned |
| AC-1133, AC-1134 → their UATs | REQ-136 | aligned |
| AC-1345 → `test_UAT_AC1345_section_background_box_folds_on_image_or_scrim` | BUG-24, REQ-88 | aligned — prior finding 1 closed: both axes on one box, scrim-only, image-only, neither, and the per-axis widest read (image at 1440 only / scrim at 768 only) folding one box carrying both |
| AC-1346 → `test_UAT_AC1346_per_side_padding_folds_and_a_varying_side_earns_a_track` | BUG-17, REQ-88 | aligned — prior finding 2 closed: four sides on run/image/box, all-zero emits none, varying sides earn tracks while unvarying stay scalar, border-box render |
| AC-1347 → `test_UAT_AC1347_nowrap_threshold_is_the_measured_single_line_suffix` | REQ-88 | aligned — prior finding 3 closed: middle-rung threshold, the suffix rule (1024-then-1280 yields 1440), always-wrapping emits none, unmeasurable breaks the suffix, and the below-threshold render |
| AC-1348 → `test_UAT_AC1348_seam_config_derives_the_six_facts_and_records_every_gap` | REQ-88, REQ-96 | aligned — prior finding 4 closed: all six facts with an empty gap list, unique slug on a duplicated label, four honest defaults each with its gap, unsafe action dropped, and channel separation asserting no `field` residual |
| AC-1349 → `test_UAT_AC1349_repro_materializes_seams_and_localizes_every_handle` | BUG-23, REQ-88 | aligned — prior finding 5 closed: real `cmdRepro` against on-disk bundles; seam bound by name, all three handle families localized, unmirrored handle throws, orphan mirrored image reported as a fold gap, part-stale refused, idempotence with a stray file |
| AC-1350 → `test_UAT_AC1350_column_is_fitted_from_content_and_rejected_unless_every_sample_reproduces` | REQ-88 | aligned — prior finding 6 closed: clean fit reproducing every sample within a pixel, modal origin against an outdented header, full-bleed exclusion, cap present/absent, and all four rejection paths |
| AC-1351 → `test_UAT_AC1351_column_anchors_are_fitted_per_axis_with_cap_track_and_refusals` | REQ-88 | **partial** — prior finding 7 substantially closed (5½ of 6 Verification paragraphs); two clauses unasserted → warning 2 |
| AC-1352 → `test_UAT_AC1352_probe_pair_folds_a_measured_snapped_height_response` | REQ-88 | **gap** — prior finding 8 substantially closed, but attribution rule 2 (card inherits its representative row) and the band-disagreement refusal are unasserted → violation 1 |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-1352 (acceptance_criterion-87e0402d) | uat-edit | AC-1352 names **two** attribution rules and its Verification instructs both: "assert the hero band's response comes from its **section edges** … **and** assert a reconstructed card carries the response of the representative row it was built from." `tests/reconciliation-l1-fold-measured-axes.test.ts:452-548` asserts only rule 1 (`section-band-0` grows while its still `Hero title` run does not). Rule 2 is implemented at `tools/generate/src/l1/fold.ts:1685-1688` (`const cardResponse = rows.map((r) => r.viewportResponse).find(Boolean)`), fed by `fold.ts:1943`, and is asserted by **no test in the repository**: `grep -rn "viewportResponse\|yFactor\|heightFactor" tests/` hits only `reconciliation-l1-fold-measured-axes.test.ts` and `req88-viewport-relative-and-nowrap.test.ts`, and neither constructs or inspects a `card-*` node. Deleting lines 1687-1688 leaves the whole suite green. The same test also leaves the Criterion's band-disagreement refusal — "a band whose sampled widths disagree about that rule carries no response rather than a fabricated one", `fold.ts:1572-1579` — unasserted; the fixture's bands agree at every width, so the `every(...)` guard is never exercised in the false direction | Extend `test_UAT_AC1352_*`: (a) add to `heroPage` a **card-shaped** fill run — a distinct `surfaceFill`, narrower than the viewport so it folds `card-*` not `section-band-*`, positioned at `y = height + N` so it travels with the viewport — and assert the resulting `card-*` box carries the `yFactor: 1` of the row it was built from, contrasted against a card whose row does not move carrying none; (b) add a band whose two edge responses differ between two sampled widths and assert it carries **no** response rather than the first sample's |
| 2 | warning | consistency | AC-1351 (acceptance_criterion-186df008) | uat-edit | Two clauses of AC-1351 are unasserted by `test_UAT_AC1351_*` (`tests/reconciliation-l1-fold-measured-axes.test.ts:728-865`). (a) The Verification's residual-inset paragraph ends "…and assert the third column stays inside the viewport at an unsampled width just below the breakpoint" — the test asserts the `pxTrack` keyframes and that its segments equal the node's own (`:840-848`) but never renders or evaluates the `grid` document off-sample, so the consequence the clause exists for is unchecked. (b) The Criterion's first coincidence guard — "the samples must show at least two distinct column extents (a single extent cannot separate the constant from the fraction)" — has no fixture; only the second guard (plausible share) is exercised (`:792-814`). Minor third: the plausible-share paragraph's render half ("rendering it at an unsampled width stays near its captured size") is not asserted, only the absence of the width anchor | Add to `test_UAT_AC1351_*`: render or `evaluateLayout` the `grid` fixture at an unsampled width just under 768 and assert the third tile's right edge stays inside the viewport; add a fixture whose captured widths all resolve to one column extent (e.g. every sampled width at or above `containerPx`) and assert no width anchor is fitted despite the samples being reproducible |
| 3 | info | coverage | AC-1345/1346/1347/1348/1349/1350/1351/1352 | — | The eight new AC-named UATs **mirror** rather than re-home their free-coded sources: `tests/bug24-scrim-alpha.test.ts` (4 FC UATs), `tests/bug17-fold-padding.test.ts` (7), `tests/bug23-repro-local-assets.test.ts` (6), `tests/req88-form-labelling-and-submit.test.ts` (8) and `tests/req88-viewport-relative-and-nowrap.test.ts` (21) all still carry their originals. This is not filed as an exclusivity finding: the FC suites are the free-coded intents' own regression evidence in a different traceability chain, the AC UATs are consolidated multi-clause tests with their own fixtures, and deleting either side would lose a chain. Recorded so a future cycle does not read the pairing as accidental | none |
| 4 | info | — | `tests/req88-form-labelling-and-submit.test.ts` | — | Two FC UATs (`test_UAT_FC_REQ-88_placeholder_labelling_renders_inside_the_box_and_stays_accessible`, `test_UAT_FC_REQ-96_a_bound_submit_control_is_the_only_button`) fail in this session with `Error: listen EPERM: operation not permitted 0.0.0.0` from `tools/generate/src/cli/serve.ts:54` via `serveOneModulePage`. Reproduced independently here (`Test Files 1 failed \| 6 passed`, `Tests 2 failed \| 64 passed \| 3 skipped`). Suites that bind `127.0.0.1` explicitly pass in the same run, so this is the sandbox denying a wildcard bind, not a code or test defect. It touches no AC-named UAT of this capability. The 3 skips are pre-existing (two `chromiumAvailable`-gated, one gated on the gitignored `storage/references/` bundle) | none — flagged so it is on record rather than reported as green |

## Notes for the Editor

**This is the last mile.** The previous cycle's 14 violations and 1 warning are all closed
and independently verified above, line by line — the eight missing tests exist and the six
widened ones assert the clauses they were asked for, including the three that shared the
pinned-container fixture (AC-706 / AC-707 / AC-710), which is now the best-evidenced
mechanism in the capability rather than the worst. Nothing regressed: all 42 AC-named UATs
pass together.

**Violation 1 is the only genuine evidence hole left in the capability**, and it is small.
It is not a traceability gap like the previous round's — there is no free-coded UAT that
proves it either, so `fold.ts:1687-1688` is production code no test protects. The repair is
one fixture addition (a card-shaped travelling run) plus two or three assertions inside the
existing `test_UAT_AC1352_*`, and the band-disagreement half is one more band with
disagreeing edge responses. No new file, no new AC, no code change.

**Warning 2 does not gate the level** and can be taken in the same edit if convenient — both
items land in `test_UAT_AC1351_*`, which is already the longest test in that file.

**No `code-issue` is filed and none is warranted.** Every behaviour named in every AC of
this capability is implemented; the gap is in what the tests assert, not in what the code
does. In particular, `fold.ts:1685-1688` and `fold.ts:1572-1579` read correct on
inspection — they are simply unprotected.

**Metadata observation (not a finding, carried forward from report-420214de).** AC-1345…
AC-1352 still carry no `intent_uid` field, so the free-coded intents they reconcile
(REQ-88, BUG-17, BUG-23, BUG-24) are not machine-traceable from the AC. That is an
`ac`-level attribute and the `ac` cycle has passed; it is on record only.
