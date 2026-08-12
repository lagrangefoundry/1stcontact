---
uid: acceptance_criterion-1c0e88b1
id: AC-1127
type: acceptance_criterion
title: A typed shape names an intent and never geometry, and a generated outline is
  deterministic
created_by: xgd
created_at: '2026-08-12T21:13:03.080984+00:00'
updated_at: '2026-08-12T21:13:03.080984+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
---

## Criterion
The mask vocabulary is a **shape vocabulary the renderer draws**, not a circular
crop and a feathered edge alone. Beside the circle, the ellipse and the feathered
edges, a node may name a **leaning quadrilateral** and a **generated organic
outline**, and the published page shows each as a clip path whose geometry is
built entirely by the renderer from bounded numbers.

**The document names the intent and never the geometry.** A shape is a name plus
the bounded numbers that parameterise it — how far the quadrilateral leans, how
lumpy the outline is, which outline it is — and each number is inert on the
shapes that do not name it. No coordinate, path or point list is ever authored,
so the shape vocabulary widens without the surface an instance can write widening
with it. A lean is bounded so it cannot consume the whole box and degenerate into
a different shape; a roughness is bounded to its full range. How many points make
an outline read as organic is a property of the renderer, not a number the
document reaches in to set.

**A generated outline is deterministic in its seed.** The same document renders
the identical outline every time, and two different seeds render different
outlines. This is a correctness obligation and not polish: a shape that differed
between two renders of one document would break the round-trip identity the
substrate is gated on, and would make the picture visibly change every time the
page was re-rendered.

Shape and corner rounding are **independent treatments** — rounding is the shared
surface's own axis, not a mask — so a node may carry both and neither displaces
the other.

## Verification
Render nodes naming the leaning quadrilateral and the generated outline and
assert each emits a polygon clip path. Render the same generated outline twice
and assert the emitted geometry is identical; render it under a different seed
and assert the geometry differs. Render a node carrying both a shape and a corner
radius and assert both are emitted. Submit a lean or a roughness outside its
bounds, and any unknown key on the shape object, and observe rejection.
