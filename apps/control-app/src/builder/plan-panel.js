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
 * SAVED AS THE CLIENT GOES. A choice saves when it is picked; a document saves
 * when it has uploaded. [[BUG-236]] — A TYPED ANSWER HAS ITS OWN DONE, and Enter
 * in a one-line box is Done too; leaving the box having changed it still saves,
 * as a safety net. Whatever saves says "Saved ✓" on its item's line for a moment.
 * There is no submit step for the panel as a whole.
 *
 * [[BUG-200]] — EXCEPT A MULTI-SELECT, where the first tick is never the whole
 * answer. Its ticks are saved as a draft, which leaves the question open and tells
 * the consultant nothing, and the client finishes it with Done — or "None of these"
 * with nothing ticked — which answers with every tick at once.
 *
 * [[REQ-378]] — AND THE COMP BOARD: "Sites we're comparing". Each comp is a captured
 * site with a thumbnail of its hero, who put it there, and the client's likes and
 * dislikes, which they edit in place (saved with the comp's Done, or when they
 * leave the box). [[BUG-236]] — "I've finished commenting" under the board tells
 * the consultant, on its next turn, that the client is finished with it. The client
 * adds a site by its address — the route captures it — and clicking a thumbnail
 * asks the host to show that comp in the preview pane (`onOpenComp`).
 *
 * [[REQ-390]], [[REQ-398]], [[BUG-209]] — AND, FIRST OF ALL, WHERE THE BUILD IS:
 * the progress banner, a segmented bar pinned across the top of the panel —
 * `Progress [1✓][2✓][3. Refining   ][4]…` — each stage a box coloured by its
 * state, and only the stage in progress named. The consultant marks the stages; the banner only draws them and
 * is never clicked to change one. While a turn is running (`setBusy`) the stage in
 * progress spins. SKIPPED IS DRAWN, NEVER STORED ({@link shownStates}). Hovering,
 * focusing or tapping a stage explains it: its name, its sentence from the seed,
 * and its state in words.
 *
 * [[REQ-401]] — EVERY QUESTION, AND THE COMP BOARD, IS ONE FOLDABLE ITEM: a line
 * of a disclosure triangle, a status box (open, skipped, done) and the start of
 * the question, which unfolds to the rest. The items sit in two sections — OPEN
 * QUESTIONS, and WHAT YOU'VE TOLD US for the done and skipped ones — and move
 * between them as their status changes. An open item starts unfolded; it folds
 * once, at the moment it becomes done or skipped; and whatever the client folds
 * or unfolds stays that way, per item, in this browser ({@link isExpanded}).
 *
 * A REDRAW NEVER TAKES A FIELD FROM UNDER THE CLIENT. Each ask is drawn as its own
 * block, keyed by id and by what it shows; a redraw keeps a block whose content has
 * not changed, and keeps the one the client is typing in even if it has.
 * [[BUG-236]] — AND WHAT THEY TYPED IS KEPT BY ITSELF until it is stored, by ask
 * and by comp note, so a block that is drawn again — the client had moved on to
 * another box — is drawn with their text still in it.
 */
