---
uid: acceptance_criterion-053767be
id: AC-829
type: acceptance_criterion
title: A node paints a repeating texture from a typed axis with no asset
created_by: xgd
created_at: '2026-08-06T02:20:53.736828+00:00'
updated_at: '2026-08-09T05:41:01.597106+00:00'
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
A node paints a **repeating texture** from a typed axis alone — no image asset,
no raw CSS. The axis names the intent, not the declaration: a shape drawn from a
closed set (`dots` | `grid` | `lines`), a tile period in px, an optional line
width (the dot **diameter** for `dots`; defaults 2px for dots, 1px otherwise), a
hex colour, and an optional tilt in degrees.

The published page shows each shape drawn by the renderer from those fields:
- **dots** — one repeating disc layer, tiled on the declared period, the disc's
  radius half the declared width;
- **grid** — two repeating layers, one rule set per axis (a CSS gradient runs
  along a single axis, so a grid cannot be one layer), both tiled on the same
  period so the cells are square;
- **lines** — a single self-periodic repeating layer that carries its own period,
  so it tilts at the declared angle without the tile shearing.

The tilt applies to `lines` only and is inert on the other shapes, exactly as a
mask's feather width is inert on a circular crop. The period is whatever the
author declares — nothing about the axis is a fixed tile — and no emitted
declaration contains a `url(...)`, a passthrough style string, or any token not
re-derived from a number, a closed enum or a hex colour.

## Verification
Render a container declaring each shape in turn and inspect the emitted CSS:
observe a repeating disc layer whose tile equals the declared period and whose
radius is half the declared width; observe two rule-set layers for a grid, one
per axis, tiling on one period; observe a single self-periodic layer for `lines`
carrying the declared angle. Assert every layer carries the declared hex colour
and that no layer references an asset URL. Re-render with a different period and
observe the tile follow it. Confirm the whole document clears the envelope.