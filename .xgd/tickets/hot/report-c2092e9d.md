---
uid: report-c2092e9d
id: REPORT-2427
type: report
title: 'Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
  (level=story)'
created_by: xgd
created_at: '2026-08-20T12:03:41.548092+00:00'
updated_at: '2026-08-20T12:03:41.548092+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-2049c9ec
  level: story
  violations: 2
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
# Level: story

**Result**: FAIL
**Violations**: 2
**Warnings**: 1
**Needs review**: 0

Attempt 11. All five findings of the previous cycle (`report-31eea910`, REPORT-2425)
are **verified landed** in the story bodies, re-read this cycle through
`xgd ticket get --json` (STORY-84 26969 chars, STORY-86 20134 chars):

| Prior finding | Landed |
|---|---|
| 1 — BUG-23's unreferenced-mirror fold gap (STORY-84) | yes — materialization paragraph, In-scope clause, BUG-23 Technical Context bullet |
| 2 — REQ-93 item 3, derived seam config + derivation-gap channel (STORY-84) | yes — new paragraph after the behaviour-seams paragraph, In-scope clause, Technical Context bullet |
| 3 — synthesized-surface exclusion from the non-text pairing queue (STORY-86) | yes — sample-fidelity paragraph, with the `mounted` sentence correctly re-enumerated to "third mechanism, distinct from both exclusions above" |
| 4 — the row-height rule is conditional on not wrapping (STORY-86) | yes — "a row that does **not** wrap…", In scope narrowed to "non-wrapping row tiling", Out of scope defers the wrapping-row axis to CAP-70 |
| 5 — the slot overlap exemption (STORY-86) | yes — "Two leaf kinds are exempt…", both still subject to horizontal clip |

None of this cycle's findings is a repeat.

## Sweep used this cycle

This cycle ran the sweep `report-31eea910`'s "Notes for the Editor" recommended
and no prior cycle had executed — **enumerate every reported field on this
capability's public return types and check each against the matrix** — plus one
new sweep the recommendation did not cover.

1. **Public-return-field enumeration.** Every `export interface` in the eight
   owned files (`l1/{assets,forms,probes,fold,index,roundtrip}.ts`,
   `cli/{repro,gate}.ts`), field by field, against the two story bodies:

   | Type | Fields | Verdict |
   |---|---|---|
   | `LocalizedAssets` | doc, rewritten, unmirrored, **unreferenced** | all expressed (last cycle closed `unreferenced`) |
   | `ReproResult` | slug, draftDir, nodeCount, copiedAssets, localizedAssets, **unreferencedAssets**, **forms** | all expressed |
   | `RefoldResult` | bundleDir, nodeCount, forms, residuals | expressed |
   | `FoldedForm` | slot, behavior, fields, action, form, **submitLabel**, residuals | `submitLabel` **unexpressed** (warning 3) |
   | `FoldedFormField` | name, label, type, **labelMode** | `labelMode` **unexpressed** (violation 1) |
   | `FoldResidual` | kind, reason, capturedAxes, widths | all four expressed verbatim |
   | `SampleFidelityReport` | pass, tolerancePx, maxDelta, residuals, unmatched, mounted | all expressed |
   | `EnvelopeReport` / `ThreeProbeReport` / `L1GateResult` | pass, byWidth, the three probes, promoted, foldResiduals, forms | all expressed |
   | `PromoteResult` | doc, promoted (whole-node vs nested paths) | expressed |
   | `ReferenceCoverage` / `CoverageFinding` / `GateReport` | mirrored/referenced/unreferenced images, sections, pageHeightPx, pxPerSection, findings; verdict, diagnosis, nextStep, floor, perceptualBreach, l1Pass, perceptual, values, coverage | all expressed **in STORY-86** — but see violation 2 for the capability body |

   The enumeration is corroborated as a good proxy: the two fields it flags are the
   only two of ~45 that no story body names.

2. **Capability-body vs story-tree scope reconciliation** (new this cycle). CAP-71's
   own Scope list read against what its two stories actually own, and against the
   other 25 capability bodies to establish that an omitted boundary is unowned
   matrix-wide rather than homed elsewhere (`.xgd/tmp/dumpcaps.py`). This produced
   violation 2 — the one element every prior cycle recorded as "aligned" without
   checking its scope list against the story tree beneath it.

3. **Term-scan of all 31 story bodies** per candidate (`.xgd/tmp/termscan.py`) and
   **intent-body scan of all 102 request/bug/bundle tickets**
   (`.xgd/tmp/intentscan.py`, `.xgd/tmp/section.py`), used to confirm each candidate
   is unowned matrix-wide and to locate the intent that asked for it. This is what
   attributed `labelMode` to REQ-88's Round-9 pass.

