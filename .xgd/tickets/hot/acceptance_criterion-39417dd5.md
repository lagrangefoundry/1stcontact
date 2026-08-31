---
uid: acceptance_criterion-39417dd5
id: AC-1393
type: acceptance_criterion
title: An asset name that leaves the site's assets namespace reads as absent and writes
  nothing, while the rest of the change lands
created_by: xgd
created_at: '2026-08-31T09:47:51.558121+00:00'
updated_at: '2026-08-31T10:04:13.404310+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-fde7370b
  kind: behavior
  regression_only: false
---

## Criterion

An asset name that would leave the site's own assets namespace is confined, and confined the same
way in both directions:

- **Reading** such a name reports absence — the same answer the filesystem store gives — rather
  than a different failure per store, and never content from outside the site's assets.
- **Writing** such a name stores nothing under it: afterwards no asset by that name is listed and
  no bytes are reachable through it. The rest of the same change still lands, because a whole
  change is one call and discarding a caller's other edits over one malformed name would lose
  work the caller had every right to expect.

Names treated this way include any carrying a directory separator (either kind) and any that is or
begins with a parent-directory step.

## Verification

Read assets named with a parent-directory step and with an embedded separator, and observe the
absence report in each case — including when a real file of that name exists outside the assets
namespace. Then apply one change that writes a well-formed asset alongside an unsafe-named one:
afterwards the well-formed asset is listed and readable, and the unsafe name appears in no listing
and reads as absent.