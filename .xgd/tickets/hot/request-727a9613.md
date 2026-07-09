---
uid: request-727a9613
id: REQ-16
type: request
title: 'Framework: structured motion primitive (entrance / scroll-reveal / hover)'
created_by: xgd
created_at: '2026-07-02T00:20:01.871249+00:00'
updated_at: '2026-07-09T20:00:46.917203+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  story_points: 5
  priority: medium
  auto_merge_back: true
  needs_review: false
  commits:
  - 60b2a71215d99b5a2daaeef119b1ab0186bed4ca
  version: 0.0.13
  bundled_in: bundle-f39884d2
---

## Scope

The highest-leverage language-growth primitive (surfaced by the sycamore.so analysis): a **structured motion system** — entrance animations, scroll-triggered reveals, hover states, stagger — expressed as **structured params** (which / trigger / duration / easing / delay), rendered server-side as CSS + a minimal island for scroll triggers. No raw CSS ([[DOC-7]] §6).

## Dependencies
REQ-4 (framework), REQ-3 (schema — motion fields).

## Deliverables (as built)

- **Schema** (`packages/site-schema/src/schema.ts`): `motionSchema` — a `.strict()` object attachable to a **module instance** *and* to a **layer child** (both discriminated-union variants):
  - `type`: `fade | slide | scale | stagger` (what animates)
  - `trigger`: `load | scroll | hover` (when)
  - `duration`, `delay`: non-negative integer **milliseconds** (optional; framework defaults apply)
  - `easing`: a **named enum** (`linear | ease | ease-in | ease-out | ease-in-out`) — a raw `cubic-bezier(...)` string is rejected, holding the DOC-7 §6.2 structured-only line.
  - Derived types exported: `Motion`, `MotionType`, `MotionTrigger`, `MotionEasing`.
- **Framework** (`packages/framework/src/modules/motion.ts`):
  - `MOTION_CSS` — static per-site CSS: `@keyframes` for fade/slide/scale, load/scroll animation binding, hover transitions, a `stagger` nth-child delay cascade (up to 12 children, 80ms step), and a `@media (prefers-reduced-motion: reduce)` block that disables all animation/transition and forces scroll-revealed content visible (motion never gates content).
  - `MOTION_SCRIPT` — a self-contained IntersectionObserver island (no imports) that adds `fc-motion--visible` as elements enter the viewport and unobserves them; degrades to revealing everything where IntersectionObserver is unavailable.
  - `wrapWithMotion` / `motionClasses` / `motionVars` — the framework (never the instance) turns params into trigger+type classes + framework-computed `--fc-motion-*` custom properties. Scroll motions carry `data-fc-motion-scroll` for the island.
- **Layer** (`layer.ts`): a layer child's motion wraps the child's **inner** content, not the positioned element — the child already owns `transform: rotate(...)`, which a slide/scale keyframe would otherwise clobber.
- **Render** (`tools/generate/src/render/render.ts`): motion wraps **outermost** (whole section animates as one unit, over REQ-14 background + REQ-15 layer); `MOTION_CSS` folded into the per-site `theme.css`; the island `<script>` injected **once per page**, only when the page (a module or any layer child) carries scroll-triggered motion.

## Design decisions during implementation

- **`easing` is a named enum, not free CSS** — keeps the structured-only guarantee; a raw cubic-bezier is a validation error (covered by a UAT).
- **`stagger`** is realised as an nth-child delay cascade on a group's direct children (bounded to 12), so it needs no per-child inline state.
- **Scroll island shipped inline** — the container render drops component `<script>` blocks (same as `<style>`), so the island is injected as a page-level inline `<script>` string rather than an Astro island bundle; it is emitted only when needed.
- **Reduced-motion is content-safe** — scroll-revealed elements are forced `opacity: 1` under `prefers-reduced-motion`.

## Test plan / UATs

`tests/req16-motion.test.ts` (node env — schema, CSS, params, end-to-end `1c` render):
- `test_UAT_FC_REQ-16_entrance_and_hover_render` — load/hover motions validate and render as trigger+type classes; raw-easing rejected.
- `test_UAT_FC_REQ-16_reduced_motion` — `prefers-reduced-motion` disables animation/transition and forces scroll content visible.
- `test_UAT_FC_REQ-16_params_drive_output` — duration/easing/delay flow into `--fc-motion-*`; omitted params fall through to defaults; layer-child motion wraps inner content; end-to-end render ships the island once and folds `MOTION_CSS` into `theme.css`.

`tests/req16-motion-island.test.ts` (jsdom — the shipped island, run against a stubbed IntersectionObserver; separated because esbuild/Astro cannot run under jsdom):
- `test_UAT_FC_REQ-16_scroll_reveal_hydrates` — the island reveals the element on intersection and stops observing it.
- `test_UAT_FC_REQ-16_scroll_reveal_degrades_without_observer` — content is revealed immediately where IntersectionObserver is absent.

All 5 UATs pass; full suite 102/102 green; site-schema / framework / generate typecheck clean.

## Out of scope
Generative/canvas animation (later); physics.