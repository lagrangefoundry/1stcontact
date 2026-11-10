---
uid: acceptance_criterion-9b0c0a93
id: AC-2569
type: acceptance_criterion
title: A written drawing's result carries the line that shows it in the conversation,
  addressed under the business's own path
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T22:39:49.753781+00:00'
updated_at: '2026-11-10T00:54:47.730465+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-b3de4571
  kind: behavior
  regression_only: false
---

## Criterion
In a builder session for a business, a successful `write_image` result carries a `display` field. It holds one ordinary markdown image line, `![<name>](/b/<businessId>/preview/<slug>/draft/assets/<file>)`:
- the URL is the address the builder's own preview serves the drawing at, and it names the current business explicitly;
- the alt text is the drawing's file name without its extension and without square brackets.

Fetching that URL in the same business's session returns the drawing's bytes. The chat's stock sanitiser renders the line as an `<img>` carrying that URL.

Redrawing the same name with `replace: true` returns the same line. The line names the asset as the site now holds it, so an earlier transcript that pasted it now shows the new drawing. This is the accepted behaviour of naming a live asset, not a defect.

A drawing has no Library entry, so clicking it opens nothing. That is the intended outcome.

## Verification
Through the Worker's route table, over real D1 and R2, with the model scripted: draw a mark in a session for a known business. Assert that `display` is exactly one markdown image line whose URL is `/b/<businessId>/preview/<slug>/draft/assets/<file>`. Split its business prefix the way the production router does, fetch it, and assert that the drawing's bytes come back. Redraw the same name with `replace: true` and assert that the line is identical. Pass the line through the chat's sanitiser and assert that an `<img>` with that `src` survives.