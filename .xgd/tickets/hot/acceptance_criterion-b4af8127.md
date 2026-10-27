---
uid: acceptance_criterion-b4af8127
id: AC-2048
type: acceptance_criterion
title: Every redirect hop and subresource a captured page requests is checked in both
  hosts; refused requests are never sent and are reported in the result
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T21:19:27.255745+00:00'
updated_at: '2026-10-27T21:19:27.255745+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-31204812
  kind: behavior
  regression_only: false
---

## Criterion
During a capture, the same address rule is applied to **every request the page makes** (each redirect hop and every subresource) in both the Worker browser and the Node browser. A request that fails the rule is never sent: the browser receives a 403 for it, and the page carries on loading its other resources. The capture still completes and returns a reference, and its `refusals` array lists every refused request with its `url`, `reason` (`scheme`, `credentials` or `private-address`) and a readable `detail`, in the order they occurred.

## Verification
Capture a public page whose markup references an image at `http://169.254.169.254/x.png` and another at a public origin. Do this once with each host's guarded driver, using a doubled network. Assert the private request was never forwarded, the public image was mirrored, and `refusals` holds exactly one `private-address` entry naming the metadata URL. Repeat with a public page whose first response redirects to `http://10.0.0.1/` and assert the hop is refused and reported.
