---
uid: story-3569e1a4
id: STORY-81
type: story
title: 'Responsive dials: length parameters vary per breakpoint and the nav collapse
  point is configurable'
created_by: xgd
created_at: '2026-07-19T03:20:16.873338+00:00'
updated_at: '2026-07-23T09:18:22.550867+00:00'
completed_at: null
last_field_updated: body
status: archived
fields:
  intent_uid: bundle-ab9e0cb6
  capability_uid: capability-bd0b722e
  story_kind: upgrade
  story_points: 3
  updated_by: bundle-31e474b9
---

## Story
**As a** site-definition author reproducing or designing a responsive site, **I want** a module's per-viewport-width variation to be carried by the L1 layout substrate rather than by module-level per-breakpoint dials, **so that** the published site adapts across screen sizes exactly as the reference does, using values folded per-viewport from the capture ladder.

## Description
This capability was originally delivered as **per-breakpoint module dials** (`{ base, sm?, md?, lg?, xl? }` on spacing-bearing layout modules) plus a header `navCollapse` dial. The REQ-79 framework pivot (Phase C / REQ-84, commit `1a2faeee`) deleted the semantic layout modules — header, hero, footer, text-block, services-grid, layer — and their ~20 dials, including every per-breakpoint length dial and `navCollapse`. That delivery mechanism **no longer exists in code**.

Per-viewport variation is now a property of the **L1 layout substrate** (REQ-82 / REQ-83, plan items 1–2). L1 geometry is declared as **per-viewport keyframes** — an ascending-by-width track of `{ at, x, y, width, height? }` values — with **per-segment `interpolate|snap` flags** describing how each pair of adjacent keyframes transitions between widths (`interpolate` = linear across the width band, `snap` = hold-then-jump at a reflow). During capture, `foldToL1` folds the 6-width sampled ladder into a single L1 document, emitting these per-viewport keyframes directly; the renderer compiles them to media-queried `calc()`/snap rules. This is the same per-viewport-width adaptation the module dials expressed, re-homed in one typed substrate.

`navCollapse` depended entirely on the deleted header module and is **removed with no L1 successor** — there is no capability behind it any more.

**In scope (current code):** per-viewport value variation via L1 geometry keyframes with `interpolate|snap` segments.
**Superseded (delivery deleted by the pivot):** per-breakpoint length dials, per-breakpoint content-width cap, the per-breakpoint object schema shape, and the `navCollapse` header dial.
**Out of scope:** the L1 substrate/fold implementation itself (owned by plan items 1–2 / the L1 stories).

## Technical Context
This is a reconciliation **upgrade**: the responsive-across-widths capability survives, but its delivery has moved from module dials (deleted) to L1 geometry keyframes. The module-dial ACs (AC-666..AC-671, AC-673) describe behaviour the code no longer implements and were removed. The surviving per-viewport variation is delivered by the L1 geometry-keyframe substrate and is owned by CAP-70 (L1 Layout Substrate) and CAP-71 (Capture-to-L1 Fold), not by this capability.

**Container disposition (decided 2026-07-23):** because CAP-68 has no distinct behaviour of its own remaining, the capability has been **retired — marked `superseded` by CAP-70 (`capability-ae9d65d6`)**. No thin L1-repointing AC is retained under CAP-68: a hollow pointer would duplicate ownership CAP-70/CAP-71 already hold, contradicting the project policy to close capability gaps in L1 rather than keep legacy containers. This story is therefore archived under a superseded capability and no repointing AC exists or is needed.

Grounded in `packages/site-schema/src/l1/schema.ts` (keyframe + `interpolate|snap` segment schema) and `tools/generate/src/l1/fold.ts` (the capture→L1 fold). No `navCollapse` or per-breakpoint-dial symbol remains anywhere in `packages/` or `tools/`.

## Story Points
2
