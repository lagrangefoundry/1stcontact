---
uid: report-f3b0654d
id: REPORT-1658
type: report
title: 'Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
  (level=ac)'
created_by: xgd
created_at: '2026-08-07T23:37:21.187736+00:00'
updated_at: '2026-08-07T23:37:21.187736+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-2049c9ec
  level: ac
  violations: 5
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
# Level: ac

**Result**: FAIL
**Violations**: 5
**Warnings**: 3
**Needs review**: 0

CAP-71 holds two stories with 16 ACs each: STORY-84 (`story-8acc338d`, the fold)
and STORY-86 (`story-24098299`, the 3-probe gate + cross-gate reconciliation).

**Working reference and its caveat.** At `ac` level the story body is normally the
working reference. That assumption does not hold cleanly here: the story-level
cycle for this capability ran earlier today and **failed** (REPORT-1657 /
`report-4c402cb8`, 2026-08-07 — 7 violations, 1 warning), then closed without
repair (`check_story_validation completed: done`; neither story has been touched
since 2026-08-06). STORY-84's body is therefore known-drifted. I have accordingly
escalated to intent + code for STORY-84's fold ACs, as the level rules permit when
the upper layer is itself unsound, and I re-verified every claim against
`tools/generate/src/l1/fold.ts` and `probes.ts` in this worktree rather than
inheriting REPORT-1657's conclusions.

**Summary of the split.** STORY-86's AC tree is in good shape apart from one
genuine, story-body-supported coverage hole that has now survived two ac-level
cycles (the pinned-box content-overflow finding, first raised in REPORT-1319 on
2026-08-05 and never repaired) and one stale AC. STORY-84's AC tree carries **two
direct contradictions of reconciled intent** — AC-691 and AC-731 each state as the
criterion the exact behaviour a reconciled BUG was filed to remove — plus two
reconciled fold behaviours no AC expresses.

## Cumulative Intent Considered

