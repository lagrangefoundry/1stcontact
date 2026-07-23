---
uid: report-bc9e7a68
id: REPORT-793
type: report
title: 'UAT Coverage: Capture-to-L1 Reproduction Fold'
created_by: xgd
created_at: '2026-07-23T07:16:56.451468+00:00'
updated_at: '2026-07-23T07:16:56.451468+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-2049c9ec
  violations: 0
  warnings: 2
  needs_review_count: 0
---

# UAT Coverage Assessment: Capture-to-L1 Reproduction Fold

**Result**: PASS
**AC verdicts**: 8 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability (via story-8acc338d, intent = BUNDLE-7).

| Intent ID | Status | Asked / changed | Counts? |
|---|---|---|---|
| REQ-79 | free_and_reconciled | Framework pivot: L1 layout substrate + capability modules | YES |
| REQ-82 | free_and_reconciled | L1 substrate + safety envelope (schema, renderer) | YES |
| REQ-83 | bundled in BUNDLE-7 (free_and_reconciled) | Capture→L1 fold: keyframes + oracle + structural hints | YES |
| REQ-84 | bundled in BUNDLE-7 | Strip layout modules to L1 | YES |
| REQ-85 | free_and_reconciled | Capability-module contract | YES |
| REQ-86 | bundled | Reproduce a site end-to-end (3-probe) in the new system | YES (imminent) |
| REQ-66 | ready_to_reconcile | adopt-values (pre-L1 path) — superseded by the fold | YES (imminent) → supports AC-696 removal |
| REQ-90 | free_coded | L1 document-level resource table | NOT reconciled — future extension, does not retire ACs |
| REQ-91 | free_coded | Extend L1 axes for captured pixel-movers | NOT reconciled — future extension |
| REQ-92 | free_coded | Rebuild foldToL1 to full L1 language (image/box/container) | NOT reconciled — would later supersede the "text leaves only" divergence note; not yet active here |

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-84 (story-8acc338d) | REQ-83, REQ-79/82/84/85/86, REQ-66 | aligned | Divergence note "fold emits text leaves only" verified against fold.ts (emits kind:'text' under a box root only). REQ-92 would change this but is free_coded, not reconciled — the note is an accurate, deliberate scope boundary, not stale drift. |

## Findings — Categorized by Editor Action

No violations and no needs_review items. Two non-blocking warnings.

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | uat | AC-693 | uat-edit | test_UAT_AC693 exercises only the lower-bound (`fromPx`) visibility case; the AC also specifies an upper-bound (`toPx`) rule for a node absent above its last present width. That branch is untested. | Add a projection set where a node is present only below a breakpoint; assert a `toPx` upper-bound visibility rule. |
| 2 | warning | uat | AC-694 | uat-edit | The genuine parent-computed-layout extraction (flex/justify-content, real @media) is Chromium-gated and skips cleanly without an engine; the always-run assertions check ascending breakpoints + a percent widthUnit against canned FakeDriver hints. Substantive extraction is proven only when Chromium is present. | Optional: assert the canned sidecar carries a non-null `parentLayout`/`position` shape in the engine-free path, so the always-run branch exercises more of the sidecar contract. |

## Coverage Evidence

Each AC is covered by a dedicated, substantive UAT (real entry points; only the browser driver is thin-mocked). All 12 UATs pass (`tests/reconciliation-l1-fold.test.ts` + `tests/req83-capture-to-l1-fold.test.ts`, 2.18s).

| AC | UAT | Entry point exercised | Verdict |
|---|---|---|---|
| AC-689 | test_UAT_AC689_capture_emits_one_validated_l1_document | cmdCapturePage → l1.json + validateL1; empty ladder → foldToL1 throws | pass |
| AC-690 | test_UAT_AC690_retains_raw_ladder_as_acceptance_oracle | cmdCapturePage → multistate.json widths == l1 widths | pass |
| AC-691 | test_UAT_AC691_each_node_carries_keyframe_per_width_matching_box | foldToL1 → keyframe x/y/width == captured box, typography from widest | pass |
| AC-692 | test_UAT_AC692_fluid_folds_interpolate_reflow_folds_snap | foldToL1 → interpolate vs snap segment classification | pass |
| AC-693 | test_UAT_AC693_subrange_node_carries_bounded_visibility_rule | foldToL1 → fromPx bound vs no rule (lower bound only — warning 1) | pass |
| AC-694 | test_UAT_AC694_capture_emits_advisory_structural_hint_sidecar | cmdCapturePage + captureStructuralHints (real Chromium branch) | pass |
| AC-695 | test_UAT_AC695_folded_document_renders_without_hint_sidecar | foldToL1 + renderL1Document standalone, no sidecar | pass |
| AC-696 | test_UAT_AC696_adopt_values_command_removed | cli.run(['adopt-values']) → exit 1 + unknown; adopt-gaps intact | pass |

## Notes for the Editor

No editor action is required for pass/fail. The two warnings are optional test hardening (an upper-bound visibility case for AC-693; broader engine-free assertions for AC-694) and can be deferred. Watch the free_coded REQ-92 rebuild: when it reconciles, the story's "text leaves only" divergence note and the fold's leaf-kind coverage should be revisited together — new ACs/UATs for image/box/container leaves will be needed at that point.
