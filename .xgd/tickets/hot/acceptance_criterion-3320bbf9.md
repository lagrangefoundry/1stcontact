---
uid: acceptance_criterion-3320bbf9
id: AC-725
type: acceptance_criterion
title: Typed pixel-mover axes render as CSS re-derived from their typed fields
created_by: xgd
created_at: '2026-07-29T03:49:52.334772+00:00'
updated_at: '2026-08-12T21:11:07.801319+00:00'
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
Beyond the original scalar axes, an L1 document may carry a **typed axis for
every captured pixel-mover**, and the published page shows each one as CSS
re-derived from that axis's numeric, closed-enum, and hex-colour fields — never
from a passthrough style string.

**The painted surface is one shared group, not a per-kind subset.** Every node
kind that renders a box — `box`, `container`, `text`, `image`, `slot` and the
`control` leaf — carries the *identical* surface group, and the published page
paints it the same way whichever kind declares it. The group is: solid fill,
surface gradient (linear or radial), repeating texture, background image
(scheme-checked), translucent scrim overlay, uniform border, left-accent border,
corner radius, drop shadow, backdrop blur, the node's own colour adjustment,
opacity and blend mode. A kind adds only what is genuinely its own — a run adds
its type axes, an image adds how the media fills its box and which part of itself
that box shows, a container adds its layout — and no
kind re-declares a slice of the surface. There is therefore no table of which
kind is permitted which paint axis: an axis a document may carry at all, it may
carry on the node that needs it.

Non-scalar families (gradient, texture, shadow, border, mask, transform, scrim,
colour adjustment) are carried as **structured typed forms**: a gradient is a
linear or a radial
branch (an optional angle plus at least two hex stops with optional 0–100%
positions, or a typed origin and extent carrying those stops); a texture is a
named shape plus a tile period, a line width, a hex colour and a tilt; a shadow is
offset/blur/spread/hex-colour/inset; a border is width/hex-colour/line-style; a
mask is a named shape (circular, elliptical, a leaning quadrilateral, a generated
organic outline, or a feathered edge) plus the bounded numbers that parameterise
whichever shape names them — a feather width, a lean, a roughness, a seed —
each inert on the shapes that do not name it; a transform is rotation and uniform
scale; a scrim is a hex colour plus opacity; a colour adjustment is a set of
bounded ratios and angles, one per adjustment function.

The families and their painted effect:
- **any box-rendering kind (the shared surface)** — a scrim overlay, a repeating
  texture, a surface gradient wash and a background image composite as **ordered
  background layers in that order** (scrim above texture, texture above the wash,
  the wash above the image, all above the solid fill); plus a border, a left-accent border, a corner radius, a drop shadow, a
  backdrop blur of whatever sits behind, a colour adjustment of what the node
  itself paints, an opacity and a blend mode.
- **text** — in addition to that shared surface (so a chip/badge run paints its
  own pill on its own element): a gradient fill paints the glyphs themselves
  (the flat colour is overridden so the gradient shows through the text); a
  decoration line (underline / strike / overline) is drawn; a glyph shadow is
  cast; small-caps rendering is applied; and a list marker is painted at the
  declared marker type.
- **image** — in addition to that shared surface, how the media fills its box
  (`object-fit`) and which part of the picture the box shows.
- **any node kind** — a transform (rotation and/or uniform scale) and a mask.

An identity or no-op value is **omitted rather than emitted**: a transform that
is exactly no rotation and unit scale, a `normal` blend mode, a `none`
decoration, `normal` caps, a `none` list marker, and every adjustment function
sitting at its own identity produce no corresponding declaration in the output.

## Verification
Render documents carrying each family and inspect the emitted CSS. Declare the
whole surface group on each of `box`, `container`, `text`, `image` and `slot` in
turn and observe the same paint declarations emitted for every kind — a
container declaring fill + gradient + border + radius + shadow + blend + backdrop
blur + overlay + background image paints all of them while still laying out its
children. Confirm the ordered background layering (scrim, texture, gradient
wash, image, over the fill), the text-only families (text-clipped gradient fill with a transparent
colour, decoration, glyph shadow, small-caps, list marker), an image's
`object-fit` and its framing position, and a transform and a mask each emitting
on a node of any kind.
Then render the identity/no-op variants of transform, blend mode, decoration,
caps, list marker and the colour adjustment and assert no corresponding
declaration is present.
