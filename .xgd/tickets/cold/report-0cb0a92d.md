---
uid: report-0cb0a92d
id: REPORT-1318
type: report
title: 'Capability-Intent Alignment: l1_reproduction_pipeline (level=story)'
created_by: xgd
created_at: '2026-08-05T21:16:46.034019+00:00'
updated_at: '2026-08-05T21:16:46.034019+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-2049c9ec
  level: story
  violations: 8
  warnings: 0
  needs_review_count: 1
---

# Capability-Intent Alignment: l1_reproduction_pipeline
# Level: story

**Result**: FAIL
**Violations**: 8
**Warnings**: 0
**Needs review**: 1

Capability: CAP-71 (`capability-2049c9ec`), stories STORY-84 (`story-8acc338d`,
fold) and STORY-86 (`story-24098299`, 3-probe gate). Both `story_kind: upgrade`,
both `intent_uid: bundle-31e474b9` (BUNDLE-7), both `updated_by: bundle-cceaba25`
(BUNDLE-8).

## Cumulative Intent Considered

Intents were reached via the two bundles named on the stories, then widened to
every `request`/`bug` ticket whose scope is the fold or the acceptance gate.
Ordered by `created_at`. Intents owned by CAP-63 (capture / values-diff) or
CAP-70 (L1 tree, envelope, renderer) are listed at the bottom and excluded — both
capability bodies draw that boundary explicitly and consistently.

| Intent ID | Status | When | Asked / changed (CAP-71 part) | Counts? |
|---|---|---|---|---|
| REQ-79 (BUNDLE-7) | free_and_reconciled | 2026-07-20 | Framework pivot: absolute-base D1 reproduction model the fold emits | YES |
| REQ-83 (BUNDLE-7) | free_and_reconciled | 2026-07-20 | capture→L1 fold (keyframes + retained oracle) + structural-hint extractor | YES |
| REQ-86 (BUNDLE-7) | free_and_reconciled | 2026-07-20 | end-to-end reproduction via the 3-probe gate | YES |
| REQ-88 (BUNDLE-10) | free_and_reconciled | 2026-07-21 | `1c repro` / `1c l1-gate` operator pipeline; rounds 3–10: band edge snap, text-width ceil, `nowrapFromPx`, `geometry.viewportResponse` + height probe, `document.column` + per-axis `geometry.anchor`, `responsivePadding`, `partitionProbes` | YES |
| BUG-5 (BUNDLE-8) | free_and_reconciled | 2026-07-23 | fidelity pairing by stable occurrence identity + idempotence identity | YES |
| BUG-6 (BUNDLE-8) | free_and_reconciled | 2026-07-23 | fold signals a typed residual instead of silently dropping | YES |
| BUG-7 (BUNDLE-8) | free_and_reconciled | 2026-07-23 | evaluator row-tiling vs stack flow model | YES |
| BUG-8 (BUNDLE-8) | free_and_reconciled | 2026-07-23 | half-open breakpoint intervals in the evaluator | YES |
| BUG-9 (BUNDLE-8) | free_and_reconciled | 2026-07-23 | region-aware recursive promotion to flow | YES |
| BUG-11 (BUNDLE-8) | free_and_reconciled | 2026-07-23 | fold recovers composited surfaceFill / surfaceGradient | YES |
| BUG-13 (BUNDLE-10) | free_and_reconciled | 2026-07-23 | section / CSS background-image folds to a `box` leaf with its own geometry track | YES |
| BUG-14 (BUNDLE-10) | free_and_reconciled | 2026-07-23 | fold rebuilds the section-band → card → text hierarchy; stops per-run boxing | YES |
| BUG-17 (BUNDLE-10) | free_and_reconciled | 2026-07-23 | `foldPadding()` carries captured padding onto text/image/box leaves | YES |
| BUG-18 (BUNDLE-10) | free_and_reconciled | 2026-07-23 | fold keyframes varying flat text axes per width; evaluator mirrors the cascade | YES |
| BUG-19 (BUNDLE-10) | free_and_reconciled | 2026-07-23 | full-bleed bar detection seeds a band (footer/nav) | YES |
| BUG-20 (BUNDLE-10) | free_and_reconciled | 2026-07-24 | fold folds a chip run's own surface onto its text leaf; drops the duplicate card row | YES |
| BUG-23 (BUNDLE-10) | free_and_reconciled | 2026-07-24 | reproduction binds every asset-bearing axis to the bundle mirror; fails loud on an unmirrored handle | YES |
| REQ-90 (BUNDLE-8) | free_and_reconciled | 2026-07-23 | fold populates the document font resource table | YES |
| REQ-92 (BUNDLE-8) | free_and_reconciled | 2026-07-23 | rebuild `foldToL1` to the full L1 language, signalling residuals | YES |
| REQ-94 (BUNDLE-11) | bundled | 2026-07-25 | cross-gate calibration: a clean `l1-gate` must not outvote a failing perceptual diff | imminent |
| REQ-63, REQ-82, REQ-84, REQ-85, REQ-89, REQ-91, REQ-93, REQ-96–107 | various | — | CAP-63 / CAP-70 scope (capture axes, L1 tree, renderer, behavior modules) | n/a here |
| BUG-10, BUG-12, BUG-15, BUG-16, BUG-21, BUG-22, BUG-24, BUG-25 | free_and_reconciled | — | capture / values-diff side (CAP-63) | n/a here |
| BUG-27, BUG-28 | bundled | — | capture / behavior module (CAP-63 / CAP-70) | n/a here |

