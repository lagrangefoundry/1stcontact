---
uid: acceptance_criterion-cd61874f
id: AC-1020
type: acceptance_criterion
title: Every listed asset is named in the same site-local handle form a page already
  holds
created_by: xgd
created_at: '2026-08-07T04:29:45.354526+00:00'
updated_at: '2026-08-07T04:36:50.453944+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-c46abfa6
  kind: behavior
  regression_only: false
---

## Criterion

Every entry's handle is the single site-local reference form a page already uses
to point at an asset, regardless of how its source named it: a bare filename in
the site definition and an already-qualified path from a capture both normalise to
the same handle, and therefore merge into one entry rather than appearing twice.
A handle read from the listing can be written straight into a page with no
translation step. Entries are ordered by handle, so the same site yields the same
order on every call.

## Verification

Declare an asset by bare filename in a site whose asset directory holds the same
file under the qualified form, then ask for the site's assets. Assert one entry,
not two, and that its handle is the qualified site-local form. Assert the returned
entries are in handle order.