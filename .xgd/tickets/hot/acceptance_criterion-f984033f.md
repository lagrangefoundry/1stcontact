---
uid: acceptance_criterion-f984033f
id: AC-990
type: acceptance_criterion
title: Copy longer than the box it renders into reads back in full when the region
  is reopened
created_by: xgd
created_at: '2026-08-07T02:02:49.903722+00:00'
updated_at: '2026-08-07T02:12:04.330127+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
---

## Criterion

Saving text longer than the space the rendering allots it succeeds — overflowing
copy is accepted — and reading that region back returns the **entire** string
saved, never a truncated, elided or clipped form, together with a request for a
control able to display it in full.

## Verification

Save a string long enough to overrun its rendered box, then read the region back
and assert the returned value equals the saved string exactly, and that the
multi-line control is requested.