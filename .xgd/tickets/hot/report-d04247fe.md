---
uid: report-d04247fe
id: REPORT-2426
type: report
title: 'Fix L1 Reproduction Pipeline: Fold & Acceptance Gate (story) — attempt 10'
created_by: xgd
created_at: '2026-08-20T11:51:24.694258+00:00'
updated_at: '2026-08-20T11:51:24.694258+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-2049c9ec
  level: story
  fixes_applied: 9
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-2485c83c
---

# Fix Summary — L1 Reproduction Pipeline: Fold & Acceptance Gate (story)

**Attempt**: 10
**Fixes applied this call**: 9 body mutations across 2 stories (all 5 findings)
**Violations remaining**: 0
**Needs more work**: false

All five findings of `report-31eea910` were categorized `story-body-edit` and
none needed an ownership decision, so all five were applied in this call. Each
was verified against the cited source before editing (see Evidence below) —
none was taken on the assessor's summary alone.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | story-body-edit | STORY-84 (`story-8acc338d`) | **Finding 1** — materialization paragraph now states the second asset channel beside the hard failure: a mirrored `image`/`font` asset the folded document references nowhere is surfaced as a **fold gap** (bundle has the bytes, fold emitted no leaf / `@font-face`), not silently dropped, because it names missing folder power rather than a broken reproduction. Explicitly separated from the gate's reference-coverage media proxy (same question, asked of the *reference manifest* on the gate verb) so the two are not read as one number |
| 2 | story-body-edit | STORY-84 | **Finding 1** — **In scope** asset-localization clause extended: "…hard failure on an unmirrored handle **and a reported fold gap on a mirrored asset no node references**, idempotent rebuild" |
| 3 | story-body-edit | STORY-84 | **Finding 1** — Technical Context BUG-23 bullet now records that the bug had two halves and both live here, and why the converse is reported rather than a no-op |
| 4 | story-body-edit | STORY-84 | **Finding 2** — new paragraph after the behaviour-seams paragraph: the fold derives each seam's **behavioural config from the capture alone** (field list + label from the a11y accessible name; type from the captured input type, falling back to height; endpoint from the captured form action), **invents nothing**, and records a **derivation gap** with an honest default where the capture carries no fact or an unsafe endpoint. States the channel is deliberately distinct from the typed element residual, since the form *was* mounted |
| 5 | story-body-edit | STORY-84 | **Finding 2** — **In scope** behaviour-seams clause extended with "their capture-derived behavioural config with its distinct derivation-gap channel"; Technical Context gains a bullet on why each fallback carries a gap rather than a guess (a fabricated endpoint is the one derivation that would silently send real leads somewhere) |
| 6 | story-body-edit | STORY-86 (`story-24098299`) | **Finding 3** — sample-fidelity paragraph now qualifies the non-text pairing rule: the queue is built from the **captured** non-text leaves only, and a fold-synthesized backing surface never enters it (source elements classify as text, already measured through their own text leaves → no oracle counterpart; leaving it in shifts every real box leaf and reports phantom deltas). Named as the measure's only **reproduced-side** exclusion, against the oracle-side classifier exclusion. The `mounted` sentence's own enumeration was updated from "different mechanism from the classifier exclusion" (two) to "third mechanism, distinct from both exclusions above" (three), so the story stays internally consistent |
| 7 | story-body-edit | STORY-86 | **Findings 3 + 5** — the backing-surface exemption sentence was rewritten to name **both** exempt kinds: the backing surface *and* the **slot** (an inert seam whose mounted module paints inside it, so it overlaps its own control leaves by construction — without the exemption every reproduced form fails both envelope probes). Cross-links the backing surface to the fidelity-queue exclusion of finding 3. Both remain subject to the horizontal-clip check, as before. **In scope** updated to "their two exempt leaf kinds (the backing surface and the slot)" and to name the non-text queue exclusion with the pairing contract |
| 8 | story-body-edit | STORY-86 | **Finding 4** — the flow-direction bullet's row-height rule is now conditional: "a row that does **not** wrap takes its height from its tallest child", with one clause deferring the wrapping row and the per-width layout mode to the shared cascade owned by CAP-70 (the same shape the story already uses for the responsive scalar track). **No duplication of STORY-81**: the axis and the cascade are deferred, not restated |
| 9 | story-body-edit | STORY-86 | **Finding 4** — **In scope** narrowed to "non-wrapping row tiling"; **Out of scope** extended to defer "the wrapping-row axis and the per-width layout-mode cascade this evaluator resolves through (CAP-70)". Technical Context gains a bullet recording that the synthesized-surface exclusion is a consequence of BUG-14's surface reconstruction and is keyed on the synthesized identity, so a genuine captured `box-*` still pairs and still collides |