### Branch-state fact that shapes every BUNDLE-10 finding

BUNDLE-10 (`bundle-4ff83a8b`) reads `free_and_reconciled` with
`merged_at_commit: 2d59a3b63` (a `sync_working_to_main` commit that IS an ancestor
of this regression branch) — but **neither its implementation nor its matrix
updates are present on this branch**:

- `git grep` for `foldPadding`, `responsiveTextTracks`, `foldSectionBackgrounds`,
  `buildCards`, `buildSolidBands`, `nowrapFromPx`, `viewportResponse`, `fitColumn`,
  `localizeAssets`, `partitionProbes`, `evalScalarTrack` returns **nothing** under
  `tools/generate/src` or `packages/`. The same symbols are present on
  `xgd-working` and on `reconcile-BUNDLE-10`.
- `tools/generate/src/l1/fold.ts` was last touched 2026-07-28 (BUNDLE-8 era) and
  still carries the BUG-11 per-run backing-box model (`doc.background` at
  `fold.ts:683`).
- Story-body updates for BUNDLE-10 were authored on `reconcile-BUNDLE-10`
  (commits of 2026-08-02, e.g. `f5402cd45` on story-8acc338d, `447808bb3` on
  story-24098299) and exist **only** on that branch — `git branch --contains`
  lists no other.

So on this branch the matrix and the code agree with each other; both sit at the
BUNDLE-8 state while BUNDLE-10's tickets claim reconciliation. Per this check's
rule ("intent is the source of truth, not the matrix", and `free_and_reconciled`
counts), the gaps below are real drift and are reported as violations — but see
finding 9 before an editor acts on findings 2–8.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-84 (`story-8acc338d`) | REQ-79, REQ-83, REQ-90, REQ-92, BUG-6, BUG-11 | aligned to BUNDLE-7/8 intent; body accurately describes `fold.ts` as it stands on this branch |
| STORY-84 | REQ-88, BUG-13, BUG-14, BUG-17, BUG-18, BUG-19, BUG-20, BUG-23 | **gap** — none of these reconciled intents is expressed; §"reconstructed run surfaces" still describes the model BUG-14 retired |
| STORY-86 (`story-24098299`) | REQ-86, BUG-5, BUG-7, BUG-8, BUG-9 | aligned — each ask is present in the body and in `probes.ts` (`rowChildWidths`, half-open segments, `oracleBoxes` occurrence FIFO, `overlapComponents` recursive promotion) |
| STORY-86 | REQ-88 (rounds 6–8), BUG-18 | **gap** — evaluator obligations for scalar tracks, column/anchor resolution, viewport response and probe/ladder partitioning are absent |
| STORY-86 | REQ-94 (bundled, imminent) | aligned today; will need a cross-gate calibration obligation when BUNDLE-11 reconciles |
| STORY-84 + STORY-86 | REQ-88 (`1c repro` / `1c l1-gate`) | **gap in both** — the operator-facing pipeline surface is owned by neither story, and CAP-63 explicitly disclaims it |

