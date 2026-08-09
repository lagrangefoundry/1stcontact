---
uid: report-f17c1ea6
id: REPORT-1730
type: report
title: 'Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
  (level=ac)'
created_by: xgd
created_at: '2026-08-09T07:06:19.633558+00:00'
updated_at: '2026-08-09T07:06:19.633558+00:00'
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

CAP-71 (`capability-2049c9ec`) holds two `upgrade` stories, 16 active ACs each:
STORY-84 (`story-8acc338d`, the fold) and STORY-86 (`story-24098299`, the 3-probe
gate + cross-gate reconciliation). Both are Capability-Matrix story kinds, so both
are expected to carry ACs; both do.

**Working reference and its caveat.** At `ac` level the story body is normally the
working reference. That assumption does not hold cleanly here, and this is the
sixth attempt at this level. The story-level cycle for this capability last ran on
2026-08-07 (REPORT-1657 / `report-4c402cb8`) and **failed with 7 violations**, then
closed without repair: STORY-84 and STORY-86 were last written at
2026-08-07T23:54 — the `uat_coverage` field stamping that precedes the
`uat_coverage_check` at 23:56 — and **no body text changed**. I re-read both story
bodies in full this run and confirmed every drifted passage REPORT-1657 named is
still present verbatim (the flat per-run backing-box paragraph at story body lines
47–52; no occurrence of "padding", "chip", "pill" or "badge" anywhere in either
body). STORY-84's body is therefore known-drifted, and I have escalated to intent
+ code for STORY-84's fold ACs, as the level rules permit when the upper layer is
itself unsound.

