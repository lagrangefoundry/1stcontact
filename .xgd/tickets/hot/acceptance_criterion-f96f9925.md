---
uid: acceptance_criterion-f96f9925
id: AC-699
type: acceptance_criterion
title: Carousel renders an L1-authored swipeable slide track driven by behavioural
  config
created_by: xgd
created_at: '2026-07-22T19:54:23.832646+00:00'
updated_at: '2026-07-23T06:57:09.828424+00:00'
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
their entire visual appearance comes from L1, with no aesthetic dials on the
carousel. Behavioural config drives the chrome: `view` (single / peek / multi)
sets how many slides show per view, and `controls: dots` adds a decorative
indicator row with one marker per slide (only when there is more than one slide).

## Verification
Render a carousel with several L1-authored slides and assert: the output is a
snap-scroll track containing one slide element per supplied L1 subtree with the
subtree's rendered content; changing `view` changes the per-view slide sizing;
`controls: dots` emits a dot per slide and `controls: none` emits none. Confirm
the carousel exposes only behavioural config and `slide` slots — no aesthetic
dial produces the slide look.