Exclusivity was checked and is clean: the backing-surface concept appears in both
stories but on different sides of the boundary (STORY-84 emits it, STORY-86
excludes it from the sibling-overlap check), and each body carries an explicit
out-of-scope clause pointing at the other. No merge candidates.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-84 + STORY-86 | story-body-edit | REQ-88 (free_and_reconciled) delivered the operator-facing pipeline surface — `1c repro` (`cmdRepro`, `tools/generate/src/cli/repro.ts:66`) and `1c l1-gate` (`cmdL1Gate`, `repro.ts:132`, dispatched at `cli/index.ts:354`) — and this code **is live on this branch**. Neither story mentions either command. CAP-63's body puts "the fold/gate reproduction pipeline" explicitly out of its scope, so no other capability owns it | Add to STORY-84 the `1c repro` obligation (import a bundle's folded document as a raw-L1 page site, mirror bundle assets, idempotent rebuild) and to STORY-86 the `1c l1-gate` obligation (run the 3-probe gate + fold-residual report analytically off the retained oracle, read-only, not consuming `repro`'s output) |
| 2 | violation | consistency | STORY-84 | story-body-edit | §"reconstructed run surfaces" describes the model BUG-14 (free_and_reconciled, 2026-07-23) retired: "the solid fill the most runs sit on becomes the document background band, and every run whose surface differs from the band … gets a backing box". BUG-14 replaced it with full-bleed **section bands** (consecutive same-fill full-width runs tiled `x:0`/`width:viewport`, clamped to real section edges) → **card** boxes (runs grouped by signature + x-overlap + vertical adjacency, coalescing to one box, carrying border/`borderLeft`/shadow/radius/padding) → text, with a run that sits on its band emitting **no** box. BUG-19 then added full-bleed *bar* detection so a space-between footer seeds a band instead of tiny per-run boxes | Rewrite the surface paragraph around the band → card → text hierarchy, the "no box for a run on its band" rule, and full-bleed bar detection; drop the single-document-band framing |
| 3 | violation | coverage | STORY-84 | story-body-edit | BUG-13 (free_and_reconciled) makes a section / CSS `background-image` a foldable node: `foldSectionBackgrounds` emits one `box` per section carrying `axes.backgroundImageUrl` plus its own geometry keyframe track, emitted first so it paints beneath surfaces and content. STORY-84's image leaf is only "a text-free media element"; no intent-supported text covers band backgrounds | Add section-background boxes to the full-language list and to In scope |
| 4 | violation | coverage | STORY-84 | story-body-edit | BUG-17 (free_and_reconciled) added `foldPadding()` carrying captured `paddingTop/Right/Bottom/LeftPx` onto text/image/box leaves (zero/absent/out-of-range sides dropped), and REQ-88 round-6 added `responsivePadding` giving each side its own per-width track. STORY-84 says nothing about padding | Add padding to the axes the fold carries, noting the per-side responsive track and that the box is a border box so padding insets rather than inflates the pinned keyframe |
| 5 | violation | coverage | STORY-84 + STORY-86 | story-body-edit | BUG-18 (free_and_reconciled) made *flat* axes responsive: `foldToL1` emits a per-width scalar track (`responsiveTextTracks`) for a text axis that varies across the ladder (fontSizePx / lineHeightPx / letterSpacingPx), static axes staying scalars; the evaluator gained `evalScalarTrack` mirroring the renderer cascade and `expectedTextManifest` resolves per viewport. STORY-84 states the opposite ("each node carries its authored axes, a geometry keyframe per sampled width"); STORY-86's evaluator description keyframes geometry only | STORY-84: state that a varying flat axis earns a per-width track while a static one stays scalar. STORY-86: add the evaluator's obligation to mirror scalar tracks on the same half-open interval terms as geometry |
| 6 | violation | coverage | STORY-84 | story-body-edit | BUG-20 (free_and_reconciled) gave text leaves a **self-surface** (surfaceFill, borderRadiusPx, boxShadow, border) and made the fold fold a chip run's own surface onto its text leaf while dropping its card row, discriminated by pill saturation (radius ≥ half the run's painted height) rather than "has a radius". STORY-84's text-leaf list stops at the pixel-mover families and still implies text and painted surface are disjoint leaves | Add the chip/self-surface case and the pill-saturation discriminator to the text-leaf description |
| 7 | violation | coverage | STORY-84 + STORY-86 | story-body-edit | REQ-88 rounds 5–8 (free_and_reconciled) added fold axes and gate obligations neither story expresses: `axes.nowrapFromPx` (a width, not a flag, from the smallest captured width whose whole suffix is single-line); `geometry.viewportResponse` as a derivative (`heightFactor`/`yFactor`) fed by a second-height probe, emitted only on probe evidence; `document.column` + per-axis `geometry.anchor` (`{x?, width?}` fitted and suppressed independently, capped column terms, over-determined fits, `x.pxTrack` for mode changes, never anchoring a full-bleed band); a text leaf **ceils** its width while box/image keep nearest rounding; band tops/bottoms snapping to real section edges; and `partitionProbes` — first projection at a key defines the ladder, later ones are evidence — which the gate needs so `oracleBoxes` does not drain its FIFO queues and report every run unmatched | Extend STORY-84's fold description with the nowrap, viewport-response, column/anchor and rounding rules; extend STORY-86 with the probe-vs-ladder partitioning rule and the evaluator's anchor/column resolution |
| 8 | violation | coverage | STORY-84 | story-body-edit | BUG-23 (free_and_reconciled) requires the reproduction to bind every asset-bearing axis (image `src`, `axes.backgroundImageUrl`, `doc.resources.fonts[].src`) to the bundle's own mirror, fail the import loudly on an unmirrored handle rather than hotlinking, and report unreferenced mirrored assets as a fold gap. STORY-84 says only that an image leaf carries "its resolved source … carried through the manifest". Note BUG-23 places the rewrite in `cmdRepro`, **not** the fold — so this rides on finding 1's pipeline-surface text | Record the localization obligation and the fail-loud rule on the `1c repro` surface, and state that the fold stays a faithful transcription of what the capture read |
| 9 | needs_review | coverage | CAP-71 story tree | — | Findings 2–8 all trace to BUNDLE-10, whose tickets read `free_and_reconciled` while neither its code nor its matrix updates are present on this branch (evidence above). The matrix updates were already authored on `reconcile-BUNDLE-10` (2026-08-02) and never merged. Editing STORY-84/86 here would make the matrix describe behaviour this branch's `fold.ts`/`probes.ts` do not implement — inverting the drift and guaranteeing UAT-level failures downstream. Whether the repair is a merge, a re-reconcile, or a correction to BUNDLE-10's status is an operator decision, not one this check can make | Escalate to operator: land / re-run BUNDLE-10's reconcile into main (bringing both code and the already-authored story bodies), or correct `bundle-4ff83a8b`'s status. Do **not** hand-edit findings 2–8 into the bodies on this branch |
| 10 | info | coverage | STORY-86 | — | REQ-94 (`bundled`, imminent, BUNDLE-11) will add a cross-gate calibration obligation — a clean `l1-gate` must not outvote a failing perceptual diff, and reference-coverage proxies must be reported. STORY-86's "Two gates, two concerns" framing is correct today; it will need revisiting when BUNDLE-11 reconciles | none now |

