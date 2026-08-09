---
uid: acceptance_criterion-7761b6dd
id: AC-698
type: acceptance_criterion
title: Slot presentation is validated as L1 subtrees (structured-only security line)
created_by: xgd
created_at: '2026-07-22T19:54:03.556652+00:00'
updated_at: '2026-08-09T05:40:25.562637+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
When a behavior instance's `slots` are validated, the content supplied for each
named slot must parse as a valid L1 subtree; any slot value that is not a valid
L1 node (e.g. an attempt to smuggle a raw HTML/CSS/JS string or an arbitrary
object) is reported as a slot-scoped violation and rejected. Additionally:
- a missing **required** slot is a violation; a missing optional slot is not;
- a `repeated` slot must be an array within its inclusive `minItems`/`maxItems`
  bounds, and each element is validated as an L1 subtree (item-indexed
  violations); a non-repeated slot given an array is a violation, and vice versa.
Validating a whole instance reports the union of its config, slot **and control
binding** violations.

The slot-as-L1 security line is owned by the behavior module: it is the behavior
that refuses to mount slot content the L1 envelope has not accepted.

## Verification
Validate survivor behavior-module instances whose slots carry (a) valid L1
subtrees — expect zero violations; (b) a non-L1 value / raw-markup string in a
slot — expect a slot-scoped "not a valid L1 subtree" violation; (c) a missing
required slot, an under/over-count repeated slot, and an array-vs-single mismatch
— expect the corresponding violations. Confirm no slot content bypasses L1
validation to reach the rendered page, and that whole-instance validation of an
instance carrying a config error, a slot error and a control-binding error reports
all three. The slot validator is reached under its renamed name
`validateBehaviorSlots`, and whole-instance validation under
`validateBehaviorInstance`.