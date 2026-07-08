---
uid: acceptance_criterion-05952d09
id: AC-448
type: acceptance_criterion
title: services-grid renders one card per provided item
created_by: xgd
created_at: '2026-07-08T19:28:57.029126+00:00'
updated_at: '2026-07-08T19:28:57.029126+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-903e3e3a
  kind: behavior
  regression_only: false
---

## Criterion
A services-grid section renders exactly one card per item in its `items` list, for both the `three-col` and `two-col` variants. Each card renders its item title and markdown body, with optional icon and CTA when provided.

## Verification
Render a three-col grid with three items and assert three cards each showing the item's title and body; render a two-col grid with two items and assert two cards.
