---
uid: report-4c0d7532
id: REPORT-1319
type: report
title: 'Capability-Intent Alignment: l1_reproduction_pipeline (level=ac)'
created_by: xgd
created_at: '2026-08-05T21:23:33.375719+00:00'
updated_at: '2026-08-05T21:23:33.375719+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-2049c9ec
  level: ac
  violations: 1
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: l1_reproduction_pipeline
# Level: ac

**Result**: FAIL
**Violations**: 1
**Warnings**: 2
**Needs review**: 0

Capability CAP-71 (`capability-2049c9ec`), stories STORY-84 (`story-8acc338d`,
fold — 13 ACs) and STORY-86 (`story-24098299`, 3-probe gate — 11 ACs). Both
`story_kind: upgrade`, so both are matrix stories expected to carry ACs.

**Level-cascade note.** The story-level cycle ran immediately before this one and
FAILED (REPORT-1318, `report-0cb0a92d`, 8 violations + 1 needs_review), and the
story bodies have not been edited since (STORY-86 `updated_at` 17:24Z, STORY-84
2026-07-29; the report was written 21:16Z). Per the cascade rule this check still
takes the story bodies as its working reference, and it does **not** re-derive
REPORT-1318's story-level gaps as AC findings — that would double-count an open
story-level repair and drive an AC tree that describes behaviour absent from this
branch. Those gaps are carried below as info entries 4 and 5 so the cascade is
recorded rather than lost.

## Cumulative Intent Considered

Reconstructed for this level from the two bundles the stories name and the
per-AC creation dates. Full derivation (and the CAP-63 / CAP-70 exclusions) is in
REPORT-1318 and is not restated; the column that matters here is which intent
each AC cohort was authored for.

| Intent ID | Status | When | Asked / changed | Counts? | AC cohort |
|---|---|---|---|---|---|
| REQ-79 (BUNDLE-7) | free_and_reconciled | 2026-07-20 | Absolute-base D1 reproduction model | YES | AC-689, AC-691 |
| REQ-83 (BUNDLE-7) | free_and_reconciled | 2026-07-20 | capture→L1 fold + retained oracle + hint sidecar | YES | AC-689–696 (2026-07-22) |
| REQ-86 (BUNDLE-7) | free_and_reconciled | 2026-07-20 | End-to-end 3-probe gate | YES | AC-705–710 (2026-07-22) |
| BUG-5 (BUNDLE-8) | free_and_reconciled | 2026-07-23 | Occurrence-identity pairing + idempotence identity | YES | AC-724 (2026-07-27), AC-705 rev |
| BUG-6 (BUNDLE-8) | free_and_reconciled | 2026-07-23 | Typed residual instead of silent drop | YES | AC-733 |
| BUG-7 (BUNDLE-8) | free_and_reconciled | 2026-07-23 | Evaluator row-tiling vs stack flow | YES | AC-734 (2026-07-29) |
| BUG-8 (BUNDLE-8) | free_and_reconciled | 2026-07-23 | Half-open breakpoint intervals | YES | AC-735 (2026-07-29) |
| BUG-9 (BUNDLE-8) | free_and_reconciled | 2026-07-23 | Region-aware recursive promotion | YES | AC-709 rev |
| BUG-11 (BUNDLE-8) | free_and_reconciled | 2026-07-23 | Fold recovers composited surface fill/gradient | YES | AC-731, AC-736 (2026-07-29) |
| REQ-90 (BUNDLE-8) | free_and_reconciled | 2026-07-23 | Font resource table populated from painted families | YES | AC-732 |
| REQ-92 (BUNDLE-8) | free_and_reconciled | 2026-07-23 | Rebuild `foldToL1` to the full L1 language + residuals | YES | AC-729–733, AC-737 (2026-07-29) |
| REQ-88 (BUNDLE-10) | free_and_reconciled | 2026-07-21 | `1c repro` / `1c l1-gate` pipeline surface (live on this branch) | YES | **no AC — no story claims it** (info 5) |
| BUG-13/14/17/18/19/20/23 (BUNDLE-10) | free_and_reconciled | 2026-07-23/24 | Band→card→text hierarchy, padding, responsive flat axes, chip self-surface, asset localization | YES | **no AC; code absent from this branch** (info 4) |
| REQ-94 (BUNDLE-11) | bundled | 2026-07-25 | Cross-gate calibration | imminent | none yet — correct today |

Branch state re-verified independently for this report: `git grep` for
`foldPadding`, `responsiveTextTracks`, `foldSectionBackgrounds`, `buildCards`,
`buildSolidBands`, `nowrapFromPx`, `viewportResponse`, `partitionProbes`,
`evalScalarTrack` returns nothing under `tools/` or `packages/`, while `cmdRepro`
/ `cmdL1Gate` are present in `tools/generate/src/cli/repro.ts` and
`cli/index.ts`. BUNDLE-10's implementation has not reached this branch;
REQ-88's pipeline commands have.

