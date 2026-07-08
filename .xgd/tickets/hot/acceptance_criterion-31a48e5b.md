---
uid: acceptance_criterion-31a48e5b
id: AC-444
type: acceptance_criterion
title: Footer renders an optional link row with one link per provided entry
created_by: xgd
created_at: '2026-07-08T19:20:53.250035+00:00'
updated_at: '2026-07-08T19:20:53.250035+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a224111f
  kind: behavior
  regression_only: false
---

## Criterion
The footer's small-link row is optional: when a list of link entries is provided, the rendered footer includes a navigable link for each entry (one anchor per entry pointing at its target); when no links are provided, no link row is rendered.

## Verification
Render the footer once with two or more link entries and assert one link per entry with the correct targets appears; render again without links and assert no link row is present.
