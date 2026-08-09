---
uid: acceptance_criterion-744fa05c
id: AC-879
type: acceptance_criterion
title: A node declaring a pointer accent presents its own texture redrawn in the accent
  colour inside a region centred on the reader's cursor, and the accent is derived
  from the same texture declaration so it can never drift from the design it accents
created_by: xgd
created_at: '2026-08-06T18:09:11.586939+00:00'
updated_at: '2026-08-09T05:41:25.832278+00:00'
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
On a published page, a node that paints a texture and declares a pointer accent
presents that texture a second time — redrawn in the accent colour — inside a
region centred on the reader's cursor, following the pointer as it moves across
the node. The accent paints above the node's own background and below its
content, so a recoloured line never lands on top of the node's text; it is inert
to the reader (it takes no click, no hover and no text selection away from the
content) and it is clipped by the node's own corner rounding.

The accent is not a second design. It is the node's *own* texture with one value
substituted: change the texture's spacing, thickness or angle and the accented
copy changes identically, with no separate accent geometry to keep in step. No
site definition can name the overlay, the region or the way they composite —
the definition declares only a colour, a reach, a softness and a roughness.

## Verification
Render a page with a textured node carrying a pointer accent and drive it with a
real pointer: assert the texture is presented in the accent colour within a
bounded region around the cursor and in its base colour elsewhere, and that the
region moves with the pointer. Assert the accented paint is not interactive and
does not obscure the node's content. Re-render with the texture's spacing
changed and assert the accented copy's geometry changed with it. Assert no
site-definition field can name a selector, a pseudo-element or a compositing
mode.