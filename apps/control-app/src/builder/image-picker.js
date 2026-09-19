import { assetUrl, materialFileUrl } from './api.js'

/**
 * The image picker (REQ-132 / DOC-28 §9.2), offering the Library (REQ-282).
 *
 * One list of pictures, drawn as thumbnails with their file names. It replaces
 * the native `<select>` of `/assets/…` paths that `mountFields` renders for an
 * `enum`, on the fields whose descriptor says `format: 'image'` — the segment's
 * `src` (REQ-118) and a painted surface's `backgroundImageUrl` (REQ-128).
 *
 * WHAT IT OFFERS IS THE CATALOGUE, NOT THE SITE'S COPY OF IT (REQ-282). The list
 * used to be the field's `enum` — the site's own assets, bytes already copied
 * under the draft — so a client could only choose a picture somebody had already
 * placed, and the way to place one was to leave the editor, find it in the
 * Library, place it, and come back. The operator's sentence is the specification:
 * *"the picker needs to offer me what is in the Library. That is the primary
 * purpose of the Library."* What the client HAS is the Library; which of it we
 * have copied onto the draft is our bookkeeping and was never a category anybody
 * chooses from.
 *
 * SO THE LIST WIDENED AND THE VALUE DID NOT. An L1 `src` is a site-local handle
 * and nothing else. A tile for a picture the site does not hold yet commits a
 * STAGED pick — {@link mountImagePicker} reports it through `getPlacement`, the
 * modal's Save posts it as `place`, and the origin puts the bytes on the site and
 * writes the handle that produced. Nothing the write side validates changed.
 *
 * PLACE ON SAVE, NOT ON PICK. The modal is staged and its Save is the single
 * flush point (DOC-28 §11). Copying bytes onto the site the moment a tile was
 * clicked would leave an asset behind every time a client changed their mind.
 *
 * WHAT CANNOT BE PUBLISHED IS SHOWN WITH THE REASON, rather than filtered out.
 * The origin refuses to publish material we hold no right to republish; a client
 * hunting for a picture that is simply absent has been told nothing, which is the
 * same mistake the Library's old warning badge made in the other direction.
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
 * The tiles to draw, from whichever list this deployment can answer with.
 *
 * TWO ANSWERS AND NEITHER IS A DEGRADED MODE, which is the same reading
 * `mergeImageLibraries` takes of the same split. A deployment with a ticket
 * store sends `pictures` — the catalogue, marked. A deployment without one (the
 * `1c` dev builder, which has a site and no Library) has only the descriptor's
 * `enum`, and that IS its whole set of pictures: every option is a site asset, so
 * "which of these is on the site" is a question with no information in it and
 * nothing is marked. `placed` is therefore left absent rather than set false —
 * absent is *not asked*, and false would be a claim.
 *
 * THE CURRENT HANDLE IS ALWAYS AMONG THEM. A folded reproduction can hold a
 * handle no listing found (a remote URL the fold could not mirror), and a group
 * whose options omit its own value renders with nothing checked — so a Save that
 * touched only the alt text would swap the picture. This is the same rule
 * `imageChoices` states on the origin, applied to the wider list.
 */
export function pictureTiles(field, value, pictures) {
  const current = value ?? ''
  const listed = Array.isArray(pictures)
    ? pictures
    : (field?.enum ?? []).map((handle) => ({ value: handle, label: assetFileName(handle) }))
  const held = listed.some((choice) => choice.value === current)
  return held || current === ''
    ? listed
    : [{ value: current, label: assetFileName(current) }, ...listed]
}

/**
 * Mount the grid, and answer for what is picked in it.
 *
 * Staged, never committed: picking a tile changes what {@link getValue} and
 * {@link getPlacement} report and nothing else. The modal's Save is still the
 * single flush point, and this field travels in the same change map as the
 * form's — one modal, one diff (DOC-28 §11).
 *
 * @param {Element} host - where the grid is appended
 * @param {object} spec
 * @param {{name: string, label: string, enum: string[]}} spec.field - the descriptor
 * @param {string} spec.value - the handle the node currently holds
 * @param {string} spec.site - the site key, for resolving thumbnails
 * @param {Array<object>} [spec.pictures] - the catalogue, where there is one
 * @returns {{name: string, element: Element, getValue: () => string,
 *            getPlacement: () => string|null, isDirty: () => boolean,
 *            focus: () => void}}
 */
