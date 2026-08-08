---
uid: acceptance_criterion-5bf9f162
id: AC-802
type: acceptance_criterion
title: Every node kind admits the same shared axis groups
created_by: xgd
created_at: '2026-08-06T01:16:02.599467+00:00'
updated_at: '2026-08-08T00:42:24.240539+00:00'
completed_at: null
last_field_updated: uat_coverage
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
  backdrop blur, opacity, blend mode); and
- the **node-level groups** — per-width placement (geometry), sizing,
  viewport-range visibility, transform, mask, padding, per-width padding, and the
  typed interaction and reveal states.

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

## Verification
Submit a document that declares every node-level group and the whole surface
group on each of `box`, `container`, `text`, `image`, `slot` and `control` in
turn, and observe acceptance for every kind with the identical shape. Submit the
same groups carrying an unknown key on each kind and observe rejection for every
kind. Confirm no kind is missing a group the others carry — in particular that a
slot admits sizing and a text run admits sizing.