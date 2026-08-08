---
uid: acceptance_criterion-9c1ba2b3
id: AC-831
type: acceptance_criterion
title: Texture composes with fill, gradient, scrim and image in a defined layer order
created_by: xgd
created_at: '2026-08-06T02:21:23.146734+00:00'
updated_at: '2026-08-08T00:43:14.973030+00:00'
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
A texture **composes** with the rest of the surface group in a defined order rather
than replacing any of it. A node declaring a solid fill, a texture, a surface
gradient, a scrim overlay and a background image at once paints all five, with the
solid fill behind everything as a background colour and the other four as ordered
background layers, **top-most first: scrim → texture → gradient wash → image**.

Because a tiled texture and a `cover` backdrop want different treatment, the
background sizing triple (size / position / repeat) is emitted **positionally —
one value per layer, in layer order — whenever a texture is present**, so each
layer keeps its own tile, origin and repetition on the same node.

**A document declaring no texture renders exactly as it did before.** With no
texture present, a background image still emits the single-valued
`cover` / `center` / `no-repeat` treatment, and a surface with no layer that
cares about sizing emits no sizing declarations at all. This holds across every
shipped page: no untextured page's rendered CSS changes by a byte.

**The claim is about a node's own authored surface.** It is scoped to the
presentation that a node's declared axes produce, and does not extend to
presentation the renderer owns on its own account — a pointer-tracked accent
paints a renderer-owned overlay whose background is legitimately a stack of
region layers, and it is gated behind the reader's pointer. Reading that overlay
as though it were an authored surface would fail a page that declares no texture
at all, which is the opposite of what this criterion protects.

## Verification
Render one node declaring fill + texture + surface gradient + scrim + background
image and observe four background layers in the stated order, the fill emitted as
the background colour, and size/position/repeat each emitted as a four-value list
matching the layers (the texture tiled on its period, the image `cover`/`center`/
`no-repeat`). Then render an untextured backdrop node and observe the single-valued
triple; render an untextured scrim+gradient node and observe no sizing declarations.
Re-render every shipped L1 page that declares no texture and assert each emitted
`background-size` that styles a node's authored surface is still a single value,
excluding the renderer-owned pointer-gated overlay rules.