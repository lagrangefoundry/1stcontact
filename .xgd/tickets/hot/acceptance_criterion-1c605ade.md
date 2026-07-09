---
uid: acceptance_criterion-1c605ade
id: AC-515
type: acceptance_criterion
title: 'Background and surface compose in one section: background paints, surface
  contracts'
created_by: xgd
created_at: '2026-07-09T22:27:50.996039+00:00'
updated_at: '2026-07-09T22:27:50.996039+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6af935e7
  kind: behavior
  regression_only: false
---

## Criterion
When a section declares **both** a `background` (color/image/gradient) and a `surface` dial, the two compose under a documented precedence rule — **background paints, surface contracts**: the background layer supplies the fill, and the surface supplies only the text-color/contrast contract over it, never a competing background fill. The background is no longer rendered inert by the surface, and no raw CSS in the site definition is required to make the two coexist.

## Verification
Render a module that declares an image (or gradient) `background` together with a `surface` dial (e.g. `inverse`). Assert that the section's own surface-derived background fill does not paint over the background layer (the background remains visible), while the surface-derived text `color` contract is still applied to the content. Confirm the composition is achieved with structured values only — no raw CSS in the site definition.
