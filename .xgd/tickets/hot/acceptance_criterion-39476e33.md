---
uid: acceptance_criterion-39476e33
id: AC-735
type: acceptance_criterion
title: Geometry resolves against half-open breakpoint intervals so a reflow at a captured
  breakpoint does not cascade
created_by: xgd
created_at: '2026-07-29T04:19:53.100508+00:00'
updated_at: '2026-08-07T23:54:08.190148+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-24098299
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Resolving a leaf's geometry at a width uses **half-open per-segment intervals**
`[lower breakpoint, upper breakpoint)`, mirroring the renderer's stacked `min-width`
rules where the highest breakpoint not exceeding the width wins.

- At a width that falls exactly on an interior captured breakpoint, the segment
  **starting** at that breakpoint is active — never the segment ending there.
- Consequently, a document whose element reflows at a captured breakpoint (so the
  segment below it is classified `snap`) reproduces the **post-reflow** frame at that
  exact width, not the held pre-reflow keyframe.
- Because a stale frame at one width no longer displaces the elements resolved from it,
  the sample-fidelity probe is clean at the reflow breakpoint and at every other
  captured width — a single breakpoint error does not cascade down the rest of the page.
- Widths below the first breakpoint hold the base keyframe and widths above the last
  hold the final keyframe, unchanged.

## Verification
Fold a synthetic multi-viewport capture whose elements reflow at an interior captured
breakpoint (narrowing enough that the segment below it classifies `snap`) and assert:
every element present at the reflow breakpoint carries a keyframe there; evaluating the
document at exactly that width yields each element's post-reflow box, not the frame held
from the width below; and the sample-fidelity probe passes with zero residuals at every
captured width including the reflow breakpoint. Assert the guard bites by checking that
resolving the interval with a closed upper bound instead reproduces the pre-reflow box.