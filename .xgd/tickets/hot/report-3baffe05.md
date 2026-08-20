---
uid: report-3baffe05
id: REPORT-2431
type: report
title: 'Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
  (level=story)'
created_by: xgd
created_at: '2026-08-20T12:22:51.834047+00:00'
updated_at: '2026-08-20T12:22:51.834047+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-2049c9ec
  level: story
  violations: 2
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
# Level: story

**Result**: FAIL
**Violations**: 2
**Warnings**: 3
**Needs review**: 0

Attempt 12. All five mutations of the previous cycle (`report-ba8a5db7`, REPORT-2428,
answering `report-c2092e9d`/REPORT-2427) are **verified landed**, re-read this cycle
through `xgd ticket get --json` (STORY-84 29024 chars, STORY-86 20134 chars,
CAP-71 2770 chars):

| Prior mutation | Landed |
|---|---|
| 1 — `labelMode` derivation, STORY-84 derived-config paragraph made explicitly complete | yes — six facts enumerated, closing "Nothing else about a seam is derived" |
| 2 — In-scope clause widened to the same six facts | yes |
| 3 — Technical Context bullet: the two derived facts with no painted witness | yes, and it correctly defers `config`-vs-L1 placement to the behavior-module contract |
| 4 — CAP-71 fourth Scope bullet (cross-gate acceptance verdict) + opening line + Out-of-scope clause | yes — capability body now carries all four |
| 5 — STORY-86 title widened to name the cross-gate verdict | yes |

None of this cycle's findings is a repeat.

## Sweeps used this cycle

Both never-run angles the prior cycle's notes named were executed, plus two of my own.

