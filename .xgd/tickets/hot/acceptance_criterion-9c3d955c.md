---
uid: acceptance_criterion-9c3d955c
id: AC-2528
type: acceptance_criterion
title: A delivery rendition is served immutable for a year; every other published
  byte keeps its existing caching
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T06:20:54.679741+00:00'
updated_at: '2026-11-09T06:20:54.679741+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d34eccd8
  kind: behavior
  regression_only: false
---

## Criterion

A request for a published site's delivery rendition — any path under the site's
derived-assets segment, `assets/d/` — is served with
`cache-control: public, max-age=31536000, immutable`, because its name is its
content and can never change meaning.

The requested path decides. Every other published byte keeps the short public
lifetime: the original picture under `assets/`, every other asset, every page,
and a page reached through the extensionless clean-URL fallback. A chrome-bearing
page keeps its private policy.

## Verification

Publish a site with a laddered picture. Request one rendition under `assets/d/`
and assert the year-long immutable header. Request the original picture, the
entry page and a clean-URL page, and assert each carries the short lifetime and
no `immutable`.
