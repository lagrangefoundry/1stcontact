---
uid: report-1afb79c6
id: REPORT-2381
type: report
title: Fix 1c Capture & Diff Fidelity (uat) — attempt 7 (call 2)
created_by: xgd
created_at: '2026-08-20T05:35:29.319793+00:00'
updated_at: '2026-08-20T05:35:29.319793+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-aa030c83
  level: uat
  fixes_applied: 32
  progress_made: true
  needs_more_work: true
  violations_remaining: 3
  anchor_report_uid: report-2485c83c
---

# Fix Summary — 1c Capture & Diff Fidelity (uat)

**Attempt**: 7 (second call)
**Fixes applied this call**: 32
**Violations remaining**: 3
**Needs more work**: true

Closed the whole **report-surface cluster** (STORY-116's four ACs) plus the two
REQ-73 spacing ACs and the CLI boolean-flag AC — seven findings, every one of them
browser-independent. What remains is exactly the three ACs warning W1 flagged as
browser-gated, which need a different treatment and are planned below.

Porting was **not** a rename-only job. Every one of these ACs asks for more than its
FC ancestor asserted, so each port carries the missing clauses: the FC tests proved
the axis existed, the ACs demand the contract around it.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-edit | AC-1312 (finding 8) | Ported both REQ-73 gap tests; extended with HIGH severity + Type-B class + the two rows named. **Added** `test_UAT_AC1312_one_wrong_gap_is_exactly_one_delta_however_far_it_cascades` (four rows, one wrong gap, everything below displaced → exactly one delta — the drift-free claim, previously untested), the side-by-side card row (one gap to the row above, not one per card), overlapping rows emitting nothing, and `test_UAT_AC1312_gap_tolerance_is_6px_by_default_and_16px_under_tolerant` (4px absorbed / 10px reported / 10px absorbed under `--tolerant` / 20px reported under both) |
| 2 | uat-edit | AC-1313 (finding 9) | Ported all three cited tests. The retirement half now also asserts the band padding is **still captured on both sides** (the AC's "captured but not compared"); **added** `test_UAT_AC1313_band_text_align_is_unaffected_by_the_padding_retirement` proving the retirement is scoped to vertical padding and the same section's `textAlign` still fires. The other two renames carry the "element padding / element text-align unaffected" half |
| 3 | uat-edit | AC-1286 (finding 14) | Ported the dedup test; **added** `_constant_folds_to_a_scalar_varying_folds_to_a_range_systemic_is_excluded` (3-rung ladder: constant → one scalar, fluid → `36 .. 60` range, synthetic `systemic` rollup → no row, header states both the unique count and the larger raw total) and `_the_json_document_carries_the_same_defects_as_the_text_view` (JSON round-trip vs `formatCollapsedReport`, with an all-ladder defect and a narrow-only one so both width renderings are checked) |
| 4 | uat-edit | AC-1287 (finding 15) | Ported both cited tests; extended the derived test to assert the position row is absent from **every repair-class group** (per-group counts sum to the headline). **Added** `_dimension_axes_are_not_derived_and_stay_counted` — a cell set with position, gap, box `size` and `renderedTextBox` deltas, asserting only position is derived and the headline states how many were set aside |
| 5 | uat-edit | AC-1288 (finding 16) | Ported both cited tests; **added** `_five_classification_cases_and_the_report_prints_in_repair_order` covering all five the AC enumerates (flat / varying-reference / some-widths / section-spacing / emergent) and asserting the report emits flat → structural → emergent with per-group counts and the reference value on each row |
| 6 | uat-edit | AC-1289 (finding 17) | Ported the roll-up test; **added** three: `_unmapped_property_gets_its_own_review_cause_and_causes_are_ranked` (`opacity` has no table entry → own cause, `review`, and causes ranked by count), `_disjoint_width_members_report_both_widths_not_the_whole_run` (the no-phantom-merge clause), and `_the_json_causes_match_the_text_report_and_carry_the_summary` (JSON round-trip vs `formatClusterReport`, same ordering, plus the `N counted → M causes` and `fix/review/accept` summary line). Plus `_clusters_and_collapse_parse_as_independent_booleans` — see the caveat below |
| 7 | uat-edit | AC-1290 (finding 13) | Ported the source-derivation test and the parameterised per-flag slug test; **added** `_the_derivation_goes_red_when_a_registered_flag_is_dropped`, which is the AC's own "confirm the assertion is load-bearing" clause: for every registered flag, the derived set must differ from a registry with that member removed (and from one with a phantom member added). Left `_boolean_flag_set_is_pinned_entire` under its FC name — AC-1290 explicitly contrasts itself with "restating the registry as a literal" |
| 8–32 | field update | AC-1312, AC-1313, AC-1286, AC-1287, AC-1288, AC-1289, AC-1290 | `uat_coverage: pass` on all seven |

Breakdown of the 32: 25 test-level mutations (11 ports, 14 newly authored UATs) and
7 ticket field updates.

## Verification

**119 passed, 12 skipped, 0 failed** across the six files touched over both calls
plus six adjacent files that share their helpers or subject
(`req31-values-diff`, `req59-gradient-stop-positions`,
`reconciliation-1c-cli-output-hygiene`, `naming`, and the two from call one). The
12 skips are pre-existing browser-gated cases. No stale references to any renamed
identifier remain outside the assessor's own report.

Two of my new tests failed on first run and were corrected — both were my
assertions being wrong, not the code: the text report abbreviates a full-ladder
width set to `@all` rather than listing widths, and `position` cannot stand in for
the Type-B group because it is derived and excluded from the repair classes (which
is AC-1287's rule, so the correction is itself the two ACs agreeing).

**What I did not run.** `vitest run tests/` (the whole directory) did not complete
within 10 minutes and I stopped it rather than leave it pending; vitest buffers, so
it produced no partial output to read. The slowness is not in anything I touched —
the twelve files above finish in 2.3s — but it means I verified my changes against a
targeted set, not the full suite. Stating it rather than implying full-suite green.

## Caveat on one clause — `--clusters` precedence over `--collapse`

AC-1289 requires that `--clusters --collapse --json` emits the clustered causes.
That branch lives in the dispatcher (`tools/generate/src/cli/index.ts:797`) and is
only reachable through `--multi-viewport`, which renders and serves a real site — so
it cannot be driven headlessly. I covered what is honestly reachable: the flags parse
as three independent booleans (so precedence is a dispatcher decision, not a parse
artifact — the `parseArgs` boundary the sibling AC-656 test already uses), and the
two candidate documents are observably different shapes (causes carry `disposition`,
collapsed rows carry `repairClass`), so which one wins is a real distinction. **The
precedence branch itself remains unproven by test.** Recording it rather than
claiming the clause closed.

## Observation for the assessor — a possibly-unreachable classifier rule

AC-1288's fourth classification case is "section spacing" — `collapseMultiViewport`
marks a defect structural when `text` starts with `§` and `property` starts with
`padding` (`fidelity.ts:354`). But AC-1313 retired the band-padding **comparison**,
and `§<n>` rows only ever carry `overlay`, `contentAnchor` or `textAlign` now
(`values-diff.ts:2555-2583`). So that rule appears unreachable through
`diffManifests` today. I tested it by constructing the delta directly — legitimate,
since `collapseMultiViewport`'s input is a `StateDiff[]` and the classifier is what
is under test — and flagged it here rather than acting: deciding whether the rule is
dead code or a still-wanted contract for a section-spacing axis that may return is
above this level's remit.

## Code Edits (if any)

None this call.

## Remaining Violations (3) — all W1 browser-gated, plan for the next call

| Finding | AC | FC evidence | Gating |
|---|---|---|---|
| 6 | AC-1310 | `tests/bug25-multiline-run-geometry.test.ts:102-182` | 4 of 5 are `itB`; one plain `it` available to carry the AC number |
| 10 | AC-1314 | `tests/bug16-webfont-load-before-extract.test.ts:94-170` | 3 of 5 are `itB`; two plain `it` available |
| 12 | AC-1316 | `tests/bug24-scrim-alpha.test.ts:185,202` | **both** capture-side tests are `itB` — no headless case exists to port |

Plan, following warning W1's first option and the treatment already applied to
AC-1307 in call one: for AC-1310 and AC-1314, put the AC number on at least one
browser-independent case each so neither reports covered while contributing nothing
headlessly. AC-1316 has no such case, so it needs one authored — the scrim-alpha
capture is a `color-mix()` resolution, which (like AC-1307's oklch clause) genuinely
needs a real engine, so the likely outcome is a headless jsdom case over
`EXTRACT_SCRIPT` for the "does not invent a scrim on a plain band" negative plus an
explicit gating note recorded on the AC.

No Chromium is provisioned in this runner, so any browser-gated case authored next
call will be reported as authored-but-unexecuted, as `test_UAT_AC1307_oklch_…` was.

## needs_review Items Forwarded

None. No finding was categorised `needs_review`, and none of the three remaining
requires an operator decision.
