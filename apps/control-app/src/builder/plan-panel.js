/**
 * The plan panel ([[REQ-364]], [[DOC-65]] §4–§6) — above the chat, the questions
 * the consultant is waiting on, where the client can answer them at any time
 * without interrupting the conversation.
 *
 * IT HOLDS NO STATE OF ITS OWN. It draws the site's plan ticket and writes back to
 * it, through `/api/plan` and `/api/plan/ask`. It is re-read whenever the plan may
 * have moved — the host calls {@link refresh} when an agent's turn writes the plan,
 * when a turn ends, and when a site is opened — and every answer the client saves
 * answers with the plan as stored, which is what is drawn next. No chat message is
 * generated and no turn is started: the consultant hears the answers on its next
 * turn.
 *
 * SAVED AS THE CLIENT GOES. A typed field saves when it is left; a choice saves
 * when it is picked; a document saves when it has uploaded. There is no submit
 * step for the panel as a whole.
 *
 * A REDRAW NEVER TAKES A FIELD FROM UNDER THE CLIENT. Each ask is drawn as its own
 * block, keyed by id and by what it shows; a redraw keeps a block whose content has
 * not changed, and keeps the one the client is typing in even if it has.
 */
import { answerAsk, deleteMaterial, fetchPlan, saveMaterialRole, uploadMaterial } from './api.js'
import { canUseOnSite, confirmDelete, deleteButton, useOnSiteButton } from './material-actions.js'
import {
  PLAN_CHANGE,
  PLAN_DOCUMENT,
  PLAN_DOCUMENT_GONE,
  PLAN_DOCUMENTS,
  PLAN_UPLOAD_SEVERAL,
  PLAN_FILLED_BY_AGENT,
  PLAN_NEEDS_ANSWER,
  PLAN_PANEL_LABEL,
  PLAN_PHASE_LABELS,
  PLAN_SAVE_FAILED,
  PLAN_SKIP,
  PLAN_SKIP_TITLE,
  PLAN_SKIPPED,
  PLAN_STILL_TO_ANSWER,
  PLAN_ALL_ANSWERED,
  PLAN_TOLD_US,
  PLAN_UPLOAD,
} from './config.js'

/** The HTML input each typed ask is drawn with. */
const TYPED_INPUTS = {
  text: { type: 'text' },
  number: { type: 'text', inputmode: 'decimal' },
  currency: { type: 'text', inputmode: 'decimal' },
  phone: { type: 'tel' },
  email: { type: 'email' },
  url: { type: 'url' },
  date: { type: 'date' },
}

const el = (tag, className, text) => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

const answerText = (answer) => (Array.isArray(answer) ? answer.join(', ') : (answer ?? ''))

/** Every material an answer cites, one or several ([[BUG-196]]). */
const answerMaterials = (ask) =>
  Array.isArray(ask.answer_material) ? ask.answer_material : ask.answer_material ? [ask.answer_material] : []

/**
 * @param {object} [options]
 * @param {{fetchPlan?: Function, answerAsk?: Function, uploadMaterial?: Function, setRole?: Function, remove?: Function}} [options.transport]
 * @param {() => Element|null} [options.getModalHost] where the delete confirmation mounts
 */
