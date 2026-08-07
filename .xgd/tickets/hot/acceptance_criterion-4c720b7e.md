---
uid: acceptance_criterion-4c720b7e
id: AC-968
type: acceptance_criterion
title: Switching modes changes what is displayed without rebuilding the pane
created_by: xgd
created_at: '2026-08-07T01:44:27.749421+00:00'
updated_at: '2026-08-07T01:58:18.181569+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

Switching between the panel's modes changes the document the pane displays.
The pane and the display surface within it are the same elements before and
after the switch, and after switching back — the switch is a change of source,
not a teardown and remount of the surrounding layout.

## Verification

Mount the workspace with two modes registered, capture references to the pane
element and the display surface, switch mode, switch back, and assert both
references are still the live, attached elements. Assert the displayed URL
changed with each switch, so the identity check is not passing on a switch that
did nothing.