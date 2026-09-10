---
uid: acceptance_criterion-2c02ca04
id: AC-1630
type: acceptance_criterion
title: A pinned box whose flow interior outgrows its keyframe height is reported as
  a content-overflow violation
created_by: martin-github@westhead.me
created_at: '2026-09-10T14:40:25.771776+00:00'
updated_at: '2026-09-10T15:36:56.579139+00:00'
completed_at: null
last_field_updated: uat_coverage
status: pending
fields:
  story_uid: story-24098299
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The analytic evaluator reports **three** envelope violations, not two: sibling
overlap, horizontal clip beyond the viewport, and **pinned-box content overflow**. A
node that pins its height — a box or container whose geometry keyframe carries a
fixed height — and whose flow interior lays out taller than that pinned height is
reported as a violation, because the box the reference measured cannot hold what the
reproduction puts inside it.

- The finding's **kind** is `clip`, its **detail** names the magnitude (the measured
  content height against the pinned box height), and its **paths** carry the index
  path of the offending node. The diagnostic contract itself is AC-710's.
- It is raised wherever the evaluator runs — at the intermediate widths the
  off-sample probe evaluates, and at every captured width under the
  content-robustness probe's perturbation. Growing a run's effective length is
  exactly the perturbation that drives a flow interior past a pinned ceiling, so the
  robustness probe is where this violation most often first appears; the off-sample
  probe must report it on the same terms, since a document may only overflow at a
  width the capture never sampled.
- A pinned box whose interior fits within its height raises nothing, and a node that
  pins no height at all — its extent follows its content — cannot raise this
  violation by construction.
- The excess is measured against the evaluator's own epsilon, so a sub-pixel overrun
  is not a violation.
- Like the other two violations, it sets `pass = false` for the probe that observed
  it and is listed under the width at which it was observed.

## Verification
Evaluate a document whose pinned box carries children whose stacked flow height
exceeds that box's keyframe height, and assert exactly one `clip` finding whose
detail names both the content height and the pinned height and whose paths name that
box. Raise the box's keyframe height above its content and assert the same document
now raises no finding. Assert an equivalent document whose box pins no height raises
none either.

Run the off-sample probe on a document that fits at every captured width but whose
interpolated pinned height falls below its content at an unsampled intermediate
width, and assert `pass = false` with the finding reported at that width. Run the
content-robustness probe at its default scale on a document whose pinned box just
fits unperturbed, and assert the grown content surfaces the same finding at each
captured width with `pass = false`.