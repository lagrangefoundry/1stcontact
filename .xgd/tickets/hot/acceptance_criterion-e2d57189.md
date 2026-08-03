---
uid: acceptance_criterion-e2d57189
id: AC-742
type: acceptance_criterion
title: No visible run is measured against a fallback face, including content revealed
  only after the page settles
created_by: xgd
created_at: '2026-08-03T00:24:42.012857+00:00'
updated_at: '2026-08-03T00:53:41.111997+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-244827df
  kind: behavior
  regression_only: false
---

## Criterion
Values are extracted only after the faces the page actually paints with have
resolved. This holds for runs revealed by the capture's own settling pass (the
scroll that triggers lazy and below-the-fold content), not only for content
visible at first paint: no visible run in the capture reports having been
measured against a substitute face when its intended face is available.

A face that genuinely never resolves (a missing or failing font file) is
reported honestly as not loaded, and cannot stall or fail the capture.

## Verification
Capture a fixture page with a non-default-weight web font used by one
above-the-fold and one below-the-fold heading: no visible run reports a fallback
face, and the recorded glyph metrics correspond to the intended face rather than
the system fallback. Separately, capture a page whose font file cannot be
retrieved: the capture completes within its normal time and the affected run is
recorded as not having loaded its face.