import { answerAsk, compAction, deleteMaterial, fetchPlan, materialFileUrl, saveMaterialRole, uploadMaterial } from './api.js'
import { failureContent } from './failure-notice.js'
import { canUseOnSite, confirmDelete, deleteButton, useOnSiteButton } from './material-actions.js'
import {
  COMPS_DONE,
  COMPS_FINISHED,
  COMPS_FINISHED_SAID,
  COMPS_ADD_BUTTON,
  COMPS_ADD_LABEL,
  COMPS_ADD_PLACEHOLDER,
  COMPS_ADDING,
  COMPS_DISLIKES,
  COMPS_FAILED,
  COMPS_FROM,
  COMPS_HEADING,
  COMPS_LIKES,
  COMPS_NOTES_HINT,
  COMPS_OPEN,
  COMPS_REMOVE,
  PLAN_CHANGE,
  PLAN_ITEM_STATUS,
  PLAN_DOCUMENT,
  PLAN_DOCUMENT_GONE,
  PLAN_DOCUMENTS,
  PLAN_DONE,
  PLAN_NONE_OF_THESE,
  PLAN_NO_QUESTIONS_YET,
  PLAN_NOT_YET_AVAILABLE,
  PLAN_SOMETHING_ELSE,
  PLAN_UPLOAD_SEVERAL,
  PLAN_FILLED_BY_AGENT,
  PLAN_OPEN_QUESTIONS,
  PLAN_PANEL_LABEL,
  PLAN_STAGE_STATE,
  PLAN_STAGES_LABEL,
  PLAN_STAGES_TITLE,
  PLAN_SAVE_FAILED,
  PLAN_SAVED,
  PLAN_SKIP,
  PLAN_SKIP_TITLE,
  PLAN_SKIPPED,
  PLAN_STILL_TO_ANSWER,
  PLAN_TOLD_US,
  PLAN_UPLOAD,
  PLAN_UPLOADED,
  PLAN_UPLOADED_ANSWER,
  PLAN_UPLOADED_TITLE,
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

/**
 * [[REQ-398]] — each stage's state as the banner draws it: the stored one, except
 * that a stage passed over is SKIPPED. Passed over means not done, not in
 * progress, and before the furthest stage that is done or in progress. Nothing is
 * stored: the plan keeps its three states and this is worked out on every draw.
 */
export function shownStates(stages) {
  let furthest = -1
  stages.forEach((stage, i) => {
    if (stage.state === 'done' || stage.state === 'in_progress') furthest = i
  })
  return stages.map((stage, i) => (i < furthest && stage.state === 'not_started' ? 'skipped' : stage.state))
}

/** A long answer's box grows with what is in it ([[REQ-390]]). */
const grow = (area) => {
  area.style.height = 'auto'
  area.style.height = `${area.scrollHeight}px`
}

const el = (tag, className, text) => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

/** [[REQ-399]] — an option as the client is shown it: its wording, where it has one. */
const optionLabel = (ask, option) => ask.labels?.[option] ?? option

/** An answer as one line, each option in its wording, and anything written beside it. */
const answerText = (ask) => {
  const { answer } = ask
  const text = Array.isArray(answer)
    ? answer.length
      ? answer.map((option) => optionLabel(ask, option)).join(', ')
      : PLAN_NONE_OF_THESE
    : (answer ?? '')
  return ask.answer_other ? `${Array.isArray(answer) && !answer.length ? '' : `${text}; `}${ask.answer_other}` : text
}

/** Notes as the box shows them, one per line, and back. */
const notesText = (items) => (items ?? []).join('\n')
const notesOf = (text) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')

/** Every material an answer cites, one or several ([[BUG-196]]). */
const answerMaterials = (ask) =>
  Array.isArray(ask.answer_material) ? ask.answer_material : ask.answer_material ? [ask.answer_material] : []

/** [[REQ-401]] — an ask's status as its item shows it. */
const itemState = (status) => (status === 'answered' ? 'done' : status)

/** [[BUG-236]] — how long "Saved ✓" stays on an item's line. */
const SAVED_MS = 4000

/** [[BUG-236]] — say on an item's line, for a moment, that what the client gave was stored. */
function flashSaved(node) {
  const line = node?.querySelector(':scope > .plan-item__line, :scope > .plan-comp__head')
  if (!line) return
  line.querySelector(':scope > .plan-item__saved')?.remove()
  const said = el('span', 'plan-item__saved', PLAN_SAVED)
  said.setAttribute('role', 'status')
  line.append(said)
  setTimeout(() => said.remove(), SAVED_MS)
}

/** The marks in an item's status box ([[REQ-401]]): empty, a dash, a tick. */
const ITEM_MARK = { open: '', skipped: '–', done: '✓' }

/** [[REQ-413]] — the highlight on a question the consultant brought forward, and how long it lasts. */
export const SHOWN_CLASS = 'plan-item--shown'
const SHOWN_MS = 2400

/** [[REQ-401]] — draw an item folded or unfolded, with its status box. */
function showFold(node, expanded) {
  const state = node.dataset.state
  node.dataset.expanded = String(expanded)
  const line = node.querySelector(':scope > .plan-item__line')
  line.setAttribute('aria-expanded', String(expanded))
  line.querySelector('.plan-item__twisty').textContent = expanded ? '▾' : '▸'
  line.querySelector('.plan-item__mark').textContent = ITEM_MARK[state] ?? ''
  line.querySelector('.plan-item__status').textContent = PLAN_ITEM_STATUS[state] ?? state
  node.querySelector(':scope > .plan-item__body').hidden = !expanded
}

/** Folds kept for the page's life, where the host gave no storage. */
function memoryFolds() {
  const map = new Map()
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, String(value)),
    removeItem: (key) => void map.delete(key),
  }
}

/**
 * @param {object} [options]
 * @param {{fetchPlan?: Function, answerAsk?: Function, uploadMaterial?: Function, setRole?: Function, remove?: Function, compAction?: Function}} [options.transport]
 * @param {() => Element|null} [options.getModalHost] where the delete confirmation mounts
 * @param {(reference: string, comps: object[]) => void} [options.onOpenComp]
 *   the client clicked a comp: show it in the preview pane ([[REQ-378]])
 * @param {Storage} [options.storage] where the client's folds are remembered ([[REQ-401]])
 * @param {(view: object) => void} [options.onView] every plan view drawn ([[REQ-408]])
 */
