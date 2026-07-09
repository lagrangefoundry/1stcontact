---
uid: story-6af935e7
id: STORY-59
type: story
title: 'Section-level background: color, image, or gradient with legibility overlay'
created_by: xgd
created_at: '2026-07-09T20:33:54.072667+00:00'
updated_at: '2026-07-09T20:33:54.072667+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
fields:
  intent_uid: bundle-f39884d2
  capability_uid: capability-5fcda566
  story_kind: feature
  story_points: 2
---

## Story
**As a** site author, **I want** to give any section a background — a solid color, an image, or a gradient, optionally with a tint overlay behind the section's text — **so that** I can place readable content over rich imagery and reproduce art-directed section designs without hand-writing CSS.

## Description
This story adds a section-level **background** as an optional, structured property of a module instance. A background is one of three kinds:

- **color** — a solid hex color fill
- **image** — a referenced asset, optionally fitted `cover` or `contain`
- **gradient** — a CSS gradient value

Any kind may additionally carry an optional **overlay** — a hex color plus an opacity between 0 and 1 — painted between the background and the section's content so text stays legible over busy imagery.

At render time the framework wraps a module carrying a background in three stacked layers, back to front: the background, the optional overlay tint, then the module's own content on top. The per-instance background/overlay appearance is computed by the framework (the author supplies structured values, never raw CSS), while the structural rules that stack the layers are shared and travel in the per-site stylesheet. A background is **scoped to its own section**: only modules that declare one are wrapped; every other module renders exactly as before.

**In scope**: the background structured property (color/image/gradient + optional overlay) on a module instance, its validation with path-pointed errors, three-layer rendering (background / overlay / content), and section-scoped wrapping folded into the render pipeline.

**Out of scope**: free-positioned/layered composition (the `layer` primitive) and motion — separate stories in this capability. Full-image *capture* of a reference site is a separate capability.

## Technical Context
- The background is a discriminated union on `type`, attached as an optional field on the module-instance contract in the site schema; malformed values (bad hex color, opacity outside 0..1) produce validation errors that point at the offending field path.
- Per-instance layer/overlay styling is emitted as framework-computed inline styles on framework-generated layer elements — the author cannot inject raw CSS through the background. The static structural CSS that positions the three layers is folded into the per-site stylesheet alongside module component CSS.
- Related art-direction primitives (layer/z-compositing, motion) share the same wrap-at-render + structured-schema pattern and live in the same capability (CAP-53). The overlay legibility mechanism introduced here is reused by later primitives.
- Reproduction motivation: text-over-background-image is the biggest fidelity gap identified by the capture design (DOC-13 §4).

## Dependencies
None.

## Story Points
2
