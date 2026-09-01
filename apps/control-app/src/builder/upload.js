/**
 * The upload overlay (REQ-161, DOC-8 open item #4).
 *
 * WHAT IT IS FOR. Until this existed there was no way to put a byte into the
 * system at all — the image picker (REQ-132) chooses among assets a site already
 * has, which is a field editor and not a way in. This is the way in, and it is
 * the same overlay from both entry points: dragging onto the conversation (the
 * AI asks *"do you have a logo?"* and the answer is to drop one into the chat)
 * and dragging onto the Library (the deliberate path, for material that is not
 * part of the current conversation). Two moments, one interaction.
 *
 * THE AREAS ARE ROLES, NOT FILE TYPES, and that is the ticket's central claim.
 * Sorting by type would ask the client to tell us something we already read off
 * the content type while leaving unasked the one thing that cannot be inferred:
 * what the file is for. See `config.js`'s `UPLOAD_AREAS` for the JPEG that
 * proves it.
 *
 * NOTHING IS EVER CREATED WITHOUT A CHOICE. A file dropped on the overlay but
 * not into an area does nothing except say so — the overlay stays up and the
 * areas are marked. There is no safe default here: defaulting to "on the site"
 * publishes something the client marked private, and defaulting to "just to
 * read" quietly withholds the hero photograph they meant to publish. Both are
 * silent and both are wrong, so the only correct answer is to keep asking. This
 * is why `api.js` always sends a role even though the route tolerates its
 * absence.
 *
 * CLICKING AN AREA IS THE SAME AS DROPPING ON IT. Drag is a gesture some people
 * cannot perform and some devices do not offer, so every area is a real
 * `<button>` that opens the file picker — the same overlay, the same role, a
 * different trigger.
 */

import { UPLOAD_AREAS, UPLOAD_PROMPT } from './config.js'

/** Shown when a file lands on the overlay but not in an area. */
const AMBIGUOUS_NOTE = 'Drop it on one of these two, so I know what to do with it.'

/** Whether a drag is carrying files, as opposed to text or a page element. */
function isFileDrag(event) {
  const types = event.dataTransfer?.types
  if (!types) return false
  return Array.from(types).includes('Files')
}

/** The files a drop carried, as a plain array. */
function filesOf(event) {
  const list = event.dataTransfer?.files
  return list ? Array.from(list) : []
}

/**
 * Build the overlay and the drag plumbing that raises it.
 *
 * @param {object} spec
 * @param {Element} spec.host    where the overlay is appended — INSIDE the shell
 *   root, for the reason `modal.js` explains at length: the `--shell-*` tokens
 *   and the app font are declared on `.shell`, and a surface outside it resolves
 *   neither.
 * @param {(files: File[], role: string) => void} spec.onUpload
 * @param {object[]} [spec.areas]
 * @param {string} [spec.prompt]
 */
