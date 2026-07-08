---
uid: acceptance_criterion-a87a8133
id: AC-424
type: acceptance_criterion
title: Platform identifiers are normalized to the 1stcontact name
created_by: xgd
created_at: '2026-07-08T19:04:50.274963+00:00'
updated_at: '2026-07-08T19:04:50.274963+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0ceaf24d
  kind: behavior
  regression_only: false
---

## Criterion
The platform's code identifiers use the `1stcontact` name: both Worker names are prefixed `1stcontact-` (`1stcontact-public-site`, `1stcontact-control-app`), and the seed site definition directory is `sites/1stcontact/`. No `first-contact` identifier remains in worker names or the site directory path.

## Verification
Inspect both Workers' deployment configs and the site-definition directory layout and assert the worker names carry the `1stcontact-` prefix and the site directory is `sites/1stcontact/`, with no `first-contact` identifier present.
