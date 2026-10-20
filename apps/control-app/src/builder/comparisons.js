/**
 * Comparisons ([[REQ-419]]) — the preview pane's fourth mode, beside View, Edit
 * and Story: every comparable site as a tile, and the client's likes and dislikes
 * under each.
 *
 * THE REAL SITE IS WHAT THE CLIENT LOOKS AT. A tile's thumbnail is the top of the
 * capture's desktop screenshot, cropped to about one screen, and it is there only
 * so the client recognises the site. The thumbnail and "Open the site ↗" both open
 * the live site in a new tab, because a picture loses motion, effects and how the
 * site feels on a phone — and a slow page or a cookie banner ruins it. Nothing on
 * a tile suggests the thumbnail shows how the site works; one line above the grid
 * invites the client to open each site and look around.
 *
 * A BAD PICTURE STILL MAKES A FULL TILE. With no screenshot, or one that will not
 * load, the thumbnail's place shows the site's name and address instead, and the
 * tile keeps its link and its notes.
 *
 * IT HOLDS NO STATE OF ITS OWN BEYOND WHAT IS ON SCREEN. It draws the comps from
 * the plan view (`/api/plan`) and writes back through `/api/plan/comp`; every
 * write answers the view as stored, which is what is drawn next. A redraw never
 * takes a field from under the client: a tile whose comp has not changed is kept,
 * so is the one they are typing in, and notes typed and not yet stored are kept
 * by themselves ([[BUG-236]]) so a tile drawn again still holds them.
 *
 * [[BUG-236]] — EACH TILE HAS ITS OWN DONE, storing both boxes; leaving a box
 * having changed it stores it too. "I've finished commenting" under the grid tells
 * the consultant, on its next turn, that the client is finished with the comps.
 */
