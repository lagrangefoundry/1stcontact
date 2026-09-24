/**
 * [[REQ-314]] — the font row in a segment's parameter sheet.
 *
 * One row, showing the typeface the words are currently set in — **written in
 * that typeface** — and opening the picker to change it.
 *
 * WHY IT IS HERE AND NOT IN `mountFields`. The descriptor's closed list is not
 * in the descriptor: a `font` field admits any family the platform's mirror
 * holds, which is ~1,900 of them, and carrying that list in every response to
 * every segment would put the whole corpus on the wire to answer a question the
 * write side has to ask again anyway. A control whose options are not in its own
 * descriptor is not reachable through the component's seams, so the modal draws
 * this row itself and hands the rest to `mountFields` unchanged — exactly the
 * split `color-field.js` and `image-picker.js` already make, and split on the
 * DESCRIPTOR rather than on the segment kind so the day a second surface exposes
 * a typeface it is answered here too.
 *
 * THE SELECTED FAMILY IS DRAWN IN ITS OWN FACE AND IT COSTS NOTHING. That face
 * is already loaded — it is painting the page behind this dialog, and
 * `page-style.js` has already copied the frame's own `@font-face` rules into
 * this document so the editing box can mirror the page. A family chosen in the
 * picker and not yet saved has no face here and falls back to the UI font, which
 * is honest: the page is not painting it yet either.
 */

/** True for a field this control owns rather than `mountFields`. */
export function isFontField(field) {
  return field?.type === 'font'
}

/** What to call the typeface a value names. */
export function fontLabel(value) {
  const name = typeof value === 'string' ? value.trim() : ''
  // "Inherited" and not "None": a run that declares no family is painted in
  // whatever its ancestors declare, which is a real typeface on a real page —
  // saying "None" would claim the words are set in nothing.
  return name === '' ? 'Inherited' : name
}

/** Paint the chip: the family's name, set in the family. */
function faceInto(element, value) {
  element.textContent = fontLabel(value)
  const name = typeof value === 'string' ? value.trim() : ''
  // Quoted and with the UI font behind it, so a family whose face this document
  // cannot resolve degrades to a readable row rather than to the browser's
  // default serif.
  element.style.fontFamily = name === '' ? '' : `"${name.replace(/["\\]/g, '')}", var(--shell-font, sans-serif)`
}

/**
 * Mount one font row, and answer for what is picked in it.
 *
 * Staged, never committed — {@link getValue} reports the pick and nothing else
 * happens until the modal's Save, so a typeface travels in the same change map
 * as the words beside it: one modal, one diff (DOC-28 §11). Binding the faces
 * into the page's `resources.fonts` is the ORIGIN's step, through `use_font`'s
 * own resolver; this control chooses a name and nothing more.
 *
 * A LOCKED descriptor (REQ-139) mounts the same row, drawn as unavailable, for
 * the reason `mountColorField` states: the component's own `locked` handling
 * cannot reach a row it never rendered, and a disabled-looking row that still
 * opened a picker would be worse than no lock at all.
 *
 * @param {Element} host - where the row is appended
 * @param {object} spec
 * @param {{name: string, label: string, locked?: boolean, reason?: string}} spec.field
 * @param {string|undefined} spec.value - the family the run is set in
 * @param {(value: string) => Promise<string|null>} spec.openPicker
 * @returns {{name: string, element: Element, getValue: () => unknown,
 *            isDirty: () => boolean, focus: () => void}}
 */
export function mountFontField(host, { field, value, openPicker }) {
  const initial = typeof value === 'string' ? value : ''
  let current = initial

  const element = document.createElement('div')
  element.className = 'builder-font'
  // The field NAME on the row, and the same `is-locked` class `mountFields`
  // marks its own locked rows with (REQ-139) — so "a locked row looks locked and
  // says why" stays one rule over one selector, whichever control drew the row.
  element.dataset.field = field.name
  if (field.locked) element.classList.add('is-locked')

  const label = document.createElement('span')
  label.className = 'builder-font__label'
  label.id = `builder-font-label-${field.name}`
  label.textContent = field.label

  // A BUTTON, because it opens a dialog — the same reasoning the colour swatch
  // gives. The row is not a value you type into and not a list you arrow
  // through; the whole control is "open the picker".
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'builder-font__current'
  button.setAttribute('aria-labelledby', `${label.id} ${label.id}-value`)
  const face = document.createElement('span')
  face.className = 'builder-font__face'
  face.id = `${label.id}-value`
  faceInto(face, current)
  button.append(face)
  // DISABLED, not merely unstyled: the native attribute is what stops a click, a
  // keyboard activation and a screen reader offering the control at all.
  if (field.locked) button.disabled = true

  button.addEventListener('click', () => {
    void (async () => {
      const picked = await openPicker(current)
      // A cancel resolves to null and MUST leave the staged value alone rather
      // than clearing it.
      if (!picked) return
      current = picked
      faceInto(face, current)
    })()
  })

  element.append(label, button)
  host.append(element)

  return {
    name: field.name,
    element,
    getValue: () => current,
    isDirty: () => current !== initial,
    focus: () => button.focus(),
  }
}
