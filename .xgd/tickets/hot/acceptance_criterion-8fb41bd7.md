---
uid: acceptance_criterion-8fb41bd7
id: AC-2031
type: acceptance_criterion
title: A screenshot reaches the model as an image inside the same tool loop
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T19:42:16.975757+00:00'
updated_at: '2026-10-27T19:42:16.975757+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
`screenshot` returns two content blocks: a text block naming the picture and its pixel size (e.g. '<label> — W×H'), and an image block carrying the PNG as base64. When the model calls `screenshot` during a turn, the request the backend receives next in that same turn carries a tool result whose content includes that image block — not a key, path or URL standing in for it.

## Verification
Drive a consultant turn with the shared model double scripted to call `screenshot` then answer; capture the requests the backend received and assert the second request's tool_result content contains a text block with the size and an `image` block with base64 PNG data.
