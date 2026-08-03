---
uid: acceptance_criterion-70427416
id: AC-780
type: acceptance_criterion
title: Repeated projections at one (width, state) key are partitioned into ladder
  and evidence, so a height probe cannot drain the fidelity measure
created_by: xgd
created_at: '2026-08-03T02:48:38.849536+00:00'
updated_at: '2026-08-03T03:16:07.849023+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-24098299
  kind: behavior
  regression_only: false
---

## Criterion
The oracle the sample-fidelity probe measures against is built from the capture's
**width ladder only**. A capture may carry more than one projection at the same
`(width, state)` key — a height probe re-shoots a ladder width at a second viewport
height — and the partition rule is: **the first projection at a key is the ladder
cell; every later projection at that key is evidence** and contributes no oracle
samples. Non-resting states remain outside the measure entirely.

Consequences, observable in the probe report:
- A capture bundle containing a height probe yields exactly one set of oracle samples
  at the re-shot width — the same set the ladder cell alone would yield.
- A reproduction that has not changed still reports `unmatched = []` after a height
  probe is added to its capture. Without the partition the probe hands the measure a
  second full set of oracle rows at that width whose reproduced-leaf queues are
  already consumed, and every text run on the page surfaces as a coverage gap,
  failing a correct reproduction.
- The partition is the same rule the reproduction's other ladder consumers apply, so
  a probe never appears as a duplicate ladder cell anywhere the reproduction is
  graded.

## Verification
Run the fidelity probe against an oracle whose projections are the width ladder plus a
repeat of one ladder width at a different viewport height. Assert the report passes
with empty residuals and empty unmatched, and that the number of samples measured at
the re-shot width equals the number a single projection at that width contributes
(i.e. the probe's rows were not admitted). Assert that removing the height probe from
the same oracle produces a byte-identical report.