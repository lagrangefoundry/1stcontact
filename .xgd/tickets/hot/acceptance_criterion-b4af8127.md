---
uid: acceptance_criterion-b4af8127
id: AC-2048
type: acceptance_criterion
title: Every redirect hop and subresource a captured page requests is checked in both
  hosts; refused requests are never sent and are reported in the result
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T21:19:27.255745+00:00'
updated_at: '2026-10-28T03:56:33.549741+00:00'
completed_at: null
last_field_updated: body
status: pending
fields:
  story_uid: story-31204812
  kind: behavior
  regression_only: false
---

## Criterion
During a capture, the same address rule is applied to the requests the page makes:
- **Worker browser (Browser Rendering):** every request, including each redirect hop and every subresource (request interception pauses every hop, cf-driver.ts `handleRequest`).
- **Node browser (Playwright):** every request its `page.route` seam sees, which covers the navigation and its subresources.

A request that fails the rule is never sent. The browser receives a 403 for it, and the page carries on loading its other resources. The capture still completes and returns a reference. Its `refusals` array lists every refused request with its `url`, `reason` (`scheme`, `credentials` or `private-address`) and a readable `detail`, in the order they occurred.

**Known limitation (beside the DNS-rebinding non-goal):** Playwright does not invoke `page.route` for redirect hops, so on the Node host a redirect hop into private space is **not** checked. This is an SSRF gap recorded in STORY-159 Known gaps.

> Aligned to code per fix_plan iteration 6 ruling (aligned_to_tip).

## Verification
Capture a public page whose markup references an image at `http://169.254.169.254/x.png` and another at a public origin. Do this once with each host's guarded driver, using a doubled network. Assert the private request was never forwarded, the public image was mirrored, and `refusals` names only the metadata URL with reason `private-address`. On the Worker host, also capture a public page whose first response redirects to `http://10.0.0.1/`, and assert the hop was never forwarded and is reported as `private-address`. (The Node redirect hop is not asserted either way.)
