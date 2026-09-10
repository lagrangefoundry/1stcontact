---
uid: acceptance_criterion-4d7804f8
id: AC-916
type: acceptance_criterion
title: On the deployed site, an extensionless page URL serves the page, for full and
  header-only requests
created_by: xgd
created_at: '2026-08-06T19:02:27.941222+00:00'
updated_at: '2026-09-10T16:56:10.898231+00:00'
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

The same slug-only URL that works in local preview also serves the page from a
deployed site: under the published site URL, and for header-only requests as
well as full ones. A header-only request returns the same status and declared
type as the full request, reports a non-zero length, and carries no body.

## Verification

Publish a rendered multi-page site. Request the slug-only path on the published
site and assert a success status with the page's unique content. Repeat the
request header-only and assert the same status, an HTML content type, a positive
declared length, and an empty body.