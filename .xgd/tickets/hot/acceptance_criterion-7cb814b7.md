---
uid: acceptance_criterion-7cb814b7
id: AC-2025
type: acceptance_criterion
title: A Worker-hosted consultant with a browser binding is offered the looking surface
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T19:42:02.821123+00:00'
updated_at: '2026-10-27T19:42:02.821123+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
On the Cloudflare Worker deployment, when a Browser Rendering binding is configured, a consultant chat session for a site is offered the six looking operations, and a `screenshot` of that site's draft returns a picture of the draft rendered by the Worker's own preview renderer. (Node is covered by the absence/presence criteria; this pins the cloud host, which is where REQ-157 says the assistant had no eyes.)

## Verification
Through the Worker's chat host with a stubbed browser binding, open a consultant session and assert the offered tool set includes `screenshot`; invoke it on a `draft` picture and assert an image is returned. Expected to fail against the landed code — see the story's flagged code issue.
