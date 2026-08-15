/**
 * The colour field (REQ-140 / REQ-135 §3, DOC-28 §8).
 *
 * One row per colour axis a segment exposes — a text run's `color`, a painted
 * panel's `surfaceFill` — drawn as the swatch it currently paints and opening
 * REQ-133's palette popup to change it.
 *
 * WHY IT IS HERE AND NOT IN `mountFields`. The component pairs `enum` with
 * `format: 'color'` to mean "swatch grid", and its value is a hex STRING. Ours
 * is a palette reference — `{ref, shade}` — because REQ-135 §3 is that the
 * surface writes a reference and never a hex, which is what makes "edit the
 * entry and every use follows" true and what stops a segment inventing an
 * off-system colour. A control whose value is a typed object is not reachable
 * through the component's seams, so the modal draws this field itself and hands
 * the rest to `mountFields` unchanged — exactly the split `image-picker.js`
 * already makes, and split on the DESCRIPTOR rather than on the segment kind so
 * the day a third surface exposes a colour it is answered here too.
 *
 * NO PICKER IS BUILT HERE. REQ-133's popup already implements pick mode and
 * already resolves to `{ref, shade}`; until now it simply had no caller but the
 * toolbar. This is the caller. What this module owns is the *row*: what the
 * segment currently paints, and the gesture that opens the picker.
 *
 * REQ-135 §3.1 specified a grid of named palette STEPS writing `{ref, step}`.
 * REQ-137 deleted steps for a continuous `shade` on the reference, so neither
 * that control nor that value shape exists to build.
 */

/**
 * The hex a colour value paints, or `null` when nothing can resolve it.
 *
 * `null` is a real answer, not a failure: a run that declares no colour inherits
 * one, and a reference can name an entry that was deleted while this modal was
 * open. Both draw the "no colour" swatch rather than a guess — inventing a hex
 * here would put a colour on screen that the page does not paint.
 */
export function colorHex(value, palette, shadeHex) {
  if (typeof value === 'string') return value || null
  if (!value || typeof value.ref !== 'string') return null
  const entry = palette?.[value.ref]
  if (!entry) return null
  const shade = value.shade ?? 0
  return shade === 0 ? entry.value : shadeHex(entry.value, shade)
}

/**
 * What to call the colour a value names.
 *
 * A reference is named by its ENTRY, because that is the thing the operator
 * chose and the thing an edit to the palette would move. A literal is named by
 * its hex, which is all a folded site has said about it — and seeing a raw hex
 * where every other segment shows a name is the honest signal that this one is
 * not on the palette yet.
 */
export function colorLabel(value) {
  if (typeof value === 'string') return value || 'None'
  if (!value || typeof value.ref !== 'string') return 'None'
  const shade = value.shade ?? 0
  if (shade === 0) return value.ref
  // The sign carries the direction — toward white or toward black — which is
  // the only part of a continuous position anyone can read off a number.
  return `${value.ref} ${shade > 0 ? '+' : ''}${Math.round(shade * 100)}%`
}

/** Build the swatch chip: the colour itself, plus what it is called. */
function swatchInto(element, value, palette, shadeHex) {
  element.textContent = ''
  const chip = document.createElement('span')
  chip.className = 'builder-color__chip'
  const hex = colorHex(value, palette, shadeHex)
  // `is-empty` rather than a transparent chip: "no colour" and "a colour that
  // happens to be white" must not look the same, and only the stylesheet can
  // draw the difference.
  if (hex) chip.style.setProperty('--builder-color-chip', hex)
  else chip.classList.add('is-empty')

  const name = document.createElement('span')
  name.className = 'builder-color__name'
  name.textContent = colorLabel(value)

  element.append(chip, name)
}

