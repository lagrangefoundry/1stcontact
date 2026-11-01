---
uid: report-7cc8d9eb
id: REPORT-938
type: report
title: 'Capability-Intent Alignment: End-to-End Reproduction Gate (3-Probe) (level=ac)'
created_by: xgd
created_at: '2026-07-24T10:17:39.165924+00:00'
updated_at: '2026-07-24T10:17:39.165924+00:00'
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

## Cumulative Intent Considered

The capability's single story (STORY-86) carries `intent_uid = bundle-31e474b9`
(BUNDLE-7), a reconciled bundle of the framework-pivot requirements.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (bundle-31e474b9) — REQ-63 + REQ-79 + REQ-82 + REQ-83 + REQ-84 + 2 more | free_and_reconciled | merged @ edeb1c2c | Framework pivot to L1 substrate + the reproduction acceptance boundary (3-probe gate over a browser-free layout evaluator, absolute-base/structure-overlay split, demand-driven recovery) | YES |

At `ac` level the story body is the working reference (the story-level cycle ran
first — `check_story_validation` completed). The story body is internally coherent
and clearly derives from the reconciled bundle (the 3-probe gate is exactly the
REQ-79/REQ-82 framework-pivot acceptance boundary), so no deeper per-REQ intent
descent was required.

## Alignment Ledger

Capability CAP-73 → one story (STORY-86, `story_kind=feature`) → six ACs.

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-86 | BUNDLE-7 | aligned |
| AC-705 Sample-fidelity probe | BUNDLE-7 (via STORY-86) | aligned — matches story "sample-fidelity" bullet |
| AC-706 Off-sample probe | BUNDLE-7 (via STORY-86) | aligned — matches story "off-sample" bullet |
| AC-707 Content-robustness probe | BUNDLE-7 (via STORY-86) | aligned — matches story "content-robustness" bullet |
| AC-708 Combined gate (base/overlay split, non-vacuous) | BUNDLE-7 (via STORY-86) | aligned — matches story "absolute-base / structure-overlay split" |
| AC-709 Demand-driven recovery | BUNDLE-7 (via STORY-86) | aligned — matches story "wraps only the pinned sibling groups that fail content-robustness" |
| AC-710 Diagnostic residuals/findings | BUNDLE-7 (via STORY-86) | aligned — matches story "each failure points me at the specific framework gap" |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | consistency | AC-705…AC-710 | — | Each AC follows from a distinct clause of the story body; no AC asserts behavior the story does not describe | none |
| 2 | info | coverage | STORY-86 AC set | — | The six ACs cover the full behavioral surface: three probes (AC-705/706/707), combined gate (AC-708), demand-driven recovery (AC-709), diagnostic output (AC-710). The layout evaluator is substrate exercised through the envelope probes; its three violation kinds (overlap / horizontal clip / pinned-box overflow) surface via AC-706 and AC-707 (overflow manifests as an overlap finding under perturbed content, AC-707). No behavior in the story body is left uncovered. | none |
| 3 | info | exclusivity | AC-706 vs AC-707 | — | Both assert "the layout envelope holds" but under disjoint conditions — unsampled intermediate widths (AC-706) vs perturbed/grown content at captured widths (AC-707). Distinct criteria, not duplicates. | none |
| 4 | info | exclusivity | AC-705 vs AC-710 | — | AC-710 restates the fidelity-residual field shape (run text, width, per-axis deltas) already noted in AC-705, but is a distinct cross-cutting criterion about diagnostic richness (residual/finding names offending leaves + magnitude, not just a boolean) — a first-class story goal ("each failure points me at the specific framework gap"). Partial factual overlap, not a redundant criterion. | none |

## Notes for the Editor

No action required. The capability is a clean 1-story / 6-AC tree whose ACs
partition the story's behavioral surface one-to-one along the story's own
structure (three probes + gate + recovery + diagnostics). All ACs are `active`
with `uat_coverage=pass`. The only cross-AC overlap (AC-705 residual shape also
appears in AC-710) is intentional: diagnosticity is elevated to a named story
goal, and AC-710 generalizes it across all probes rather than duplicating the
fidelity probe's pass/fail criterion.
