---
uid: report-dd339267
id: REPORT-1732
type: report
title: 'UAT Coverage: L1 Reproduction Pipeline: Fold & Acceptance Gate'
created_by: xgd
created_at: '2026-08-09T08:21:34.076946+00:00'
updated_at: '2026-08-09T08:21:34.076946+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-2049c9ec
  violations: 5
  warnings: 4
  needs_review_count: 0
---

# UAT Coverage Assessment: L1 Reproduction Pipeline: Fold & Acceptance Gate

**Result**: FAIL
**AC verdicts**: 29 pass, 3 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 0 pass, 2 fail, 0 stale, 0 needs_review
**Capability verdict**: fail

CAP-71 (`capability-2049c9ec`) holds two `upgrade` stories with 16 ACs each —
STORY-84 (`story-8acc338d`, the fold) and STORY-86 (`story-24098299`, the 3-probe
gate + cross-gate reconciliation). All 32 ACs are `kind: behavior`, `status:
active`. None is retired by any intent in the ledger, so there are no
`deprecated` verdicts and no `needs_review`.

## Evidence executed this session

```
npx vitest run tests/reconciliation-l1-fold.test.ts \
  tests/reconciliation-l1-fold-full-language.test.ts \
  tests/reconciliation-l1-fold-seams-and-refold.test.ts \
  tests/reconciliation-3probe-gate.test.ts \
  tests/reconciliation-3probe-gate-evaluator.test.ts \
  tests/reconciliation-cross-gate-reconciliation.test.ts --reporter=verbose
```

→ **6 files passed, 32 tests passed, 1.14s.** No `it()` is skipped.

Every one of the 32 ACs has **exactly one** `test_UAT_AC<n>_*` test, and every one
drives a real entry point — `foldToL1`, `cmdCapturePage`, `cli.run`,
`renderL1Document`, `validateL1`, `evaluateLayout`, `sampleFidelityProbe`,
`offSampleProbe`, `contentRobustnessProbe`, `threeProbeGate`, `promoteToFlow`,
`cmdGate`, `cmdL1Gate`, `referenceCoverage`, `formatGateReport`. No AC is covered
only by a structural/AST check, and no test mocks an internal component: the only
stubs are the browser driver (an external boundary) and the offline `--actual-image`
/ `--actual-manifest` seams the product itself exposes. **Bulk coverage is
therefore genuine; three specific ACs and both story bodies are the gaps.**

