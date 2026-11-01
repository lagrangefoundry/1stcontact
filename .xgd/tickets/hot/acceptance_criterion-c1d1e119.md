---
uid: acceptance_criterion-c1d1e119
id: AC-2223
type: acceptance_criterion
title: The erasure explanation lists by name every business the account operates,
  lapsed ones included
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:16:19.036054+00:00'
updated_at: '2026-11-01T20:16:19.036054+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-83ff6262
  kind: behavior
  regression_only: false
---

## Criterion
When the caller operates one or more businesses, the page shows "This account operates N business: A." (singular) or "This account operates N businesses: A, B." (plural), listing every business from the caller's account data, both selectable and lapsed, by name. A business with no name is listed by its id. When the caller operates no businesses (an account one level down), the sentence is hidden and nothing about businesses is said.

## Verification
Return account data with one live business, then two businesses (one lapsed), then one unnamed business, then none. Check the exact sentence, that lapsed businesses are included, that the id is used as a fallback, and that the element is hidden when the list is empty.
