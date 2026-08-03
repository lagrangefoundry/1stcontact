---
uid: acceptance_criterion-2412b0c3
id: AC-754
type: acceptance_criterion
title: A card adopts the captured surface rect and radius; a viewport-wide surface
  is refused; with no surface shape nothing is invented
created_by: xgd
created_at: '2026-08-03T00:58:33.149596+00:00'
updated_at: '2026-08-03T01:27:46.720504+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
---

## Criterion
A card's box is the captured surface-bearing element's own rect, at each sampled
width, together with that element's own corner radius — the panel is rounded even
though its runs are square. That rect is also the card's grouping identity: runs
painted by the same surface join into one card box, runs painted by different
surfaces never do, so sibling tiles neither merge nor drift and no proximity
heuristic arbitrates them.

Two guards bound the rule:
- A surface as wide as the viewport is the **band**, not a card; such a run keeps its
  own box, so a narrow accent rule is not stretched across a whole section.
- Where the capture resolved no surface shape, a card is exactly the union of its
  runs' boxes and **nothing is invented** — no padding is estimated and no box is
  outset beyond its runs.

## Verification
Fold a capture whose runs carry a captured surface rect with a radius; assert the
card keyframes equal that rect at every sampled width and carry its radius rather
than the runs' square corners. Fold sibling panels with different surface rects and
assert they stay separate and each matches its own rect. Fold a run whose captured
surface spans the viewport and assert no card adopts that rect. Fold a capture with
no surface shape and assert the card is exactly its runs' union.