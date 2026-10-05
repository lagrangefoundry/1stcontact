/**
 * Alternative looks for a page, compared in the preview ([[REQ-391]]).
 *
 * WHAT IT REPLACES. A "look" used to be an ordinary page the consultant named
 * `/workwear` and nobody linked to, so the client found it — if at all — in the
 * page dropdown among the real pages, marked with a word that told them nothing.
 * A look is now a page carrying an `alternative` block (whose look it is, the
 * set it belongs to, what the client calls it), and this is where the client
 * meets a set: the preview in a mode of its own, **‹ Workwear · 1 of 3 ›** with
 * the look's one-line description, the width control and "Open in new tab" as
 * on the draft, **Choose this one**, and **Back to your draft**.
 *
 * A DOCUMENT MODE, NOT A PICTURE. Unlike a comp, a look is this site's own draft
 * page, so it is shown live, in a frame, at the width the client chose — which
 * is what makes the width control and "Open in new tab" work on the shown look
 * without either knowing looks exist.
 *
 * MOVING IS A SWAP, NOT A NAVIGATION. The looks either side of the shown one are
 * loaded behind it in the panel's spare frames, so ‹ and › trade frames, which
 * is instant and can be animated (the panel's `swapDocument`).
 *
 * THE LISTING IS THE TRUTH. Which looks a set holds is read off the page index
 * every time, never copied, so a look the consultant adds while the carousel is
 * open joins it, and a set that has been chosen from leaves it.
 */
import { previewPageUrl, previewUrl } from './api.js'
import { carouselNav } from './carousel.js'
import {
  LOOKS_BACK,
  LOOKS_CHOOSE,
  LOOKS_CHOOSING,
  LOOKS_COMPARE,
  LOOKS_COMPARE_TITLE,
  LOOKS_FAILED,
} from './config.js'

/** The pane mode a set is shown in. */
export const LOOKS_MODE = 'looks'

/**
 * Every set with a look still on offer, in listing order: `set → rows`.
 * An archived look — set aside when another was chosen — is in none of them.
 */
export function liveSets(rows) {
  const sets = new Map()
  for (const row of rows ?? []) {
    const alt = row?.alternative
    if (!alt || alt.archived) continue
    if (!sets.has(alt.set)) sets.set(alt.set, [])
    sets.get(alt.set).push(row)
  }
  // The set's own order, not the listing's: the page store lists by key.
  for (const rows of sets.values()) rows.sort((a, b) => (a.alternative.order ?? 0) - (b.alternative.order ?? 0))
  return sets
}

/**
 * @param {object} options
 * @param {object} options.panel the display panel
 * @param {object} options.pages the page index — `list`, `refresh`, `onRefreshed`, `open`
 * @param {() => string | null} options.getSite the site in scope
 * @param {(site: string, look: string) => Promise<object>} options.choose the transport
 */
