---
uid: acceptance_criterion-23edf150
id: AC-1280
type: acceptance_criterion
title: A run's dialog shows the panel behind the words read-only and routes to that
  panel's own dialog, saving first when there is anything staged
created_by: xgd
created_at: '2026-08-20T03:38:49.821182+00:00'
updated_at: '2026-08-20T03:38:49.821182+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
---

## Criterion

A dialog opened over a run of copy that sits on a painted panel carries a
**read-only row for the panel behind the words**: a swatch of the colour that
panel paints, named the way every colour on this surface is named, captioned to
say it comes *from the panel behind this text*, and offering a route to that
panel's own dialog. The row reports; it offers no control for the panel's colour,
because that colour belongs to the panel and duplicating its control here would
break one-dialog-one-change.

The row exists because the panel is otherwise unreachable by pointing: a click
resolves to the innermost region containing it, so clicking the words never
reaches the panel around them, and a panel can be entirely covered by its own
copy — leaving nowhere outside the words to click. A panel with no background
colour yet says so rather than showing nothing, because that is precisely the
state the route exists to let someone change.

Following the route **opens the panel's own dialog**, which is where the panel's
background colour is edited. Following it from a dialog holding unsaved changes
**saves them first**, and the route says so before it is followed whenever there
is something to save; if that save is refused, the dialog stays open holding the
operator's work and the navigation does not happen. A run that sits on nothing
painted carries no such row.

## Verification

Open the dialog over a run of copy nested inside a painted panel. Assert the row
is present, that it names the panel behind the text, that it shows that panel's
colour, and that it carries no control for changing that colour. Follow the route
and assert the dialog that opens is the panel's own and offers its background
colour.

Repeat with unsaved changes staged in the run's dialog: assert the route's label
says it will save, assert the change lands before the panel's dialog opens, and —
with a save the surface refuses — assert the dialog stays open holding the staged
work and the panel's dialog does not open. Open the dialog over a run that sits on
nothing painted and assert no such row appears.
