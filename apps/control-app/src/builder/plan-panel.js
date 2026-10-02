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
import { answerAsk, fetchPlan, uploadMaterial } from './api.js'
import {
  PLAN_CHANGE,
  PLAN_DOCUMENT,
  PLAN_FILLED_BY_AGENT,
  PLAN_NEEDS_ANSWER,
  PLAN_PANEL_LABEL,
  PLAN_PHASE_LABELS,
  PLAN_SAVE_FAILED,
  PLAN_SKIP,
  PLAN_SKIP_TITLE,
  PLAN_SKIPPED,
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

/**
 * @param {object} [options]
 * @param {{fetchPlan?: Function, answerAsk?: Function, uploadMaterial?: Function}} [options.transport]
 */
export function createPlanPanel(options = {}) {
  const transport = {
    fetchPlan,
    answerAsk,
    uploadMaterial,
    ...(options.transport ?? {}),
  }

  const element = el('section', 'plan-panel')
  element.setAttribute('aria-label', PLAN_PANEL_LABEL)
  const phase = el('div', 'plan-panel__phase')
  const error = el('div', 'plan-panel__error')
  error.hidden = true
  const openHeading = el('h3', 'plan-panel__heading', PLAN_NEEDS_ANSWER)
  const openList = el('div', 'plan-panel__list plan-panel__list--open')
  const doneHeading = el('h3', 'plan-panel__heading', PLAN_TOLD_US)
  const doneList = el('div', 'plan-panel__list plan-panel__list--done')
  element.append(phase, error, openHeading, openList, doneHeading, doneList)

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

  async function upload(ask, file) {
    const asked = site
    try {
      const material = await transport.uploadMaterial({ file, role: 'reference', site: asked })
      if (asked !== site) return
      await save(ask, { action: 'answer', answerMaterial: material.uid })
    } catch (err) {
      fail(err?.message ?? String(err))
    }
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
      file.addEventListener('change', () => {
        if (file.files?.[0]) void upload(ask, file.files[0])
      })
      pick.append(document.createTextNode(PLAN_UPLOAD), file)
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
  function doneBlock(ask) {
    const block = el('div', 'plan-ask plan-ask--done')
    block.dataset.ask = ask.id
    block.dataset.status = ask.status
    const row = el('div', 'plan-ask__row')
    const value =
      ask.status === 'skipped'
        ? PLAN_SKIPPED
        : ask.answer !== undefined
          ? answerText(ask.answer)
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
    const active = document.activeElement
    const drawn = new Map()
    const place = (list, items, make) => {
      const nodes = items.map((ask) => {
        const key = JSON.stringify([ask, changing.has(ask.id), list === openList])
        const held = blocks.get(ask.id)
        const inUse = held && active && held.node.contains(active) && held.list === list
        const node = held && (held.key === key || inUse) ? held.node : make(ask)
        drawn.set(ask.id, { node, key: held && inUse && held.key !== key ? held.key : key, list })
        return node
      })
      list.replaceChildren(...nodes)
    }
    place(openList, open, openBlock)
    place(doneList, done, doneBlock)
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
