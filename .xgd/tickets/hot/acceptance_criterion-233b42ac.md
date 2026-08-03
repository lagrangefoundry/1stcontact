---
uid: acceptance_criterion-233b42ac
id: AC-764
type: acceptance_criterion
title: Viewport-height response is a typed derivative resolved against each keyframe's
  capture height
created_by: xgd
created_at: '2026-08-03T01:34:01.711400+00:00'
updated_at: '2026-08-03T01:34:01.711400+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
---

## Criterion
A node's geometry may carry a **viewport-height response** — how its vertical
position and its height track the viewport's height, the axis a width ladder
cannot observe at all. It is expressed as a **derivative** (a factor per axis)
rather than an absolute, because a full-viewport-height section is never a local
fact: the section grows and every node below it is pushed down by the same
amount, so a height factor of 1 on the section and a vertical-position factor of
1 on everything below it state the same rule in the same units.

Each factor is resolved against **that keyframe's own captured viewport height**,
so a keyframe still evaluates to exactly its captured pixels at the size it was
captured at, and the response only takes effect as the viewport departs from it.
Across an interpolated segment the origin height interpolates with the value, so
the response stays anchored to the right origin in between. A node with no
declared response is positioned purely from its keyframes.

The envelope refuses a response on a node whose keyframes do not carry the
viewport height they were captured at, since applying a response with no origin
would silently treat the origin as zero and turn a full-viewport height into
height-plus-a-viewport.

## Verification
Render a node whose keyframes were captured at a known viewport height and which
declares a height factor of 1; observe that at that capture height it evaluates to
exactly its captured height, and that at a taller viewport its height grows by the
difference, with a node below it declaring a matching position factor moving down
by the same amount. Render the same document with no response and observe purely
keyframed geometry. Submit a response on keyframes carrying no captured height and
observe rejection.
