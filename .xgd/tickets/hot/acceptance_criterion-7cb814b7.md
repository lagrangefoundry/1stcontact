---
uid: acceptance_criterion-7cb814b7
id: AC-2025
type: acceptance_criterion
title: A Worker-hosted consultant with a browser binding is offered the looking surface
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T19:42:02.821123+00:00'
updated_at: '2026-10-27T20:23:16.128204+00:00'
completed_at: null
last_field_updated: body
status: pending
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
On the Cloudflare Worker deployment, when a Browser Rendering binding is configured, a consultant chat session for a site is offered the six looking operations, and a `screenshot` of that site's draft returns a picture of the draft rendered by the Worker's own preview renderer. (Node is covered by the absence/presence criteria; this pins the cloud host, which is where REQ-157 says the assistant had no eyes.)

## Verification
Through the Worker's own router and chat host, with a `BROWSER` binding configured (which is what tells the router the deployment can see) and the browser it launches injected through the router's `launch` seam — a puppeteer-shaped fake that returns a real PNG, as the REQ-154 cloud UATs inject theirs, because a bare binding stub cannot speak the Browser Rendering protocol. Open a consultant session and assert the offered tool set includes all six looking operations beside `set_l1`; invoke `screenshot` on a `draft` picture and assert the tool result the backend receives carries an `image/png` block and the picture's size, and that the page the browser loaded was `/preview/<slug>/draft/` answered in-process by the Worker's preview renderer with HTML.
