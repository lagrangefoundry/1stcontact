---
uid: acceptance_criterion-e1acae35
id: AC-973
type: acceptance_criterion
title: The workspace shows the display panel beside a secondary pane with a divider
  that drags, collapses to a rail and reopens to its previous width
created_by: xgd
created_at: '2026-08-07T01:44:49.802647+00:00'
updated_at: '2026-08-07T21:19:44.704383+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The tab's content is split between the display panel and a secondary pane
(currently a placeholder for the assistant), separated by a divider the operator
can drag to change their relative widths. The secondary pane collapses to a
narrow rail, and reopening it restores the width it had before it was collapsed
— not a default width.

## Verification

Mount the workspace and assert both panes are present with the display panel as
the primary. Drag the divider to a new position and assert the widths change
accordingly; collapse the secondary side and assert it renders as a rail;
reopen it and assert the restored width equals the width recorded before the
collapse, not the initial default.