## Alignment Ledger

### STORY-84 (fold) — 13 ACs

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-689 full-language validated document | REQ-83, REQ-92 | aligned — covers the body's "full language, not text alone", ladder-equality, explicit fold failure |
| AC-690 oracle retention | REQ-83 | aligned |
| AC-691 geometry keyframes | REQ-79, REQ-92 | aligned — carries the box/image height-pinning vs text natural-height split from Technical Context |
| AC-692 interpolate/snap | REQ-83 | aligned |
| AC-693 visibility rule | REQ-83 | aligned |
| AC-694 hint sidecar | REQ-83 | aligned — all six hint dimensions in the body are enumerated |
| AC-695 document complete without hints | REQ-83 | aligned — the advisory-not-executed invariant |
| AC-696 `adopt-values` removed (`regression_only`) | REQ-83 | aligned — also preserves the `adopt-gaps` carve-out |
| AC-729 image leaf | REQ-92 | aligned |
| AC-730 box leaf | REQ-92 | aligned |
| AC-731 reconstructed run surfaces | BUG-11 | aligned to its story body and to this branch's `fold.ts` (see info 4) |
| AC-732 pixel-movers + font table | REQ-90, REQ-92 | aligned — also carries the transform/mask non-folding rule |
| AC-733 typed residuals + form-control routing | BUG-6, REQ-92 | aligned — includes the opt-in-channel rule |

Coverage of STORY-84's In-scope list is complete: full language (AC-689/729/730/
731/732), oracle retention (AC-690), keyframes + interpolate/snap + visibility
(AC-691/692/693), typed residual signal (AC-733), hint sidecar (AC-694/695),
`adopt-values` supersession (AC-696). No AC describes behaviour the story body
does not support. Exclusivity is clean — the three leaf-kind ACs (729/730/731)
partition on the classifier's own boundaries (media / standalone-surface /
run-composited), not on the same criterion.

