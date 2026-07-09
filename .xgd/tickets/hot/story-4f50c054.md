---
uid: story-4f50c054
id: STORY-60
type: story
title: Freely-positioned layers with z-compositing over a section or module
created_by: xgd
created_at: '2026-07-09T20:42:28.172099+00:00'
updated_at: '2026-07-09T22:35:16.562851+00:00'
completed_at: null
last_field_updated: story_kind
status: reconciling
fields:
  intent_uid: bundle-f39884d2
  capability_uid: capability-5fcda566
  story_kind: upgrade
  story_points: 2
---

## Story
**As a** site author (or an AI editor acting on my behalf), **I want** to place images and text runs at freely-chosen positions, stacked over a section — or composited over another module — with structured, token-backed art-direction treatments (typography, image shadow/border/feather, multi-line titled blocks) and using structured data only, **so that** I can build art-directed compositions (photo montages, overlapping heroes, text-over-image layouts, wordmarks over imagery) that reproduce faithfully without ever writing raw CSS.

## Description
This capability adds a **layer** — an ordered stack of freely-positioned children (images and markdown text runs) — as an optional structured field on any module instance. The children are composited *over* the host module's own markup, so attaching a layer to a module gives z-compositing over that module for free. A registered standalone **`layer`** module provides a bare art-directed section whose only content is its positioned children.

Each child carries a structured **position** (numeric `x`/`y`/`z`, optional `width`/`height`/`rotate`, all as unitless numbers the author supplies), with optional **per-breakpoint overrides** for any subset of those fields. A layer may carry an optional **overlay** tint between the host content and the child stack, and a **reflow** policy that (by default) collapses absolute positioning to normal document flow below a chosen breakpoint.

**Text children** may carry structured, token-backed **typography** — `size` (font-scale step), `weight`, `color` (palette role), `font` (heading/body/display), `tracking` (closed enum → em), `align`, `leading` (line-height token), and a legibility text-shadow preset (`soft` dark shadow / `glow` drop+light-halo). A text child may instead carry a **`lines`** titled-block form (`lines: [{ text, typography? }]`, mutually exclusive with `text`) rendered as one positioned flow block so the inter-line gap between, e.g., a wordmark and its tagline stays content-based and fixed at any viewport height.

**Image children** may carry enumerated **treatments** — a `shape` (circle / rounded), an `edge` (soft-mask feather / torn-asset mask) with a `feather` step (sm/md/lg) tuning the soft-mask's opaque radial stop, a `shadow` step bound to the theme shadow tokens (lifting a montage photo off the background), and a token-backed `border` (`{ width: none|thin|medium|thick, color: <palette-role> }`) that frames/rings it.

**In scope:** the `layer` structured field, the standalone `layer` host module, image + text children, structured positions with per-breakpoint overrides, image shape/edge/feather/shadow/border treatments, layer text-child typography and multi-line titled blocks, overlay tint, reflow policy, faithful positioning geometry (in-place rotation, true circles, box-sized soft mask), and strict rejection of raw CSS/HTML.

**Out of scope:** generative/canvas visuals, and "other modules as children" (the child union is image | text only; extending it is deferred). Motion/animation is owned by REQ-16 (separate story) but composes with layer children.

## Technical Context
- Mirrors the REQ-14 **background** wrap pattern (item 3, same capability CAP-53) for coherence: `layer` is an optional field on the module instance, applied by a `wrapWithLayer` wrap in the render pipeline alongside the background wrap, so there is one integration point and no new render machinery. Render order is background → layer → motion (outermost).
- All positioning **and** treatments are **structured data**; the framework (never the instance) turns numeric positions and enumerated treatment fields into framework-computed CSS custom properties / token references (`var(--font-size-*)`, `var(--font-weight-*)`, `var(--color-*)`, `var(--shadow-*)`, `--fc-feather`, …), and static positioning/reflow/treatment rules ship as a single stylesheet block folded into the per-site `theme.css`. This is the security / reproducibility line (DOC-7 §6.2): no instance-supplied CSS reaches the page.
- **Every art-direction field resolves to a theme token or a fixed framework value** — typography sizes/weights/colours/fonts/leading map to theme-token custom properties, `tracking` to a closed em set, text `shadow` to a fixed legibility/glow preset, image `shadow` to `var(--shadow-<step>)` (a new **`xl`** shadow token was added, optional and defaulted so existing themes validate), image `border` to `<px> solid var(--color-<role>)`, and `feather` to the soft-mask's opaque radial-stop percentage.
- **Positioning geometry is faithful** so an art-directed montage reproduces to the pixel: children rotate *in place* about their centre (`transform-origin: center`); the motion wrapper is transparent to image sizing so a definite-height image child fills its box whether or not it carries motion; a `shape: circle` child is a true circle (`aspect-ratio: 1`, not reliant on a percentage height that would collapse to an ellipse); the soft mask is a box-sized ellipse; and layer text links carry a tasteful underline offset.
- Text children carry exactly one of `text` or `lines`, enforced at validation. The layer, position, child, and module-instance schemas are all strict, so a raw `style`/`css`/`html` prop anywhere in the structure is a path-pointed validation error — reusing the strict-validation contract owned by the Site Definition Schema capability.
- The overlay reuses REQ-14's overlay shape (hex color + 0..1 opacity).

## Dependencies
- Item 3 — Section background (REQ-14, same capability): the overlay legibility mechanism and the wrap-in-render pattern that this item reuses.

## Story Points
3
