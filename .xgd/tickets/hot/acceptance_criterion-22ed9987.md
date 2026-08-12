---
uid: acceptance_criterion-22ed9987
id: AC-1114
type: acceptance_criterion
title: A tile shows the bytes the origin actually serves, resolved as the page resolves
  its own images, with no new endpoint and no copy
created_by: xgd
created_at: '2026-08-12T16:23:57.769931+00:00'
updated_at: '2026-08-12T16:23:57.769931+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
---

## Criterion

A tile shows the **picture itself** — the bytes the origin actually serves for
that handle — rather than a stand-in for it. The address a tile loads its
thumbnail from is resolved the same way the page being edited resolves its own
image sources, so a handle that is local to the site is read against the same
channel that serves the page, and what the operator sees in the grid is what the
page will show.

This costs **no new endpoint and copies no asset**. The thumbnail is served
through the channel already serving the page under edit; nothing is resized,
re-encoded or duplicated to populate the grid.

A handle that already names its own origin is used **exactly as it stands** and
is not rewritten into a site-local address, which would resolve to nothing. A
handle that is empty or blank names no image and resolves to nothing at all
rather than to the site's own root.

## Verification

Over an editable rendering served by the workspace origin, open the picker for an
image region and take the tile for a known site-local image. Assert the address
its thumbnail loads from resolves, against the page's own location, to a URL on
the same origin, and that fetching it succeeds and returns that asset's own bytes
unchanged. Assert no route outside those already serving the page under edit is
requested. Then assert a tile for a handle given as a complete off-site URL
carries that URL verbatim.
