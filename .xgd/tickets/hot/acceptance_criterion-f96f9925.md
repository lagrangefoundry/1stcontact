---
uid: acceptance_criterion-f96f9925
id: AC-699
type: acceptance_criterion
title: Carousel renders an L1-authored swipeable slide track driven by behavioural
  config
created_by: xgd
created_at: '2026-07-22T19:54:23.832646+00:00'
updated_at: '2026-08-08T00:42:05.090226+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A carousel instance renders as a horizontally-paged, pure-CSS `scroll-snap`
track that is scrollable/swipeable with no JavaScript. The slides in the track
are exactly the L1 subtrees supplied to the repeated `slide` slot, in order —
their entire visual appearance, **including each slide's own width and the space
between slides**, comes from L1, with no aesthetic dial on the carousel.

The behavioural config surface published by the carousel is `autoplay` and
`loop` only. The former `view` (single / peek / multi) dial is **gone**: it was
presented as behavioural ("how many slides show per view") but resolved to a
slide `flex-basis`, which is an aesthetic value the module contract forbids. No
carousel-authored declaration sets a slide's width or the gap between slides, so
"how much of the next slide peeks" is a number on the slide subtree's own L1
sizing axis rather than a three-valued enum.

The optional pagination row is likewise L1: an instance supplies a `dots` slot
subtree containing one `dot-<index>` control node per mounted slide, and each
dot's size, shape and colour come from that node. The module supplies only the
dot's behavioural markers — its index and the current-slide signal.

## Verification
Render a carousel with several L1-authored slides and assert: the output is a
snap-scroll track containing one slide element per supplied L1 subtree with the
subtree's rendered content. Assert the carousel's published config contract lists
`autoplay` and `loop` and no `view`, and that no module-emitted rule carries a
slide `flex-basis`, width or track `gap` — with the slide widths observable in the
rendered CSS coming from the slide subtrees themselves. Render with a `dots`
subtree binding a `dot-<i>` control per slide and observe one indicator per slide
painted from its L1 node, and with no `dots` slot and observe none.