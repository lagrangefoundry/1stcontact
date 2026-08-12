import { mountFields } from '@lagrangefoundry/webui-fields'
import { fetchCopy, saveCopy } from './api.js'
import { isImagePicker, mountImagePicker } from './image-picker.js'
import { copyFontFaces, readPageStyle } from './page-style.js'

/**
 * The edit loop's host half (REQ-117 / DOC-28 §4, §11).
 *
 * The bridge answers *which segment is this*; this module owns everything that
 * follows — open a modal over the segment's fields, commit one diff, refresh.
 * The split is deliberate and lives in `edit-client.ts`: the bridge is beside
 * the renderer because stamp-and-read are one contract, while the modal and the
 * server calls are here because this is where the chrome and the origin are.
 *
 * WHAT THIS MODULE DOES NOT DO. It does not validate, and it does not decide
 * what an edit means. It posts the change map and renders whatever the origin
 * says — which is what keeps the editor a second *producer* of structured edits
 * rather than a second write path (DOC-8 §7). The AI drives the identical
 * endpoint; only the first two steps of the loop differ.
 */

/**
 * The page id the render stamped on `<body>`.
 *
 * The attribute NAME arrives with the bridge rather than being written here.
 * `L1_EDIT_PAGE_ATTR` is part of the edit-address contract in
 * `site-schema/src/l1/edit.ts`, which is the module the renderer stamps *from* —
 * so a literal here would be a second definition site, free to drift from the
 * markup it reads. Drift is silent in exactly the way that matters: a stale name
 * reads back `null`, and a `null` page id is indistinguishable from a document
 * that was never stamped.
 */
function pageIdOf(doc, pageAttr) {
  return doc?.body?.getAttribute(pageAttr) ?? null
}

/**
 * Bind the loop to one iframe document.
 *
 * Returns a handle whose `destroy()` unbinds everything. The caller MUST call it
 * on mode switch — though not for safety: `mountL1EditBridge` refuses to bind on
 * a document without the edit marker, so a leaked bridge still cannot intercept
 * a click in View mode. It is called to avoid stacking listeners across reloads.
 */
/**
 * @param {Document} doc
 * @param {object} options
 * @param {{mountL1EditBridge: Function, formatL1Path: Function, L1_EDIT_PAGE_ATTR: string}} options.bridge
 *   The edit bridge module. INJECTED rather than imported, because the browser
 *   reaches it at `/framework/edit-client.js` — a URL this origin serves by
 *   type-stripping the TypeScript source — and a module-scope import of that URL
 *   would make this file unloadable anywhere but a browser. `main.js` supplies
 *   the served copy; a test supplies the same source directly. Either way there
 *   is exactly one implementation of the bridge.
 */
/**
 * @param {Element} [options.host]
 *   Where the modal is appended. It MUST be inside the shell root, because the
 *   shell owns both halves of the modal's appearance: the `--shell-*` tokens are
 *   declared on `.shell`, and so is the app font every descendant inherits.
 *   Appended to `document.body` — a sibling of the shell, which is what this
 *   used to do — the dialog resolves neither: it renders in the browser's
 *   default serif and falls through to the stylesheet's hardcoded fallback
 *   hexes, so it merely resembles the current theme and does not follow a theme
 *   switch at all. Defaults to `document.body` for a host that has no shell (the
 *   suites that drive `mountEditor` against a bare document).
 */
