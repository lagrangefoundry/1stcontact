---
uid: acceptance_criterion-c67887d3
id: AC-597
type: acceptance_criterion
title: Overlay header wordmark shares the hero coordinate space
created_by: xgd
created_at: '2026-07-13T20:23:20.540284+00:00'
updated_at: '2026-07-13T20:29:23.378257+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d70a0264
  kind: behavior
  regression_only: false
---

## Criterion
When the overlay-header text wordmark carries a position, it is lifted out of
the header flow row and placed by the same band-coordinate model against a
full-band header chrome, so it can sit anywhere over the hero (e.g. lower-left)
while the navigation stays in its normal place. The wordmark text is preserved.

## Verification
Render an overlay header whose wordmark carries a position (e.g. x=6, y=62).
Confirm the wordmark is rendered as a positioned object (lifted from the flow
row) with band-coordinate placement values (`x → 6%`, `y → 62%`) and its text
intact, while the nav remains in place.