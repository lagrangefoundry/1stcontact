import type { CapabilityMeta } from '../capability'

/**
 * `carousel` (REQ-79, reframed to a capability by REQ-85) — a horizontally-paged
 * row of slides: a testimonial rotator, a photo gallery, a logo strip, a feature
 * carousel. Since the framework pivot the carousel owns **only behaviour** — a
 * pure CSS `scroll-snap` track (swipeable with no JS), how many slides show per
 * view, a decorative dots indicator, and an optional autoplay/loop driven by the
 * capability's **vetted client code** (`client.js`, shipped as `capabilities.js`).
 * Every aesthetic that used to live on a dial (surface, spacing, gap, card chrome,
 * heading case, content width, alignment) is gone: a slide's **look** is authored
 * as an L1 subtree and mounted into the repeated `slide` slot. The module wraps
 * L1; it never paints it.
 */
export const carouselMeta = {
  id: 'carousel',
  version: 2,
  kind: 'capability',
  config: {
    // Slides per view — `single` fills the view, `peek` shows neighbours at the
    // edges, `multi` fits several. A behavioural scroll property, not a dial.
    view: { type: 'enum', required: false, values: ['single', 'peek', 'multi'], default: 'single' },
    // Pagination affordance — `dots` adds a decorative indicator row (the real
    // affordance is always the scrollable track).
    controls: { type: 'enum', required: false, values: ['none', 'dots'], default: 'none' },
    // Auto-advance the track on a timer (vetted client behaviour); the SSR
    // baseline stays a static, hand-scrollable snap row.
    autoplay: { type: 'boolean', required: false, default: false },
    // Wrap from the last slide back to the first (paired with autoplay).
    loop: { type: 'boolean', required: false, default: false },
  },
  slots: {
    // One L1 subtree per slide — the slide's entire presentation. Repeated.
    slide: { repeated: true, required: true, minItems: 1, maxItems: 20 },
  },
  conformance: {
    obligations: ['safety', 'security', 'x-browser', 'responsive', 'isolation'],
  },
} as const satisfies CapabilityMeta
