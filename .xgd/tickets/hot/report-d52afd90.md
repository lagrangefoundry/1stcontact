---
uid: report-d52afd90
id: REPORT-1729
type: report
title: 'Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
  (level=story)'
created_by: xgd
created_at: '2026-08-09T06:38:07.121763+00:00'
updated_at: '2026-08-09T06:38:07.121763+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-2049c9ec
  level: story
  violations: 3
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
# Level: story

**Result**: FAIL
**Violations**: 3
**Warnings**: 1
**Needs review**: 0

## Cumulative Intent Considered

The two stories carry `intent_uid: bundle-31e474b9` (BUNDLE-7) and
`updated_by: bundle-ee56a66e` (BUNDLE-11). That chain alone under-reports the
intents that shaped this capability — the bulk of the fold/gate behaviour landed
through BUNDLE-8 and BUNDLE-10, whose members are named all over the two story
bodies and their ACs. The ledger is therefore widened to those two bundles
(explicitly permitted by step 0b), plus the standalone BUG-5.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-79 | free_and_reconciled | 2026-07-20 | Framework-pivot umbrella + plan items | YES |
| REQ-83 | free_and_reconciled | 2026-07-20 | Capture→L1 fold (keyframes + oracle) + structural-hint extractor | YES |
| REQ-86 | free_and_reconciled | 2026-07-20 | 3-probe end-to-end reproduction gate | YES |
| BUNDLE-7 | free_and_reconciled | 2026-07-22 | REQ-63 + REQ-79 + REQ-82 + REQ-83 + REQ-84 + REQ-85 + REQ-86 | YES (recorded as `intent_uid`) |
| BUG-5 | free_and_reconciled | 2026-07-23 | Fidelity gate must pair by stable occurrence identity; idempotence identity | YES |
| BUG-6 | free_and_reconciled | 2026-07-23 | Fold must emit a signalled residual, never silently drop | YES |
| BUG-7 | free_and_reconciled | 2026-07-23 | Evaluator must tile a row along the main axis | YES |
| BUG-8 | free_and_reconciled | 2026-07-23 | Keyframe at a reflow breakpoint must not resolve to the held pre-reflow frame | YES |
| BUG-9 | free_and_reconciled | 2026-07-23 | Structure recovery must recurse into nested regions | YES |
| BUG-11 / BUG-14 / BUG-19 / BUG-20 | free_and_reconciled | 2026-07-23 | Fold must reconstruct surfaces (band → card → run) and carry box treatments | YES |
| BUG-12 | free_and_reconciled | 2026-07-23 | Captured font faces must reach the fold's resource table | YES |
| BUG-13 | free_and_reconciled | 2026-07-23 | Section/CSS background-images must be foldable nodes | YES |
| **BUG-17** | free_and_reconciled | 2026-07-23 | Fold must carry captured element padding (`foldPadding`) | YES |
| **BUG-18** | free_and_reconciled | 2026-07-23 | Fold must keyframe responsive *scalar* text axes per width, not just geometry | YES |
| REQ-90 / REQ-92 | free_and_reconciled | 2026-07-23 | Resource table; rebuild `foldToL1` to the full L1 language + residuals | YES |
| **REQ-88** | free_and_reconciled | 2026-07-21 | Operator-runnable pipeline: `1c repro` (bundle → servable site, idempotent, assets mirrored) and `1c l1-gate` | YES |
| **BUG-23** | free_and_reconciled | 2026-07-24 | Reproduction must be self-contained: `localizeAssets` rewrites handles to the bundle mirror; an unmirrored handle fails the import; unreferenced mirrored assets reported | YES |
| BUNDLE-8 | free_and_reconciled | 2026-07-29 | BUG-6/7/8/9/10/11 + REQ-89/90/91/92 | YES (widened) |
| BUNDLE-10 | free_and_reconciled | 2026-07-29 | BUG-12…BUG-25 + REQ-88 + REQ-93 | YES (widened) |
| BUG-27 | free_and_reconciled | 2026-07-25 | Nested backdrops must be captured and fold to the background layer | YES |
| REQ-94 | free_and_reconciled | 2026-07-25 | Cross-gate reconciliation: perceptual floor, reference coverage, named causes | YES |
| REQ-96 | free_and_reconciled | 2026-07-26 | `control` node — reproduction half: captured control folds to a control leaf | YES |
| BUNDLE-11 | free_and_reconciled | 2026-08-05 | BUG-27 + REQ-94 + REQ-96 + 12 more | YES (recorded as `updated_by`) |
| REQ-97 | free_and_reconciled | 2026-07-26 | Text `sizing` — authoring face only; states folded reproductions are unaffected | YES (no CAP-71 obligation) |
| REQ-106 | free_and_reconciled | 2026-07-27 | Typed link role — L1 schema/renderer only; fold named as motivation, not asked | YES (no CAP-71 obligation) |
| REQ-82 / REQ-84 / REQ-85 / REQ-98…REQ-107 | free_and_reconciled | 2026-07-20 → 2026-07-27 | L1 substrate + behavior-module contract | YES (CAP-70, out of this capability) |
| REQ-63 | free_and_reconciled | 2026-07-20 | Capture/diff axis coverage audit | YES (CAP-63, out of this capability) |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-84 (fold) | REQ-79, REQ-83, REQ-92, REQ-90, BUG-6, BUG-11, BUG-12, BUG-13, BUG-14, BUG-19, BUG-20, BUG-27, REQ-96 (repro half) | aligned on the full-language fold, oracle retention, offline re-fold, hint sidecar, residual channel, backdrops, control seams, font table |
| STORY-84 (fold) | BUG-18 | **gap**: BUG-18 made `foldToL1` emit a per-width responsive scalar track for text axes that vary across the ladder; the story body keyframes geometry only |
| STORY-84 (fold) | BUG-17 | **thin**: fold-carries-padding is covered only by the generic phrase "each node carries its authored axes"; no explicit expression |
| STORY-86 (gate) | REQ-79, REQ-86, BUG-5, BUG-7, BUG-8, BUG-9, REQ-94 | aligned on the analytic evaluator, three probes, region-aware recursive recovery, fold-residual channel, cross-gate reconciliation |
| STORY-86 (gate) | — | **gap (consistency)**: capability cross-references are stale post-consolidation (CAP-71 self-references ×5, CAP-72 dangling) |
| CAP-71 story tree | REQ-88, BUG-23 | **gap**: `1c repro` (bundle → servable site) and reproduction asset localization are expressed by no story in this capability — and by no story anywhere in the matrix |
| STORY-84 + STORY-86 | — | exclusivity clean: each names the other's territory explicitly in its own Out-of-scope |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | CAP-71 story tree (no owning story) | story-body-edit | REQ-88 (free_and_reconciled, 2026-07-21, BUNDLE-10) asked for `1c repro` — an operator-runnable command that writes a site whose home page *is* the bundle's folded L1 document, mirrors the bundle's assets into the draft, and is idempotent. BUG-23 (free_and_reconciled, 2026-07-24) asked that the reproduction be self-contained: `localizeAssets` binds every asset-bearing axis to the bundle mirror, an unmirrored absolute handle **fails** the import, and unreferenced mirrored assets are reported. Both shipped — `tools/generate/src/cli/repro.ts:95` (`cmdRepro`), `tools/generate/src/l1/assets.ts:58` (`localizeAssets`), called at `tools/generate/src/cli/repro.ts:132` — with free-coded UATs (`tests/req88-l1-repro-pipeline.test.ts`, `tests/bug23-repro-local-assets.test.ts`). Neither behaviour appears in STORY-84 or STORY-86, in any of the 32 ACs under them, or in any of the other 23 story bodies in the matrix. The sibling command `cmdRefold` in the same file **is** expressed (AC-814); `cmdRepro` is not. | Express reproduction materialization in the capability: extend STORY-84 (or author a sibling story under CAP-71) covering `1c repro`'s bundle→site import, its idempotence, and BUG-23's self-containment rule (rewrite to mirror; hard-fail an unmirrored handle; report unreferenced mirrored assets). Note this is distinct from AC-854, which measures coverage on the *reference* manifest, not on the reproduction document |
| 2 | violation | coverage | STORY-84 | story-body-edit | BUG-18 (free_and_reconciled, 2026-07-23, BUNDLE-10) required the fold to keyframe **responsive scalar text axes** (`fontSizePx` / `lineHeightPx` / `letterSpacingPx`) per captured width, emitting a track only for an axis that actually varies — root cause was `foldToL1` taking flat axes from the widest present cell. Shipped as `responsiveTextTracks` (`tools/generate/src/l1/fold.ts:621`, used at `:1745`) with `tests/bug18-responsive-text-axes.test.ts`. STORY-84's body describes only "a geometry keyframe per sampled width" and its In-scope enumerates "geometry keyframes + interpolate/snap classification + visibility rules"; no AC under STORY-84 mentions a scalar/responsive track. The neighbouring CAP-70 stories both disclaim it: STORY-83 puts "*populating* the new axes … from a capture" out of scope, and STORY-81 puts "per-width variation of geometry, scalar and padding values" out of scope while pointing at "the capture-fold stories" | Extend STORY-84's description and In-scope to state that flat axes which vary across the ladder fold to a per-width scalar track (static axes stay scalar), and add an AC for it |
| 3 | violation | consistency | STORY-86 | story-body-edit | STORY-86's capability cross-references are stale after the 2026-08-05 consolidation recorded in this capability's own History. It refers to the fold as belonging to **CAP-71** in five places — Out-of-scope ("the fold itself, including which residuals it emits (CAP-71)"), Technical Context ("the capture→L1 fold + retained oracle (CAP-71, plan item 2)", "the fold decides *what* it cannot express (CAP-71)", "(CAP-71 / the fold story)") and Dependencies ("Plan item 2 — Capture → L1 Fold + Structural Hints (CAP-71)") — but STORY-86 now **lives in CAP-71** alongside the fold story STORY-84, so the parenthetical asserts a capability boundary that no longer exists. It also refers to "the `1c values-diff` duplicate-text pairing (**CAP-72**)", and CAP-72 is not a capability in the matrix — that behaviour is CAP-63 / STORY-75 ("Values-diff closes capture blind spots: … duplicate-text pairing") | Retarget the five CAP-71 references to the sibling story (STORY-84 / "the fold story") since the fold is now in the same capability, and correct "(CAP-72)" to CAP-63 / STORY-75. The behavioural content of the scope statements is correct and should be preserved — only the attributions are wrong |
| 4 | warning | coverage | STORY-84 | story-body-edit | BUG-17 (free_and_reconciled, 2026-07-23) required the fold to carry captured `paddingTop/Right/Bottom/LeftPx` onto text/image/box leaves (`foldPadding()`), noting that control padding correctly routes to the behavior module instead. STORY-84 covers this only under the generic phrase "each node carries its authored axes"; neither the story's In-scope list nor any of its 16 ACs names padding. CAP-70's STORY-83 lists "padding, per-width padding" as an L1 axis but explicitly disclaims populating axes from a capture, so the fold half has no explicit home | Opportunistic: name padding among the axes the fold carries, and record BUG-17's scope note that a control's padding is a behavior-module concern rather than an L1 leaf axis |
| 5 | info | exclusivity | STORY-84 + STORY-86 | — | No overlap. Each story explicitly excludes the other's territory: STORY-84 excludes "the end-to-end reproduction acceptance gate, its fidelity pairing of non-text leaves, and structure recovery (owned by the 3-Probe Reproduction Gate story)"; STORY-86 excludes the fold and which residuals it emits. The 2026-08-05 consolidation of CAP-73 into CAP-71 did not create duplicate coverage | none |
| 6 | info | — | STORY-84, STORY-86 | — | Both stories record `updated_by: bundle-ee56a66e` (BUNDLE-11) only, though BUNDLE-8 and BUNDLE-10 plainly reshaped this tree (BUG-5 through BUG-25, REQ-88, REQ-90, REQ-92 are named throughout the story bodies and ACs). `updated_by` appears to hold the most recent bundle rather than the accumulated set — a ledger-fidelity limitation to be aware of on the next check, not a story defect | none |

