---
uid: acceptance_criterion-4ff0040f
id: AC-2564
type: acceptance_criterion
title: 'A multi-MB stored photograph (far past the old data: URL limit) is screenshotted;
  the navigated address is a constant-length shell independent of picture size'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T21:56:30.083564+00:00'
updated_at: '2026-11-09T21:56:30.083564+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
A stored picture whose bytes far exceed the old ≈1.1 MB `data:` URL limit — an ordinary multi-megabyte camera JPEG, e.g. 12 MB — is returned by `screenshot` as an image, the same as a small one. The address the browser is navigated to for a stored picture is the same short, constant-length shell page whatever the picture's size; the picture's bytes reach the browser afterwards, delivered directly in bounded pieces (no single piece larger than a fixed size), and the browser fetches nothing.

## Verification
With a recording fake browser (BUG-80): screenshot a stored non-PNG picture of several MB (well past 1.1 MB) and assert a PNG image comes back; the one navigated address is short (a few hundred characters) and identical to the one navigated for a tiny picture; the picture's bytes arrive in more than one delivery, each no larger than the fixed piece size, and their concatenation is the picture's base64; no request is made for any picture address.
