---
uid: acceptance_criterion-83b0356a
id: AC-1465
type: acceptance_criterion
title: An interaction state the capture path cannot actuate is skipped and reported,
  never emitted as an unactuated frame
created_by: xgd
created_at: '2026-08-31T22:53:33.688529+00:00'
updated_at: '2026-08-31T22:53:33.688529+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-080c6036
  kind: behavior
  regression_only: false
---

## Criterion

When the capture path in use cannot force interaction pseudo-states, a
multi-state capture:

- produces only the resting-state projection;
- emits a note naming the engine, the viewport width, and the interaction states
  that were skipped;
- produces **no** projection labelled with a non-resting state.

When the capture path can actuate, every requested state is projected as before.

## Verification

Run a multi-state capture across the resting and non-resting states through a
capture path that offers no actuation. Assert the result contains only the
resting projection, that a note is present naming the skipped states, and that
no hover/focus/active projection exists in the output.

Then run the same request through a capture path that does actuate and assert
every requested state is projected and no skip note is emitted.

A silent no-op would emit an unactuated resting frame labelled `hover`, which
compares clean against a reference that also has no hover effect and reads as
proof where there is none.
