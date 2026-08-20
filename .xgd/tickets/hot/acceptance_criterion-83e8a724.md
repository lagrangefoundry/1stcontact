---
uid: acceptance_criterion-83e8a724
id: AC-706
type: acceptance_criterion
title: Off-sample probe asserts the layout envelope holds at unsampled intermediate
  widths
created_by: xgd
created_at: '2026-07-22T20:07:11.256057+00:00'
updated_at: '2026-08-20T14:39:40.392955+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-24098299
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The off-sample probe evaluates a reproduced document at intermediate widths the capture
never sampled (default 500 and 900px) and reports pass = true with empty findings at
each width exactly when the evaluator's **full envelope** holds there: no two leaf boxes
overlap, no leaf clips beyond the viewport, and no pinned container's flowed content
overruns its pinned height.

- Any of the three envelope violations at an evaluated width — sibling overlap,
  horizontal clip beyond the viewport, or pinned-box content overflow — is reported as a
  finding at that width, and pass = false.
- The probe's pass condition is exactly the evaluator's finding set: it does not pass a
  width at which the evaluator reported a pinned-box overflow, even though no leaf
  crossed the viewport edge there.
- The report lists findings per evaluated width.
- The probe measures the **structure-recovered overlay**, not the absolute base. On a
  multi-region page — several independently-colliding bands separated by roomy space —
  the envelope holds at the unsampled widths once recovery is region-aware; promoting a
  single flat pile is not sufficient to satisfy this criterion.

## Verification
Run the probe on a folded fixture document at 500 and 900px and assert pass = true with
empty findings per width. Construct a document whose interpolation degrades between
captured widths so a clip/overlap appears at an intermediate width, and assert the
probe reports that finding at the affected width with pass = false. Construct a document
whose pinned container only overruns its pinned height at an intermediate width, and
assert the probe reports that finding at that width with pass = false while the captured
widths stay clean.

Run the probe on the recovered overlay of a multi-region page (a fold whose recovery
promotes more than one region) and assert pass = true with empty findings at every
evaluated width.