export function createPlanPanel(options = {}) {
  const transport = {
    fetchPlan,
    answerAsk,
    uploadMaterial,
    compAction,
    // [[BUG-196]] — the actions on an answered upload: the Library's own calls.
    setRole: saveMaterialRole,
    remove: deleteMaterial,
    ...(options.transport ?? {}),
  }
  const getModalHost = options.getModalHost ?? (() => null)
  /** The delete dialog an answered upload opened, so a second press opens no other. */
  let confirming = null
  const onOpenComp = options.onOpenComp ?? null
  /** [[REQ-408]] — every view drawn, handed on: the Story pane draws its board from it. */
  const onView = options.onView ?? null

  const element = el('section', 'plan-panel')
  element.setAttribute('aria-label', PLAN_PANEL_LABEL)
  // [[REQ-390]], [[REQ-398]] — the progress banner, first on the panel and pinned
  // there while the rest scrolls beneath it.
  const tracker = el('div', 'plan-stages')
  const stageList = el('ol', 'plan-stages__list')
  stageList.setAttribute('aria-label', PLAN_STAGES_LABEL)
  // ONE TIP FOR THE BANNER, moved to whichever stage is hovered, focused or tapped.
  const tip = el('div', 'plan-stages__tip')
  tip.id = `plan-stages-tip-${Math.random().toString(36).slice(2)}`
  tip.setAttribute('role', 'tooltip')
  tip.hidden = true
  tracker.append(el('span', 'plan-stages__title', PLAN_STAGES_TITLE), stageList, tip)
  let busy = false
  /** The stage the tip is explaining, by id, so a redraw keeps it open. */
  let tipFor = null
  const showTip = (item) => {
    tipFor = item.dataset.stage
    tip.replaceChildren(
      el('strong', 'plan-stages__tip-name', item.dataset.label),
      el('span', 'plan-stages__tip-about', item.dataset.about),
      el('span', 'plan-stages__tip-state', PLAN_STAGE_STATE[item.dataset.state] ?? item.dataset.state),
    )
    tip.hidden = false
    // UNDER THE STAGE, kept inside the banner at its right-hand end.
    tip.style.left = `${Math.max(0, Math.min(item.offsetLeft, tracker.clientWidth - tip.offsetWidth))}px`
  }
  const hideTip = () => {
    tipFor = null
    tip.hidden = true
  }
  // [[REQ-379]] — directly under the tracker: how much is left for the client.
  const progress = el('div', 'plan-panel__progress')
  progress.setAttribute('role', 'status')
  const error = el('div', 'plan-panel__error')
  error.hidden = true
  const openHeading = el('h3', 'plan-panel__heading', PLAN_OPEN_QUESTIONS)
  const openList = el('div', 'plan-panel__list plan-panel__list--open')
  const doneHeading = el('h3', 'plan-panel__heading', PLAN_TOLD_US)
  const doneList = el('div', 'plan-panel__list plan-panel__list--done')
  // [[REQ-417]] — what the panel is for, until it has a question in it.
  const noQuestions = el('p', 'plan-panel__ghost', PLAN_NO_QUESTIONS_YET)
  // [[REQ-378]], [[REQ-401]] — the comp board, ONE ITEM in whichever section its
  // status puts it, drawn once and moved, so a note being typed is never lost.
  const compsItem = itemShell(COMPS_HEADING)
  compsItem.node.classList.add('plan-comps-item')
  compsItem.node.dataset.comps = ''
  const compsList = el('div', 'plan-comps')
  const addForm = el('form', 'plan-comps__add')
  const addInput = el('input', 'plan-comps__url')
  addInput.type = 'url'
  addInput.placeholder = COMPS_ADD_PLACEHOLDER
  addInput.setAttribute('aria-label', COMPS_ADD_LABEL)
  const addButton = el('button', 'plan-comps__add-button', COMPS_ADD_BUTTON)
  addButton.type = 'submit'
  const addStatus = el('span', 'plan-comps__status')
  addForm.append(el('label', 'plan-comps__add-label', COMPS_ADD_LABEL), addInput, addButton, addStatus)
  const compsSkip = el('button', 'plan-ask__skip plan-comps__skip', PLAN_SKIP)
  compsSkip.type = 'button'
  compsSkip.addEventListener('click', () => void comp({ action: 'skip' }))
  // [[BUG-236]] — THE CLIENT SAYS THEY ARE FINISHED WITH THE BOARD; the consultant
  // is told on its next turn. Until a site is noted again, it says it was heard.
  const compsFinish = el('button', 'plan-comps__finish', COMPS_FINISHED)
  compsFinish.type = 'button'
  compsFinish.addEventListener('click', () => void comp({ action: 'finish' }))
  const compsFinished = el('span', 'plan-comps__finished', COMPS_FINISHED_SAID)
  compsFinished.setAttribute('role', 'status')
  compsItem.body.append(compsList, addForm, compsFinish, compsFinished, compsSkip)
  element.append(tracker, progress, error, noQuestions, openHeading, openList, doneHeading, doneList)

  let site = null
  let generation = 0
  /** Comp reference → its drawn block and what it was drawn from ([[REQ-378]]). */
  const compBlocks = new Map()
  /** Ask id → its drawn block and what it was drawn from. */
  const blocks = new Map()
  /**
   * [[REQ-401]] — the client's folds, by site and item: `{expanded, at}`, where
   * `at` is the item's status when they chose. Absent storage keeps them for the
   * page's life only.
   */
  const folds = options.storage ?? memoryFolds()
  /** Answered or skipped asks the client has opened to change. */
  const changing = new Set()
  /** Ask id → the latest draft sent for it, so an older reply never redraws over it ([[BUG-200]]). */
  const drafting = new Map()
  /** [[REQ-399]] — "Something else?" text typed and not yet sent, by ask, so a redraw keeps it. */
  const typedOther = new Map()
  /** [[BUG-236]] — a typed answer not yet stored, by ask, so a redraw keeps it. */
  const typed = new Map()
  /** [[BUG-236]] — the answer being sent for each ask, so Done after leaving the box sends it once. */
  const sending = new Map()
  /** [[BUG-236]] — comp notes typed and not yet stored, by `reference:likes|dislikes`. */
  const typedNotes = new Map()

  function fail(message) {
    error.replaceChildren(...failureContent(PLAN_SAVE_FAILED, message))
    error.hidden = false
  }

  async function save(ask, body) {
    const asked = site
    try {
      const view = await transport.answerAsk({ site: asked, ask: ask.id, ...body })
      error.hidden = true
      changing.delete(ask.id)
      typed.delete(ask.id)
      if (asked === site) {
        render(view)
        if (body.action === 'answer') flashSaved(blocks.get(ask.id)?.node)
      }
    } catch (err) {
      fail(err?.message ?? String(err))
    }
  }

  /**
   * Keep a multi-select's ticks without answering it ([[BUG-200]]). The question
   * stays where it is, open or opened to change; only the latest draft's reply is
   * drawn, so quick ticks cannot be drawn back to an earlier set.
   */
  async function draft(ask, picked) {
    const asked = site
    const mine = (drafting.get(ask.id) ?? 0) + 1
    drafting.set(ask.id, mine)
    try {
      const view = await transport.answerAsk({ site: asked, ask: ask.id, action: 'draft', answer: picked })
      error.hidden = true
      if (asked === site && drafting.get(ask.id) === mine) render(view)
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

  /**
   * [[BUG-236]] — a typed answer's box and its Done. Saved by Done, by Enter in a
   * one-line box, or — the safety net — by leaving the box having changed it
   * (`change`). The same answer is sent once however many of those happen.
   */
  function typedAnswer(ask, field, box) {
    if (typed.has(ask.id)) field.value = typed.get(ask.id)
    field.addEventListener('input', () => typed.set(ask.id, field.value))
    const commit = () => {
      const value = field.value.trim()
      if (value === '' || sending.get(ask.id) === value) return
      sending.set(ask.id, value)
      void save(ask, { action: 'answer', answer: value }).finally(() => {
        if (sending.get(ask.id) === value) sending.delete(ask.id)
      })
    }
    field.addEventListener('change', commit)
    if (field.tagName === 'INPUT') {
      field.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' || event.isComposing) return
        event.preventDefault()
        commit()
      })
    }
    const done = el('button', 'plan-ask__done', PLAN_DONE)
    done.type = 'button'
    done.addEventListener('click', commit)
    box.append(field, done)
  }

  /** The control an ask is answered with, saving as the client goes. */
  function editor(ask) {
    const box = el('div', 'plan-ask__editor')
    const current = ask.status === 'answered' ? ask.answer : undefined
    if (ask.input === 'multi_choice') {
      // [[BUG-200]] — TICKS ARE A DRAFT; DONE IS THE ANSWER. The boxes show the
      // draft where there is one, and otherwise what was answered.
      const ticked = ask.draft ?? (Array.isArray(current) ? current : [])
      // [[REQ-399]] — ONE OPTION PER LINE, IN COLUMNS WHERE EVERY LABEL FITS
      // UNBROKEN: the column is as wide as the longest label, so the grid falls to
      // one column before it would wrap one.
      const group = el('div', 'plan-ask__choices plan-ask__choices--multi')
      const unavailable = new Set(ask.unavailable ?? [])
      const widest = Math.max(
        0,
        ...(ask.options ?? []).map((o) => optionLabel(ask, o).length + (unavailable.has(o) ? PLAN_NOT_YET_AVAILABLE.length * 0.8 : 0)),
      )
      group.style.setProperty('--plan-choice-width', `${Math.ceil(widest) + 3}ch`)
      group.setAttribute('role', 'group')
      group.setAttribute('aria-label', ask.prompt)
      const finish = el('button', 'plan-ask__done')
      finish.type = 'button'
      const picked = () => [...group.querySelectorAll('input:checked')].map((i) => i.value)
      const label = () => {
        finish.textContent = picked().length ? PLAN_DONE : PLAN_NONE_OF_THESE
      }
      for (const option of ask.options ?? []) {
        const choice = el('label', 'plan-ask__choice')
        const input = el('input')
        input.type = 'checkbox'
        input.name = `plan-ask-${ask.id}`
        input.value = option
        input.checked = ticked.includes(option)
        input.addEventListener('change', () => {
          label()
          void draft(ask, picked())
        })
        choice.append(input, el('span', 'plan-ask__choice-label', optionLabel(ask, option)))
        if (unavailable.has(option)) choice.append(el('span', 'plan-ask__unavailable', PLAN_NOT_YET_AVAILABLE))
        group.append(choice)
      }
      box.append(group)
      // [[REQ-399]] — "SOMETHING ELSE?" UNDER THE LIST, sent with Done.
      let other = null
      if (ask.other) {
        other = el('input', 'plan-ask__input plan-ask__other')
        other.type = 'text'
        other.placeholder = PLAN_SOMETHING_ELSE
        other.setAttribute('aria-label', PLAN_SOMETHING_ELSE)
        other.value = typedOther.get(ask.id) ?? ask.answer_other ?? ''
        other.addEventListener('input', () => typedOther.set(ask.id, other.value))
        box.append(other)
      }
      label()
      finish.addEventListener('click', () => {
        drafting.delete(ask.id)
        typedOther.delete(ask.id)
        const extra = other?.value.trim()
        void save(ask, { action: 'answer', answer: picked(), ...(extra ? { other: extra } : {}) })
      })
      box.append(finish)
    } else if (ask.input === 'single_choice') {
      const group = el('div', 'plan-ask__choices')
      group.setAttribute('role', 'radiogroup')
      group.setAttribute('aria-label', ask.prompt)
      for (const option of ask.options ?? []) {
        const label = el('label', 'plan-ask__choice')
        const input = el('input')
        input.type = 'radio'
        input.name = `plan-ask-${ask.id}`
        input.value = option
        input.checked = current === option
        input.addEventListener('change', () => {
          if (input.checked) void save(ask, { action: 'answer', answer: option })
        })
        label.append(input, document.createTextNode(` ${option}`))
        group.append(label)
      }
      box.append(group)
    } else if (ask.input === 'long_text') {
      // [[REQ-390]] — A FEW SENTENCES OR A LIST: a box that grows as it fills.
      // Enter is a new line in it, so Done is how it is finished ([[BUG-236]]).
      const area = el('textarea', 'plan-ask__input plan-ask__input--long')
      area.rows = 3
      area.setAttribute('aria-label', ask.prompt)
      area.dataset.input = ask.input
      if (typeof current === 'string') area.value = current
      area.addEventListener('input', () => grow(area))
      typedAnswer(ask, area, box)
      queueMicrotask(() => grow(area))
    } else if (ask.input !== 'upload') {
      const input = el('input', 'plan-ask__input')
      const shape = TYPED_INPUTS[ask.input] ?? TYPED_INPUTS.text
      input.type = shape.type
      if (shape.inputmode) input.setAttribute('inputmode', shape.inputmode)
      input.setAttribute('aria-label', ask.prompt)
      input.dataset.input = ask.input
      if (typeof current === 'string') input.value = current
      typedAnswer(ask, input, box)
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
      // [[BUG-216]] — THE FILE MAY HAVE GONE IN ANOTHER WAY: dragged onto the chat or
      // the Library, which never answer a card. This says so, as an answer, so the
      // client is not left with Skip, which tells the agent the opposite.
      const uploaded = el('button', 'plan-ask__uploaded', PLAN_UPLOADED)
      uploaded.type = 'button'
      uploaded.title = PLAN_UPLOADED_TITLE
      uploaded.addEventListener('click', () => void save(ask, { action: 'answer', answer: PLAN_UPLOADED_ANSWER }))
      box.append(pick, uploaded)
    }
    const skip = el('button', 'plan-ask__skip', PLAN_SKIP)
    skip.type = 'button'
    skip.title = PLAN_SKIP_TITLE
    skip.addEventListener('click', () => void save(ask, { action: 'skip' }))
    box.append(skip)
    return box
  }

  /** One open ask: its line, and under it its reason and its control. */
  function openBlock(ask) {
    const { node, body } = itemShell(ask.prompt)
    node.dataset.ask = ask.id
    node.dataset.status = ask.status
    body.append(el('div', 'plan-ask__why', ask.why), editor(ask))
    return node
  }

  /** One answered or skipped ask: its line, and under it the answer, which the client can reopen to change. */
  function doneBlock(ask, materials = {}) {
    const { node: block, body } = itemShell(ask.prompt)
    block.classList.add('plan-ask--done')
    block.dataset.ask = ask.id
    block.dataset.status = ask.status
    const row = el('div', 'plan-ask__row')
    const value =
      ask.status === 'skipped'
        ? PLAN_SKIPPED
        : ask.answer !== undefined
          ? answerText(ask)
          : answerMaterials(ask).length > 1
            ? PLAN_DOCUMENTS(answerMaterials(ask).length)
            : PLAN_DOCUMENT
    row.append(el('span', 'plan-ask__value', value))
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
    body.append(row)
    if (ask.status === 'answered' && answerMaterials(ask).length > 0) body.append(filesOf(ask, materials))
    if (changing.has(ask.id)) body.append(el('div', 'plan-ask__why', ask.why), editor(ask))
    return block
  }

  /**
   * [[REQ-401]] — whether an item is unfolded.
   *
   * THE CLIENT'S CHOICE STICKS: what they last folded or unfolded is kept, per
   * site and item. Without one, an open item is unfolded and a done or skipped
   * one folded. THE FOLD ON COMPLETION HAPPENS ONCE: a choice made while the item
   * was open is dropped the first time it is drawn done or skipped, so it folds
   * then, and any choice made after that is kept.
   */
  function isExpanded(id, state) {
    const key = `${site}:${id}`
    let saved = null
    try {
      saved = JSON.parse(folds.getItem(key) ?? 'null')
    } catch {
      saved = null
    }
    if (saved && saved.at === 'open' && state !== 'open') {
      folds.removeItem(key)
      saved = null
    }
    return saved ? Boolean(saved.expanded) : state === 'open'
  }

  /** Draw an item folded or unfolded, as its status and the client's folds say. */
  function fold(node, id, state) {
    node.dataset.item = id
    node.dataset.state = state
    showFold(node, isExpanded(id, state))
  }

  /** The client folded or unfolded an item: draw it, and remember the choice. */
  function toggle(node) {
    const next = node.dataset.expanded !== 'true'
    folds.setItem(`${site}:${node.dataset.item}`, JSON.stringify({ expanded: next, at: node.dataset.state }))
    showFold(node, next)
  }

  /**
   * [[REQ-401]] — an item's frame: the one line (triangle, status box, the start
   * of the question) that folds and unfolds it, and the body it hides.
   */
  function itemShell(title) {
    const node = el('div', 'plan-ask plan-item')
    const line = el('div', 'plan-item__line')
    line.setAttribute('role', 'button')
    line.tabIndex = 0
    const twisty = el('span', 'plan-item__twisty')
    twisty.setAttribute('aria-hidden', 'true')
    const box = el('span', 'plan-item__box')
    const mark = el('span', 'plan-item__mark')
    mark.setAttribute('aria-hidden', 'true')
    box.append(mark, el('span', 'plan-item__status'))
    line.append(twisty, box, el('span', 'plan-ask__prompt plan-item__title', title))
    // ANYWHERE ON THE LINE, by pointer or by Enter/Space; never from the body,
    // where the client is answering.
    line.addEventListener('click', () => toggle(node))
    line.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      toggle(node)
    })
    const body = el('div', 'plan-item__body')
    node.append(line, body)
    return { node, body }
  }

  /** A comp-board write; redraws from what was stored ([[REQ-378]]). */
  async function comp(body) {
    const asked = site
    try {
      const view = await transport.compAction({ site: asked, ...body })
      error.hidden = true
      if (asked === site) render(view)
      return true
    } catch (err) {
      error.textContent = COMPS_FAILED(err?.message ?? String(err))
      error.hidden = false
      return false
    }
  }

  addForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    const address = addInput.value.trim()
    if (address === '' || !site) return
    addButton.disabled = true
    addStatus.textContent = COMPS_ADDING
    const ok = await comp({ action: 'add', url: address })
    addButton.disabled = false
    addStatus.textContent = ''
    if (ok) addInput.value = ''
  })

  /** One comp: its hero, its name and source, and the client's notes. */
  function compBlock(entry) {
    const block = el('div', 'plan-comp')
    block.dataset.reference = entry.reference
    block.dataset.source = entry.source
    const open = el('button', 'plan-comp__open')
    open.type = 'button'
    open.setAttribute('aria-label', COMPS_OPEN(entry.title))
    if (entry.desktop) {
      // THE HERO IS THE TOP OF THE DESKTOP PAGE: the full-page screenshot, cropped
      // to its first viewport by the box it sits in (see `builder.css`).
      const thumb = el('img', 'plan-comp__thumb')
      thumb.src = materialFileUrl(entry.reference, entry.desktop)
      thumb.alt = ''
      thumb.loading = 'lazy'
      open.append(thumb)
    }
    open.addEventListener('click', () => onOpenComp?.(entry.reference, last?.comps ?? []))
    const head = el('div', 'plan-comp__head')
    head.append(
      el('span', 'plan-comp__title', entry.title),
      el('span', 'plan-comp__source', COMPS_FROM[entry.source] ?? entry.source),
    )
    const remove = el('button', 'plan-comp__remove', COMPS_REMOVE)
    remove.type = 'button'
    remove.addEventListener('click', () => void comp({ action: 'remove', reference: entry.reference }))
    head.append(remove)
    const areas = {}
    /** [[BUG-236]] — store this comp's notes, and say so; what was typed is then the stored text. */
    const note = async (keys) => {
      const body = Object.fromEntries(keys.map((key) => [key, notesOf(areas[key].value)]))
      if (!(await comp({ action: 'note', reference: entry.reference, ...body }))) return
      for (const key of keys) typedNotes.delete(`${entry.reference}:${key}`)
      flashSaved(compBlocks.get(entry.reference)?.node)
    }
    const notes = (label, key) => {
      const box = el('label', `plan-comp__notes plan-comp__notes--${key}`)
      const area = (areas[key] = el('textarea', `plan-comp__${key}`))
      area.rows = 2
      area.placeholder = COMPS_NOTES_HINT
      area.value = typedNotes.get(`${entry.reference}:${key}`) ?? notesText(entry[key])
      area.setAttribute('aria-label', `${label}: ${entry.title}`)
      area.addEventListener('input', () => typedNotes.set(`${entry.reference}:${key}`, area.value))
      // `change` IS "LEFT THE BOX, HAVING CHANGED IT" — the safety net under Done.
      area.addEventListener('change', () => void note([key]))
      box.append(el('span', 'plan-comp__notes-label', label), area)
      return box
    }
    // [[BUG-236]] — DONE FOR THIS SITE: both boxes, stored at once.
    const done = el('button', 'plan-ask__done plan-comp__done', COMPS_DONE)
    done.type = 'button'
    done.addEventListener('click', () => void note(['likes', 'dislikes']))
    block.append(open, head, notes(COMPS_LIKES, 'likes'), notes(COMPS_DISLIKES, 'dislikes'), done)
    return block
  }

  let last = null

  /**
   * The stages as the banner draws them ([[REQ-398]]): each its number, coloured
   * by its state (`data-state`), with a mark beside the colour — ✓ done, a dash
   * skipped — and the one in progress also named, spinning while a turn runs.
   */
  function drawStages(stages) {
    const states = shownStates(stages)
    // [[BUG-235]] — TWO STAGES MAY BE IN PROGRESS (getting to know you carries on
    // while the first draft is built): the furthest is named and spins, and the
    // other keeps its in-progress colour only.
    const named = states.lastIndexOf('in_progress')
    stageList.replaceChildren(
      ...stages.map((stage, i) => {
        const state = states[i]
        const item = el('li', 'plan-stage')
        item.dataset.stage = stage.id
        item.dataset.state = state
        item.dataset.label = stage.label
        item.dataset.about = stage.about ?? ''
        item.tabIndex = 0
        item.setAttribute('aria-describedby', tip.id)
        item.setAttribute('aria-label', `${i + 1}. ${stage.label} — ${PLAN_STAGE_STATE[state] ?? state}`)
        const current = i === named
        if (current) item.setAttribute('aria-current', 'step')
        item.append(el('span', 'plan-stage__number', current ? `${i + 1}.` : String(i + 1)))
        if (current) {
          if (busy) {
            const spinner = el('span', 'plan-stage__mark plan-stage__spinner')
            spinner.setAttribute('aria-hidden', 'true')
            item.append(spinner)
          }
          item.append(el('span', 'plan-stage__label', stage.label))
        } else if (state === 'done' || state === 'skipped') {
          const mark = el('span', 'plan-stage__mark', state === 'done' ? '✓' : '–')
          mark.setAttribute('aria-hidden', 'true')
          item.append(mark)
        }
        item.addEventListener('mouseenter', () => showTip(item))
        item.addEventListener('mouseleave', hideTip)
        item.addEventListener('focus', () => showTip(item))
        item.addEventListener('blur', hideTip)
        // A TAP ON A TOUCH SCREEN opens the explanation; it never moves the stage.
        item.addEventListener('click', () => (tipFor === stage.id && !tip.hidden ? hideTip() : showTip(item)))
        return item
      }),
    )
    const held = tipFor && [...stageList.children].find((item) => item.dataset.stage === tipFor)
    if (held) showTip(held)
    else hideTip()
    tracker.hidden = stages.length === 0
    tracker.dataset.busy = String(busy)
  }

  /** Draw a view, keeping every block that has not changed and the one in use. */
  function render(view) {
    last = view
    drawStages(view.stages ?? [])
    const asks = view.asks ?? []
    const open = asks.filter((a) => a.status === 'open')
    const done = asks.filter((a) => a.status === 'answered' || a.status === 'skipped')
    // [[REQ-403]] — A COUNT OR NOTHING. With no open question there is nothing to
    // say: "all done" was false on a new plan, where nothing had been asked yet.
    progress.hidden = !(view.stages ?? []).length || open.length === 0
    progress.textContent = open.length ? PLAN_STILL_TO_ANSWER(open.length) : ''
    // [[BUG-211]] — IN USE MEANS BEING TYPED IN OR TICKED. A clicked button takes
    // focus too, and holding its block would drop the redraw the click asked for.
    const active = document.activeElement?.matches?.('input, textarea, select') ? document.activeElement : null
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
    for (const ask of [...open, ...done]) fold(drawn.get(ask.id).node, `ask:${ask.id}`, itemState(ask.status))
    // [[REQ-378]], [[REQ-401]] — the comp board, one item, last of the open ones or
    // first of the settled; never before a site is shown.
    const compsState = view.comps_status ?? 'open'
    // [[REQ-403]] — and, like every other question, not until the consultant has
    // raised it.
    if (site && view.comps_raised === true) {
      if (compsState === 'open') openList.append(compsItem.node)
      else doneList.prepend(compsItem.node)
      compsItem.node.dataset.status = compsState
      fold(compsItem.node, 'comps', compsState)
    } else compsItem.node.remove()
    compsSkip.hidden = compsState !== 'open'
    const comps = view.comps ?? []
    // [[BUG-236]] — "I've finished commenting" while there is a board to finish
    // with, and once pressed, that it was heard.
    compsFinish.hidden = compsState !== 'open' || comps.length === 0 || view.comps_finished === true
    compsFinished.hidden = compsState !== 'open' || comps.length === 0 || view.comps_finished !== true
    // The board's own entries, under the panel's rule: a block whose content has
    // not changed is kept, and so is the one the client is typing in.
    const keptComps = new Map()
    compsList.replaceChildren(
      ...comps.map((entry) => {
        const key = JSON.stringify(entry)
        const held = compBlocks.get(entry.reference)
        const inUse = held && active && held.node.contains(active)
        const node = held && (held.key === key || inUse) ? held.node : compBlock(entry)
        keptComps.set(entry.reference, { node, key: held && inUse ? held.key : key })
        return node
      }),
    )
    compBlocks.clear()
    for (const [ref, held] of keptComps) compBlocks.set(ref, held)
    compsList.hidden = comps.length === 0
    blocks.clear()
    for (const [id, held] of drawn) blocks.set(id, held)
    // A SECTION WITH NOTHING IN IT IS HIDDEN, heading and all.
    openHeading.hidden = openList.hidden = openList.childElementCount === 0
    doneHeading.hidden = doneList.hidden = doneList.childElementCount === 0
    noQuestions.hidden = !(openList.hidden && doneList.hidden)
    onView?.(view)
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

  render({ stages: [], asks: [], comps: [] })

  return {
    element,
    /** Show a site's plan, or nothing. */
    setSite(next) {
      if (next === site) return refresh()
      site = next ?? null
      changing.clear()
      typed.clear()
      typedNotes.clear()
      blocks.clear()
      compBlocks.clear()
      error.hidden = true
      render({ stages: [], asks: [], comps: [] })
      return refresh()
    },
    refresh,
    /** [[REQ-390]] — a turn is running, or not: the current stage spins while it is. */
    setBusy(next) {
      busy = Boolean(next)
      drawStages(last?.stages ?? [])
    },
    /** The comp board as last drawn ([[REQ-378]]). */
    comps: () => last?.comps ?? [],
    /**
     * [[REQ-413]] — bring one question forward: unfolded (and remembered so, as
     * the client's own unfold would be), scrolled to, and briefly highlighted.
     * A question the panel does not show yet — raised a moment ago — is looked
     * for again after one re-read. Answers whether it was there.
     */
    async showAsk(id) {
      if (!blocks.get(id)?.node.isConnected) await refresh()
      const node = blocks.get(id)?.node
      if (!node?.isConnected) return false
      if (node.dataset.expanded !== 'true') toggle(node)
      node.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
      node.classList.remove(SHOWN_CLASS)
      void node.offsetWidth
      node.classList.add(SHOWN_CLASS)
      setTimeout(() => node.classList.remove(SHOWN_CLASS), SHOWN_MS)
      return true
    },
    destroy() {
      site = null
      element.remove()
    },
  }
}