export function mountImagePicker(host, { field, value, site, pictures }) {
  const initial = value ?? ''
  const choices = pictureTiles(field, initial, pictures)
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

  for (const choice of choices) element.append(tile(choice, choice.value === initial))

  element.addEventListener('change', (ev) => {
    if (ev.target instanceof HTMLInputElement && ev.target.checked) {
      current = ev.target.value
      for (const label of element.querySelectorAll('.builder-modal__tile')) {
        label.classList.toggle('is-selected', label.dataset.handle === current)
      }
    }
  })

  host.append(element)

  function tile(choice, selected) {
    const handle = choice.value
    const blocked = typeof choice.reason === 'string' && choice.reason !== ''
    const label = document.createElement('label')
    label.className = [
      'builder-modal__tile',
      selected ? 'is-selected' : '',
      blocked ? 'is-blocked' : '',
    ]
      .filter(Boolean)
      .join(' ')
    label.dataset.handle = handle
    // The handle survives as the TOOLTIP, and only there. The asset listing
    // walks sub-directories, so two files can share a name; hovering resolves
    // which is which without putting a path back on screen for every tile that
    // never needed one. A blocked tile hovers its reason instead — the handle
    // it would have committed is not a thing anybody can act on.
    label.title = blocked ? choice.reason : handle

    const input = document.createElement('input')
    input.type = 'radio'
    input.className = 'builder-modal__tile-input'
    input.name = group
    input.value = handle
    input.checked = selected
    // UNPICKABLE, NOT UNSHOWN. `disabled` takes it off the arrow-key group and
    // out of the tab order, which is exactly right: it is still readable and
    // still says why, and there is nothing a keyboard could usefully do to it.
    input.disabled = blocked

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
    // A PICTURE THE SITE DOES NOT HOLD IS SERVED BY THE LIBRARY (REQ-282). There
    // is no `/assets/` path for it yet — that is the whole point of the tile —
    // so its bytes come from the material record the pick would place.
    img.src = choice.place ? materialFileUrl(choice.place) : assetUrl(site, handle)
    frame.append(img)

    const name = document.createElement('span')
    name.className = choice.placed
      ? 'builder-modal__tile-name is-placed'
      : 'builder-modal__tile-name'
    name.textContent = choice.label ?? assetFileName(handle)

    label.append(input, frame, name)
    // THE STATE IN WORDS, AT NO COST IN PIXELS (REQ-282). Accent and weight
    // carry it on screen and neither is announced, so this is what a screen
    // reader gets. It is deliberately NOT a second visible word: whether a
    // photograph is already in use is minor, ambient information.
    if (choice.placed !== undefined) {
      const state = document.createElement('span')
      state.className = 'builder-modal__tile-state'
      state.textContent = choice.placed ? '— in use' : '— not yet used'
      label.append(state)
    }
    if (blocked) {
      const why = document.createElement('span')
      why.className = 'builder-modal__tile-reason'
      why.textContent = choice.reason
      label.append(why)
    }
    return label
  }

  return {
    name: field.name,
    element,
    getValue: () => current,
    /**
     * The material this Save has to place first, or `null` when the pick is
     * already a handle. Read by the modal, posted as `place` beside the values.
     */
    getPlacement: () => choices.find((c) => c.value === current)?.place ?? null,
    isDirty: () => current !== initial,
    focus() {
      const checked = element.querySelector('.builder-modal__tile-input:checked')
      const first = checked ?? element.querySelector('.builder-modal__tile-input:not(:disabled)')
      first?.focus()
    },
  }
}

/** True for a field this picker owns rather than `mountFields`. */
export function isImagePicker(field) {
  return field?.format === 'image' && Array.isArray(field.enum)
}