export function createUploadOverlay({
  host,
  onUpload,
  areas = UPLOAD_AREAS,
  prompt = UPLOAD_PROMPT,
}) {
  const element = document.createElement('div')
  element.className = 'builder-upload'
  element.setAttribute('role', 'dialog')
  element.setAttribute('aria-modal', 'true')
  element.setAttribute('aria-label', prompt)
  element.hidden = true

  const sheet = document.createElement('div')
  sheet.className = 'builder-upload__sheet'

  const heading = document.createElement('h2')
  heading.className = 'builder-upload__prompt'
  heading.textContent = prompt

  const row = document.createElement('div')
  row.className = 'builder-upload__areas'

  const note = document.createElement('p')
  note.className = 'builder-upload__note'
  // Empty rather than absent, so the element the ambiguous-drop message lands in
  // already exists and the layout does not jump when it appears.
  note.textContent = ''

  /**
   * ONE INPUT FOR EVERY AREA, carrying the role the click came from.
   *
   * Per-area inputs were the obvious shape and are worse: `multiple` and the
   * accept list would be declared N times, and the change handler would have to
   * find which of N fired. The role is the only thing that varies, and it varies
   * per click rather than per element.
   */
  let source = null

  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.className = 'builder-upload__input'
  // Not `hidden`: a hidden input cannot be `click()`ed into opening a picker in
  // every browser. It is taken out of the layout by the stylesheet instead, and
  // out of the tab order here — the button beside it is the real control.
  input.tabIndex = -1
  input.setAttribute('aria-hidden', 'true')
  let pendingRole = null

  const areaEls = areas.map((area) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'builder-upload__area'
    button.dataset.role = area.id

    const icon = document.createElement('span')
    icon.className = 'builder-upload__icon'
    icon.setAttribute('aria-hidden', 'true')
    icon.textContent = area.icon ?? ''

    const label = document.createElement('span')
    label.className = 'builder-upload__label'
    label.textContent = area.label

    const hint = document.createElement('span')
    hint.className = 'builder-upload__hint'
    hint.textContent = area.hint

    button.append(icon, label, hint)
    button.addEventListener('click', () => {
      pendingRole = area.id
      input.click()
    })
    // Dropping ON an area is the same commitment as clicking it. `dragover` must
    // preventDefault or the browser navigates to the file instead of dropping it.
    button.addEventListener('dragover', (ev) => {
      if (!isFileDrag(ev)) return
      ev.preventDefault()
      ev.stopPropagation()
      button.classList.add('is-over')
    })
    button.addEventListener('dragleave', () => button.classList.remove('is-over'))
    button.addEventListener('drop', (ev) => {
      ev.preventDefault()
      ev.stopPropagation()
      button.classList.remove('is-over')
      take(filesOf(ev), area.id)
    })
    row.append(button)
    return button
  })

  const cancel = document.createElement('button')
  cancel.type = 'button'
  cancel.className = 'builder-upload__cancel'
  cancel.textContent = 'Cancel'
  cancel.addEventListener('click', () => close())

  sheet.append(heading, row, note, cancel, input)
  element.append(sheet)
  host.append(element)

  input.addEventListener('change', () => {
    const chosen = Array.from(input.files ?? [])
    const role = pendingRole
    // Cleared before the handler runs, so choosing the same file twice in a row
    // still fires `change` the second time.
    input.value = ''
    pendingRole = null
    take(chosen, role)
  })

  /**
   * Commit a set of files to a role, and get out of the way.
   *
   * THE SOURCE TRAVELS WITH THEM. One overlay serves both entry points, so the
   * host cannot tell from the files alone whether this was the conversational
   * path or the deliberate one — and it has to, because a chat-route drop is
   * supposed to appear in the transcript and a Library-route one is not.
   */
  function take(files, role) {
    if (!files.length || !role) return
    const from = source
    close()
    onUpload(files, role, from)
  }

  /**
   * A file landing on the overlay itself.
   *
   * NOT A DEFAULT, and not a dismissal either. The client is mid-gesture and has
   * simply missed; closing would discard the drag they were part-way through
   * making, and choosing for them is the thing this whole surface exists to
   * avoid. So: say what is missing, mark the two answers, and wait.
   */
  element.addEventListener('dragover', (ev) => {
    if (isFileDrag(ev)) ev.preventDefault()
  })
  element.addEventListener('drop', (ev) => {
    ev.preventDefault()
    if (!filesOf(ev).length) return
    note.textContent = AMBIGUOUS_NOTE
    for (const el of areaEls) el.classList.add('is-asking')
  })

  const onKey = (ev) => {
    if (ev.key === 'Escape' && !element.hidden) close()
  }
  document.addEventListener('keydown', onKey)

  function open(from = null) {
    source = from
    if (!element.hidden) return
    note.textContent = ''
    for (const el of areaEls) el.classList.remove('is-asking', 'is-over')
    element.hidden = false
  }

  function close() {
    element.hidden = true
  }

  /**
   * Raise the overlay when files are dragged over `target`.
   *
   * A COUNTER RATHER THAN A BOOLEAN, because `dragenter`/`dragleave` fire for
   * every descendant a drag crosses — a plain toggle flickers the overlay away
   * the moment the pointer passes from a panel onto a button inside it. The
   * overlay only closes on a real leave (`dragend`), a drop, Escape or Cancel.
   */
  function watch(target, from = null) {
    let depth = 0
    const enter = (ev) => {
      if (!isFileDrag(ev)) return
      ev.preventDefault()
      depth++
      open(from)
    }
    const over = (ev) => {
      if (isFileDrag(ev)) ev.preventDefault()
    }
    const leave = () => {
      depth = Math.max(0, depth - 1)
    }
    const end = () => {
      depth = 0
    }
    target.addEventListener('dragenter', enter)
    target.addEventListener('dragover', over)
    target.addEventListener('dragleave', leave)
    target.addEventListener('dragend', end)
    return () => {
      target.removeEventListener('dragenter', enter)
      target.removeEventListener('dragover', over)
      target.removeEventListener('dragleave', leave)
      target.removeEventListener('dragend', end)
    }
  }

  return {
    element,
    open,
    close,
    watch,
    isOpen: () => !element.hidden,
    destroy() {
      document.removeEventListener('keydown', onKey)
      element.remove()
    },
  }
}