Chronological ledger. ACs in this tree carry no `intent_uid`/`updated_by` of their
own (fields are `story_uid`, `kind`, `regression_only`, `uat_coverage` only), so
attribution is resolved at story level via the bundles plus each intent's own scope
statement and its code attribution comments.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-79 | free_and_reconciled | BUNDLE-7, 2026-07-22 | Framework pivot to L1; absolute-base reproduction (D1) | YES |
| REQ-83 | free_and_reconciled | BUNDLE-7, 2026-07-22 | Capture→L1 fold (keyframes + oracle) + hint sidecar — origin of STORY-84 | YES |
| REQ-86 | free_and_reconciled | BUNDLE-7, 2026-07-22 | End-to-end 3-probe gate — origin of STORY-86 | YES |
| REQ-66 | free_and_reconciled | earlier | `adopt-values` — retired by the L1 fold | YES (retired) |
| BUG-5 | free_and_reconciled | BUNDLE-8, 2026-07-29 | Fidelity pairing by stable occurrence identity + idempotence | YES |
| BUG-6 | free_and_reconciled | BUNDLE-8, 2026-07-29 | Fold must signal residuals, not drop | YES |
| BUG-7 | free_and_reconciled | BUNDLE-8, 2026-07-29 | Evaluator row/flow tiling | YES |
| BUG-8 | free_and_reconciled | BUNDLE-8, 2026-07-29 | Half-open breakpoint intervals | YES |
| BUG-9 | free_and_reconciled | BUNDLE-8, 2026-07-29 | `promoteToFlow` must recurse | YES |
| REQ-90 / REQ-91 / REQ-92 | free_and_reconciled | BUNDLE-8, 2026-07-29 | Resource table, pixel-mover axes, full-language fold | YES |
| BUG-11 | free_and_reconciled | 2026-07-29 | Fold must carry surfaceFill/surfaceGradient | YES |
| BUG-12 / BUG-13 | free_and_reconciled | 2026-08-05 | Font faces reach the resource table; section/CSS bg-images foldable | YES |
| **BUG-14** | **free_and_reconciled** | **2026-08-05** | **Surface reconstruction is flat and per-run — rebuild section-band → card → text; stop per-run boxing** | **YES** |
| **BUG-17** | **free_and_reconciled** | **2026-08-05** | **Fold drops element padding — carry per-side padding onto leaves** | **YES** |
| **BUG-18** | **free_and_reconciled** | **2026-08-05** | **Flat text axes single-valued at desktop — keyframe them per width** | **YES** |
| **BUG-19** | **free_and_reconciled** | **2026-08-05** | **Full-bleed *bar* fill (footer/nav strip) must seed a band, not tiny cards** | **YES** |
| **BUG-20** | **free_and_reconciled** | **2026-08-05** | **A self-painting chip run carries its own surface on its text leaf** | **YES** |
| **BUG-21** | **free_and_reconciled** | **2026-08-05** | **Padded control runs take the chip path — control surface boxes double-apply padding** | **YES** |
| BUG-23 | free_and_reconciled | 2026-08-05 | Bind asset handles to the bundle's mirror; unmirrored = hard fail | YES (see finding 8) |
| REQ-88 | free_and_reconciled | 2026-08-05 | `1c repro`/`1c l1-gate`; captured card rects, section-edge clamping, responsive padding tracks | YES (partly, see finding 9) |
| REQ-93 | free_and_reconciled | 2026-08-05 | L1 pages host behavior modules in slots (`forms.json` seam) | YES |
| BUG-27 | free_and_reconciled | BUNDLE-11, 2026-08-06 | CSS bg-images/lazy media uncaptured; backdrop edges are section edges | YES |
| REQ-94 | free_and_reconciled | BUNDLE-11, 2026-08-06 | Cross-gate reconciliation, perceptual floor, coverage, named causes | YES |
| REQ-96 | free_and_reconciled | BUNDLE-11, 2026-08-06 | L1 `control` node — fold binds captured controls to module seams | YES |
| BUG-25 | free_and_reconciled | 2026-08-05 | Multi-line runs must not share one box | YES (CAP-63 owns) |
| REQ-114 | free_and_reconciled | 2026-08-07 | L1 palette colour model (literal base, palette overlay) | out of scope (CAP-70) — see finding 11 |
| REQ-63, REQ-15/16/22/24 family | free_and_reconciled | various | Capture/values-diff axes | out of scope (CAP-63) |
| REQ-82/84/85, REQ-97–REQ-107 | free_and_reconciled | BUNDLE-7/11 | L1 schema, renderer, validator, axis vocabulary | out of scope (CAP-70) |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-689 (validated full-language document) | REQ-83, REQ-92 | aligned |
| AC-690 (oracle retained) | REQ-83 | aligned |
| **AC-691** (keyframes; typography from widest sample) | REQ-83 | **contradicts BUG-18** — finding 2 |
| AC-692 (interpolate/snap) | REQ-83 | aligned |
| AC-693 (visibility rule) | REQ-83 | aligned |
| AC-694 / AC-695 (hint sidecar; advisory-only) | REQ-83 | aligned |
| AC-696 (adopt-values removed) | REQ-66 retirement | aligned (verified: no `adopt-values` in `tools/generate/src/`) |
| AC-729 (image leaf) | REQ-92 | aligned as a *fold* criterion — finding 8 records why BUG-23 does not land here |
| AC-730 (text-free surface → box leaf) | REQ-92, BUG-11 | aligned |
| **AC-731** (run-composited surfaces) | BUG-11 | **contradicts BUG-14 and misses BUG-19** — finding 3 |
| AC-732 (text pixel-movers + font table) | REQ-90, REQ-91, BUG-12 | aligned |
| AC-733 (typed residuals; controls bind) | BUG-6, REQ-96 | aligned |
| AC-812 (backdrop → background layer) | BUG-13, BUG-27 | aligned |
| AC-813 (control leaf rebased to seam) | REQ-96, REQ-93 | aligned |
| AC-814 (offline re-fold) | REQ-88 (`cmdRefold`) | aligned |
| STORY-84 AC tree | **BUG-17, BUG-20, BUG-21** | **gap — no AC mentions padding or the chip self-surface** (findings 4, 5) |
| AC-705 (fidelity pairing) | BUG-5, REQ-96 | aligned |
| AC-706 / AC-707 (off-sample, robustness) | REQ-86, BUG-9 | aligned to the story body |
| AC-708 (combined gate, non-vacuous) | REQ-86 | aligned |
| AC-709 (region-aware recursive recovery) | BUG-9 | aligned |
| **AC-710** (diagnostic findings) | REQ-86 | **stale** — text-only fidelity residual, superseded by AC-705's kind labels (finding 6) |
| AC-724 (idempotence identity) | BUG-5 | aligned |
| AC-734 (row tiling) | BUG-7 | aligned |
| AC-735 (half-open intervals) | BUG-8 | aligned |
| AC-736 (backing-surface overlap exception) | BUG-14 | aligned to the story body; narrower in code — finding 10 |
| AC-737 (fold-residual channel) | REQ-92, REQ-96 | aligned |
| AC-852–AC-856 (cross-gate) | REQ-94, BUG-27 | aligned (verified against `tools/generate/src/cli/gate.ts` — all four named causes, floor, coverage, exit-code rule present) |
| STORY-86 AC tree | REQ-86 (story body) | **gap — pinned-box content overflow uncovered** (finding 1) |
| STORY-84 ↔ STORY-86 | — | exclusivity OK across stories; reciprocal out-of-scope clauses are clean |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-86 AC tree | ac-add | STORY-86's body names **three** envelope violations the evaluator reports — "sibling overlap, horizontal clip beyond the viewport, **and pinned-box content overflow**" — and puts "its envelope findings" In scope. The third is live: `probes.ts:409-416` raises a `clip` finding with detail `content height Npx exceeds pinned box height Mpx` when a pinned box/container's flow-interior content exceeds its pinned keyframe height; `evaluateLayout`'s own docstring (`probes.ts:429-433`) names all three. **No AC covers it.** Every AC that enumerates envelope violations names only overlap and viewport-edge clip — AC-706 ("no two leaf boxes overlap and no leaf clips beyond the viewport"), AC-707 ("no sibling overlap and no clip"), AC-734, AC-736 ("right edge extends beyond the viewport"); AC-710 fixes the vocabulary at "kind (overlap or clip)" without giving this trigger. An implementer working from the AC tree alone would ship only the viewport clip. **This is a re-raise: REPORT-1319 (2026-08-05) filed it as its sole violation and it was never repaired.** It is independent of every STORY-84 issue below and is fully repairable at this level. | Author an AC under STORY-86: a pinned box/container whose flow-interior content height exceeds its pinned keyframe height is reported as a `clip` finding naming the overflow magnitude and the offending path, at every evaluated width and under content perturbation. (Extending AC-707 alone is insufficient — AC-706 needs the same rule off-sample.) |
| 2 | violation | consistency | AC-691 | ac-edit | AC-691 states "A node's authored typography axes are taken from its **widest present sample** (the desktop rendering)." That is verbatim the root cause BUG-18 (free_and_reconciled, 2026-08-05) was filed to remove: "flat text axes are single-valued at desktop — font-size not keyframed per width". The fix is on this branch: `RESPONSIVE_TEXT_AXES` + `responsiveTextTracks()` (`fold.ts:605-640`, applied at `fold.ts:1745`) emit a per-width keyframe track for `fontSizePx` / `lineHeightPx` / `letterSpacingPx` whenever the axis varies across the ladder; only an axis identical at every width stays a single scalar. The AC states the pre-fix behaviour as the criterion, so a UAT written faithfully against it would assert the bug and fail against current code. | Replace the "widest present sample" sentence with: a numeric type axis that varies across the sampled ladder folds to a per-width scalar keyframe track (interpolating between widths); an axis identical at every width stays a single scalar taken from the widest sample. |
| 3 | violation | consistency | AC-731 | ac-edit | AC-731 encodes the flat per-run surface model that BUG-14 (free_and_reconciled, 2026-08-05, "Surface reconstruction is flat and per-run … Nest, don't flatten … Stop per-run boxing") retired, and misses BUG-19 entirely. Three separate divergences from shipped code: (a) **"Every run whose composited surface differs from that band … folds an additional backing box leaf carrying that fill/gradient and *the run's geometry*"** — the fold instead partitions surface rows into band rows and card rows and groups card rows by measured surface identity via union-find (`buildCards`, `fold.ts:1491-1531`), emitting **one** box per card whose geometry is the *captured surface rect* (`surfaceFrames`, `fold.ts:1546-1550`), not one box per run carrying the run's box; (b) **"The solid fill that the greatest **number of runs** sit on becomes the … background band"** — the page base is chosen by **greatest total band height** (`bandHeightByFill`, `fold.ts:2005-2019`), with captured backdrops counted alongside reconstructed bands (BUG-27) — which is also what AC-812 already states ("its fill counts toward the page-base inference"), so AC-731 and AC-812 currently give two different rules for the same decision; (c) BUG-19's full-bleed **bar** rule (`barBandFills`, `fold.ts:1289`, applied at `fold.ts:1956-1962`) — a footer/nav strip whose runs are individually narrow but horizontally distributed seeds a band — is absent, and AC-731's single dominant-fill rule is exactly the rule BUG-19 showed misses a bar. | Rewrite AC-731 as section-band → card → text reconstruction: band rows (full-width untreated runs, plus BUG-19 bar members) seed bands clamped to captured section edges; remaining surface-bearing rows group by measured surface identity into card boxes carrying the captured card rect; runs sitting on their band emit nothing. Re-point the page-base rule at greatest total band height and defer to AC-812 rather than restating it. |
| 4 | violation | coverage | STORY-84 AC tree | ac-add | BUG-17 (free_and_reconciled, 2026-08-05, "Fold drops element padding — badges/buttons render cramped") requires the fold to carry captured per-side padding onto leaves. Shipped as `foldPadding()` (`fold.ts:550-570`, applied at `fold.ts:1748`, `:1876`, `:1918` — text, image and box leaves alike) plus `responsivePaddingTracks()` (`fold.ts:655-672`, applied at `:1752`, `:1880`, `:1922`). The word "padding" appears in **no AC** under STORY-84: AC-730's surface-axis enumeration (fill / gradient / border / shadow / radius / opacity / backdrop-blur / blend) and AC-729's image-axis list (object fit, radius, opacity, blend, border, shadow) both omit it, and AC-691's account of what a keyframe carries does not mention the per-side track. | Author an AC: a captured element's non-zero per-side padding folds onto its leaf as the `padding` axis (insetting content inside the pinned border-box rather than inflating geometry), with any side that varies across the ladder carried as a per-width track. |
| 5 | violation | coverage | STORY-84 AC tree | ac-add | BUG-20 (free_and_reconciled, 2026-08-05) requires a self-painting run to carry its own surface on its **text** leaf and to contribute no card row, so the pill is not also duplicated as a box behind it; BUG-21 (same date) extends the discriminator to padded control runs (buttons/submit links), whose modest rounding pill-saturation misses and which the card path was outsetting to 2x height. Shipped as `isSelfPaintingRun` / `isPaddedControlRun` / `chipAxes` (`fold.ts:903-960`), applied at `fold.ts:1728-1729` and `:2154`. **No AC covers a text-bearing run that paints its own surface.** AC-730 covers only "a **text-free** element that paints a standalone surface" — the opposite case — and AC-732's text-leaf enumeration lists only typography plus the text pixel-movers (gradient fill, decoration, small-caps, list marker, text shadow). | Author an AC: a text run that paints its own surface — saturated pill radius, or an authored vertical inset on a filled run (a button) — folds that surface (fill, radius, shadow, border) onto its **text** leaf and emits no card box behind it; a run whose fill is attributable to an enclosing card keeps the card path. |
| 6 | warning | consistency | AC-710 | ac-edit | AC-710 describes the fidelity residual in text-only terms — "carries the run text, the width, and the per-axis deltas … plus a coverage entry (text, width) for any oracle sample with no reproduced run". AC-705 (its sibling under the same story) extended fidelity to image and box leaves, which carry no text and are "labelled by kind", and the story body states the same. AC-710 was never followed: a non-text residual satisfies AC-705 and fails AC-710's literal wording. Also a re-raise from REPORT-1319. | Reword AC-710's fidelity clause to "the leaf's text (or kind label)" and its coverage entry to "(text or kind label, width)" — or, better, apply finding 7 and delete the clause. |
| 7 | warning | exclusivity | AC-705 + AC-710 | ac-edit | AC-710's fidelity half restates AC-705's "Report shape" clause: the same residual (text, width, dx/dy/dw) and the same unmatched coverage entry are specified in both, and finding 6 shows the two copies have already diverged. AC-710's non-duplicated content is the **envelope-finding** diagnostic contract (kind, magnitude-bearing detail, leaf index paths), which no other AC states. Also a re-raise from REPORT-1319. | Narrow AC-710 to the envelope-finding diagnostic contract and delegate the fidelity residual shape to AC-705, leaving one authority per report shape. Pairs naturally with finding 1, which adds a third finding kind to AC-710's remit. |
| 8 | warning | exclusivity | AC-729 + AC-733 | ac-edit | AC-729 (image leaf) closes with the negative case — "A media element captured with no resolvable source, or with no box at any sampled width, produces no leaf at all: it is signalled as a residual" — and its Verification exercises it ("Fold a fixture whose media element has no resolvable source and assert no image leaf is emitted and a residual is signalled"). AC-733 owns the residual channel and states and verifies the identical scenario ("a media element with no resolvable source or no geometry … Fold a capture containing a source-less image … assert one typed residual"). Two ACs specify the same criterion and prescribe the same test in the same shape. | Narrow AC-729 to what a foldable media element emits (leaf, source, alt text, geometry, axes) and let AC-733 own the source-less/geometry-less outcome; keep at most a cross-reference. |
| 9 | info | consistency | AC-729 (BUG-23) | — | REPORT-1657 finding 6 suggested an `ac-edit` on AC-729 because AC-729 says the image leaf carries "the source URL **resolved at capture time**" while BUG-23 requires binding to the bundle's mirror. Verified: AC-729 is **correct as a fold criterion**. The fold does emit the origin URL and says so (`fold.ts:865`: "`localizeAssets` rewrites it to the bundle's mirror"); the rewrite and the unmirrored-handle hard failure live in `localizeAssets` (`assets.ts:58`) called from `repro.ts:132` — i.e. in `1c repro`, which no story in the matrix expresses (REPORT-1657 finding 7). BUG-23 therefore has no AC-level home until that story-level placement decision is made. Do **not** edit AC-729 for this. | none at this level; cascades from REPORT-1657 finding 7 |
| 10 | info | consistency | AC-736 | — | AC-736 excludes "a painted surface leaf — a childless box carrying a card/panel/section fill, positioned behind the content it backs" from the sibling-overlap check. The code is narrower: only **fold-synthesized** surfaces are excluded (`isSynthesizedSurfaceId`, `probes.ts:471` — `section-band-*` / `section-bg-*` / `card-*`), while "a genuine captured standalone surface (`box-*`) is real painted content and still participates" (`probes.ts:465-467`). AC-736 is faithful to STORY-86's body, which states the same broad rule, so this is story-body drift rather than ac-level drift — but a UAT written against AC-736's literal wording would assert exclusion for a captured `box-*` leaf and fail. | none at this level; flag for the story-level editor, then tighten AC-736 to fold-synthesized surfaces |
| 11 | info | coverage | REQ-114 | — | REQ-114 (free_and_reconciled, 2026-08-07 — the newest intent touching this tree) widens `l1Color` to `hex \| PaletteRef` across schema, renderer and validator. Its only fold-side footprint is a *non*-behaviour: the fold emits colour literals only, palette assignment being "a separate, re-runnable pass over a folded site" (`fold.ts:2007-2009`). Schema/renderer/validator are CAP-70's, and nothing is asked of the fold or the gate, so this is not a CAP-71 AC gap. | none |
| 12 | info | coverage | AC-812, AC-813, AC-814, AC-852–AC-856 | — | These eight ACs carry no `uat_coverage` field at all (the other 24 carry `pass`), consistent with the capability's own `uat_coverage: fail`. That is a uat-level question, out of scope here; noted so the uat cycle knows where to look. | none at this level |