export function mountEditor(doc, options = {}) {
  const { slug, bridge: api, host = null, onSaved = () => {}, openModal = defaultModal } = options
  const { mountL1EditBridge, formatL1Path, L1_EDIT_PAGE_ATTR } = api
  const pageId = pageIdOf(doc, L1_EDIT_PAGE_ATTR)

  const bridge = mountL1EditBridge(doc, (hit) => {
    // A segment with no exposed fields is a legitimate answer, not an error (a
    // container or a module instance is a real segment with no phase-1
    // control). Opening an empty modal would read as "this is broken"; saying
    // so plainly reads as "not this one, try the text inside it".
    // `target.path` is the parsed index array; the wire (and the CLI) speak the
    // dotted form. Formatting it through the shared helper rather than joining
    // by hand keeps one definition of what an address looks like — a bare
    // `String(path)` produces `0,0,0,0`, which the parser correctly refuses.
    const target = { slug, page: pageId, path: formatL1Path(hit.target.path), ...scopeOf(hit) }
    void openSegment(target, hit)
  })

  async function openSegment(target, hit) {
    // An address is only half a coordinate: without the page id there is nothing
    // to resolve it against. The stamp is absent only when the render on disk
    // predates the editor, so say that rather than posting `page: null` — the
    // server can then only report the page missing, which sends the reader to
    // `1c page list` looking for a page that was never the problem. Stale edit
    // renders recur by construction until REQ-119 replaces on-disk renders with
    // request-time ones, so this is a standing failure mode, not a one-off.
    if (!target.page) {
      openModal({
        kind: 'error',
        host,
        message: `This edit render was built before the editor and carries no page stamp.`,
        hint: `Re-render it with '1c render ${slug} --edit', then reload`,
      })
      return
    }
    let loaded
    try {
      loaded = await fetchCopy(target)
    } catch (err) {
      openModal({ kind: 'error', host, message: err.message, hint: err.hint })
      return
    }
    if (!loaded.fields.length) {
      openModal({
        kind: 'message',
        host,
        title: labelOf(hit),
        message: `Nothing to edit on this ${loaded.kind} segment yet.`,
      })
      return
    }
    openModal({
      kind: 'fields',
      host,
      title: labelOf(hit),
      schema: loaded.fields,
      values: loaded.values,
      // The site an image handle is resolved against (REQ-132). The picker draws
      // the images it offers, and it can only reach their bytes through this
      // site's preview channel.
      slug,
      // How the page renders this copy, so the box can render it the same way.
      // Derived ONLY for a copy segment: `src` and `alt` on an image are
      // metadata about the page rather than words on it, and showing an alt
      // string in the headline's 32px display face would be a lie about where
      // that text ends up (REQ-118 leaves the picker alone).
      preview: previewOf(hit, loaded, doc),
      // The modal's Save is the flush point, so this runs once per Save with
      // the whole change map — one modal, one diff.
      onSave: async (values) => {
        const result = await saveCopy(target, values)
        onSaved(result)
      },
    })
  }

  return {
    destroy() {
      bridge.destroy()
    },
  }
}

/**
 * A hit's module/slot scope, omitted entirely when the address is
 * document-rooted.
 *
 * The bridge calls it `moduleId` and the CLI flag is `--module`; the rename
 * happens here, once, rather than either side bending to the other. Getting it
 * wrong is silent — an instance-rooted address resolved against the document
 * root can still land on *a* node, just the wrong one.
 */
function scopeOf(hit) {
  const scope = {}
  if (hit.target.moduleId) scope.module = hit.target.moduleId
  if (hit.target.slot) scope.slot = hit.target.slot
  return scope
}

function labelOf(hit) {
  const kind = hit.kind ?? 'segment'
  return `Edit ${kind}`
}

/**
 * The page's own presentation of a copy segment, or `null` for anything else.
 *
 * The gate is the SEGMENT KIND rather than the field count. A copy segment is
 * words on the page, and reproducing how they look is the point; an image's
 * `src` and `alt` are metadata *about* the page, and rendering an alt string in
 * the surrounding headline's display face would assert something false about
 * where that text ends up.
 *
 * Copying the faces happens here, next to the read that needs them, because the
 * two are one fact: naming a family the parent document cannot resolve is worse
 * than not naming it, since the box then previews a system font while claiming
 * to preview the page's.
 */
function previewOf(hit, loaded, doc) {
  // `'copy'` is the segment kind the renderer stamps for a text run — the
  // vocabulary is `L1SegmentKind` in `site-schema/src/l1/edit.ts` ('copy' |
  // 'image' | 'container' | 'module'), NOT the L1 node kind ('text'), which is
  // the neighbouring word and the easy one to write here by mistake. Getting it
  // wrong is silent in the worst way: every branch still works, the modal still
  // opens, and the box simply never dresses itself.
  if (hit.kind !== 'copy' || !hit.element) return null
  copyFontFaces(doc)
  return readPageStyle(hit.element)
}

