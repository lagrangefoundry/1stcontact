---
uid: acceptance_criterion-df0a997e
id: AC-823
type: acceptance_criterion
title: 'A reader who asks for reduced motion gets the paint without the travel: state
  changes apply instantly with no movement, and every revealing node is presented
  settled at its own authored opacity rather than brightened to full'
created_by: xgd
created_at: '2026-08-06T02:03:40.503240+00:00'
updated_at: '2026-08-08T00:42:49.862839+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d2b5cb1c
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Under a reduced-motion preference, on a page whose nodes declare interaction
states and entrances:

- a hover or focus state still presents its paint change (fill, colour, border,
  shadow), but presents no movement — the state's offset, scale or rotation
  collapses back to the node's authored placement;
- the state change is presented immediately, with no animation over time;
- every node declaring an entrance is presented already settled, at the opacity
  and position it itself declares. A node authored at partial opacity settles at
  that partial opacity, not at full — the preference restores the design, it
  does not brighten it.

The preference is honoured by the published page itself. No field in the site
definition lets an author override or opt out of it.

## Verification
Render a page carrying interaction states with motion and revealing nodes,
including one node authored at partial opacity, and evaluate it under a
reduced-motion preference: assert the state's paint values are still presented,
that no movement and no animation duration is applied, that every revealing node
is at its authored opacity and position, and that the partial-opacity node is
not at full opacity. Assert no site-definition field can suppress this
behaviour.