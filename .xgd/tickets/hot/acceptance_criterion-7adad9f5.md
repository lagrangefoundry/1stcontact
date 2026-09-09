---
uid: acceptance_criterion-7adad9f5
id: AC-1611
type: acceptance_criterion
title: The surface gradient recorded is the nearest painting ancestor's, skipping
  text-fill and stopping at the first opaque solid
created_by: martin-github@westhead.me
created_at: '2026-09-09T23:50:40.594238+00:00'
updated_at: '2026-09-09T23:50:40.594238+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-82eb6908
  kind: behavior
  regression_only: false
  uat_coverage: missing
---

## Criterion
Which ancestor's gradient is recorded as a run's **surface gradient** follows a
four-clause selection rule, walked tightest-first over the run's painting ancestor
chain:

- **(a) Nearest wins.** For a run inside nested painting ancestors that each paint a
  gradient, the recorded surface gradient is the **nearest** ancestor's.
- **(b) A text-fill gradient is skipped.** An ancestor whose gradient is clipped to
  its text (`background-clip: text`) paints no surface, so the walk passes over it
  rather than recording it as the surface — that gradient belongs to the text-fill
  axis (AC-634 / AC-635), not this one.
- **(c) The walk stops at the first opaque solid.** A gradient sitting behind an
  opaque fill never shows, so it is not the surface: once an opaque solid is reached
  the walk ends and no gradient beyond it is recorded.
- **(d) No gradient ancestor records none.** A run with no qualifying gradient
  ancestor carries no surface gradient, rather than a fabricated one.

This is the one place the capture can be silently wrong in a way the **diff cannot
detect**: pick the wrong ancestor and both sides agree on a value that is not what
paints — a clean gate on a wrong render. AC-636 compares the surface gradient once
selected; this criterion pins the selection AC-636 presupposes.

## Verification
Capture a run nested inside two gradient-painting ancestors and assert the recorded
surface gradient is the inner one's. Capture a run whose nearest gradient ancestor
clips its gradient to text and assert that gradient is skipped, the surface gradient
coming from the next qualifying ancestor (and appearing on the text-fill axis
instead). Capture a run with an opaque solid fill between it and a gradient ancestor
and assert no surface gradient is recorded. Capture a run with no gradient ancestor at
all and assert none is recorded.
