---
uid: acceptance_criterion-deaf5983
id: AC-419
type: acceptance_criterion
title: control-app claims the reserved app subdomain route that outranks the wildcard
created_by: xgd
created_at: '2026-07-08T19:04:36.437672+00:00'
updated_at: '2026-07-08T19:04:36.437672+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0ceaf24d
  kind: behavior
  regression_only: false
---

## Criterion
The control-app Worker's production deployment configuration declares the route `app.1stcontact.io/*` on the `1stcontact.io` zone. Because this pattern is more specific than public-site's `*.1stcontact.io/*` wildcard, requests to `app.1stcontact.io` reach control-app rather than public-site — i.e. `app` behaves as a reserved slug.

## Verification
Parse the control-app production deployment config and assert the `app.1stcontact.io/*` route is present on the `1stcontact.io` zone and is strictly more specific than the public-site wildcard it must override.
