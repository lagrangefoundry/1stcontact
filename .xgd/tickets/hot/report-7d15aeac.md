---
uid: report-7d15aeac
id: REPORT-2421
type: report
title: 'Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
  (level=story)'
created_by: xgd
created_at: '2026-08-20T11:13:37.914072+00:00'
updated_at: '2026-08-20T11:13:37.914072+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-2049c9ec
  level: story
  violations: 3
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
# Level: story

**Result**: FAIL
**Violations**: 3
**Warnings**: 0
**Needs review**: 0

Capability `capability-2049c9ec` (CAP-71). Stories in scope: STORY-84
(`story-8acc338d`, the fold) and STORY-86 (`story-24098299`, the gate). Both
`story_kind: upgrade`.

Attempt 8. The four actionable findings of `report-41a23f6e` (attempt 7) were
verified as landed in the current story bodies — the responsive-track mechanism,
padding, `nowrapFromPx`, the centred column, the REQ-88/BUG-17/BUG-18/BUG-21
provenance bullets, the five CAP-71 → intra-capability rewrites, the CAP-72 →
CAP-63 retarget, and the `evalScalarTrack` disclaimer are all present. **None of
the three violations below is a repeat of that report.** Two are unrepaired
findings from the *earlier* story cycle (`report-13bc38e7`, 2026-08-16) that were
dropped rather than fixed; the third is that report's finding 5, reclassified
from `needs_review` to `violation` on new evidence (see finding 3).

## Cumulative Intent Considered

