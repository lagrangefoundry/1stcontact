---
uid: acceptance_criterion-e1acae35
id: AC-973
type: acceptance_criterion
title: The workspace shows the display panel beside a secondary pane with a divider
  that drags, collapses to a rail and reopens to its previous width
created_by: xgd
created_at: '2026-08-07T01:44:49.802647+00:00'
updated_at: '2026-08-10T07:28:17.826752+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The tab's content is split between the display panel and a secondary pane (the
assistant panel), separated by a divider the operator can drag to change their
relative widths. The secondary pane collapses to a narrow rail, and reopening it
restores the width it had before it was collapsed — not a default width.

The criterion is about the split's two halves, not about what fills the second:
it held when the secondary pane was a placeholder and it holds now that the
pane hosts a live assistant. What that pane *does* is a separate capability and
is not asserted here.

## Verification

Mount the workspace and assert both panes are present with the display panel as
the primary and the assistant panel occupying the secondary side. Drag the
divider to a new position and assert the widths change accordingly; collapse the
secondary side and assert it renders as a rail; reopen it and assert the
restored width equals the width recorded before the collapse, not the initial
default.
