---
uid: acceptance_criterion-7a76aab0
id: AC-2390
type: acceptance_criterion
title: The image tool can only create picture material and attach to records it created
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T06:42:32.897858+00:00'
updated_at: '2026-11-08T07:13:44.932372+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-39c992d3
  kind: behavior
  regression_only: false
---

## Criterion
The only records image generation can cause are `material` records holding a picture it generated. A request through the image tool's store to create any other ticket type is refused with an error naming the allowed type, and an attach to a ticket the tool did not create is refused. In both cases nothing is written.

## Verification
Through the image tool's store, try to create a non-material ticket and to attach to an existing material the tool did not create. Assert that both are refused and that the ticket store is unchanged.