---
uid: report-a9ff561a
id: REPORT-2089
type: report
title: 'Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
  (level=ac)'
created_by: xgd
created_at: '2026-08-16T07:48:24.315624+00:00'
updated_at: '2026-08-16T07:48:24.315624+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-2049c9ec
  level: ac
  violations: 6
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
# Level: ac

**Result**: FAIL
**Violations**: 6
**Warnings**: 3
**Needs review**: 0

CAP-71 (`capability-2049c9ec`) holds two stories, both `story_kind: upgrade` and
therefore both Capability-Matrix kinds expected to carry ACs; both do. STORY-84
(`story-8acc338d`, the fold) carries 18 active ACs; STORY-86 (`story-24098299`,
the 3-probe gate + cross-gate reconciliation) carries 16. All 34 are `active`;
none is deprecated.

**Working reference and its caveat.** At `ac` level the story body is normally the
working reference. That assumption does not hold for STORY-84, and this is the
seventh attempt at this level. The story-level cycle for this capability ran
**today** (REPORT-2088 / `report-13bc38e7`, 2026-08-16T07:39) and **failed with 5
violations**, four of them STORY-84's; STORY-84's body was last written
2026-08-12T21:57 and is unrepaired. I re-read both story bodies in full this run
and confirmed every drifted passage REPORT-2088 names is still present verbatim
(no occurrence of "padding", "chip", "pill", "badge", "responsive track" or any
viewport-height term anywhere in either body). I have therefore escalated to
intent + code for STORY-84's fold ACs, as the level rules permit when the upper
layer is itself unsound — and REPORT-2088's own findings 1–4 explicitly prescribe
`ac-edit` / `ac-add` follow-ups, which are the ac-level repairs filed below.

**Nothing has been repaired since REPORT-1730** (the previous ac-level report,
2026-08-09, 5 violations / 3 warnings). Sixteen ACs were last written 2026-08-09
and are byte-unchanged in substance; the only movement in the tree since is
REQ-136's, which added AC-1133 and AC-1134 and rewrote AC-729 on 2026-08-12 —
that work is **aligned** (see ledger). Findings 1–5 and 7–9 below are the same set
as REPORT-1730's, **independently re-derived and re-verified against code in this
worktree (`regression-d24ebf03`)** rather than inherited. Finding 6 is new at this
level: it is REPORT-2088 finding 4's ac-level counterpart and was not raised by
REPORT-1730.

**Summary of the split.** STORY-86's AC tree is in good shape apart from one
genuine, story-body-supported coverage hole that has now survived **four**
ac-level cycles (pinned-box content overflow) and one stale/duplicated AC.
STORY-84's AC tree carries one direct contradiction of reconciled intent
(AC-731), one materially incomplete criterion (AC-691), and **three** reconciled
fold behaviours no AC expresses at all (padding, self-painting runs, viewport-height
response).

## Cumulative Intent Considered

