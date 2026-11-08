---
uid: report-c98ee17c
id: REPORT-1304
type: report
title: 'Capability-Intent Alignment: size_aware_diffing (level=ac)'
created_by: xgd
created_at: '2026-08-05T19:45:15.309908+00:00'
updated_at: '2026-08-05T19:45:15.309908+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-18a822ac
  level: ac
  violations: 0
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: size_aware_diffing
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 2
**Needs review**: 0

## Structural note (read first)

`capability-18a822ac` (CAP-65) was **absorbed on 2026-08-05** by the structural
rebalance into `capability-aa030c83` (CAP-63, "1c Capture & Diff Fidelity").
Ground truth on both former member stories confirms the reassignment landed:

| Story | `fields.capability_uid` (from `ticket get`) |
|---|---|
| STORY-77 (`story-16f2793c`) | `capability-aa030c83` |
| STORY-78 (`story-2c7069fe`) | `capability-aa030c83` |

**CAP-65 therefore owns zero stories and zero ACs — the ac-level matrix for this
capability is empty and vacuously aligned.**

However, `xgd ticket list --filter fields.capability_uid=capability-18a822ac`
still returns both stories: the index retains a stale entry under the old
capability while also (correctly) listing them under `capability-aa030c83`. This
is the same index defect the capability body already records as blocking
`status: deprecated`. Because the check was scoped here by that stale index, this
report assesses the two stories' AC trees on their merits rather than returning a
vacuous pass — the findings are valid regardless of which capability header the
stories hang under, and the downstream CAP-63 check will see the same trees.

## Cumulative Intent Considered

REQ-58/59/61/62 no longer resolve as standalone tickets — bundling consumed them.
The single live intent ticket touching this tree is BUNDLE-6.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 (`bundle-ab9e0cb6`) — REQ-58 + REQ-59 + REQ-62 + REQ-61 | free_and_reconciled (merged at `7a42e182`) | 2026-07 | REQ-61: `--size` selector on both diff commands; standalone `responsive-diff` N-way cross-size table + change classifier; per-breakpoint override generalization and configurable nav collapse (reproduction side). REQ-58 supplied the multi-viewport ladder this reads. | YES |

No other intent UID appears on the capability, its stories, or any of their 17 ACs
(no `updated_by` chains present). Both stories carry `intent_uid: bundle-ab9e0cb6`.

Per the level cascade, story bodies are the working reference at ac level; intent
was consulted only to confirm the vocabulary divergence and scope boundary noted
below.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-77 `story-16f2793c` — 8 ACs (AC-639, 640, 641, 642, 643, 644, 645, 647) | BUNDLE-6 / REQ-61 | aligned — every in-scope item of the story body has exactly one AC; no orphan ACs |
| AC-639 values-diff `--size` compares at selected width | REQ-61 §"Size parameter" | aligned (story in-scope item 1) |
| AC-640 omitting `--size` preserves single-width path | REQ-61 "default desktop (preserves current behavior)" | aligned (story items 1+2 trailing clause) |
| AC-641 values-diff `--size`, no persisted ladder → fail loud | REQ-61 | aligned (story item 3, case a) |
| AC-642 values-diff `--size`, width not in ladder → fail loud, names widths | REQ-61 | aligned (story item 3, case b) |
| AC-643 pixel diff `--size` pairs same-width reference | REQ-61 | aligned (story item 2) |
| AC-644 pixel diff `--size`, no same-width shot → fail loud | REQ-61 | aligned (story item 3, case c) |
| AC-645 unrecognized `--size` rejected, names vocabulary | REQ-61 | aligned — closed-vocabulary guard implied by the `mobile\|tablet\|desktop` selector the story defines |
| AC-647 capture persists per-width reference screenshots, matrix free of image bytes | REQ-61 + REQ-58 ladder | aligned (story item 4, including the "image siblings only" clause) |
| STORY-78 `story-2c7069fe` — 9 ACs (AC-648…655, AC-721) | BUNDLE-6 / REQ-61 | aligned — every in-scope bullet of the story body has AC cover; no orphan ACs |
| AC-648 N-way table, default mobile/tablet/desktop columns | REQ-61 Phase 1 | aligned |
| AC-649 `--sizes` selects and orders columns (+ invalid name error) | REQ-61 "N configurable, default 3" | aligned |
| AC-650 changed vs steady partition + presence-flip flag, sub-pixel tolerance | REQ-61 Phase 1/2 | aligned (story bullet 3 + "geometry rounded so sub-pixel jitter never reads as a change") |
| AC-651 repeated identical text aligned occurrence-by-occurrence | REQ-61 shared-DOM pairing | aligned (story bullet 2) |
| AC-652 `--classify` labels presence-flip / layout-swap / value-step, structural first | REQ-61 Phase 2 (all three kinds present) | aligned |
| AC-653 terminal-fail on stale reference (no ladder) | REQ-61 | aligned (story bullet 6, case a) |
| AC-654 terminal-fail on un-captured width, lists available widths | REQ-61 | aligned (story bullet 6, case b) |
| AC-655 `--json` machine-readable; `--ref` required | REQ-61 + story divergence note | aligned — encodes the documented `--ref` divergence from the plan's positional slug |
| AC-721 `--out <file>` persists raw table independent of `--classify`/`--json` | REQ-61 Phase 1 artifact | aligned (story bullet 5) |

