---
uid: report-72e4f4b3
id: REPORT-827
type: report
title: 'Capability-Intent Alignment: Framework Absolute-or-Overlay Value System (level=story)'
created_by: xgd
created_at: '2026-07-23T09:53:55.139991+00:00'
updated_at: '2026-07-23T09:53:55.139991+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-6e088083
  level: story
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Framework Absolute-or-Overlay Value System
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

Attempt 3 (2 prior fix attempts). Both previously-flagged violations are verified
RESOLVED against the live ticket bodies and the intent source — not assumed from
the fix reports. The capability's single story (STORY-80) is fully aligned to
cumulative intent; the capability container body (CAP-67) is consistent; no
coverage gap (the named-overlay half is intentionally parked, not missing).

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability. Both bundles are
`free_and_reconciled`; the operative source REQs inside them are listed.

| Intent ID | Status | When (merged_at_commit) | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-58 (request-c2d25c7b, in bundle-ab9e0cb6) | free_and_reconciled | 7a42e18 | Origin: absolute-or-overlay delivered via ~20 semantic-module colour/length/radius dials (AC-660..665 era) | YES (origin, later superseded) |
| REQ-79 (request-87b26bca, in bundle-31e474b9) | free_and_reconciled | edeb1c2 | Framework pivot: #2 "one value = one literal field — no theme-role indirection in L1"; #4 named overlay = PARKED L2 design library ("possibly never needed"); reconciliation note: services-grid/text-block/footer surfaceFill+weight dials are intentional supersession, "absolute value OR role concept carries into L1 leaf axes" | YES — retires module-dial delivery; parks overlay |
| REQ-84 (request-f243b6b9, in bundle-31e474b9) | free_and_reconciled | edeb1c2 | DELETE module dirs `header/ hero/ footer/ text-block/ services-grid/ layer/` + ~20 layout-only dials; "Catalog reduces to carousel + contact-form" | YES — deletes the delivery vehicle |
| REQ-85 (request-015e42ac, in bundle-31e474b9) | free_and_reconciled | edeb1c2 | Behavior-module contract; REFRAME survivors `carousel` + `contact-form` (NOT delete); submit styling/labels → L1 slots | YES — confirms contact-form survives |

**Current cumulative intent**: the absolute-literal base — hex colour, finite px
length/geometry, finite px radius, envelope-bounded (font-size 1–400, geometry
±100k, length ±100k) — is carried directly on **L1 leaf axes** (box / text /
image). The prior ~20 semantic-module dials that delivered it were DELETED by
REQ-84. The named-overlay half (palette role / named step / named shape) is the
**parked L2 design library** (REQ-79 #4): not delivered anywhere, and by decision
may never be. There is no `absolute OR role` union in L1 (REQ-79 #2).

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-67 (capability body) | REQ-79, REQ-84, REQ-85 | aligned — frames absolute-or-overlay as a design *principle*; re-homes the absolute base onto L1 leaf axes (hex colour, finite px length/geometry, `borderRadiusPx`); deleted-module list reads `header, hero, footer, text-block, services-grid, layer` (matches REQ-84 verbatim); overlay stated as parked L2, not delivered. Prior attempt-1 violation (stale module-dial examples) is resolved. |
| STORY-80 (story-c490f1cf) | REQ-58 (origin), REQ-79, REQ-84, REQ-85 | aligned — operative claim (absolute base re-homed in L1 leaf literals; overlay parked in L2) matches intent; Description's deleted-module list now reads `(header, hero, footer, text-block, services-grid, layer)` — matches REQ-84 exactly (contact-form correctly EXCLUDED; layer correctly INCLUDED). Prior attempt-2 violation (contact-form wrongly listed / layer omitted) is resolved. Title carries no over-promise of the parked overlay. |

## Findings

None. (No violations, no warnings, no needs_review.)

Informational (no action, ledger record only):
- The named-overlay affordance is absent from the story tree by design (REQ-79 #4
  parks it as the L2 design library). This is NOT a coverage gap — parked intent
  is not active intent.
- STORY-80 is an `upgrade` repointer story; substantive L1-axis + envelope
  coverage is owned by the L1 substrate story under a different capability, as the
  STORY-80 Technical Notes correctly state. Not double-coverage here.
- Single story in the capability → exclusivity trivially satisfied.

## Verification Performed This Attempt

Because 2 prior fix attempts preceded this check, both previously-flagged
violations were re-verified directly (not trusted from the fix summaries):

1. **Attempt-1 violation (CAP-67 body)** — re-read via `xgd ticket get
   capability-6e088083 --json`. Body now describes the design principle + L1 leaf
   axes, lists `header, hero, footer, text-block, services-grid, layer`, and
   states the overlay is parked L2. RESOLVED.
2. **Attempt-2 violation (STORY-80 deleted-module list)** — re-read STORY-80
   Description via `xgd ticket get story-c490f1cf --json`. Reads "the semantic
   *layout* modules (header, hero, footer, text-block, services-grid, layer) …
   were deleted (REQ-84)". `contact-form` is NOT present; `layer` IS. RESOLVED.
3. **Intent source cross-check** — read REQ-84 (request-f243b6b9): deleted set =
   `header/ hero/ footer/ text-block/ services-grid/ layer/`, "Catalog reduces to
   carousel + contact-form"; REQ-85 (request-015e42ac): reframes carousel +
   contact-form as survivors; REQ-79 (request-87b26bca): overlay parked, "absolute
   value OR role concept carries into L1 leaf axes". Story + capability bodies are
   consistent with all three.

## Notes for the Editor

No editor action required. This capability's story-level matrix is aligned to
cumulative intent. The overlay half remains parked (REQ-79 #4) — if a future
intent un-parks the L2 design library, a new story would be required at that time,
but no such intent exists in the current ledger.