**Nothing has been repaired since REPORT-1658.** All 32 ACs were last written
2026-08-07; no AC body text differs from what that report described, and no
capability_validation report for this subject exists after 2026-08-07. Findings
1–8 below are therefore substantively the same set, **independently re-derived and
re-verified against code in this worktree (`regression-50f23d80`)** rather than
inherited — with one correction to REPORT-1658's characterisation of finding 2
(see that finding's note).

**Summary of the split.** STORY-86's AC tree is in good shape apart from one
genuine, story-body-supported coverage hole that has now survived three ac-level
cycles (pinned-box content overflow — REPORT-1319 2026-08-05, REPORT-1658
2026-08-07, this report) and one stale/duplicated AC. STORY-84's AC tree carries
one direct contradiction of reconciled intent (AC-731), one materially incomplete
criterion (AC-691), and two reconciled fold behaviours no AC expresses at all.

## Cumulative Intent Considered

ACs in this tree carry no `intent_uid`/`updated_by` of their own — their fields are
`story_uid`, `kind`, `regression_only`, `uat_coverage` only — so attribution is
resolved at story level via the bundles plus each intent's own scope statement and
its code-attribution comments. Both stories carry `intent_uid: bundle-31e474b9`
(BUNDLE-7) and `updated_by: bundle-ee56a66e` (BUNDLE-11), skipping BUNDLE-8 and
BUNDLE-10 entirely — which is the mechanical root of the drift below.

Every status below was read from the ticket store this run.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-66 | free_and_reconciled | 2026-07-18 | `adopt-values` — retired by the L1 fold | YES (retired) |
| REQ-79 | free_and_reconciled | 2026-07-19 | Framework pivot to L1; absolute-base reproduction (D1) | YES |
| REQ-83 | free_and_reconciled | 2026-07-20 | Capture→L1 fold (keyframes + oracle) + hint sidecar — origin of STORY-84 | YES |
| REQ-86 | free_and_reconciled | 2026-07-20 | End-to-end 3-probe gate — origin of STORY-86 | YES |
| REQ-88 | free_and_reconciled | 2026-07-21 | `1c repro` / `1c l1-gate`; captured card rects, section-edge clamping | YES (partly — see finding 10) |
| BUG-5 | free_and_reconciled | 2026-07-23 | Fidelity pairing by stable occurrence identity + idempotence | YES |
| BUG-6 | free_and_reconciled | 2026-07-23 | Fold must signal residuals, not drop | YES |
| BUG-7 | free_and_reconciled | 2026-07-23 | Evaluator row/flow tiling | YES |
| BUG-8 | free_and_reconciled | 2026-07-23 | Half-open breakpoint intervals (evaluator defect, not fold) | YES |
| BUG-9 | free_and_reconciled | 2026-07-23 | `promoteToFlow` must recurse | YES |
| REQ-90 / REQ-91 / REQ-92 | free_and_reconciled | 2026-07-23 | Resource table, pixel-mover axes, full-language fold | YES |
| BUG-11 | free_and_reconciled | 2026-07-23 | Fold must carry surfaceFill/surfaceGradient | YES |
| BUG-12 / BUG-13 | free_and_reconciled | 2026-07-23 | Font faces reach the resource table; section/CSS bg-images foldable | YES |
| **BUG-14** | **free_and_reconciled** | **2026-07-23** | **Surface reconstruction is flat and per-run — rebuild section-band → card → text; stop per-run boxing** | **YES** |
| **BUG-17** | **free_and_reconciled** | **2026-07-23** | **Fold drops element padding — carry per-side padding onto leaves** | **YES** |
| **BUG-18** | **free_and_reconciled** | **2026-07-23** | **Flat text axes single-valued at desktop — keyframe them per width** | **YES** |
| **BUG-19** | **free_and_reconciled** | **2026-07-23** | **A full-bleed *bar* (footer/nav strip) must seed a band, not tiny cards** | **YES** |
| **BUG-20** | **free_and_reconciled** | **2026-07-23** | **Box treatments dropped; cause 1 — a chip run carries its own surface on its text leaf** | **YES** |
| **BUG-21** | **free_and_reconciled** | **2026-07-24** | **Padded control runs take the chip path — control surface boxes double-apply padding** | **YES** |
| BUG-23 | free_and_reconciled | 2026-07-24 | Bind asset handles to the bundle's mirror; unmirrored = hard fail | YES (see finding 10) |
| REQ-93 | free_and_reconciled | 2026-07-25 | L1 pages host behavior modules in slots (`forms.json` seam) | YES |
| BUG-27 | free_and_reconciled | 2026-07-25 | CSS bg-images/lazy media uncaptured; backdrop edges are section edges | YES |
| REQ-94 | free_and_reconciled | 2026-07-25 | Cross-gate reconciliation, perceptual floor, coverage, named causes | YES |
| REQ-96 | free_and_reconciled | 2026-07-26 | L1 `control` node — fold binds captured controls to module seams | YES |
| REQ-114 | free_and_reconciled | 2026-07-31 | L1 palette colour model (literal base, palette overlay) | out of scope (CAP-70) — finding 11 |
| BUG-25 | free_and_reconciled | 2026-07-23 | Multi-line runs must not share one box | YES, but CAP-63 owns (capture-manifest acceptance) |
| REQ-63, REQ-15/16/22/24 family | free_and_reconciled | various | Capture / values-diff axes | out of scope (CAP-63) |
| REQ-82/84/85, REQ-97–REQ-107 | free_and_reconciled | BUNDLE-7/11 | L1 schema, renderer, validator, axis vocabulary | out of scope (CAP-70) |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-689 (validated full-language document) | REQ-83, REQ-92 | aligned |
| AC-690 (oracle retained) | REQ-83 | aligned |
| **AC-691** (geometry keyframes; typography from widest sample) | REQ-83 | **incomplete vs BUG-18** — finding 2 |
| AC-692 (interpolate/snap) | REQ-83 | aligned |
| AC-693 (visibility rule) | REQ-83 | aligned |
| AC-694 / AC-695 (hint sidecar; advisory-only) | REQ-83 | aligned |
| AC-696 (adopt-values removed) | REQ-66 retirement | aligned (re-verified: no `adopt-values` / `adoptValues` anywhere in `tools/generate/src/`) |
| AC-729 (image leaf) | REQ-92 | aligned as a *fold* criterion; duplicates AC-733's negative case — finding 8 |
| AC-730 (text-free surface → box leaf) | REQ-92, BUG-11 | aligned |
| **AC-731** (run-composited surfaces) | BUG-11 | **contradicts BUG-14, misses BUG-19, conflicts with AC-812** — finding 3 |
| AC-732 (text pixel-movers + font table) | REQ-90, REQ-91, BUG-12 | aligned |
| AC-733 (typed residuals; controls bind) | BUG-6, REQ-96 | aligned |
| AC-812 (backdrop → background layer) | BUG-13, BUG-27 | aligned |
| AC-813 (control leaf rebased to seam) | REQ-96, REQ-93 | aligned |
| AC-814 (offline re-fold) | REQ-88 (`cmdRefold`) | aligned |
| **STORY-84 AC tree** | **BUG-17** | **gap — no AC mentions padding** (finding 4) |
| **STORY-84 AC tree** | **BUG-20, BUG-21** | **gap — no AC covers a text run that paints its own surface** (finding 5) |
| AC-705 (fidelity pairing) | BUG-5, REQ-96 | aligned |
| AC-706 / AC-707 (off-sample, robustness) | REQ-86, BUG-9 | aligned to the story body, but both enumerate only two of its three envelope violations — finding 1 |
| AC-708 (combined gate, non-vacuous) | REQ-86 | aligned |
| AC-709 (region-aware recursive recovery) | BUG-9 | aligned |
| **AC-710** (diagnostic findings) | REQ-86 | **stale + duplicative** — findings 6, 7 |
| AC-724 (idempotence identity) | BUG-5 | aligned |
| AC-734 (row tiling) | BUG-7 | aligned |
| AC-735 (half-open intervals) | BUG-8 | aligned |
| AC-736 (backing-surface overlap exception) | BUG-14 | aligned to the story body; broader than code — finding 9 |
| AC-737 (fold-residual channel) | REQ-92, REQ-96 | aligned |
| AC-852–AC-856 (cross-gate) | REQ-94, BUG-27 | aligned |
| **STORY-86 AC tree** | REQ-86 (story body, line 181) | **gap — pinned-box content overflow uncovered** (finding 1) |
| STORY-84 ↔ STORY-86 | — | exclusivity OK across stories; the reciprocal out-of-scope clauses partition fold vs gate cleanly |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-86 AC tree | ac-add | STORY-86's body names **three** envelope violations the evaluator reports — "sibling overlap, horizontal clip beyond the viewport, **and pinned-box content overflow**" (story body line 181) — and puts "its envelope findings" In scope. The third is live in code: `probes.ts:405-416` pushes a `clip` finding with detail `content height {N}px exceeds pinned box height {M}px` when a pinned box/container's flow-interior content exceeds its pinned keyframe height, and `evaluateLayout`'s own docstring (`probes.ts:429-433`) names all three. **No AC covers it.** Every AC that enumerates envelope violations names only overlap and viewport-edge clip: AC-706 ("no two leaf boxes overlap and no leaf clips beyond the viewport"), AC-707 ("no sibling overlap and no clip"), AC-734, AC-736 ("right edge extends beyond the viewport"); AC-710 fixes the finding vocabulary at "kind (overlap or clip)" without giving this trigger. A grep for "overflow" across all 32 AC bodies matches only AC-734's title. An implementer working from the AC tree alone would ship only the viewport clip. **Third raise: REPORT-1319 (2026-08-05) filed it as its sole violation; REPORT-1658 (2026-08-07) re-filed it; neither was repaired.** Independent of every STORY-84 issue below and fully repairable at this level. | Author an AC under STORY-86: a pinned box/container whose flow-interior content height exceeds its pinned keyframe height is reported as a `clip` finding naming the overflow magnitude and the offending path, at every evaluated width and under content perturbation. (Extending AC-707 alone is insufficient — AC-706 needs the same rule off-sample.) |
| 2 | violation | consistency | AC-691 | ac-edit | AC-691 closes with "A node's authored typography axes are taken from its **widest present sample** (the desktop rendering)", and its Verification stops at "Assert the node's typography axes match the widest sampled cell". BUG-18 (free_and_reconciled) was filed on exactly that rule — "flat text axes are single-valued at desktop — font-size not keyframed per width" — and its fix is on this branch: `RESPONSIVE_TEXT_AXES` + `responsiveTextTracks()` (`fold.ts:605-640`, applied at `fold.ts:1745`) emit a per-width keyframe track for `fontSizePx` / `lineHeightPx` / `letterSpacingPx` for any of those axes that varies across the ladder. **Correction to REPORT-1658, which called this a contradiction that would fail against real code:** it is not. `fold.ts:1729` still calls `textAxes(widest)`, and the code comment states the track is built so "the widest keyframe equals `axes.<name>`" — so AC-691's sentence and its assertion both remain literally true. The defect is that the AC presents the widest-sample rule as the *complete* account of what a folded node carries per width, so the responsive track — the whole of BUG-18's fix — is expressed by no AC in the tree (no AC body contains "track", "per-width", "fontSize" or "font-size"). It is a materially incomplete criterion, not a false one. | Extend AC-691: a numeric type axis that varies across the sampled ladder additionally folds to a per-width scalar keyframe track (interpolating between widths); an axis identical at every width stays a single scalar taken from the widest sample. Extend the Verification to assert the track on a varying axis and its absence on a static one. |
| 3 | violation | consistency | AC-731 | ac-edit | AC-731 encodes the flat per-run surface model that BUG-14 (free_and_reconciled, "Nest, don't flatten … Stop per-run boxing") retired, and misses BUG-19 entirely. Three divergences from shipped code, each re-verified this run: **(a)** "Every run whose composited surface differs from that band … folds an **additional backing box leaf** carrying that fill/gradient and **the run's geometry**" — the fold instead partitions surface rows into band rows and card rows (`fold.ts:1956-1966`) and groups card rows by measured surface identity via union-find (`buildCards`, `fold.ts:1491-1522`), emitting **one** box per card whose keyframe prefers the *captured surface rect* over the run box (`fold.ts:1546-1552`). **(b)** "The solid fill that the greatest **number of runs** sit on becomes the … background band" — the page base is chosen by **greatest total band height**, with captured backdrops counted alongside reconstructed bands (`bandHeightByFill`, `fold.ts:2005-2019`). AC-812 already states the backdrop half of that same rule ("its fill counts toward the page-base inference"), so AC-731 and AC-812 currently give two different rules for one decision. **(c)** BUG-19's full-bleed **bar** rule — a footer/nav strip whose runs are individually narrow but horizontally distributed seeds a band rather than tiny cards (`barBandFills`, `fold.ts:1289`, applied `fold.ts:1956-1962`) — is absent, and AC-731's single dominant-fill rule is precisely the rule BUG-19 documents as missing a bar. | Rewrite AC-731 as section-band → card → text reconstruction: band rows (full-width untreated runs, plus BUG-19 bar members) seed bands clamped to captured section edges; remaining surface-bearing rows group by measured surface identity into card boxes carrying the captured card rect; a narrow run sitting on its band emits nothing. Re-point the page-base rule at greatest total band height and defer to AC-812 rather than restating it. |
| 4 | violation | coverage | STORY-84 AC tree | ac-add | BUG-17 (free_and_reconciled, "Fold drops element padding — badges/buttons render cramped") requires the fold to carry captured per-side padding onto leaves; it added a node-level `padding` axis to L1 and the fold-side population. Shipped as `foldPadding()` (`fold.ts:550`, applied at `fold.ts:1748`, `:1876`, `:1918` — text, image and box leaves alike) plus `responsivePaddingTracks()` (`fold.ts:655`, applied at `:1752`, `:1880`, `:1922`). A case-insensitive grep for "padding" across all 32 AC bodies returns **zero matches**: AC-730's surface-axis enumeration (fill / gradient / border / shadow / radius / opacity / backdrop-blur / blend) and AC-729's image-axis list (object fit, radius, opacity, blend, border, shadow) both omit it, and AC-691's account of what a keyframe carries does not mention the per-side track. | Author an AC under STORY-84: a captured element's non-zero per-side padding folds onto its leaf as the `padding` axis (insetting content inside the pinned border-box rather than inflating geometry), with any side that varies across the ladder carried as a per-width track. |
| 5 | violation | coverage | STORY-84 AC tree | ac-add | BUG-20's cause 1 (free_and_reconciled) landed "L1 text leaves gain a self-surface" and "the fold folds a chip run's own surface onto its text leaf, and drops its card row so the pill is not also duplicated as a box behind it", discriminated by pill saturation (radius ≥ half the run's painted height). BUG-21 (free_and_reconciled) extends the same discriminator to padded control runs (buttons/submit links), whose modest rounding pill-saturation misses and which the card path was outsetting to 2× height and bleeding past the viewport at 320px. Shipped as `isSelfPaintingRun` / `isPaddedControlRun` / `chipAxes` (`fold.ts:903-960`), applied at `fold.ts:1728-1729` and `:2154`. A grep for "chip", "pill", "badge", "self-paint" across all 32 AC bodies returns **zero matches**. AC-730 covers only "a **text-free** element that paints a standalone surface" — the opposite case — and AC-732's text-leaf enumeration lists only typography plus the text pixel-movers (gradient fill, decoration, small-caps, list marker, text shadow). | Author an AC under STORY-84: a text run that paints its own surface — a saturated pill radius, or an authored vertical inset on a filled run (a button) — folds that surface (fill, radius, shadow, border) onto its **text** leaf and contributes no card row, so no duplicate box is emitted behind it; a run whose fill is attributable to an enclosing card (gradient or `borderLeft` accent present) keeps the card path. |
| 6 | warning | consistency | AC-710 | ac-edit | AC-710 states the fidelity residual in text-only terms — "carries the run text, the width, and the per-axis deltas … plus a coverage entry (text, width) for any oracle sample with no reproduced run". AC-705, its sibling under the same story, extended fidelity to image and box leaves, which carry no text and are "labelled by kind", and STORY-86's body states the same. A non-text residual therefore satisfies AC-705 and fails AC-710's literal wording. Re-raise from REPORT-1319 and REPORT-1658. | Reword AC-710's fidelity clause to "the leaf's text (or kind label)" and its coverage entry to "(text or kind label, width)" — or, better, apply finding 7 and delete the clause. |
| 7 | warning | exclusivity | AC-705 + AC-710 | ac-edit | AC-710's fidelity half restates AC-705's "Report shape" clause: the same residual (text, width, dx/dy/dw) and the same unmatched coverage entry are specified in both, and finding 6 shows the two copies have already diverged. AC-710's non-duplicated content is the **envelope-finding** diagnostic contract (kind, magnitude-bearing detail string, index paths of the leaves involved), which no other AC states. Re-raise from REPORT-1319 and REPORT-1658. | Narrow AC-710 to the envelope-finding diagnostic contract and delegate the fidelity residual shape to AC-705, leaving one authority per report shape. Pairs naturally with finding 1, which adds a third finding trigger to that same contract. |
| 8 | warning | exclusivity | AC-729 + AC-733 | ac-edit | AC-729 (image leaf) closes with the negative case — "A media element captured with no resolvable source, or with no box at any sampled width, produces no leaf at all: it is signalled as a residual" — and its Verification prescribes it ("Fold a fixture whose media element has no resolvable source and assert no image leaf is emitted and a residual is signalled"). AC-733 owns the residual channel and states and verifies the identical scenario ("a media element with no resolvable source or no geometry … Fold a capture containing a source-less image … assert one typed residual"). Two ACs specify the same criterion and prescribe the same test in the same shape. Re-raise from REPORT-1658. | Narrow AC-729 to what a foldable media element emits (leaf, source, alt text, geometry, axes) and let AC-733 own the source-less / geometry-less outcome; keep at most a cross-reference. |
| 9 | info | consistency | AC-736 | — | AC-736 excludes "a painted surface leaf — a childless box carrying a card/panel/section fill, positioned behind the content it backs" from the sibling-overlap check. The code is narrower: only **fold-synthesized** surfaces are excluded (`isSynthesizedSurfaceId`, `probes.ts:462-471` — `section-band-*` / `section-bg-*` / `card-*`), while a genuine captured standalone surface (`box-*`) "is real painted content and still participates" (`probes.ts:465-467`). AC-736 is faithful to STORY-86's body, which states the same broad rule, so this is story-body drift rather than ac-level drift — but a UAT written against AC-736's literal wording would assert exclusion for a captured `box-*` leaf and fail. | none at this level; flag for the story-level editor, then tighten AC-736 to fold-synthesized surfaces |
| 10 | info | coverage | REQ-88 (`1c repro`), BUG-23 | — | REQ-88's headline verb `1c repro` and BUG-23's mirror binding (`localizeAssets`, `assets.ts`; the unmirrored-handle hard failure in `cli/repro.ts`) are expressed by no story in the matrix — REPORT-1657 finding 7 established this at story level and it is unrepaired. Authoring ACs for them at ac level would attach them to the wrong story. Note in particular that AC-729's "source URL **resolved at capture time**" is **correct as a fold criterion** — the fold does emit the origin URL (`fold.ts:865` says so explicitly) and `localizeAssets` rewrites it downstream — so AC-729 must **not** be edited for BUG-23. | none at this level; waits on REPORT-1657 finding 7's placement decision |
| 11 | info | coverage | REQ-114 | — | REQ-114 (free_and_reconciled, the newest intent touching this tree) widens `l1Color` to `hex \| PaletteRef` across schema, renderer and validator. Its only fold-side footprint is a *non*-behaviour: the fold emits colour literals only, palette assignment being "a separate, re-runnable pass over a folded site" (`fold.ts:2007-2009`). Schema / renderer / validator belong to CAP-70 and nothing is asked of the fold or the gate, so this is not a CAP-71 AC gap. | none |
| 12 | info | coverage | AC-812, AC-813, AC-814, AC-852–AC-856 | — | These eight ACs carry no `uat_coverage` field at all; the other 24 carry `pass` or `fail`, and the capability's own `uat_coverage` is `fail`. That is a uat-level question, out of scope here; noted so the uat cycle knows where to look. | none at this level |

## Notes for the Editor

**Findings 1, 6 and 7 are the safe, self-contained repair.** All three sit under
STORY-86, all three are supported by STORY-86's own body, and none depends on
anything being resolved at story level. Finding 1 has now survived **three**
ac-level cycles unrepaired (REPORT-1319 → REPORT-1658 → this report) — it is the
single item most likely to be silently dropped again, and it is the one finding
here that a downstream editor can close with no judgement calls at all. Findings 6
and 7 are one edit to AC-710: narrowing it to the envelope-finding contract
dissolves the staleness, and finding 1 then extends that same contract with a
third trigger.

**Findings 2–5 are one wave.** All four trace to BUNDLE-10 fold-fidelity intents —
BUG-14, BUG-17, BUG-18, BUG-19, BUG-20, BUG-21 — that shipped in `fold.ts` on this
branch and never reached the matrix. Neither story records BUNDLE-10 (or BUNDLE-8)
in its attribution chain: both carry `intent_uid: bundle-31e474b9` (BUNDLE-7) and
`updated_by: bundle-ee56a66e` (BUNDLE-11). BUNDLE-11's reconciliation updated the
stories for its *own* intents (REQ-94, REQ-96, BUG-27 → AC-812/813/852–856) without
back-filling BUNDLE-10. Prefer fixing AC-731 and AC-691 (statements that are wrong
or incomplete) before adding the two new ACs.

**One correction to REPORT-1658 worth carrying forward.** That report classified
both AC-691 and AC-731 as contradictions whose faithful UATs "would encode a fixed
bug and fail against real code". That holds for **AC-731** (its per-run backing-box
rule and its run-count page-base rule are both false against `fold.ts`), but **not
for AC-691**: the fold still takes the scalar `axes` from the widest cell
(`fold.ts:1729`), and `responsiveTextTracks` is explicitly built so the widest
keyframe equals that scalar. AC-691's sentence is true but incomplete. The repair
is an extension, not a replacement — an editor who deletes the widest-sample
sentence outright will make the AC wrong in the other direction.