## Notes for the Editor

**Findings 1, 6 and 7 are the safe, self-contained repair.** All three sit under
STORY-86, all three are supported by STORY-86's own body, and none depends on
anything being resolved at story level. Finding 1 has now survived two ac-level
cycles unrepaired (REPORT-1319, 2026-08-05 → this report) — it is the single item
most likely to be silently dropped again. Findings 6 and 7 are one edit to AC-710:
narrowing it to the envelope-finding contract dissolves the staleness, and finding 1
then extends that same contract with a third trigger.

**Findings 2–5 are one wave, and two of them are contradictions rather than
omissions.** All four are BUNDLE-10 (2026-08-05) fold-fidelity intents — BUG-14,
BUG-17, BUG-18, BUG-19, BUG-20, BUG-21 — that shipped in `fold.ts` on this branch
and never reached the matrix. AC-691 and AC-731 do not merely omit the new
behaviour: each states the pre-fix behaviour *as its criterion*, so a UAT authored
faithfully from either would encode a fixed bug and fail against real code. Prefer
fixing those two before adding the two new ACs.

**A caveat REPORT-1319 raised that no longer applies.** On 2026-08-05 that report
declined to author these ACs because BUNDLE-10's code was not yet on the branch and
writing ACs for absent behaviour "would invert the drift". That is no longer the
situation: `responsiveTextTracks`, `foldPadding`, `responsivePaddingTracks`,
`chipAxes` / `isSelfPaintingRun` / `isPaddedControlRun`, `barBandFills`, and
`buildSolidBands` / `buildCards` are all present and reachable in
`tools/generate/src/l1/fold.ts` in this worktree (line numbers cited per finding).
The code now leads the matrix, so authoring these ACs closes drift rather than
creating it.

