---
uid: acceptance_criterion-7d84d8cb
id: AC-1255
type: acceptance_criterion
title: Every write hands its change count back, including the ones whose answer is
  an asset
created_by: xgd
created_at: '2026-08-20T02:26:52.380598+00:00'
updated_at: '2026-08-20T02:46:18.419948+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-6cd17452
  kind: behavior
  regression_only: false
---

## Criterion

**Every** write hands its resulting change count back, regardless of the shape of its answer — including the writes whose answer is the asset they produced (registering an image, generating an image) rather than a description of a change.

The change count is declared as a returned value on every write-shaped answer in the assistant's projected manual, so it is a field the assistant is told about rather than one it must discover.

## Verification

For each distinct write shape on the surface — a copy change, a page-level change, a settings change, a palette change, an image registration and an image generation — assert the answer carries a change count and that the count is one greater than the count before it.

Assert the projected manual describes the returned change count on each of those answer shapes.