---
uid: report-2e87dfd7
id: REPORT-2423
type: report
title: 'Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
  (level=story)'
created_by: xgd
created_at: '2026-08-20T11:28:02.840852+00:00'
updated_at: '2026-08-20T11:28:02.840852+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-2049c9ec
  level: story
  violations: 2
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
# Level: story

**Result**: FAIL
**Violations**: 2
**Warnings**: 2
**Needs review**: 0

Capability `capability-2049c9ec` (CAP-71). Stories in scope: STORY-84
(`story-8acc338d`, the fold) and STORY-86 (`story-24098299`, the gate). Both
`story_kind: upgrade`.

Attempt 9. **The three violations of `report-7d15aeac` (attempt 8) were verified as
landed** — STORY-84 now carries the viewport-height probe paragraph ("The ladder has
a second sampling axis: the viewport's HEIGHT"), the self-painting-run exception in
both the text-leaf and reconstructed-surfaces bullets, and the `1c repro`
materialization paragraph, each with its In-scope / Out-of-scope / Technical-Context
support. **None of the findings below is a repeat of that report**, nor of
`report-41a23f6e` or `report-13bc38e7`.

This cycle's findings come from a sweep this capability's prior cycles had not run:
enumerating the `REQ-`/`BUG-` attributions in **every** file the capability owns
(not `fold.ts` alone), then checking each attributed behaviour against a term scan
of all 31 story bodies. That surfaced two live, reconciled behaviours that no story
in the matrix expresses — one per story. Both were confirmed unowned matrix-wide
before being raised.

## Cumulative Intent Considered

The ledger below is the one rebuilt across prior cycles, re-verified and extended.
It still has to be rebuilt from the corpus plus the implementation's own
attributions, because the `intent_uid` / `updated_by` chain names 3 tickets where
≥20 reconciled intents shaped the code (see Notes).

Attribution counts are from a scan over all eight capability-owned source files
(`tools/generate/src/l1/{fold,probes,assets,forms,index,roundtrip}.ts`,
`tools/generate/src/cli/{repro,gate}.ts`) rather than `fold.ts` alone. Files were
read as bytes, since `builder.ts`/`fidelity.ts` in this tree contain NUL bytes and
are skipped by a plain `grep -r`.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (`bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | Framework pivot. REQ-83 = capture→L1 fold + keyframes + oracle + hints (→ STORY-84); REQ-86 = 3-probe gate (→ STORY-86) | YES |
| REQ-66 (`request-b94426f4`) | free_and_reconciled | 2026-07-18 | `adopt-values`, superseded by the fold (AC-696) | YES (retired) |
| **REQ-88** (`request-7ff1bacd`) | free_and_reconciled | 2026-07-21 → 2026-08-05 | Capture bundle → servable, gate-able site. 38 attributions across the owned files — the largest single intent here. `1c repro` + `1c l1-gate`; padding tracks; `nowrapFromPx`; centred column; captured surface rect; viewport-height probe + `geometry.viewportResponse`; **the fidelity probe's `mounted` channel and its height-probe dedup** (`probes.ts:526`, `:575`, `:626`) | YES |
| BUG-5 / BUG-7 / BUG-8 / BUG-9 | free_and_reconciled | 2026-07-23 | Gate-side: stable pairing identity; row tiling; half-open intervals; recursive promotion | YES |
| BUG-6 / BUG-11 / BUG-12 / BUG-13 / BUG-14 | free_and_reconciled | 2026-07-23 | Fold-side: residual signal; surface fill; font faces; section background-images; band→card→text | YES |
| **BUG-19** (`bug-5537a133`) | free_and_reconciled | 2026-07-23 | Per-surface fill attribution — **and the full-bleed bar (footer/nav) band rule** (`fold.ts:1384`, `:2059`, `:2070`) | YES (headline expressed; bar rule not — warning 3) |
| BUG-20 (`bug-1404344e`) | free_and_reconciled | 2026-07-23 | Box treatments; the self-painting pill | YES (expressed, attempt 8) |
| BUG-17 / BUG-18 | free_and_reconciled | 2026-07-23 | Dropped padding; widest-cell-only type axes | YES (expressed) |
| BUG-21 (`bug-24975383`) | free_and_reconciled | 2026-07-24 | Padded control joins the self-painting family | YES (expressed, attempt 8) |
| BUG-22 (`bug-3e3fabdb`) | free_and_reconciled | 2026-07-23 | `SurfaceShape` on the capture side | YES |
| BUG-23 (`bug-3bf390f7`) | free_and_reconciled | 2026-07-24 | Asset localization + hard fail in `cmdRepro` | YES (expressed, attempt 8) |
| **BUG-24** (`bug-c50fdfcc`) | free_and_reconciled | 2026-07-24 | Colour-with-alpha: **two** root causes, one capture-side and one **fold-side** — "the fold never carried a captured scrim" | YES (capture half owned by CAP-63; **fold half unexpressed — finding 1**) |
| BUG-27 (`bug-2936cebf`) | free_and_reconciled | 2026-07-25 | CSS background-images/lazy media; backdrops, page-base inference, backdrop edges as section edges | YES (expressed) |
| REQ-90 / REQ-91 / REQ-92 | free_and_reconciled | 2026-07-23 | Font resource table; full pixel-mover axis set; rebuild `foldToL1` to the full language; non-text pairing key | YES |
| REQ-93 (`request-f26cbe32`) | free_and_reconciled | 2026-07-25 | Behaviour seams + control leaves (AC-813) | YES |
| REQ-94 (`request-16253634`) | free_and_reconciled | 2026-07-25 | Gate calibration → cross-gate verdict | YES (expressed in full — re-verified this cycle against the intent body) |
| REQ-96 (`request-3a064234`) | free_and_reconciled | 2026-07-26 | `control` node kind | YES (CAP-70) |
| REQ-97 (`request-6c2b1cf4`) | free_and_reconciled | 2026-07-26 | `sizing` on text leaves | YES (owned by STORY-83 / CAP-70) |
| **REQ-98** (`request-7e70b1db`) | free_and_reconciled | 2026-07-26 | Uniform surface/paint axis group across node kinds; consequence at `assets.ts:85` (any kind may carry `backgroundImageUrl`, so asset rewriting must walk them all) | YES (axis owned by STORY-83 / CAP-70; the consequence is a mechanism inside AC-812's already-expressed rewrite — not a finding) |
| REQ-103 / REQ-114 | free_and_reconciled | 2026-07 → 2026-08 | Linear-gradient branch; palette model (fold emits literals only) | YES (expressed / non-behaviour here) |
| REQ-104 | free_and_reconciled | 2026-07-27 | Wrapping row + per-width layout track | YES (owned by STORY-81 / CAP-70) |
| BUNDLE-11 (`bundle-ee56a66e`) | free_and_reconciled | 2026-08-05 | 15 members incl. REQ-94, REQ-96 | YES |
| REQ-136 (`request-8a132869`) | free_and_reconciled | 2026-08-12 | Image framing + colour adjustment (AC-1133/AC-1134) | YES (expressed) |
| BUG-15 / BUG-16 / BUG-25 | free_and_reconciled | 2026-07 | values-diff / capture-side | NO (CAP-63) |
| REQ-134 (`request-ba3e3fba`) | abandoned | 2026-08 | Image generation component | NO |

**Ledger correction carried from the prior cycle.** `report-7d15aeac` listed
BUG-24 under "BUG-15 / BUG-16 / BUG-24 / BUG-25 — values-diff / capture-side — **NO
(CAP-63)**". That is half right and is what hid finding 1: BUG-24's own body
diagnoses **two independent gaps**, and names the second as the fold's
(`foldSectionBackgrounds` read only `backgroundImageUrl`). The capture half is
CAP-63's; the fold half is this capability's, and STORY-75 says so explicitly (see
finding 1).

**Re-verified and cleared this cycle.** REQ-94's four asks (perceptual floor;
reference coverage; named causes distinguishing "capture incomplete" from
"reproduction wrong"; the disagreement itself as a finding) are each expressed in
STORY-86's cross-gate section, read against the intent body rather than the prior
report's summary. REQ-97 / REQ-104 remain owned by STORY-83 / STORY-81 (CAP-70).
REQ-98's axis half is STORY-83's. Exclusivity between STORY-84 and STORY-86 is
clean — each defers the other's half by name.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-84 (`story-8acc338d`) | REQ-83, REQ-88, REQ-90/91/92/93, REQ-103, REQ-114, REQ-136, BUG-6, BUG-11, BUG-12, BUG-13, BUG-14, BUG-17, BUG-18, BUG-19 (partial), BUG-20, BUG-21, BUG-22, BUG-23, BUG-24 (partial), BUG-27 | attempt 8's three repairs **verified landed**; **gap ×1 + warning ×1**: BUG-24's fold-side scrim (finding 1); BUG-19's full-bleed bar rule (finding 3) |
| STORY-86 (`story-24098299`) | REQ-86, REQ-88 (partial), REQ-94, BUG-5, BUG-7, BUG-8, BUG-9, BUG-14 | **gap ×1 + warning ×1**: REQ-88's `mounted` fidelity channel (finding 2); the gate's height-probe dedup (finding 4). REQ-94 fully expressed |
| Capability body (CAP-71) | — | aligned; correctly records the 2026-08-05 consolidation |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-84 | story-body-edit | **The fold carries a captured translucent scrim onto the section-background box, and folds a section that paints a scrim even with no image — STORY-84 expresses neither, and its nearest sentence says the opposite.** BUG-24 (`bug-c50fdfcc`, free_and_reconciled, 2026-07-24, scoped under REQ-88) names two independent root causes; the second is the fold's: "`SectionValues.overlay` was projected end-to-end … but `foldSectionBackgrounds` read only `backgroundImageUrl`, so even a correctly captured scrim could not round-trip." Its Fix section lists `tools/generate/src/l1/fold.ts` — "the section-background box carries `axes.overlay`; a section folds when it paints an image **OR** a scrim (so an overlay over a solid band is carried too). Each axis reads from the widest width that carries it." Live at `fold.ts:1246-1252` (the doc comment), `:1260` (`if (!sv.backgroundImageUrl && !sv.overlay) continue` — the OR), `:1281-1288` (per-axis widest read, because "a section may paint an image at some widths and only a scrim at others"). **Ownership is settled, not inferred**: STORY-75 (`CAP-63`, the capture story that owns BUG-24's other half) puts in its own **Out of scope** — "what the fold *does* with a captured backdrop, **scrim** or control (owned by the fold story)"; STORY-83 (CAP-70) owns only the axis ("translucent scrim overlay" in the shared surface group). A term scan of all 31 story bodies for `scrim` returns STORY-85, STORY-83, STORY-76, STORY-75, STORY-101, STORY-100 — **not STORY-84 or STORY-86**; `translucent` returns STORY-83, STORY-82, STORY-75. STORY-84's backdrop bullet reads "a background photograph at any depth, or a full-bleed **opaque** panel fill", which not only omits the scrim but describes the fill as opaque — the exact case BUG-24 was filed for (`bg-slate-950/30` over the hero photo, rendered unveiled). Proven live by `tests/bug24-scrim-alpha.test.ts` — 4 fold/render UATs (`test_UAT_FC_BUG-24_hero_scrim_folds_onto_the_section_background_box`, `..._scrim_over_image_renders_as_a_translucent_layer_above_it`, `..._scrim_without_a_background_image_still_folds`, `..._a_section_with_neither_image_nor_scrim_folds_no_box`); note these are `FC`-named while the capture half's UATs carry `AC1316` — the fold half is tested but has no matrix element, which is this finding | In the backdrop / section-background bullet, state that a captured band also carries its **translucent scrim** (a colour with its own alpha, layered above the background image within the same box), that a section folds when it paints an image **or** a scrim — so an overlay over a solid band is carried too — and that each axis is read from the widest width carrying it, since a section may paint an image at some widths and only a scrim at others. Correct "full-bleed **opaque** panel fill" so it no longer excludes the translucent case. Add the axis to **In scope** and BUG-24 to the provenance list, deferring the capture-side probe to CAP-63 |
| 2 | violation | coverage | STORY-86 | story-body-edit | **The sample-fidelity probe reports a third channel — `mounted`, oracle text it deliberately did not grade because a behaviour slot covers it — and STORY-86 enumerates only two.** REQ-88 (`request-7ff1bacd`, free_and_reconciled) at `probes.ts:574-584`: "oracle text this probe deliberately did not grade, because a behaviour slot covers it: the run is rendered by a mounted behavior module (a form's own submit button), not by L1. **Reported rather than silently dropped.** Grading L1 on markup it does not emit would fail the gate for a correct reproduction; dropping it *quietly* would turn every mounted region into an ungraded hole nobody could see. The number is the size of what the L1 gate is not the right instrument for." Live: field declared `probes.ts:584`, populated `:621`, `:656` (`if (insideSlot(o.box)) mounted.push(...)`, under the `REQ-88` comment at `:626`), returned `:710`; surfaced to the operator at `cli/index.ts:636-640` ("`, ${report.sampleFidelity.mounted.length} in mounted behaviour`"). STORY-86's In scope claims "the three probes and **their report shapes**", and its only channel sentence says the fold-residual channel is "distinct from the fidelity probe's residuals **and unmatched entries**" — naming two where the code, the report shape and the CLI output all carry three. The story's related sentence ("controls / empty runs are excluded from the measure") covers the *fold classifier's* exclusion of control leaves, which is a different mechanism from excluding oracle text falling inside a slot rect and counting it. Unowned matrix-wide: `mounted behaviour`/`mounted behavior` hits only STORY-83 and STORY-98, and every one of those sentences is about the substrate's seam emission or the editor's segment map, not about grading; `not l1's to grade`, `ungraded` and `mounted region` return zero hits across all 31 stories. STORY-84's Out of scope defers gate-side channel presentation to this story. No test references `.mounted` — it is live and operator-visible but neither tested nor described | In the channel sentence, make the fidelity probe's report three channels rather than two: residuals, unmatched, and **mounted** — oracle text a mounted behavior module renders, excluded from grading because L1 does not emit it, and counted rather than dropped so a mounted region does not become an ungraded hole. State the rationale (grading L1 on markup it does not emit would fail a correct reproduction). Add it to **In scope** alongside the report shapes, and note it as the gate-side counterpart of the fold's behaviour seams (AC-813, STORY-84) |
| 3 | warning | coverage | STORY-84 | story-body-edit | **BUG-19's full-bleed bar rule is a second band-seeding path that STORY-84's single majority-fill sentence does not cover.** BUG-19 (`bug-5537a133`, free_and_reconciled) at `fold.ts:1383-1396`: "detect full-bleed **bar** fills (a footer / nav strip). A bar paints its solid fill edge-to-edge, but its text runs are individually narrow and horizontally *distributed* (space-between) … so no single run is full-width and the single-run band rule misses it — each run wrongly becomes a tiny card, exposing the page background across the bar." Discriminated from an evenly-tiled card grid by whether the largest internal horizontal gap is dominant (`barBandFills`, `:1397-1407`; used `:2059`, `:2070`). STORY-84 states only "the solid fill the most runs sit on becomes the document background band" — a footer bar is precisely the case that is *not* the most runs. Zero hits matrix-wide for `full-bleed bar`, `nav strip` or `space-between`. Classified **warning** rather than violation because BUG-19's headline ask (correct per-surface fill attribution) *is* expressed and this is an additional seeding path within a mechanism the story already names — unlike finding 1, it does not make a stated rule false | Extend the reconstructed-run-surfaces bullet: a fill also seeds a band when its same-fill, untreated runs share a horizontal row whose union spans the full content width and whose largest internal gap dominates — a footer/nav strip — which keeps an evenly-tiled card grid as cards |
| 4 | warning | coverage | STORY-86 | story-body-edit | **The gate dedupes the height probe out of the fidelity oracle, and STORY-86 does not say so.** `probes.ts:526-534` (REQ-88): "the width ladder only. A height probe re-shoots a ladder width at a second viewport height; admitting it hands the fidelity measure a second full set of oracle rows at that width whose reproduced-leaf queues are already drained, reporting every text run on the page as `unmatched`." Deduped on `(width, state)` locally rather than through the capture package's `partitionProbes`, "so `OracleSource` stays structural". This is the gate-side counterpart of the ladder partition STORY-84 now expresses ("the keyframe ladder deliberately skips the probe"); zero hits for `height probe` outside STORY-84. Classified **warning**: STORY-86 already says fidelity is measured "at each captured width", so admitting a probe would be a defect against a rule the story states — the omission is of the mechanism, not of the rule | Note in the sample-fidelity paragraph that the oracle admits the width ladder only: a height-probe re-shoot of a ladder width is deduped out, since admitting it would drain the reproduced-leaf queues and report the whole page as unmatched |

## Notes for the Editor

**Both violations came from widening the attribution sweep beyond `fold.ts`.** Prior
cycles built the ledger from `fold.ts` attributions alone. Running the same scan
over all eight capability-owned files surfaced the `mounted` channel and the
height-probe dedup (both `probes.ts`, both REQ-88), and re-reading BUG-24's body
rather than inheriting its prior ledger row surfaced the scrim. If a future cycle
wants to avoid another one-finding-per-attempt sequence, that scan — all owned
files, then a term scan of all 31 story bodies per attributed behaviour — is the
part worth repeating, and `.xgd/tmp/attr.py` in this worktree is the script.

**Read the source files as bytes.** `tools/generate/src/cli/builder.ts` and
`fidelity.ts` contain NUL bytes and are treated as binary by `grep -r`, so a
plain recursive grep silently under-reports attributions in this tree.

**Neither violation needs an ownership decision.** Finding 1's owner is named by
STORY-75's own Out-of-scope line; finding 2's is named by STORY-84's. Unlike the
`1c repro` question that consumed attempts 7 and 8, there is nothing here to
escalate.

**Both violations imply `ac-add` work at the next level, not at this one.** The
scrim has no AC under STORY-84 (its 18 ACs cover the backdrop at AC-812 but no
overlay/scrim axis) though four `test_UAT_FC_BUG-24_*` fold UATs already exist as
candidates; the `mounted` channel has neither an AC nor any test referencing
`.mounted`, so it is `ac-add` **plus** `uat-add` downstream. Do not create ACs in
this cycle.

**Matrix-hygiene item, unchanged and still not addressable at level=story.** Both
stories carry a single scalar `updated_by` and all 34 ACs carry `intent_uid: None`,
so this capability's intent ledger has to be rebuilt from the corpus and the
implementation's attributions on every cycle. That is the root cause of the
finding-per-cycle pattern this capability has shown for four cycles: with no usable
chain, each assessor re-derives coverage by whatever sweep they happen to run, and
a narrower sweep than the last one silently passes.
