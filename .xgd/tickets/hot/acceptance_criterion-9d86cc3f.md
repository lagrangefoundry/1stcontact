---
uid: acceptance_criterion-9d86cc3f
id: AC-2400
type: acceptance_criterion
title: Unknown node references and malformed anchor references are refused with what
  to write instead
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T07:16:50.752354+00:00'
updated_at: '2026-11-08T07:26:21.056401+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d2bee21c
  kind: behavior
  regression_only: false
---

## Criterion
An anchor reference whose node is not in the drawing is refused with a message listing every node reference the drawing does have (including path references for un-id'd nodes), or saying it has nothing measurable. A reference not in `<node>.<anchor>` form is refused with a message giving the expected form and an example. These two refusals are distinct messages. They apply to `relate`, `solve` and `assert` alike.

## Verification
Call `relate` with `#missing.top`, and assert the refusal lists the drawing's actual references. Call it with `wordmark`, which has no anchor, and assert the refusal states the `<node>.<anchor>` form.