### STORY-86 (3-probe gate) — 11 ACs

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-705 sample-fidelity + occurrence pairing | REQ-86, BUG-5 | aligned — text and non-text (kind-keyed) pairing both stated |
| AC-706 off-sample | REQ-86, BUG-9 | aligned |
| AC-707 content-robustness | REQ-86, BUG-9 | aligned |
| AC-708 combined gate, non-vacuous | REQ-86 | aligned — base/overlay split matches the body |
| AC-709 region-aware recursive recovery | BUG-9 | aligned — regions, nothing-left-pinned, demanded-not-default, promoted paths, validity, fidelity-on-base |
| AC-710 diagnostic findings | REQ-86 | **drift** — fidelity-residual clause is text-only, stale vs the body's non-text extension (finding 2); its fidelity half restates AC-705 (finding 3) |
| AC-724 idempotence identity | BUG-5 | aligned — distinct from AC-705 in shape (see info 3) |
| AC-734 row tiling / stack / conservative grid | BUG-7 | aligned |
| AC-735 half-open breakpoint intervals | BUG-8 | aligned |
| AC-736 backing-surface overlap exception | BUG-11 | aligned; adds an inert-slot clause the story body does not state (info 6) |
| AC-737 fold-residual channel | REQ-92, REQ-86 | aligned |
| — envelope violation: pinned-box content overflow | REQ-86 | **gap — no AC** (finding 1) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-86 AC tree | ac-add | STORY-86's body names **three** envelope violations the evaluator reports — "sibling overlap, horizontal clip beyond the viewport, **and pinned-box content overflow**" — and puts "its envelope findings" In scope. The third is live on this branch: `tools/generate/src/l1/probes.ts:296-307` raises a `clip` finding with detail `content height Npx exceeds pinned box height Mpx` when a pinned box/container's flow-interior content exceeds its pinned keyframe height (the ctx field is documented as such at `probes.ts:199`, and `evaluateLayout`'s own docstring at `probes.ts:320-324` names all three). **No AC under STORY-86 addresses it.** Every AC that enumerates envelope violations names only overlap and viewport-edge clip: AC-706 ("no two leaf boxes overlap and no leaf clips beyond the viewport"), AC-707 ("no sibling overlap and no clip", whose only stated trigger bullet is an overlap), AC-734, AC-736 ("right edge extends beyond the viewport"). AC-710 fixes the vocabulary at "kind (overlap or clip)" without giving this trigger, and its UAT exercises only the viewport-edge clip (`tests/reconciliation-3probe-gate.test.ts:661-667`, via `narrowOracle()`). An implementer working from the AC tree alone would ship only the viewport clip. Note this violation is confined to the branch's own BUNDLE-8-era surface — it is independent of the BUNDLE-10 block and is repairable here | Author an AC under STORY-86: a pinned box/container whose flow-interior content height exceeds its pinned keyframe height is reported as a `clip` finding naming the overflow magnitude and the offending path, at every width where it occurs and under content perturbation. Alternatively extend AC-707 with the trigger bullet and AC-710 with the corresponding diagnostic obligation — but a single AC is cleaner given AC-706 needs the same rule off-sample |
| 2 | warning | consistency | AC-710 (`acceptance_criterion-beb4d907`) | ac-edit | AC-710 describes the fidelity residual in text-only terms — "carries the run text, the width, and the per-axis deltas … plus a coverage entry (text, width) for any oracle sample with no reproduced run". STORY-86's body and AC-705 (revised 2026-07-29) extended fidelity to image and box leaves, which carry no text and are "labelled by kind". AC-710 was last updated 2026-07-24 and never followed. A non-text residual satisfies AC-705 and fails AC-710's literal wording | Reword AC-710's fidelity clause to "the leaf's text (or kind label)" and the coverage entry to "(text or kind label, width)", matching AC-705 |
| 3 | warning | exclusivity | AC-705 + AC-710 | ac-edit | AC-710's fidelity half duplicates AC-705's "Report shape" clause — the same residual (text, width, dx/dy/dw) and the same unmatched coverage entry are specified twice, and finding 2 shows the copies have already diverged. AC-710's non-duplicated content is the **envelope-finding** diagnostic contract (kind, magnitude-bearing detail, leaf index paths), which no other AC states | Narrow AC-710 to the envelope-finding diagnostic contract and delegate the fidelity residual shape to AC-705, leaving one authority per report shape |
| 4 | info | coverage | AC-689, AC-729, AC-731, AC-732 | — | These ACs describe the BUNDLE-8-era fold (single document background band + per-run backing boxes, text-free media as the only image leaf, no padding/responsive-flat-axis carriage), which BUNDLE-10's BUG-13/14/17/18/20 supersede. They are aligned to their story bodies **and** to this branch's `fold.ts` (per-run model at `fold.ts:683`), so there is no ac-level drift here. When REPORT-1318 findings 2–8 are resolved at story level, this cohort needs matching `ac-edit`/`ac-add` work — AC-731 rewritten to band→card→text, plus new ACs for section-background boxes, padding carriage, responsive flat-axis tracks, and the chip self-surface | none at this level; re-run the ac check after the story-level repair lands |
| 5 | info | coverage | STORY-84 + STORY-86 AC trees | — | REQ-88's operator surface (`cmdRepro` at `tools/generate/src/cli/repro.ts:66`, `cmdL1Gate` at `repro.ts:132`, dispatched `cli/index.ts:354`) is live on this branch and has no AC — because no story claims it (REPORT-1318 finding 1). At ac level the story body is the working reference, so this is not an ac-level gap; it becomes two `ac-add`s the moment the story bodies are corrected | none at this level; cascades from REPORT-1318 finding 1 |
| 6 | info | consistency | AC-736 (`acceptance_criterion-76d9ee68`) | — | AC-736 states "Inert placeholder slots are likewise excluded from the overlap check", which STORY-86's body does not mention (it states only the painted-backing-surface exception). The clause is true of the code (`probes.ts:360`, `l.kind !== 'slot'`) and additive rather than contradictory, so it is not drift — but the story body should pick it up whenever it is next edited | none |

## Notes for the Editor

**Finding 1 is the only thing standing between this level and a pass, and it is
safely fixable on this branch.** It predates the BUNDLE-10 split entirely: the
overflow check has been in `probes.ts` since the REQ-86 gate landed, and the
story body has always named it. Nothing about the fix depends on BUNDLE-10
reconciling.

**Do not repair findings 4 and 5 by authoring ACs here.** Both cascade from
REPORT-1318's open story-level violations, whose own needs_review (finding 9
there) escalates to the operator: BUNDLE-10 reads `free_and_reconciled` while
neither its code nor its already-authored story bodies (on
`reconcile-BUNDLE-10`, 2026-08-02) are on this branch. Writing ACs for behaviour
this branch's `fold.ts` does not implement would invert the drift and guarantee
UAT-level failures downstream.

**Findings 2 and 3 are one edit.** Both land on AC-710. Fixing 3 (narrow it to
envelope findings) dissolves 2, since the stale text-only wording lives entirely
in the clause that would be removed. If instead AC-710 keeps its fidelity clause,
both must be fixed separately and will diverge again.

**AC-705 and AC-724 were examined for exclusivity and are not duplicates.** Their
fixtures are near-identical (a label repeated three times at distinct y across the
ladder), but the assertions are orthogonal: AC-724 asserts a property of the
*value-render* — double evaluation is identity, N oracle occurrences yield N
uncollapsed runs (`tests/reconciliation-3probe-gate.test.ts:671-699`) — while
AC-705 asserts the *probe's* pairing rule and report shape (residual vs unmatched
attribution). STORY-86's body frames AC-724 as the falsifiability precondition
for AC-705's verdict, so the pair is intentional and should not be merged.
