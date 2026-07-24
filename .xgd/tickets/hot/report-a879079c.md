---
uid: report-a879079c
id: REPORT-925
type: report
title: 'Capability-Intent Alignment: L1 Layout Substrate + Safety Envelope (level=ac)'
created_by: xgd
created_at: '2026-07-24T09:13:04.677696+00:00'
updated_at: '2026-07-24T09:13:04.677696+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-ae9d65d6
  level: ac
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: L1 Layout Substrate + Safety Envelope
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

## Cumulative Intent Considered

The capability (CAP-70) has a single story, STORY-83 (story-d0a8cfad, `feature`,
completed), whose `intent_uid` is BUNDLE-7 (bundle-31e474b9). Within that bundle
the substantive intent for this capability is REQ-82 (L1 substrate + safety
envelope), founded on the REQ-79 framework pivot. STORY-81 (archived, CAP-68)
contributed re-homed responsive-keyframe intent that was merged into this story.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-79 | free_and_reconciled (via BUNDLE-7) | merged edeb1c2c | Framework pivot: replace semantic layout modules with a single L1 substrate | YES |
| REQ-82 | free_and_reconciled (via BUNDLE-7) | merged edeb1c2c | Build L1 substrate: typed schema, envelope validator, sole safe renderer, geometry keyframes (interpolate\|snap), round-trip + cross-browser gate on a hero spike | YES |
| STORY-81 → merged | archived (behavior re-homed) | 2026-07-23 | Per-breakpoint module length dials + navCollapse deleted by REQ-79; responsive-across-widths intent re-homed to L1 geometry keyframes; AC-717 collapsed into AC-684 (REPORT-795) | YES (retired dials; behavior re-homed to AC-684) |

BUNDLE-7 is `free_and_reconciled` (merged_at_commit edeb1c2c) → all asks count
toward cumulative intent. No abandoned/deprecated intent touches this tree.

## Alignment Ledger

Working reference at ac level is the STORY-83 body (story-level cycle assumed
run; a story-level dedup pass, REPORT-795, already collapsed AC-717 → AC-684).

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-682 (accept well-formed typed tree) | REQ-82, REQ-79 | aligned — covers typed L1 shape + accept-side of the envelope validator |
| AC-683 (round-trip authored axes at all widths) | REQ-82 | aligned — covers the round-trip identity gate (`capture(render(L1)) ≈ L1` on Type-A axes) |
| AC-684 (geometry keyframes interpolate/snap) | REQ-82, STORY-81 (re-homed) | aligned — covers per-viewport geometry; explicitly subsumes retired AC-717 |
| AC-685 (injection payloads inert) | REQ-82 | aligned — covers the safe-renderer neutralisation / `envelope_security` acceptance probe |
| AC-686 (out-of-range/oversize/freeform rejected) | REQ-82 | aligned — covers reject-side of the envelope / `envelope_robustness` probe |
| AC-687 (rejected doc returns full list of per-field errors) | REQ-82 | aligned — benign elaboration of the Zod-based `validateL1` validator; non-contradictory, coverage-positive |
| AC-688 (equivalent across chromium/webkit/firefox) | REQ-82 | aligned — covers the `cross_browser` acceptance probe |

## Findings

No violations, warnings, or needs_review items.

### Coverage (fully expressed)
Every in-scope behavioral surface of STORY-83 is covered by ≥1 AC:
- typed L1 shape / element tree → AC-682
- envelope validator accept → AC-682; reject → AC-686; structured error result → AC-687
- safe renderer neutralisation (escaped text, dropped unsafe src, sanitised font-family) → AC-685
- round-trip identity gate → AC-683
- per-viewport geometry keyframes (interpolate\|snap) → AC-684
- cross-browser equivalence → AC-688

REQ-82's four named acceptance probes (`roundtrip`, `envelope_security`,
`envelope_robustness`, `cross_browser`) each map onto an AC (AC-683, AC-685,
AC-686, AC-688 respectively), with AC-682/AC-684/AC-687 adding accept-path,
geometry, and error-shape coverage.

### Consistency (each AC follows from the story body)
All seven AC criteria are supported by the story body and the REQ-82 intent.
- AC-682's root-kind enumeration (`box, text, image, slot, container`) is
  consistent with the story's `stack|row|grid` containers: as built, `container`
  is the node kind and stack/row/grid is a distribution axis (confirmed in the
  REQ-82 as-built note). Not an inconsistency.
- The `fixed|fluid|hug` sizing in AC-682/story matches the as-built schema; the
  spec-time `min/max` wording in REQ-82 was intentionally finalised on the spike
  (REQ-79: "finalise the full L1 schema grounded on the spike"). ACs reflect
  reconciled as-built intent — aligned.

### Exclusivity (no two ACs describe the same criterion)
- AC-686 (which documents are rejected) vs AC-687 (the shape of the rejection
  result) are distinct.
- AC-685 (render-time inertness, defence-in-depth) vs AC-686 (validate-time
  rejection) operate at different layers.
- AC-683 (round-trip identity) vs AC-688 (cross-engine equivalence) are distinct
  guarantees.
- The only prior duplicate (AC-717) was already retired into AC-684 per
  REPORT-795; no live duplication remains.

## Notes for the Editor

Nothing to action. The AC tree is complete, internally consistent, and free of
duplication against the reconciled REQ-79/REQ-82 intent. The one AC not stated
verbatim in the story body (AC-687, structured validation errors) is a
supportable elaboration of the envelope validator and does not represent drift.
