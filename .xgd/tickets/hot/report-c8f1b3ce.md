---
uid: report-c8f1b3ce
id: REPORT-895
type: report
title: 'UAT Coverage: 1c Values-Diff Fidelity'
created_by: xgd
created_at: '2026-07-24T07:04:02.245728+00:00'
updated_at: '2026-07-24T07:04:02.245728+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-aa030c83
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# UAT Coverage Assessment: 1c Values-Diff Fidelity

**Result**: PASS
**AC verdicts**: 10 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| bundle-ab9e0cb6 (REQ-58 gigabytealchemy.ai pass-3 bundle) | free_and_reconciled | 2026-07-19 | Landed the values-diff fidelity closures: rendered-text extent, composited surface fill, box border (+line style, text-run capture), duplicate-text positional pairing, per-run typography treatments, element effects, object-position, and fontLoad reverse-direction correction | YES |

The capability has exactly one story (STORY-75, story_kind=upgrade), reconciled by the REQ-58 bundle. No later intent retires or modifies any of these axes; every AC is active.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-75 | bundle-ab9e0cb6 (REQ-58) | aligned | Body's 7 closures map cleanly onto the 10 ACs; every behavior it claims is supported by the reconciled bundle. No stale or unsupported claims. |

## Findings — Categorized by Editor Action

None. Zero violations, zero warnings, zero needs_review.

Every active AC is substantively covered by a real-engine UAT:

| AC | UAT | Substantive? |
|---|---|---|
| AC-629 rendered-text-extent delta when computed font values match | test_UAT_AC629_rendered_text_extent_delta_when_font_values_match | yes — asserts extent delta fires AND fontSizePx does not |
| AC-630 extent suppresses non-differences, honours --tolerant | test_UAT_AC630_rendered_text_extent_suppresses_and_honours_tolerant | yes — sub-pixel/one-sided suppressed; 1.9% fires then absorbed by --tolerant |
| AC-631 surface fill = effective alpha-composited colour | test_UAT_AC631_surface_fill_is_composited_alpha_colour | yes — blended tint ≠ raw white; opaque-white repro flagged, blended-match clean |
| AC-632 box-border delta; matching/absent → none | test_UAT_AC632_box_border_delta_cases | yes — colour-diff fires; identical/none produce no delta |
| AC-633 duplicate text paired by nearest position | test_UAT_AC633_duplicate_text_paired_by_nearest_position | yes — reversed-order false swap suppressed; genuine change surfaces; unique unaffected |
| AC-711 typography treatments + list marker per run | test_UAT_AC711_typography_treatments_and_list_marker_per_run | yes — 5 axes × (differ@tier / match / absent-guard) |
| AC-712 element effects captured and compared | test_UAT_AC712_element_effects_captured_and_compared | yes — presence vs value split; opacity LOW tier; match/absent/tolerant guards |
| AC-713 border line style + capture on text runs | test_UAT_AC713_border_line_style_and_capture_on_text_runs | yes — style-only delta labels dashed/solid; legacy-absent skipped; text-run border fires |
| AC-714 object-position compared exactly | test_UAT_AC714_object_position_crop_compared_exactly | yes — differing crop fires; match none; absent guarded |
| AC-715 reference FOUT does not flag correct render | test_UAT_AC715_reference_fout_does_not_flag_correct_render | yes — reverse direction inert; forward defect fires; both-loaded clean |

## Notes for the Editor

- **Evidence quality is high.** Both files (`tests/reconcile-values-diff-fidelity.test.ts`, `tests/reconcile-values-diff-treatments.test.ts`) drive the real exported `diffManifests` engine — the exact code path the `1c values-diff` CLI runs — with realistically-shaped `ValueManifest` inputs. No internal mocking. Each UAT carries the positive (delta fires), negative (match → none), and backward-tolerant guard (field absent → none) legs its AC calls for, and asserts tier/label where the AC specifies one. Each closure can therefore only *reduce* false negatives, consistent with the capability's "0 value-diffs ⟺ pixel-faithful" mandate.
- **Verified rather than assumed:** ran both files under vitest in this worktree — 2 files, **10 passed**, 1.55s. So the coverage is live evidence, not stale index state.
- **Environmental note (not a coverage finding):** the `.xgd/uat_index.json` in this fresh regression worktree lists all 10 UATs as `status: missing` — a stale phantom-count artifact of the gitignored index not being rebuilt post-build, NOT absent tests. The test functions exist and pass. The operator should rebuild the UAT index in fresh regression checkouts before trusting its run-status counts.
