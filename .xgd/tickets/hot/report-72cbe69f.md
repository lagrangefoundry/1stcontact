---
uid: report-72cbe69f
id: REPORT-3742
type: report
title: 'Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
  (level=story)'
created_by: xgd
created_at: '2026-09-10T14:19:13.780646+00:00'
updated_at: '2026-09-10T14:19:13.780646+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-2049c9ec
  level: story
  violations: 1
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
# Level: story

**Result**: FAIL
**Violations**: 1
**Warnings**: 2
**Needs review**: 0

Capability: CAP-71 (`capability-2049c9ec`). Stories in scope: STORY-84
(`story-8acc338d`, the fold) and STORY-86 (`story-24098299`, the 3-probe /
cross-gate acceptance boundary). Both `story_kind: upgrade`, both
`intent_uid: bundle-31e474b9` (BUNDLE-7).

**This is attempt 8 (`previous_attempt_count: 7`), and the deadlock is broken.**
The seven-cycle stall REPORT-3740 (`report-3f335fc6`) diagnosed — "no story body
changed" — is over. Attempt 7's fix pass (REPORT-3741, `report-19812dd8`) landed
real body edits: STORY-84 `updated_at` 2026-09-10T14:10, STORY-86
2026-09-10T14:08, both *after* REPORT-3740 was written at 14:04.

**All six of REPORT-3740's findings were re-verified against the current bodies
and the live source, and all six are repaired:**