/**
 * Mount one colour row, and answer for what is picked in it.
 *
 * Staged, never committed — {@link getValue} reports the pick and nothing else
 * happens until the modal's Save, so a colour travels in the same change map as
 * the words beside it: one modal, one diff (DOC-28 §11).
 *
 * A LOCKED descriptor (REQ-139) mounts the same row, drawn as unavailable: the
 * swatch still reports what the segment paints, the button is disabled so no
 * picker can open, and the reason is rendered beneath it. Honoured HERE and not
 * only in the shared annotation pass, because this control is drawn by the
 * builder rather than by `mountFields` — the component's own `locked` handling
 * cannot reach a row it never rendered, and a disabled-looking row that still
 * opens a picker would be worse than no lock at all.
 *
 * @param {Element} host - where the row is appended
 * @param {object} spec
 * @param {{name: string, label: string, locked?: boolean, reason?: string}} spec.field - the descriptor
 * @param {string|{ref: string, shade?: number}|undefined} spec.value - what the axis holds
 * @param {Record<string, {value: string}>} [spec.palette] - the site's entries, for the swatch
 * @param {(hex: string, shade: number) => string} [spec.shadeHex] - the renderer's own arithmetic
 * @param {(value: unknown) => Promise<{ref: string, shade?: number}|null>} spec.openPicker
 * @returns {{name: string, element: Element, getValue: () => unknown,
 *            isDirty: () => boolean, focus: () => void}}
 */
export function mountColorField(host, { field, value, palette, shadeHex, openPicker }) {
  const initial = value
  let current = value
  const resolve = shadeHex ?? ((hex) => hex)

  const element = document.createElement('div')
  element.className = 'builder-color'
  // The field NAME on the row, and the same `is-locked` class `mountFields`
  // marks its own locked rows with (REQ-139). Both exist so that "a locked row
  // looks locked and says why" is one rule over one selector, whichever control
  // drew the row — the stylesheet and the reason pass address `[data-field]`
  // and `.is-locked` without knowing which family a row came from.
  element.dataset.field = field.name
  if (field.locked) element.classList.add('is-locked')

  const label = document.createElement('span')
  label.className = 'builder-color__label'
  label.id = `builder-color-label-${field.name}`
  label.textContent = field.label

  // A BUTTON, because it opens a dialog. The row is not a value you type into
  // and not a list you arrow through — the whole control is "open the picker" —
  // and the native button is the only element that says so to a screen reader
  // and to the keyboard at the same time.
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'builder-color__swatch'
  button.setAttribute('aria-labelledby', `${label.id} ${label.id}-value`)
  const face = document.createElement('span')
  face.className = 'builder-color__face'
  face.id = `${label.id}-value`
  swatchInto(face, current, palette, resolve)
  button.append(face)
  // DISABLED, not merely unstyled. The native attribute is what stops a click,
  // a keyboard activation and a screen reader offering the control at all —
  // three routes a class could not close, and the picker behind them can write
  // a colour the page would never paint.
  if (field.locked) button.disabled = true

  button.addEventListener('click', () => {
    void (async () => {
      // Asked with an ENTRY to pre-select, which is what "what the caller
      // currently holds" means to the popup — so a literal is narrowed to
      // `null` here rather than in each host that wires one up. The popup is
      // the authority on what may be chosen; a cancel resolves to null and MUST
      // leave the staged value alone rather than clearing it.
      const picked = await openPicker(paletteRefOf(current))
      if (!picked) return
      current = picked
      swatchInto(face, current, palette, resolve)
    })()
  })

  element.append(label, button)
  host.append(element)

  return {
    name: field.name,
    element,
    getValue: () => current,
    // Compared through the value the write side compares by, so a pick that
    // lands on the colour the segment already had is not a diff. Absent and a
    // zero shade are the same position (REQ-137), which is why this is not `!==`.
    isDirty: () => !sameColor(current, initial),
    focus: () => button.focus(),
  }
}

/** True when two colour values name the same colour. Mirrors the write side. */
function sameColor(a, b) {
  if (typeof a === 'string' || typeof b === 'string') return a === b
  if (!a || !b) return a === b
  return a.ref === b.ref && (a.shade ?? 0) === (b.shade ?? 0) && (a.alpha ?? 1) === (b.alpha ?? 1)
}

/** True for a field this control owns rather than `mountFields`. */
export function isColorField(field) {
  return field?.type === 'color'
}

/**
 * The palette reference a value already is, or `null` when it is not one.
 *
 * What the popup means by "what the caller currently holds" is an ENTRY to
 * pre-select, and a folded site's axis holds a hex literal that names no entry.
 * Handing the hex over would have the popup either select nothing (harmless) or
 * try to resolve it (wrong); saying `null` says the true thing — this segment's
 * colour is not on the palette yet, so nothing is pre-selected.
 */
export function paletteRefOf(value) {
  return value && typeof value === 'object' && typeof value.ref === 'string' ? value : null
}