## Evidence — each finding verified at source before editing

| Finding | Verified at |
|---|---|
| 1 | `l1/assets.ts:35-41` (`LocalizedAssets.unreferenced` + its "A fold gap to report, not a silent no-op" doc), computed `:108-112`; `cli/repro.ts:53-58` (`unreferencedAssets`, "a **fold gap** to close, surfaced rather than ignored") |
| 2 | `l1/forms.ts:208-219` (`foldedFormFor`'s contract: a11y name → label, captured input type else height → type, captured form action → action, "never a fabricated endpoint") and `:221-255` (each gap pushed: no accessible name, no recorded input type, unsafe action dropped, no action captured); `forms.ts:97-105` and `repro.ts:261-268` on the channel being deliberately distinct from `FoldResidual` |
| 3 | `l1/probes.ts:670-685` — `if (isSynthesizedSurfaceId(l.id)) continue` when building `nonTextQueues`, under the comment naming the shift-and-phantom-delta failure |
| 4 | `l1/probes.ts:355` (`wrapping` gate), `:370-392` — `cursorY += lineHeight + gap` per line, and the comment "with `wrap` … the row's height is the sum of its lines" |
| 5 | `l1/probes.ts:460-474` — `solid` filters `l.kind !== 'slot' && !(l.kind === 'box' && isSynthesizedSurfaceId(l.id))`, comment "Slots are inert placeholders (Phase-D seams)" |

## Code Edits

None this call. All five findings were matrix-side (`story-body-edit`); the
implementation is correct and already carries passing evidence for every
behaviour added to the bodies.

## Verification

Both bodies were written through `xgd ticket update --body-file` and re-read
back through `xgd ticket get --json`; all nine edit anchors round-trip in the
stored bodies (STORY-84 24419 → 26969 chars, STORY-86 17764 → 20134 chars).
No AC or test was mutated this call, so no test run was implicated.

## needs_review Items Forwarded

None. All five findings were `story-body-edit` with settled ownership.

## Notes for the Assessor

**The "second channel" defect shape is now closed on all three surfaces the
prior report named.** Findings 1, 2 and 3 (and last cycle's `mounted`) were each
a second channel on an already-expressed mechanism. As of this call: the asset
rewrite's fold-gap channel, the seam recovery's derivation-gap channel, and the
fidelity probe's reproduced-side exclusion are all expressed alongside their
primary channel, each with the distinction the implementation is careful about
stated in the body rather than left to be inferred.

**The prior report's suggested sweep was not run this call and is still open.**
`report-31eea910`'s "Notes for the Editor" recommends enumerating every reported
field on this capability's public return types (`ReproResult`, `LocalizedAssets`,
`FoldedForm`, `SampleFidelityReport`, `L1GateResult`, `GateReport`,
`ReferenceCoverage`, `PromoteResult`) as a completeness proxy. Two of those
(`LocalizedAssets.unreferenced`, `FoldedForm.residuals`) are exactly what this
cycle closed, which is corroboration for the proxy. A future assessor cycle
running that enumeration would be the highest-yield check on whether any
reported field remains unexpressed.

**Downstream `ac-add` work is queued, not done — correctly, at level=story.**
The report names three `ac-add` items at the next level, each with existing
passing `FC`-named evidence that needs re-attribution rather than authoring:
`tests/bug23-repro-local-assets.test.ts:149`,
`tests/req93-l1-slot-mounted-behaviors.test.ts:392` + `:424-451`, and
`tests/bug14-fold-surface-hierarchy.test.ts:207` + `:179`. Not actioned here per
the level-priority constraint.

**Matrix-hygiene item still unaddressable at level=story (sixth cycle).** Both
stories carry a single scalar `updated_by` and all 34 ACs carry
`intent_uid: None`, so the intent ledger must be rebuilt from the corpus every
cycle. Needs a field-level fix (per-AC `intent_uid` backfill; `updated_by` as a
list) outside this level's reach.
