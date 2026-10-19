/**
 * The one way the builder draws a banner ([[BUG-231]]).
 *
 * THE RULE, FOR EVERY BANNER HERE AND EVERY ONE ADDED LATER:
 *
 * - A banner the client can act on — a failure they have read, a notice they
 *   have taken in — is `dismissible`. It gets a × at its top right: a real
 *   `<button>` named "Dismiss", and Escape from anywhere inside the banner does
 *   the same thing.
 * - A banner that explains WHY THE BUILDER CANNOT BE USED is not. The
 *   unconfigured deployment ([[REQ-173]]), the no-business block ([[REQ-179]])
 *   and the running publish ([[REQ-222]]) each describe something still true
 *   and are the reason the screen is locked; hiding one would leave a locked
 *   builder with no explanation. The session notice ([[BUG-52]]) is the same
 *   kind of fact and is likewise never dismissible.
 *
 * DISMISSING REMOVES THE ELEMENT AND NOTHING ELSE. No state behind the banner is
 * touched — a failed publish is still unpublished, and the next failure draws a
 * fresh banner even when its sentence is the same one the client dismissed. That
 * is why nothing here remembers what was dismissed.
 *
 * THE × IS IN ONE PLACE so it cannot be missing from some banners, and it wears
 * the same muted glyph as the chip remove control.
 *
 * @param {object} spec
 * @param {string} spec.className - the banner's own classes
 * @param {'alert'|'status'} [spec.role]
 * @param {string|Node|Array<string|Node>} spec.content - what it says (and any controls of its own)
 * @param {boolean} [spec.dismissible]
 * @returns {HTMLDivElement}
 */
export function createBanner({ className, role = 'alert', content, dismissible = false }) {
  const element = document.createElement('div')
  element.className = className
  element.setAttribute('role', role)
  element.append(...[content].flat())
  if (!dismissible) return element

  element.classList.add('builder-banner--dismissible')
  const dismiss = document.createElement('button')
  dismiss.type = 'button'
  dismiss.className = 'builder-banner__dismiss'
  dismiss.setAttribute('aria-label', 'Dismiss')
  // The glyph is drawn by CSS, so the banner's text stays exactly its sentence —
  // a copied message has no stray "×" on the end.
  dismiss.addEventListener('click', () => element.remove())
  element.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') element.remove()
  })
  element.append(dismiss)
  return element
}
