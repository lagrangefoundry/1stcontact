import { mountFields } from '@gendevlabs/webui-fields'
import { fetchCopy, saveCopy } from './api.js'

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
export function mountEditor(doc, options = {}) {
  const { slug, bridge: api, onSaved = () => {}, openModal = defaultModal } = options
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
        message: `This edit render was built before the editor and carries no page stamp.`,
        hint: `Re-render it with '1c render ${slug} --edit', then reload`,
      })
      return
    }
    let loaded
    try {
      loaded = await fetchCopy(target)
    } catch (err) {
      openModal({ kind: 'error', message: err.message, hint: err.hint })
      return
    }
    if (!loaded.fields.length) {
      openModal({
        kind: 'message',
        title: labelOf(hit),
        message: `Nothing to edit on this ${loaded.kind} segment yet.`,
      })
      return
    }
    openModal({
      kind: 'fields',
      title: labelOf(hit),
      schema: loaded.fields,
      values: loaded.values,
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
  const host = document.createElement('div')
  host.className = 'builder-modal'
  host.setAttribute('role', 'dialog')
  host.setAttribute('aria-modal', 'true')
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

  const heading = document.createElement('h2')
  heading.className = 'builder-modal__title'
  heading.textContent = spec.title ?? (spec.kind === 'error' ? 'Could not edit' : 'Edit')
  panel.append(heading)

  if (spec.kind !== 'fields') {
    const body = document.createElement('p')
    body.className =
      spec.kind === 'error' ? 'builder-modal__error' : 'builder-modal__message'
    body.textContent = [spec.message, spec.hint].filter(Boolean).join(' — ')
    const ok = button('Close', 'builder-modal__btn', close)
    panel.append(body, footer([ok]))
    document.body.append(host)
    return
  }

  const formHost = document.createElement('div')
  panel.append(formHost)

  fields = mountFields(formHost, {
    schema: spec.schema,
    values: spec.values,
    commit: 'buffered',
  })

  const error = document.createElement('p')
  error.className = 'builder-modal__error'
  error.hidden = true

  const cancel = button('Cancel', 'builder-modal__btn', close)
  const save = button('Save', 'builder-modal__btn builder-modal__btn--primary', async () => {
    // Nothing staged is not a failure — it is a user who opened a modal and
    // changed their mind. Posting an empty change map would re-render the site
    // for no diff.
    if (!fields.isDirty()) return close()
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
      const values = fields.getValues()
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
  document.body.append(host)
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
