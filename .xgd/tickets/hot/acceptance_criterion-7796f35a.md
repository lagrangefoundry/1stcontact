---
uid: acceptance_criterion-7796f35a
id: AC-1770
type: acceptance_criterion
title: A store lists, in sorted order, exactly the bundles that hold something
created_by: martin-github@westhead.me
created_at: '2026-09-14T04:49:14.204108+00:00'
updated_at: '2026-09-14T04:49:14.204108+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0cb7f25b
  kind: behavior
  regression_only: false
---

## Criterion
Asking a store what bundles it holds yields their names, sorted, and nothing else:

- a bundle that has been written to appears, named `<host>/<path-slug>`
- merely taking a handle on a bundle that has never been written does **not** make
  it appear — taking a handle is free and total, because a capture's first act is
  to write into a bundle that does not yet exist
- an empty or entirely absent store lists nothing, rather than failing
- on the operator's tree specifically, only two-segment `<host>/<slug>` pairs are
  bundles: a loose file sitting at the references root and a bare host directory
  with no captures under it are not listed

## Verification
Against each backing: list an empty store and assert it is empty; take a handle
without writing and assert the listing is still empty; write into two bundles and
assert both names appear in sorted order. On the filesystem backing additionally
place a loose file at the references root and an empty host directory, and assert
neither is listed.
