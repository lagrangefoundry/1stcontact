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
 * There is no submit step for the panel as a whole. [[BUG-245]] — A TYPED ANSWER'S
 * BUTTON IS SAVE, and its state is always beside it: "Not saved yet" while the
 * box holds something not stored, "Saved ✓" once it is. Saving starts no turn.
 *
 * [[BUG-245]] — NEW QUESTIONS ARE VISIBLE: an "N new" badge beside Open questions,
 * and a highlight on each new item until the client opens it (clicks or focuses
 * into it). Which questions the client has seen is kept per site in this browser;
 * the first sight of a site's panel sees everything already on it. And WHILE THE
 * CONSULTANT WORKS the panel says so (`setBusy`): its edge and banner take the
 * progress banner's in-progress blue, gently animated, still under reduced motion.
 *
 * [[BUG-200]] — EXCEPT A MULTI-SELECT, where the first tick is never the whole
 * answer. Its ticks are saved as a draft, which leaves the question open and tells
 * the consultant nothing, and the client finishes it with Done — or "None of these"
 * with nothing ticked — which answers with every tick at once.
 *
 * [[REQ-419]] — THE COMPARABLE SITES ARE NOT ON THE PANEL: they have the
 * preview's Comparisons mode (`comparisons.js`). The panel's one route there is the
 * link in the "Looking at other sites" stage's explanation (`onOpenComparisons`).
 *
 * [[REQ-390]], [[REQ-398]], [[BUG-209]] — AND, FIRST OF ALL, WHERE THE BUILD IS:
 * the progress banner, a segmented bar pinned across the top of the panel —
 * `Progress [1✓][2✓][3. Refining   ][4]…` — each stage a box coloured by its
 * state, and only the stage in progress named. The consultant marks the stages; the banner only draws them and
 * is never clicked to change one. While a turn is running (`setBusy`) the stage in
 * progress spins. SKIPPED IS DRAWN, NEVER STORED ({@link shownStates}). Hovering,
 * focusing or tapping a stage explains it: its name, its sentence from the seed,
 * and its state in words. The explanation stays up while the pointer is on it, so
 * a link in it can be followed.
 *
 * [[REQ-401]] — EVERY QUESTION IS ONE FOLDABLE ITEM: a line
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
 * [[BUG-236]] — AND WHAT THEY TYPED IS KEPT BY ITSELF until it is stored, by ask,
 * so a block that is drawn again — the client had moved on to
 * another box — is drawn with their text still in it.
 *
 * [[REQ-424]] — WHILE THE CONSULTANT HAS THE CLIENT ANSWERING THE QUESTIONS, the
 * panel says so: the focus banner under the progress line (the consultant's line,
 * "2 of 5 questions left", Done for them all) and each question still waiting
 * edged in its blue. Skip stays on each question.
 */
