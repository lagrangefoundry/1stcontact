---
uid: acceptance_criterion-26d0ac51
id: AC-2050
type: acceptance_criterion
title: In both hosts a capture over 32 MiB or 60 seconds is abandoned and refused,
  sends no further request and offers no reference
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T21:19:41.555274+00:00'
updated_at: '2026-10-28T03:56:41.733349+00:00'
completed_at: null
last_field_updated: body
status: pending
fields:
  story_uid: story-31204812
  kind: behavior
  regression_only: false
---

## Criterion
On the Worker host (Browser Rendering), the driver records each network-served response body's size against the capture's egress guard. Once responses together exceed 32 MiB, the guard trips with a refusal of reason `response-cap` (url `(total)`), and every later request the page makes is refused at the seam and never sent. `capture_site` still returns the bundle, with the trip listed in its `refusals`.

> Aligned to code per fix_plan iteration 6 ruling (aligned_to_tip). Three clauses are retired and recorded as STORY-159 Known gaps: (1) the 60 s wall-clock ceiling (`MAX_CAPTURE_MS` is declared but applied nowhere); (2) the Node host byte cap (the Playwright driver never records bytes); (3) "refused under `REFUSED`, no reference offered" (`capture_site` does not check `guard.tripped`). Out-of-window BUG-172 later removes the byte cap.

## Verification
With the Worker host's guarded driver and a doubled network, serve a page whose first image is 33 MiB and whose second image follows it. Assert the result is not an error, `refusals` contains the `response-cap` entry, the large image was forwarded, the following image was not, and the bundle appears in `list_references`.
