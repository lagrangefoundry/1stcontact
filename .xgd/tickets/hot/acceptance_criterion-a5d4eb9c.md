---
uid: acceptance_criterion-a5d4eb9c
id: AC-1006
type: acceptance_criterion
title: The browser runs one implementation of the click-to-address resolution, delivered
  from the same source the rendering's stamping is defined against
created_by: xgd
created_at: '2026-08-07T02:17:14.258807+00:00'
updated_at: '2026-08-07T02:17:14.258807+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
---

## Criterion

The logic that turns a clicked element back into a region address reaches the
browser as the same single source the rendering's address stamping is defined
against, delivered as a runnable browser module by the workspace's origin, with
its shared-contract import resolved to a fetchable address. No second,
independently written copy of that logic exists in the workspace's own browser
source, so the reader of the markup cannot drift from the writer of it.

## Verification

Fetch the module the workspace's browser code loads for address resolution and
assert it exposes the same operations as the source the renderer is built
against and carries no build-time-only syntax; assert its contract import
resolves to an address the origin serves. Search the workspace's browser source
and assert no separate implementation of address resolution is present.
