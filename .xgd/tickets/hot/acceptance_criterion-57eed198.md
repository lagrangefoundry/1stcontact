---
uid: acceptance_criterion-57eed198
id: AC-1459
type: acceptance_criterion
title: A screenshot request returns PNG bytes at the named viewport preset, from inside
  the deployed runtime
created_by: xgd
created_at: '2026-08-31T22:53:27.440766+00:00'
updated_at: '2026-08-31T23:04:43.047576+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-080c6036
  kind: behavior
  regression_only: false
---

## Criterion

Asking the deployed runtime to photograph a reachable URL at one of the three
named viewport presets returns the bytes of a full-page PNG image. The preset
names and their dimensions are `mobile` (375x667), `tablet` (768x1024) and
`desktop` (1280x800); requesting a preset applies that preset's dimensions, and
the returned bytes are an actual PNG, not an error document.

Omitting a preset yields `desktop`.

## Verification

Run inside the same runtime the deployment uses. Request a screenshot of a URL
at each preset and assert on the returned value:

- the first eight bytes are the PNG file signature, so a returned HTML error
  page (which is also "some bytes") cannot pass;
- the dimensions actually applied to the page before the image was produced are
  the requested preset's, at the requested preset's width;
- a request that names no preset behaves as `desktop`.