---
uid: report-5dbbbd44
id: REPORT-851
type: report
title: 'Capability-Intent Alignment: 1c Values-Diff Fidelity (level=uat)'
created_by: xgd
created_at: '2026-07-23T11:40:33.058806+00:00'
updated_at: '2026-07-23T11:40:33.058806+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-aa030c83
  level: uat
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Values-Diff Fidelity
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

## Cumulative Intent Considered

Story-d5de22a5 (STORY-75, `story_kind: upgrade`) is the sole story under CAP-63.
It was created by BUNDLE-6 and last updated by BUNDLE-7 — both fully reconciled.

| Intent ID | Status | When (merged_at_commit) | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 (REQ-58 +59+62+61) | free_and_reconciled | 7a42e18 | Fresh gigabytealchemy re-import (pass 3); drove the geometry/surface/pairing fidelity closures — rendered-text extent, composited surface fill, box border, duplicate-text pairing (AC-629…AC-633) | YES |
| BUNDLE-7 (REQ-63 +79+82+83+84+2) | free_and_reconciled | edeb1c2 | REQ-63 coverage audit — "capture + diff every render-affecting CSS axis, close all blind spots"; drove the treatment/effect/media/fallback closures (AC-711…AC-715) | YES |

Both bundles are `free_and_reconciled`, so their asks are fully part of cumulative intent.
No retired/abandoned intent bears on this capability; no imminent (`ready_to_reconcile`) intent is pending. The AC bodies are the working reference at this level and are internally consistent with the story body, so no deeper intent escalation was required.

## Alignment Ledger

At UAT level, each active/pending AC is verified against a substantive test that drives the
real `diffManifests` engine (the exact code path `1c values-diff` runs); AC-631 additionally
drives the real `cmdCapturePage` capture entry point against committed fixture
`tests/fixtures/capture/req58-treatments.html`. On this host `chromiumAvailable()===true`, so
AC-631's real-browser compositing leg executed (not degraded). Nothing internal is mocked.

| AC | Status | UAT | Test file | Exercises AC? |
|---|---|---|---|---|
| AC-629 | active  | test_UAT_AC629_rendered_text_extent_delta_when_font_values_match | fidelity | aligned |
| AC-630 | active  | test_UAT_AC630_rendered_text_extent_suppresses_and_honours_tolerant | fidelity | aligned |
| AC-631 | active  | test_UAT_AC631_surface_fill_is_composited_alpha_colour | fidelity | aligned (real capture) |
| AC-632 | active  | test_UAT_AC632_box_border_delta_cases | fidelity | aligned |
| AC-633 | active  | test_UAT_AC633_duplicate_text_paired_by_nearest_position | fidelity | aligned |
| AC-711 | pending | test_UAT_AC711_typography_treatments_and_list_marker_per_run | treatments | aligned |
| AC-712 | pending | test_UAT_AC712_element_effects_captured_and_compared | treatments | aligned |
| AC-713 | pending | test_UAT_AC713_border_line_style_and_capture_on_text_runs | treatments | aligned |
| AC-714 | pending | test_UAT_AC714_object_position_crop_compared_exactly | treatments | aligned |
| AC-715 | pending | test_UAT_AC715_reference_fout_does_not_flag_correct_render | treatments | aligned |

## Consistency (does each test exercise what its AC claims?)

Verified each UAT body against its AC's Verification recipe:

- **AC-629** → identical computed font (size 24 / weight 300 / serif / ls 0), glyph extent 503→540 (+7.4%); asserts a `renderedTextBox` delta AND no `fontSizePx` delta. Exact match.
- **AC-630** → three cases: 745→742 (-0.4%) none; extent absent on one side (both directions) none; 320→326 (+1.9%) fires by default, absorbed under `{tolerant:true}`. Exact match.
- **AC-631** → real capture asserts `surfaceFill` is the blended tint (≈#ece6dd), not `#ffffff`, within ±5 per channel; then opaque-white repro → `surfaceFill` delta, blended-match repro → none. Exact match.
- **AC-632** → same width/diff colour (#334155 vs #cbbfad) → delta; identical → none; border:null both → none. Exact match.
- **AC-633** → two 'Learn more' runs at top/bottom listed in reversed order → no false `color` delta (positional pairing); real colour change on top → delta; unique string → none. Exact match.
- **AC-711** → loops the five axes (font-style, text-decoration, text-transform, font-variant, list-marker): one-differs → single delta at MEDIUM; matching → none; field-absent-one-side → none. Matches the AC's own Verification recipe.
- **AC-712** → backdrop/outline presence, blend-mode + ::after discrete, opacity exact-numeric LOW; plus match/absent/`--tolerant`-band → none. Exact match.
- **AC-713** → dashed-vs-solid style-only delta whose label carries 'dashed'/'solid'; style-absent-one-side → no style delta; text-run single-side border vs none → delta. Exact match.
- **AC-714** → object-position top vs '50% 50%' → delta; matching → none; absent-one-side → none. Exact match.
- **AC-715** → reference `fontLoaded:false` + repro true → no fontLoad delta; mirror (repro fell back) → delta; both true → none. Exact match.

## Coverage & Exclusivity

- **Coverage**: all 10 child ACs have exactly one substantive UAT (real engine, not a structural/AST check). No active/pending AC is uncovered; no orphan test lacks an AC.
- **Exclusivity**: each UAT targets a distinct AC scenario; no two verify the same scenario in the same shape. No redundancy.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | consistency | AC-711 / test_UAT_AC711 | — | AC-711 notes the list marker reports under its own `marker` *kind* (distinct from the four typography axes' `treatment` kind). The UAT asserts the marker delta surfaces at MEDIUM `tier` but does not assert the `kind` label distinction. This matches the AC's own Verification recipe ("assert a single delta on that axis at the expected severity") — behavioural surface is covered; the kind-label nuance is an internal categorisation detail, not drift. | none (optional: assert `kind==='marker'` if the field is exposed) |

## Notes for the Editor

No drift. Both governing bundles are reconciled; the single upgrade story's AC tree fully and
exclusively expresses their asks at the UAT level, and every AC is proven by a substantive test
against the real `1c` diff/capture code paths (10/10 green; AC-631's real-browser leg ran).
ACs 711–715 carry `status: pending` (vs. 629–633 `active`) — this is a status observation only,
not a coverage gap, since each already has a passing substantive UAT.
