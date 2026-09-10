---
uid: report-3f335fc6
id: REPORT-3740
type: report
title: 'Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
  (level=story)'
created_by: xgd
created_at: '2026-09-10T14:04:06.147601+00:00'
updated_at: '2026-09-10T14:04:06.147601+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-2049c9ec
  level: story
  violations: 5
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
# Level: story

**Result**: FAIL
**Violations**: 5
**Warnings**: 1
**Needs review**: 0

Capability: CAP-71 (`capability-2049c9ec`). Stories in scope: STORY-84
(`story-8acc338d`, the fold) and STORY-86 (`story-24098299`, the 3-probe /
cross-gate acceptance boundary). Both `story_kind: upgrade`, both
`intent_uid: bundle-31e474b9` (BUNDLE-7).

**This is attempt 7 (`previous_attempt_count: 6`).** The findings below are the
same five violations and one warning reported at this level on 2026-08-16
(REPORT-2088, `report-13bc38e7`). They were re-derived from scratch this cycle,
not copied forward, and every one was **re-confirmed as unrepaired**:

- **No story body changed.** Both stories' `updated_at` is 2026-08-16T08:03,
  with `last_field_updated: uat_coverage` — a field write, not a body edit. A
  term sweep of both bodies finds **zero** occurrences of `padding`,
  `responsive text` / `font-size` / `line-height` / `letter-spacing`,
  `height probe` / `viewport height` / `yFactor` / `heightFactor`,
  `self-paint` / `pill` / `badge`, `surface rect`, or `1c repro`. STORY-86 still
  reads `(CAP-72)`.
- **No new intent changed the picture.** All 48 intents created since
  2026-08-10 were reviewed; the only ones touching this pipeline
  (REQ-155 capture-in-workerd, REQ-156 sharp-off-the-fidelity-path, REQ-157 the
  fidelity surface) are `draft` and so do not count toward cumulative intent.
  REQ-154 is `bundled` and concerns the Browser Rendering driver behind the
  existing seam, not the fold or the probes.
- **Every code citation still resolves**, with the same symbols at
  near-identical lines, and the implementing comments name the intents
  explicitly (`fold.ts:602` "BUG-18", `fold.ts:986` "BUG-20 / BUG-21",
  `fold.ts:652` "REQ-88", `repro.ts:2` "REQ-88", `repro.ts:48` "BUG-23").
  `cardPadding` / `cardOutset` remain deleted (0 hits), confirming finding 3's
  premise that the inferred-geometry path is gone.

The repair has simply not been attempted on the story bodies. Re-running the
check cannot change this verdict; a `story-body-edit` pass on STORY-84 is what
the loop is waiting for.

## Cumulative Intent Considered

