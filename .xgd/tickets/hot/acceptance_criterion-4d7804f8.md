---
uid: acceptance_criterion-4d7804f8
id: AC-916
type: acceptance_criterion
title: On the deployed site, an extensionless page URL serves the page on both addressing
  forms and for header-only requests
created_by: xgd
created_at: '2026-08-06T19:02:27.941222+00:00'
updated_at: '2026-08-07T22:31:28.537271+00:00'
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
deployed site: under a snapshot-addressed preview URL, under a published site
URL, and for header-only requests as well as full ones. A header-only request
returns the same status and declared type as the full request, reports a non-zero
length, and carries no body.

## Verification

Deploy a rendered multi-page site, both as a preview snapshot and as a published
revision. Request the slug-only path on each addressing form and assert a success
status with the page's unique content. Repeat the preview request header-only and
assert the same status, an HTML content type, a positive declared length, and an
empty body.