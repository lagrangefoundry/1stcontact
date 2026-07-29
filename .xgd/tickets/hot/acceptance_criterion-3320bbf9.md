---
uid: acceptance_criterion-3320bbf9
id: AC-725
type: acceptance_criterion
title: Typed pixel-mover axes render as CSS re-derived from their typed fields
created_by: xgd
created_at: '2026-07-29T03:49:52.334772+00:00'
updated_at: '2026-07-29T03:49:52.334772+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
---

## Criterion
Beyond the original scalar axes, an L1 document may carry a **typed axis for
every captured pixel-mover**, on the leaf kind that paints it, and the published
page shows each one as CSS re-derived from that axis's numeric, closed-enum, and
hex-colour fields — never from a passthrough style string. Non-scalar families
(gradient, shadow, border, mask, transform, scrim) are carried as **structured
typed forms**: a gradient is an optional angle plus at least two hex stops with
optional 0–100% positions; a shadow is offset/blur/spread/hex-colour/inset; a
border is width/hex-colour/line-style; a mask is a named shape (circular,
elliptical, or a feathered edge) plus an optional feather width; a transform is
rotation and uniform scale; a scrim is a hex colour plus opacity.

The families and their painted effect:
- **text** — a gradient fill paints the glyphs themselves (the flat colour is
  overridden so the gradient shows through the text); a decoration line
  (underline / strike / overline) is drawn; a glyph shadow is cast; small-caps
  rendering is applied; and a list marker is painted at the declared marker type.
- **box** — a scrim overlay, a surface gradient, and a background image
  composite as **ordered background layers in that order** (scrim above
  gradient, gradient above image, all above the solid fill); plus a border, a
  drop shadow, a backdrop blur of whatever sits behind, and a blend mode.
- **image** — a blend mode, a painted border, and a drop shadow.
- **any node kind** — a transform (rotation and/or uniform scale) and a mask.

An identity or no-op value is **omitted rather than emitted**: a transform that
is exactly no rotation and unit scale, a `normal` blend mode, a `none`
decoration, `normal` caps, and a `none` list marker produce no corresponding
declaration in the output.

## Verification
Render documents carrying each family on its target leaf and inspect the emitted
CSS: the text gradient paints via a text-clipped background with a transparent
fill; decoration, glyph shadow, small-caps and list marker each appear with the
declared value; a box declaring scrim + gradient + background image emits the
three as comma-separated background layers in that order, alongside border,
shadow, backdrop blur and blend declarations; an image emits its blend, border
and shadow; and a transform and a mask each emit on a node of any kind. Then
render the identity/no-op variants of transform, blend mode, decoration, caps
and list marker and assert no corresponding declaration is present.