Spot-checks that **passed** and produced no finding: the eighths ratio snapping
(`fold.ts:204-206,244-245`), grid-modelled-as-stack (`probes.ts:346-348`), the
off-sample default widths 500/900 (`probes.ts:731`), the 1.5× single-line height
textarea rule (`forms.ts:238`), and `LayoutFinding.kind` being `overlap | clip`
with pinned-box content overflow reported as a clip (`probes.ts:408-412`,
`:453`) — all match the story bodies as written.

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability. Statuses were read
this cycle from the live tickets (`.xgd/tmp/statuses.py`), not inherited.

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-79 / REQ-82 / REQ-83 | `bundle-31e474b9` (BUNDLE-7) | free_and_reconciled | 2026-07-22 | Framework pivot; L1 substrate + safe renderer; the capture→L1 fold. Originating `intent_uid` of both stories | YES |
| REQ-86 | — | free_and_reconciled | 2026-07-22 | The 3-probe end-to-end reproduction gate | YES |
| BUG-5 | `bug-5b7153d2` | free_and_reconciled | 2026-07-23 | Fidelity gate paired text by string → occurrence-index pairing | YES |
| BUG-6 | `bug-b9eb2e3a` | free_and_reconciled | 2026-07-23 | Typed residual signal instead of a silent drop | YES |
| BUG-7 | `bug-d18ad577` | free_and_reconciled | 2026-07-23 | `evaluateLayout` gave every child full parent width → row tiling | YES |
| BUG-9 | `bug-f983e8eb` | free_and_reconciled | 2026-07-23 | `promoteToFlow` only promoted the root → region-aware recursion | YES |
| BUG-11 / BUG-13 / BUG-17 / BUG-18 / BUG-20 / BUG-21 / BUG-22 | | free_and_reconciled | 2026-07-23/24 | Surface fills; section-background boxes; padding; responsive type track; the two self-painting-run families; captured surface shape | YES |
| BUG-14 | `bug-29b55835` | free_and_reconciled | 2026-07-23 | Section-band → card → text reconstruction, and its consequence for the gate's non-text pairing queue | YES (landed last cycle) |
| BUG-19 | `bug-5537a133` | free_and_reconciled | 2026-07-23 | Full-bleed bar band rule | YES (landed) |
| BUG-23 | `bug-3bf390f7` | free_and_reconciled | 2026-07-24 | Asset localization: hard failure on an unmirrored handle **and** the unreferenced-mirror fold gap | YES (landed last cycle) |
| BUG-24 | `bug-c50fdfcc` | free_and_reconciled | 2026-07-24 | Fold-side scrim (capture half is CAP-63's) | YES (landed) |
| **REQ-88** | `request-7ff1bacd` | free_and_reconciled | 2026-07-21 | The operator-facing pipeline: `repro`, `l1-gate`, padding/type tracks, no-wrap threshold, centred column, height probe, `mounted` channel, ladder-only oracle — **and its Round-9 pass: `labelMode` carried fold → config → render, and the claimed submit button's wording** | YES — **gap ×1 + warning (findings 1, 3)** |
| REQ-90 / REQ-91 / REQ-92 | | free_and_reconciled | 2026-07-23 | Font resource table; text pixel-movers; full-language rebuild + non-text pairing key | YES |
| REQ-93 | `request-f26cbe32` | free_and_reconciled | 2026-07-25 | 5 scope items; item 3 (derive the module config from the capture, never invent an endpoint) landed in the body last cycle | YES (landed) |
| **REQ-94** | `request-16253634` | free_and_reconciled | 2026-07-25 | Cross-gate reconciliation: browser-free gates first, two-bound perceptual floor, reference-coverage report, five named verdicts, deltas-as-evidence, hard error on a missing manifest | YES — expressed in STORY-86, **absent from the capability body (finding 2)** |
| REQ-96 | `request-3a064234` | free_and_reconciled | 2026-07-26 | `control` node kind (CAP-70); offline re-fold (`cmdRefold`) | YES |
| REQ-97 / REQ-98 | | free_and_reconciled | 2026-07-26 | `sizing` on text leaves + the evaluator's `constrainWidth` mirror; uniform surface/paint axis group | YES (axes owned by STORY-83) |
| REQ-103 / REQ-114 | | free_and_reconciled | 2026-07/08 | Linear-gradient branch; palette model (fold emits literals only) | YES |
| REQ-104 | `request-d67ea520` | free_and_reconciled | 2026-07-27 | Layout track + wrapping row | YES (deferred to CAP-70 last cycle) |
| BUNDLE-10 | `bundle-4ff83a8b` | free_and_reconciled | 2026-07-29 | Reconciliation vehicle carrying BUG-12..BUG-24 **and REQ-88's round-5..round-10 passes** — the body that records the Round-9 labelling/submit work | YES |
| REQ-118 | `request-66e4c630` | free_and_reconciled | 2026-07-31 | Asset picker; cites `l1/assets.ts` only to reuse its handle normalization | NO (citation only) |
| REQ-136 | `request-8a132869` | free_and_reconciled | 2026-08-12 | Image framing + colour adjustment | YES (expressed) |
| BUG-15 / BUG-16 / BUG-25 | | free_and_reconciled | 2026-07 | Capture-side / values-diff | NO (CAP-63) |
| REQ-134 | `request-ba3e3fba` | abandoned | 2026-08 | Image-generation component | NO |

**Ledger note.** REQ-88's substantive body is spread across its own ticket **and**
the `## Round-5 … ## GA round-10` passes appended under its section in BUNDLE-10.
Prior cycles read the REQ-88 ticket and the bundle's `## BUG-N:` sections, but not
the round-pass sections nested under `## REQ-88:` — which is why the Round-9
behaviours (findings 1 and 3) survived ten cycles. A future cycle reading BUNDLE-10
should split on `\n## ` and read **every** section, not only the ones whose heading
names a ticket.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-84 (`story-8acc338d`) | REQ-83, REQ-88, REQ-90/91/92/93, REQ-96, REQ-103, REQ-114, REQ-136, BUG-6, BUG-11, BUG-13, BUG-14, BUG-17, BUG-18, BUG-19, BUG-20, BUG-21, BUG-22, BUG-23, BUG-24 | attempt 10's two repairs (fold-gap channel, derived config) **verified landed**; **gap ×1 + warning ×1**: `labelMode` derivation (finding 1), `submitLabel` derivation (finding 3). Every other reported field of `ReproResult` / `RefoldResult` / `LocalizedAssets` / `FoldResidual` is expressed |
| STORY-86 (`story-24098299`) | REQ-86, REQ-88, REQ-92, REQ-94, REQ-97, REQ-104 (deferred), BUG-5, BUG-7, BUG-9, BUG-14 | attempt 10's three repairs (pairing-queue exclusion, non-wrapping row, slot exemption) **verified landed**; every reported field of `SampleFidelityReport`, `EnvelopeReport`, `ThreeProbeReport`, `L1GateResult`, `PromoteResult`, `ReferenceCoverage` and `GateReport` is expressed — **no finding against this story body** |
| **Capability body (CAP-71)** | REQ-86, REQ-94 | **gap**: the Scope list stops at the fold, the three analytic probes and demand-driven recovery; STORY-86 owns a whole further boundary (REQ-94's cross-gate reconciliation, the `1c gate` verb) that the capability body never mentions (finding 2) |

Exclusivity between the two stories remains **clean**: each defers the other's half
by name, and neither of this cycle's story-level findings crosses that line —
finding 1 and warning 3 are both fold-side derived config, which STORY-86's
Out-of-scope already defers ("the fold itself, including which residuals it emits").

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-84 (`story-8acc338d`) | story-body-edit | **The fold derives a fourth config fact from the capture — *where* the reference renders each field's label — and STORY-84's derived-config enumeration names only three.** REQ-88 (`request-7ff1bacd`, free_and_reconciled), Round-9 pass in BUNDLE-10 (`bundle-4ff83a8b`, free_and_reconciled 2026-07-29): "The a11y tree's `nameSource` is the **only** witness to the difference — a label above the box and the same words inside it are both just text near a box, so no painted axis can hold it. **Carried as `labelMode` through fold → config → render.**" Its acceptance is a fold acceptance: "all four controls derive `labelMode: 'placeholder'`". The intent frames it as a *geometry* defect, not a styling one — the reference placeholder-labels every control while the module rendered a visible label row above each field, and the measured cost was **progressive** drift (+25 / +44 / +63px down the three fields at 1280), "the signature of flow layout". Live at `forms.ts:242` (`const labelMode = el.nameSource === 'placeholder' ? 'placeholder' : 'visible'`), documented at `forms.ts:53-62` ("Ignoring it does more than mis-style: a label row the reference never had pushes every field below it down, so the whole form drifts"). STORY-84's derived-config paragraph (added last cycle) enumerates **the field list, each field's label from the accessible name, each field's type, and the endpoint** — and reads as exhaustive; `labelMode` is not in it. **Unowned matrix-wide as a derivation**: `labelMode` returns 2 hits across all 31 story bodies, both STORY-82, and both are the *config-field* side — that the field survives REQ-96 and "belongs in `config` and not in L1 because it is not an aesthetic dial". Neither says the **fold reads it off the capture's `nameSource`**, which is this capability's half. Tested but unattributed: `tests/req88-form-labelling-and-submit.test.ts:141` (`test_UAT_FC_REQ-88_a_placeholder_named_control_folds_to_placeholder_labelling`, asserting `:158` `'placeholder'` and `:178` `'visible'`) and `:256`/`:268` (`the_real_capture_derives_placeholder_labels_and_both_submit_buttons`) | Extend the derived-config paragraph's enumeration with the fourth fact: the fold also reads **where the reference labels each control** from the a11y tree's `nameSource` — a name sourced from the placeholder folds to placeholder labelling, anything else to a visible label. State why it is a fidelity fact and not a style choice: a label row the reference never had pushes every field below it down, so getting it wrong drifts the whole form progressively. Keep STORY-82's ownership of *why the parameter lives in `config` rather than L1* — state only the derivation here |
| 2 | violation | consistency | Capability body CAP-71 (`capability-2049c9ec`) | story-body-edit | **The capability's Scope list understates the capability: it stops at the three analytic probes, while its own STORY-86 owns the cross-gate reconciliation.** CAP-71's Scope enumerates exactly three things — the fold, "**The 3-probe acceptance gate** — the analytic probes over a browser-free layout evaluator … sample-fidelity …, off-sample …, and content-robustness", and demand-driven structure recovery — and its Out-of-scope disclaims only the L1 substrate and the `1c` capture/values-diff axes. REQ-94 (`request-16253634`, free_and_reconciled, 2026-07-25) added a **second, wider** acceptance boundary that STORY-86 owns in full under its own heading "The boundary is wider than geometry: cross-gate reconciliation": browser-free gates ordered first, a two-bound perceptual floor (either bound sufficient, echoed, per-run overridable), the reference-coverage report, five named verdicts with a next step, value deltas as evidence rather than exit code, and a hard error on a bundle with no retained reference manifest. It is a distinct verb and a distinct file — `cli/gate.ts` (`GateReport`, `GateVerdict`, `PerceptualFloor`, `ReferenceCoverage`, `CoverageFinding`), dispatched as `1c gate` at `cli/index.ts:665-689` — and it drives a headless browser, which the capability body's "browser-free layout evaluator" framing positively excludes. **Unowned matrix-wide at the capability level**: scanning all 26 capability bodies for `cross-gate` / `perceptual floor` / `reference coverage` / `reconcil` returns no hit that claims this boundary (`.xgd/tmp/dumpcaps.py`). And it is not a deliberate hand-off: CAP-63's own "Ownership rule: CLI mechanism here, verb meaning with the verb's capability" lists "`repro`, `l1-gate`, `refold` are CAP-71's" and says "what `l1-gate` decides is CAP-71's" — the `gate` verb is named by no capability at all. So a reader of CAP-71 cannot discover that this capability decides the cross-gate verdict, even though its story does | In the capability body, add a fourth Scope bullet for the **cross-gate acceptance verdict** — the reconciliation over the three eyes that grade a reproduction (the browser-free geometry gate and reference coverage first, then the perceptual and value eyes through their offline seams), its perceptual floor, its named causes and next steps, and its refusal of a bundle with no retained reference manifest — and adjust the opening line so "the acceptance boundary" is not read as the three probes alone. Keep the perceptual and value eyes' own measurement contracts out of scope, exactly as STORY-86 already does |
| 3 | warning | coverage | STORY-84 (`story-8acc338d`) | story-body-edit | **The fold carries the captured submit button's *words* into the derived config, and STORY-84 expresses only its geometry.** `fold.ts:2279` — `form.submitLabel = chip.text` — set when a claimed button is lifted into the form's `submit` slot, declared at `forms.ts:92-96` as "The words on the captured submit button. **Behavioural copy (it names the action), not styling** — the button's look lives on its `control` node", and carried into the reproduced site's module config at `repro.ts:162`, where the module's own default would otherwise win (`contact-form/index.astro:56`, `meta.ts:56`: default `'Send'`). REQ-88's Round-9 pass is the ask — the defect it fixed was "the reference's chip stayed a page-level run *beside* a form that rendered its own default `Send` button". STORY-84 states the *geometric* half of that fix twice (the seam "widened to hold a claimed submit button"; "A submit button is matched to its form geometrically") but never that its wording is carried. **Unowned matrix-wide**: `submitLabel` returns zero hits across the 31 story bodies; STORY-85 mentions "submit wording" only as something a behavior module's `config` may hold, which is the declaration side, not the derivation. Tested but unattributed: `tests/req88-form-labelling-and-submit.test.ts:217` (`expect(forms[0].submitLabel).toBe('Send message')`) and `:273`. Classified **warning** rather than violation: unlike finding 1 it makes no stated rule false, and it is one string rather than a per-field rule with a measured fidelity cost | Add a clause to the derived-config paragraph: the claimed submit button's own words are carried through as the form's submit copy, so the reproduction keeps the reference's verb instead of the module's default. Frame it as behavioural copy — the button's *look* is already owned by its `control` leaf, which the story states |

## Notes for the Editor

**Both story-level findings land in one paragraph.** Finding 1 and warning 3 are
both extensions of STORY-84's derived-config paragraph (the one added last cycle,
beginning "The fold derives each seam's **behavioural config from the capture
alone**"). They can be applied as one edit plus the matching In-scope clause. That
paragraph is now the single place the fold's capture→config derivation is
enumerated, so it is worth making the enumeration explicitly complete —
`fields[].name`, `.label`, `.type`, `.labelMode`, `action`, `submitLabel` — rather
than a sample.

**Finding 2 is the first capability-body finding in six cycles, and it is not a
story-body edit despite the category.** The resolution vocabulary has no
`capability-body-edit`; `story-body-edit` is the nearest shape (a body mutation on
a matrix element). The element to edit is `capability-2049c9ec`, not either story.
STORY-86's own body already contains the material to lift — its "The boundary is
wider than geometry" section and its In-scope clause — so this is a summarization,
not new authorship, and it should not introduce any claim STORY-86 does not already
make.

**STORY-86's title is now narrower than STORY-86.** "End-to-end 3-probe
reproduction acceptance gate" describes the story as it stood before REQ-94. The
body has since grown a boundary that is explicitly *not* one of the three probes.
Not filed as a finding — a title is not a behavioural claim and no intent is lost
by it — but an editor already touching the capability body for finding 2 may want
to widen the title in the same pass, since the same drift produced both.

**The return-field sweep is now spent, and it came back nearly clean.** ~45 reported
fields across 11 public types, 2 unexpressed. A future cycle should not re-run it as
its primary sweep; the two angles that have never been run are (a) the **module-side
consumers** of what this capability emits — what `contact-form`'s `meta.ts` schema
accepts versus what the fold actually populates, which would catch a derived field
that exists on neither side of the seam's contract — and (b) the **archived
capability CAP-73**, whose body may still carry scope statements that were reassigned
here in the 2026-08-05 consolidation but never merged into CAP-71's Scope list. Note
that finding 2 is circumstantial evidence for (b).

**Read the source files as bytes.** `tools/generate/src/cli/builder.ts` and
`fidelity.ts` contain NUL bytes and are treated as binary by `grep -r`, so a plain
recursive grep silently under-reports across this tree. The scripts left in
`.xgd/tmp/` (`dumpstories.py`, `dumpintents.py`, `dumpcaps.py`, `termscan.py`,
`intentscan.py`, `section.py`, `headings.py`, `statuses.py`) all go through the
ticket API or read as bytes.

**Downstream work implied (do NOT action at this level).** Both STORY-84 findings
are `ac-add` at the next level, and each already has passing `FC`-named evidence
that needs re-attribution rather than authoring:

| Behaviour | Downstream | Candidate evidence |
|---|---|---|
| `labelMode` derived from the a11y `nameSource` | `ac-add` | `tests/req88-form-labelling-and-submit.test.ts:141` (`:158`, `:178`), `:256` (`:268`) |
| Captured submit wording carried as the form's submit copy | `ac-add` | `tests/req88-form-labelling-and-submit.test.ts:212` (`:217`), `:256` (`:273`) |

Finding 2 has no downstream AC — a capability body carries no criteria.

**Matrix-hygiene item, unchanged and still not addressable at level=story (seventh
cycle).** Both stories carry a single scalar `updated_by` and all 34 ACs carry
`intent_uid: None`, so this capability's intent ledger must be rebuilt from the
corpus on every cycle — 102 intent tickets fetched this cycle to attribute two
fields. It needs a field-level fix (per-AC `intent_uid` backfill, `updated_by` as a
list) that the story level cannot reach.