1. **The archived CAP-73 body** (the prior cycle's recommended next angle —
   `capability-8108afab`, `merged_into: capability-2049c9ec`). Read in full and
   reconciled against CAP-71's Scope. **Clean, no finding.** Every claim CAP-73 made
   — the three probes named individually, the browser-free evaluator mirroring
   `interpolate|snap` and flow stacking, demand-driven structure recovery, and
   residuals-as-framework-gaps — is present in CAP-71's Scope or STORY-86's body.
   The 2026-08-05 consolidation lost nothing from CAP-73; the gap the prior cycle
   found (REQ-94's cross-gate boundary) post-dated CAP-73 and was never in it.

2. **The input/options surface of the owned verbs** (new — prior cycles enumerated
   only *reported output* fields, and that sweep is spent). Every `*Options`
   interface across the eight owned files: `FoldOptions` (engine, fonts, residuals,
   forms), `EvaluateOptions` (contentScale, epsilonPx), `SampleFidelityOptions`,
   `ThreeProbeOptions` (incl. `recovered` — the absolute-base/overlay split),
   `ReproOptions`, `L1CaptureOptions`, `GateOptions`. **Clean, no finding** —
   every operator-meaningful knob is expressed; the remainder is plumbing (`port`,
   `driverFactory`, `out`) and `actualImagePath` / `actualManifestPath` are exactly
   the "offline seams their own verbs expose" STORY-86 already names.

3. **Every round-pass section of BUNDLE-10, not only Round-9** (the angle the prior
   cycle's own ledger note prescribed: "A future cycle reading BUNDLE-10 should
   split on `\n## ` and read **every** section"). Read Round-5, the Round-5
   follow-up, Round-6 (five numbered items), Round-7, Round-8 (four further
   findings), the round-8 follow-on, and GA round-10. **This is where all five of
   this cycle's findings came from** — every one sits in REQ-88's *column /
   surface-rect* work, which no prior cycle reached. Round-9 was the only pass ever
   mined.

4. **Term-scan of all 31 story bodies** per candidate (`.xgd/tmp/scan12.py`,
   `.xgd/tmp/ctx12.py`) to establish that each candidate is unowned matrix-wide.
   Decisive result: `centred column` / `content column` / `column anchor` /
   `containerPx` / `insetPx` return hits in **STORY-84 only** — the centred column
   and everything derived from it is this story's alone, so any rule about it that
   STORY-84 omits is unowned by the whole matrix.

**Evidence run.** `npm test -- tests/req88-viewport-relative-and-nowrap.test.ts` →
**21 passed / 21**, 1.08s. Every behaviour below is live and pinned; the gap is
purely that the matrix does not describe it. (The two browser-backed files the
prior cycle could not run remain unrunnable in this sandbox — `EPERM` on socket
bind — but none of this cycle's findings depends on them.)

Spot-checks that **passed** and produced no finding: the submit chip really does
keep its per-width position as a rebased `control` leaf post-REQ-96
(`fold.ts:2266-2280`), so STORY-84's claim that "its submit button's per-width
position therefore survive[s] the fold" is true and *not* stale against REQ-88's
knowingly-traded-away note; `hasAnchoredNode` gating `doc.column` so an unfitted
page carries no dead constant (`fold.ts:2307-2310`); and GA round-10's
`unreferenced-image` false positive is adequately covered by STORY-86's existing
"the media proxy: a coverage finding alone … does not fail a run".

## Cumulative Intent Considered

Statuses were read live this cycle (`.xgd/tmp/st12.py`), not inherited.

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-79 / REQ-82 / REQ-83 | `bundle-31e474b9` (BUNDLE-7) | free_and_reconciled | 2026-07-22 | Framework pivot; L1 substrate + safe renderer; the capture→L1 fold. Originating `intent_uid` of both stories | YES |
| REQ-86 | — | free_and_reconciled | 2026-07-22 | The 3-probe end-to-end reproduction gate | YES |
| BUG-5 / BUG-6 / BUG-7 / BUG-9 | | free_and_reconciled | 2026-07-23 | Occurrence-index pairing; typed residual signal; row tiling in the evaluator; region-aware recursive promotion | YES |
| BUG-11 / BUG-13 / BUG-17 / BUG-18 / BUG-19 / BUG-20 / BUG-21 / BUG-22 | | free_and_reconciled | 2026-07-23/24 | Surface fills; section-background boxes; padding; responsive type track; bar band; the two self-painting-run families; captured surface shape | YES |
| BUG-14 | `bug-29b55835` | free_and_reconciled | 2026-07-23 | Section-band → card → text reconstruction, and its consequence for the gate's non-text pairing queue | YES (landed) |
| BUG-23 | `bug-3bf390f7` | free_and_reconciled | 2026-07-24 | Asset localization: hard failure on an unmirrored handle **and** the unreferenced-mirror fold gap | YES (landed) |
| BUG-24 | | free_and_reconciled | 2026-07-24 | Fold-side scrim | YES (landed) |
| **REQ-88** | `request-7ff1bacd` | free_and_reconciled | 2026-07-21 | The operator-facing pipeline: `repro`, `l1-gate`, padding/type tracks, no-wrap threshold, **centred column**, height probe, `mounted` channel, ladder-only oracle — plus its Round-5…GA-round-10 passes carried in BUNDLE-10 | YES — **gap ×2 + warning ×3 (findings 1–5)** |
| **BUNDLE-10** | `bundle-4ff83a8b` | free_and_reconciled | 2026-07-29 | Reconciliation vehicle carrying BUG-12..BUG-24 **and REQ-88's Round-5..GA-round-10 passes** — the body that records the column/anchor and surface-rect work | YES — **the source of all five findings** |
| REQ-90 / REQ-91 / REQ-92 | | free_and_reconciled | 2026-07-23 | Font resource table; text pixel-movers; full-language rebuild + non-text pairing key | YES |
| REQ-93 | `request-f26cbe32` | free_and_reconciled | 2026-07-25 | 5 scope items; item 3 (derive module config from the capture) | YES (landed) |
| REQ-94 | `request-16253634` | free_and_reconciled | 2026-07-25 | Cross-gate reconciliation; now expressed in STORY-86 **and** in the capability body (landed last cycle) | YES |
| REQ-96 | `request-3a064234` | free_and_reconciled | 2026-07-26 | `control` node kind (CAP-70); offline re-fold; recovery of the submit button's per-width position | YES |
| REQ-97 / REQ-98 | | free_and_reconciled | 2026-07-26 | `sizing` on text leaves + `constrainWidth` mirror; uniform surface/paint axis group | YES (axes owned by STORY-83) |
| REQ-103 / REQ-114 | | free_and_reconciled | 2026-07/08 | Linear-gradient branch; palette model | YES |
| REQ-104 | `request-d67ea520` | free_and_reconciled | 2026-07-27 | Layout track + wrapping row | YES (deferred to CAP-70, correctly) |
| BUNDLE-11 | `bundle-ee56a66e` | free_and_reconciled | 2026-08-05 | Carries BUG-27 + REQ-94 + REQ-96 + REQ-97 + REQ-98 + 10 more; `updated_by` on STORY-86 | YES |
| REQ-136 | `request-8a132869` | free_and_reconciled | 2026-08-12 | Image framing + colour adjustment | YES (expressed) |
| REQ-118 | | free_and_reconciled | 2026-07-31 | Asset picker; cites `l1/assets.ts` only to reuse handle normalization | NO (citation only) |
| BUG-15 / BUG-16 / BUG-25 | | free_and_reconciled | 2026-07 | Capture-side / values-diff | NO (CAP-63) |
| REQ-134 | `request-ba3e3fba` | abandoned | 2026-08 | Image-generation component | NO |

**Ledger note.** The prior cycle's note was right and is now discharged: reading
*every* `## ` section of BUNDLE-10 rather than only the `## BUG-N:` ones is what
surfaced Round-9 last cycle. This cycle read the remaining passes and found the
**column and surface-rect work of Rounds 5–8 is entirely unexpressed at the level
of its own rules** — STORY-84 carries one sentence about the column anchor and
nothing about how either the anchor or a card's rect is actually derived. That is
the single largest remaining unmined region of this capability's intent, and it is
now mined; I do not expect a third pass over BUNDLE-10 to yield more.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-84 (`story-8acc338d`) | REQ-83, REQ-88, REQ-90/91/92/93, REQ-96, REQ-103, REQ-114, REQ-136, BUG-6, BUG-11, BUG-13, BUG-14, BUG-17..BUG-24 | attempt 11's three repairs (complete derived-config enumeration, label/submit derivation paragraph, no-painted-witness bullet) **verified landed**; **gap ×2 + warning ×3** — all five in REQ-88's Round-5/6/8 column-and-surface-rect work (findings 1–5). The behaviour-seam half of the story is now complete; the *geometry-derivation* half is the gap |
| STORY-86 (`story-24098299`) | REQ-86, REQ-88, REQ-92, REQ-94, REQ-97, REQ-104 (deferred), BUG-5, BUG-7, BUG-9, BUG-14 | attempt 11 correctly left the body untouched and widened only the title. Re-checked this cycle against the options sweep and the CAP-73 body — **no finding**. Second consecutive clean cycle for this story |
| Capability body (CAP-71) | REQ-86, REQ-94 | attempt 11's fourth Scope bullet **verified landed** and is a faithful summarization of STORY-86 — it introduces no claim STORY-86 does not make, and the Out-of-scope clause mirrors STORY-86's. Reconciled against the archived CAP-73 body this cycle: nothing further unmerged. **Aligned** |

Exclusivity between the two stories remains **clean**: all five of this cycle's
findings are fold-side geometry derivation, which STORY-86's Out-of-scope already
defers by name ("the fold itself"). Nothing crosses the line, and nothing this
cycle belongs to CAP-70 — the column/anchor *axis vocabulary* is CAP-70's (STORY-83
polices a dangling anchor in the envelope), but every rule below is about what the
**fold derives**, which is STORY-84's alone.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-84 (`story-8acc338d`) | story-body-edit | **A column anchor has two terms that are fitted and suppressed independently, and STORY-84 describes it as one undivided thing.** REQ-88 (`request-7ff1bacd`, free_and_reconciled), Round-8 pass in BUNDLE-10 (`bundle-4ff83a8b`, free_and_reconciled 2026-07-29) — a section whose *title* is "**Round-8 pass — anchoring is per axis, and it must be**". Its stated principle: "**Alignment is a shared property; width is a private one.** A node whose left edge follows the column must say so even when its width is its own business. The anchor is now `{x?, width?}`, each fitted and suppressed independently." The defect it fixed was operator-reported and measured: requiring both axes to fit anchored exactly one hero line (whose width happened to equal the column extent) while its three neighbours kept drifting keyframes — "24 vs **55.5** at 1150, a 31px split in text the reference keeps flush", and "worse than not anchoring at all, because mixed models break an alignment the reference guarantees". Outcome measured at "`x` 63/71 (was 33 for both axes coupled), `width` 37/71". Live at `fold.ts:515-539` (`x` fitted with no cap, `width` fitted with one, then `if (x) anchor.x = x; if (width) anchor.width = width`), with the capped-width term at `:484-513` — a nested `max-w-*` is `min(maxPx, px + fraction * extent)`, admitted only on an **over-determined** fit (`:508`, since "a two-unknown fit through two points is interpolation, not evidence") and only at a plausible share of the column (`isSaneColumnFraction`, `|fraction| <= 2`, `:442`). STORY-84's whole treatment is one sentence: "A node inside the column expresses its geometry against that column (a column anchor) rather than against the page edge" — which reads as all-or-nothing and is exactly the model Round-8 rejected. **Unowned matrix-wide**: `centred column` / `content column` / `column anchor` / `containerPx` / `insetPx` return hits in STORY-84 **only**, across all 31 story bodies. Tested but unattributed: `tests/req88-viewport-relative-and-nowrap.test.ts:409` (`test_UAT_FC_REQ-88_x_anchors_even_when_width_is_not_a_column_function`), whose own comment states "The axes are fitted independently, and that is the whole point" — asserting at `:437` that a shrink-to-fit run still takes its left from the column, at `:440-444` that a capped width anchors as `{px:0, fraction:1, maxPx:768}`, and at `:446` that a glyph-extent width stays keyframed. Passing (21/21 in that file) | Replace the single anchor sentence with the per-axis rule: a node's **left edge** and its **extent** are fitted against the column separately, and either may anchor while the other keeps its keyframes — because alignment is a property the page shares across siblings while a node's width is its own. State the consequence Round-8 measured: coupling them leaves neighbouring runs on two different models and splits text the reference keeps flush. Add that an extent may anchor with its own narrower maximum (a nested cap), admitted only when more samples than unknowns support it and only at a plausible share of the column, so a width that merely correlates with the column over the sampled range is refused rather than extrapolated off-sample |
| 2 | violation | coverage | STORY-84 (`story-8acc338d`) | story-body-edit | **Which box an asymmetric accent rule is painted on is a fold decision with its own rule, and STORY-84 states none of it.** REQ-88 Round-6 pass in BUNDLE-10, numbered item 1, "**Accent rules were painted on the wrong box**": `border-l-4 … pl-6` paints the bar on a *wrapper* while the run inside is inset by that wrapper's padding, and the surface walk runs past a fill-less accent wrapper to the band, which the fold discards as viewport-wide. "The fallback drew the rule on the run: indented 28px from the reference, and (a border paints inside its own border box) overlapping the first glyph." The fold-side rule is that the **bearing element's own rect** is preferred, "consulted only when no card-shaped fill was resolved, so a card painting both keeps one rect for both" — and, separately, that rounding belongs to the resolved *surface* shape, so a row that fell back to the accent bearer must not inherit the band's radius. Round-7 records that this had "never actually taken effect" until the field was carried on the projection the fold reads, which is how load-bearing it is. Live at `fold.ts:1906-1921` (`shapeBoxAt` → `el.borderLeft ? el.accentBox : undefined`, then `surfShapeRadius` gated on a resolved surface shape). STORY-84's only mention of an accent is the BUG-21 self-painting guard ("an ancestor-attributed treatment (a gradient, an accent `borderLeft`) stays on the card box"), which is a different rule about a different decision. **Unowned matrix-wide**: STORY-90's 26 `accent` hits are the *pointer-accent* interaction axis (a wholly unrelated feature) and STORY-75's is the capture-side box-border axis; the capture-side *recording* of the bearer rect is CAP-63's, but STORY-84's Out-of-scope defers only "the capture-side rules that decide a band's extent, index the backdrops, detect a band's scrim … and shoot the height probe" — not this consumption rule. Tested but unattributed: `tests/req88-viewport-relative-and-nowrap.test.ts:99` (`..._accent_rule_takes_its_bearing_wrappers_rect_not_the_runs`), `:148` (`..._accent_on_the_runs_own_element_keeps_the_runs_rect`), `:621` (`..._the_accent_bearer_rect_survives_the_manifest_projection`). All passing | Add to the reconstruction material: an asymmetric accent rule is painted by the element that *bears* it, which is commonly a fill-less wrapper the run sits inside, so the fold takes that bearer's measured rect rather than the run's — otherwise the rule lands indented by the wrapper's padding and prints over the first glyph. State the precedence (the bearer's rect is consulted only where no card-shaped fill was resolved, so a card that paints both keeps one rect for both) and its corollary (corner rounding follows the resolved surface, never the accent bearer, so a fallback row does not inherit a radius that was never its own) |
| 3 | warning | coverage | STORY-84 (`story-8acc338d`) | story-body-edit | **An anchored left edge may be a keyframed inset track rather than a closed form, and a full-bleed band is refused an anchor outright — neither is stated.** REQ-88 Round-8, two of its "three further findings, each of which had to be fixed for the page to come out right": "**A layout MODE change is not a fit.** A 3-up grid stacks below `md` … Those nodes now anchor via `x.pxTrack` — the origin stays closed-form and only the small inside-the-column offset is keyframed … The track inherits the node's own geometry `segments`, so the inset snaps where the geometry snaps; without that the third grid column slid 42px off the right edge at ~700px." And "**A full-bleed band is never anchored.** Its `x` is 0 absolutely; writing that as `origin + (-origin)` and interpolating the residual walks it to `x = -31` at 1150." Live at `fold.ts:519-533` (the fallback is gated on `frames.every(f => f.box.width < f.at - 1)` and inherits `segments`). STORY-84's sentence contrasts the anchor against "holding a captured absolute offset", which the pxTrack fallback partially *is* (a captured relative offset, keyframed) — so the sentence stays true but its framing is incomplete. Tested but unattributed: `tests/req88-viewport-relative-and-nowrap.test.ts:449` (`..._a_full_bleed_band_is_never_anchored_to_the_column`). Classified **warning** rather than violation: unlike finding 1 it makes no stated rule false — a full-bleed band is not "a node inside the column" — and re-centring genuinely still happens under the track form | Add a clause: where a node's offset inside the column has no closed form — typically because the page changes layout mode at a breakpoint — the column origin still carries it and only the small residual offset is keyframed, snapping wherever the node's own geometry snaps. And state the refusal: a full-bleed element spanning the viewport is never anchored at all, because expressing an absolute zero as origin-plus-negative-origin walks the band off the left edge between samples |
| 4 | warning | consistency | STORY-84 (`story-8acc338d`) | story-body-edit | **The story says the column is two constants reproducing every sampled origin *and extent*; the extent needs a third.** STORY-84: "fitted to the **two constants** that reproduce every sampled origin and extent — a container maximum and a horizontal inset". The recovered column carries a third, optional term — the **content cap** — emitted whenever the column's own inner width exceeds the extent content actually occupies (`fold.ts:393-398`: `maxWidthPx = min(extent) where min(containerPx, w) - 2*inset > extent`), and the extent is resolved as `min(maxWidthPx, inner)` (`:446-449`). On the real reference it is present and load-bearing: `tests/req88-viewport-relative-and-nowrap.test.ts:395` pins `doc.column` as `{containerPx: 1152, insetPx: 24, maxWidthPx: 896}` — i.e. `max-w-6xl mx-auto px-6` **plus** a nested `max-w-4xl`. `fitColumn`'s own doc comment is careful to scope the pair to the origin only ("the two constants that reproduce every sampled **origin**"); the story generalised it to the extent as well. Classified **warning**: the two-constant fit is right for the origin and the sentence is directionally correct, so no downstream reasoning is broken — but as written it is not reproducible from the code | Say the column is recovered as a container maximum and a horizontal inset that reproduce every sampled origin, plus — where the page's content stops short of that container — a content cap that reproduces the extent. Keep the existing rejection rule (the fit is refused unless it reproduces *all* samples), which is accurate |
| 5 | warning | coverage | STORY-84 (`story-8acc338d`) | story-body-edit | **The card path adopts the captured surface rect only below viewport width, and STORY-84 states the adoption without the guard.** STORY-84 already expresses the rule — "the use of the *captured* surface-bearing box for a reconstructed card, so a card's edges are a measured fact rather than arithmetic over where its text happens to sit" (Technical Context, REQ-88 bullet) — which is Round-5's "Card geometry is measured, not inferred". What it omits is that pass's stated guard: "a surface as wide as the viewport is the **band**, not a card. Bands are reconstructed separately, so adopting that rect stretched a quote's 868x29 accent rule to **1280x595**." Live at `fold.ts:1906-1909` (`shape.width < at`). Also unstated is the same pass's grouping consequence — the captured rect "doubles as an exact grouping identity (same rect joins, different rects never do), so sibling tiles can neither merge nor drift" — live at `fold.ts:1610-1625`, where a resolved surface key decides membership outright and proximity heuristics arbitrate only rows whose surface the capture could not resolve. **Unowned matrix-wide**: `same rect` returns one hit, STORY-75, and it is the capture-side duplicate-run pairing rule, not this. Classified **warning**: the headline rule is expressed and neither omission makes it false | Extend the existing captured-surface-rect bullet with its two qualifiers: a surface spanning the viewport is a band and is refused as a card's rect (adopting it stretches a narrow accent rule across the whole page), and the captured rect doubles as an exact grouping identity — runs painted by the same element are one card and runs painted by different elements never merge, with proximity arbitrating only rows whose surface the capture could not resolve |

## Notes for the Editor

**All five findings land in STORY-84, and four of them in two adjacent places.**
Findings 1, 3 and 4 are all extensions of the single column paragraph beginning
"**The page's centred content column is recovered as a document constant.**" —
they can be applied as one rewrite of that paragraph plus the matching In-scope
clause ("the recovered centred content column and the column-anchored node
geometry that refers to it"). Findings 2 and 5 both concern *which rect the fold
adopts for a painted surface* and both live in the same code function
(`fold.ts:1906-1921`); finding 5 extends the existing REQ-88 Technical Context
bullet, and finding 2 wants either a new bullet beside it or a clause in the
reconstructed-run-surfaces material in the Description.

**Considered and deliberately not raised as findings** (recorded so the next cycle
does not re-mine them):

- *The text leaf's ceil rule* (`fold.ts:1789-1797` — a text leaf rounds its width
  **up** because a shrink-to-fit run's captured box *is* its glyph extent, while a
  box/image leaf stays on nearest so a surface cannot creep outward a pixel per
  pass). Real, live and unowned, but REQ-88's own Round-6 pass supersedes its role
  — "`Math.ceil` … bought a fraction of a pixel and left the outcome to luck.
  `axes.nowrapFromPx` states the fact instead" — and STORY-84 does express the
  threshold axis that replaced it. A rounding direction retained as belt-and-braces
  is below the bar for a story-body claim.
- *`fitColumn`'s modal left edge* (`fold.ts:369-373` — the origin is the edge the
  most content shares, not the minimum, because a real page has more than one
  gutter and taking the minimum "made the fit fail outright"). Genuinely unowned,
  but it is a fitting technique rather than a behaviour the story asserts, and
  STORY-84's "where content actually sits at each captured width" does not
  contradict it. Flagged here rather than raised; a future cycle may reasonably
  disagree.

