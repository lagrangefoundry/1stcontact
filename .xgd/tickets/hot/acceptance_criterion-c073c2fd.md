---
uid: acceptance_criterion-c073c2fd
id: AC-2523
type: acceptance_criterion
title: Publishing writes a width ladder of each raster picture into the revision's
  rendered output, through the Images binding, during the publish
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T06:20:43.033712+00:00'
updated_at: '2026-11-09T06:20:43.033712+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-5349d01f
  kind: behavior
  regression_only: false
---

## Criterion

On a deployment with the Images binding, publishing a revision whose assets
include a raster still (JPEG, PNG, WebP or AVIF) writes, during that publish, a
width ladder of renditions of that picture into the revision's own rendered
output, under the site's derived-assets path (`assets/d/`). Each rendition keeps
its source's format. None is written into the revision's frozen definition, so
checking that revision out restores no rendition. Nothing is resized when a
visitor requests a page.

The ladder is chosen by walking the revision's assets, not the document: a
picture placed only as a background gets renditions exactly as one placed as an
image does.

A picture that is not a raster still (an SVG, a GIF), or whose bytes cannot be
measured, gets no ladder, and the publish still succeeds with that picture served
as it is. A single width that fails to render is left out; the rest of that
picture's ladder, and the publish, stand.

## Verification

With a fake image renderer standing in for the binding, publish a site holding a
wide JPEG, an SVG, a GIF and a file named as a PNG that cannot be decoded. Assert
the publish succeeds; that the revision's rendered output holds JPEG renditions
under `assets/d/` for the JPEG and none for the other three; that the frozen
definition holds no `assets/d/` entry; and that a site whose only picture is a
background still gets renditions. Make the renderer fail one width and assert
only that width is missing.