`chromiumAvailable()` was measured directly in this worktree (via the repo's own
`tools/generate/src/cli/capture` export) and returns **`false`** — load-bearing for
finding 3.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (`bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | REQ-63 + REQ-79 + REQ-82 + REQ-83 (capture→L1 fold, keyframes + oracle + hint extractor) + REQ-84 + REQ-85 + REQ-86 (3-probe gate). Recorded as both stories' `intent_uid` | YES |
| BUNDLE-8 (`bundle-cceaba25`) | free_and_reconciled | 2026-07-29 | BUG-7 (row flow model → AC-734), REQ-90 (resource table → AC-732), REQ-91, REQ-92 (full-language fold → AC-689/729/730/731), BUG-6 (residual signal → AC-733), BUG-8 (breakpoint keyframe → AC-735), BUG-9 (recursive promotion → AC-709), BUG-11 (surfaceFill → AC-730/731/736) | YES |
| BUNDLE-10 (`bundle-4ff83a8b`) | free_and_reconciled | 2026-07-29 | BUG-12 (font faces → AC-732), BUG-13 (section backgrounds → AC-812), **BUG-14** (surface reconstruction is band→card, *retires* the per-run model), **BUG-18** (text axes keyframed per width, *retires* the widest-sample rule), BUG-17/23/24/25, REQ-88, REQ-93 | YES (two retirements) |
| BUNDLE-11 (`bundle-ee56a66e`) | free_and_reconciled | 2026-08-05 | BUG-27 (backdrops/lazy media → AC-812), REQ-94 (cross-gate reconciliation → AC-852…856), REQ-96 (L1 `control` node → AC-733/AC-813), REQ-97…107. Recorded as both stories' `updated_by` | YES |
| BUNDLE-13 / 14 / 16 | free_and_reconciled | 2026-08-06/07 | deploy, R2, palette, edit-render, builder shell — none touches the fold or the gate | YES (no effect here) |

No intent in the ledger retires a whole AC. BUG-14 and BUG-18 each retire a
**clause** of an otherwise-active AC (findings 6 and 7).

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-84 (fold) | REQ-83, REQ-92, REQ-90, BUG-6, BUG-11, BUG-12, BUG-13, BUG-14, BUG-18, BUG-27, REQ-96, REQ-88 | **incomplete** | Body never describes BUG-18's per-width text tracks (`node.responsive`) or REQ-88's `node.responsivePadding`, both shipped in `fold.ts` and both reconciled — finding 5 |
| STORY-86 (gate) | REQ-86, BUG-7, BUG-8, BUG-9, REQ-94 | **aligned, uncovered** | Body is faithful to intent, but its own "pinned-box content overflow" envelope violation is stated by no AC and asserted by no test — finding 4 |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | ac | AC-689 | uat-edit | AC-689 requires the document be emitted "in the **full** L1 language, not text alone", and its Verification says "Fold a capture containing runs, media and painted panels and assert the document contains leaves of more than one kind". `test_UAT_AC689` (`tests/reconciliation-l1-fold.test.ts:207`) drives `cmdCapturePage` with a `FakeDriver` whose `signalsFor()` (`:103`) carries one text run and `items: []`, `fields: []`, `images: []` — one leaf kind. The clause REQ-92 added to this AC has zero evidence on the `cmdCapturePage` bundle path. | Add a media element and a painted panel to `signalsFor()`, then assert the `l1.json` read back from the bundle satisfies `new Set(children.map((n) => n.kind)).size > 1` |
| 2 | violation | ac | AC-691 | uat-edit | AC-691 turns on a height distinction — "a box, image or backing-surface leaf additionally pins its height at every keyframe … a text leaf's keyframes carry no height" — and its Verification names both halves. `test_UAT_AC691` (`:256-290`) asserts `at`, x, y, width and `axes.fontSizePx` and makes **no height assertion at all**. The text-leaf "no height" invariant has zero executable evidence anywhere in the repo, while being live in code (`fold.ts:1741` calls `buildGeometry(false)` for text vs `true` for image/box). A regression that pinned text heights would leave all 32 UATs green. | In `test_UAT_AC691`, assert `kfs.every((k) => k.height === undefined)` for the text leaf, and extend the fixture with one media element and one painted panel asserting each keyframe's `height` equals the captured box height |
| 3 | violation | ac | AC-694 | uat-edit | AC-694 enumerates six sidecar dimensions (ancestry, parent computed layout, authored sizing unit, position mode, sibling-repetition count, ascending `@media` breakpoints). The substantive assertions sit behind `if (!(await chromiumAvailable())) return` (`:364`) — **measured `false` in this worktree this session**, and the UAT completes in 194ms. The always-run path asserts only that `mediaBreakpoints` is sorted and that some node has `widthUnit === 'percent'`, both satisfied by the test's own `CANNED_HINTS` (`:135`) returned verbatim by `FakeDriver.query` (`:164`) — the test mocks the very thing under test. Ancestry, position mode and `repeatCount` are asserted on neither path. | Move the *contract* assertions (per-node `parentId`, `position`, `repeatCount`, non-null `parentLayout` — needs `CANNED_HINTS` enriched) onto the always-run canned path, leaving only extraction *accuracy* engine-gated. Do **not** repair by deleting the skip: chromium genuinely cannot launch here |
| 4 | violation | story | STORY-86 | ac-add + uat-add | STORY-86's body states the evaluator "reports envelope violations (sibling overlap, horizontal clip beyond the viewport, and **pinned-box content overflow**)". The third is real and shipped (`tools/generate/src/l1/probes.ts:409-415` emits `kind: 'clip'` with detail `content height Npx exceeds pinned box height Npx`), but **no AC states it** and `grep` over `tests/` finds **zero** assertions on that detail. AC-710 covers only overlap and the viewport-edge clip. A behavioral claim intent supports, that no AC/test addresses. | Add an AC for the pinned-box content-overflow envelope violation, then a `test_UAT_AC<n>_*` constructing a pinned box whose flow content exceeds its keyframe height and asserting the finding's kind, detail and path |
| 5 | violation | story | STORY-84 | story-body-edit + ac-add + uat-add | BUG-18 (free_and_reconciled) shipped `responsiveTextTracks()` (`fold.ts:621`, applied `:1745` as `node.responsive`) so numeric type axes are keyframed per width instead of pinned at desktop; REQ-88 shipped `node.responsivePadding` (`:1752`). STORY-84's body describes neither — it says only that a text leaf carries "the typography axes". Executable evidence exists (`tests/bug18-responsive-text-axes.test.ts:100`) but is a free-coded test traceable to no AC, so the capability matrix does not own the behavior. | Add the per-width text-axis and padding tracks to STORY-84's body, add an AC for each, and promote the existing bug18/req88 assertions into `test_UAT_AC<n>_*` form |
| 6 | warning | ac | AC-691 | ac-edit | Separate from finding 2: AC-691's closing sentence ("A node's authored typography axes are taken from its widest present sample (the desktop rendering)") is precisely the behaviour BUG-18 was filed to remove. The UAT asserts `axes.fontSizePx === 44`, which still passes only because the widest keyframe equals the scalar. Test consistent with a stale AC. | Rewrite the closing sentence to describe the responsive track, then extend the UAT to assert `node.responsive.fontSizePx.keyframes` |
| 7 | warning | ac | AC-731 | ac-edit | AC-731's body still specifies the per-run model BUG-14 retired ("Every run whose composited surface differs … folds an additional backing box leaf carrying that fill/gradient **and the run's geometry**"), and its Verification clause "runs on that fill emit no backing box" is not assertable as worded — the band runs do coalesce into one shared full-bleed `section-band-*` box. `test_UAT_AC731` asserts the shipped BUG-14 model (1 band + 2 cards for 5 runs) and passes. Test right, AC stale. | Rewrite AC-731 to the band→card model; the UAT already matches and needs no change |
| 8 | warning | ac | AC-736 | ac-edit | AC-736 excludes "a painted surface leaf — a childless box carrying a card/panel/section fill" from the overlap check. The code is narrower: only *fold-synthesized* surfaces are excluded (`isSynthesizedSurfaceId` → `section-band-*` / `section-bg-*` / `card-*`), while a captured standalone `box-*` still participates. `test_UAT_AC736` asserts the code's narrower rule and passes. | Tighten AC-736's wording to "fold-synthesized backing surface"; the UAT needs no change |
| 9 | warning | ac | AC-812 | uat-edit | AC-812's layering clause has two halves — behind the text runs of its band, **and after the section-background boxes it is a peer of**. `test_UAT_AC812` proves the first half twice (leaf index and rendered HTML order) but asserts nothing about the backdrop's position relative to the band/section-bg boxes, though the same fixture already materialises them as `heroBands`. Absolutely-positioned siblings with no z-index paint in source order, so the unasserted half guards the mirror-image defect. | Add `expect(leaves.indexOf(backdrop)).toBeGreaterThan(Math.max(...heroBands.map((b) => leaves.indexOf(b))))` |

## Notes for the Editor

**The coverage problem here is not breadth — it is three specific holes and two
unowned behaviors.** 29 of 32 ACs are covered by discriminating tests over real
entry points, several with explicit non-vacuity guards (`sawGenuineOverlap`,
counterfactual folds with the backdrop removed, byte-identical fidelity reports
before and after recovery). Do not rewrite what is already good.

**Findings 1–3 are third-offence re-raises.** They were filed as REPORT-1320
(2026-08-05), REPORT-1662 (2026-08-07) and REPORT-1731 (2026-08-09) and never
repaired; `tests/reconciliation-l1-fold.test.ts` has not been touched since
`f0367940d` (2026-07-22). All three live in that one file and are a single
focused edit — fixture enrichment in `signalsFor()`/`CANNED_HINTS` plus three
assertions. **Fixing that one file clears every violation at AC level.**

**Findings 4 and 5 are the ones that have never been actioned at all**, because
each needs the matrix edited before a UAT can be written: an AC must exist for
the pinned-box overflow violation (STORY-86) and for the responsive text/padding
tracks (STORY-84) before `test_UAT_AC<n>_*` names can be minted. Both behaviors
are already shipped and, in STORY-84's case, already tested — the work is
matrix-side, not test-side. Sequence: story-body-edit → ac-add → uat-add.

**Findings 6–8 are `ac-edit` only and need no test change** — in all three the
test asserts the shipped behavior correctly and the AC prose lags it. They are
recorded as warnings (not violations) precisely because coverage — the property
this check grades — is satisfied for those ACs. Batch them in one pass with
finding 7's sibling clause in AC-691.
