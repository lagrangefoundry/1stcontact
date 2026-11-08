---
uid: acceptance_criterion-3bb4411a
id: AC-2383
type: acceptance_criterion
title: A generated picture carries the same material fields an uploaded image does,
  from its first visible moment
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T06:42:27.813532+00:00'
updated_at: '2026-11-08T06:42:27.813532+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-39c992d3
  kind: behavior
  regression_only: false
---

## Criterion
A generated material has: kind `image`; description_status `ok`; description_model set to the generating model's identifier; rights `owned`; republishable `true`; exportable `false`; role `site`; and content_type and filename equal to the values on its attachment record. Whenever the material is visible in the Library (list rows or detail), it never has fewer than these fields apart from content_type/filename. Those two can only exist once the bytes are attached, and they are present by the time the generation completes. A re-describe pass over the business's material does not select it.

## Verification
After a generation, read the material through the Library list and detail, and the attachment record. Assert each field value, and that content_type/filename match the attachment. Run the re-describe selection and assert it is not chosen.