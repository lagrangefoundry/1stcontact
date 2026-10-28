---
uid: acceptance_criterion-2d53c112
id: AC-2051
type: acceptance_criterion
title: Every capture_site call leaves one audit record carrying the requested URL,
  and a refusal reaches the model as REFUSED naming the address
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T21:19:48.094902+00:00'
updated_at: '2026-10-28T04:07:35.357760+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-31204812
  kind: behavior
  regression_only: false
---

## Criterion
Every `capture_site` call, refused or not, leaves one audit record from the assistant's tool runner. The record names the operation `capture_site`, carries the requested `url` exactly as the model supplied it, and records the outcome (not ok for a refusal). A refusal reaches the model as the surface's declared `REFUSED` error, whose text names the address and tells the model this is a boundary: do not retry it and do not try to reach the same place by another spelling.

## Verification
Through the real Toolbox with an audit sink, call `capture_site` with `http://10.0.0.1/admin`. Assert the answer the model receives carries `REFUSED` and the address, and that exactly one `capture_site` audit record exists with `params.url === 'http://10.0.0.1/admin'` and a not-ok outcome. Repeat with a successful public capture and assert one record with that URL and an ok outcome.