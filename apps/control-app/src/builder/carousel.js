/**
 * The carousel's chrome — **‹ Workwear · 1 of 3 ›** ([[REQ-391]]).
 *
 * ONE CONTROL FOR EVERYTHING THE PREVIEW PAGES THROUGH. The looks offered for a
 * page and the comparable sites on the comp board ([[REQ-378]]) are both "one of
 * several, shown one at a time", so they share this control and the client
 * learns it once: the arrows, what is shown, where it sits in the set, and the
 * one line that says what it is.
 *
 * IT HOLDS NOTHING. Its owner says what is shown and where, and is told when the
 * client asks to move; redrawing is the owner's, which keeps the owner the one
 * place the answer to "which one is shown" lives. The arrows stop at the ends
 * rather than wrapping, so "1 of 3" with a dead ‹ says plainly that this is the
 * first. The left and right arrow keys move too, while the control has focus.
 */
import { CAROUSEL_COUNT, CAROUSEL_NEXT, CAROUSEL_PREVIOUS } from './config.js'

/**
 * @param {object} options
 * @param {string} options.label what the shown one is called
 * @param {number} options.index where it sits, from 0
 * @param {number} options.count how many there are
 * @param {string} [options.description] the one line under it
 * @param {(to: number) => void} options.onMove the client asked for this index
 * @returns {HTMLElement}
 */
export function carouselNav({ label, index, count, description, onMove }) {
  const root = document.createElement('div')
  root.className = 'builder-carousel'

  const nav = document.createElement('div')
  nav.className = 'builder-carousel__nav'
  nav.setAttribute('role', 'group')
  nav.setAttribute('aria-label', `${label}, ${CAROUSEL_COUNT(index + 1, count)}`)

  const arrow = (className, text, name, to) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = className
    b.textContent = text
    b.setAttribute('aria-label', name)
    b.disabled = to < 0 || to >= count
    b.addEventListener('click', () => onMove(to))
    return b
  }
  const text = (className, value) => {
    const span = document.createElement('span')
    span.className = className
    span.textContent = value
    return span
  }

  nav.append(
    arrow('builder-carousel__prev', '‹', CAROUSEL_PREVIOUS, index - 1),
    text('builder-carousel__label', label),
    text('builder-carousel__sep', '·'),
    text('builder-carousel__count', CAROUSEL_COUNT(index + 1, count)),
    arrow('builder-carousel__next', '›', CAROUSEL_NEXT, index + 1),
  )
  nav.addEventListener('keydown', (ev) => {
    const to = ev.key === 'ArrowLeft' ? index - 1 : ev.key === 'ArrowRight' ? index + 1 : null
    if (to === null || to < 0 || to >= count) return
    ev.preventDefault()
    onMove(to)
  })
  root.append(nav)
  if (description) root.append(text('builder-carousel__description', description))
  return root
}
