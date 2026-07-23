---
uid: report-d4ff5ada
id: REPORT-783
type: report
title: 'Capability-Intent Alignment: End-to-End Reproduction Gate (3-Probe) (level=ac)'
created_by: xgd
created_at: '2026-07-23T06:28:17.820997+00:00'
updated_at: '2026-07-23T06:28:17.820997+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-8108afab
  level: ac
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: End-to-End Reproduction Gate (3-Probe)
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

## Scope of this check

`ac` level. Per level-cascade rules the story body is the working reference and is
consulted against intent only where internally ambiguous. The capability tree is
small and singular: CAP-73 → 1 feature story (STORY-86) → 6 ACs (AC-705…AC-710).
The story body is internally coherent, so ac-level assessment is grounded in the
story body; the intent ledger is recorded for provenance.

## Cumulative Intent Considered

The story's `intent_uid` is `bundle-31e474b9` (BUNDLE-7), the reconciled
framework-pivot bundle. The capability body additionally cites REQ-79 / REQ-86 as
the originating pivot intent and CAP-70 / CAP-71 as upstream dependencies (renderer,
fold) — both out of this capability's scope.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (bundle-31e474b9) | free_and_reconciled | merged @ edeb1c2c | Bundles REQ-63 + REQ-79 + REQ-82 + REQ-83 + REQ-84 + 2 more — the L1 framework pivot; establishes the capture→fold→render pipeline behind which this 3-probe acceptance gate sits | YES |
| REQ-79 / REQ-86 (via capability body) | reconciled (in pivot) | — | Framework pivot to the L1 substrate; the reproduction pipeline this gate terminates | YES (context) |

No retired/abandoned intent bears on this capability; nothing in the story tree
describes behavior an intent has retired.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-86 (feature) | bundle-31e474b9 | aligned — body faithfully documents the 3-probe acceptance boundary + demand-driven recovery over the capture→fold→render pipeline |
| AC-705 sample-fidelity | STORY-86 | aligned — reproduced text-run boxes vs. retained oracle at each captured width within tolerance; residual/unmatched shape |
| AC-706 off-sample | STORY-86 | aligned — envelope (no overlap/clip) at unsampled intermediate widths |
| AC-707 content-robustness | STORY-86 | aligned — envelope under perturbed (grown) text/pinned content |
| AC-708 combined gate | STORY-86 | aligned — all-three-pass on the absolute-base/overlay split; non-vacuity asserted |
| AC-709 demand-driven recovery | STORY-86 | aligned — promotes only failing pinned groups to flow; returns a validated L1 doc |
| AC-710 diagnosticity | STORY-86 | aligned — residuals/findings carry offending leaf identity + magnitude, not a bare boolean |

## Coverage (does the AC set fully express the story's behavioral surface?)

STORY-86 is `story_kind=feature`, so ACs are expected. In-scope surface → AC:

- "analytic evaluator's envelope findings" → AC-706, AC-707, AC-710
- "the three probes and their report shapes" → AC-705, AC-706, AC-707
- "the combined gate over the absolute-base/overlay split" → AC-708 (incl. non-vacuity)
- "demand-driven promotion of failing pinned groups to flow" → AC-709

The explicitly out-of-scope browser-backed `capture(render(L1)) ≈ L1` round-trip is
correctly absent from every AC. No AC describes behavior outside the story scope.
**No coverage gap.**

## Consistency (does each AC follow from the story body?)

Every AC's specifics trace to story text: fidelity tolerance and residual/unmatched
reporting (AC-705); intermediate-width envelope check (AC-706); 2.5× content
perturbation with the flow-vs-pinned distinction (AC-707); the absolute-base /
structure-overlay split and non-vacuity (AC-708); "wrap only failing pinned groups,
pin origin / flow interior, leave survivors absolute, return a *validated* document"
(AC-709); diagnostic-not-boolean reports (AC-710, matching the story's Technical
Context). **No inconsistency.**

## Exclusivity

The six ACs cover distinct probes/mechanisms. AC-708 (gate *consumes* a supplied
overlay) and AC-709 (recovery *produces* the overlay) are complementary, not
duplicative. AC-705 and AC-710 share the fidelity-residual field list (text, width,
dx/dy/dw) but their criteria differ — AC-705 governs the fidelity probe's pass/fail
+ residual/unmatched behavior; AC-710's load-bearing, non-duplicated contribution is
the *envelope-finding* diagnostic shape (kind + magnitude detail + leaf index paths),
specified by no other AC. Acceptable cross-cutting overlap, not the same criterion.
**No exclusivity violation.**

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | exclusivity | AC-705 + AC-710 | — | Both restate the fidelity residual's field list (text, width, dx/dy/dw). AC-710's distinct contribution is the envelope-finding diagnostic shape not covered elsewhere; the fidelity restatement is legitimate cross-cutting context, not a duplicate criterion. | none |
| 2 | info | consistency | STORY-86 / AC-710 | — | Story description lists three envelope-violation *sources* — "sibling overlap, horizontal clip beyond the viewport, and pinned-box content overflow" — while the finding taxonomy in AC-710 exposes two *kinds* (overlap \| clip). AC-707 reconciles this: a pinned box's content overflow that overruns a sibling surfaces as an *overlap* finding. Internally consistent; no distinct third finding-kind is asserted or required by the story. | none |

## Notes for the Editor

Clean tree. One feature story, six ACs, all aligned to the reconciled framework-pivot
bundle (BUNDLE-7, free_and_reconciled). The AC set is complete against the story's
in-scope surface, consistent with the story body, and free of same-criterion
duplication. The two `info` entries are provenance observations, not repairs: the
fidelity-residual restatement across AC-705/AC-710 is intended cross-cutting coverage,
and the "three sources vs. two finding-kinds" wording is reconciled by AC-707. No
action required at ac level.
