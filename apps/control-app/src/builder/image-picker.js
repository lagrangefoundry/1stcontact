import { assetUrl } from './api.js'

/**
 * The image picker (REQ-132 / DOC-28 §9.2).
 *
 * One closed list of image handles, drawn as thumbnails with their file names.
 * It replaces the native `<select>` of `/assets/…` paths that `mountFields`
 * renders for an `enum`, on the fields whose descriptor says `format: 'image'` —
 * the segment's `src` (REQ-118) and a painted surface's `backgroundImageUrl`
 * (REQ-128).
 *
 * WHY THE PATH IS NOT SHOWN. A handle is an address, and choosing a picture by
 * reading one is choosing it by the wrong property — the operator knows the
 * image, not where it is filed. It stops meaning anything at all once assets are
 * held in a store rather than a filesystem, which is where this is going. The
 * handle is still what a pick *commits*: only the label is the file name, and no
 * part of this touches the value the write side validates.
 *
 * WHY IT IS HERE AND NOT IN `mountFields`. That component's enum control is a
 * `<select>`, and a thumbnail grid is not reachable through its seams. It
 * already pairs `enum` with `format: 'color'` to mean "swatch grid", so the
 * shape this consumes is the one the component would need if the control ever
 * moves upstream — until then the modal renders these fields itself and hands
 * the rest to `mountFields` unchanged (see `editor.js`).
 */

/**
 * Distinguishes one picker's radios from another's.
 *
 * Radio grouping is by NAME, and a group's scope is the form owner — of which
 * these have none, so it is the whole document. The modal is mounted into the
 * same document as the builder chrome and (in tests) the rendered page, so a
 * bare `src` would be a name that any other radio on the page could join,
 * silently un-checking a tile when something unrelated was clicked.
 */
let groupSeq = 0

/**
 * The file name a handle carries — the label, and the whole of it.
 *
 * Query and fragment go first (a cache-busted `?v=2` is not part of a name),
 * then everything up to the last separator. An empty result means the handle
 * ends in a slash and names no file; the handle itself is then the only honest
 * label left, and showing it beats showing nothing.
 */
function assetFileName(handle) {
  const withoutQuery = String(handle ?? '').split(/[?#]/)[0]
  const name = withoutQuery.slice(withoutQuery.lastIndexOf('/') + 1)
  return name || String(handle ?? '')
}

/**
 * Mount the grid, and answer for what is picked in it.
 *
 * Staged, never committed: picking a tile changes what {@link getValue} reports
 * and nothing else. The modal's Save is still the single flush point, and this
 * field travels in the same change map as the form's — one modal, one diff
 * (DOC-28 §11).
 *
 * @param {Element} host - where the grid is appended
 * @param {object} spec
 * @param {{name: string, label: string, enum: string[]}} spec.field - the descriptor
 * @param {string} spec.value - the handle the node currently holds
 * @param {string} spec.slug - the site, for resolving thumbnails
 * @returns {{name: string, element: Element, getValue: () => string,
 *            isDirty: () => boolean, focus: () => void}}
 */
export function mountImagePicker(host, { field, value, slug }) {
  const initial = value ?? ''
  let current = initial
  groupSeq += 1
  const group = `builder-picker-${field.name}-${groupSeq}`

  const element = document.createElement('div')
  element.className = 'builder-modal__picker'
  // `radiogroup` rather than `listbox`: the options ARE radios, so the browser
  // supplies arrow-key navigation, the single-selection invariant and the
  // announcement — none of which a listbox gets without roving `tabindex`, and
  // an ARIA role claiming a keyboard contract the widget does not implement is
  // worse than no role at all.
  element.setAttribute('role', 'radiogroup')
  element.setAttribute('aria-label', field.label)

  // The node's own handle is always among the options (`imageChoices` puts it
  // there), so there is always exactly one tile to check — including when the
  // handle names bytes no listing found.
  const options = field.enum ?? []
  for (const handle of options) element.append(tile(handle, handle === initial))

  element.addEventListener('change', (ev) => {
    if (ev.target instanceof HTMLInputElement && ev.target.checked) {
      current = ev.target.value
      for (const label of element.querySelectorAll('.builder-modal__tile')) {
        label.classList.toggle('is-selected', label.dataset.handle === current)
      }
    }
  })

  host.append(element)

  function tile(handle, selected) {
    const label = document.createElement('label')
    label.className = `builder-modal__tile${selected ? ' is-selected' : ''}`
    label.dataset.handle = handle
    // The handle survives as the TOOLTIP, and only there. The asset listing
    // walks sub-directories, so two files can share a name; hovering resolves
    // which is which without putting a path back on screen for every tile that
    // never needed one.
    label.title = handle

    const input = document.createElement('input')
    input.type = 'radio'
    input.className = 'builder-modal__tile-input'
    input.name = group
    input.value = handle
    input.checked = selected

    const frame = document.createElement('span')
    frame.className = 'builder-modal__tile-thumb'
    const img = document.createElement('img')
    // EMPTY ALT, deliberately. The file name beside it is the accessible name of
    // this option; describing the picture too would announce every tile twice,
    // and there is nothing to describe it *with* — an asset's alt text belongs
    // to the segment that uses it, not to the file.
    img.alt = ''
    img.loading = 'lazy'
    // A thumbnail that will not load must not take the option with it. The
    // handle a segment currently holds is always offered, and it can name bytes
    // this origin cannot serve — an off-site URL a fold could not mirror, a
    // registry entry with no file. The frame keeps its size and the name still
    // identifies it, so the segment can always keep the image it has.
    img.addEventListener('error', () => {
      frame.classList.add('is-missing')
      img.remove()
    })
    img.src = assetUrl(slug, handle)
    frame.append(img)

    const name = document.createElement('span')
    name.className = 'builder-modal__tile-name'
    name.textContent = assetFileName(handle)

    label.append(input, frame, name)
    return label
  }

  return {
    name: field.name,
    element,
    getValue: () => current,
    isDirty: () => current !== initial,
    focus() {
      const checked = element.querySelector('.builder-modal__tile-input:checked')
      const first = checked ?? element.querySelector('.builder-modal__tile-input')
      first?.focus()
    },
  }
}

/** True for a field this picker owns rather than `mountFields`. */
export function isImagePicker(field) {
  return field?.format === 'image' && Array.isArray(field.enum)
}
