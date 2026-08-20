---
uid: acceptance_criterion-bf0cbabb
id: AC-1308
type: acceptance_criterion
title: The captured surface gradient is the nearest painting ancestor's, skipping
  text-fill and stopping at the first opaque solid
created_by: xgd
created_at: '2026-08-20T04:34:10.031129+00:00'
updated_at: '2026-08-20T06:59:18.525837+00:00'
completed_at: null
last_field_updated: uat_coverage
status: pending
fields:
  story_uid: story-82eb6908
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The surface gradient recorded for a run is selected by walking the run's geometric surface chain tightest-first, under four rules — so the captured value is the gradient that actually paints behind the run, not merely one that exists somewhere above it:

- **Nearest wins.** For a run inside nested painting ancestors each carrying a gradient, the recorded `surfaceGradient` is the **nearest** ancestor's.
- **A text-fill gradient is skipped.** An ancestor whose gradient is clipped to text (`background-clip: text`) is not a surface — it is that element's own text paint, captured separately as the run's gradient — so the walk passes over it and continues.
- **The walk stops at the first opaque solid.** An opaque solid fill in the chain terminates the walk and records no surface gradient, because a gradient behind an opaque fill never shows through.
- **No gradient ancestor records none.** A run with no gradient-painting ancestor records no surface gradient (not an empty or default one).

This is the one place capture can be silently wrong in a way the diff cannot detect: pick the wrong ancestor and both sides agree on a value that is not what paints.

## Verification
Capture a page with a run inside two nested gradient panels and assert the recorded surface gradient is the inner panel's. Capture a run whose nearest gradient ancestor is a `background-clip: text` wordmark over a gradient panel and assert the panel's gradient is recorded, not the text-fill one. Capture a run whose chain places an opaque solid card between it and a gradient section and assert no surface gradient is recorded. Capture a run with no gradient anywhere in its chain and assert no surface gradient is recorded.