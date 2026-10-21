/**
 * The carousel's chrome — **‹ Workwear · 1 of 3 ›** ([[REQ-391]]).
 *
 * THE LOOKS OFFERED FOR A PAGE, "one of several, shown one at a time": the arrows,
 * what is shown, where it sits in the set, and the one line that says what it is.
 * ([[REQ-419]] — the comparable sites no longer page through it: Comparisons shows
 * them all at once.)
 *
 * IT HOLDS NOTHING. Its owner says what is shown and where, and is told when the
 * client asks to move; redrawing is the owner's, which keeps the owner the one
 * place the answer to "which one is shown" lives. By default the arrows stop at
 * the ends rather than wrapping, so "1 of 3" with a dead ‹ says plainly that this
 * is the first. An owner whose set is a ring — the looks, which the client steps
 * round and back through ([[REQ-402]], [[BUG-250]]) — asks for `wrap`.
 * The left and right arrow keys move too, while the control has focus.
 */
import { CAROUSEL_COUNT, CAROUSEL_NEXT, CAROUSEL_PREVIOUS } from './config.js'

/**
 * @param {object} options
 * @param {string} options.label what the shown one is called
 * @param {number} options.index where it sits, from 0
 * @param {number} options.count how many there are
 * @param {string} [options.description] the one line under it
 * @param {boolean} [options.wrap] step past either end round to the other
 * @param {(to: number, direction: 'next' | 'previous') => void} options.onMove the
 *   client asked for this index, by stepping this way — which a wrapped step needs,
 *   since the last-to-first move is "next" though the index goes down
 * @returns {HTMLElement}
 */
export function carouselNav({ label, index, count, description, wrap = false, onMove }) {
  const root = document.createElement('div')
  root.className = 'builder-carousel'

  const nav = document.createElement('div')
  nav.className = 'builder-carousel__nav'
  nav.setAttribute('role', 'group')
  nav.setAttribute('aria-label', `${label}, ${CAROUSEL_COUNT(index + 1, count)}`)

  /** Where a step to `to` lands, or `null` when there is nowhere to go. */
  const target = (to) => {
    if (wrap) return count > 1 ? (to + count) % count : null
    return to < 0 || to >= count ? null : to
  }

  const arrow = (className, text, name, to, direction) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = className
    b.textContent = text
    b.setAttribute('aria-label', name)
    b.disabled = target(to) === null
    b.addEventListener('click', () => onMove(target(to), direction))
    return b
  }
  const text = (className, value) => {
    const span = document.createElement('span')
    span.className = className
    span.textContent = value
    return span
  }

  nav.append(
    arrow('builder-carousel__prev', '‹', CAROUSEL_PREVIOUS, index - 1, 'previous'),
    text('builder-carousel__label', label),
    text('builder-carousel__sep', '·'),
    text('builder-carousel__count', CAROUSEL_COUNT(index + 1, count)),
    arrow('builder-carousel__next', '›', CAROUSEL_NEXT, index + 1, 'next'),
  )
  nav.addEventListener('keydown', (ev) => {
    const step = ev.key === 'ArrowLeft' ? -1 : ev.key === 'ArrowRight' ? 1 : 0
    const to = step ? target(index + step) : null
    if (to === null) return
    ev.preventDefault()
    onMove(to, step > 0 ? 'next' : 'previous')
  })
  root.append(nav)
  if (description) root.append(text('builder-carousel__description', description))
  return root
}
