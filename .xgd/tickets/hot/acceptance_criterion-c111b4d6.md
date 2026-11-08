---
uid: acceptance_criterion-c111b4d6
id: AC-2387
type: acceptance_criterion
title: A provider refusal comes back to the model as a named, actionable error
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T06:42:30.718147+00:00'
updated_at: '2026-11-08T07:13:45.949628+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-39c992d3
  kind: behavior
  regression_only: false
---

## Criterion
When the image provider declines a prompt (e.g. a content-policy refusal), the tool returns an error saying the request was declined and telling the model to rewrite the prompt rather than retry it unchanged. This is distinct from a transport or deployment failure. No material is created.

## Verification
Have the provider double return a refusal (HTTP 400 with a refusal body). Assert that the tool result says the request was declined and tells the model to rewrite the prompt, and that the Library gained no material.