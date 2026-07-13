---
uid: story-d70a0264
id: STORY-70
type: story
title: Free-position named hero-segment objects
created_by: xgd
created_at: '2026-07-13T20:22:42.719570+00:00'
updated_at: '2026-07-13T20:22:42.719570+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
fields:
  intent_uid: bundle-d9c2e655
  capability_uid: capability-8fc6e284
  story_kind: feature
  story_points: 2
---

## Story
**As a** site author reproducing a designed hero, **I want** to place the named
objects of the hero segment — the overlay header wordmark and the hero eyebrow,
heading, subhead and cta — at explicit coordinates within the hero band, **so
that** I can art-direct the hero to match a reference layout exactly, while
objects I leave unpositioned keep flowing as before.

## Description
Generalizes the framework's existing free-positioning coordinate model (used by
layer children) onto the hero segment's named objects. Any styled hero run, and
the overlay-header text wordmark, may carry an optional `position` (x/y/w as band
percentages, z, rotate). When present, the object is lifted out of normal flow
and placed by the framework's band-coordinate model against a full-band canvas
that spans the hero; when absent, the object flows exactly as it did before
(zero regression). Positioning is always framework-computed — the site instance
never emits raw CSS positioning. In an overlay header the chrome becomes
full-band and pointer-transparent (its interactive nav still clickable) so a
positioned wordmark shares the hero's coordinate space and can sit anywhere over
the hero while the nav stays put.

**In scope**: per-object placement of hero eyebrow/heading/subhead/cta and the
overlay-header wordmark; band-percentage coordinate units (x/y/w %, z unitless,
rotate degrees); mixed positioned/flowed objects in one hero; lossless
combination of a run's intrinsic typography style with its position;
zero-regression flow for objects without a position.

**Out of scope**: no new module; positioning of image portrait / divider / logo
image; multi-band or non-hero segments; the layer primitive itself (reused, not
changed).

## Technical Context
Reuses the framework coordinate compiler shared with layer children (the same
`--fc-*` band model) so no per-instance positioning CSS reaches the page. The
`position` field is added to the styled-run schema/type; hero slots that carry it
lift into a full-band absolute stack mirroring the layer stack, and a positioned
overlay wordmark lifts out of the flow row while the overlay chrome spans the
full band pointer-transparently. A style⇄position join fix ensures a run's
resolved typography declarations and its coordinate properties render as
separate valid declarations. Free-code evidence: gigabytealchemy hero front door
reproduced (perceptual mean 17.53 → 16.67). Site authoring that places specific
sites is free-coding-exempt and out of this story's scope.

## Dependencies
None.

## Story Points
2