| Prior finding | Verified repair | Code it now matches |
|---|---|---|
| 1 — BUG-18 responsive text tracks (body silent; AC-691 stated the retired widest-sample rule) | STORY-84 §"An axis the page makes responsive folds to a track" names font size / line height / letter spacing, scopes the widest-sample read to axes the page holds constant, and states the "never bloated into a track" rule | `fold.ts:607` `RESPONSIVE_TEXT_AXES`, `:623` `responsiveTextTracks`, applied `:1853` |
| 2 — BUG-17 / REQ-88 per-side padding (word absent, 0 hits) | Padding now appears on all three leaf bullets, in §"Padding folds inward, never outward" with the border-box rationale, in the per-side track rule, in In-scope, and in Technical Context | `fold.ts:552` `foldPadding` (`:1856`, `:1984`, `:2026`); `:657` `responsivePaddingTracks` (`:1860`, `:1988`, `:2030`) |
| 3 — BUG-20/21 self-painting run + BUG-22/REQ-88 captured surface rect (body stated the superseded rule) | Reconstruction restated: a self-painting run emits no backing box (pill saturation ≥ half painted height; padded control's authored vertical inset), every other run's box takes edges/radius/grouping from the captured surface rect, runs' union only as fallback. Technical Context carries the horizontal-padding-alone and gradient/left-accent guards | `fold.ts:1003` `isSelfPaintingRun`, `:1029` `isPaddedControlRun`, taken `:1836`; `:1323` `surfaceFrames`, `:1614`, `:1658`, `:1941`. `cardPadding`/`cardOutset` still 0 hits |
| 4 — REQ-88 viewport-height response (body described a width ladder only) | STORY-84 §"A second sampling axis: viewport height" states the unfittability argument, the measured finite difference, no-probe-no-response, probe-is-evidence-never-a-keyframe, and card inheritance from its representative row | `fold.ts:171-199` (`HeightProbe`, `heightProbesFor`), `:249` `responseFrom`, `:266` `probeResponses`, `:1578`, `:1687-1688`; consumed `render.ts:1601-1602` |
| 5 — REQ-88 / BUG-23 `1c repro` owned by no story | STORY-84 §"Materializing a folded bundle as a servable site" adds the verb to the story's scope with idempotence, pre-write handle rebinding, hard failure on an unmirrored handle, and the unreferenced-mirrored-asset report; Technical Context adds the part-stale seam/binding refusal | `cli/repro.ts:95` `cmdRepro`, `:106-125` seam↔binding refusal, `:132-140` `localizeAssets` + unmirrored throw, `:48-58` BUG-23 result fields |
| 6 — STORY-86 stale `(CAP-72)` pointer | Now reads `(CAP-63, STORY-75)` | STORY-86 Technical Context, values-diff bullet |

No behavior the previous body expressed was lost in the rewrite: REQ-79, REQ-83,
REQ-90, REQ-92, REQ-93, REQ-96, REQ-136, BUG-6, BUG-11, BUG-12, BUG-13, BUG-14,
BUG-19, BUG-27 and the REQ-66 supersession were each re-located in the new text.

**One new violation is raised.** It is not a regression from the rewrite — it is
a pre-existing gap of the same shape as prior findings 1–4 that seven cycles of
re-deriving the same five findings did not surface. It was found by sweeping
*every* REQ/BUG citation carried in `fold.ts` against the story tree rather than
re-checking the known list.

## Cumulative Intent Considered

Neither the capability nor its ACs carry an `intent_uid`; the ledger is built
from the two stories' `intent_uid` / `updated_by` chains and the REQ/BUG
citations carried in the implementing source (`tools/generate/src/l1/fold.ts`,
`probes.ts`, `cli/repro.ts`, `cli/gate.ts`). REPORT-3740's ledger was re-verified
and is carried forward; the two rows in **bold** are new to this cycle.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-66 | free_and_reconciled | 2026-07-18 | `adopt-values` pre-L1 reproduction command | YES (retired by REQ-83) |
| REQ-79 | free_and_reconciled | 2026-07-19 | Umbrella framework pivot; absolute-base (D1) reproduction form | YES |
| REQ-83 | free_and_reconciled | 2026-07-20 | The fold: keyframes + `interpolate\|snap` + visibility, oracle retention, advisory hint sidecar; dissolve `adopt-values` | YES |
| REQ-86 | free_and_reconciled | 2026-07-20 | 3-probe gate (sample-fidelity / off-sample / content-robustness) + demand-driven `promoteToFlow` | YES |
| REQ-88 | free_and_reconciled | 2026-07-21 | `1c repro` + `1c l1-gate`; geometric surface attribution; captured surface rect as card identity; viewport-height response; responsive padding tracks; **§2 `axes.nowrapFromPx` — the single-line suffix threshold the fold derives** | YES |
| REQ-90 | free_and_reconciled | 2026-07-23 | Document-level resource table (font/image handle → substance) | YES |
| REQ-91 | free_and_reconciled | 2026-07 | Text pixel-movers folded from the capture's structured axes (`fold.ts:582`) | YES |
| REQ-92 | free_and_reconciled | 2026-07-23 | Rebuild `foldToL1` to the full L1 language + signalled residuals | YES |
| BUG-5 | free_and_reconciled | 2026-07-23 | Occurrence-index fidelity pairing + idempotence identity | YES |
| BUG-6 | free_and_reconciled | 2026-07-23 | Unexpressed element → typed residual, never a silent drop | YES |
| BUG-7 | free_and_reconciled | 2026-07-23 | Evaluator must tile a row along the main axis | YES |
| BUG-8 | free_and_reconciled | 2026-07-23 | Reflow keyframe at a captured breakpoint (half-open intervals) | YES |
| BUG-9 | free_and_reconciled | 2026-07-23 | Recursive, region-aware promotion | YES |
| BUG-11 | free_and_reconciled | 2026-07-23 | Fold `surfaceFill` / `surfaceGradient` | YES |
| BUG-12 | free_and_reconciled | 2026-07-23 | Captured font faces reach the fold's resource table | YES |
| BUG-13 | free_and_reconciled | 2026-07-23 | Background-image elements become foldable nodes | YES |
| BUG-14 | free_and_reconciled | 2026-07-23 | Section-band → card → text surface reconstruction | YES |
| BUG-17 | free_and_reconciled | 2026-07-23 | Fold a captured element's per-side padding | YES |
| BUG-18 | free_and_reconciled | 2026-07-23 | Per-width responsive tracks for varying numeric text axes | YES |
| BUG-19 | free_and_reconciled | 2026-07-23 | Dominant run fill becomes the band | YES |
| BUG-20 | free_and_reconciled | 2026-07-23 | Remaining box treatments; the self-painting pill run | YES |
| BUG-21 | free_and_reconciled | 2026-07-24 | Padded control is self-painting — no outset backing box | YES |
| BUG-22 | free_and_reconciled | 2026-07-24 | `SurfaceShape` (painting ancestor + its own rect + radius) | YES |
| BUG-23 | free_and_reconciled | 2026-07-24 | `localizeAssets` in `cmdRepro`; unmirrored handle fails the import | YES |
| **BUG-24** (`bug-c50fdfcc`) | **free_and_reconciled** | **2026-07-24 (closed 2026-08-05)** | **Scoped under REQ-88. TWO gaps: (1) capture's `overlayOf` regex missed modern-syntax scrims — CAP-63/STORY-75; (2) "The fold never carried a captured scrim" — `foldSectionBackgrounds` read only `backgroundImageUrl`. Fix: "the section-background box carries `axes.overlay`; a section folds when it paints an image **OR** a scrim". "The renderer needed no change."** | **YES — see finding 1** |
| BUG-27 | free_and_reconciled | 2026-07-25 | Document-wide backdrop index (capture-side) the fold consumes | YES |
| REQ-93 | free_and_reconciled | 2026-07-25 | L1 pages host behavior modules in slots — the fold's behaviour seams | YES |
| REQ-94 | free_and_reconciled | 2026-07-25 | Cross-gate reconciliation, perceptual floor, reference coverage, named causes | YES |
| REQ-96 | free_and_reconciled | 2026-07-26 | `control` node kind — a captured control binds instead of being dropped | YES |
| REQ-97 / REQ-104 | free_and_reconciled | 2026-07-26/27 | Evaluator sizing + per-width layout mode / wrapping row | YES — expressed in CAP-70 STORY-81, not here |
| REQ-103 | free_and_reconciled | 2026-07 | Linear-gradient branch built by name (`fold.ts:1128`) — a typing note, no behavioural ask of the fold | YES (silent) |
| REQ-114 | free_and_reconciled | 2026-08-07 | L1 colour axis is `hex \| PaletteRef`; the fold emits literals only, palette assignment is a separate pass (`fold.ts:2115`) | YES — the ask is CAP-70's palette stories; the fold note is a consequence |
| **REQ-117** | **free_and_reconciled** | **2026-07-31 / 2026-08-07** | **Side-effect on this pipeline: the nowrap captured width becomes a renderer floor. Renderer half owned by CAP-70 STORY-83 (AC-1009, AC-1010, `uat_coverage: pass`)** | **YES — see warning 2** |
| REQ-136 | free_and_reconciled | 2026-08-12 | Framing pair + colour-adjustment stack folded onto pictures and surfaces | YES |
| BUNDLE-7 (`bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | Carrier for REQ-63/79/82/83/84/86 | YES |
| BUNDLE-11 (`bundle-ee56a66e`) | free_and_reconciled | 2026-08-06 | Carrier for BUG-27/REQ-94/96/97/98 | YES |
| REQ-154 | bundled | 2026-08-20 | Browser Rendering driver behind the existing headless seam | imminent — does not touch fold/probes |
| REQ-155 / REQ-156 / REQ-157 | draft | 2026-08-20 | Capture in workerd; sharp off the fidelity path; the fidelity surface | NO (draft) |
| REQ-158 … REQ-166, BUG-36 … BUG-39 | draft / free_and_reconciled / bundled | 2026-08-23 … 2026-08-31 | System KB, project KB, ingestion, product ticket store, builder cloud defects | NO — none touches the fold, the probes or the gate |

Re-swept this cycle: all 50 requests and 38 bugs in the store. Nothing reconciled
after REQ-136 (2026-08-12) touches this pipeline, so the cumulative picture is
unchanged from REPORT-3740 except for the two rows found by the citation sweep.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-84 (fold) | REQ-79, REQ-83, REQ-88, REQ-90, REQ-91, REQ-92, REQ-93, REQ-96, REQ-136, BUG-6, BUG-11, BUG-12, BUG-13, BUG-14, BUG-17, BUG-18, BUG-19, BUG-20, BUG-21, BUG-22, BUG-23, BUG-27, REQ-66 (retired) | **REPORT-3740's four gaps closed and verified against source.** One gap remains: BUG-24's fold half (finding 1). One ownership silence: REQ-88 §2 `nowrapFromPx` (warning 2) |
| STORY-86 (gate) | REQ-86, REQ-88 (`l1-gate`), REQ-94, BUG-5, BUG-7, BUG-8, BUG-9 | aligned on every behaviour; the stale cross-capability pointer is repaired |
| CAP-71 story tree as a whole | REQ-88, BUG-23 | the `1c repro` materialization verb now has an owner (STORY-84); no other story claims it — STORY-79 names `repro` only in its offline-verb dependency-gating list and explicitly cedes "the L1 reproduction pipeline" |
| STORY-84 ↔ STORY-86 | — | no exclusivity problem; each body still explicitly cedes the other's half, and the added materialization scope does not reach the gate |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-84 (`story-8acc338d`) | story-body-edit | BUG-24 (`bug-c50fdfcc`, free_and_reconciled, closed 2026-08-05, scoped under REQ-88) names **two** independent gaps and states the second as a fold gap outright: *"The fold never carried a captured scrim. `SectionValues.overlay` was projected end-to-end … but `foldSectionBackgrounds` read only `backgroundImageUrl`, so even a correctly captured scrim could not round-trip."* Its fix is a fold change — *"the section-background box carries `axes.overlay`; a section folds when it paints an image **OR** a scrim"* — and the ticket records *"The renderer needed no change."* Live at `tools/generate/src/l1/fold.ts:1246-1253` (the BUG-24 doc comment naming the `bg-slate-950/30` hero veil and full-brightness symptom), `:1260` (the image-OR-scrim folding trigger), `:1287-1288` (`axes.overlay` from the widest width that carries it), called at `:2150`. STORY-84's body never mentions a scrim, veil or band overlay; its backdrop bullet reads "a background photograph at any depth, or a full-bleed **opaque** panel fill", and none of its 22 ACs covers it (AC-812, the backdrop AC, is silent). The capture half of BUG-24 **is** expressed — CAP-63 STORY-75 carries the band-overlay probe and the translucent-fill exclusion in detail — which makes the fold half's absence the asymmetry: the axis is captured and rendered, and the story that owns the step between them does not say it folds | Add the scrim to STORY-84's account of the section-background box: the box carries the band's translucent veil (a colour with its own alpha, not element opacity) alongside its background image; each axis reads from the widest width that carries it; a section folds when it paints an image **or** a scrim, so an overlay over a solid band is carried too. Note the boundary against the backdrop bullet's "opaque" — a full-bleed *translucent* fill is deliberately not a backdrop, because it is already the band's overlay (STORY-75's exclusion). Then `ac-add` |
| 2 | warning | coverage | STORY-84 (`story-8acc338d`) | story-body-edit | REQ-88 §2 ("Single-line runs could wrap — and did, in Gecko") asks the fold to emit `axes.nowrapFromPx`, and is explicit that it is *"a **width**, not a flag, and that distinction is the whole fix"*: the threshold is the smallest captured width whose entire suffix is single-line, *"so it never claims more than the reference showed"*. That derivation is fold work — `fold.ts:222-240` `nowrapThreshold` (including the guard that an unmeasurable line count breaks the suffix, "or a real paragraph gets pinned and overprints the run absolutely positioned below it"), applied at `:1843-1844`. STORY-84's body contains **zero** occurrences of "wrap", and its Out-of-scope list does not cede it either, so ownership is silent rather than assigned. Held at warning, not violation, because the behaviour **is** expressed and covered elsewhere: CAP-70 STORY-83 documents the nowrap floor (with an explicit note that it "was reached through the copy-editing work (REQ-117) rather than declared by this story's own intent"), and AC-1009 / AC-1010 (`uat_coverage: pass`) state the threshold semantics — AC-1010's own verification folds a document whose run wraps at the two smallest rungs and is single-line above | Either name the derived nowrap threshold among the facts the fold reads off the ladder (alongside the visibility rule, which is the same shape), or add it to Out-of-scope with an explicit pointer to STORY-83 / AC-1010. Assigning it either way is the repair; leaving it unstated is what invites a future cycle to re-derive it as a gap |
| 3 | warning | consistency | STORY-84 (`story-8acc338d`) | story-body-edit | The materialization paragraph added by attempt 7 describes the verb accurately but never names it. It reads "the operator verb that imports a bundle as a site whose home page *is* its folded L1 document" — where the same body names `1c capture page <url>` outright. The verb is `1c repro <slug> --ref <bundle>` (`cli/repro.ts:95` `cmdRepro`, wired at `cli/index.ts:812`). Not a coverage gap — the behaviour is fully expressed — but this capability's loop stalled for seven cycles on findings detected by term sweeps over story bodies, and an unnamed verb is invisible to one | Name `1c repro` in the materialization paragraph or the In-scope list |

## Notes for the Editor

**The loop is moving again; do not re-open findings 1–6 of REPORT-3740.** Every
one was re-verified this cycle against the current bodies *and* the live source,
not taken on the fix report's word. The five story-level violations that stood
unrepaired for seven cycles are gone, and STORY-84's rewrite is faithful to the
code in detail — the self-painting guards, the pill-radius sentinel clamp, the
probe-is-not-a-keyframe rule and the seam↔binding refusal all match their
implementing comments closely enough to have been written from them.

**Finding 1 is one paragraph of work, in a section that already exists.** The
section-background box is already in STORY-84's Technical Context ("Backdrops are
ordered after the section-background boxes they are a peer of"); what is missing
is the second thing that box carries. Read BUG-24's "Root cause — TWO independent
gaps" section: it is unusually explicit that the L1 envelope, `l1OverlaySchema`
and `renderL1Document`'s layering were all *already in place and unreachable*, so
there is no CAP-70 work implied and no risk of the editor mis-assigning this
upward. The only thing that changed to close it was the capture probe (STORY-75,
expressed) and the fold (STORY-84, not expressed).

**Why this was missed for seven cycles, and how to not repeat it.** The prior
cycles re-derived the *same five findings* each time. This cycle swept every
`REQ-N` / `BUG-N` citation carried in `fold.ts`, `probes.ts`, `gate.ts` and
`repro.ts` and matched each against the story tree — which is what surfaced
BUG-24, REQ-91, REQ-103, REQ-114 and REQ-117, four of which turned out to be
expressed or non-asks. That sweep is cheap and is the recommended opening move
for any future cycle on this capability.

**Not raised as findings, recorded for the ledger.**
- REQ-103 (`fold.ts:1128`) and REQ-114 (`fold.ts:2115`) are implementation notes
  in fold code, not asks of the fold. REQ-103 explains why the gradient branch is
  built by name; REQ-114 explains why the fold emits colour literals only
  (palette assignment being a separate re-runnable pass owned by CAP-70's palette
  stories). Neither needs story expression. REQ-91's text pixel-movers **are**
  expressed, in the text-leaf bullet and AC-732.
- REQ-97 / REQ-104's per-width layout-mode resolution and row wrapping remain
  expressed in CAP-70 STORY-81 rather than STORY-86. Unchanged from REPORT-3740:
  a cross-reference would be an improvement, not a repair.
- STORY-84 and STORY-86 pass exclusivity, re-checked this cycle including the
  newly added materialization scope against all 45 stories.
- REQ-155 / REQ-156 / REQ-157 (all `draft`) will land on this capability when
  they activate. Correctly absent from both story bodies today.
- `uat_coverage: fail` stands on the capability and on both stories. Per the
  level cascade that is a UAT-level signal, not evidence here. Worth noting for
  sequencing: REPORT-3740 predicted the standing failure was being manufactured
  by AC-691 and AC-731 stating superseded rules; attempt 7 corrected both, so the
  UAT-level cycle should be re-read against the corrected ACs rather than
  against its own last verdict.
