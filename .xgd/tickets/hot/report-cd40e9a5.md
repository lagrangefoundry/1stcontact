---
uid: report-cd40e9a5
id: REPORT-848
type: report
title: 'UAT Coverage: 1c Gradient Fidelity'
created_by: xgd
created_at: '2026-07-23T11:26:35.671252+00:00'
updated_at: '2026-07-23T11:26:35.671252+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-36dd68c5
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# UAT Coverage Assessment: 1c Gradient Fidelity

**Result**: PASS
**AC verdicts**: 5 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability (all via BUNDLE-6, `free_and_reconciled`, merged_at_commit `7a42e182`):

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-59 | free_and_reconciled (BUNDLE-6) | 2026-07 | Capture text-fill gradient stop *positions* (offsets) so values-diff can compare them (closes the "wordmark orange too soon" blind spot) | YES |
| REQ-62 | free_and_reconciled (BUNDLE-6) | 2026-07 | Panel/card *surface* gradient: capture (skip text-fill, stop at first opaque solid), diff (new surfaceGradient axis), author (`gradient` content value → `resolveSurfaceGradient` → background-image fill) | YES |
| REQ-84 | reconciled (context) | 2026-07 | Removed the semantic layout modules (text-block/hero/etc.); no module now owns a padded/rounded gradient-panel render (the resolver is exported for any surface) | YES (retired the module render) |

Cumulative intent: gradients are a first-class captured/diffable/authorable value across BOTH text-fill and panel-surface kinds. Homing the resolved surface fill onto a specific module render is explicitly out of scope (and its former host, text-block, was retired by REQ-84).

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-76 (story-82eb6908) | REQ-59, REQ-62 (+ REQ-84 for out-of-scope render) | aligned | Story body's in-scope/out-of-scope split matches intent exactly; every promised behavior (capture, diff, author, validate) is backed by a substantive real-entry-point UAT |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | ac | AC-637 | ac-edit | AC *title* ("A text-block authored with a gradient panel renders a padded, rounded panel...") describes the module render that is OUT OF SCOPE per the story and whose host module (text-block) was retired by REQ-84. The AC *criterion body* and its UAT correctly test only the in-scope `resolveSurfaceGradient` resolver returning a `background-image` declaration. Behavior is covered; only the title is stale. | Retitle AC-637 to describe the resolver behavior it actually tests, e.g. "A gradient content value resolves via resolveSurfaceGradient to a background-image surface fill (absolute-or-overlay stops; no fill when under-specified)". Do NOT re-scope the criterion or test — they are correct. |

## Evidence Notes (per AC)

- **AC-634** (stop-position drift → delta): `test_UAT_AC634_...` (reconcile-gradient-first-class.test.ts) drives the real `diffManifests` engine: wordmark stop at 60% vs 40% → gradient delta; 60% vs 61% (sub-±2pp) → none. Substantive — distinguishes a positions-aware engine from a colour-only one. PASS.
- **AC-635** (positionless stops → colour-only): `test_UAT_AC635_...` real `diffManifests`; both-null and one-null offset pairs with matching colours/direction → no delta. Proves absent offsets never fabricate a false position delta. PASS.
- **AC-636** (surface-gradient present/missing/absent): `test_UAT_AC636_...` real `diffManifests`, `surfaceGradient` axis: ref-gradient vs flat repro → delta; matching → none; neither → none. Backed by real diff impl (values-diff.ts:2136). PASS. (Minor: the "differing gradient" sub-case is exercised via the sibling req62 suite's matching/missing pair rather than a distinct differing-stops case; core false-match blind spot is fully covered.)
- **AC-637** (resolver authors surface fill): `test_UAT_AC637_...` (req62-gradient-panel.test.ts) calls the real `resolveSurfaceGradient` → exact `background-image: linear-gradient(135deg, #f1f5f9 0%, var(--color-accent) 100%)` (absolute hex stays literal, palette role → overlay var); single stop → empty declaration. PASS.
- **AC-638** (gradient content-field validation): `test_UAT_AC638_...` real `validateModuleContent` on a synthetic gradient-field meta: well-formed → no errors; non-object (string) → error naming the field. PASS.
- **Capture coverage (story-level, no AC number but substantive):** `test_UAT_FC_REQ-59_capture_records_positions_from_dom` (real Chromium, asserts exact offsets 0/60/90/100) and `test_UAT_FC_REQ-62_capture_records_panel_gradient_and_solid` (real Chromium, asserts surfaceGradient angle+stops AND the composited solid #e8dfd3) cover the story's "capture of stop positions and surface gradients" promise end-to-end.

## Notes for the Editor

- No coverage gaps and no retired/unsupported ACs. All five ACs are active per cumulative intent (REQ-59 + REQ-62) and substantively covered using real entry points (`diffManifests`, `resolveSurfaceGradient`, `validateModuleContent`, real Chromium capture) — no internal mocking anywhere in the two suites.
- The single warning is cosmetic drift: AC-637's title outlived the REQ-84 removal of the text-block module. Its criterion body was correctly rewritten to the resolver seam; only the human-readable title lags. A one-line retitle clears it. This does not affect the PASS verdict.
