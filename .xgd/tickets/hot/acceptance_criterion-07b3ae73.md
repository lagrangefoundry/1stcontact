---
uid: acceptance_criterion-07b3ae73
id: AC-2380
type: acceptance_criterion
title: The model is never told which vendor generates images
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T06:42:25.630590+00:00'
updated_at: '2026-11-08T06:42:25.630590+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-39c992d3
  kind: behavior
  regression_only: false
---

## Criterion
Nothing the model sees names the image vendor: not the tool's manual entry, not its parameter schema, and not any tool result or error text (success, provider refusal, unsupported shape, budget exhausted). The tool has no parameter for choosing a provider or model. No vendor or model name (for example "OpenAI", "gpt-image", "Google", "Gemini") appears.

## Verification
Capture the tool manual, the schema and the tool results for success and for each error path in a session. Assert that none contains a vendor or model name, and that the schema has no provider/model parameter.