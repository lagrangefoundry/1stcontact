---
uid: acceptance_criterion-48d1ea8e
id: AC-1424
type: acceptance_criterion
title: The builder's published view redirects here, so published bytes have exactly
  one serving path
created_by: xgd
created_at: '2026-08-31T11:53:20.122847+00:00'
updated_at: '2026-08-31T11:53:20.122847+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d34eccd8
  kind: behavior
  regression_only: false
---

## Criterion

Published bytes have exactly one serving path. A request to the builder's
published view for a site returns a redirect to that site's address on the
public server, carrying any path beneath it across unchanged; the builder never
returns those bytes itself and never re-derives them from the current draft,
which would show unpublished work at a published address.

The accepted cost is that a site which has never published answers with the
public server's ordinary not-found rather than a builder-shaped message.
Proxying instead would duplicate the resolve-and-serve rules this story owns.

## Verification

Publish a site, then request the builder's published view for it and assert a
redirect status and a location that is exactly that site's public address, with
a path beneath the view appearing beneath the public address. Follow the
redirect and assert the published revision is served. Request the builder's
published view for a site that has never published and assert the visitor
receives the public server's not-found.
