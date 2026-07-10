---
uid: acceptance_criterion-a29a2e0b
id: AC-568
type: acceptance_criterion
title: 'Additional rendered axes are projected per element: z-order, treatments, media,
  transform, motion, font-load, viewport'
created_by: xgd
created_at: '2026-07-10T01:23:15.271262+00:00'
updated_at: '2026-07-10T01:23:15.271262+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8f33f14c
  kind: behavior
  regression_only: false
---

## Criterion
Beyond geometry/shape/a11y, each captured element in `capture.json` projects the rendered axes a single static frame cannot hold, every field being the rendered value (not a CSS mechanism): `zIndex` (effective paint order, `auto` resolved to 0); treatments `filter`, `textShadow`, and `maskEdge` (`mask-image`/`clip-path`), each the raw computed value when painted else null; media `objectFit` and `intrinsicAspect` (natural w/h) on media fields; a decomposed transform (`transformRotateDeg` in degrees, `transformScale` uniform factor — the element `box` is already the effective post-transform rect, so translation is folded into position); declared `motion` (`animation`/`transition`/`both`/null); a per-run `fontLoaded` fact (false when the intended named face did not resolve and a fallback rendered); and a per-run/per-projection `viewport` tag.

## Verification
Capture a fixture whose elements exercise these axes — a stacked scrim with an explicit `z-index`, a photo carrying a `filter` blur/drop-shadow, a heading with a `text-shadow` glow, a masked/clipped avatar, a rotated collage layer, an image with `object-fit: cover`, a control declaring a hover `transition` and an entrance `animation`, and text set in a web font. Assert the corresponding elements record `zIndex` at the resolved integer, `filter`/`textShadow`/`maskEdge` present (non-null) where painted and null otherwise, `objectFit`/`intrinsicAspect` on the media field, `transformRotateDeg`/`transformScale` decomposed from the matrix (rotation surfaced, translation absent because `box` already reflects it), `motion` reflecting the declared animation/transition, `fontLoaded` true when the face resolved (and false when forced to a fallback), and a `viewport` tag on the projection.
