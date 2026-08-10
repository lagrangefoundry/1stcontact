---
uid: acceptance_criterion-37a212b2
id: AC-1102
type: acceptance_criterion
title: Describing a page reports the components already on it with their configuration
created_by: xgd
created_at: '2026-08-10T09:34:23.163166+00:00'
updated_at: '2026-08-10T09:34:23.163166+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-b3de4571
  kind: behavior
  regression_only: false
---

## Criterion
A page description lists each component instance on that page with its name, its kind, its version, the seam it is mounted at (or none), and its current configuration — alongside the page's element map.

## Verification
Add a component to a page, then describe the page: the response contains an entry for that instance carrying its name, kind and the configuration it was created with. Describe a page with no components: the component list is present and empty.
