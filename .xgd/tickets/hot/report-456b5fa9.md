---
uid: report-456b5fa9
id: REPORT-791
type: report
title: 'Capability-Intent Alignment: Capture-to-L1 Reproduction Fold (level=ac)'
created_by: xgd
created_at: '2026-07-23T07:06:55.262276+00:00'
updated_at: '2026-07-23T07:06:55.262276+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-2049c9ec
  level: ac
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Capture-to-L1 Reproduction Fold
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

## Cumulative Intent Considered

At `ac` level the story body (STORY-84) is the working reference; the story-level
cycle (REPORT-790, `report-75aece48`, PASS) already reconciled STORY-84 against
intent. Ledger carried forward from that anchor:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (bundle-31e474b9) | free_and_reconciled | merged edeb1c2c | Framework-pivot B2 capture→L1 fold: one absolute-base L1 doc (keyframes / interpolate-snap / visibility), oracle retention, advisory hint sidecar, supersede `adopt-values` | YES |
| REQ-83 (originating) | reconciled | — | The behaviour spec BUNDLE-7 carries | YES |
| REQ-66 (adopt-values) | retired | — | Pre-L1 reproduction command; superseded | YES (retired) |
| REQ-74 (adopt-gaps) | active | — | Independent feature; left untouched | context |

No AC carries its own `intent_uid`/`updated_by` override; all inherit STORY-84's
alignment. Story body is internally consistent and unambiguous, so no descent to
intent history was forced at this level.

## Alignment Ledger

STORY-84 (feature) has exactly 8 ACs. Each maps to a distinct facet of the story's
in-scope surface.

| Element | Story surface aligned to | Outcome |
|---|---|---|
| AC-689 | "fold to one L1 document" + "validated by the L1 envelope; an invalid fold is rejected" | aligned |
| AC-690 | "raw ladder is retained unchanged as the acceptance oracle" | aligned |
| AC-691 | "each node carries its authored axes, a geometry keyframe per sampled width … equal the captured box" | aligned |
| AC-692 | "per-segment interpolate\|snap transition flags" | aligned |
| AC-693 | "a visibility rule derived from the widths it is present at" | aligned |
| AC-694 | "advisory structural-hint sidecar … parent computed layout, authored sizing units, position mode, ancestry, sibling repetition, real @media breakpoints" | aligned (all six enumerated elements present) |
| AC-695 | "read for DIRECTION, never EXECUTION; nothing in the render path consumes them; the folded L1 renders complete on its own" | aligned |
| AC-696 | "supersession of the pre-L1 adopt-values command" + "adopt-gaps left untouched" | aligned |

**Coverage:** all five story "in scope" items (fold→one doc, oracle retention,
keyframes+interpolate/snap+visibility, advisory hint sidecar, adopt-values
supersession) plus the envelope-validation and authored-axes claims are expressed.
No story behaviour is left without an AC.

**Exclusivity:** AC-694 (sidecar emitted + contents) and AC-695 (render path does
not consume the sidecar) are adjacent but distinct — one asserts the artifact and
its fields, the other asserts advisory-only independence. No two ACs describe the
same criterion.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | coverage | AC-691 | — | Story body discloses an as-built divergence: the fold currently emits **text leaves only**; text-free nodes (fields/images without src/text) are deferred. No AC contradicts this — the ACs describe "each folded node" generically — so it is not AC-level drift. Carried forward from the story-level info note (REPORT-790) as a UAT-level watch item. | none at AC level |

## Notes for the Editor

- Watch item for the `uat` cycle: because the fold is currently text-leaves-only,
  UAT fixtures for AC-691 / AC-693 / AC-694 must exercise **text** nodes (or
  explicitly assert the deferral for text-free nodes). A UAT that folds an
  image/field node and asserts a keyframe would encode intent the as-built does not
  yet deliver. This is the only place the disclosed divergence can bite; the ACs
  themselves are level-consistent with STORY-84.
- No violations, no needs_review — the AC layer is aligned to the story body and
  the story body is aligned to intent (per the story-level anchor). The
  `capability_validation_cycle` can consume this report and advance to the `uat`
  level.
