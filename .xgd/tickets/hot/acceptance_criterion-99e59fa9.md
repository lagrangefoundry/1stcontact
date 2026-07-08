---
uid: acceptance_criterion-99e59fa9
id: AC-418
type: acceptance_criterion
title: public-site claims apex and wildcard subdomain routes in production
created_by: xgd
created_at: '2026-07-08T19:04:33.728404+00:00'
updated_at: '2026-07-08T19:04:33.728404+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0ceaf24d
  kind: behavior
  regression_only: false
---

## Criterion
The public-site Worker's production deployment configuration declares two routes on the `1stcontact.io` zone: the apex pattern `1stcontact.io/*` (the marketing site) and the wildcard pattern `*.1stcontact.io/*` (customer sites addressed by slug subdomain). Both routes target the same Worker.

## Verification
Parse the public-site production deployment config and assert both route patterns (`1stcontact.io/*` and `*.1stcontact.io/*`) are present and bound to the `1stcontact.io` zone.
