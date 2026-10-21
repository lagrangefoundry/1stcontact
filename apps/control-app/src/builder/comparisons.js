/**
 * Comparisons ([[REQ-419]]) — the preview pane's fourth mode, beside View, Edit
 * and Story: every comparable site as a card, and the client's note on each.
 *
 * THE REAL SITE IS WHAT THE CLIENT LOOKS AT. A card's thumbnail is the top of the
 * capture's desktop screenshot, cropped to about one screen, and it is there only
 * so the client recognises the site. The thumbnail and "Open the real site ↗" both
 * open the live site in a new tab, because a picture loses motion, effects and how
 * the site feels on a phone — and a slow page or a cookie banner ruins it.
 *
 * A BAD PICTURE STILL MAKES A FULL CARD. With no screenshot, or one that will not
 * load, the thumbnail's place shows the site's name and address instead, and the
 * card keeps its link and its note.
 *
 * [[BUG-245]] — EACH CARD IS OPEN OR CLOSED. It carries the consultant's line on
 * why it chose the site, and one notes box that grows ("What do you like? What
 * would you never do?"). What the client types is kept as a draft — never lost,
 * never seen by the consultant — until **Send to the consultant ➤**, which posts
 * the note into the conversation as the client's own message, labelled with the
 * site. **Skip** closes the card unsent. The state is always on the card: open
 * ("Not sent yet" with a dot while there is unsent text), "Sent ✓ <time>" with the
 * card edged in the accent colour, or "Skipped", muted. Editing a sent note makes
 * it "Not sent yet" again; Reopen un-skips. When every card is sent or skipped
 * the board is finished, and the consultant is told without being asked.
 *
 * IT HOLDS NO STATE OF ITS OWN BEYOND WHAT IS ON SCREEN. It draws the comps from
 * the plan view (`/api/plan`) and writes back through `/api/plan/comp`; every
 * write answers the view as stored, which is what is drawn next. A redraw never
 * takes a field from under the client: a card whose comp has not changed is kept,
 * so is the one they are typing in, and text typed and not yet stored is kept by
 * itself so a card drawn again still holds it.
 *
 * [[REQ-424]] — A COMPARISON FOCUS TASK is the same board led by the consultant:
 * the focus banner at its head (the consultant's line, "1 of 3 sites left", Done)
 * and the cards still open edged in its blue.
 */
import { compAction, materialFileUrl } from './api.js'
import { createFocusBanner } from './focus-banner.js'
import {
  COMPS_ADD_BUTTON,
  COMPS_ADD_LABEL,
  COMPS_ADD_PLACEHOLDER,
  COMPS_ADDING,
  COMPS_EMPTY,
  COMPS_FAILED,
  COMPS_FROM,
  COMPS_HEADING,
  COMPS_INTRO,
  COMPS_NOTE_MESSAGE,
  COMPS_NOTES_HINT,
  COMPS_NOTES_LABEL,
  COMPS_OPEN,
  COMPS_REMOVE,
  COMPS_SEND,
  COMPS_SKIP,
  COMPS_STATE_SENT,
  COMPS_STATE_SKIPPED,
  COMPS_STATE_UNSENT,
  COMPS_UNSKIP,
  COMPS_VISIT,
  COMPS_WHY,
  PLAN_SKIP,
} from './config.js'

const el = (tag, className, text) => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

const button = (className, text, onClick) => {
  const node = el('button', className, text)
  node.type = 'button'
  node.addEventListener('click', onClick)
  return node
}

/** Only an http(s) address becomes a link: the comp's URL is a third party's. */
export const safeHref = (url) => {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null
  } catch {
    return null
  }
}

/** The address as a person reads it: `drybar.com/locations`, no scheme or `www.`. */
const addressOf = (url) => {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/$/, '')
    return `${parsed.hostname.replace(/^www\./, '')}${path}`
  } catch {
    return String(url ?? '')
  }
}

/** How long a card waits after the last keystroke before keeping the draft ([[BUG-245]]). */
const DRAFT_MS = 800
/** The highlight on a card brought forward, and how long it lasts. */
const SHOWN_MS = 2400
export const SHOWN_CLASS = 'comp-tile--shown'