/**
 * The modal.
 *
 * `mountFields` supplies the typed controls, per-field validation and the
 * confirm/cancel gesture model; this is the dialog around it and nothing more.
 * The ticket is explicit that the form is not hand-rolled — deriving descriptors
 * from a segment is the job, building form controls is not.
 *
 * `commit: 'buffered'` is load-bearing rather than a preference. In `auto` the
 * widget writes one field per confirmed edit, so a two-field segment would post
 * twice, re-render the site twice, and put a history in the draft that the user
 * never asked for. Buffered makes Save the single flush point.
 */
function defaultModal(spec) {
  const mountPoint = spec.host ?? document.body
  const host = document.createElement('div')
  host.className = 'builder-modal'
  host.setAttribute('role', 'dialog')
  host.setAttribute('aria-modal', 'true')
  // The title survives as the ACCESSIBLE name even where it is no longer drawn.
  // Dropping the visible heading (below) is a statement about redundant chrome,
  // not about the dialog being anonymous — a dialog with no name is announced as
  // "dialog" and nothing else.
  host.setAttribute('aria-label', spec.title ?? 'Edit')

  const panel = document.createElement('div')
  panel.className = 'builder-modal__panel'

  const backdrop = document.createElement('div')
  backdrop.className = 'builder-modal__backdrop'
  host.append(backdrop, panel)

  // Declared BEFORE `close` and assigned later, never `const` after it. A
  // message/error modal returns before the form is built, so a `const fields`
  // below this point stays in the temporal dead zone for the life of the modal
  // — and `fields?.destroy()` would then throw ReferenceError rather than
  // reading undefined, because optional chaining guards null, not TDZ. That
  // throw lands before `host.remove()`, so the dialog cannot be dismissed by
  // any route: button, Escape or backdrop.
  let fields = null

  const close = () => {
    fields?.destroy()
    host.remove()
    document.removeEventListener('keydown', onKey)
  }
  const onKey = (ev) => {
    if (ev.key === 'Escape') close()
  }
  document.addEventListener('keydown', onKey)
  backdrop.addEventListener('click', close)

  // A HEADING ONLY WHERE IT IS THE CONTENT. On an error or a message the
  // heading names the answer ("Could not edit"); on the form it named the
  // control immediately below it, which a box you can obviously type in does not
  // need. The row it occupied is the row the editing box now gets.
  if (spec.kind !== 'fields') {
    const heading = document.createElement('h2')
    heading.className = 'builder-modal__title'
    heading.textContent = spec.title ?? (spec.kind === 'error' ? 'Could not edit' : 'Edit')
    const body = document.createElement('p')
    body.className =
      spec.kind === 'error' ? 'builder-modal__error' : 'builder-modal__message'
    body.textContent = [spec.message, spec.hint].filter(Boolean).join(' — ')
    const ok = button('Close', 'builder-modal__btn', close)
    panel.append(heading, body, footer([ok]))
    mountPoint.append(host)
    return
  }

  // WHICH CONTROL DRAWS WHICH FIELD (REQ-132). A descriptor saying
  // `format: 'image'` is a closed list of image handles, and this dialog draws
  // those as thumbnails rather than as the dropdown of paths `mountFields`
  // renders for an `enum`. Split by the descriptor rather than by segment kind:
  // an image segment carries a picker AND an alt field, so "which control" is a
  // per-field question, and the day a third surface exposes an image handle it
  // is answered there too without this learning about it.
  const pickerFields = spec.schema.filter(isImagePicker)
  const formFields = spec.schema.filter((field) => !isImagePicker(field))
  const pickers = pickerFields.map((field) =>
    mountImagePicker(panel, { field, value: spec.values[field.name], slug: spec.slug }),
  )

  // NO BOX WITHOUT A FORM. The box is a text-editing box — a border, a radius
  // and the page's own presentation mirrored into it — and a background picker
  // exposes no text at all. An empty one would draw a framed void under the
  // thumbnails.
  if (formFields.length) {
    // The visible box. The border, the radius and the clipping live on THIS
    // element rather than on the control, so the mirrored background can be a
    // sized layer behind the text (see `page-style.js`) with the box clipping it
    // to the region that sits behind the copy on the page.
    const box = document.createElement('div')
    box.className = 'builder-modal__box'

    const formHost = document.createElement('div')
    formHost.className = 'builder-modal__form'
    // The form goes in FIRST: the layers are inserted before it, so it has to be
    // a child of the box for there to be anything to insert before.
    box.append(formHost)
    applyPreview(box, formHost, spec.preview)
    panel.append(box)

    fields = mountFields(formHost, {
      schema: formFields,
      // ONLY THE FIELDS IT RENDERS. Handed the whole map, the component reports
      // every key back from `getValues()` — including the picker's, at the value
      // the segment *opened* with. Merged into the change map that reads as an
      // explicit "put the old image back", and it silently undid every pick.
      values: Object.fromEntries(formFields.map((field) => [field.name, spec.values[field.name]])),
      commit: 'buffered',
      // `stacked` drops the label column (upstream REQ-69). For a single copy
      // field the label read "Text" in a column ~40% as wide as the dialog, next
      // to a box already full of the words it was labelling. The label is not
      // discarded — the component moves it onto the control as its accessible
      // name — and it stays in the descriptor, which is what the CLI and the AI
      // surfaces read.
      layout: 'stacked',
    })
    // Only when the form is the WHOLE dialog. An image segment's form is one
    // field (`alt`) but the operator clicked a picture, so opening the alt
    // control would put the cursor in the field they did not come for and leave
    // the picker — the reason the dialog is open — needing a click to reach.
    if (!pickers.length) openLoneControl(formHost, formFields)
  }

  /**
   * Every staged value, from whichever control is holding it.
   *
   * The pickers are spread LAST, so a field this dialog draws itself is reported
   * by the control that drew it whatever else claims a key of that name. Belt
   * and braces over the filtered `values` above: the ordering makes the invariant
   * true here, where the change map is built, rather than depending on a
   * component's reporting staying narrow.
   */
  const stagedValues = () => ({
    ...(fields?.getValues() ?? {}),
    ...Object.fromEntries(pickers.map((picker) => [picker.name, picker.getValue()])),
  })
  const isDirty = () => pickers.some((picker) => picker.isDirty()) || (fields?.isDirty() ?? false)

  const error = document.createElement('p')
  error.className = 'builder-modal__error'
  error.hidden = true

  const cancel = button('Cancel', 'builder-modal__btn', close)
  const save = button('Save', 'builder-modal__btn builder-modal__btn--primary', async () => {
    // Nothing staged is not a failure — it is a user who opened a modal and
    // changed their mind. Posting an empty change map would re-render the site
    // for no diff.
    if (!isDirty()) return close()
    save.disabled = true
    error.hidden = true
    try {
      // `getValues()` rather than `commit()`: in `buffered` mode both read the
      // same staged buffer, but `commit` also flushes it through mountFields'
      // own onCommit path — a second notification for an edit this Save is
      // already carrying, and one that clears the buffer before the post it
      // would have to be replayed from if the origin refuses. Reading leaves
      // the staged text intact, which is what lets the modal stay open holding
      // it when validation fails below.
      //
      // The picked handle travels in the SAME map, so a modal that changed both
      // the image and its alt text is still one diff and one re-render.
      const values = stagedValues()
      await spec.onSave(values)
      close()
    } catch (err) {
      // INVALID NEVER LANDS, and the modal stays open holding what the user
      // typed. Closing it here would throw away their text and leave them
      // guessing which field the validator refused.
      error.textContent = [err.message, err.hint].filter(Boolean).join(' — ')
      error.hidden = false
      save.disabled = false
    }
  })

  panel.append(error, footer([cancel, save]))
  mountPoint.append(host)

  // AFTER THE DIALOG IS IN THE DOCUMENT. Focus does not move to a detached
  // element — it fails silently, leaving the keyboard back on whatever was
  // focused before the dialog opened. The grid takes it so the picker is
  // arrow-navigable the moment it appears rather than a Tab away; a form-only
  // dialog is already handled by `openLoneControl`, which sends a click and
  // works either side of the append.
  if (pickers.length) pickers[0].focus()
}

