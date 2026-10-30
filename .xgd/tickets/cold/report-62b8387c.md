---
uid: report-62b8387c
id: REPORT-792
type: report
title: 'Capability-Intent Alignment: Capture-to-L1 Reproduction Fold (level=uat)'
created_by: xgd
created_at: '2026-07-23T07:12:05.363099+00:00'
updated_at: '2026-07-23T07:12:05.363099+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-2049c9ec
  level: uat
  violations: 0
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: Capture-to-L1 Reproduction Fold
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 2
**Needs review**: 0

## Cumulative Intent Considered

The capability's stories carry a single intent handle: `bundle-31e474b9`
(BUNDLE-7), status `free_and_reconciled` (counts YES). It reconciles the
framework-pivot / reproduction-fold requirement set to main at
`edeb1c2c00d0c194a45cf590bed3641a6cf82d60`.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (REQ-63 + REQ-79 + REQ-82 + REQ-83 + REQ-84 + 2 more) | free_and_reconciled | merged @ edeb1c2c | REQ-83 fold (capture ladder → one absolute-base L1 doc; geometry keyframes; interpolate/snap; visibility rules); REQ-79 absolute-base D1 form; advisory hint sidecar; supersession of pre-L1 `adopt-values` | YES |

At uat level the AC bodies are the working reference; intent history was
consulted only to confirm no AC describes retired behaviour. It does not:
STORY-84's in-scope list (fold → one L1 doc, oracle retention, keyframes +
interpolate/snap, visibility rules, advisory sidecar, `adopt-values`
supersession) maps 1:1 onto AC-689…696, and the story's own divergence note
("fold currently emits text leaves only; text-free nodes deferred") is honoured
by the tests, which fold text leaves exclusively.

## Alignment Ledger

Story: STORY-84 (story-8acc338d, story_kind=feature) — aligned to BUNDLE-7.
One UAT per AC in `tests/reconciliation-l1-fold.test.ts`. Every UAT exercises
real production code (`cmdCapturePage`, `foldToL1`, `validateL1`,
`renderL1Document`, `cli.run`); only the browser driver is faked, at the
external boundary.

| AC | UAT | Exercises AC? | Outcome |
|---|---|---|---|
| AC-689 (one validated L1 doc spanning ladder; container root; empty ladder → explicit error) | test_UAT_AC689_capture_emits_one_validated_l1_document | real `cmdCapturePage` writes `l1.json`; asserts `validateL1().ok`, `widths==LADDER`, `root.kind=='box'`; `foldToL1([])` throws | aligned |
| AC-690 (raw ladder retained as oracle over same widths) | test_UAT_AC690_retains_raw_ladder_as_acceptance_oracle | asserts `multistate.json` present, oracle widths == folded `widths` | aligned |
| AC-691 (keyframe per width == captured box; typography from widest sample) | test_UAT_AC691_each_node_carries_keyframe_per_width_matching_box | folds 3-width node; asserts `keyframes.at`, per-width `x/y/width`==round(box), `axes.fontSizePx`==widest(44) | aligned |
| AC-692 (fluid→interpolate, reflow→snap) | test_UAT_AC692_fluid_folds_interpolate_reflow_folds_snap | folds one fluid + one horizontally-jumping node; asserts `segments`==['interpolate'] / ['snap'] against real `segmentKind` (fold.ts:83) | aligned |
| AC-693 (subrange node → bounded visibility; full-range → none) | test_UAT_AC693_subrange_node_carries_bounded_visibility_rule | asserts `fromPx==1024` for wide-only node, `visibility undefined` for all-widths node | aligned (warning: upper-bound `untilPx` branch untested) |
| AC-694 (advisory hint sidecar: parent layout, sizing unit, ascending @media) | test_UAT_AC694_capture_emits_advisory_structural_hint_sidecar | asserts `hints.json` present, ascending breakpoints, percent width unit; real-browser branch asserts flex parentLayout, justify-content=space-between, @media 600 | aligned (warning: substantive assertions env-gated) |
| AC-695 (folded doc renders complete without hint sidecar) | test_UAT_AC695_folded_document_renders_without_hint_sidecar | `renderL1Document(doc)` (no hints param) → html contains text + `<p`, css non-empty | aligned |
| AC-696 (`adopt-values` removed; `adopt-gaps` unaffected) | test_UAT_AC696_adopt_values_command_removed | `cli.run(['adopt-values',...])` → exit 1 + "Unknown command"; asserts 4 symbols unexported; `adopt-gaps` still recognized + `cmdApplyGapFixes` present | aligned |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | coverage | test_UAT_AC693 (acceptance_criterion-a6bce556) | uat-edit | AC-693's criterion enumerates two directional behaviours — a lower bound (absent below first present width) AND an upper bound (absent above last present width). Production implements both (`fold.ts:94-102`, emits `untilPx`). The UAT asserts only the lower-bound `fromPx` case + the no-rule case. The upper-bound (`untilPx`) branch is never exercised. Note: the AC's own Verification clause only requires the lower-bound + none cases, so the test matches its Verification — the gap is criterion-vs-test, not a Verification violation. | Add a node present only *below* a breakpoint (absent at the wider widths) and assert its `visibility.untilPx` equals its last present width. |
| 2 | warning | consistency | test_UAT_AC694 (acceptance_criterion-c8dd43d2) | uat-edit | The always-run assertions run against the hardcoded `CANNED_HINTS` fixture (breakpoints ascending, one `percent` node) and are near-circular. The substantive assertions that match the AC's Verification (real parent flex layout, `justify-content=space-between`, real `@media 600`) live behind `if (!(await chromiumAvailable())) return` and skip silently when Chromium is absent. Chromium IS installed in this regression env, so the branch runs substantively *here*; the risk is a Chromium-less runner reducing the AC to circular fixture checks. Separately, the criterion enumerates ancestry, position mode, sibling-repetition count, gap, and grid-template-columns; none are asserted even in the real branch (the AC's Verification does not require them, so this is not a violation). | Make at least one non-circular assertion unconditional (e.g. drive the fold/hint pass over a static fixture that does not require a live browser), or gate the whole test skip so a Chromium-less run reports "skipped" rather than passing on canned data. |

## Notes for the Editor

- No violations and no needs_review: the eight ACs map cleanly onto the story's
  in-scope surface and onto BUNDLE-7's reconciled asks; every AC has exactly one
  substantive, real-code UAT; no two UATs redundantly verify the same scenario
  in the same shape (AC-689/AC-690 both call `cmdCapturePage` but assert
  disjoint properties — L1 validity vs oracle retention).
- Both warnings are test-completeness nuances within otherwise-aligned ACs, not
  intent drift. They may be repaired opportunistically and do not block the uat
  level.
- The test file is named `reconciliation-l1-fold.test.ts` and its header frames
  the UATs as reconciliation of the existing capture→fold pipeline, while the
  story's `story_kind` is `feature`. This naming/kind mismatch is cosmetic at
  the uat level (the tests still bind to and exercise the ACs) and is out of
  scope for an alignment check; flag only if a downstream story-level pass wants
  the kind reconciled.
