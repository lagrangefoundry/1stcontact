import type { L1Node } from '@1stcontact/site-schema'
import { renderL1Fragment, type L1ControlElement } from '../../l1/render'
import type { BehaviorProps } from '../behavior'
import { attr } from '../html'

/**
 * `carousel` behavior (REQ-79, reframed REQ-85; layout-agnostic by construction
 * in REQ-96; plain TypeScript since REQ-148).
 *
 * The vetted core owns only behaviour: a pure CSS `scroll-snap` track (swipeable
 * with no JS) and an optional autoplay/loop wired by `client.js`. Each slide's
 * presentation is an **L1 subtree** mounted into the repeated `slide` slot, and
 * each pagination dot is an L1 `control` node naming an element the module
 * declares — so the module paints neither.
 *
 * Slot CSS is per-instance (geometry/colour vary by slide), so it is emitted as a
 * `<style>` in the body rather than folded into the static chrome (`styles.css`),
 * which is the same for every instance. `instanceId` namespaces the slot classes
 * so multiple carousels on a page never collide.
 *
 * See `../contact-form/component.ts` on why this is a plain function and not an
 * `.astro` component (REQ-148).
 */
export function carousel({
  config = {},
  slots = {},
  instanceId = 'carousel',
  edit = false,
}: BehaviorProps = {}): string {
  const autoplay = config.autoplay === true
  const loop = config.loop === true

  // Isolation (REQ-85): malformed slot content must not break the page. Coerce to
  // an array and drop any non-object subtree; the L1 renderer re-checks each value.
  const slideNodes: L1Node[] = Array.isArray(slots.slide)
    ? slots.slide.filter((n): n is L1Node => !!n && typeof n === 'object')
    : []
  const { htmls: slideHtmls, css: slideCss } = renderL1Fragment(
    slideNodes,
    `${instanceId}-slide`,
    undefined,
    { edit },
  )

  // REQ-96 — the module's half of the dot contract: one declared element per
  // mounted slide, carrying the behavioural markers `client.js` reads. What a dot
  // *looks* like is entirely the L1 node that names it.
  const dotControls: Record<string, L1ControlElement> = {}
  slideNodes.forEach((_, i) => {
    dotControls[`dot-${i}`] = {
      tag: 'span',
      attrs: {
        'data-carousel-dot': String(i),
        'aria-hidden': 'true',
        // The current-slide marker: a behavioural state no static L1 subtree can
        // express, so the module owns it (and the one invariant rule in styles.css).
        'data-carousel-current': i === 0 ? true : undefined,
      },
    }
  })
  const dotsSlot = slots.dots
  const dotsNode: L1Node[] =
    dotsSlot && typeof dotsSlot === 'object' && !Array.isArray(dotsSlot) ? [dotsSlot] : []
  const dots = renderL1Fragment(dotsNode, `${instanceId}-dots`, dotControls, { edit })
  const slotCss = [slideCss, dots.css].filter(Boolean).join('\n')

  // REQ-117 — `data-l1-slot` marks the seam, so the editor can tell which of the
  // module's slots an addressed subtree belongs to. `contact-form` marks its form
  // the same way.
  const slides = slideHtmls
    .map((html) => `<li class="carousel__slide" data-l1-slot="slide">${html}</li>`)
    .join('\n    ')

  return `<section class="carousel" data-carousel${attr(
    'data-carousel-autoplay',
    autoplay ? '' : undefined,
  )}${attr('data-carousel-loop', loop ? '' : undefined)}>
  <ul class="carousel__track" role="list">
    ${slides}
  </ul>
  ${dots.htmls[0] ?? ''}
  ${slotCss ? `<style>${slotCss}</style>` : ''}
</section>`
}