/**
 * Put a one-field form straight into its control, ready to type.
 *
 * `mountFields` renders a VIEW that becomes a control on click, which is right
 * for a property sheet — most rows are being read, and a stray click must not
 * start an edit. This dialog is not that: it opened *because* the operator
 * clicked the words, so the value is not being read, and the extra click buys
 * nothing. It also undercuts the reason the heading could go — a box you can
 * obviously type in needs no label saying "Edit text", and until the control
 * exists the box is not one.
 *
 * ONE FIELD ONLY, and one CONTROL only. With two fields there is no "the" field
 * and opening the first would silently privilege it — which since REQ-132 also
 * covers the case where the second field is drawn by the picker rather than by
 * the form: an image's form is a lone `alt`, but the operator clicked a picture,
 * and typing into alt text is not what they asked for. The caller makes that
 * call; this stays the rule for a form that is the whole dialog.
 *
 * `.fields-value-editable` is the component's own click-to-edit affordance, and
 * this fires the same gesture the operator would — it does not restyle or
 * replace anything. It is still a class dependency, and the reason it is
 * tolerable is that its failure mode is inert: if the class moves, the box stays
 * click-to-edit exactly as it is today. Upstream is being asked for the real
 * seam (an `autoEdit` option, or `edit(name)` on the handle).
 */
