---
uid: acceptance_criterion-4c720b7e
id: AC-968
type: acceptance_criterion
title: Switching modes changes what is displayed without rebuilding the pane or any
  channel's frame
created_by: xgd
created_at: '2026-08-07T01:44:27.749421+00:00'
updated_at: '2026-11-09T03:11:29.592674+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Switching between the panel's modes changes what the pane displays without
rebuilding the pane. Each mode that shows a document has its own frame. The
pane element, and every channel's frame, are the same live, attached elements
before the switch, after it, and after switching back. A switch changes which
frame is shown. It does not tear down and remount the layout around it, and it
does not swap one frame out for another.

The displayed address still changes with each switch: the address the pane
reports (and "open in a new tab" uses) is the shown channel's. A mode that
renders something other than a document hides every frame by class, never by
the `hidden` attribute. So the frames stay attached and laid out while it is
shown.

## Verification

Mount the workspace with two document modes registered. Capture references to
the pane element and to each channel's frame. Switch mode, then switch back, and
assert every reference is still the live, attached element. Assert the
displayed address changed with each switch, so the identity check cannot pass
on a switch that did nothing. Register a mount mode, show it, and assert no
frame carries the `hidden` attribute and every frame is still attached.