ACs in this tree carry no `intent_uid` / `updated_by` of their own — their fields
are `story_uid`, `kind`, `regression_only`, `uat_coverage` only — so attribution
resolves at story level via the bundles plus each intent's own scope statement and
its code-attribution comments. Both stories carry `intent_uid: bundle-31e474b9`
(BUNDLE-7); STORY-84 carries `updated_by: request-8a132869` (REQ-136's carrier)
and STORY-86 `updated_by: bundle-ee56a66e` (BUNDLE-11). **BUNDLE-8 and BUNDLE-10
appear in neither chain** — that is the mechanical root of findings 2–6.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-66 | free_and_reconciled | 2026-07-18 | `adopt-values` pre-L1 reproduction command | YES (retired by REQ-83) |
| REQ-79 | free_and_reconciled | 2026-07-19 | Framework pivot to L1; absolute-base reproduction (D1) | YES |
| REQ-83 | free_and_reconciled | 2026-07-20 | Capture→L1 fold (keyframes, interpolate/snap, visibility) + oracle retention + advisory hint sidecar; dissolve `adopt-values` — origin of STORY-84 | YES |
| REQ-86 | free_and_reconciled | 2026-07-20 | End-to-end 3-probe gate + demand-driven promotion — origin of STORY-86 | YES |
| REQ-88 | free_and_reconciled | 2026-07-21 | `1c repro` / `1c l1-gate`; captured surface rect as card identity; section-edge band clamp; **responsive padding tracks**; **viewport-height response** | YES (partly — findings 2, 4, 6; verb itself is story-level, info 11) |
| BUG-5 | free_and_reconciled | 2026-07-23 | Occurrence-index fidelity pairing + idempotence identity | YES |
| BUG-6 | free_and_reconciled | 2026-07-23 | Unexpressed element → typed residual, never a silent drop | YES |
| BUG-7 | free_and_reconciled | 2026-07-23 | Evaluator must tile a row along the main axis | YES |
| BUG-8 | free_and_reconciled | 2026-07-23 | Reflow keyframe at a captured breakpoint (resolved as half-open intervals) | YES |
| BUG-9 | free_and_reconciled | 2026-07-23 | Recursive, region-aware promotion | YES |
| REQ-90 / REQ-91 / REQ-92 | free_and_reconciled | 2026-07-23 | Resource table, text pixel-mover axes, full-language fold | YES |
| BUG-11 | free_and_reconciled | 2026-07-23 | Fold `surfaceFill` / `surfaceGradient` | YES |
| BUG-12 / BUG-13 | free_and_reconciled | 2026-07-23 | Font faces reach the resource table; background-image elements foldable | YES |
| **BUG-14** | **free_and_reconciled** | **2026-07-23** | **Nest, don't flatten: section-band → card → text reconstruction; stop per-run boxing** | **YES — finding 2** |
| **BUG-17** | **free_and_reconciled** | **2026-07-23** | **Fold a captured element's per-side padding onto its leaf** | **YES — finding 4** |
| **BUG-18** | **free_and_reconciled** | **2026-07-23** | **Flat text axes single-valued at desktop — keyframe the varying ones per width** | **YES — finding 3** |
| **BUG-19** | **free_and_reconciled** | **2026-07-23** | **A full-bleed *bar* (footer/nav strip) seeds a band, not tiny cards** | **YES — finding 2** |
| **BUG-20** | **free_and_reconciled** | **2026-07-23** | **A pill/chip run carries its own surface on its text leaf and drops its card row** | **YES — finding 5** |
| **BUG-21** | **free_and_reconciled** | **2026-07-24** | **A padded control run takes the same self-painting path (card path gave buttons 2x height)** | **YES — finding 5** |
| BUG-22 | free_and_reconciled | 2026-07-24 | `SurfaceShape` — the captured surface rect the fold consumes as card identity | YES — finding 2 |
| BUG-23 | free_and_reconciled | 2026-07-24 | `localizeAssets` in `cmdRepro`; unmirrored handle fails the import | YES (story-level — info 11) |
| BUG-27 | free_and_reconciled | 2026-07-25 | Document-wide backdrop index; backdrop edges are section edges; backdrops count toward the page base | YES |
| REQ-93 | free_and_reconciled | 2026-07-25 | L1 pages host behavior modules in slots — the fold's behaviour seams | YES |
| REQ-94 | free_and_reconciled | 2026-07-25 | Cross-gate reconciliation, perceptual floor, reference coverage, named causes | YES |
| REQ-96 | free_and_reconciled | 2026-07-26 | L1 `control` node — a captured control binds instead of being dropped | YES |
| REQ-114 | free_and_reconciled | 2026-07-31 | `l1Color` = `hex \| PaletteRef` | out of scope (CAP-70) — info 13 |
| **REQ-136** (`request-8a132869`) | **free_and_reconciled** | **2026-08-12** | **Framing pair + colour-adjustment stack folded onto pictures and surfaces** | **YES — newly and correctly expressed (AC-1133, AC-1134, AC-729)** |
| BUNDLE-7 (`bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | Carrier for REQ-63/79/82/83/84/86 | YES |
| BUNDLE-11 (`bundle-ee56a66e`) | free_and_reconciled | 2026-08-06 | Carrier for BUG-27 / REQ-94 / 96 / 97 / 98 | YES |
| REQ-82/84/85, REQ-97–REQ-107 | free_and_reconciled | BUNDLE-7/11 | L1 schema, renderer, validator, axis vocabulary, evaluator mode cascade | out of scope (CAP-70) |
| REQ-63, REQ-15/16/22/24 family, BUG-25 | free_and_reconciled | various | Capture / values-diff axes; multi-line run boxes | out of scope (CAP-63) |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-689 (validated full-language document) | REQ-83, REQ-92 | aligned |
| AC-690 (oracle retained) | REQ-83 | aligned |
| **AC-691** (geometry keyframes; typography from widest sample) | REQ-83 | **incomplete vs BUG-18** — finding 3 |
| AC-692 (interpolate/snap) | REQ-83 | aligned |
| AC-693 (visibility rule) | REQ-83 | aligned |
| AC-694 / AC-695 (hint sidecar; advisory-only) | REQ-83 | aligned |
| AC-696 (adopt-values removed) | REQ-66 retirement | aligned (re-verified: no `adopt-values` / `adoptValues` under `tools/generate/src/`) |
| AC-729 (image leaf, rewritten 2026-08-12) | REQ-92, REQ-136 | aligned; still duplicates AC-733's negative case — finding 9 |
| AC-730 (text-free surface → box leaf) | REQ-92, BUG-11 | aligned (its axis list omits the colour adjustment, which AC-1134 owns for surfaces — not a gap) |
| **AC-731** (run-composited surfaces) | BUG-11 | **contradicts BUG-14 + BUG-22, misses BUG-19, conflicts with AC-812 on the page base** — finding 2 |
| AC-732 (text pixel-movers + font table) | REQ-90, REQ-91, BUG-12 | aligned |
| AC-733 (typed residuals; controls bind) | BUG-6, REQ-96 | aligned |
| **AC-1133** (framing pair: browser centre → nothing, unreadable form → nothing) | REQ-136 | **aligned** — states admission rules the story body states verbatim |
| **AC-1134** (colour-adjustment stack: per-spelling fraction, per-function no-op, clamp) | REQ-136 | **aligned** — covers picture and painted surface alike, and the shadow-as-filter exclusion |
| AC-812 (backdrop → background layer, edges bound bands, fill counts to page base) | BUG-13, BUG-27 | aligned |
| AC-813 (control leaf rebased to seam) | REQ-96, REQ-93 | aligned |
| AC-814 (offline re-fold) | REQ-88 (`cmdRefold`) | aligned |
| **STORY-84 AC tree** | **BUG-17 + REQ-88** | **gap — no AC mentions padding** (finding 4) |
| **STORY-84 AC tree** | **BUG-20, BUG-21** | **gap — no AC covers a text run that paints its own surface** (finding 5) |
| **STORY-84 AC tree** | **REQ-88 / BUG-27 (height probes)** | **gap — no AC covers the viewport-height response** (finding 6) |
| AC-705 (fidelity pairing, text + kind keys) | BUG-5, REQ-96 | aligned |
| AC-706 / AC-707 (off-sample, robustness) | REQ-86, BUG-9 | aligned to the story body, but both enumerate only two of its three envelope violations — finding 1 |
| AC-708 (combined gate, non-vacuous) | REQ-86 | aligned |
| AC-709 (region-aware recursive recovery) | BUG-9 | aligned |
| **AC-710** (diagnostic findings) | REQ-86 | **stale vs AC-705 + duplicative** — findings 7, 8 |
| AC-724 (idempotence identity) | BUG-5 | aligned |
| AC-734 (row tiling) | BUG-7 | aligned |
| AC-735 (half-open intervals) | BUG-8 | aligned |
| AC-736 (backing-surface overlap exception) | BUG-14 | aligned to the story body; broader than code — info 10 |
| AC-737 (fold-residual channel) | REQ-92, REQ-96 | aligned |
| AC-852–AC-856 (cross-gate verb, floor, coverage, causes, exit code) | REQ-94, BUG-27 | aligned |
| **STORY-86 AC tree** | REQ-86 (story body: "sibling overlap, horizontal clip beyond the viewport, **and pinned-box content overflow**") | **gap — the third violation is uncovered** (finding 1) |
| STORY-84 ↔ STORY-86 | — | exclusivity OK across stories; the reciprocal out-of-scope clauses partition fold vs gate cleanly |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-86 AC tree | ac-add | STORY-86's body names **three** envelope violations the evaluator reports — "sibling overlap, horizontal clip beyond the viewport, **and pinned-box content overflow**" — and puts "its envelope findings" In scope. The third is live in code: `tools/generate/src/l1/probes.ts:405-416` pushes a `clip` finding with detail `content height {N}px exceeds pinned box height {M}px` when a pinned box/container's flow-interior content exceeds its pinned keyframe height, and `evaluateLayout`'s docstring (`probes.ts:429-433`) names all three. **No AC covers it.** Every AC that enumerates envelope violations names only overlap and viewport-edge clip: AC-706 ("no two leaf boxes overlap and no leaf clips beyond the viewport"), AC-707 ("no sibling overlap and no clip"), AC-734, AC-736 ("right edge extends beyond the viewport"); AC-710 fixes the finding vocabulary at "kind (overlap or clip)" without giving this trigger. A search for "overflow" / "content height" across all 34 AC bodies matches only AC-734's *title*. An implementer working from the AC tree alone would ship only the viewport clip. **Fourth raise: REPORT-1319 (2026-08-05), REPORT-1658 (2026-08-07), REPORT-1730 (2026-08-09); none repaired.** Fully supported by STORY-86's own body — no story-level dependency. | Author an AC under STORY-86: a pinned box/container whose flow-interior content height exceeds its pinned keyframe height is reported as a `clip` finding naming the overflow magnitude and the offending index path, at every evaluated width and under content perturbation. (Extending AC-707 alone is insufficient — AC-706 needs the same rule off-sample.) |
| 2 | violation | consistency | AC-731 | ac-edit | AC-731 encodes the flat per-run surface model BUG-14 (free_and_reconciled, "Nest, don't flatten … stop per-run boxing") retired, and misses BUG-19 entirely. Three divergences from shipped code, each re-verified this run: **(a)** "Every run whose composited surface differs from that band … folds an **additional backing box leaf** carrying that fill/gradient and **the run's geometry**" — the fold instead partitions surface rows into band rows and card rows (`fold.ts:2065-2074`) and groups card rows by **measured surface identity** via union-find (`buildCards`, `fold.ts:1599-1632`; the captured surface rect is an outright membership decision at `fold.ts:1613-1625`), emitting **one** box per card whose keyframe prefers the captured surface rect over the run box (`fold.ts:1654-1666`, BUG-22). **(b)** "The solid fill that the greatest **number of runs** sit on becomes the … background band" — the page base is chosen by **greatest total band height**, with captured backdrops counted alongside reconstructed bands (`bandHeightByFill`, `fold.ts:2105-2130`); the run-count rule survives only as a *fallback* when no band was found (`fold.ts:2136-2141`). AC-812 already states the backdrop half of the shipped rule ("its fill counts toward the page-base inference"), so AC-731 and AC-812 currently give two different rules for one decision. **(c)** BUG-19's full-bleed **bar** rule — a footer/nav strip whose runs are individually narrow but horizontally distributed seeds a band rather than tiny cards (`barBandFills`, `fold.ts:1397`, applied `fold.ts:2064-2071`) — is absent. A UAT written faithfully to AC-731 would pin retired behaviour and fail against real code. | Rewrite AC-731 as section-band → card → text reconstruction: band rows (full-width untreated runs, plus BUG-19 bar members) seed bands clamped to the captured section edges; remaining surface-bearing rows group by measured surface identity into card boxes carrying the captured card rect (falling back to the runs' union only where the capture resolved no surface); a narrow run sitting on its band emits nothing. Re-point the page-base rule at greatest total band height and defer to AC-812 rather than restating it. |
| 3 | violation | consistency | AC-691 | ac-edit + ac-add | AC-691 closes with "A node's authored typography axes are taken from its **widest present sample** (the desktop rendering)", and its Verification stops at "Assert the node's typography axes match the widest sampled cell". BUG-18 (free_and_reconciled) was filed on exactly that rule — flat text axes single-valued at desktop — and its fix is live: `RESPONSIVE_TEXT_AXES` + `responsiveTextTracks()` (`fold.ts:607-642`) emit a per-width scalar keyframe track for `fontSizePx` / `lineHeightPx` / `letterSpacingPx` whenever that axis varies across the ladder, applied at `fold.ts:1853`. The AC's sentence is **true but incomplete**: `fold.ts:1837` still calls `textAxes(widest)` and the track is built so its widest keyframe equals that scalar — so an editor who deletes the widest-sample sentence makes the AC wrong in the other direction. The defect is that AC-691 presents the widest-sample rule as the *complete* account of what a folded node carries per width, so BUG-18's whole fix is expressed by no AC in the tree (no AC body contains "responsive", "track" in this sense, "scalar", "per-width" outside AC-813's geometry, "fontSize" or "font-size"). Counterpart of REPORT-2088 finding 1. | Extend AC-691: a numeric type axis that varies across the sampled ladder additionally folds to a per-width scalar keyframe track; an axis identical at every width stays a single scalar taken from the widest sample. Extend the Verification to assert the track on a varying axis and its absence on a static one. |
| 4 | violation | coverage | STORY-84 AC tree | ac-add | BUG-17 (free_and_reconciled, "fold drops element padding — badges/buttons render cramped") requires the fold to carry captured per-side padding onto leaves, and REQ-88 added per-width tracks for sides that vary. Shipped as `foldPadding()` (`fold.ts:552`) and `responsivePaddingTracks()` (`fold.ts:657`), applied to **text, image and box leaves alike** (`fold.ts:1856`/`1860`, `1984`/`1988`, `2026`/`2030`). A case-insensitive search for "padding" across all 34 AC bodies returns **zero matches**: AC-730's surface-axis enumeration (fill / gradient / border / shadow / radius / opacity / backdrop-blur / blend) and AC-729's image-axis list both omit it, and AC-691's account of what a keyframe carries does not mention it. Counterpart of REPORT-2088 finding 2. | Author an AC under STORY-84: a captured element's non-zero per-side padding folds onto its leaf as the `padding` axis — insetting content inside the pinned border-box rather than inflating the pinned geometry, since the captured box already includes the pad — with any side that varies across the ladder carried as a per-width track. |
| 5 | violation | coverage | STORY-84 AC tree | ac-add | BUG-20's cause 1 (free_and_reconciled) made a **pill/chip run** fold its own surface onto its text leaf and drop its card row, so the pill is not duplicated as a box behind it; BUG-21 (free_and_reconciled) extends the same path to a **padded control run** (button / submit link) whose modest rounding pill-saturation misses and which the card path was outsetting to 2x height and bleeding past both screen edges at 320px. Shipped as `isSelfPaintingRun` / `isPaddedControlRun` / `chipAxes` (`fold.ts:1003-1054`), applied at `fold.ts:1836-1837` and `fold.ts:2262`. A search for "chip", "pill", "badge" or "self-paint" across all 34 AC bodies returns **zero matches**. AC-730 covers only "a **text-free** element that paints a standalone surface" — the opposite case — and AC-732's text-leaf enumeration lists typography plus the text pixel-movers only. AC-731 (finding 2) positively states the retired rule that every differing run gets a backing box, so the tree currently contradicts this behaviour rather than merely omitting it. Counterpart of REPORT-2088 finding 3(a). | Author an AC under STORY-84: a text run whose own border-box already spans its painted surface — a saturated pill radius, or an authored vertical inset on a filled run (a button) — folds that surface (fill, radius, shadow, border) onto its **text** leaf and contributes no card row, so no duplicate box is emitted behind it; a run whose fill is attributable to an enclosing card (a `surfaceGradient` or a `borderLeft` accent present) keeps the card path. |
| 6 | violation | coverage | STORY-84 AC tree | ac-add | REQ-88 round 4 added a **second sampling axis** the fold consumes — height probes — from which it derives a per-node **viewport-height response** (`{yFactor, heightFactor}`) onto the node's geometry: `HeightProbe` / `heightProbesFor` (`fold.ts:174`, `188`), `responseFrom` / `probeResponses` (`fold.ts:249-287`), consumed at `fold.ts:1743-1744` and written at `fold.ts:1578`, `1814`, `1943`, with a reconstructed card inheriting its representative row's response at `fold.ts:1687-1688`; carried by `L1Geometry.viewportResponse` in `packages/site-schema/src/l1/schema.ts`. BUG-27's body cites it as measured behaviour ("82/89 nodes carry a `yFactor`"). A search across all 34 AC bodies for "viewport height", "height probe", "height response", "yFactor", "heightFactor" or "atHeight" returns **zero matches** — the fold's second measurement axis is expressed by no AC. New at ac level; counterpart of REPORT-2088 finding 4. | Author an AC under STORY-84: the capture samples a second axis (viewport height) and the fold derives from it a per-node viewport-height response — a measured `{yFactor, heightFactor}` rather than an inference — written onto the node's geometry and inherited by a reconstructed card from its representative row; a node whose box is inert under the height delta carries no response. |
| 7 | warning | consistency | AC-710 | ac-edit | AC-710 states the fidelity residual in text-only terms — "carries the run text, the width, and the per-axis deltas … plus a coverage entry (text, width) for any oracle sample with no reproduced run". AC-705, its sibling under the same story, extends fidelity to image and box leaves, which carry no text and whose residuals are "labelled by kind" ("carrying the leaf's text (**or kind label**)"), and STORY-86's body states the same. A non-text residual therefore satisfies AC-705 and fails AC-710's literal wording. Re-raise from REPORT-1319, REPORT-1658, REPORT-1730. | Reword AC-710's fidelity clause to "the leaf's text (or kind label)" and its coverage entry to "(text or kind label, width)" — or, better, apply finding 8 and delete the clause. |
| 8 | warning | exclusivity | AC-705 + AC-710 | ac-edit | AC-710's fidelity half restates AC-705's "Report shape" clause: the same residual (text, width, dx/dy/dw) and the same unmatched coverage entry are specified in both, and finding 7 shows the two copies have already diverged. AC-710's non-duplicated content is the **envelope-finding** diagnostic contract (kind, magnitude-bearing detail string, index paths of the leaves involved), which no other AC states. Re-raise from REPORT-1319, REPORT-1658, REPORT-1730. | Narrow AC-710 to the envelope-finding diagnostic contract and delegate the fidelity residual shape to AC-705, leaving one authority per report shape. Pairs naturally with finding 1, which adds a third finding trigger to that same contract. |
| 9 | warning | exclusivity | AC-729 + AC-733 | ac-edit | AC-729 (image leaf) closes with the negative case — "A media element captured with no resolvable source, or with no box at any sampled width, produces no leaf at all: it is signalled as a residual" — and its Verification prescribes it ("Fold a fixture whose media element has no resolvable source and assert no image leaf is emitted and a residual is signalled"). AC-733 owns the residual channel and states and verifies the identical scenario ("a media element with no resolvable source or no geometry … Fold a capture containing a source-less image … assert one typed residual"). Two ACs specify the same criterion and prescribe the same test in the same shape. Survived REQ-136's 2026-08-12 rewrite of AC-729. Re-raise from REPORT-1658, REPORT-1730. | Narrow AC-729 to what a foldable media element emits (leaf, source, alt text, geometry, axes) and let AC-733 own the source-less / geometry-less outcome; keep at most a cross-reference. |
| 10 | info | consistency | AC-736 | — | AC-736 excludes "a painted surface leaf — a childless box carrying a card/panel/section fill, positioned behind the content it backs" from the sibling-overlap check. The code is narrower: only **fold-synthesized** surfaces are excluded (`isSynthesizedSurfaceId`, `probes.ts:458-471` — `section-band-*` / `section-bg-*` / `card-*`), while a genuine captured standalone surface (`box-*`) "is real painted content and still participates". AC-736 is faithful to STORY-86's body, which states the same broad rule, so this is story-body drift rather than ac-level drift — but a UAT written to AC-736's literal wording would assert exclusion for a captured `box-*` leaf and fail. | none at this level; flag for the story-level editor, then tighten AC-736 to fold-synthesized surfaces |
| 11 | info | coverage | REQ-88 (`1c repro`), BUG-23 | — | REQ-88's headline verb `1c repro <slug> --ref <bundle>` and BUG-23's mirror binding (`localizeAssets`, `l1/assets.ts`; the unmirrored-handle hard failure in `cli/repro.ts`) are expressed by no story in the matrix — REPORT-2088 finding 5 re-established this at story level after a sweep of all 30 stories / 424 ACs, and it is unrepaired. Authoring ACs at ac level would attach them to a story that does not claim the behaviour. Note that AC-729's "source URL **resolved at capture time**" is **correct as a fold criterion** — the fold emits the origin URL and `localizeAssets` rewrites it downstream — so AC-729 must **not** be edited for BUG-23. | none at this level; waits on REPORT-2088 finding 5's placement decision |
| 12 | info | exclusivity | AC-729 + AC-1133 / AC-1134 | — | AC-729's rewritten axis list names the framing pair and the colour-adjustment stack, and its Verification asserts "a non-default framing pair and a folded colour adjustment where the element paints them" — the same axes AC-1133 and AC-1134 own. This is a legitimate altitude split, not a duplicate: AC-729 states **what an image leaf composes**, while AC-1133 / AC-1134 state **the admission rules** (browser-default skip, unreadable-form skip, per-spelling fraction, per-function no-op, envelope clamp, shadow-as-filter exclusion) on pictures and painted surfaces alike. Recorded so a future cycle does not read the overlap as drift. | none |
| 13 | info | coverage | REQ-114 | — | REQ-114 widens `l1Color` to `hex \| PaletteRef` across schema, renderer and validator. Its only fold-side footprint is a *non*-behaviour: the fold emits colour literals only, palette assignment being "a separate, re-runnable pass over a folded site" (`fold.ts:2115-2118`). Schema / renderer / validator belong to CAP-70; nothing is asked of the fold or the gate. | none |
| 14 | info | coverage | AC-1133, AC-1134, AC-812, AC-813, AC-814, AC-852–AC-856 | — | These ten ACs carry no `uat_coverage` field at all (AC-1133 / AC-1134 are new since REQ-136); the other 24 carry `pass` or `fail`, and the capability's own `uat_coverage` is `fail`. That is a uat-level question, out of scope here; noted so the uat cycle knows where to look. | none at this level |

## Notes for the Editor

**Finding 1 is the safe, self-contained repair and should not be dropped again.**
It sits under STORY-86, is supported by STORY-86's own body, depends on nothing
being resolved at story level, and has now survived **four** ac-level cycles
(REPORT-1319 → REPORT-1658 → REPORT-1730 → this report). It is the one finding
here an editor can close with no judgement calls at all. Findings 7 and 8 are one
edit to AC-710: narrowing it to the envelope-finding contract dissolves the
staleness, and finding 1 then extends that same contract with a third trigger.

**Findings 2–6 are one wave, and they need a companion story-body edit.** All five
trace to BUNDLE-8/BUNDLE-10-era intents — BUG-14, BUG-17, BUG-18, BUG-19, BUG-20,
BUG-21, BUG-22 — plus REQ-88's late rounds, all of which shipped in `fold.ts` and
never reached the matrix. Neither story records those bundles in its attribution
chain. STORY-84's body describes the same retired per-run model and mentions
neither padding, nor the chip surface, nor the viewport-height response, so
repairing the ACs alone leaves an AC-vs-story inconsistency behind. REPORT-2088
(today, story level) filed exactly those four as violations 1–4 with `ac-edit` /
`ac-add` follow-ups named; the two levels should be repaired together. **If the
ac-level editor is not permitted to touch story bodies, record the residual
inconsistency explicitly rather than leaving it implicit — that omission is why
this is the seventh attempt.**

**Prefer correcting before adding.** AC-731 (finding 2) and AC-691 (finding 3) are
*statements* — one false against code, one materially incomplete — and a UAT
written faithfully to either pins behaviour the project has retired (AC-731's
per-run backing box is precisely what BUG-21 blamed for 2x-height buttons). Fix
those two first, then add the three missing ACs (findings 4, 5, 6).

**One correction carried forward from REPORT-1730, still worth stating.** AC-691
is *not* a contradiction: the fold still takes the scalar `axes` from the widest
cell (`fold.ts:1837`), and `responsiveTextTracks` is built so the widest keyframe
equals that scalar. The repair is an extension, not a replacement.

**REQ-136 is the one clean piece of recent work in this tree.** AC-1133 and
AC-1134 express its asks precisely — including the three admission rules and the
deliberate shadow-as-filter exclusion — and the rewritten AC-729 carries the axes
onto the image leaf. No finding is filed against them.

**Verification performed.** Every code claim above was read in this worktree
(`regression-d24ebf03`), not inherited: `probes.ts:405-416` and `:429-433`
(pinned-box content-overflow clip and the docstring naming all three violations),
`probes.ts:458-471` (synthesized-surface overlap exclusion), `fold.ts:552` and
`:657` (padding + responsive padding tracks, with their three call sites each),
`fold.ts:607-642` with `:1837`/`:1853` (responsive text tracks alongside the
widest-sample scalar), `fold.ts:1003-1054` and `:1836-1837`/`:2262` (self-painting
and padded-control runs, chip axes), `fold.ts:174`/`:188`/`:249-287` and
`:1578`/`:1687-1688`/`:1743-1744`/`:1814`/`:1943` (height probes and the viewport-height
response), `fold.ts:1397` and `:2064-2074` (bar detection, band/card partition),
`fold.ts:1599-1632` and `:1654-1666` (card grouping by measured surface identity,
captured surface rect preferred), `fold.ts:2105-2141` (page base by greatest total
band height incl. backdrops, run-count only as fallback), and the confirmed
absence of `adopt-values` / `adoptValues` anywhere under `tools/generate/src/`
(AC-696 holds). All 34 AC bodies were fetched from the ticket store this run and
searched programmatically for every term cited above; all ticket statuses and
field values were read from the store this run.
