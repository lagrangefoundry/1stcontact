---
uid: acceptance_criterion-67bfd97c
id: AC-1248
type: acceptance_criterion
title: Opened over a colour the caller already holds, the surface starts on that entry
  at that position — and on nothing at all if the entry is gone
created_by: xgd
created_at: '2026-08-20T01:59:21.930524+00:00'
updated_at: '2026-08-20T01:59:21.930524+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4300366a
  kind: behavior
  regression_only: false
---

## Criterion

Opened holding a reference the caller already has, the surface starts with that entry selected and
its position control at the position held, so opening a picker can never silently change the colour
it was opened over.

If the held entry is no longer in the palette, the surface starts with nothing selected and still
lists every entry the palette does hold — rather than describing a colour the site no longer has.

Moving the selection to a different entry resets the position to the colour itself: a position is a
place within one entry's family, so carrying it across would silently darken or lighten a colour the
operator chose by its swatch. Returning to the originally held entry restores the position it was
opened with.

## Verification

Open the surface to supply a value, passing a reference to an existing entry at an off-centre
position; observe that entry selected and the position control at that position. Select a different
entry and observe the position reset to the colour itself; reselect the original and observe its
held position restored.

Open again passing a reference naming an entry the palette does not contain; observe no selection,
no position control, no error, and the existing entries listed normally.
