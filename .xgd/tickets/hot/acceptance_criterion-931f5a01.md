---
uid: acceptance_criterion-931f5a01
id: AC-775
type: acceptance_criterion
title: Surface fill, accent rule and gradient are attributed to the containing painted
  boxes, tightest first
created_by: xgd
created_at: '2026-08-03T02:28:36.508111+00:00'
updated_at: '2026-08-03T02:28:36.508111+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
---

## Criterion
The surface treatments read for a text run — its surface fill, its left accent rule and its surface gradient — are attributed to the painted boxes that geometrically **contain** the run, tightest first, rather than to its DOM ancestors. DOM ancestors are included in the candidate set (containment is not guaranteed under negative margins or overflow), but containment, not ancestry, is what qualifies a box as the surface behind a run.

Consequently: a reproduction that paints its bands and cards as absolutely-positioned **siblings** of the text reports the card's fill, the card's accent rule and the panel's gradient — not the page backstop — so no phantom delta is raised on pixels that are already correct (this shape previously produced ~60 phantom defects, some reported reversed, drowning the real ones); a conventionally-nested reference resolves to exactly the same values as before; and where surfaces overlap, the tightest containing box wins over the larger band behind it, so a gradient panel over an opaque band is not lost to the band.

## Verification
Diff a fixture whose reproduction paints a band and a card as absolutely-positioned siblings of the run. Assert the run's fill is the card's, its accent rule is found on the sibling card, and no phantom fill/accent/gradient deltas are reported. Assert a nested-card fixture resolves unchanged, and that where a small panel sits over a larger band the panel's treatment (not the band's) is the run's surface.
