---
uid: acceptance_criterion-c3f1ce13
id: AC-478
type: acceptance_criterion
title: An image background renders text legibly over the image via three stacked layers
created_by: xgd
created_at: '2026-07-09T20:34:40.492251+00:00'
updated_at: '2026-07-09T20:34:40.492251+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6af935e7
  kind: behavior
  regression_only: false
---

## Criterion
A module carrying an image background with an overlay renders as three stacked layers in back-to-front DOM order: (1) a background layer that references the declared image asset, (2) an overlay layer carrying the declared overlay opacity, (3) a content layer containing the module's own markup. The module's text therefore appears above both the image and the overlay, so content stays legible over the imagery.

## Verification
Render a module that has an image background with an overlay. Assert the rendered output contains, in order, a background layer referencing the declared asset, an overlay layer whose opacity matches the declared value, and a content layer containing the module's text — with the background appearing before the overlay and the overlay before the content in the markup.