import { compAction, materialFileUrl } from './api.js'
import {
  COMPS_ADD_BUTTON,
  COMPS_ADD_LABEL,
  COMPS_ADD_PLACEHOLDER,
  COMPS_ADDING,
  COMPS_DISLIKES,
  COMPS_DONE,
  COMPS_EMPTY,
  COMPS_FAILED,
  COMPS_FINISHED,
  COMPS_FINISHED_SAID,
  COMPS_FROM,
  COMPS_HEADING,
  COMPS_INTRO,
  COMPS_LIKES,
  COMPS_NOTES_HINT,
  COMPS_OPEN,
  COMPS_REMOVE,
  COMPS_VISIT,
  PLAN_SAVED,
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

/** One note per line, blank lines dropped. */
const notesOf = (text) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')

const notesText = (notes) => (Array.isArray(notes) ? notes.join('\n') : '')

/** How long "Saved ✓" stays on a tile, and the highlight on a tile brought forward. */
const SAVED_MS = 4000
const SHOWN_MS = 2400
export const SHOWN_CLASS = 'comp-tile--shown'

/**
 * @param {object} [options]
 * @param {{compAction?: Function}} [options.transport]
 */
export function createComparisons(options = {}) {
  const transport = { compAction, ...(options.transport ?? {}) }

  const element = el('section', 'comparisons')
  element.setAttribute('aria-label', COMPS_HEADING)
  const heading = el('h2', 'comparisons__heading', COMPS_HEADING)
  const intro = el('p', 'comparisons__intro', COMPS_INTRO)
  const error = el('p', 'comparisons__error')
  error.setAttribute('role', 'alert')
  error.hidden = true
  const empty = el('p', 'comparisons__empty', COMPS_EMPTY)
  const grid = el('div', 'comparisons__grid')

  const addForm = el('form', 'comparisons__add')
  const addInput = el('input', 'comparisons__url')
  addInput.type = 'url'
  addInput.placeholder = COMPS_ADD_PLACEHOLDER
  addInput.setAttribute('aria-label', COMPS_ADD_LABEL)
  const addButton = el('button', 'comparisons__add-button', COMPS_ADD_BUTTON)
  addButton.type = 'submit'
  const addStatus = el('span', 'comparisons__status')
  addForm.append(el('label', 'comparisons__add-label', COMPS_ADD_LABEL), addInput, addButton, addStatus)

  const finish = button('comparisons__finish', COMPS_FINISHED, () => void comp({ action: 'finish' }))
  const finished = el('span', 'comparisons__finished', COMPS_FINISHED_SAID)
  finished.setAttribute('role', 'status')
  const skip = button('comparisons__skip', PLAN_SKIP, () => void comp({ action: 'skip' }))
  const footer = el('div', 'comparisons__footer')
  footer.append(finish, finished, skip)

  element.append(heading, intro, error, empty, grid, addForm, footer)

  let site = null
  let last = null
  /** Comp reference → its drawn tile and what it was drawn from. */
  const tiles = new Map()
  /** [[BUG-236]] — notes typed and not yet stored, by `reference:likes|dislikes`. */
  const typedNotes = new Map()

  /** A comp write; redraws from what was stored. Answers whether it was stored. */
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

  /** Say on a tile, for a moment, that its notes were stored. */
  function flashSaved(reference) {
    const head = tiles.get(reference)?.node.querySelector('.comp-tile__head')
    if (!head) return
    head.querySelector(':scope > .comp-tile__saved')?.remove()
    const said = el('span', 'comp-tile__saved', PLAN_SAVED)
    said.setAttribute('role', 'status')
    head.append(said)
    setTimeout(() => said.remove(), SAVED_MS)
  }

  /** The name and address, where a picture would be. */
  function card(entry) {
    const node = el('span', 'comp-tile__card')
    node.append(
      el('span', 'comp-tile__card-name', entry.title),
      el('span', 'comp-tile__card-address', addressOf(entry.url)),
    )
    return node
  }

  /** One comp: its thumbnail, its name and address, who added it, and the client's notes. */
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

    const areas = {}
    const note = async (keys) => {
      const body = Object.fromEntries(keys.map((key) => [key, notesOf(areas[key].value)]))
      if (!(await comp({ action: 'note', reference: entry.reference, ...body }))) return
      for (const key of keys) typedNotes.delete(`${entry.reference}:${key}`)
      flashSaved(entry.reference)
    }
    const notes = (label, key) => {
      const box = el('label', `comp-tile__notes comp-tile__notes--${key}`)
      const area = (areas[key] = el('textarea', `comp-tile__${key}`))
      area.rows = 2
      area.placeholder = COMPS_NOTES_HINT
      area.value = typedNotes.get(`${entry.reference}:${key}`) ?? notesText(entry[key])
      area.setAttribute('aria-label', `${label}: ${entry.title}`)
      area.addEventListener('input', () => typedNotes.set(`${entry.reference}:${key}`, area.value))
      // `change` IS "LEFT THE BOX, HAVING CHANGED IT" — the safety net under Done.
      area.addEventListener('change', () => void note([key]))
      box.append(el('span', 'comp-tile__notes-label', label), area)
      return box
    }
    const done = button('comp-tile__done', COMPS_DONE, () => void note(['likes', 'dislikes']))
    node.append(shot, head, meta, notes(COMPS_LIKES, 'likes'), notes(COMPS_DISLIKES, 'dislikes'), done)
    return node
  }

  /** Draw a plan view's comps, keeping every tile that has not changed and the one in use. */
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
    empty.hidden = comps.length > 0
    grid.hidden = comps.length === 0
    // "I've finished commenting" while there are comps to finish with, and once
    // pressed, that it was heard; Skip while the comps are still open.
    finish.hidden = status !== 'open' || comps.length === 0 || view?.comps_finished === true
    finished.hidden = status !== 'open' || comps.length === 0 || view?.comps_finished !== true
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
      tiles.clear()
      error.hidden = true
      render(null)
    },
    /** Put the grid in the pane's host (a mount mode's `mount`). */
    mount(host) {
      host.append(element)
    },
    /** Bring one comp's tile into view, briefly highlighted. Answers whether it was there. */
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
