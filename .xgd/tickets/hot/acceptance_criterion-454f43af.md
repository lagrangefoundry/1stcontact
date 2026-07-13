---
uid: acceptance_criterion-454f43af
id: AC-584
type: acceptance_criterion
title: Box width is exact by default while box height keeps a wrapping tolerance
created_by: xgd
created_at: '2026-07-13T20:00:40.071393+00:00'
updated_at: '2026-07-13T20:09:23.495414+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-dadb8475
  kind: behavior
  regression_only: false
---

## Criterion
The combined size axis is split into width and height with independent
tolerances. By default, a box-width difference greater than 1px produces a size
delta, whereas a box-height difference within the documented wrapping tolerance
(8px or less) produces no size delta; a height difference beyond that tolerance
still produces a size delta. A real width gap therefore cannot be masked by the
allowance that height legitimately needs.

## Verification
Compare three reference/reproduction pairs by default: (a) width differs by 4px,
height identical — assert a size delta is reported; (b) height differs by 6px,
width identical — assert no size delta; (c) height differs by 20px, width
identical — assert a size delta is reported.