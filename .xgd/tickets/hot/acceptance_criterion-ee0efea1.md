---
uid: acceptance_criterion-ee0efea1
id: AC-2244
type: acceptance_criterion
title: A published URL is /site/<siteId>/, the site's own key; a key for another business
  is not obtainable through the handle
created_by: xgd
created_at: '2026-11-04T16:01:50.668658+00:00'
updated_at: '2026-11-04T16:01:50.668658+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-d34eccd8
  kind: behavior
  regression_only: false
---

## Criterion

A published site is served at `/site/<siteId>/`, where the segment is the site's **opaque key**: the same value the database joins on, not the slug the operator calls the site. Requesting the site's slug in that position answers the same plain not-found as any other unknown address. Two businesses that both have a site whose slug is `home` and both publish it are served at two different keys, each showing its own content.

The operator side learns a site's key only by asking **its own business's store handle** for it by slug. Asking a handle for a slug held only by another business answers no key. Accordingly, the builder's published view for a slug the business does not hold answers not-found, and for a slug it does hold redirects to that site's key-addressed published URL.

## Verification

Publish a site and assert `/site/<siteId>/` serves its live revision and `/site/<slug>/` answers not-found. Publish `home` in two businesses and assert each key serves its own page. Assert a business's handle answers no key for a slug only another business holds, and that the builder's published view 404s for it and redirects to `/site/<siteId>/` for a held slug.