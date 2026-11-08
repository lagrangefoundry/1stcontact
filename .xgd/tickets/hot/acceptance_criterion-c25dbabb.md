---
uid: acceptance_criterion-c25dbabb
id: AC-2379
type: acceptance_criterion
title: With an image credential configured, a consultant session can generate a picture
  that lands as a new material in the client's Library
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T06:42:24.931221+00:00'
updated_at: '2026-11-08T06:42:24.931221+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-39c992d3
  kind: behavior
  regression_only: false
---

## Criterion
When the deployment has an image credential, a consultant session's tool surface offers image generation. This needs no image-generation entry in the instance configuration: the grant comes from the image tool's own declaration. When the model asks for a picture, the tool reports success, and exactly one new `material` appears in that business's Library. It has a title derived from the prompt, a body containing the prompt, and one attachment holding the generated image bytes, which can be retrieved through the normal material-attachment path.

## Verification
Drive a consultant turn through the control app with the image provider's HTTP endpoint doubled, and the model requesting one picture. Assert that the tool result reports success, that the Library listing for the business gains exactly one material, that its title and body reflect the prompt, and that its attachment returns the provider's image bytes.