Neither the capability nor its ACs carry an `intent_uid`; the ledger was built
from the two stories' `intent_uid` / `updated_by` chains, the intent references
inside the story bodies, and the REQ/BUG citations carried in the implementing
source (`tools/generate/src/l1/fold.ts`, `probes.ts`, `cli/repro.ts`). Every
status below was re-read from the ticket store this cycle.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-66 | free_and_reconciled | 2026-07-18 | `adopt-values` pre-L1 reproduction command | YES (retired by REQ-83) |
| REQ-79 | free_and_reconciled | 2026-07-19 | Umbrella framework pivot; absolute-base (D1) reproduction form | YES |
| REQ-83 | free_and_reconciled | 2026-07-20 | The fold: keyframes + `interpolate\|snap` + visibility, oracle retention, advisory hint sidecar; dissolve `adopt-values` | YES |
| REQ-86 | free_and_reconciled | 2026-07-20 | 3-probe gate (sample-fidelity / off-sample / content-robustness) + demand-driven `promoteToFlow` | YES |
| REQ-88 | free_and_reconciled | 2026-07-21 | `1c repro` + `1c l1-gate` operator verbs; geometric surface attribution; captured surface rect as card identity; viewport-height response; responsive padding tracks | YES |
| REQ-90 | free_and_reconciled | 2026-07-23 | Document-level resource table (font/image handle → substance) | YES |
| REQ-92 | free_and_reconciled | 2026-07-23 | Rebuild `foldToL1` to the full L1 language + signalled residuals | YES |
| BUG-5 | free_and_reconciled | 2026-07-23 | Occurrence-index fidelity pairing + idempotence identity | YES |
| BUG-6 | free_and_reconciled | 2026-07-23 | Unexpressed element → typed residual, never a silent drop | YES |
| BUG-7 | free_and_reconciled | 2026-07-23 | Evaluator must tile a row along the main axis | YES |
| BUG-8 | free_and_reconciled | 2026-07-23 | Reflow keyframe at a captured breakpoint (resolved as half-open intervals) | YES |
| BUG-9 | free_and_reconciled | 2026-07-23 | Recursive, region-aware promotion | YES |
| BUG-11 | free_and_reconciled | 2026-07-23 | Fold `surfaceFill` / `surfaceGradient` | YES |
| BUG-12 | free_and_reconciled | 2026-07-23 | Captured font faces reach the fold's resource table | YES |
| BUG-13 | free_and_reconciled | 2026-07-23 | Background-image elements become foldable nodes | YES |
| BUG-14 | free_and_reconciled | 2026-07-23 | Section-band → card → text surface reconstruction | YES |
| BUG-17 | free_and_reconciled | 2026-07-23 | Fold a captured element's per-side padding | YES |
| BUG-18 | free_and_reconciled | 2026-07-23 | Per-width responsive tracks for varying numeric text axes; static axes stay scalar | YES |
| BUG-19 | free_and_reconciled | 2026-07-23 | Dominant run fill becomes the band; stop assigning it to every surface | YES |
| BUG-20 | free_and_reconciled | 2026-07-23 | Remaining box treatments; the self-painting pill run | YES |
| BUG-21 | free_and_reconciled | 2026-07-24 | Padded control is self-painting — no outset backing box, no double padding | YES |
| BUG-22 | free_and_reconciled | 2026-07-24 | `SurfaceShape` (painting ancestor + its own rect + radius) the fold consumes | YES |
| BUG-23 | free_and_reconciled | 2026-07-24 | `localizeAssets` in `cmdRepro`; unmirrored handle fails the import; unreferenced mirrored assets reported | YES |
| BUG-27 | free_and_reconciled | 2026-07-25 | Document-wide backdrop index (capture-side) the fold consumes | YES |
| REQ-93 | free_and_reconciled | 2026-07-25 | L1 pages host behavior modules in slots — the fold's behaviour seams | YES |
| REQ-94 | free_and_reconciled | 2026-07-25 | Cross-gate reconciliation, perceptual floor, reference coverage, named causes | YES |
| REQ-96 | free_and_reconciled | 2026-07-26 | `control` node kind — a captured control binds instead of being dropped | YES |
| REQ-97 / REQ-104 | free_and_reconciled | 2026-07-26/27 | Evaluator sizing + per-width layout mode / wrapping row | YES — expressed in CAP-70 STORY-81, not here |
| REQ-136 | free_and_reconciled | 2026-08-12 | Framing pair + colour-adjustment stack folded onto pictures and surfaces | YES |
| BUNDLE-7 (`bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | Carrier for REQ-63/79/82/83/84/86 | YES |
| BUNDLE-11 (`bundle-ee56a66e`) | free_and_reconciled | 2026-08-06 | Carrier for BUG-27/REQ-94/96/97/98 | YES |
| REQ-154 | bundled | 2026-08-20 | Browser Rendering driver behind the existing headless seam | imminent — does not touch fold/probes |
| REQ-155 / REQ-156 / REQ-157 | draft | 2026-08-20 | Capture in workerd; sharp off the fidelity path; the fidelity surface | NO (draft) |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-84 (fold) | REQ-79, REQ-83, REQ-90, REQ-92, REQ-93, REQ-96, REQ-136, BUG-6, BUG-11, BUG-12, BUG-13, BUG-14, BUG-19, BUG-20 (partial), REQ-66 (retired) | aligned on the language, residuals, seams, backdrops, re-fold and the REQ-136 framing/adjustment axes; **four gaps unrepaired** — BUG-18 responsive text tracks, BUG-17/REQ-88 padding, BUG-20/BUG-21 self-painting runs + BUG-22/REQ-88 captured surface rect, REQ-88 viewport-height response (findings 1–4) |
| STORY-86 (gate) | REQ-86, REQ-88 (`l1-gate`), REQ-94, BUG-5, BUG-7, BUG-8, BUG-9 | aligned on every behaviour; one stale cross-capability pointer (finding 6) |
| CAP-71 story tree as a whole | REQ-88, BUG-23 | gap: the `1c repro` materialization verb is expressed by no story in this capability and by no story elsewhere (finding 5) |
| STORY-84 ↔ STORY-86 | — | no exclusivity problem: each body explicitly cedes the other's half (the fold decides *what* it cannot express; the gate owes only that the channel stays separate and legible) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | STORY-84 (+ AC-691) | story-body-edit | BUG-18 (free_and_reconciled, 2026-07-23) made the fold emit **per-width responsive scalar tracks** for the numeric type axes that vary across the ladder (`fontSizePx`, `lineHeightPx`, `letterSpacingPx`), with a static axis staying a scalar. Live at `tools/generate/src/l1/fold.ts:607` (`RESPONSIVE_TEXT_AXES`) and `:623` (`responsiveTextTracks`, whose doc comment names BUG-18 and the "text rendered oversized at mobile" symptom), applied at `fold.ts:1853`; the track is gated at `fold.ts:638` so an invariant axis is not bloated into a track. The story body describes only geometry keyframes ("each node carries its authored axes, a geometry keyframe per sampled width") and never mentions typography varying by width; AC-691 states BUG-18's **root cause** as the rule: "A node's authored typography axes are taken from its widest present sample (the desktop rendering)." | Add the responsive scalar track to the story's account of what the fold emits — a varying numeric type axis becomes a per-width keyframe track, a static one stays a scalar. Then `ac-edit` AC-691 so the widest-sample rule is scoped to static axes, and `ac-add` an AC for the track itself |
| 2 | violation | coverage | STORY-84 | story-body-edit | BUG-17 (free_and_reconciled, 2026-07-23) added the fold of a captured element's **per-side padding** onto text/image/box leaves (`foldPadding`, `fold.ts:552`, applied at `:1856`, `:1984`, `:2026`), and REQ-88 added **per-width padding tracks** for sides that vary (`responsivePaddingTracks`, `fold.ts:657`, whose comment cites REQ-88; applied at `:1860`, `:1988`, `:2030`). The story body contains the word "padding" **zero** times, and no AC lists it: AC-729's image axes and AC-730's surface axes enumerate the painted axes and omit it, AC-732 covers typography plus text treatments only | Add padding to the story's list of what a folded leaf carries, including the border-box-safe rationale (the captured box already includes the pad, so folding it insets content rather than inflating pinned geometry) and the varying-side track. Then `ac-add` |
| 3 | violation | consistency | STORY-84 (+ AC-731) | story-body-edit | Two reconciled changes to run-composited surface reconstruction are not reflected, and the body positively states the superseded rule. (a) BUG-20 / BUG-21 made a **self-painting run** — a pill badge at radius ≥ half its painted height, or a padded control with authored vertical inset — fold its own surface onto the text leaf and contribute **no** backing card box (`isSelfPaintingRun`, `fold.ts:1003`; `isPaddedControlRun`, `fold.ts:1029`; taken at `fold.ts:1836`). The `fold.ts:1009-1028` comment records BUG-21's symptom directly: the card path "outset the box by an inferred padding — giving every button 2x its height and ~50px of extra width, bleeding past both screen edges at 320". (b) BUG-22 / REQ-88 made a card's box the **captured surface rect** (`SurfaceRow.surfaceFrames`, `fold.ts:1323`; membership/resolution at `fold.ts:1614`, `:1658`, `:1941`), and the inferred `cardPadding` / `cardOutset` are **gone from the tree** (0 hits). The story body (lines 63–68) and AC-731 both state the unqualified pre-fix rule: every run whose surface differs from the band folds a backing box carrying "the run's geometry" | Restate the reconstruction as: a run whose own border-box already spans its painted surface paints itself and emits no backing box; otherwise a backing box is emitted, whose edges and grouping come from the captured surface rect where the capture resolved one, falling back to the runs' union only where it did not. Then `ac-edit` AC-731 |
| 4 | violation | coverage | STORY-84 | story-body-edit | REQ-88 (free_and_reconciled) added a **second sampling axis** the fold consumes: viewport-**height** probes, from which the fold derives a per-node `{yFactor, heightFactor}` response onto the node's geometry. Live at `fold.ts:171-199` (the explicit "REQ-88 — the viewport-HEIGHT axis" section; `HeightProbe`, `heightProbesFor`), `fold.ts:250` (`responseFrom`), `fold.ts:266` (`probeResponses`), consumed at `fold.ts:1743-1744` and written at `fold.ts:1578`, `:1687-1688` (a reconstructed card inheriting its representative row's response); carried by `L1Geometry.viewportResponse`. `fold.ts:182-187` records why it is load-bearing: without a height pair "every `100vh` rule reads as a pinned pixel height". The story body describes only a width ladder ("samples a page across a fixed width ladder", "a geometry keyframe per sampled width"); no AC in the capability mentions viewport height, a height probe, `yFactor` or `heightFactor` | Add the viewport-height response to the story's account of the fold's inputs and outputs — what a height probe is, that the response is a measured finite difference rather than an inference, that a probe is evidence about the height axis and never a keyframe of its own (`fold.ts:159-160`), and that a reconstructed card inherits it from its representative row. Then `ac-add` |
| 5 | violation | coverage | CAP-71 story tree (no owning story) | story-body-edit | REQ-88 (free_and_reconciled, 2026-07-21) delivered **`1c repro <slug> --ref <bundle>`** — the verb that writes a site whose home page *is* the bundle's folded L1 document, mirrors the bundle's assets into the draft, and is idempotent (re-running wipes and rebuilds) — and BUG-23 put asset localization, its hard failure on an unmirrored handle, and its unreferenced-mirrored-asset report in `cmdRepro` explicitly. Live at `tools/generate/src/cli/repro.ts:95` (`cmdRepro`), `:132` (`localizeAssets`), `:48-58` (the BUG-23 result fields), wired at `cli/index.ts:812`; `repro.ts:2-18` frames the module as REQ-88's "operator-facing L1 reproduction pipeline" turning a bundle into "a **servable, gate-able 1c site**". A re-sweep of all **45** stories this cycle found no owner: STORY-84 (which owns the sibling `refold` verb, AC-814) does not mention it; STORY-79 names `repro` only in a list of offline verbs that are never dependency-gated (`1c CLI` flags story, CAP-63) — the gating rule, not the verb's semantics; STORY-85's "repro-only chrome" is an unrelated adjective; CAP-70's AC-805 covers only the background-image handle binding | Extend STORY-84's scope to the materialization verb (it already owns `refold`), or author a story under CAP-71 for it. See Notes for the Editor on ownership |
| 6 | warning | consistency | STORY-86 | story-body-edit | Technical Context still reads "**Not to be conflated with the `1c values-diff` duplicate-text pairing** (CAP-72)". CAP-72 (`capability-ce902be4`) is *Behavior Module Contract & Catalog*, `status: deprecated`. The values-diff duplicate-text pairing lives in CAP-63 (*1c Capture & Diff Fidelity*, `capability-aa030c83`), STORY-75 — whose title names "duplicate-text pairing" outright and whose story statement asks "to pair repeated text by rendered position" | Change the pointer to CAP-63 / STORY-75 |

## Notes for the Editor

**Nothing has moved in seven cycles; the bottleneck is one edit pass on one
story.** Four of the five violations are STORY-84's, and all four are repairable
in a single body rewrite plus the follow-on AC actions. Finding 6 is a
one-token fix. Finding 5 is the only one needing a scoping judgement.

**Read REQ-88's body in full, not its opening section.** Four of the six
findings trace to REQ-88 — the intent that took the pipeline from library
functions on synthetic fixtures to a real reproduction of gigabytealchemy.ai.
It is a large, multi-round intent whose body grew by append (rounds 3, 4, 5 and
follow-ons) *after* the story was last touched; everything it added late (the
captured surface rect, the self-painting-run discrimination, viewport-height
response, responsive padding tracks, and `1c repro` itself) is exactly what is
missing.

**Findings 1 and 3 are the sharper kind of drift.** They are not omissions — the
story and its ACs positively *state* the behaviour the intent retired. AC-691
states BUG-18's root cause as the rule; AC-731 and the body state the geometry
source that BUG-21 proved wrong and blamed for 2x-height buttons bleeding past
both screen edges at 320px. A UAT written faithfully to either would pin the
pre-fix behaviour — which makes these the two findings most likely to be
manufacturing the capability's standing `uat_coverage: fail` downstream.

**On finding 5's ownership.** The `1c repro` verb sits between fold and render,
which is inside this capability's own framing ("capture → fold → render →
gate"), and matches the precedent that STORY-84 already owns an operator verb
(`refold`, AC-814). It is placed here rather than escalated because the intent
ledger is unambiguous that the behaviour is active and reconciled; only the
bucket is a judgement call. If a downstream editor concludes it belongs to a
delivery/materialization capability instead, that is a legitimate resolution of
the same finding — what is not legitimate is leaving it expressed nowhere.

**Not raised as findings, recorded for the ledger.**
- REQ-97 / REQ-104 taught the analytic evaluator per-width layout-mode
  resolution and row wrapping, which STORY-86's "two axes the naive model got
  wrong" does not cover. Deliberately not a gap here: CAP-70's STORY-81 puts
  "the shared mode cascade shared by renderer and analytic gate" explicitly in
  scope, so the behaviour is expressed — in the story that owns the cascade. A
  cross-reference from STORY-86 would be an improvement, not a repair.
- STORY-84 and STORY-86 pass exclusivity cleanly, re-checked this cycle.
- REQ-155 / REQ-156 / REQ-157 (all `draft`) will land on this capability when
  they activate — capture moving into workerd, sharp leaving the fidelity path,
  and an assistant-facing fidelity surface. They are correctly absent from both
  story bodies today. Flagged only so a future cycle does not mistake their
  arrival for pre-existing drift.
- `uat_coverage: fail` is set on the capability and on both stories. That is a
  UAT-level signal and is not evidence for or against any finding above; per
  the level cascade, these story-level violations should be repaired before the
  UAT-level cycle is read, since findings 1 and 3 would otherwise drive UATs
  that pin superseded behaviour.
