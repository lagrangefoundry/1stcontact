---
uid: acceptance_criterion-81b601a7
id: AC-708
type: acceptance_criterion
title: Combined gate passes only when all three probes pass on the absolute-base /
  structure-overlay split and is non-vacuous
created_by: xgd
created_at: '2026-07-22T20:07:35.857877+00:00'
updated_at: '2026-07-22T20:07:35.857877+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-24098299
  kind: behavior
  regression_only: false
---

## Criterion
The combined gate runs all three probes and reports pass = true only when every probe
passes. Fidelity is measured on the absolute-base document; the off-sample and
content-robustness probes are measured on a supplied structure-recovered overlay
(defaulting to the base when none is supplied). The report carries each probe's
sub-report (with its residuals/findings).

The gate is non-vacuous:
- Run against a purely-pinned base with no recovery overlay, it reports pass = false,
  driven by the content-robustness probe failing.
- Run against the same base with a structure-recovered overlay, it reports pass = true.

## Verification
Fold a fixture capture, run the gate with no recovery and assert pass = false with
content-robustness failing; run the gate with the recovered overlay and assert pass =
true with all three sub-reports passing.
