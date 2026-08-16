---
uid: acceptance_criterion-91cb4f83
id: AC-950
type: acceptance_criterion
title: A carousel's slides are all simultaneously visible in the edit render, because
  the module declares its own behaviour-off state
created_by: xgd
created_at: '2026-08-06T21:25:58.008100+00:00'
updated_at: '2026-08-16T04:18:27.725344+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-af36c2cb
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A carousel whose slides sit in a scrolling, snapping track — off-screen until a
visitor swipes — renders every slide simultaneously on screen in the edit
channel: the track stops scrolling and snapping, and instead lays its slides out
so all of them are visible at once.

The settled state is declared by the behavior module itself, keyed off a
document-level marker the edit channel sets, so:

- the render channel needs no knowledge of what a carousel is, and any other
  behavior module declares its own behaviour-off state on the same terms; and
- the declaration is inert in every other channel even though the stylesheet is
  shared — a preview render carrying the same rule shows the scrolling, snapping
  track because it does not set the marker.

## Verification

Seed a page carrying a carousel with two slides. Render the preview and the edit
channel. Assert both carry both slides' copy. Assert the preview output does not
set the document-level edit marker and its track scrolls and snaps; assert the
edit output sets the marker and that the module's own settled-state declaration
— keyed on that marker — turns the track into a wrapped, non-snapping layout.