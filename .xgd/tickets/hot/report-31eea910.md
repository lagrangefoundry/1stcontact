---
uid: report-31eea910
id: REPORT-2425
type: report
title: 'Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
  (level=story)'
created_by: xgd
created_at: '2026-08-20T11:46:33.348265+00:00'
updated_at: '2026-08-20T11:46:33.348265+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-2049c9ec
  level: story
  violations: 3
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
# Level: story

**Result**: FAIL
**Violations**: 3
**Warnings**: 2
**Needs review**: 0

Attempt 10. The four findings of the previous cycle (`report-2e87dfd7`) are
**verified landed** in the story bodies at `2026-08-20T11:31`: BUG-24's fold-side
scrim and the image-or-scrim condition with its per-axis widest read (STORY-84,
including the corrected "opaque" wording); BUG-19's full-bleed bar rule with the
dominant-gap discriminator (STORY-84); the `mounted` third fidelity channel
(STORY-86, with the fold-residual sentence corrected to "all three channels");
and the width-ladder-only oracle with its height-probe dedup (STORY-86). None of
this cycle's findings is a repeat.

## Sweep used this cycle (deliberately different from attempts 6–9)

The prior report's own "Notes for the Editor" identified the root cause of the
one-finding-per-attempt pattern: each assessor re-derives coverage by whatever
sweep they happen to run, and a narrower sweep than the last one silently passes.
Attempt 9's sweep was *attributions in the eight owned files* → term-scan of the
31 story bodies. This cycle ran three sweeps instead, and all three violations
came from the two that were new:

1. **Doc-block extraction over every owned file** (`.xgd/tmp/blocks.py`) — every
   multi-line `/** … */` block plus its following signature, read as a
   behavioural claim, rather than only the lines carrying a `REQ-`/`BUG-` token.
   This is what surfaced findings 1 and 3, both of which sit in blocks that carry
   their intent token in the *doc text* but were never enumerated as behaviours.
2. **Intent-body sweep for owned file paths** (`.xgd/tmp/intentsweep.py`) — every
   `request` / `bug` / `bundle` ticket whose body names `l1/fold.ts`,
   `l1/probes.ts`, `l1/assets.ts`, `l1/forms.ts`, `cli/repro.ts`, `cli/gate.ts`
   or `l1/index.ts` (17 hits). Reading REQ-93's **Scope** list rather than its
   headline is what surfaced finding 2: its item 3 is an explicit,
   separately-acceptance-tested ask on `repro`, and only its items 2 and 4 are
   expressed in the matrix.
