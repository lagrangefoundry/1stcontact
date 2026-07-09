---
uid: story-4f50c054
id: STORY-60
type: story
title: Freely-positioned layers with z-compositing over a section or module
created_by: xgd
created_at: '2026-07-09T20:42:28.172099+00:00'
updated_at: '2026-07-09T20:49:23.361258+00:00'
completed_at: null
last_field_updated: status
status: reconciling
fields:
  intent_uid: bundle-f39884d2
  capability_uid: capability-5fcda566
  story_kind: feature
  story_points: 2
---

## Story
**As a** site author (or an AI editor acting on my behalf), **I want** to place images and text runs at freely-chosen positions, stacked over a section — or composited over another module — using structured position data only, **so that** I can build art-directed compositions (photo montages, overlapping heroes, text-over-image layouts) without ever writing raw CSS.

## Description
This capability adds a **layer** — an ordered stack of freely-positioned children (images and markdown text runs) — as an optional structured field on any module instance. The children are composited *over* the host module's own markup, so attaching a layer to a module gives z-compositing over that module for free. A registered standalone **`layer`** module provides a bare art-directed section whose only content is its positioned children.

Each child carries a structured **position** (numeric `x`/`y`/`z`, optional `width`/`height`/`rotate`, all as unitless numbers the author supplies), with optional **per-breakpoint overrides** for any subset of those fields. Image children may carry enumerated **treatments** — a `shape` (circle / rounded) and an `edge` (soft-mask feather / torn-asset mask). A layer may carry an optional **overlay** tint between the host content and the child stack, and a **reflow** policy that (by default) collapses absolute positioning to normal document flow below a chosen breakpoint.

**In scope:** the `layer` structured field, the standalone `layer` host module, image + text children, structured positions with per-breakpoint overrides, image treatments, overlay tint, reflow policy, and strict rejection of raw CSS/HTML.

**Out of scope:** motion/animation (REQ-16, separate story), generative/canvas visuals, and "other modules as children" (the child union is image | text only; extending it is deferred).

## Technical Context
- Mirrors the REQ-14 **background** wrap pattern (item 3, same capability CAP-53) for coherence: `layer` is an optional field on the module instance, applied by a `wrapWithLayer` wrap in the render pipeline alongside the background wrap, so there is one integration point and no new render machinery. Render order is background → layer → motion (outermost).
- All positioning is **structured data**; the framework (never the instance) turns numeric positions into framework-computed CSS custom properties, and static positioning/reflow/treatment rules ship as a single stylesheet block folded into the per-site `theme.css`. This is the security / reproducibility line (DOC-7 §6.2): no instance-supplied CSS reaches the page.
- The layer, position, child, and module-instance schemas are all strict, so a raw `style`/`css`/`html` prop anywhere in the structure is a path-pointed validation error — reusing the strict-validation contract owned by the Site Definition Schema capability.
- The overlay reuses REQ-14's overlay shape (hex color + 0..1 opacity).

## Dependencies
- Item 3 — Section background (REQ-14, same capability): the overlay legibility mechanism and the wrap-in-render pattern that this item reuses.

## Story Points
2