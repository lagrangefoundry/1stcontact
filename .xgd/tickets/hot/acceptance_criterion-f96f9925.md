---
uid: acceptance_criterion-f96f9925
id: AC-699
type: acceptance_criterion
title: Carousel renders an L1-authored swipeable slide track driven by behavioural
  config
created_by: xgd
created_at: '2026-07-22T19:54:23.832646+00:00'
updated_at: '2026-08-06T01:31:15.297956+00:00'
completed_at: null
last_field_updated: title
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

The behavioural config surface is `autoplay` and `loop` only. The former
`view` (single / peek / multi) dial is **gone**: it was presented as behavioural
("how many slides show per view") but resolved to a slide `flex-basis`, which is
an aesthetic value the module contract forbids. A carousel instance declaring
`view` is rejected as unknown config rather than silently honoured, and "how much
of the next slide peeks" is now the sizing axis of the slide's own L1 subtree.

The optional pagination row is likewise L1: an instance supplies a `dots` slot
subtree containing one `dot-<index>` control node per mounted slide, and each
dot's size, shape and colour come from that node. The module supplies only the
dot's behavioural markers — its index and the current-slide signal.

## Verification
Render a carousel with several L1-authored slides and assert: the output is a
snap-scroll track containing one slide element per supplied L1 subtree with the
subtree's rendered content, and the track carries no slide-width or gap
declaration of its own. Assert the carousel's declared config admits only
`autoplay` and `loop`, and that an instance declaring `view` produces a config
violation. Render with a `dots` subtree binding a `dot-<i>` control per slide and
observe one indicator per slide painted from its L1 node, and with no `dots` slot
and observe none.
