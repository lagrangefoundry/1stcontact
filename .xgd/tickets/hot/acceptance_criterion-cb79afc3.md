---
uid: acceptance_criterion-cb79afc3
id: AC-2307
type: acceptance_criterion
title: A seeded business whose grant has ended is listed for Alice but cannot be selected
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:17:12.577950+00:00'
updated_at: '2026-11-04T18:29:01.621232+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5b5be809
  kind: behavior
  regression_only: false
---

## Criterion
After seeding, Alice's business list contains all three businesses. Alice's Plumbing and Alice's Lettings each have an open-ended grant and can be selected. Alice's Old Salon has a grant whose end date is in the past: it appears in the list but is reported as not selectable.

## Verification
Seed, request Alice's businesses as Alice, and assert that all three names are present, with Alice's Old Salon marked unselectable and the other two selectable.