import type { BehaviorMeta } from '../behavior'

/**
 * `carousel` (REQ-79, reframed to a behavior by REQ-85; made layout-agnostic by
 * construction in REQ-96) — a horizontally-paged row of slides: a testimonial
 * rotator, a photo gallery, a logo strip.
 *
 * The core owns **only behaviour**: a pure CSS `scroll-snap` track (swipeable
 * with no JS), and an optional autoplay/loop driven by the behavior's vetted
 * client code (`client.js`, shipped as `capabilities.js`).
 *
 * REQ-96 removed `config.view`. It was presented as behavioural — "slides per
 * view" — but it resolved to a `flex-basis` (85% / 60% / a third), which is
 * exactly the aesthetic dial DOC-25 §2 forbids, shipped in the worked example the
 * doc used to explain the rule. A slide's width is now its own L1 subtree's
 * sizing, so "how much of the next slide peeks" stops being a three-valued enum
 * and becomes a number the reference already measured.
 *
 * The `gap` between slides and the pagination dots' size and colour went the same
 * way: the gap is the slide subtrees' own business, and a dot is a `control` leaf
 * whose entire look is the L1 node that names it.
 */
export const carouselMeta = {
  id: 'carousel',
  version: 3,
  kind: 'behavior',
  config: {
    // Auto-advance the track on a timer (vetted client behaviour); the SSR
    // baseline stays a static, hand-scrollable snap row.
    autoplay: { type: 'boolean', required: false, default: false },
    // Wrap from the last slide back to the first (paired with autoplay).
    loop: { type: 'boolean', required: false, default: false },
  },
  slots: {
    // One L1 subtree per slide — the slide's entire presentation. Repeated.
    slide: { repeated: true, required: true, minItems: 1, maxItems: 20 },
    // Optional pagination indicator: one L1 subtree holding a `dot-<i>` control
    // node per slide. Absent → the scrollable track is the only affordance,
    // which it always was.
    dots: { required: false },
  },
  controls: {
    // One dot per mounted slide, named `dot-0`, `dot-1`, … The module wires the
    // current-slide marker; L1 decides what a dot looks like.
    dot: { element: 'span', perSubtreeOf: 'slide', required: false },
  },
  conformance: {
    obligations: ['safety', 'security', 'x-browser', 'responsive', 'isolation'],
  },
} as const satisfies BehaviorMeta