**Findings 2–5 need a companion story-body edit.** STORY-84's body describes the
same retired per-run model and mentions neither padding nor the chip surface, so
repairing the ACs alone leaves an AC-vs-story inconsistency behind. The story-level
cycle closed today without applying REPORT-1657's findings 1–6, which are the exact
counterparts of these. If the ac-level editor is not permitted to touch story
bodies, note the residual inconsistency explicitly rather than leaving it implicit.

**What is deliberately not filed here.** BUG-23's mirror binding (finding 9) and
REQ-88's `1c repro` both lack an AC only because no story claims the behaviour;
authoring ACs for them at this level would attach them to the wrong story. Both wait
on REPORT-1657 finding 7's placement decision. AC-736's over-broad wording
(finding 10) is faithful to its story body and is likewise story-level work.

**Verification performed.** Every code claim above was read in this worktree
(`regression-5096fbee`), not inherited: `probes.ts:409-416` and `:429-433` and
`:465-474` (envelope findings, overlap exclusion), `fold.ts:550-572` and `:605-672`
(padding + responsive tracks), `:903-960` (self-painting runs, chip axes),
`:1289-1310` and `:1944-1995` (bar detection, band/card partition, section edges),
`:1491-1550` (card grouping by measured surface identity), `:2005-2019` (page-base
by total band height), `assets.ts:58` and `repro.ts:132` (localization), and
`cli/gate.ts:116-347` (all four named cross-gate causes, floor, verdict labels).
REPORT-1657's finding 6 was checked and **downgraded** as a result (finding 9).
