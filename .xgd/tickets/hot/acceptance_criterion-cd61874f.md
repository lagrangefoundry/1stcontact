---
uid: acceptance_criterion-cd61874f
id: AC-1020
type: acceptance_criterion
title: Every listed asset is named in the same site-local handle form a page already
  holds
created_by: xgd
created_at: '2026-08-07T04:29:45.354526+00:00'
updated_at: '2026-10-26T01:09:52.130153+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-c46abfa6
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Every entry's handle is the single site-local reference form a page already uses
to point at an asset (`/assets/<name>`), whatever path form the store holds the
file under. A handle read from the listing can be written straight into a page's
picture element with no translation step. Entries are ordered by handle, so the
same site yields the same order on every call.

## Verification

Seed a site's asset store with several files and ask for its assets. Assert each handle is the
`/assets/<name>` form, that one stored file yields exactly one entry, and that the
entries are in handle order across repeated calls.
