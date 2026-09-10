---
uid: acceptance_criterion-f984033f
id: AC-990
type: acceptance_criterion
title: Copy longer than the box it renders into reads back in full when the region
  is reopened
created_by: xgd
created_at: '2026-08-07T02:02:49.903722+00:00'
updated_at: '2026-09-10T17:33:35.497349+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Saving text longer than the space the rendering allots it succeeds — overflowing
copy is accepted — and reading that region back returns the **entire** string
saved, never a truncated, elided or clipped form.

Overflowing is a fact about the box the rendering allots, not about what the
region holds, so nothing about the readback depends on how much of the string
fits: an editor handed a shortened value would save the shortening back, losing
the rest of the run to a save nobody meant as an edit. Which control the answer
asks for so that a long value can be displayed whole is a separate criterion's
business; this one is about the string surviving the round trip intact.

## Verification

Save a string long enough to overrun its rendered box, then read the region back
and assert the returned value equals the saved string exactly — same length,
same characters, no ellipsis and no truncation at any boundary.
