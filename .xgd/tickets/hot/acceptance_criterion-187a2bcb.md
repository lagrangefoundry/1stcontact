---
uid: acceptance_criterion-187a2bcb
id: AC-2013
type: acceptance_criterion
title: An asset-reference value is still accepted in a background and a layer child
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-26T01:11:11.836461+00:00'
updated_at: '2026-10-26T01:11:11.836461+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-c46abfa6
  kind: behavior
  regression_only: false
---

## Criterion

Retiring the site-level registry does not retire the asset-reference value: a
background value and a layer child that carry an asset-reference object are
still accepted by the site schema, exactly as before.

## Verification

Validate a section background and a layer child each carrying an asset-reference
object; assert both are accepted.
