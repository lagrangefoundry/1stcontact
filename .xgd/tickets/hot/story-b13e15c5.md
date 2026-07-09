---
uid: story-b13e15c5
id: STORY-61
type: story
title: 'Structured motion: entrance, scroll-reveal, hover, and stagger as declarative
  params'
created_by: xgd
created_at: '2026-07-09T20:51:10.568388+00:00'
updated_at: '2026-07-09T20:59:01.127592+00:00'
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

**As a** site author (or the AI acting on my behalf), **I want** to attach animation to a section or a positioned layer child as structured parameters — what animates, when, how long, and with which named easing — **so that** my pages gain entrance, scroll-reveal, hover, and staggered motion without ever writing or smuggling raw CSS, and without motion ever hiding content from readers who cannot see it.

## Description

Adds a **structured motion primitive** to the art-direction language. A `motion` is optional structured data attachable to a module instance and to a layer child. It declares:

- **type** — what animates: `fade`, `slide`, `scale`, or `stagger` (sequence a group's direct children)
- **trigger** — when it plays: `load` (on render), `scroll` (when the element enters the viewport), or `hover` (on pointer)
- **duration** / **delay** — non-negative integer milliseconds (optional; framework defaults apply when omitted)
- **easing** — a named curve from a finite set (`linear | ease | ease-in | ease-out | ease-in-out`)

The framework — never the instance — turns these params into scoped CSS classes and framework-computed `--fc-motion-*` custom properties. A raw `cubic-bezier(...)` easing string, or any raw-CSS/style field, is rejected: motion is structured-only (DOC-7 §6.2), keeping the security and reproducibility boundary intact.

Rendering is server-side: a static motion stylesheet (keyframes for fade/slide/scale, load/scroll animation binding, hover transitions, and a bounded stagger cascade over a group's children) is folded into the per-site stylesheet. Scroll-triggered motion additionally ships a single self-contained viewport-observer script, injected once per page and only when the page actually contains scroll motion, which reveals each element as it enters view.

Motion is decoration, never a content gate: under an operating-system reduced-motion preference, all animation and transition is disabled and any scroll-revealed content is forced visible.

**In scope:** the four motion types, three triggers, duration/delay/easing params, structured-only validation, server-rendered CSS, the once-per-page scroll-reveal behaviour, the reduced-motion safety guarantee, and motion on both module instances and layer children (where a child's motion animates its inner content without clobbering the child's own positioning transform).

**Out of scope:** raw CSS animation, arbitrary keyframes, per-property timelines, scroll-linked (scrubbed) animation, and JavaScript-driven physics — none are expressible and none are built.

## Technical Context

- Reuses the wrap-in-render pattern established by the section background (REQ-14) and layer (REQ-15) primitives in this bundle: motion wraps outermost so a whole section animates as one unit, and on a layer child it wraps the child's inner content only.
- Belongs to CAP-53 (Framework: Art-Direction Language), alongside the section-background and layer/z-compositing stories from this same bundle.
- Depends conceptually on the framework module-render pipeline and the site-definition schema; on the layer primitive (REQ-15) it composes with a child's structured position.
- Intent (REQ-16 in bundle-f39884d2) and the implemented code agree: schema `motionSchema` in `packages/site-schema/src/schema.ts`, framework `motion.ts`, and the render wiring in `tools/generate/src/render/render.ts` match the declared deliverables. No divergence noted.

## Dependencies

None (plan item 5 has no listed dependencies; it composes with REQ-15 where a layer child carries motion, but does not require it).

## Story Points

2