import { answerAsk, deleteMaterial, fetchPlan, focusAction, saveMaterialRole, uploadMaterial } from './api.js'
import { createFocusBanner } from './focus-banner.js'
import { failureContent } from './failure-notice.js'
import { canUseOnSite, confirmDelete, deleteButton, useOnSiteButton } from './material-actions.js'
import {
  COMPS_STAGE_LINK,
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
  PLAN_NEW,
  PLAN_NOT_SAVED,
  PLAN_OPEN_QUESTIONS,
  PLAN_PANEL_LABEL,
  PLAN_STAGE_STATE,
  PLAN_STAGES_LABEL,
  PLAN_STAGES_TITLE,
  PLAN_SAVE,
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
  PLAN_WORKING,
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

/** Every material an answer cites, one or several ([[BUG-196]]). */
const answerMaterials = (ask) =>
  Array.isArray(ask.answer_material) ? ask.answer_material : ask.answer_material ? [ask.answer_material] : []

/** [[REQ-401]] — an ask's status as its item shows it. */
const itemState = (status) => (status === 'answered' ? 'done' : status)

/** [[BUG-236]] — how long "Saved ✓" stays on an item's line. */
const SAVED_MS = 4000

/** [[BUG-236]] — say on an item's line, for a moment, that what the client gave was stored. */
function flashSaved(node) {
  const line = node?.querySelector(':scope > .plan-item__line')
  if (!line) return
  line.querySelector(':scope > .plan-item__saved')?.remove()
  const said = el('span', 'plan-item__saved', PLAN_SAVED)
  said.setAttribute('role', 'status')
  line.append(said)
  setTimeout(() => said.remove(), SAVED_MS)
}

/** [[REQ-419]] — the stage whose explanation links to Comparisons, and how long a tip waits for the pointer. */
const COMPARISONS_STAGE = 'other_sites'
const TIP_GRACE_MS = 200

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
 * @param {{fetchPlan?: Function, answerAsk?: Function, uploadMaterial?: Function, setRole?: Function, remove?: Function}} [options.transport]
 * @param {() => Element|null} [options.getModalHost] where the delete confirmation mounts
 * @param {() => void} [options.onOpenComparisons]
 *   the client followed the "Looking at other sites" link: show Comparisons ([[REQ-419]])
 * @param {Storage} [options.storage] where the client's folds are remembered ([[REQ-401]])
 * @param {(view: object) => void} [options.onView] every plan view drawn ([[REQ-408]])
 */
export function createPlanPanel(options = {}) {
  const transport = {
    fetchPlan,
    answerAsk,
    focusAction,
    uploadMaterial,
    // [[BUG-196]] — the actions on an answered upload: the Library's own calls.
    setRole: saveMaterialRole,
    remove: deleteMaterial,
    ...(options.transport ?? {}),
  }
  const getModalHost = options.getModalHost ?? (() => null)
  /** The delete dialog an answered upload opened, so a second press opens no other. */
  let confirming = null
  const onOpenComparisons = options.onOpenComparisons ?? null
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
  // [[BUG-244]] — UNDER THE BANNER AND JOINED TO IT, the chat's status widget
  // while the worker works (the host hands this to the chat as its
  // `statusContainer`). Pinned with the banner; empty, it takes no room.
  const statusSlot = el('div', 'plan-stages__status')
  tracker.append(el('span', 'plan-stages__title', PLAN_STAGES_TITLE), stageList, tip, statusSlot)
  let busy = false
  /** The stage the tip is explaining, by id, so a redraw keeps it open. */
  let tipFor = null
  /** A hide asked for as the pointer left a stage: called off if it arrives on the tip. */
  let hiding = null
  const showTip = (item) => {
    clearTimeout(hiding)
    tipFor = item.dataset.stage
    tip.replaceChildren(
      el('strong', 'plan-stages__tip-name', item.dataset.label),
      el('span', 'plan-stages__tip-about', item.dataset.about),
      el('span', 'plan-stages__tip-state', PLAN_STAGE_STATE[item.dataset.state] ?? item.dataset.state),
    )
    // [[REQ-419]] — WHERE THE SITES ARE: the stage about other sites says how to
    // see them, once there are any to see. The link changes the pane, never the stage.
    if (item.dataset.stage === COMPARISONS_STAGE && comparisonsRaised && onOpenComparisons) {
      const link = el('button', 'plan-stages__tip-link', COMPS_STAGE_LINK)
      link.type = 'button'
      link.addEventListener('click', (event) => {
        event.stopPropagation()
        hideTip()
        onOpenComparisons()
      })
      tip.append(link)
    }
    tip.hidden = false
    // UNDER THE STAGE, kept inside the banner at its right-hand end.
    tip.style.left = `${Math.max(0, Math.min(item.offsetLeft, tracker.clientWidth - tip.offsetWidth))}px`
  }
  const hideTip = () => {
    clearTimeout(hiding)
    tipFor = null
    tip.hidden = true
  }
  /** Leaving a stage hides its tip — unless the pointer or focus went into the tip. */
  const leaveStage = () => {
    clearTimeout(hiding)
    hiding = setTimeout(hideTip, TIP_GRACE_MS)
  }
  tip.addEventListener('mouseenter', () => clearTimeout(hiding))
  tip.addEventListener('mouseleave', leaveStage)
  tip.addEventListener('focusout', (event) => {
    if (!tip.contains(event.relatedTarget)) hideTip()
  })
  /** [[REQ-419]] — whether the comps have been raised, so the stage's link has somewhere to go. */
  let comparisonsRaised = false
  // [[REQ-379]] — directly under the tracker: how much is left for the client.
  const progress = el('div', 'plan-panel__progress')
  progress.setAttribute('role', 'status')
  const error = el('div', 'plan-panel__error')
  error.hidden = true
  const openHeading = el('h3', 'plan-panel__heading', PLAN_OPEN_QUESTIONS)
  // [[BUG-245]] — how many open questions the client has not opened yet: a badge
  // the stylesheet draws beside the heading from `data-new`, so the heading's own
  // words stay "Open questions".
  // [[BUG-245]] — the working state in words, for a screen reader: never colour alone.
  const working = el('span', 'plan-panel__working', PLAN_WORKING)
  working.hidden = true
  const openList = el('div', 'plan-panel__list plan-panel__list--open')
  const doneHeading = el('h3', 'plan-panel__heading', PLAN_TOLD_US)
  const doneList = el('div', 'plan-panel__list plan-panel__list--done')
  // [[REQ-417]] — what the panel is for, until it has a question in it.
  const noQuestions = el('p', 'plan-panel__ghost', PLAN_NO_QUESTIONS_YET)
  // [[REQ-424]] — the questions task, when the consultant has started one.
  const focus = createFocusBanner({ kind: 'questions', site: () => site, transport, onView: (view) => render(view) })
  element.append(tracker, progress, focus.element, error, noQuestions, openHeading, openList, doneHeading, doneList, working)

  let site = null
  let generation = 0
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

  /**
   * [[BUG-245]] — the asks the client has seen on this site, as kept in this
   * browser; `null` until the site's panel has been seen once.
   */
  const seenKey = () => `plan-seen:${site}`
  function seenAsks() {
    try {
      const raw = JSON.parse(folds.getItem(seenKey()) ?? 'null')
      return Array.isArray(raw) ? new Set(raw.map(String)) : null
    } catch {
      return null
    }
  }
  function markSeen(ids) {
    const seen = seenAsks() ?? new Set()
    for (const id of ids) seen.add(id)
    folds.setItem(seenKey(), JSON.stringify([...seen]))
  }
  /** Whether this site's plan has been read from the origin yet: a placeholder draw sees nothing. */
  let loaded = false
  /** Draw which open asks are new, and the badge that counts them. */
  function drawNew(open) {
    let seen = loaded ? seenAsks() : new Set(open.map((a) => a.id))
    if (seen === null && site) {
      // THE FIRST SIGHT OF A SITE'S PANEL SEES WHAT IS ON IT: only later arrivals are new.
      markSeen(open.map((a) => a.id))
      seen = seenAsks()
    }
    let count = 0
    for (const ask of open) {
      const fresh = Boolean(site) && !seen?.has(ask.id)
      blocks.get(ask.id)?.node.classList.toggle('plan-item--new', fresh)
      if (fresh) count += 1
    }
    if (count) openHeading.dataset.new = PLAN_NEW(count)
    else delete openHeading.dataset.new
  }
  /** The client opened an item: it is no longer new. */
  function opened(node) {
    const id = node?.dataset.ask
    if (!id || !node.classList.contains('plan-item--new')) return
    markSeen([id])
    if (last) drawNew((last.asks ?? []).filter((a) => a.status === 'open'))
  }
  element.addEventListener('pointerdown', (event) => opened(event.target?.closest?.('.plan-item')))
  element.addEventListener('focusin', (event) => opened(event.target?.closest?.('.plan-item')))

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
   * [[BUG-236]] — a typed answer's box and its Save. Saved by Save, by Enter in a
   * one-line box, or — the safety net — by leaving the box having changed it
   * (`change`). The same answer is sent once however many of those happen.
   * [[BUG-245]] — and its state beside it: "Not saved yet" while the box holds
   * something not stored, "Saved ✓" while it holds what is.
   */
  function typedAnswer(ask, field, box) {
    if (typed.has(ask.id)) field.value = typed.get(ask.id)
    const stored = ask.status === 'answered' && typeof ask.answer === 'string' ? ask.answer : null
    const state = el('span', 'plan-ask__state')
    state.setAttribute('role', 'status')
    const show = () => {
      const value = field.value.trim()
      const saved = value !== '' && value === stored
      state.textContent = value === '' ? '' : saved ? PLAN_SAVED : PLAN_NOT_SAVED
      state.dataset.unsaved = String(value !== '' && !saved)
    }
    field.addEventListener('input', () => {
      typed.set(ask.id, field.value)
      show()
    })
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
    const saveButton = el('button', 'plan-ask__done plan-ask__save', PLAN_SAVE)
    saveButton.type = 'button'
    saveButton.addEventListener('click', commit)
    box.append(field, saveButton, state)
    show()
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
        item.addEventListener('mouseleave', leaveStage)
        item.addEventListener('focus', () => showTip(item))
        item.addEventListener('blur', (event) => {
          if (!tip.contains(event.relatedTarget)) hideTip()
        })
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
    comparisonsRaised = view.comps_raised === true
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
    blocks.clear()
    for (const [id, held] of drawn) blocks.set(id, held)
    drawNew(open)
    const pending = new Set(focus.render(view)?.pending ?? [])
    element.classList.toggle('plan-panel--focus', pending.size > 0)
    for (const [id, held] of blocks) held.node.classList.toggle('plan-item--focus', pending.has(id))
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
      if (mine === generation && asked === site) {
        loaded = true
        render(view)
      }
    } catch {
      // THE PANEL IS AN ORNAMENT ON THE CONVERSATION, not a condition of it: a
      // plan that cannot be read leaves the last drawing and says nothing.
    }
  }

  render({ stages: [], asks: [], comps: [] })

  return {
    element,
    /** [[BUG-244]] — where the chat's status widget is drawn, under the banner. */
    statusSlot,
    /** Show a site's plan, or nothing. */
    setSite(next) {
      if (next === site) return refresh()
      site = next ?? null
      loaded = false
      changing.clear()
      typed.clear()
      blocks.clear()
      error.hidden = true
      render({ stages: [], asks: [], comps: [] })
      return refresh()
    },
    refresh,
    /**
     * [[REQ-390]] — a turn is running, or not: the current stage spins while it is.
     * [[BUG-245]] — and the whole panel shows that the consultant is working.
     */
    setBusy(next) {
      busy = Boolean(next)
      element.classList.toggle('plan-panel--working', busy)
      element.setAttribute('aria-busy', String(busy))
      working.hidden = !busy
      drawStages(last?.stages ?? [])
    },
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