## Notes for the Editor

**The two coverage violations sit at opposite ends of the same pipeline and have a
common signature**: reconciled intent + shipped production code + passing
free-coded UATs (`test_UAT_FC_REQ-88_*`, `test_UAT_FC_BUG-23_*`,
`test_UAT_FC_BUG-18_*`), but no matrix element. This is behaviour that reconciled
into the codebase without reconciling into the capability — worth checking whether
other BUNDLE-8 / BUNDLE-10 members share the pattern in adjacent capabilities.

**Placement of finding 1 is the editor's call, but the gap is not.** No story in
any of the eight capabilities expresses `1c repro`. CAP-71 is the natural home —
its own scope statement is "capture → fold → render → gate", and `repro` is
precisely the adapter that lets `render` / `serve` / `shot` / `diff` operate on a
folded document (REQ-88's own framing). Its sibling verb `cmdRefold`, defined in
the same file, is already owned here by AC-814. The alternatives (CAP-82 Site
Delivery, CAP-89 Site Materials) are about deploying/serving a finished site and
about scaffolding a *new* one, neither of which is a bundle import. Whichever home
is chosen, the behaviour should stop being unowned.

**One cross-capability observation, out of scope for this check but adjacent to
finding 2**: BUG-18's *schema/renderer* half (the `l1ScalarTrack` axis and its
media-queried emission) appears to be unexpressed in CAP-70 as well — STORY-83's
node-level axis table lists "per-width geometry, sizing, … padding, per-width
padding" but no scalar/text track, and STORY-81 explicitly hands per-width value
variation to STORY-83. Worth confirming when CAP-70 is checked at story level;
finding 2 above claims only the fold half.

**Finding 3 is drift the consolidation itself introduced.** The 2026-08-05
structural rebalance merged CAP-73 into CAP-71 and updated the capability body's
History, but left STORY-86's internal cross-references pointing at the pre-merge
topology. Any future consolidation should sweep the merged stories' bodies for
capability ids.
