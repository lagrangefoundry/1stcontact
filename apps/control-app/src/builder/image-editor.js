/**
 * The image modal — the viewer, the Library name, and the editing tools (REQ-220).
 *
 * A CLIENT COULD LOOK AT A PICTURE AND CHANGE NOTHING ABOUT IT. The Library's
 * detail pane rendered the image, offered a download link, and stopped: to crop a
 * photograph they had to leave the product, crop it elsewhere and upload it
 * again — at which point they held two files and the product held two materials.
 * They could not fix its name either, so a generated image sat in the Library
 * under the prompt that made it.
 *
 * **IT IS `mountReader`'S PATTERN, EXTENDED TO PICTURES.** REQ-172 opens a
 * document into a modal host and `library.js` already owns the detail pane and
 * its editable fields block; this is that furniture one file type further on, not
 * a second way of showing a file. The shell, the backdrop, Escape and the
 * `mount()`-last ordering are all `modal.js`'s, unchanged.
 *
 * **ONE PICTURE, ONE PLACE.** It opens from the Library's detail pane and from
 * the picture in the chat, because that is the same picture and must go to the
 * same place. Both callers hand it the same material uid and it knows nothing
 * about which of them opened it.
 *
 * **INTERACTION IS LOCAL; TRUTH IS RENDERED.** What the stage shows is
 * `/api/material/file`, which serves the picture AS IT CURRENTLY STANDS — the
 * stored bytes with the committed recipe applied by the one renderer ([[REQ-219]]).
 * Dragging a crop box moves a CSS overlay so the gesture is immediate, and
 * committing writes the operation and re-fetches. So what the client is looking
 * at after a commit came out of the renderer that will publish it, and the only
 * thing ever drawn locally is the single operation they are in the middle of.
 *
 * **THIS EDITOR HOLDS NO OPINION ABOUT WHAT AN OPERATION MEANS.** It composes
 * entries in `image-recipe.ts`'s vocabulary and posts them; the origin parses
 * them, compiles them against the picture's real pixels and refuses what will not
 * work. There is no second normaliser here and no second renderer — a browser
 * that baked a crop into a canvas would show the client one thing and publish
 * another, which is the failure the single-renderer decision was taken to prevent.
 *
 * **AND THE PICTURE IS NEVER DESTROYED.** No control here sends bytes. Every tool
 * appends a parameterised entry to a recipe over an original nothing touches, and
 * every entry can be stepped back out or — months later, from the assistant —
 * edited. A crop made today can be widened in a year.
 *
 * **UNDO AND REDO ARE THE SITTING, THE RECIPE IS THE RECORD** ([[REQ-219]]). The
 * stack is editor state and dies with the modal; the recipe persists and its
 * entries stay individually revisable, which is a better history than a history
 * log because it can be edited rather than merely reversed.
 *
 * THERE IS NO FOCAL-POINT CONTROL, AND THE DISTINCTION IT WOULD DRAW IS STILL
 * TRUE. Cropping says *this picture is that shape*; a focal point says *when a
 * band forces an aspect on this picture, keep this bit in frame* — two different
 * things that must never be offered as alternatives. But the axis that is live is
 * `l1ImageAxesSchema.objectPosition`, which sits on the L1 image NODE: it is a
 * property of this picture in THIS BAND, and this dialog holds no page and no
 * node. A control here would write something no renderer reads.
 */

import {
  CROP_START,
  NEUTRAL_ADJUST,
  adjustOp,
  cropRect,
  nudgeCrop,
  pendingStyle,
} from './image-preview.js'
import { mountMaterialName } from './material-name.js'
import { createModalShell, modalButton, modalFooter } from './modal.js'

export { nudgeCrop }

/**
 * The four tools, and the operation each one composes.
 *
 * NAMED HERE SO A SUITE CAN COUNT THEM against `EDIT_OPS` — *"the same list the
 * assistant's `edit_image` uses, because there is one list"* is a claim about the
 * code, and a browser module cannot import the TypeScript that holds the list, so
 * the agreement is pinned by a test rather than asserted in a comment.
 */
