---
uid: report-01a7f3a5
id: REPORT-931
type: report
title: 'Capability-Intent Alignment: Capture-to-L1 Reproduction Fold (level=uat)'
created_by: xgd
created_at: '2026-07-24T09:41:50.139356+00:00'
updated_at: '2026-07-24T09:41:50.139356+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-2049c9ec
  level: uat
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Capture-to-L1 Reproduction Fold
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

## Cumulative Intent Considered

At uat level the AC bodies are the working reference (AC-level cycle passed first);
intent is consulted only if an AC looks suspicious — none did.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (contains REQ-83) | free_and_reconciled | merged edeb1c2c | Adds the capture→L1 fold: one L1 doc + geometry keyframes + interpolate/snap + visibility rules + advisory hint sidecar; supersedes pre-L1 adopt-values | YES |

Single story STORY-84 (story_kind=feature, completed), 8 active ACs (AC-689…696),
all internally consistent with the story body — no forced intent walk.

## Alignment Ledger

Every active AC maps to exactly one substantive AC-tagged UAT in
`tests/reconciliation-l1-fold.test.ts`, driving the real
`cmdCapturePage`/`foldToL1`/`captureStructuralHints`/`renderL1Document` entry
points (thin-mock only at the browser boundary via `FakeDriver`).

| Element (AC → test) | Exercises AC? | Outcome |
|---|---|---|
| AC-689 → test_UAT_AC689_capture_emits_one_validated_l1_document | l1.json exists, validateL1 ok, widths==ladder, root kind==box, empty ladder throws | aligned |
| AC-690 → test_UAT_AC690_retains_raw_ladder_as_acceptance_oracle | multistate.json retained, oracle widths == folded widths == ladder | aligned |
| AC-691 → test_UAT_AC691_each_node_carries_keyframe_per_width_matching_box | keyframe per width, x/y/width == rounded captured box, typography from widest sample | aligned |
| AC-692 → test_UAT_AC692_fluid_folds_interpolate_reflow_folds_snap | fluid node segments==['interpolate'], reflow node==['snap'] | aligned |
| AC-693 → test_UAT_AC693_subrange_node_carries_bounded_visibility_rule | subrange node fromPx==1024, full-range node visibility undefined | aligned |
| AC-694 → test_UAT_AC694_capture_emits_advisory_structural_hint_sidecar | hints.json, breakpoints ascending, percent widthUnit; real-Chromium branch checks parent flex+justify-content+real @media | aligned |
| AC-695 → test_UAT_AC695_folded_document_renders_without_hint_sidecar | fold validates, renderL1Document emits html/css with no sidecar in scope | aligned |
| AC-696 → test_UAT_AC696_adopt_values_command_removed | adopt-values → exit 1 "Unknown command", symbols gone; adopt-gaps still recognized | aligned |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | consistency | AC-693 → test_UAT_AC693 | — | The criterion also describes an upper-bound visibility rule (absent above last present width); the UAT exercises only the lower-bound case — which is exactly what AC-693's own Verification section asks for. No drift: test matches AC verification. | none |
| 2 | info | consistency | AC-694 → test_UAT_AC694 | — | The always-run assertions read canned hints via FakeDriver (acceptable thin-mock at the browser boundary); the genuine relationship assertions (parent flex layout, justify-content, real @media 600) run on the real-Chromium branch and skip cleanly when Chromium is absent. Substantive via a real entry point. | none |

## Notes for the Editor

- No violations, warnings, or needs_review. All 8 active feature ACs have exactly
  one substantive, correctly-scoped UAT; each test asserts its AC's behavior against
  real production entry points, not AST/structural shims.
- Exclusivity is clean. A sibling file `tests/req83-capture-to-l1-fold.test.ts` covers
  overlapping behavior under `test_UAT_FC_REQ-83_*` naming — these are the original
  free-coded regression UATs (a different test lineage/shape, not AC-tagged), so they
  are complementary coverage, not same-shape duplicates.
