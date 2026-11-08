---
uid: acceptance_criterion-3bb4411a
id: AC-2383
type: acceptance_criterion
title: A generated picture carries the same material fields an uploaded image does,
  from its first visible moment
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T06:42:27.813532+00:00'
updated_at: '2026-11-08T10:09:06.823761+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-39c992d3
  kind: behavior
  regression_only: false
---

## Criterion
A generated material has: kind `image`; description_status `ok`; description_model set to the generating model's identifier; rights `owned`; republishable `true`; exportable `false`; role `site`; and content_type and filename equal to the values on its attachment record. Whenever the material is visible in the Library (list rows or detail), it never has fewer than these fields apart from content_type/filename — including at the moment the plugin has created the record and not yet attached its bytes. Those two can only exist once the bytes are attached, and they are present by the time the generation completes. A re-describe pass over the business's material does not select it.

## Verification
`tests/reconciliation-consultant-image-generation.workers.test.ts`, through `route()` in workerd over real D1/R2.

- `test_UAT_AC2383_a_generated_picture_carries_the_full_material_vocabulary`: after a generation, read the material through the Library list and detail, and the attachment record. Assert each field value, and that content_type/filename match the attachment (also on the stored ticket). Run the re-describe selections and assert it is not chosen.
- `test_UAT_AC2383_a_generated_picture_carries_its_vocabulary_before_its_bytes_are_attached`: create a material through the plugin's own store (`generatedMaterialStore`) with the plugin's bare `{type, title, body}` call and attach nothing (no attachments exist). Read `/api/material` and `/api/material/item` through `route()` at that instant and assert `kind` is `image`, `description_status` is `ok` and `description_model` is the generating model's id, together with origin, rights, republishable, exportable and role — and that the stored ticket carries the same fields.
