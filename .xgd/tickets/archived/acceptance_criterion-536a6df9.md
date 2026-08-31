---
uid: acceptance_criterion-536a6df9
id: AC-902
type: acceptance_criterion
title: 'A preview URL renders its own snapshot complete: the page and every asset
  it references resolve'
created_by: xgd
created_at: '2026-08-06T18:48:16.750064+00:00'
updated_at: '2026-08-16T07:23:30.000485+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d34eccd8
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A request for a site's preview address, naming a specific deployed snapshot,
returns that snapshot's entry page with a success status and an HTML content
type. Every asset the returned markup references — stylesheet, image, font —
resolves under the same preview address with a success status and its own
correct content type. The bytes returned are the bytes that snapshot shipped,
not those of any other snapshot or revision of the same site.

## Verification

Deploy a rendered site as a preview, then drive the public entry point with the
preview URL: assert the entry-page response status, content type and body, then
extract each asset reference from the returned markup, request it relative to
the same URL, and assert each resolves successfully with the expected type and
content. Deploy a second, different snapshot for the same site and assert the
first preview URL still returns the first snapshot's bytes.