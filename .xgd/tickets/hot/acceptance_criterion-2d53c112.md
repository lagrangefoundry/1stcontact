---
uid: acceptance_criterion-2d53c112
id: AC-2051
type: acceptance_criterion
title: Every capture_site call leaves one audit record carrying the requested URL;
  a typed-address refusal reaches the model as REFUSED naming the address, and a mid-capture
  refusal reaches it in the result's refusals
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T21:19:48.094902+00:00'
updated_at: '2026-10-30T20:03:08.198041+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-31204812
  kind: behavior
  regression_only: false
---

## Criterion
Every `capture_site` call leaves exactly one audit record from the assistant's tool runner, whether it is refused, succeeds cleanly, or completes with requests refused mid-capture. The record names the operation `capture_site` and carries the requested `url` exactly as the model supplied it. Its outcome is not ok for a refusal of the typed address and ok for a capture that returned a reference.

A refusal of the typed address reaches the model as the surface's declared `REFUSED` error. Its text names the address and tells the model this is a boundary: do not retry it, and do not try to reach the same place by another spelling.

A request refused at the driver seam during a capture (for example, a subresource in link-local space) does not fail the call. It reaches the model in the result's `refusals` with its `url` and reason. The call's audit record is the one record for that call, carrying the typed URL and an ok outcome.

> Narrower than REQ-157 AC6 ("each refusal is journalled with the URL"). A mid-capture refusal's own URL is **not** carried in the audit record, because `capture_site` declares no `summary` projection and the record holds only params and outcome. This is an intent–code conflict recorded in STORY-159 Reconciliation Decisions and Known gaps 7, and tracked by BUG-315 (bug-84072362). When BUG-315 lands, this AC should require the refused URL in the audit record.

## Verification
Through the real Toolbox with an audit sink:
1. Call `capture_site` with `http://10.0.0.1/admin`. Assert the answer the model receives carries `REFUSED` and the address. Assert that exactly one `capture_site` audit record exists, with `params.url === 'http://10.0.0.1/admin'` and a not-ok outcome.
2. Repeat with a successful public capture. Assert one record with that URL and an ok outcome.
3. Capture a public page that references an image at `http://169.254.169.254/x.png`. Assert that the result's `refusals` names that URL with reason `private-address` and that the request never reached the network. Assert that exactly one further `capture_site` audit record exists, carrying the typed page URL and an ok outcome. In total there are three records, one per call.