3. Term-scan of all 31 story bodies per attributed behaviour (as before), used to
   confirm each candidate is unowned matrix-wide rather than homed elsewhere.

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability. Statuses were read
this cycle, not inherited from the prior report.

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-79 / REQ-82 / REQ-83 | (BUNDLE-7 `bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | Framework pivot; L1 substrate + safe renderer; the capture→L1 fold. Originating intent of both stories | YES |
| REQ-86 | — | free_and_reconciled | 2026-07-22 | The 3-probe end-to-end reproduction gate (`probes.ts` header) | YES |
| BUG-5 (`bug-5b7153d2`) | | free_and_reconciled | 2026-07-23 | Fidelity gate paired text by string → occurrence-index pairing | YES |
| BUG-6 (`bug-b9eb2e3a`) | | free_and_reconciled | 2026-07-23 | Typed residual signal instead of a silent drop | YES |
| BUG-7 (`bug-d18ad577`) | | free_and_reconciled | 2026-07-23 | `evaluateLayout` gave every child full parent width → row tiling | YES |
| BUG-9 (`bug-f983e8eb`) | | free_and_reconciled | 2026-07-23 | `promoteToFlow` only promoted the root → region-aware recursion | YES |
| BUG-11 / BUG-13 / BUG-17 / BUG-20 / BUG-21 / BUG-22 | | free_and_reconciled | 2026-07-23/24 | Surface fills; section-background boxes; padding; the two self-painting-run families; captured surface shape | YES |
| **BUG-14** (`bug-29b55835`) | | free_and_reconciled | 2026-07-23 | Section-band → card → text reconstruction, **and** its consequence for the gate's non-text pairing queue | YES — **gap (finding 3)** |
| BUG-19 (`bug-5537a133`) | | free_and_reconciled | 2026-07-23 | Full-bleed bar band rule | YES (landed last cycle) |
| **BUG-23** (`bug-3bf390f7`) | | free_and_reconciled | 2026-07-24 | Asset localization: hard failure on an unmirrored handle **and** the unreferenced-mirror fold gap | YES — **gap (finding 1)** |
| BUG-24 (`bug-c50fdfcc`) | | free_and_reconciled | 2026-07-24 | Fold-side scrim (capture half is CAP-63's) | YES (landed last cycle) |
| REQ-88 (`request-7ff1bacd`) | | free_and_reconciled | 2026-07-21 | The operator-facing pipeline: `repro`, `l1-gate`, padding/type tracks, no-wrap threshold, centred column, height probe, `mounted` channel, ladder-only oracle | YES |
| REQ-90 / REQ-91 / REQ-92 | | free_and_reconciled | 2026-07-23 | Font resource table; text pixel-movers; full-language rebuild + non-text pairing key | YES |
| **REQ-93** (`request-f26cbe32`) | | free_and_reconciled | 2026-07-25 | 5 scope items. Item 2 (slot at the union rect) + item 4 (mount) expressed; **item 3 (derive the module config from the capture; record a residual rather than invent an endpoint) is not** | YES — **gap (finding 2)** |
| REQ-94 (`request-16253634`) | | free_and_reconciled | 2026-07-25 | Cross-gate reconciliation. Re-verified this cycle against `gate.ts` block-by-block: ordering, floor, coverage, named causes, deltas-as-evidence, hard error on a missing manifest — **all six expressed** | YES |
| REQ-96 (`request-3a064234`) | | free_and_reconciled | 2026-07-26 | `control` node kind (CAP-70); offline re-fold (`cmdRefold`, expressed) | YES |
| REQ-97 (`request-6c2b1cf4`) | | free_and_reconciled | 2026-07-26 | `sizing` on text leaves; the evaluator's `constrainWidth` mirror | YES (axis owned by STORY-83; the evaluator mirror is the same "one rule, two consumers" shape STORY-81 states) |
| REQ-98 (`request-7e70b1db`) | | free_and_reconciled | 2026-07-26 | Uniform surface/paint axis group; consequence at `assets.ts:85` (any kind may carry `backgroundImageUrl`) | YES (axis is STORY-83's; the consequence is a mechanism inside an expressed rewrite) |
| REQ-103 / REQ-114 | | free_and_reconciled | 2026-07/08 | Linear-gradient branch; palette model (fold emits literals only) | YES (expressed / non-behaviour here) |
| **REQ-104** (`request-d67ea520`) | | free_and_reconciled | 2026-07-27 | Layout track + **wrapping row**; both consumed by the analytic evaluator | YES — owned by STORY-81, but STORY-86 states a rule REQ-104 falsified (**warning 4**) |
| REQ-118 (`request-66e4c630`) | | free_and_reconciled | 2026-07-31 | Asset picker. Cites `l1/assets.ts` only to reuse its handle normalization — no ask on this capability | NO (citation only) |
| REQ-136 (`request-8a132869`) | | free_and_reconciled | 2026-08-12 | Image framing + colour adjustment | YES (expressed) |
| BUG-15 / BUG-16 / BUG-25 | | free_and_reconciled | 2026-07 | Capture-side / values-diff | NO (CAP-63) |
| REQ-134 (`request-ba3e3fba`) | | abandoned | 2026-08 | Image-generation component | NO |

**Ledger note.** REQ-118 is new to this ledger (it surfaced only via the
intent-body sweep) and is explicitly **not** an ask on this capability — it names
`l1/assets.ts` to say the picker normalizes handles "by the same leading-`./`-or-`/`
strip" the fold uses. Recorded so a future cycle does not re-investigate it.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-84 (`story-8acc338d`) | REQ-83, REQ-88, REQ-90/91/92/93, REQ-96, REQ-103, REQ-114, REQ-136, BUG-6, BUG-11, BUG-12, BUG-13, BUG-14, BUG-17, BUG-18, BUG-19, BUG-20, BUG-21, BUG-22, BUG-23, BUG-24, BUG-27 | attempt 9's three repairs (scrim ×2, bar rule) **verified landed**; **gap ×2**: BUG-23's unreferenced-mirror fold gap (finding 1); REQ-93 scope item 3, the derived module config and its derivation-gap channel (finding 2) |
| STORY-86 (`story-24098299`) | REQ-86, REQ-88, REQ-92, REQ-94, REQ-97, REQ-104 (consumed), BUG-5, BUG-7, BUG-8, BUG-9, BUG-14, BUG-18 | attempt 9's two repairs (`mounted`, ladder-only oracle) **verified landed**; REQ-94 re-verified expressed in full; **gap ×1 + warning ×2**: BUG-14's pairing-queue exclusion (finding 3); the wrapping-row row-height rule (finding 4); the slot overlap exemption (finding 5) |
| Capability body (CAP-71) | — | aligned; correctly records the 2026-08-05 consolidation and the fold/gate scope split |

Exclusivity between the two stories remains **clean**: each defers the other's
half by name, and all three violations land on the story the *other* story's
Out-of-scope line already points at (finding 3's owner is named by STORY-84's
"the end-to-end reproduction acceptance gate, **its fidelity pairing of non-text
leaves**, and structure recovery (owned by the 3-Probe Reproduction Gate story)").

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-84 | story-body-edit | **Materialization reports a second asset channel — mirrored assets the folded document references nowhere, surfaced as a *fold gap* — and STORY-84 expresses only the converse.** BUG-23 (`bug-3bf390f7`, free_and_reconciled, 2026-07-24) has two halves and the story carries one. The expressed half: an absolute handle with no mirrored counterpart fails the run (`assets.ts:29-34`, `repro.ts:133-138`). The **unexpressed** half: `LocalizedAssets.unreferenced` — "Mirrored `image`/`font` assets no node references — the bundle carries the bytes but the fold never emitted a leaf (or a `@font-face`) for them. **A fold gap to report, not a silent no-op**" (`assets.ts:35-41`, computed `:108-110`); carried out as `ReproResult.unreferencedAssets` (`repro.ts:53-58`, populated `:202`) and printed by the verb — `cli/index.ts:567-572`: "`⚠ N mirrored asset(s) referenced by no node (fold gap)`", under the comment "an unreferenced mirrored asset is a fold gap (the bundle has the bytes; no leaf points at them), so it is reported, not silently dropped". STORY-84's materialization paragraph states only the hard-failure direction. **Unowned matrix-wide**: `unreferenced` and `referenced by no` return **zero** hits across all 31 story bodies. **Not STORY-86's**: the gate's `referenceCoverage` also counts unreferenced mirrored images (`gate.ts:221-238`) but measures a *different* thing on a *different* verb — images no element of the **reference manifest** attributes (a capture-coverage proxy), not handles no node of the **folded document** names (a fold-power proxy). Proven live by `tests/bug23-repro-local-assets.test.ts:149` (`test_UAT_FC_BUG-23_unreferenced_mirrored_assets_are_reported_as_a_fold_gap`, asserting `result.unreferencedAssets` and `localized.unreferenced`), whose own comment at `:61` calls it "the **AC-4** fold-gap signal" — the behaviour is tested and BUG-23 accepted it, but it is `FC`-named and has no matrix element | In the materialization paragraph, state the second channel alongside the hard failure: a mirrored `image`/`font` asset the folded document references nowhere is reported as a **fold gap** — the bundle holds the bytes but the fold emitted no leaf or `@font-face` for them — surfaced rather than silently dropped, because it names folder power the reproduction is missing rather than a broken reproduction. Add it to **In scope** next to asset localization, and note that it is a different measure from the gate's reference-coverage media proxy (which asks the same question of the reference manifest, on the gate verb) so the two are not read as one |
| 2 | violation | coverage | STORY-84 | story-body-edit | **The fold/materialization pair derives the behaviour module's `config` from the capture and reports what the capture could not tell it — a separate REQ-93 scope item that the matrix does not express.** REQ-93 (`request-f26cbe32`, free_and_reconciled, 2026-07-25) lists five scope items; STORY-84 expresses item 2 (a `slot` at the captured controls' union rect) and repro expresses item 4 (mounting), but **item 3 is verbatim**: "`repro` — derive the module config from the capture: `fields[]` from `accessibleName` + `a11yRole` (+ `type` from the control's input type where available, else `text`/`textarea` by height), `action` from the captured form action. **Absent an action, record a residual rather than inventing an endpoint.**" Its Implementation section repeats it ("An endpoint never seen is reported as a residual, never invented"). Live at `forms.ts:208-219` (`foldedFormFor`'s contract: label from the a11y accessible name; type from the captured input type else from height; action from the captured form action) and `:221-254` (each gap pushed: no accessible name, no recorded input type, no form action, and a captured action failing `isSafeUrl` dropped with a residual). The channel is explicitly a *distinct* one: `forms.ts:97-105` — "*derivation* gaps (a missing endpoint, an unrecorded input type) — **deliberately NOT** {@link FoldResidual}s, which name gaps in L1's expressive power. Conflating the two would make a form the fold successfully mounted still read as an un-foldable field"; restated at `repro.ts:59-65` and `:261-268`, and printed per behaviour at `cli/index.ts:573-584` ("Surfaced so an honest default is never mistaken for a fact"). STORY-84's seam paragraph covers only the slot, the control leaves and the rebasing; its materialization paragraph says the seams are "mounted into it" and stops. **Unowned matrix-wide**: `derivation gap` and `honest default` return zero hits across all 31 stories; `endpoint` hits STORY-85/STORY-83 only as the module-side *declaration* (what a module's `config` may hold), never as something derived from a capture, and STORY-85 is the behaviour-module contract that STORY-84's Out-of-scope defers to for exactly that. `labelMode` is separately and correctly owned by STORY-82. Tested but unattributed: `tests/req93-l1-slot-mounted-behaviors.test.ts:392` (`test_UAT_FC_REQ-93_config_is_derived_never_invented`) and `:424-451` asserting the `no form action captured` and `not a safe URL` residuals | Extend the behaviour-seams paragraph: the fold also derives each seam's **behavioural config** from the capture alone — the field list from the a11y tree's accessible name, each field's type from the captured input type (falling back to height when the bundle records none), and the submission endpoint from the captured form action — and **invents nothing**: where the capture carries no such fact, or carries an unsafe endpoint, the derivation records a **derivation gap** and falls back to an honest default. State that this channel is deliberately distinct from the typed element residual, since the form *was* mounted and so is not a gap in L1's expressive power. Add it to **In scope** beside the behaviour seams, keeping STORY-85's ownership of what the module's `config` may hold and STORY-82's of `labelMode` |
| 3 | violation | consistency | STORY-86 | story-body-edit | **Fold-synthesized backing surfaces are excluded from the fidelity probe's non-text pairing queue, and STORY-86's stated non-text pairing rule says they are not.** The story states the rule unconditionally — "image and box leaves — which carry no text — pair by the same document-order occurrence mechanism keyed by leaf **kind**" — and its one sentence about backing surfaces enumerates exactly which checks they are exempt from: "excluded from the sibling-overlap check … while remaining subject to the horizontal-clip check". Fidelity pairing is not on that list, so the body positively implies a synthesized `box` enters the queue. It does not. `fold.ts:882-891` (BUG-14): the `section-band-` / `section-bg-` / `card-` boxes "None is a captured element: each one's source elements classify as `text` and are measured through their own text leaves, so they have **no oracle counterpart** and must never enter the gate's non-text pairing queue (doing so mispairs every real `box-*` leaf and reports phantom fidelity deltas)". Enforced in the gate at `probes.ts:678-685` — `if (isSynthesizedSurfaceId(l.id)) continue` when building `nonTextQueues` — under the comment at `:670-677` ("Leaving them in the queue would shift every real `box-*` leaf by the number of surfaces before it and report phantom deltas"). This is a **third** exclusion mechanism and the only one on the *reproduced* side: the classifier exclusion the story already states drops controls/empty runs from the **oracle** before pairing, and the `mounted` channel sets aside oracle **text** by where its box falls. **Ownership settled, not inferred**: STORY-84's Out-of-scope defers "the end-to-end reproduction acceptance gate, **its fidelity pairing of non-text leaves**, and structure recovery" to this story. **Unowned matrix-wide**: `pairing queue` returns zero hits; `backing surface` returns one hit, the STORY-86 sentence above; `synthesiz` returns one hit, STORY-84's unrelated "the fold never synthesizes a raw `<input>`". Tested but unattributed: `tests/bug14-fold-surface-hierarchy.test.ts:207` (`test_UAT_FC_BUG-14_synthesized_surfaces_do_not_mispair_real_box_leaves`) and `:179` | In the sample-fidelity paragraph, qualify the non-text rule: the queue is built from the **captured** non-text leaves only — a fold-synthesized backing surface (a reconstructed band, section background or card) is excluded, because its source elements classify as text and are already measured through their own text leaves, so it has no oracle counterpart and leaving it in would shift every real box leaf and report phantom deltas. Name it as the third and only reproduced-side exclusion, distinct from the oracle-side classifier exclusion and from the `mounted` set-aside. Extend the backing-surface sentence so its enumeration of exemptions covers fidelity pairing as well as sibling overlap, and add the exclusion to **In scope** with the pairing contract |
| 4 | warning | consistency | STORY-86 | story-body-edit | **STORY-86 states the evaluator's row-height rule unconditionally, and REQ-104 made it conditional.** The story's flow-direction bullet ends "…the cursor advances by that width, and **the row's height is its tallest child**". REQ-104 (`request-d67ea520`, free_and_reconciled, 2026-07-27) added the wrapping row, and the evaluator implements it: `probes.ts:246` (`packRowLines` — "greedily pack a wrapping row's children into lines: a child that no longer fits on the current line starts the next one"), gated at `:355` (`const wrapping = row && … node.wrap === true`) and consumed at `:370-392`, where the row's height accumulates per line (`cursorY += lineHeight + gap`) — i.e. the **sum of its lines**, which the code comment states explicitly: "with `wrap`, children that no longer fit start a new line instead of squeezing, and the row's height is the sum of its lines". So the story's rule is true only of the non-wrapping branch it describes, while STORY-86's **In scope** claims "the analytic evaluator's flow model (row tiling, stack stacking, and conservative grid)" as this story's. Classified **warning, not violation**, because the behaviour is not an unowned gap: STORY-81 (`story-3569e1a4`, CAP-70) owns "the wrapping row" and states "**One cascade, two consumers** … used by both the renderer … and the analytic layout evaluator behind the reproduction gate", with "the shared mode cascade shared by renderer and analytic gate" in its own In scope, and it carries evidence over the evaluator (`tests/reconciliation-responsive-layout-track.test.ts:282`, `test_UAT_AC835_row_wraps_restates_its_mode_whole_and_shares_one_cascade`, asserting `evaluateLayout` reports no clip on a wrapping row where the plain row clips). Repairing here must **not** duplicate STORY-81 | Qualify the sentence — a row that does not wrap takes its height from its tallest child — and add one clause deferring the wrapping row and the per-width layout mode to STORY-81 (CAP-70), which owns the axis and the one cascade both the renderer and this evaluator resolve through. Use the same shape the story already uses for the responsive scalar track, so the wrap branch's presence in the evaluator module is not read as an unowned probe behaviour |
| 5 | warning | coverage | STORY-86 | story-body-edit | **The sibling-overlap check exempts two leaf kinds; STORY-86 names one.** `probes.ts:460-474`: `solid` is filtered by `l.kind !== 'slot' && !(l.kind === 'box' && isSynthesizedSurfaceId(l.id))` — the comment reads "**Slots are inert placeholders (Phase-D seams)**, and a *fold-synthesized* backing surface … is the fill painted behind the runs it backs". The story states the backing-surface exemption and gives its rationale, but never mentions the slot exemption, which is load-bearing for exactly the pages this capability targets: a behaviour seam is pinned at its cluster's union rect and therefore overlaps every `control` leaf inside it by construction, so without the exemption every reproduced form would fail both envelope probes. STORY-86 already speaks of slot rects (in the `mounted` channel), so the concept is present in the body — only this consequence is missing. Classified **warning**: unlike finding 3 it does not make a stated rule false, and the story's exemption sentence is additive rather than presented as exhaustive | Extend the backing-surface exemption sentence to name both exempt kinds: a `slot` leaf is an inert seam whose mounted module paints inside it, so it overlaps its own control leaves by construction and is not a collision either. Keep both subject to the horizontal-clip check as the story already states |

## Notes for the Editor

**All five findings are `story-body-edit`; none needs an ownership decision.**
Finding 1's owner is STORY-84's own materialization scope; finding 2's is REQ-93
scope item 3, whose verb (`repro`) STORY-84 already claims; finding 3's owner is
named by STORY-84's Out-of-scope line. Findings 4 and 5 are corrections within
STORY-86's own stated scope. Nothing to escalate.

**Three of the five are the same defect shape, and it is worth naming.** Findings
1, 2 and 3 are each a *second channel on an already-expressed mechanism*: the
asset rewrite has a fold-gap channel beside its hard failure; the seam recovery
has a derivation-gap channel beside the element residual; the fidelity probe has
a reproduced-side exclusion beside its oracle-side one. Last cycle's finding 2
(`mounted`) was the same shape. The implementation is consistently careful to
keep these channels **distinct and legible** — `forms.ts:97-105` and
`repro.ts:261-268` both spell out why conflating them would mislead — and the
story bodies consistently describe the primary channel and stop. A future cycle
that wants a fast, high-yield sweep should enumerate every *reported field* on
this capability's public return types (`ReproResult`, `LocalizedAssets`,
`FoldedForm`, `SampleFidelityReport`, `L1GateResult`, `GateReport`,
`ReferenceCoverage`, `PromoteResult`) and check each against the matrix. That
enumeration is small, closed, and directly operator-visible, which makes it a
much better completeness proxy than a term scan.

**Read the source files as bytes.** `tools/generate/src/cli/builder.ts` and
`fidelity.ts` contain NUL bytes and are treated as binary by `grep -r`, so a
plain recursive grep silently under-reports attributions in this tree. The
scripts left in `.xgd/tmp/` (`blocks.py`, `attr.py`, `intentsweep.py`,
`termscan.py`) all read as bytes or go through the ticket API.

**REQ-94 was re-verified block-by-block this cycle and is fully expressed.** All
six of its behaviours — browser-free gates first, the two-bound perceptual floor
(either sufficient, echoed, overridable), the reference-coverage report, the five
named verdicts, value deltas as evidence rather than exit code, and the hard
error on a bundle with no retained manifest — are present in STORY-86's
cross-gate section, along with the widest-resting-projection rule in Technical
Context. No finding.

**Downstream work implied (do NOT action at this level).** All three violations
are `ac-add` at the next level, and each already has passing `FC`-named evidence
that needs re-attribution rather than authoring:

| Behaviour | Downstream | Candidate evidence |
|---|---|---|
| Unreferenced-mirror fold gap (STORY-84) | `ac-add` | `tests/bug23-repro-local-assets.test.ts:149` |
| Derived module config + derivation gaps (STORY-84) | `ac-add` | `tests/req93-l1-slot-mounted-behaviors.test.ts:392`, `:424-451` |
| Synthesized-surface pairing exclusion (STORY-86) | `ac-add` | `tests/bug14-fold-surface-hierarchy.test.ts:207`, `:179` |

**Matrix-hygiene item, unchanged and still not addressable at level=story.** Both
stories carry a single scalar `updated_by` and all 34 ACs carry
`intent_uid: None`, so this capability's intent ledger must be rebuilt from the
corpus and the implementation's own attributions on every cycle. This is the
fifth consecutive cycle to record it. It needs a field-level fix (per-AC
`intent_uid` backfill, and `updated_by` as a list) that the story level cannot
reach.