**One code-hygiene item, not a matrix finding.** `fold.ts:451-458` — `fitAnchor`'s
doc comment still asserts the pre-Round-8 coupled behaviour: "Returned only when
the fit reproduces every sample to within a pixel *on both axes*. **Both**, because
the renderer takes `x` and `width` from the anchor together: a half-fitted node
would keep keyframes for one axis and take the column for the other". The code
immediately below it (`:534-539`) does the opposite, and the UAT at
`tests/req88-viewport-relative-and-nowrap.test.ts:409` pins the opposite. The
behaviour is correct — only the comment is stale — so this is not a `code-issue`
and no verdict here depends on it. But it is very likely *why* finding 1 survived
eleven cycles: a reader auditing the fold from its own comments would conclude the
anchor is all-or-nothing, which is precisely what STORY-84 says. Worth fixing under
a separate free-coded change, not by this workflow.

**Where this capability now stands.** STORY-86 and the capability body have both
come through clean this cycle, and STORY-84's behaviour-seam half is complete after
attempt 11. The remaining drift is concentrated in one region — REQ-88's Round-5
through Round-8 geometry-derivation work (the centred column, the anchor, and which
rect a painted surface contributes) — which this cycle mined in full. With
BUNDLE-10's round passes now all read, I do not expect a further pass over that
intent to yield new material.
