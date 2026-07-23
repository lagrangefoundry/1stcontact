---
uid: report-ac65464a
id: REPORT-852
type: report
title: 'UAT Coverage: 1c Values-Diff Fidelity'
created_by: xgd
created_at: '2026-07-23T11:45:55.966093+00:00'
updated_at: '2026-07-23T11:45:55.966093+00:00'
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

Chronological ledger of intents that touched this capability. STORY-75 carries
`intent_uid=bundle-ab9e0cb6` (BUNDLE-6) and `updated_by=bundle-31e474b9`
(BUNDLE-7). Both bundles are `free_and_reconciled` and both are purely additive
(every axis is backward-tolerant — a value absent on either side is skipped, so
each closure can only reduce false negatives). No intent retires any behavior.

| Intent ID | Status | Asked / changed | Counts? |
|---|---|---|---|
| BUNDLE-6 (REQ-58 +59+62+61) | free_and_reconciled | gigabytealchemy re-import pass 3; framework gaps it forced landed the intrinsic-value fidelity closures: rendered-text extent, composited surface fill, box border, duplicate-text pairing, and the fontLoad false-positive correction | YES |
| BUNDLE-7 (REQ-63 +79+82+83+84…) | free_and_reconciled | coverage audit — enumerate every render-affecting CSS axis and close each blind spot: typography treatments (font-style/decoration/transform/small-caps/marker), element effects (backdrop-filter/outline/blend/pseudo/opacity), border line style + text-run border, image object-position | YES |

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-75 | BUNDLE-6 (REQ-58), BUNDLE-7 (REQ-63) | aligned | All 7 closures in the body map to a reconciled, additive intent. Deferred residuals (glyph-shape hashing, per-side border colours, inline-SVG fill) are documented as out-of-scope deferrals, not as claimed behavior — no stale claim. |

## Findings — Categorized by Editor Action

No violations, warnings, or needs_review items. Every active AC is substantively
covered by a passing UAT that drives the real diff engine.

## Evidence Verification

The two reconciliation UAT files were read in full and executed — **10 passed
(2 files)** on this branch:

- `tests/reconcile-values-diff-fidelity.test.ts` — AC-629, AC-630, AC-631,
  AC-632, AC-633
- `tests/reconcile-values-diff-treatments.test.ts` — AC-711, AC-712, AC-713,
  AC-714, AC-715

Evidence-validity checks (all pass):

- **Real entry point.** Every UAT drives the exported `diffManifests` — the exact
  code path the `1c values-diff` CLI runs (`tools/generate/src/cli/capture/values-diff.ts:1697`).
  AC-631 additionally drives the real capture entry point `cmdCapturePage`
  (`.../capture/capture.ts:34`) against a committed fixture, so the browser-side
  alpha compositing is measured, not mocked.
- **Not a shim.** Every axis under test is implemented in the production diff
  engine (renderedTextBox 28 refs, surfaceFill 18, border 55, fontStyle 11,
  textDecoration 12, textTransform 13, fontVariant 11, listMarker 13,
  backdropFilter 13, blendMode 13, objectPosition 10, fontLoad 10, opacity 54 —
  all in `tools/generate/src`, non-test). No internal component is mocked.
- **Discriminating observations.** Each UAT asserts all three legs the AC
  prescribes: the differ leg (a genuine difference surfaces the delta), the
  match leg (equal values → none), and the guarded-absent leg (field missing on
  either side → none, proving backward-tolerance). AC-629 additionally asserts
  the negative (a rendered-extent delta fires while the computed font-size delta
  does NOT), which is the whole point of that closure. Severity tiers are
  asserted where the AC specifies them (MEDIUM treatments, LOW opacity).
- **AC-631 capture-leg degradation.** The live-Chromium capture leg degrades to
  the deterministic diff assertions if the browser is unavailable or crashes
  under load (mirroring sibling capture UATs). This is an acceptable
  external-boundary allowance — when the capture returns it is asserted in full
  (blended tint, not #ffffff, within ±5 per channel), and the core diff claim is
  always asserted regardless.

## Notes for the Editor

Nothing to action. This capability's story body, ACs, and UATs form a coherent,
intent-aligned, substantively-covered set. The one item worth remembering for
future rounds: the deferred residuals named in the STORY-75 "Out of scope"
clause (glyph/icon shape hashing, independent per-side border colours, inline-SVG
fill) are intentional deferrals — if a later intent picks any of them up, that is
an *incomplete* finding to add an AC for, not a *stale* one to trim.
