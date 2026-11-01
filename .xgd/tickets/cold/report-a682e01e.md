---
uid: report-a682e01e
id: REPORT-797
type: report
title: 'Capability-Intent Alignment: L1 Layout Substrate + Safety Envelope (level=ac)'
created_by: xgd
created_at: '2026-07-23T07:45:28.973133+00:00'
updated_at: '2026-07-23T07:45:28.973133+00:00'
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

Anchor report: report-9260fc31 (Regression start: 973fcaec).
Capability: capability-ae9d65d6 (CAP-70). Level: ac. Previous attempts: 1.

Re-check after fix attempt 1 (REPORT-796). The single violation raised by the
prior ac-level cycle (REPORT-795) — the AC-717 / AC-684 exclusivity duplicate —
has been fully resolved. At `ac` level the story body is the working reference
(story-level cycle assumed aligned per REPORT-794). CAP-70 contains exactly one
story, **STORY-83** (story-d0a8cfad, `story_kind=feature`, status=completed), so
its ACs are the coverage/consistency/exclusivity surface.

## Cumulative Intent Considered

STORY-83 is a reconciliation-authored feature story; its body is the
authoritative surface at this level. Intents it derives from (per story
body / fields):

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| bundle-31e474b9 (intent_uid) | reconciled | 2026-07 | Reconciled the L1 substrate into the matrix (post REQ-79 pivot) | YES |
| REQ-79 | reconciled (pivot) | 2026-07 | Replaced semantic layout modules with the single L1 substrate; removed per-breakpoint module length dials + `navCollapse` | YES |
| REQ-82 | reconciled | 2026-07 | Founded the structured-only security envelope on L1 (validator + safe renderer) | YES |
| STORY-81 / CAP-68 (archived) | superseded | 2026-07 | Per-breakpoint responsive dials; re-homed here as geometry keyframes; sole AC (AC-717) reassigned to STORY-83, now collapsed into AC-684 | YES (re-homed) |

## Alignment Ledger

| Element | Aligned to (story body clause) | Outcome |
|---|---|---|
| AC-682 (acceptance_criterion-78662fd0) | "typed L1 shape … well-formed accepted by validator" | aligned |
| AC-683 (acceptance_criterion-5787336a) | "round-trip identity gate: capture(render(L1)) ≈ L1 on authored axes" | aligned |
| AC-684 (acceptance_criterion-5de42d48) | "per-viewport geometry keyframes … interpolate | snap" (survivor; subsumes retired AC-717) | aligned |
| AC-685 (acceptance_criterion-62adf959) | "single safe renderer … re-checks and neutralises every value at emit time" | aligned |
| AC-686 (acceptance_criterion-33ecc306) | "envelope validator … accepts only in-range/in-shape/hex/allowlisted/capped docs" | aligned |
| AC-687 (acceptance_criterion-c9b3f600) | "envelope validator" (machine-readable multi-error reporting — reasonable decomposition of validator behaviour) | aligned |
| AC-688 (acceptance_criterion-18356eea) | "cross-browser check confirms equivalent layout across the three engines" | aligned |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | exclusivity | AC-684 (acceptance_criterion-5de42d48) + AC-717 (acceptance_criterion-3a1cae43) | — | Prior violation RESOLVED. AC-717 archived; its provenance note folded into AC-684's Criterion ("this criterion subsumes the retired AC-717"); STORY-83 body updated to record the collapse (per REPORT-795); duplicate test `tests/reconciliation-responsive-keyframes.test.ts` retired (coverage now in `tests/reconciliation-l1-substrate.test.ts`, verified present). Verified AC-717 absent from the active AC list. | none |
| 2 | info | coverage | AC-682 (acceptance_criterion-78662fd0) | — | Structure primitives (per-axis sizing `fixed \| fluid \| hug`, distribution, alignment, viewport-range visibility) are gated at the *acceptance* level (AC-682 admits valid forms) but no AC gates their *rendered* effect independently of geometry keyframes (AC-684) / round-trip literals (AC-683). Carried forward unchanged from REPORT-795 as info; within the hand-authored one-section spike scope declared by the story. Not a violation. | none |

## Coverage of the story's in-scope surface

Every in-scope behaviour has ≥1 AC; no orphaned or out-of-scope AC:

- typed L1 shape → AC-682
- envelope validator → AC-686 (rejection), AC-687 (per-field error list)
- safe renderer / emitter defence → AC-685
- geometry keyframe compilation (interpolate|snap) → AC-684
- round-trip fidelity → AC-683
- cross-browser fidelity → AC-688

Out-of-scope items declared by the story body (REQ-83 capture→L1 fold, REQ-85
capability-module slot mounting, REQ-86 3-probe repro gate) correctly have no
ACs.

## Notes for the Editor

No action required. The prior fix (REPORT-796) is complete and verified against
the working tree. The two info items are drift-prevention ledger entries, not
fixes: #1 records the resolved collapse; #2 records a deliberate,
spike-scoped coverage boundary for structure-primitive rendered behaviour that
future upgrade stories may elect to gate.
