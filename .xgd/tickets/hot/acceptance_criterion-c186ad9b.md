---
uid: acceptance_criterion-c186ad9b
id: AC-501
type: acceptance_criterion
title: Header overlay variant is composited over the following section as one continuous
  image band
created_by: xgd
created_at: '2026-07-09T21:09:56.838650+00:00'
updated_at: '2026-07-09T21:09:56.838650+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a224111f
  kind: behavior
  regression_only: false
---

## Criterion
The `header` module supports an `overlay` variant: transparent chrome (no surface fill, no bottom border) that is not rendered as its own band. Instead the render pipeline floats the overlay header across the top of the immediately-following module's band, so the header and the next section (e.g. a hero `bg-image` or any module carrying a section background) share one continuous background image band, with the header's content legible over the shared image (reusing the section-background overlay mechanism). The header stays first in reading order, and an overlay header with no following band is still rendered rather than dropped.

## Verification
Render a page whose first module is a `header` with variant `overlay` followed by a module supplying a background image. Assert the output composites the header over that following band as one shared band (a single positioning wrapper containing the transparent header plus the following section's background), the header markup precedes the section content in the DOM, and no separate stacked header band is emitted. Render an overlay header with no following module and assert it still renders.