/** [[BUG-245]] — a card's state from its comp and the text in its box. */
export function cardState(entry, text) {
  if (entry.state === 'skipped') return 'skipped'
  if (entry.state === 'sent' && text === (entry.sent ?? '')) return 'sent'
  return 'open'
}

/** [[BUG-245]] — when a note was sent, as the card says it: the time of day. */
const sentTime = (at) => {
  const when = new Date(at ?? '')
  return Number.isNaN(when.getTime()) ? '' : when.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

/** A box that grows with what is in it. */
const grow = (area) => {
  area.style.height = 'auto'
  area.style.height = `${area.scrollHeight}px`
}

/**
 * @param {object} [options]
 * @param {{compAction?: Function, focusAction?: Function}} [options.transport]
 * @param {(message: string) => void} [options.onSend]
 *   [[BUG-245]] — a note was sent: post `message` into the conversation as the
 *   client's own, which starts the consultant's short reply.
 * @param {() => void} [options.onFinished]
 *   [[BUG-245]] — a Skip finished the board (every card sent or skipped): the
 *   consultant is to sum up without being asked. A Send that finishes it needs
 *   nothing more — its message starts the turn that is told.
 */
export function createComparisons(options = {}) {
  const transport = { compAction, ...(options.transport ?? {}) }
  const onSend = options.onSend ?? (() => {})
  const onFinished = options.onFinished ?? (() => {})
  /** [[REQ-424]] — a write answered the plan's view: a card closed, or the focus task's Done. */
  const onView = options.onView ?? null

  const element = el('section', 'comparisons')
  element.setAttribute('aria-label', COMPS_HEADING)
  const heading = el('h2', 'comparisons__heading', COMPS_HEADING)
  // [[BUG-245]] — the consultant's note on the range it chose, when it wrote one.
  const note = el('p', 'comparisons__note')
  const intro = el('p', 'comparisons__intro', COMPS_INTRO)
  const error = el('p', 'comparisons__error')
  error.setAttribute('role', 'alert')
  error.hidden = true
  const empty = el('p', 'comparisons__empty', COMPS_EMPTY)
  const grid = el('div', 'comparisons__grid')
  const focus = createFocusBanner({
    kind: 'comps',
    site: () => site,
    transport,
    onView: (view) => {
      render(view)
      onView?.(view)
    },
  })

  const addForm = el('form', 'comparisons__add')
  const addInput = el('input', 'comparisons__url')
  addInput.type = 'url'
  addInput.placeholder = COMPS_ADD_PLACEHOLDER
  addInput.setAttribute('aria-label', COMPS_ADD_LABEL)
  const addButton = el('button', 'comparisons__add-button', COMPS_ADD_BUTTON)
  addButton.type = 'submit'
  const addStatus = el('span', 'comparisons__status')
  addForm.append(el('label', 'comparisons__add-label', COMPS_ADD_LABEL), addInput, addButton, addStatus)

  const skip = button('comparisons__skip', PLAN_SKIP, () => void comp({ action: 'skip' }))
  const footer = el('div', 'comparisons__footer')
  footer.append(skip)

  element.append(heading, focus.element, note, intro, error, empty, grid, addForm, footer)

  let site = null
  let last = null
  /** Comp reference → its drawn card and what it was drawn from. */
  const tiles = new Map()
  /** Notes typed and not yet stored, by reference, so a redraw keeps them. */
  const typedNotes = new Map()
  /** Reference → the latest draft sent for it, so an older reply never redraws over it. */
  const drafting = new Map()

  /** A comp write; redraws from what was stored. Answers the view, or `null` when it failed. */
  async function comp(body) {
    const asked = site
    try {
      const view = await transport.compAction({ site: asked, ...body })
      error.hidden = true
      if (asked === site) {
        render(view)
        onView?.(view)
      }
      return view ?? {}
    } catch (err) {
      error.textContent = COMPS_FAILED(err?.message ?? String(err))
      error.hidden = false
      return null
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

  /** The name and address, where a picture would be. */
  function card(entry) {
    const node = el('span', 'comp-tile__card')
    node.append(
      el('span', 'comp-tile__card-name', entry.title),
      el('span', 'comp-tile__card-address', addressOf(entry.url)),
    )
    return node
  }

  /** One comp: its thumbnail, name and address, the consultant's why, the client's note, and its state. */
  function tile(entry) {
    const node = el('article', 'comp-tile')
    node.dataset.reference = entry.reference
    node.dataset.source = entry.source
    const href = safeHref(entry.url)

    // THE THUMBNAIL OPENS THE REAL SITE, like the link under it. Not a link at all
    // when the address is not http(s).
    const shot = el(href ? 'a' : 'div', 'comp-tile__shot')
    if (href) {
      shot.href = href
      shot.target = '_blank'
      shot.rel = 'noopener noreferrer'
      shot.setAttribute('aria-label', COMPS_OPEN(entry.title))
    }
    if (entry.desktop) {
      const thumb = el('img', 'comp-tile__thumb')
      thumb.src = materialFileUrl(entry.reference, entry.desktop)
      thumb.alt = ''
      thumb.loading = 'lazy'
      // A picture that will not load is a bad picture too.
      thumb.addEventListener('error', () => {
        shot.dataset.picture = 'none'
        thumb.replaceWith(card(entry))
      })
      shot.append(thumb)
    } else {
      shot.dataset.picture = 'none'
      shot.append(card(entry))
    }

    const head = el('div', 'comp-tile__head')
    head.append(el('span', 'comp-tile__title', entry.title), el('span', 'comp-tile__address', addressOf(entry.url)))
    const meta = el('div', 'comp-tile__meta')
    if (href) {
      const visit = el('a', 'comp-tile__visit', COMPS_VISIT)
      visit.href = href
      visit.target = '_blank'
      visit.rel = 'noopener noreferrer'
      meta.append(visit)
    }
    meta.append(
      el('span', 'comp-tile__source', COMPS_FROM[entry.source] ?? entry.source),
      button('comp-tile__remove', COMPS_REMOVE, () => void comp({ action: 'remove', reference: entry.reference })),
    )
    node.append(shot, head, meta)

    // [[BUG-245]] — WHY THE CONSULTANT CHOSE IT, in its own words.
    if (entry.why) {
      const why = el('p', 'comp-tile__why')
      why.append(el('span', 'comp-tile__why-label', COMPS_WHY), document.createTextNode(` ${entry.why}`))
      node.append(why)
    }

    const box = el('label', 'comp-tile__notes')
    const area = el('textarea', 'comp-tile__note')
    area.rows = 3
    area.placeholder = COMPS_NOTES_HINT
    area.value = typedNotes.get(entry.reference) ?? entry.note ?? ''
    area.setAttribute('aria-label', `${COMPS_NOTES_LABEL}: ${entry.title}`)
    box.append(el('span', 'comp-tile__notes-label', COMPS_NOTES_LABEL), area)

    const state = el('span', 'comp-tile__state')
    state.setAttribute('role', 'status')
    const send = button('comp-tile__send', COMPS_SEND, () => void sendNote())
    const skipOne = button('comp-tile__skip', COMPS_SKIP, () => void skipOrReopen())
    const foot = el('div', 'comp-tile__footer')
    foot.append(state, send, skipOne)
    node.append(box, foot)

    /** Draw the card's state from the comp and what is in the box. */
    const show = () => {
      const text = area.value
      const now = cardState(entry, text)
      node.dataset.state = now
      node.dataset.unsent = String(now === 'open' && text.trim() !== '')
      state.textContent =
        now === 'sent' ? COMPS_STATE_SENT(sentTime(entry.sent_at)) : now === 'skipped' ? COMPS_STATE_SKIPPED : text.trim() ? COMPS_STATE_UNSENT : ''
      send.disabled = now === 'sent' || text.trim() === ''
      skipOne.textContent = now === 'skipped' ? COMPS_UNSKIP : COMPS_SKIP
    }

    /** Keep what is in the box as a draft: nobody is told. */
    let timer = null
    const keep = async () => {
      clearTimeout(timer)
      timer = null
      const text = area.value
      if (text === (entry.note ?? '')) return
      const mine = (drafting.get(entry.reference) ?? 0) + 1
      drafting.set(entry.reference, mine)
      const asked = site
      try {
        const view = await transport.compAction({ site: asked, action: 'draft', reference: entry.reference, note: text })
        error.hidden = true
        if (drafting.get(entry.reference) !== mine || asked !== site) return
        if (typedNotes.get(entry.reference) === text) typedNotes.delete(entry.reference)
        render(view)
      } catch (err) {
        error.textContent = COMPS_FAILED(err?.message ?? String(err))
        error.hidden = false
      }
    }
    area.addEventListener('input', () => {
      typedNotes.set(entry.reference, area.value)
      grow(area)
      show()
      clearTimeout(timer)
      timer = setTimeout(() => void keep(), DRAFT_MS)
    })
    // `change` IS "LEFT THE BOX, HAVING CHANGED IT": the draft is kept at once.
    area.addEventListener('change', () => void keep())

    async function sendNote() {
      const text = area.value.trim()
      if (text === '') return
      clearTimeout(timer)
      drafting.set(entry.reference, (drafting.get(entry.reference) ?? 0) + 1)
      const view = await comp({ action: 'send', reference: entry.reference, note: text })
      if (!view) return
      typedNotes.delete(entry.reference)
      try {
        onSend(COMPS_NOTE_MESSAGE(entry.title, text))
      } catch {
        // The conversation's failure is the conversation's to show.
      }
    }

    async function skipOrReopen() {
      const reopening = cardState(entry, area.value) === 'skipped'
      const wasFinished = last?.comps_finished === true
      const view = await comp({ action: reopening ? 'reopen_site' : 'skip_site', reference: entry.reference })
      if (view?.comps_finished === true && !wasFinished) {
        try {
          onFinished()
        } catch {
          // The cue is the conversation's to start.
        }
      }
    }

    show()
    queueMicrotask(() => grow(area))
    return node
  }

  /** Draw a plan view's comps, keeping every card that has not changed and the one in use. */
  function render(view) {
    last = view ?? null
    const comps = view?.comps ?? []
    const status = view?.comps_status ?? 'open'
    const active = document.activeElement?.matches?.('input, textarea, select') ? document.activeElement : null
    const kept = new Map()
    grid.replaceChildren(
      ...comps.map((entry) => {
        const key = JSON.stringify(entry)
        const held = tiles.get(entry.reference)
        const inUse = held && active && held.node.contains(active)
        const node = held && (held.key === key || inUse) ? held.node : tile(entry)
        kept.set(entry.reference, { node, key: held && inUse ? held.key : key })
        return node
      }),
    )
    tiles.clear()
    for (const [ref, held] of kept) tiles.set(ref, held)
    const pending = new Set(focus.render(view)?.pending ?? [])
    for (const [ref, held] of tiles) held.node.classList.toggle('comp-tile--focus', pending.has(ref))
    note.textContent = view?.comps_note ?? ''
    note.hidden = note.textContent === ''
    empty.hidden = comps.length > 0
    grid.hidden = comps.length === 0
    // Skip comparing sites while the board is still open.
    skip.hidden = status !== 'open'
  }

  render(null)

  return {
    element,
    render,
    /** Whether the consultant has raised the comps, as the last view said. */
    raised: () => last?.comps_raised === true,
    /** The comps as last drawn. */
    comps: () => last?.comps ?? [],
    /** Show a site's comps: what was on screen for another site is forgotten. */
    setSite(next) {
      if (next === site) return
      site = next ?? null
      typedNotes.clear()
      drafting.clear()
      tiles.clear()
      error.hidden = true
      render(null)
    },
    /** Put the grid in the pane's host (a mount mode's `mount`). */
    mount(host) {
      host.append(element)
    },
    /** Bring one comp's card into view, briefly highlighted. Answers whether it was there. */
    reveal(reference) {
      const node = tiles.get(reference)?.node
      if (!node?.isConnected) return false
      node.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
      node.classList.remove(SHOWN_CLASS)
      void node.offsetWidth
      node.classList.add(SHOWN_CLASS)
      setTimeout(() => node.classList.remove(SHOWN_CLASS), SHOWN_MS)
      return true
    },
  }
}
