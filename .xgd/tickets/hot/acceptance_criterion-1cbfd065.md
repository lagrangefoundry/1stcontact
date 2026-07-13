---
uid: acceptance_criterion-1cbfd065
id: AC-599
type: acceptance_criterion
title: Unpositioned wordmark stays in the flow row, unchanged
created_by: xgd
created_at: '2026-07-13T20:23:26.013715+00:00'
updated_at: '2026-07-13T20:29:23.199969+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d70a0264
  kind: behavior
  regression_only: false
---

## Criterion
A header wordmark with no position renders in the normal flow row exactly as
before, with no positioned placement and no band-coordinate values present.
Existing overlay sites are visually unchanged by this capability.

## Verification
Render a header wordmark without a position. Confirm it renders in the flow row
(no positioned placement) and the output contains no band-coordinate placement
values.