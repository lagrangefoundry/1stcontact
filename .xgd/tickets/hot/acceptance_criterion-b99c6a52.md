---
uid: acceptance_criterion-b99c6a52
id: AC-2552
type: acceptance_criterion
title: The assistant sees a stored picture as it currently stands by default, and
  the stored original when it asks for original
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T18:26:03.863351+00:00'
updated_at: '2026-11-09T18:26:03.863351+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-ed976856
  kind: behavior
  regression_only: false
---

## Criterion
When the assistant looks at a stored Library picture, the `original` argument decides what it sees:
- **Default (`original: false`):** the picture as it currently stands, with the recipe applied.
- **`original: true`:** the stored bytes the recipe is laid over, which show what an edit took away.

On a deployment with no renderer, both return the stored bytes.

## Verification
1. Give a picture a `rotate 90` recipe.
2. Have the assistant look at it with the default and assert the returned image has swapped dimensions.
3. Look with `original: true` and assert the stored dimensions and bytes.
