---
uid: acceptance_criterion-d7efa536
id: AC-2389
type: acceptance_criterion
title: Generating a picture never changes the site; placing it remains a separate
  promote step
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T06:42:32.166802+00:00'
updated_at: '2026-11-08T06:42:32.166802+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-39c992d3
  kind: behavior
  regression_only: false
---

## Criterion
After a successful generation, the generated material is placed on no site (its record of sites it is placed on is empty), and the site's definition is unchanged. Promoting it to a site asset through the existing promote-to-site action is the only way it reaches a site, and that action accepts it because it is republishable.

## Verification
Generate a picture and assert that the material's placed-on list is empty and the site definition is unchanged. Promote the generated material and assert that it succeeds and the material then records the site it is placed on.