**Consistency**: all 17 ACs follow from their story bodies; no AC describes
behavior the story does not claim. **Coverage**: no behavior in either story body
lacks an AC. **Exclusivity**: no duplicate pairs. The nearest-neighbour pairs were
checked and are genuinely distinct — AC-641/642/644 are three different missing-data
failure modes (no ladder / width absent / no same-width screenshot); AC-645
(invalid vocabulary) is distinct from all three; AC-650 (flagging presence flips in
default output) is distinct from AC-652 (labelling them under `--classify`, which
suppresses steady nodes and imposes group ordering).

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | STORY-78 (`story-2c7069fe`) | story-body-edit | Technical Context states "Belongs to CAP-65 (1c Size-Aware Diffing), whose body already reserves this downstream `responsive-diff` command". The 2026-08-05 rebalance moved the story to CAP-63 (`capability-aa030c83`) and CAP-65's own body now declares itself absorbed and story-less, so it reserves nothing. | Repoint the sentence at CAP-63 "1c Capture & Diff Fidelity", whose Scope section carries the size-aware/cross-size bullet; keep the REQ-61 + commit lineage (b92a5cbe, cb388975) intact | 
| 2 | warning | consistency | STORY-77 (`story-16f2793c`) | story-body-edit | Technical Context states "Generalizes CAP-63 (1c Values-Diff Fidelity), which compares at a single fixed width". CAP-63 was renamed to "1c Capture & Diff Fidelity" by the same rebalance and now *contains* STORY-77, so the story reads as generalizing its own parent under a name that no longer exists. | Rephrase to reference the single-width values-diff *axis* within CAP-63 (e.g. "generalizes the single-fixed-width values-diff comparison — now the intrinsic-axes scope bullet of CAP-63 — to a caller-chosen width") | 
| 3 | info | — | capability-18a822ac | — | Capability is `status: active` with `merged_into: capability-aa030c83` and zero owned stories; the stale index entry is what routed this ac-level check here. Already documented in the capability body and the rebalance report as a blocked deprecation. | none — XGD index defect, not matrix drift; tracked by the rebalance report | 
| 4 | info | — | STORY-77 / AC-645 | — | REQ-61 specifies the vocabulary as `desktop\|tablet\|phone`; the matrix uses `mobile\|tablet\|desktop`. This is a deliberate, documented reconciliation to the implemented shot/viewport preset vocabulary (STORY-77 Technical Context), and AC-645's verification even uses `--size phone` as the *rejected* value. Not drift. | none | 
| 5 | info | coverage | REQ-61 reproduction-side asks | — | REQ-61's scope also includes generalizing per-breakpoint overrides from positions to dial/length values and making nav/header collapse a configurable treatment. STORY-78 explicitly places these out of scope ("authoring the per-breakpoint overrides themselves — that is the framework's per-breakpoint dial capability"). Cover for these belongs to the framework capability, not here. | none at ac level — confirm the framework capability carries them when it is validated | 

## Notes for the Editor

- **Both warnings are one edit pattern, not two problems.** The 2026-08-05
  structural rebalance repointed `fields.capability_uid` on the member stories but
  did not sweep the prose cross-references in their Technical Context sections.
  Any other story absorbed in the same rebalance (CAP-64 and CAP-66 members —
  STORY-76, STORY-79, STORY-75 all now sit under `capability-aa030c83`) is worth
  checking for the same stale `CAP-NN (old name)` parenthetical before the CAP-63
  ac-level check runs.
- Neither warning affects ac-level pass/fail: they are story-body prose, the
  cascade treats story bodies as the working reference, and no AC inherits the
  stale reference.
- **AC-646 does not exist** (not live, not archived) — STORY-77's ACs run
  639-645, 647. Verified this is an ID-sequence gap, not a deleted criterion: the
  story's behavioral surface is fully covered by the 8 ACs present.
- If the index defect is repaired and this capability is finally set to
  `deprecated`, this check should stop being scheduled for CAP-65 at all; the
  substantive assessment above transfers verbatim to `capability-aa030c83`.