export const EDITOR_OPS = Object.freeze(['crop', 'rotate', 'resize', 'adjust'])

/** Said when the origin will not take the change — its own sentence, not ours. */
const REFUSED_FALLBACK = 'That change could not be saved, so the picture is unchanged.'

/** Said where the deployment has no renderer to apply what was stored. */
const PREVIEW_ONLY = 'Saved. You are looking at this picture before the change until it is published.'

function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text != null) node.textContent = text
  return node
}

function button(label, className, onClick) {
  const b = el('button', className, label)
  b.type = 'button'
  b.addEventListener('click', onClick)
  return b
}

/**
 * Open the editor over one picture.
 *
 * @param {object} spec
 * @param {string} spec.uid        the material
 * @param {string} spec.href       `/api/material/file?uid=…` — the picture AS IT
 *   CURRENTLY STANDS, which is what this shows and re-fetches
 * @param {string} spec.name       what the Library calls it now
 * @param {Array}  [spec.recipe]   the operations already on the record
 * @param {Element} [spec.host]    where the dialog is appended (`modal.js`)
 * @param {object} spec.transport  `{saveName, saveRecipe}`
 * @param {(row: object) => void} [spec.onSaved]
 * @param {() => {width:number,height:number}} [spec.measure] the stage's size —
 *   injected by suites, where layout does not happen
 * @returns {{element: Element, close: () => void, setName: (n: string) => void}}
 */
