---
uid: acceptance_criterion-914a8f35
id: AC-445
type: acceptance_criterion
title: text-block renders its markdown body to HTML with lazy-loaded images
created_by: xgd
created_at: '2026-07-08T19:28:49.234176+00:00'
updated_at: '2026-07-08T19:28:49.234176+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-903e3e3a
  kind: behavior
  regression_only: false
---

## Criterion
A text-block section renders its required markdown `body` into HTML, supporting at least headings, lists, links, and images. Images in the rendered output carry lazy-loading (`loading="lazy"` with `decoding="async"`) unless the source already specifies a loading attribute.

## Verification
Render a text-block whose body contains a heading, a list, a link, and an image; assert the output HTML contains the corresponding list markup, an anchor for the link, and an image tag bearing `loading="lazy"`.
