---
uid: acceptance_criterion-d9918f10
id: AC-2312
type: acceptance_criterion
title: The seed creates no platform operator and confers no hosting capability
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:17:16.953822+00:00'
updated_at: '2026-11-04T18:17:16.953822+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-5b5be809
  kind: behavior
  regression_only: false
---

## Criterion
After seeding, no person is flagged as a platform operator, and no seeded membership is on the deployment's own business. The success report names the platform operator under "NOT seeded" and points to `PLATFORM_ADMINS` as the way in.

## Verification
Seed, then assert that the count of platform-operator flags is zero and that there are no memberships on the platform business. Assert that the report text names the operator as not seeded.
