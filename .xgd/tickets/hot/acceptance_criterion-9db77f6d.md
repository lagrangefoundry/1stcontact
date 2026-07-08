---
uid: acceptance_criterion-9db77f6d
id: AC-441
type: acceptance_criterion
title: Hero bg-image variant renders a background image with the configured src and
  alt
created_by: xgd
created_at: '2026-07-08T19:20:44.897164+00:00'
updated_at: '2026-07-08T19:20:44.897164+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a224111f
  kind: behavior
  regression_only: false
---

## Criterion
Rendering the hero with the `bg-image` variant produces HTML containing a background image element whose source and alternative text match the configured image asset, in addition to the heading and subhead. (The image asset is what distinguishes this variant from `bg-color`.)

## Verification
Render the hero with variant `bg-image` and an image asset (src + alt). Assert the output contains a background image element carrying the configured src and alt values.