**Findings 2–5 need a companion story-body edit.** STORY-84's body describes the
same retired per-run model (lines 47–52) and mentions neither padding nor the chip
surface, so repairing the ACs alone leaves an AC-vs-story inconsistency behind. The
story-level cycle closed on 2026-08-07 without applying REPORT-1657's findings 1–6,
which are the exact counterparts of these. If the ac-level editor is not permitted
to touch story bodies, record the residual inconsistency explicitly rather than
leaving it implicit — that omission is why this is the sixth attempt.

**What is deliberately not filed here.** `1c repro` / BUG-23 (finding 10) lack an
AC only because no story claims the behaviour; both wait on the story-level
placement decision. AC-736's over-broad wording (finding 9) is faithful to its
story body and is likewise story-level work. None of these are counted as
violations at this level.

**Verification performed.** Every code claim above was read in this worktree
(`regression-50f23d80`), not inherited: `probes.ts:405-416` and `:429-433`
(pinned-box content-overflow clip finding and the docstring naming all three
violations), `probes.ts:462-471` (synthesized-surface overlap exclusion),
`fold.ts:550` and `:655` (padding + responsive padding tracks, with their three
call sites each), `fold.ts:605-640` and `:1729`/`:1745` (responsive text tracks
alongside the widest-sample scalar), `fold.ts:875-960` (self-painting / padded
control runs, chip axes), `fold.ts:1289` and `:1940-1995` (bar detection, band/card
partition, section edges incl. backdrop edges), `fold.ts:1491-1552` (card grouping
by measured surface identity, captured surface rect preferred), `fold.ts:2005-2019`
(page base by greatest total band height incl. backdrops), and the confirmed
absence of `adopt-values` / `adoptValues` anywhere under `tools/generate/src/`
(AC-696 holds). All ticket statuses, field values and body texts were read from the
ticket store this run.
