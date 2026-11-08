---
uid: acceptance_criterion-23963e43
id: AC-2489
type: acceptance_criterion
title: .gif and .avif site assets resolve to image/gif and image/avif content types
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T23:03:39.780147+00:00'
updated_at: '2026-11-08T23:03:39.780147+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
A site asset with a `.gif` or `.avif` extension is served and listed with its proper image content type — `image/gif` and `image/avif` respectively — rather than as raw bytes, so it is treated as a picture everywhere the content type is consulted (including the `image` picture kind, which hands that type to the browser).

## Verification
Write `anim.gif` and `photo.avif` as site assets and assert the content type reported for each (asset serving through the preview channel, and the stored-picture listing) is `image/gif` and `image/avif`, not `application/octet-stream`.