function openLoneControl(formHost, schema) {
  if (schema?.length !== 1) return
  const cell = formHost.querySelector('.fields-value-editable')
  cell?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}

/**
 * Dress the editing box in the page's own presentation.
 *
 * EVERYTHING GOES THROUGH TOKENS. The typography lands as `--preview-*` custom
 * properties that `builder.css` feeds into the component's own `--fields-*`
 * vocabulary (`--fields-font-size`, `--fields-radius`, `--fields-bg`,
 * `--fields-accent`), so the control is restyled through the seams upstream
 * exposes rather than by out-specifying its stylesheet. Nothing here reaches
 * into a `.fields-*` class, which is what keeps this working across a component
 * update instead of silently reverting to a form field.
 *
 * A segment with no preview (an image's fields, or a document that computes no
 * styles) simply gets none of these properties, and the stylesheet's own
 * theme-token defaults apply — the box still looks like a box.
 */
function applyPreview(box, formHost, preview) {
  if (!preview) return
  for (const [name, value] of Object.entries(preview.vars)) box.style.setProperty(name, value)
  const bg = preview.background
  if (!bg) return

  // The flat colour goes on the box itself, so the surface is right even when
  // there is no geometry to place a layer with — which is every document that
  // has not been laid out, and every headless run.
  if (bg.color) box.style.setProperty('--preview-background', bg.color)

  // One element per painting layer, bottom-most first — a scrim has to composite
  // over the photograph it dims, exactly as it does on the page. Written as
  // declarations rather than custom properties because the layer COUNT is a
  // property of the page, which no fixed set of variables could carry.
  for (const style of bg.layers) {
    const layer = document.createElement('div')
    layer.className = 'builder-modal__box-bg'
    for (const [prop, value] of Object.entries(style)) layer.style.setProperty(prop, value)
    box.insertBefore(layer, formHost)
  }
}

function footer(children) {
  const row = document.createElement('div')
  row.className = 'builder-modal__footer'
  row.append(...children)
  return row
}

function button(label, className, onClick) {
  const b = document.createElement('button')
  b.type = 'button'
  b.className = className
  b.textContent = label
  b.addEventListener('click', onClick)
  return b
}
