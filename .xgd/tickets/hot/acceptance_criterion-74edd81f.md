---
uid: acceptance_criterion-74edd81f
id: AC-2009
type: acceptance_criterion
title: A site definition validates with or without the retired assets key, and nothing
  reads it
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-26T01:10:52.807769+00:00'
updated_at: '2026-10-26T01:10:52.807769+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-c46abfa6
  kind: behavior
  regression_only: false
---

## Criterion

A site definition validates both with and without a site-level `assets` key. A
stored definition that still carries the retired key — empty or populated — is
accepted unchanged rather than refused, so no existing site breaks, and nothing
reads it: what it lists has no effect on the asset listing, on reading an asset,
on rendering or on publishing.

## Verification

Validate a site definition with no `assets` key and the same definition carrying
a populated legacy `assets` array; assert both are accepted. For a site whose
stored definition carries the legacy key naming a file the store does not hold,
assert the asset listing and a read of that name answer exactly as they do for
the same site without the key.
