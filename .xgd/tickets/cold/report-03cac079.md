---
uid: report-03cac079
id: REPORT-897
type: report
title: 'Capability-Intent Alignment: 1c Gradient Fidelity (level=story)'
created_by: xgd
created_at: '2026-07-24T07:11:47.324628+00:00'
updated_at: '2026-07-24T07:11:47.324628+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-36dd68c5
  level: story
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Gradient Fidelity
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

## Cumulative Intent Considered

STORY-76 (the sole story under CAP-64) carries `intent_uid = bundle-ab9e0cb6`
(BUNDLE-6 "REQ-58 + REQ-59 + REQ-62 + REQ-61", status `free_and_reconciled`,
merged at `7a42e182`). Of the four folded source intents, two touch this
capability's behavioral surface (gradients); REQ-58 is the gigabytealchemy
re-import driver that *surfaced* the gaps, and REQ-61 is unrelated to gradients.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-59 | free_and_reconciled (bundle-ab9e0cb6) | merged 7a42e182 | Capture text-fill gradient stop *positions*; carry through projection; values-diff compares stop offsets within tolerance; UATs | YES |
| REQ-62 | free_and_reconciled (bundle-ab9e0cb6) | merged 7a42e182 | Capture panel/card `background-image` surface gradient (distinct from composited solid); author a `surfaceGradient`/gradient content-field fill (absolute-or-overlay stops); diff a surface-gradient axis | YES |
| REQ-58 | free_and_reconciled (bundle-ab9e0cb6) | merged 7a42e182 | gigabytealchemy re-import; surfaced the two gradient gaps but adds no gradient capability itself | context only |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-76 | REQ-59, REQ-62 | aligned — both intents fully and accurately expressed |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | coverage | STORY-76 | — | REQ-62 §2 asks for a gradient panel treatment "rendered as the card/panel background". STORY-76 delivers this via the exported `resolveSurfaceGradient` (→ `background-image: linear-gradient(...)` surface fill) and explicitly scopes *out* the homing of that fill onto a specific bespoke module render. REQ-62's implementation note ("landed, free-coded") confirms the delivered resolver shape matches intent; the module-homing exclusion is a deliberate refinement boundary, not a gap. | none |
| 2 | info | exclusivity | STORY-76 | — | STORY-76 explicitly delegates the composited-solid `surfaceFill` axis and element pairing to sibling CAP-63 (`values_diff_fidelity`, STORY-75), keeping the gradient-surface vs solid-surface boundary clean. No cross-capability overlap. | none |

## Notes for the Editor

- **Consistency (story level, primary check):** STORY-76's two-part Description
  maps 1:1 to the two reconciled intents — part 1 (text-fill stop positions,
  ±2pp tolerance, colour-only comparison for absent offsets) to REQ-59; part 2
  (panel surface capture / diff / author via `resolveSurfaceGradient`) to
  REQ-62. No sentence in the body references behavior no intent supports; no
  retired behavior is described.
- **Coverage (story level, primary check):** every reconciled behavior asked by
  REQ-59 (capture positions, projection carry-through, values-diff position
  axis, UATs) and REQ-62 (capture surface gradient, author fill, diff axis) is
  present in the single story. `uat_coverage=pass` on both the capability and
  the story.
- **Exclusivity:** only one story under CAP-64; boundary with CAP-63 is
  explicit in STORY-76's out-of-scope. No merge candidates.
- Back-compat note in STORY-76 ("pre-existing bundles without stop positions or
  surface gradients still parse … a stale bundle does not fabricate deltas")
  is consistent with REQ-59's "absent offsets never fabricate a false delta"
  and REQ-62's capture-additive framing.