## Notes for the Editor

**Finding 1 is independent of everything else and is the one safe edit on this
branch.** REQ-88's pipeline commands landed on 2026-07-22 (`04be895dc`), well
before the BUNDLE-10 split, and are live in `tools/generate/src/cli/repro.ts`.
The gap is pure matrix omission: CAP-63 disclaims the fold/gate pipeline, CAP-71's
stories never claim the commands, so `1c repro` / `1c l1-gate` are unowned by any
story in the matrix.

**Findings 2–8 form one block with a single cause.** They are not eight
independent drifts — they are the BUNDLE-10 reconcile failing to reach main. An
editor working them one at a time will hand-rewrite bodies that already exist,
better, on `reconcile-BUNDLE-10`. Resolve finding 9 first; findings 2–8 then
mostly resolve by merge rather than by authoring.

**Where the boundary held.** The capability's own out-of-scope clause did real
work here. Of the 16 intents in BUNDLE-10, 8 (BUG-12, BUG-15, BUG-16, BUG-21,
BUG-22, BUG-24, BUG-25, plus REQ-93) are capture/values-diff or behavior-module
concerns and correctly belong to CAP-63 / CAP-70; several name `fold.ts` in
passing but change nothing in it (BUG-12 states outright that "`fold.ts` was
**not** touched"). Those were excluded rather than reported, and the two
consolidated halves (CAP-71 fold + CAP-73 gate) show no overlap after the
2026-08-05 rebalance.

**One cross-story dependency worth preserving.** STORY-86's occurrence-index
pairing contract is load-bearing on STORY-84's responsive table keeping one leaf
per row in FIFO document order. REQ-88's `partitionProbes` (finding 7) is exactly
what protects that invariant once a second projection exists at the same width —
so if findings 5/7 are ever split across editors, the pairing contract in
STORY-86 must not be edited without the probe-partitioning rule landing with it.
