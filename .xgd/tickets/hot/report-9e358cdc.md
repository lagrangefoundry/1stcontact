---
uid: report-9e358cdc
id: REPORT-892
type: report
title: 'Capability-Intent Alignment: 1c Values-Diff Fidelity (level=story)'
created_by: xgd
created_at: '2026-07-24T06:43:41.612437+00:00'
updated_at: '2026-07-24T06:43:41.612437+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-aa030c83
  level: story
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Values-Diff Fidelity
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

## Cumulative Intent Considered

STORY-75 (`story-d5de22a5`, story_kind=upgrade) links to two reconciled intent
bundles. Chronological ledger:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 (`bundle-ab9e0cb6`) = REQ-58 + REQ-59 + REQ-62 + REQ-61 | free_and_reconciled | 2026-07-17 (main 7a42e18) | REQ-58 landed the values-diff fidelity closures during the gigabytealchemy re-import: T1 rendered-text extent (`renderedTextBox`), T5 alpha-composited surface fill, T7 box-border axis, T14 duplicate-text pairing by nearest centre. REQ-59=gradient stops (separate story). REQ-62=literal widths/length model (authoring). REQ-61 bundled. | YES |
| BUNDLE-7 (`bundle-31e474b9`) = REQ-63 + REQ-79 + REQ-82 + REQ-83 + REQ-84 + 2 more | free_and_reconciled | 2026-07-22 (main edeb1c2) | REQ-63 coverage audit closed typography treatment axes (fontStyle/textDecoration/textTransform/fontVariant/listMarker), element effect axes (backdropFilter/blendMode/opacity/outline/pseudo), border style + box-border on text runs, objectPosition; documented deferred residuals (glyph-shape hashing, per-side border colours, inline-SVG fill). REQ-79 pivot landed the fontLoad false-positive correction (measurement spine — explicitly KEPT). REQ-82/83/84/+2 = L1 substrate / envelope security / capability modules (other capabilities). | YES |

Both bundles `free_and_reconciled` → fully count toward cumulative intent.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-75 (`story-d5de22a5`) | REQ-58 (via BUNDLE-6, intent_uid), REQ-63 + REQ-79 (via BUNDLE-7, updated_by) | aligned — all seven documented axes trace to a reconciled intent; deferred residuals match REQ-63; no retired behavior described |

Per-item trace (consistency + coverage evidence):

| Story item | Origin intent | Evidence |
|---|---|---|
| 1. Rendered-text extent (renderedTextBox, ratio 1.2%) | REQ-58 T1 | code tag `REQ-58 (T1)` at `tools/generate/src/cli/capture/extract.ts:755`, `values-diff.ts:115` |
| 2. Composited surface fill (alpha-aware) | REQ-58 T5 | BUNDLE-6 body "T5 — capture accuracy: alpha compositing"; `surfaceFillOf()` Porter-Duff composite |
| 3. Box-border axis + line style + text-runs | REQ-58 T7 (box-border) + REQ-63 (style + text-run capture) | BUNDLE-6 "T7 — blind spot 1: box-border axis"; BUNDLE-7 REQ-63 border-cluster implementation |
| 4. Duplicate-text pairing by nearest position | REQ-58 T14 | BUNDLE-6 "T14 — duplicate-text pairing by nearest position" |
| 5. Typography treatment axes | REQ-63 | BUNDLE-7 REQ-63 Implementation "Typography (per text run)" |
| 6. Element effect axes | REQ-63 | BUNDLE-7 REQ-63 Implementation "Effects (per element)" + Media objectPosition |
| 7. fontLoad false-positive correction | REQ-79 | BUNDLE-7 REQ-79 reconcile note: `9ca73953` fontLoad false-positive fix — measurement spine, KEEP |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | coverage | STORY-75 | — | REQ-63 scope enumerated "Border/rule GEOMETRY (a bar's height + offset)" as a blind spot, but REQ-63's reconciled Implementation section neither closes it nor lists it as a deferred residual. STORY-75 deliberately scopes item 3 as the uniform box border "distinct from an asymmetric accent bar." Bar/rule geometry is handled by the geometry-aware values-diff landed under REQ-58 (a separate geometry-fidelity concern), so this is not a gap in the values-diff-fidelity value-axis capability. | none — observation for future drift-watching |

## Notes for the Editor

- Clean single-story capability; no exclusivity risk. All seven story axes trace
  to reconciled intent (REQ-58 / REQ-63 / REQ-79); intent linkage
  (intent_uid=BUNDLE-6, updated_by=BUNDLE-7) is complete for the described surface.
- Consistency is clean specifically because the REQ-79 framework pivot, which
  retired the semantic *layout* modules, explicitly preserved the capture +
  values-diff measurement spine and the fontLoad fix — the exact surface this
  story documents. No story text references a retired feature.
- The story's out-of-scope list (gradient axes, viewport-ladder diffing,
  perceptual pixel diff, authoring dials) correctly delegates to sibling
  capabilities (REQ-59 gradient, REQ-58 T2 multi-viewport, REQ-62 length model),
  none of which should appear in this capability's story tree.
