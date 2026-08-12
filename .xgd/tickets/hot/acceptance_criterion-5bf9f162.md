---
uid: acceptance_criterion-5bf9f162
id: AC-802
type: acceptance_criterion
title: Every node kind admits the same shared axis groups
created_by: xgd
created_at: '2026-08-06T01:16:02.599467+00:00'
updated_at: '2026-08-12T21:10:43.264056+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The axis groups an L1 node may carry are **uniform across node kinds**, not a
per-kind subset. Two groups are shared by every kind:

- the **painted surface** (fill, surface gradient, background image, scrim
  overlay, uniform border, left-accent border, corner radius, drop shadow,
  backdrop blur, **the node's own colour adjustment**, opacity, blend mode); and
- the **node-level groups** — per-width placement (geometry), sizing,
  viewport-range visibility, transform, mask, padding, per-width padding, and the
  typed interaction and reveal states.

The surface group carries **two distinct blur-like effects, and they are not
interchangeable**: the backdrop blur frosts whatever sits *behind* the node,
while the colour adjustment (greyscale, sepia, invert, saturation, brightness,
contrast, hue shift and a blur of the node's own paint) adjusts what the node
*itself* paints. A frosted panel over a photograph is the first and a soft-focus
photograph is the second; one field could not express both at once, so the group
carries both.

Every box-rendering kind — `box`, `container`, `text`, `image`, `slot`, `control`
— accepts each of those groups with the *identical* field set, the identical
strictness (an unknown key is refused, not ignored), and the identical envelope
bounds. A document declaring the whole shared vocabulary on each kind in turn is
accepted for every kind, and a document declaring a group only some kinds used to
support is no longer rejected for the kind that lacked it.

Consequently a kind declares only what is genuinely its own — a run its type
axes, an image how the media fills its box, a container its layout, a slot its
seam name, a control the module element it paints — and any kind added later
inherits the shared groups rather than re-deriving which slice it is allowed.

**One framing axis is deliberately an image's own rather than shared, and the
reason is stated rather than left as an inconsistency.** Which part of the
picture its box shows is carried by the `image` leaf alone and is refused as an
unknown key on every other kind. Framing replaced content and framing a paint
layer are different CSS property families, and a painted surface's background is
still pinned to a fixed `cover / center / no-repeat` treatment, so hoisting the
axis would offer every kind a control that only one kind could honour. Widening
it to painted surfaces is a later change to that pin, not a gap in this one.

## Verification
Submit a document that declares every node-level group and the whole surface
group on each of `box`, `container`, `text`, `image`, `slot` and `control` in
turn, and observe acceptance for every kind with the identical shape. Submit the
same groups carrying an unknown key on each kind and observe rejection for every
kind. Confirm no kind is missing a group the others carry — in particular that a
slot admits sizing and a text run admits sizing, and that the colour adjustment
is admitted on every kind alongside, and independently of, the backdrop blur.
Confirm the converse for the image-only framing axis: an `image` accepts it and
every other box-rendering kind rejects it as an unknown key.
