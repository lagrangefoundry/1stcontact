---
uid: acceptance_criterion-8d648b73
id: AC-915
type: acceptance_criterion
title: In local preview, an extensionless page URL serves the page rendered for that
  slug, as HTML
created_by: xgd
created_at: '2026-08-06T19:02:23.345634+00:00'
updated_at: '2026-08-07T22:18:31.896664+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-66115f6b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

When a site is served for local preview, requesting a page by its slug alone —
no file extension — succeeds and returns that page's rendered markup with an
HTML content type, even though the rendered file carries a `.html` name.

## Verification

Serve a rendered site containing a page whose slug is not `index`. Request the
slug-only path over the preview server's real address. Assert a success status,
that the body contains content unique to that page, and that the declared
content type is HTML.