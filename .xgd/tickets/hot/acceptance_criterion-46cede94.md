---
uid: acceptance_criterion-46cede94
id: AC-2388
type: acceptance_criterion
title: An aspect ratio the provider cannot make is reported as an unsupported shape
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T06:42:31.442352+00:00'
updated_at: '2026-11-08T07:13:45.637621+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-39c992d3
  kind: behavior
  regression_only: false
---

## Criterion
When the model asks for an aspect ratio the configured provider does not support, the tool returns an error saying that this is not a shape the generator offers. This is distinct from the wording for any other unsupported capability, so the model knows it can retry with a different shape. The request is refused before any provider call, and no material is created.

## Verification
Request a generation with an aspect ratio the provider does not declare (e.g. 21:9). Assert that the tool result names the shape as unsupported, that the provider endpoint received no request, and that no material was created.