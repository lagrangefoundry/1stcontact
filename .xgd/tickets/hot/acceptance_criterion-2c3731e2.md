---
uid: acceptance_criterion-2c3731e2
id: AC-2034
type: acceptance_criterion
title: The operator's live activity stream carries a screenshot's text but not its
  image bytes
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T19:42:23.235948+00:00'
updated_at: '2026-10-27T19:42:23.235948+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
When a turn's tool event containing a screenshot is streamed to the operator's browser, the streamed event keeps the text block unchanged and replaces the image's base64 data with a short marker naming its byte count and media type; no base64 image data appears anywhere in the stream. The model's own copy of the tool result is unaffected and still carries the full image.

## Verification
Run a turn through the streaming prompt endpoint with a model double that calls `screenshot`; collect the SSE events and assert the tool event contains the text block and an elision marker, and no base64 PNG payload; assert the backend request still received the full image block.