export function createPlanPanel(options = {}) {
  const transport = {
    fetchPlan,
    answerAsk,
    uploadMaterial,
    // [[BUG-196]] — the actions on an answered upload: the Library's own calls.
    setRole: saveMaterialRole,
    remove: deleteMaterial,
    ...(options.transport ?? {}),
  }
  const getModalHost = options.getModalHost ?? (() => null)
  /** The delete dialog an answered upload opened, so a second press opens no other. */
  let confirming = null

  const element = el('section', 'plan-panel')
  element.setAttribute('aria-label', PLAN_PANEL_LABEL)
  const phase = el('div', 'plan-panel__phase')
  // [[REQ-379]] — directly under the phase: how much is left for the client.
  const progress = el('div', 'plan-panel__progress')
  progress.setAttribute('role', 'status')
  const error = el('div', 'plan-panel__error')
  error.hidden = true
  const openHeading = el('h3', 'plan-panel__heading', PLAN_NEEDS_ANSWER)
  const openList = el('div', 'plan-panel__list plan-panel__list--open')
  const doneHeading = el('h3', 'plan-panel__heading', PLAN_TOLD_US)
  const doneList = el('div', 'plan-panel__list plan-panel__list--done')
  element.append(phase, progress, error, openHeading, openList, doneHeading, doneList)

  let site = null
  let generation = 0
  /** Ask id → its drawn block and what it was drawn from. */
  const blocks = new Map()
  /** Answered or skipped asks the client has opened to change. */
  const changing = new Set()

  function fail(message) {
    error.textContent = PLAN_SAVE_FAILED(message)
    error.hidden = false
  }

  async function save(ask, body) {
    const asked = site
    try {
      const view = await transport.answerAsk({ site: asked, ask: ask.id, ...body })
      error.hidden = true
      changing.delete(ask.id)
      if (asked === site) render(view)
    } catch (err) {
      fail(err?.message ?? String(err))
    }
  }

  /**
   * Upload what the client picked and answer the ask with it ([[BUG-196]]).
   *
   * WITH THE ASK'S OWN ROLE, NOT A CONSTANT. The consultant said what the files are
   * for when it wrote the ask — `site` for photographs to use, `reference` for
   * background — and the view carries it resolved, default included. A `site`
   * upload is placed as it lands, which is what the upload route does with a site.
   *
   * SEVERAL FILES ARE ONE ANSWER: every one is uploaded, then the ask is answered
   * once, citing all of them.
   */
  async function upload(ask, files) {
    const asked = site
    try {
      const uids = []
      for (const file of files) {
        const material = await transport.uploadMaterial({ file, role: ask.upload_role ?? 'reference', site: asked })
        if (asked !== site) return
        uids.push(material.uid)
      }
      await save(ask, { action: 'answer', answerMaterial: uids.length === 1 ? uids[0] : uids })
    } catch (err) {
      fail(err?.message ?? String(err))
    }
  }

  /** Run an action on an answered upload, then re-read the plan and its rows. */
  async function act(run) {
    try {
      await run()
      error.hidden = true
    } catch (err) {
      fail(err?.message ?? String(err))
    }
    await refresh()
  }

  /**
   * The files an answer cites, each with what the client can do to it ([[BUG-196]]).
   *
   * WHERE THE CLIENT SEES THE UPLOAD, THEY SEE ITS ACTIONS: *Use on the site* for
   * background reading they meant for the site, and *Delete*. The same controls the
   * Library mounts, over the same routes. A file deleted since is said to be gone.
   */
  function filesOf(ask, materials) {
    const list = el('ul', 'plan-ask__files')
    for (const uid of answerMaterials(ask)) {
      const row = materials[uid]
      const item = el('li', 'plan-ask__file')
      item.dataset.material = uid
      if (!row) {
        item.append(el('span', 'plan-ask__file-name plan-ask__file-name--gone', PLAN_DOCUMENT_GONE))
        list.append(item)
        continue
      }
      item.append(el('span', 'plan-ask__file-name', row.label ? `${row.label} ${row.title || row.filename}` : row.title || row.filename))
      if (canUseOnSite(row)) item.append(useOnSiteButton(() => act(() => transport.setRole(uid, 'site'))))
      item.append(
        deleteButton(() => {
          if (confirming) return
          confirming = confirmDelete({
            row,
            host: getModalHost(),
            remove: transport.remove,
            onDeleted: () => void refresh(),
            onClose: () => {
              confirming = null
            },
          })
        }),
      )
      list.append(item)
    }
    return list
  }

  /** The control an ask is answered with, saving as the client goes. */
  function editor(ask) {
    const box = el('div', 'plan-ask__editor')
    const current = ask.status === 'answered' ? ask.answer : undefined
    if (ask.input === 'single_choice' || ask.input === 'multi_choice') {
      const multi = ask.input === 'multi_choice'
      const group = el('div', 'plan-ask__choices')
      group.setAttribute('role', multi ? 'group' : 'radiogroup')
      group.setAttribute('aria-label', ask.prompt)
      for (const option of ask.options ?? []) {
        const label = el('label', 'plan-ask__choice')
        const input = el('input')
        input.type = multi ? 'checkbox' : 'radio'
        input.name = `plan-ask-${ask.id}`
        input.value = option
        input.checked = Array.isArray(current) ? current.includes(option) : current === option
        input.addEventListener('change', () => {
          const picked = [...group.querySelectorAll('input:checked')].map((i) => i.value)
          if (picked.length === 0) return
          void save(ask, { action: 'answer', answer: multi ? picked : picked[0] })
        })
        label.append(input, document.createTextNode(` ${option}`))
        group.append(label)
      }
      box.append(group)
    } else if (ask.input !== 'upload') {
      const input = el('input', 'plan-ask__input')
      const shape = TYPED_INPUTS[ask.input] ?? TYPED_INPUTS.text
      input.type = shape.type
      if (shape.inputmode) input.setAttribute('inputmode', shape.inputmode)
      input.setAttribute('aria-label', ask.prompt)
      input.dataset.input = ask.input
      if (typeof current === 'string') input.value = current
      // `change` IS "LEFT THE FIELD, HAVING CHANGED IT", which is the save point.
      input.addEventListener('change', () => {
        if (input.value.trim() === '') return
        void save(ask, { action: 'answer', answer: input.value.trim() })
      })
      box.append(input)
    }
    if (ask.accepts_upload || ask.input === 'upload') {
      const pick = el('label', 'plan-ask__upload')
      const file = el('input')
      file.type = 'file'
      file.hidden = true
      // SEVERAL WHERE THE ASK TAKES SEVERAL ([[BUG-196]]) — by default, a `site` ask.
      file.multiple = Boolean(ask.multiple)
      file.addEventListener('change', () => {
        const picked = [...(file.files ?? [])]
        if (picked.length > 0) void upload(ask, picked)
      })
      pick.append(document.createTextNode(ask.multiple ? PLAN_UPLOAD_SEVERAL : PLAN_UPLOAD), file)
      box.append(pick)
    }
    const skip = el('button', 'plan-ask__skip', PLAN_SKIP)
    skip.type = 'button'
    skip.title = PLAN_SKIP_TITLE
    skip.addEventListener('click', () => void save(ask, { action: 'skip' }))
    box.append(skip)
    return box
  }

  /** One open ask: its prompt, its reason, and its control. */
  function openBlock(ask) {
    const block = el('div', 'plan-ask')
    block.dataset.ask = ask.id
    block.dataset.status = ask.status
    block.append(el('div', 'plan-ask__prompt', ask.prompt), el('div', 'plan-ask__why', ask.why), editor(ask))
    return block
  }

  /** One answered or skipped ask, compact, which the client can reopen to change. */
  function doneBlock(ask, materials = {}) {
    const block = el('div', 'plan-ask plan-ask--done')
    block.dataset.ask = ask.id
    block.dataset.status = ask.status
    const row = el('div', 'plan-ask__row')
    const value =
      ask.status === 'skipped'
        ? PLAN_SKIPPED
        : ask.answer !== undefined
          ? answerText(ask.answer)
          : answerMaterials(ask).length > 1
            ? PLAN_DOCUMENTS(answerMaterials(ask).length)
            : PLAN_DOCUMENT
    row.append(el('span', 'plan-ask__prompt', ask.prompt), el('span', 'plan-ask__value', value))
    if (ask.status === 'answered' && ask.answered_by && ask.answered_by !== 'client') {
      row.append(el('span', 'plan-ask__source', PLAN_FILLED_BY_AGENT))
    }
    const change = el('button', 'plan-ask__change', PLAN_CHANGE)
    change.type = 'button'
    change.addEventListener('click', () => {
      changing.add(ask.id)
      if (last) render(last)
    })
    row.append(change)
    block.append(row)
    if (ask.status === 'answered' && answerMaterials(ask).length > 0) block.append(filesOf(ask, materials))
    if (changing.has(ask.id)) block.append(el('div', 'plan-ask__why', ask.why), editor(ask))
    return block
  }

  let last = null

  /** Draw a view, keeping every block that has not changed and the one in use. */
  function render(view) {
    last = view
    phase.textContent = PLAN_PHASE_LABELS[view.phase] ?? view.phase ?? ''
    const asks = view.asks ?? []
    const open = asks.filter((a) => a.status === 'open')
    const done = asks.filter((a) => a.status === 'answered' || a.status === 'skipped')
    // NOTHING TO COUNT BEFORE A SITE IS SHOWN: the empty placeholder view has no
    // phase, and "all done" there would be a claim about a plan nobody has read.
    progress.hidden = !view.phase
    progress.textContent = open.length ? PLAN_STILL_TO_ANSWER(open.length) : PLAN_ALL_ANSWERED
    const active = document.activeElement
    const drawn = new Map()
    const place = (list, items, make) => {
      const nodes = items.map((ask) => {
        // THE ROWS AN ANSWER CITES ARE PART OF WHAT IT SHOWS ([[BUG-196]]), so a
        // file moved to the site or deleted redraws its block.
        const cited = answerMaterials(ask).map((uid) => materials[uid] ?? null)
        const key = JSON.stringify([ask, cited, changing.has(ask.id), list === openList])
        const held = blocks.get(ask.id)
        const inUse = held && active && held.node.contains(active) && held.list === list
        const node = held && (held.key === key || inUse) ? held.node : make(ask)
        drawn.set(ask.id, { node, key: held && inUse && held.key !== key ? held.key : key, list })
        return node
      })
      list.replaceChildren(...nodes)
    }
    const materials = view.materials ?? {}
    place(openList, open, openBlock)
    place(doneList, done, (ask) => doneBlock(ask, materials))
    blocks.clear()
    for (const [id, held] of drawn) blocks.set(id, held)
    openHeading.hidden = open.length === 0
    openList.hidden = open.length === 0
    doneHeading.hidden = done.length === 0
    doneList.hidden = done.length === 0
  }

  /** Re-read the plan and redraw. A failure leaves what was drawn. */
  async function refresh() {
    if (!site) return
    const mine = ++generation
    const asked = site
    try {
      const view = await transport.fetchPlan(asked)
      if (mine === generation && asked === site) render(view)
    } catch {
      // THE PANEL IS AN ORNAMENT ON THE CONVERSATION, not a condition of it: a
      // plan that cannot be read leaves the last drawing and says nothing.
    }
  }

  render({ phase: '', asks: [] })

  return {
    element,
    /** Show a site's plan, or nothing. */
    setSite(next) {
      if (next === site) return refresh()
      site = next ?? null
      changing.clear()
      blocks.clear()
      error.hidden = true
      render({ phase: '', asks: [] })
      return refresh()
    },
    refresh,
    destroy() {
      site = null
      element.remove()
    },
  }
}