export function mountImageEditor(spec) {
  const {
    uid,
    href,
    name,
    recipe: initialRecipe = [],
    host = null,
    transport,
    onSaved = () => {},
    measure = null,
  } = spec

  /**
   * Everything the editor is, and the ONE thing that is persisted.
   *
   * `history`/`cursor` ARE THE SITTING. The recipe is `history[cursor]`, so undo
   * is a decrement rather than an inverse operation to compute — which is what
   * makes stepping back cheap and, more importantly, exact.
   *
   * `pending` IS THE OPERATION IN THE CLIENT'S HANDS and is the only thing drawn
   * locally. Everything before it is in the bytes on screen.
   */
  const state = {
    history: [Array.isArray(initialRecipe) ? [...initialRecipe] : []],
    cursor: 0,
    pending: null,
    tool: null,
    version: 0,
  }
  const recipe = () => state.history[state.cursor]

  const shell = createModalShell({
    host,
    title: name || 'Picture',
    onClose: () => detachDragListeners(),
  })

  // THE BOX IS WHAT WIDENS THE PANEL. `builder.css` keys the wide panel on the
  // presence of one of a named set of boxes rather than on a modifier class, so a
  // dialog that forgot the class would merely be narrow; this is on that list for
  // the same reason the reader's box is.
  const box = el('div', 'builder-modal__imaged')

  // --- the name -----------------------------------------------------------------
  // FIRST, ABOVE THE PICTURE. It is the one field in here that is about the item
  // rather than about the pixels, and it is the reason a client with a generated
  // image opens this modal at all.
  const nameHost = el('div', 'builder-imaged__name')
  const nameField = mountMaterialName(nameHost, {
    name,
    save: (next) => transport.saveName(uid, next),
    onSaved: (row) => {
      shell.element.setAttribute('aria-label', row?.title || 'Picture')
      onSaved(row)
    },
  })
  box.append(nameHost)

  // --- the picture --------------------------------------------------------------
  const stage = el('div', 'builder-imaged__stage')
  const windowBox = el('div', 'builder-imaged__window')
  const img = document.createElement('img')
  img.className = 'builder-imaged__image'
  img.alt = name || ''
  windowBox.append(img)
  stage.append(windowBox)

  // THE OVERLAY IS A SIBLING OF THE PICTURE, NOT A CHILD OF IT. The picture sits
  // in a window that clips — which is how a pending crop is drawn — so a box
  // drawn inside it would be clipped by the very thing it is being dragged to
  // define.
  const cropBox = el('div', 'builder-imaged__crop')
  cropBox.hidden = true
  const cropGrip = el('div', 'builder-imaged__crop-grip')
  cropGrip.dataset.handle = 'move'
  cropBox.append(cropGrip)
  for (const handle of ['nw', 'ne', 'sw', 'se']) {
    const grip = el('div', `builder-imaged__crop-handle builder-imaged__crop-handle--${handle}`)
    grip.dataset.handle = handle
    cropBox.append(grip)
  }
  stage.append(cropBox)
  box.append(stage)

  // --- the tools ----------------------------------------------------------------
  // THE SHARED VOCABULARY AND NOTHING MORE. Every control below composes one of
  // the four operations `image-recipe.ts` names; there is no fifth tool here and
  // no tool that means something the assistant's `edit_image` cannot say.
  const tools = el('div', 'builder-imaged__tools')

  const cropButton = button('Crop', 'builder-imaged__tool', () => toggleCrop())
  const cropApply = button('Use this crop', 'builder-imaged__apply', () => commitPending())
  const cropCancel = button('Cancel', 'builder-imaged__tool', () => toggleCrop(false))
  cropApply.hidden = true
  cropCancel.hidden = true

  // A QUARTER TURN, EITHER WAY, AND THE VOCABULARY ONLY TURNS CLOCKWISE. *Turn
  // left* is 270° — the client's word for it and the recipe's number for it are
  // different, and the client's is the one on the button.
  const turnLeft = button('Turn left', 'builder-imaged__tool', () => push({ op: 'rotate', degrees: 270 }))
  const turnRight = button('Turn right', 'builder-imaged__tool', () => push({ op: 'rotate', degrees: 90 }))

  const resizeWrap = el('label', 'builder-imaged__resize')
  resizeWrap.append(el('span', null, 'Width'))
  const resizeInput = document.createElement('input')
  resizeInput.type = 'number'
  resizeInput.min = '1'
  resizeInput.className = 'builder-imaged__resize-input'
  resizeWrap.append(resizeInput)
  const resizeApply = button('Resize', 'builder-imaged__tool', () => {
    const width = Math.round(Number(resizeInput.value))
    if (!Number.isFinite(width) || width < 1) return
    push({ op: 'resize', width })
  })

  tools.append(cropButton, cropApply, cropCancel, turnLeft, turnRight, resizeWrap, resizeApply)

  /**
   * The three adjustments, as sliders over MULTIPLIERS.
   *
   * COMMITTED ON RELEASE AND NOT ON EVERY PIXEL OF THE DRAG. `input` fires
   * continuously, and an undo stack with one entry per pixel would make *step
   * back through what you have done* mean *step back through how you moved your
   * hand*. `input` repaints, `change` records.
   *
   * AND THEY RETURN TO THE MIDDLE AFTER EACH ONE, because the picture on screen
   * already carries what was committed: a slider left at 1.2 over a picture that
   * is already 1.2 brighter would read as *the adjustment* when it is only *the
   * last adjustment*, and the next nudge would compound it.
   */
  const sliders = el('div', 'builder-imaged__adjust')
  const controls = {}
  for (const [key, label] of [
    ['brightness', 'Brightness'],
    ['contrast', 'Contrast'],
    ['saturation', 'Saturation'],
  ]) {
    const wrap = el('label', 'builder-imaged__slider')
    wrap.append(el('span', null, label))
    const range = document.createElement('input')
    range.type = 'range'
    range.min = '0.2'
    range.max = '2'
    range.step = '0.05'
    range.value = String(NEUTRAL_ADJUST[key])
    range.dataset.adjust = key
    range.addEventListener('input', () => {
      state.pending = adjustOp(sliderValues())
      paint()
    })
    range.addEventListener('change', () => commitPending())
    wrap.append(range)
    controls[key] = range
    sliders.append(wrap)
  }
  tools.append(sliders)
  box.append(tools)

  // --- undo, redo, and what the origin said --------------------------------------
  const history = el('div', 'builder-imaged__history')
  const undoButton = button('Undo', 'builder-imaged__tool', () => step(-1))
  const redoButton = button('Redo', 'builder-imaged__tool', () => step(1))
  history.append(undoButton, redoButton)
  box.append(history)

  const note = el('p', 'builder-imaged__note')
  box.append(note)

  shell.panel.append(box, modalFooter([modalButton('Close', 'builder-modal__btn', shell.close)]))

  // --- painting -----------------------------------------------------------------
  function sliderValues() {
    return {
      brightness: Number(controls.brightness.value),
      contrast: Number(controls.contrast.value),
      saturation: Number(controls.saturation.value),
    }
  }

  /** The stage's pixel size — measured, or told, so a suite can drive the drag. */
  function stageSize() {
    if (measure) return measure()
    const rect = stage.getBoundingClientRect()
    return { width: rect.width, height: rect.height }
  }

  /**
   * Fetch the picture as it currently stands.
   *
   * THE VERSION IS WHY THIS IS A FUNCTION. `/api/material/file?uid=` is a stable
   * address for a picture whose bytes change when the recipe does, so a browser
   * that had cached the last render would show the client their old crop and make
   * the editor look broken. The counter is the cheapest honest answer until the
   * rendition's own content address is reachable from here.
   */
  function currentSrc() {
    const sep = href.includes('?') ? '&' : '?'
    return state.version === 0 ? href : `${href}${sep}v=${state.version}`
  }

  /**
   * Draw: the committed picture from the renderer, and the pending op over it.
   *
   * NOTHING ACCUMULATES. Two style bags come out of `pendingStyle` and are
   * assigned every time, so there is no state left in the DOM that a later paint
   * could fail to clear.
   */
  function paint() {
    const p = pendingStyle(state.pending)
    Object.assign(windowBox.style, p.window)
    Object.assign(img.style, p.image)
    if (img.getAttribute('src') !== currentSrc()) img.src = currentSrc()
    windowBox.dataset.pending = state.pending ? state.pending.op : ''
    undoButton.disabled = state.cursor === 0
    redoButton.disabled = state.cursor === state.history.length - 1
    cropApply.hidden = state.tool !== 'crop'
    cropCancel.hidden = state.tool !== 'crop'
    paintCrop()
  }

  /**
   * Where the drawn picture actually is inside the stage.
   *
   * THE OVERLAY IS POSITIONED AGAINST THE PICTURE AND NOT AGAINST THE STAGE. The
   * stage is whatever space the dialog gave it and the picture is centred in it,
   * so a crop box laid over the stage would be a box over the letterboxing as
   * much as over the photograph.
   */
  function drawnRect() {
    const size = stageSize()
    const w = img.naturalWidth || size.width
    const h = img.naturalHeight || size.height
    const scale = w > 0 && h > 0 ? Math.min(1, size.width / w, size.height / h) : 1
    const width = w * scale
    const height = h * scale
    return { left: (size.width - width) / 2, top: (size.height - height) / 2, width, height }
  }

  function paintCrop() {
    cropBox.hidden = state.tool !== 'crop' || state.pending?.op !== 'crop'
    if (cropBox.hidden) return
    const area = drawnRect()
    const r = cropRect(state.pending)
    cropBox.style.left = `${area.left + r.x * area.width}px`
    cropBox.style.top = `${area.top + r.y * area.height}px`
    cropBox.style.width = `${r.w * area.width}px`
    cropBox.style.height = `${r.h * area.height}px`
    cropBox.dataset.insets = ['left', 'top', 'right', 'bottom']
      .map((k) => state.pending[k] ?? 0)
      .join(',')
  }

  // --- the recipe ---------------------------------------------------------------
  /**
   * Add an operation, and save.
   *
   * THE FUTURE IS DROPPED, WHICH IS WHAT A REDO STACK MEANS. Editing after a step
   * back replaces what was stepped out of — keeping it would give the client two
   * conflicting continuations of the same picture and no way to say which one
   * they are looking at.
   */
  function push(op) {
    const next = [...recipe(), op]
    state.history = [...state.history.slice(0, state.cursor + 1), next]
    state.cursor = state.history.length - 1
    state.pending = null
    resetSliders()
    void save()
  }

  /** The pending operation, committed — the crop button and the sliders' release. */
  function commitPending() {
    const op = state.pending
    if (!op) {
      toggleCrop(false)
      return
    }
    state.tool = null
    push(op)
  }

  function step(delta) {
    const next = state.cursor + delta
    if (next < 0 || next >= state.history.length) return
    state.cursor = next
    state.pending = null
    resetSliders()
    void save()
  }

  function resetSliders() {
    for (const key of Object.keys(controls)) controls[key].value = String(NEUTRAL_ADJUST[key])
  }

  /**
   * Write the recipe, and say what the origin made of it.
   *
   * THE ORIGIN'S ANSWER IS SHOWN AND NOT SWALLOWED, in its own words. A recipe
   * the picture cannot take — *"that would leave nothing"* — is refused there,
   * against the picture's real pixels, which is the only place it can be checked;
   * the editor's job is to say so rather than to invent a local opinion about it.
   *
   * THE REFUSED STEP IS TAKEN BACK OUT, and only that step. The renderer has not
   * got it, so leaving it on the stack would mean the client's next Undo appeared
   * to do nothing. Everything they did before it is untouched.
   *
   * THE VERSION MOVES ON SUCCESS, which is what re-fetches the picture from the
   * renderer — *"committing re-fetches the real bytes"*, exactly.
   */
  async function save() {
    let row
    try {
      row = await transport.saveRecipe(uid, recipe())
    } catch (err) {
      state.history = state.history.slice(0, state.cursor)
      state.cursor = state.history.length - 1
      note.textContent = (err && err.message) || REFUSED_FALLBACK
      paint()
      return
    }
    state.version += 1
    note.textContent = row?.rendered === false ? PREVIEW_ONLY : ''
    paint()
    onSaved(row)
  }

  // --- the crop gesture ---------------------------------------------------------
  function toggleCrop(on = state.tool !== 'crop') {
    state.tool = on ? 'crop' : null
    state.pending = on ? { op: 'crop', ...CROP_START } : null
    cropButton.setAttribute('aria-pressed', String(on))
    if (!on) resetSliders()
    paint()
  }

  let drag = null
  function onDown(ev) {
    const handle = ev.target?.dataset?.handle
    if (!handle || state.pending?.op !== 'crop') return
    ev.preventDefault()
    drag = { handle, x: ev.clientX, y: ev.clientY, insets: { ...state.pending } }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }
  function onMove(ev) {
    if (!drag) return
    const area = drawnRect()
    if (area.width <= 0 || area.height <= 0) return
    state.pending = {
      op: 'crop',
      ...nudgeCrop(
        drag.insets,
        drag.handle,
        (ev.clientX - drag.x) / area.width,
        (ev.clientY - drag.y) / area.height,
      ),
    }
    paint()
  }
  function onUp() {
    drag = null
    detachDragListeners()
  }
  function detachDragListeners() {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
  cropBox.addEventListener('mousedown', onDown)

  // THE WIDTH BOX OPENS SHOWING THE PICTURE'S OWN WIDTH, once the bytes report
  // it. A resize field starting at zero would ask the client to remember a number
  // the picture already knows.
  img.addEventListener('load', () => {
    if (document.activeElement !== resizeInput) resizeInput.value = String(img.naturalWidth || '')
    paintCrop()
  })

  paint()
  shell.mount()

  return {
    element: shell.element,
    close: shell.close,
    /** Told from the pane behind, so the two names never come apart. */
    setName(next) {
      nameField.setName(next)
      img.alt = next || ''
      shell.element.setAttribute('aria-label', next || 'Picture')
    },
  }
}