The ledger was rebuilt from the bug/request corpus and the `REQ-`/`BUG-`
attributions carried in the implementation, because the `intent_uid` /
`updated_by` chain names 3 tickets where ≥20 reconciled intents shaped the code
(see Notes). Attribution counts below are from
`grep -o 'REQ-[0-9]*\|BUG-[0-9]*' tools/generate/src/l1/fold.ts | sort | uniq -c`.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (`bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | Framework pivot. REQ-83 = capture→L1 fold + keyframes + oracle + hints (→ STORY-84); REQ-86 = 3-probe gate (→ STORY-86) | YES |
| REQ-66 (`request-b94426f4`) | free_and_reconciled | 2026-07-18 | `adopt-values`, superseded by the fold (AC-696) | YES (retired) |
| **REQ-88** (`request-7ff1bacd`) | free_and_reconciled | 2026-07-21 → 2026-08-05 | **Capture bundle → servable, gate-able site.** 33 fold attributions — the largest single intent here. `1c repro` + `1c l1-gate`; padding tracks; `nowrapFromPx`; centred column; captured surface rect; **the viewport-height probe and `geometry.viewportResponse`** | YES |
| BUG-5 / BUG-7 / BUG-8 / BUG-9 | free_and_reconciled | 2026-07-23 | Gate-side: stable pairing identity; row tiling; half-open intervals; recursive promotion | YES |
| BUG-6 / BUG-11 / BUG-12 / BUG-13 / BUG-14 / BUG-19 | free_and_reconciled | 2026-07-23 | Fold-side: residual signal; surface fill; font faces; background-images; band→card→text; per-surface attribution | YES |
| **BUG-20** (`bug-1404344e`) | free_and_reconciled | 2026-07-23 | Box treatments; **the self-painting pill folds its surface onto the text leaf** | YES |
| BUG-17 / BUG-18 | free_and_reconciled | 2026-07-23 | Dropped padding; widest-cell-only type axes | YES (expressed) |
| **BUG-21** (`bug-24975383`) | free_and_reconciled | 2026-07-23 | Control surfaces double-apply padding → **padded control joins the self-painting family**; captured `SurfaceShape` adopted | YES |
| BUG-22 (`bug-3e3fabdb`) | free_and_reconciled | 2026-07-23 | `SurfaceShape` on the capture side, which REQ-88 round-5 folds | YES |
| **BUG-23** (`bug-3bf390f7`) | free_and_reconciled | 2026-07-23 | **Reproduction hotlinks the captured origin** → asset localization + hard fail on an unmirrored handle, explicitly "in `cmdRepro`, not in the fold" | YES |
| BUG-27 (`bug-2936cebf`) | free_and_reconciled | 2026-07-25 | CSS background-images/lazy media; 10 fold attributions (backdrops, page-base inference, backdrop edges as section edges) | YES (expressed) |
| REQ-90 / REQ-91 / REQ-92 | free_and_reconciled | 2026-07-23 | Font resource table; full pixel-mover axis set; rebuild `foldToL1` to the full language | YES |
| REQ-93 (`request-f26cbe32`) | free_and_reconciled | 2026-07-25 | Behaviour seams + control leaves (AC-813) | YES |
| REQ-94 (`request-16253634`) | free_and_reconciled | 2026-07-25 | Gate calibration → cross-gate verdict | YES |
| REQ-96 (`request-3a064234`) | free_and_reconciled | 2026-07-26 | `control` node kind | YES |
| REQ-97 (`request-6c2b1cf4`) | free_and_reconciled | 2026-07-26 | `sizing` on text leaves — incl. the analytic gate mirroring it | YES (owned by STORY-83 / CAP-70) |
| REQ-103 | free_and_reconciled | 2026-07 | Linear-gradient branch in the fold | YES (expressed) |
| REQ-104 | free_and_reconciled | 2026-07-27 | Wrapping row + per-width layout track, incl. the shared mode cascade the analytic gate reads | YES (owned by STORY-81 / CAP-70) |
| REQ-114 | free_and_reconciled | 2026-08 | Palette model; the fold emits literals only | YES (non-behaviour here) |
| BUNDLE-11 (`bundle-ee56a66e`) | free_and_reconciled | 2026-08-05 | 15 members incl. REQ-94, REQ-96 | YES |
| REQ-136 (`request-8a132869`) | free_and_reconciled | 2026-08-12 | Image framing + colour adjustment (AC-1133/AC-1134) | YES (expressed) |
| BUG-15 / BUG-16 / BUG-24 / BUG-25 | free_and_reconciled | 2026-07 | values-diff / capture-side | NO (CAP-63) |
| REQ-134 (`request-ba3e3fba`) | abandoned | 2026-08 | Image generation component | NO |

**Two near-misses checked and cleared, both by the same test.** REQ-97 (the
evaluator must mirror `sizing.width`, `probes.ts:288`) and REQ-104 (wrapping rows
+ per-width layout-mode resolution, `probes.ts:241/350/370/935`) both add
obligations *inside components STORY-86 declares in scope*, and STORY-86's body
still says the evaluator "mirrors the renderer on **two** axes". Neither is a
finding: both are deliberately owned elsewhere and saying so again here would be
duplication, not coverage. STORY-83 (`story-d0a8cfad`, CAP-70) states "The
analytic layout gate mirrors sizing for every kind, by necessity", and STORY-81
(`story-3569e1a4`, CAP-70) puts "the shared mode cascade shared by renderer and
analytic gate" and "the wrapping row" in its own **In scope**. STORY-86 needs no
edit for either.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-84 (`story-8acc338d`) | REQ-83, REQ-88 (partial), REQ-90/91/92/93, REQ-103, REQ-136, BUG-6, BUG-11, BUG-12, BUG-13, BUG-14, BUG-17, BUG-18, BUG-19, BUG-21 (partial), BUG-22, BUG-27 | **gap ×3**: REQ-88's viewport-height response (finding 1); BUG-20/BUG-21's self-painting run (finding 2); REQ-88 §1 / BUG-23's `1c repro` verb (finding 3) |
| STORY-86 (`story-24098299`) | REQ-86, REQ-94, BUG-5, BUG-7, BUG-8, BUG-9 | **aligned**. Attempt 7's rewrites landed; the CAP-71/CAP-72 references are gone; REQ-97/REQ-104 are owned by CAP-70 stories by design |
| Capability body (CAP-71) | — | aligned; correctly records the 2026-08-05 consolidation |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-84 | story-body-edit | **The fold consumes a second sampling axis — a viewport-height probe — and emits a per-node height response; STORY-84 describes a width ladder only.** REQ-88 (`request-7ff1bacd`, free_and_reconciled) specifies it in its own words: "Modelled as a **derivative**, `geometry.viewportResponse`, because a `100vh` hero is never a local fact… `{heightFactor: 1}` on the hero and `{yFactor: 1}` on everything below say the same thing in the same units", with "Bands take their response from their **section edges**, not the runs they contain", and the probe projection deliberately excluded from the keyframe ladder ("`restingByWidth` skips the probe as a keyframe while the fold reads it as evidence"). Live: `responseFrom` / `probeResponses` at `tools/generate/src/l1/fold.ts:249-288`, section-edge variant at `:290-295`, written onto geometry at `:1578`, `:1688` (a card inherits its representative row's), `:1814`, `:1943`; schema `L1ViewportResponse` + `L1Geometry.viewportResponse` at `packages/site-schema/src/l1/schema.ts:137-148, 240`; renderer applies it at `packages/framework/src/l1/render.ts:1598-1599`. BUG-27 cites it as measured behaviour ("the height probe worked correctly — 82/89 nodes carry a `yFactor`"). STORY-84 says only "samples a page across a fixed width ladder" and "a geometry keyframe per sampled width"; a term scan of **all 31 stories** for `yFactor` / `heightFactor` / `viewportResponse` / `100vh` / "height probe" / "viewport-relative" returns **zero hits anywhere in the matrix**. Raised as finding 4 of `report-13bc38e7` (2026-08-16) and dropped, not repaired | Add the height axis to STORY-84's account of the fold's inputs and outputs: the ladder carries a viewport-height probe that is read as evidence rather than as a keyframe; a node's measured y/height response to a taller viewport folds to a derivative on its geometry; a band takes its response from its section edges rather than from its runs, and a reconstructed card inherits its representative row's. State that it is measured, not inferred |
| 2 | violation | consistency | STORY-84 (+ AC-731) | story-body-edit | **STORY-84 states the pre-BUG-20 surface-reconstruction rule without its exception.** Body: "every run whose surface differs from the band (or carries a gradient the body cannot paint) gets a backing box emitted before the content". BUG-20 (`bug-1404344e`, free_and_reconciled) and BUG-21 (`bug-24975383`, free_and_reconciled) made a **self-painting run** an exception in both directions: it carries the surface on its own text leaf (`chipAxes` → `surfaceFill` / `borderRadiusPx` / `boxShadow` / `border`, `fold.ts:1044-1056`, applied `:1836-1837`) **and contributes no card row at all** (`fold.ts:1873-1877`, `if (chip) continue` — "emitting one would duplicate the pill as a card box behind the run"). Two families qualify: a pill at radius ≥ half its height (BUG-20) and a padded control (BUG-21, `isPaddedControlRun`, `fold.ts:1029-1036`, whose absence "gave every button 2x its height"). Neither is expressed: the text-leaf bullet lists only "the typography axes plus the text pixel-mover families (gradient fill, decoration, small-caps, list marker, text shadow)" — no surface. AC-731 (`acceptance_criterion-6a5e0eec`) carries the same unqualified rule and asserts it in Verification. Raised as finding 3 of `report-13bc38e7` and only half repaired — attempt 7 added the captured-surface-rect half to Technical Context; the self-painting half was not | In the text-leaf bullet, state that a run whose own border-box already spans its painted surface (a fully-rounded pill; a control with authored vertical inset) carries that surface on the text leaf itself. In the reconstructed-surfaces bullet, qualify the rule: such a run paints itself and contributes no backing box, so it never enters the band/card reconstruction. Flag for the `ac` cycle: AC-731 needs the matching `ac-edit` |
| 3 | violation | coverage | STORY-84 | story-body-edit | **`1c repro <slug> --ref <bundle>` — the verb that materializes a folded bundle as a site — is expressed by no story in the matrix.** REQ-88 §1 (free_and_reconciled): "writes a site whose home page *is* the bundle's folded L1 document, and mirrors the bundle's assets into the draft. Idempotent (re-running wipes and rebuilds)". BUG-23 (`bug-3bf390f7`, free_and_reconciled) added asset localization and its hard failure on an unmirrored handle, explicitly "in `cmdRepro`, not in the fold". Live at `tools/generate/src/cli/repro.ts:95` (`cmdRepro`), dispatched at `tools/generate/src/cli/index.ts:557`, 3 BUG-23 attributions in the same file. A body scan of all 31 stories for the verb, "mirrors the bundle's assets", asset mirroring/localization and "servable" finds no owner. **Reclassified from `report-41a23f6e`'s finding 5 (`needs_review`) on evidence that settles the ownership question that escalation asked** — the escalation drew no operator answer (the only comment on `report-3bb5d93d` is Claude's own, `comment-4c064f1b`): (a) CAP-82's Scope opens *after* this verb — "the whole path from 'the bytes exist locally' to 'a person with a link sees the page'" — and excludes authoring and rendering; (b) CAP-89's claim is already discharged from its own side, and only that side — AC-876 (`acceptance_criterion-d64f190a`, STORY-93) covers "Importing a reproduction replaces the page document wholesale", i.e. the overwrite property as it bears on a scaffolded slug, and nothing of the verb's packaging, asset mirroring or unmirrored-handle failure; (c) STORY-84 already owns the sibling verb from the same source file (AC-814, offline re-fold) **and** the retirement of the reproduction command this one replaces (AC-696, `adopt-values`) — a story that owns a command's predecessor and its sibling is where its successor belongs | Extend STORY-84's Description and **In scope** to the materialization verb: writing a site whose page document *is* the folded L1 document, mirroring the bundle's assets into it, rewriting captured-origin handles to the local mirror with an unmirrored handle failing hard rather than hotlinking, and idempotence (a re-run wipes and rebuilds). Note in the body that the overwrite-vs-scaffold interaction is AC-876's under CAP-89 and is not restated here. Add BUG-23 to the provenance list |

## Notes for the Editor

**All three findings are STORY-84's, and two are recurrences.** Findings 1 and 2
were raised on 2026-08-16 (`report-13bc38e7`, findings 4 and 3) and are not in the
2026-08-20 report at all. They were not repaired between the two runs — the code
paths are unchanged and the story text is verbatim. A fix cycle that resolves
"the findings in the injected report" rather than re-deriving them will keep
dropping whatever the previous assessor happened to surface; both of these have
now survived two full cycles that way.

**Finding 3 is not a guess, and it should not be escalated a second time.** The
prior cycle was right that ownership is a decision rather than a lookup, but the
decision is now determined by three checks it did not make: CAP-82's Scope
explicitly begins downstream of the verb, CAP-89's overlapping slice is already
owned by AC-876 and stops well short of the verb, and STORY-84 already owns both
the verb's predecessor (AC-696) and its file-sibling (AC-814). If the operator
later disagrees, moving one paragraph is cheap; leaving live reconciled behaviour
unexpressed in the matrix is the drift this check exists to catch.

**One gap outside this capability's remit, recorded so it is not lost.** Finding
1's *axis* half belongs to CAP-70, whose stories are also silent on
`viewportResponse` — the scan for it returned zero hits across the entire story
tree, and STORY-84's Out-of-scope correctly defers "the axis vocabulary these
folded values land in" to the substrate. The fold-side derivation is STORY-84's
and is what finding 1 asks for; the substrate axis and the capture-side probe
emission (CAP-63) are separate gaps for those capabilities' own cycles.

**The `intent_uid` / `updated_by` chain still cannot be used to build this
capability's ledger**, unchanged from the previous report: both stories carry a
single scalar `updated_by` and all 34 ACs carry `intent_uid: None`. This ledger
was rebuilt from the corpus plus the implementation's own attributions, which is
what surfaced findings 1 and 3 (REQ-88 alone carries 33 attributions in
`fold.ts`, more than any other intent, and the story cites it in one bullet).
Repairing the chain remains a worthwhile matrix-hygiene task in its own right.

**Not findings, checked and clear.** BUG-27's fold half is fully expressed (the
backdrop bullet covers background-layer placement, section-edge contribution and
the page-base inference). REQ-136, BUG-17, BUG-18, REQ-93 and the responsive-track
mechanism are expressed as of attempt 7. Exclusivity between the two stories is
clean — each defers the other's half explicitly, and STORY-86's deferrals are now
story-relative rather than capability-relative. STORY-86 required no edit this
cycle.
