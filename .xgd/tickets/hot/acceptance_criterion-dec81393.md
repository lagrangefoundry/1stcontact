---
uid: acceptance_criterion-dec81393
id: AC-1285
type: acceptance_criterion
title: Noise treatment is a reversible layer over an exact capture, with an operator
  dial
created_by: xgd
created_at: '2026-08-20T03:40:53.576512+00:00'
updated_at: '2026-08-20T03:40:53.576512+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-aaddb221
  kind: behavior
  regression_only: false
---

## Criterion

The noise treatment is a layer applied *over* an exact capture, not a change to
what is captured or compared. Every axis is compared exactly by default, and the
operator can widen the treatment as a per-run decision (`--tolerant`) or leave it
off and see everything. Two properties follow, and both must hold:

- **The raw axis stays exact.** The same captured bundle, re-reported with the
  noise treatment switched off, still yields the underlying delta. A value the
  noise layer suppresses is suppressed at report time only — it is never absent
  from the capture, so the decision is reversible without re-capturing.
- **Each suppression names a rule.** A difference is only neutralised by a
  declared per-axis rule of one of three kinds — a tolerance band, a
  normalisation of two encodings of the same painted result, or a
  pairing/precondition fix — and a difference outside every such rule survives to
  the report. A delta that survives is, by construction, one the render shows.

## Verification

Run the values-diff report over a fixture bundle whose reproduction differs from
the reference by (a) a sub-visual amount inside a declared tolerance and (b) a
visible amount outside it. Assert the visible one is reported and the sub-visual
one is not. Re-run with the tolerance dial widened and assert the previously
reported delta is now absorbed; assert in both runs that the underlying captured
values on both sides are unchanged and still carry their exact values, so the
suppression happened at comparison time rather than at capture time.
