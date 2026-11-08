---
uid: acceptance_criterion-fd0089b8
id: AC-2393
type: acceptance_criterion
title: Drawing anchors are a closed set of 17 names in four families, each with an
  inferred axis
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T07:16:45.667734+00:00'
updated_at: '2026-11-08T07:16:45.667734+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d2bee21c
  kind: behavior
  regression_only: false
---

## Criterion
An anchor reference is `<node>.<anchor>`. The accepted anchor names are exactly: box `left`, `right`, `top`, `bottom`, `centre-x`, `centre-y`; ink `ink-left`, `ink-right`, `ink-top`, `ink-bottom`; font `baseline`, `cap-top`, `x-top`, `ascender`, `descender`; advance `advance-start`, `advance-end`. Each name carries a fixed axis, never passed by the caller: `left`/`right`/`centre-x`/`ink-left`/`ink-right`/`advance-start`/`advance-end` are x, and the rest are y. A name outside the set is refused with a message that lists the valid names. Ink, font and advance anchors asked of a node that has no text are refused with a message pointing to the box anchors.

## Verification
Resolve every listed anchor against a measured text node and check its reported axis. Resolve a misspelt anchor and a font anchor on a `<rect>`, and check that each refusal names the alternatives.