export function createLooks({ panel, pages, getSite, choose }) {
  let set = null
  let index = 0
  /** Which of View and Edit to go back to. */
  let back = 'view'
  let busy = false
  let error = null
  const listeners = new Set()

  const members = () => (set === null ? [] : (liveSets(pages.list()).get(set) ?? []))
  const current = () => members()[index] ?? null
  const urlOf = (site, row) => previewPageUrl(previewUrl(site, 'draft'), row.slug)

  function notify() {
    for (const cb of [...listeners]) cb()
  }

  /** Load the looks either side of the shown one behind it. */
  function preloadNeighbours() {
    const site = getSite()
    if (!site || panel.getMode() !== LOOKS_MODE) return
    const rows = members()
    panel.preload([rows[index - 1], rows[index + 1]].filter(Boolean).map((row) => urlOf(site, row)))
  }

  function leave() {
    set = null
    error = null
    if (panel.getMode() === LOOKS_MODE) panel.setMode(back)
    notify()
  }

  // A listing that no longer holds the set — it was chosen from, or its looks
  // were removed — ends the carousel; one that grew or shrank keeps the shown
  // look in range.
  pages.onRefreshed(() => {
    if (set === null) return
    const rows = members()
    if (rows.length === 0) return leave()
    if (index >= rows.length) index = rows.length - 1
    notify()
  })

  const api = {
    /** The URL the looks mode shows: the current look, or the draft's front door. */
    src(site) {
      const row = current()
      return row ? urlOf(site, row) : previewUrl(site, 'draft')
    },

    /** The sets on offer: `{ set, of, count }`, in listing order. */
    sets() {
      return [...liveSets(pages.list())].map(([name, rows]) => ({
        set: name,
        of: rows[0].alternative.of,
        count: rows.length,
      }))
    },

    /** What the bar draws. */
    state() {
      return { set, index, members: members(), current: current(), busy, error }
    },

    /**
     * Show a set in the carousel — from the "Compare looks" control or a link
     * the consultant posted. `look` picks which one to show first. A set the
     * listing does not hold yet (the consultant made it a moment ago) is looked
     * for again once before the call gives up.
     */
    async open(nextSet, look = null) {
      if (!liveSets(pages.list()).has(nextSet)) await pages.refresh()
      const rows = liveSets(pages.list()).get(nextSet)
      if (!rows) return false
      if (panel.getMode() !== LOOKS_MODE) back = panel.getMode() ?? 'view'
      set = nextSet
      error = null
      index = Math.max(0, rows.findIndex((row) => row.id === look || row.slug === look))
      const site = getSite()
      if (panel.getMode() === LOOKS_MODE) {
        if (site) panel.swapDocument(urlOf(site, rows[index]), 'next')
      } else {
        panel.setMode(LOOKS_MODE)
      }
      preloadNeighbours()
      notify()
      return true
    },

    /** Move to the look at `to`, animated from the side it is on. */
    move(to) {
      const rows = members()
      const site = getSite()
      if (!site || to === index || to < 0 || to >= rows.length) return
      const direction = to > index ? 'next' : 'previous'
      index = to
      error = null
      panel.swapDocument(urlOf(site, rows[index]), direction)
      preloadNeighbours()
      notify()
    },

    /** "Back to your draft". */
    back: leave,

    /**
     * "Choose this one": the shown look goes onto its page, and the client is
     * taken back to the draft, on that page, to see it there.
     */
    async choose() {
      const row = current()
      const site = getSite()
      if (!row || !site || busy) return
      busy = true
      error = null
      notify()
      try {
        await choose(site, String(row.id))
        busy = false
        const target = pages.list().find((r) => r.id === row.alternative.of)
        leave()
        await pages.refresh()
        if (target) pages.open(target.slug)
      } catch (err) {
        busy = false
        error = LOOKS_FAILED(err?.message ?? String(err))
        notify()
      }
    },

    /** Told whenever what the bar shows may have changed. Returns the unsubscribe. */
    onChange(cb) {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },

    /** Called once the looks mode is showing, to load the neighbours behind it. */
    shown: preloadNeighbours,
  }
  return api
}

/**
 * The toolbar while a set is shown: Back to your draft, the carousel, and
 * Choose this one. The only toolbar actions beside it are the width control and
 * "Open in new tab", which the looks mode lists after it.
 */
export function lookCarouselAction(looks) {
  return {
    id: 'looks',
    create({ cleanup }) {
      const bar = document.createElement('div')
      bar.className = 'looks-bar'
      const draw = () => {
        const { members, index, current, busy, error } = looks.state()
        const backButton = document.createElement('button')
        backButton.type = 'button'
        backButton.className = 'looks-bar__back'
        backButton.textContent = LOOKS_BACK
        backButton.addEventListener('click', () => looks.back())
        const parts = [backButton]
        if (current) {
          parts.push(
            carouselNav({
              label: current.alternative.label,
              index,
              count: members.length,
              description: current.alternative.description,
              onMove: (to) => looks.move(to),
            }),
          )
          const chooseButton = document.createElement('button')
          chooseButton.type = 'button'
          chooseButton.className = 'looks-bar__choose'
          chooseButton.textContent = busy ? LOOKS_CHOOSING : LOOKS_CHOOSE
          chooseButton.disabled = busy
          chooseButton.addEventListener('click', () => void looks.choose())
          parts.push(chooseButton)
        }
        if (error) {
          const said = document.createElement('p')
          said.className = 'looks-bar__error'
          said.setAttribute('role', 'alert')
          said.textContent = error
          parts.push(said)
        }
        bar.replaceChildren(...parts)
      }
      draw()
      cleanup(looks.onChange(draw))
      return bar
    },
  }
}

/**
 * "Compare looks" — on the draft, while a set is on offer.
 *
 * IT APPEARS ONLY WHILE THERE IS SOMETHING TO COMPARE, so it is never a control
 * the client learns to ignore. With several sets it opens the one for the page
 * on screen, and failing that the first.
 */
export function compareLooksAction(looks, pages) {
  return {
    id: 'compare-looks',
    create({ subscribe, cleanup }) {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'builder-toolbar__looks'
      button.textContent = LOOKS_COMPARE
      let target = null
      const sync = () => {
        const sets = looks.sets()
        const here = pages.list().find((row) => row.slug === pages.current())
        target = sets.find((s) => s.of === here?.id) ?? sets[0] ?? null
        button.hidden = target === null
        button.title = target ? LOOKS_COMPARE_TITLE(target.count) : ''
      }
      sync()
      cleanup(pages.onRefreshed(sync))
      subscribe('src', sync)
      button.addEventListener('click', () => {
        if (target) void looks.open(target.set)
      })
      return button
    },
  }
}
