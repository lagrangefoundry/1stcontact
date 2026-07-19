---
uid: acceptance_criterion-377af866
id: AC-637
type: acceptance_criterion
title: A text-block authored with a gradient panel renders a padded, rounded panel
  with that gradient surface
created_by: xgd
created_at: '2026-07-19T02:28:47.534345+00:00'
updated_at: '2026-07-19T02:28:47.534345+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-82eb6908
  kind: behavior
  regression_only: false
---

## Criterion
When a text-block section is authored with a gradient panel value (a direction plus two or more colour stops), its content renders inside a padded, rounded, inset panel whose background is the specified linear gradient — direction and colours as authored — superseding the section's solid panel treatment. Each stop colour is resolved as either an absolute hex literal or a palette-role alias.

## Verification
Render a text-block whose content declares a gradient panel with a direction and two stops (one an absolute hex, one a palette role). Assert the rendered content panel has a linear-gradient background carrying the resolved direction and stop colours, and is laid out as a padded, rounded, inset panel (not a flat, full-bleed band).
