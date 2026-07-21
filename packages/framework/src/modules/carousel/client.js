/**
 * Vetted client behaviour for the `carousel` capability (REQ-85).
 *
 * A capability module ships fixed, tested behavioural CODE — this is the
 * carousel's. It is authored as self-contained browser JavaScript (no imports)
 * so the render pipeline can ship it verbatim as a static `capabilities.js`
 * asset; the pure algorithm is unit-tested by importing this module directly.
 *
 * Behaviour: the SSR baseline is a pure CSS `scroll-snap` track (usable with no
 * JS). This upgrades it — `data-carousel-autoplay` advances the track on a timer,
 * `data-carousel-loop` wraps from the last slide back to the first.
 *
 * **Isolation** (REQ-85): every entry point is defensive — a missing element, a
 * one-slide track, or an absent timer API degrades to the static baseline and
 * never throws, so a misbehaving carousel can never break page robustness.
 */

const AUTOPLAY_INTERVAL_MS = 5000

/** Advance a track by one slide, wrapping to the start when `loop` and at the end. */
export function advanceTrack(track, loop) {
  const slide = track.querySelector('.carousel__slide')
  const step = slide ? slide.getBoundingClientRect().width : track.clientWidth
  const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1
  if (atEnd) {
    if (loop) track.scrollTo({ left: 0, behavior: 'smooth' })
    return
  }
  track.scrollBy({ left: step, behavior: 'smooth' })
}

/**
 * Attach autoplay/loop to one carousel `<section>`. `schedule` is injectable so
 * the behaviour is unit-testable without a real timer; it defaults to the global
 * `setInterval`.
 */
export function enhanceCarousel(section, schedule) {
  try {
    if (!section.hasAttribute('data-carousel-autoplay')) return
    const loop = section.hasAttribute('data-carousel-loop')
    const track = section.querySelector('.carousel__track')
    if (!track || track.querySelectorAll('.carousel__slide').length < 2) return
    const timer = schedule || (typeof setInterval === 'function' ? setInterval : null)
    if (!timer) return
    timer(function () {
      try {
        advanceTrack(track, loop)
      } catch (_e) {
        // A single failed advance must never break the page.
      }
    }, AUTOPLAY_INTERVAL_MS)
  } catch (_e) {
    // Isolation: enhancement failure degrades to the no-JS baseline.
  }
}

/** Enhance every carousel in `root` (defaults to `document`). */
export function enhanceAllCarousels(root) {
  const scope = root || (typeof document !== 'undefined' ? document : null)
  if (!scope) return
  const sections = scope.querySelectorAll('[data-carousel]')
  for (let i = 0; i < sections.length; i++) enhanceCarousel(sections[i])
}

// Auto-init when shipped to the browser; inert under Node/JSDOM-less test imports.
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      enhanceAllCarousels()
    })
  } else {
    enhanceAllCarousels()
  }
}
