---
uid: acceptance_criterion-91e7558f
id: AC-2408
type: acceptance_criterion
title: The drawing operations are a read-effect group on the site control surface
  and read the site's own drawings
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T07:16:56.744946+00:00'
updated_at: '2026-11-08T07:16:56.744946+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d2bee21c
  kind: behavior
  regression_only: false
---

## Criterion
`measure_drawing`, `relate` and `solve` appear in the consultant's tool list as read-effect operations: none of them changes the site. Each takes the name of a drawing in the current site's own asset store and measures that drawing as stored. A drawing name the site does not have is refused, and nothing is measured.

## Verification
List the consultant's granted operations and assert all three are present and marked read-effect. Call `measure_drawing` on a written drawing and on an unknown name. Assert the first returns its measurement, the second is refused, and the site's revision/draft state is unchanged by both.