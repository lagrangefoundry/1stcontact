/**
 * Alternative looks for a page, compared in the preview ([[REQ-391]], [[BUG-205]]).
 *
 * WHAT IT REPLACES. A "look" used to be an ordinary page the consultant named
 * `/workwear` and nobody linked to, so the client found it — if at all — in the
 * page dropdown among the real pages, marked with a word that told them nothing.
 * A look is now a page carrying an `alternative` block (whose look it is, the
 * set it belongs to, what the client calls it), and this is where the client
 * meets a set: a band across the top of the preview, **‹ Current · 1 of 3 ›**
 * on its left and what the shown look is, in full, on its right ([[REQ-402]]).
 *
 * A BAND OF ITS OWN, AND ONLY WHEN THERE IS A SET ([[REQ-402]]). The carousel
 * sat on the toolbar beside the page selector ([[BUG-205]]), where a look's
 * description had no room and was cut to one line. The band takes the full
 * width of the pane above the page, the page moves down to make room for it,
 * and on a page with no looks it is not there at all — no dimmed control, no
 * reserved height. It comes and goes as the page in the pane changes.
 *
 * NO MODE OF ITS OWN ([[BUG-205]]). The pane stays in whichever of View and
 * Edit it was in, and the band is the one place looks are changed.
 *
 * THE DRAFT IS ONE OF THE LOOKS. Position 1 is the real page as it stands —
 * "Current" — and stepping back to it is just another position, not an exit.
 * The set is a ring: › from the last look is Current again ([[REQ-402]]).
 *
 * LOOKING ONLY. There is no "Choose this one": the client tells the consultant
 * which look they prefer and why, and she chooses with `choose_look` and their
 * words. The band says so, which is the invitation the button used to stand in
 * for.
 *
 * MOVING IS A SWAP, NOT A NAVIGATION. The positions either side of the shown one
 * are loaded behind it in the panel's spare frames, so ‹ and › trade frames,
 * which is instant and can be animated (the panel's `swapDocument`).
 *
 * THE PANE AND THE LISTING ARE THE TRUTH. Where the carousel stands is read off
 * the page the pane is showing, and which looks a set holds off the page index,
 * every time — never copied. So a page chosen in the selector, a link followed
 * in the render or a flip of View/Edit all move the carousel with no telling,
 * and a set that has been chosen from leaves it.
 */
import { previewPageUrl, previewRelPath } from './api.js'
import { carouselNav } from './carousel.js'
import { LOOKS_CURRENT, LOOKS_CURRENT_DESCRIPTION, LOOKS_EDIT_REAL_PAGE, LOOKS_TELL_CONSULTANT } from './config.js'

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
 * The real page a row stands for: itself, or — for a look — the page it is a
 * look at, or `null` when the listing does not hold that page.
 */
export function realPageOf(rows, row) {
  if (!row?.alternative) return row ?? null
  return (rows ?? []).find((r) => r.id === row.alternative.of && !r.alternative) ?? null
}

/**
 * @param {object} options
 * @param {object} options.panel the display panel
 * @param {object} options.pages the page index — `list`, `current`, `keyOf`, `refresh`, `onRefreshed`, `open`
 * @param {() => string} options.draftPath where in the channel the draft was last shown — the carry's path
 */
export function createLooks({ panel, pages, draftPath }) {
  /** The page in the pane as a listing row, or `null`. */
  const shownRow = () => pages.list().find((row) => row.slug === pages.current()) ?? null

  /**
   * Where the carousel stands: the real page and its looks (`members`, Current
   * first), the position of the page in the pane among them, and the look shown
   * if it is one. `members` is empty when the page has no looks on offer.
   */
  function position() {
    const rows = pages.list()
    const here = shownRow()
    const real = realPageOf(rows, here)
    const look = here?.alternative ? here : null
    const set = real ? [...liveSets(rows).values()].find((looks) => looks[0].alternative.of === real.id) : null
    const members = set ? [real, ...set] : []
    return { members, index: members.indexOf(here), look, real }
  }

  /**
   * The address of a member in the pane's own channel. Current is the draft
   * path the carry holds when that names the real page, so going back is to
   * the frame the client left — with its scroll and open panels — and not a
   * second rendering of the same page under another name.
   */
  function urlOf(row, real) {
    const back = draftPath()
    const rel = row === real && pages.keyOf(back) === real.slug ? back : row.slug
    return previewPageUrl(panel.getSrc(), rel)
  }

  /** Load the positions either side of the shown one behind it. */
  function preloadNeighbours() {
    const { members, index, real } = position()
    if (index < 0 || members.length < 2 || !panel.getSrc()) return
    panel.preload([members[index - 1], members[index + 1]].filter(Boolean).map((row) => urlOf(row, real)))
  }

  /**
   * The pane is on a look that is no longer on offer — the consultant chose
   * from its set: back to the page it was a look at, to see the choice there.
   */
  function leaveRetiredLook() {
    const { look, index, real } = position()
    if (look && index < 0 && real) pages.open(real.slug)
  }

  panel.on('document', preloadNeighbours)
  pages.onRefreshed(() => {
    leaveRetiredLook()
    preloadNeighbours()
  })

  const api = {
    /** What the bar draws. */
    state: position,

    /** Told whenever the listing is re-taken. Returns the unsubscribe. */
    onRefreshed: (cb) => pages.onRefreshed(cb),

    /**
     * Whether the document in the pane is a look rather than a page of the
     * draft. The LIVE DOCUMENT FIRST, as the page index reads it, because this
     * is asked about the document that is about to be replaced.
     */
    showingLook() {
      let rel = null
      try {
        rel = previewRelPath(panel.frame?.contentWindow?.location?.pathname ?? '')
      } catch {
        /* a document that cannot be reached is answered from the index */
      }
      const slug = rel === null ? pages.current() : pages.keyOf(rel)
      return Boolean(pages.list().find((row) => row.slug === slug)?.alternative)
    },

    /**
     * Move to the member at `to`, animated from the side it is on — or from
     * `direction`, which a step round the end of the ring needs.
     */
    move(to, direction = null) {
      const { members, index, real } = position()
      if (index < 0 || to === index || to < 0 || to >= members.length) return
      panel.swapDocument(urlOf(members[to], real), direction ?? (to > index ? 'next' : 'previous'))
      preloadNeighbours()
    },

    /**
     * Show a set's look — from a link the consultant posted. `look` picks which
     * one; the set's first otherwise. A set the listing does not hold yet (the
     * consultant made it a moment ago) is looked for again once before the call
     * gives up. [[REQ-413]] — and so is a named look; one that is no longer on
     * offer answers false rather than showing another in its place.
     */
    async open(set, look = null) {
      const find = (rows) => (look ? rows?.find((row) => row.id === look || row.slug === look) : rows?.[0])
      if (!find(liveSets(pages.list()).get(set))) await pages.refresh()
      const target = find(liveSets(pages.list()).get(set))
      if (!target || !panel.getSrc()) return false
      const { members, index } = position()
      const at = members.indexOf(target)
      if (index >= 0 && at >= 0) {
        api.move(at)
      } else {
        panel.swapDocument(previewPageUrl(panel.getSrc(), target.slug), 'next')
        preloadNeighbours()
      }
      return true
    },
  }
  return api
}

/**
 * The band across the top of the preview ([[REQ-402]]): `‹ label · n of N ›` on
 * the left, and on the right — taking the rest of the width — what the shown
 * position is, in full and wrapped, with the invitation to say which and why.
 *
 * IT IS PUT IN AND TAKEN OUT, NOT HIDDEN. `area` is the preview's column, and
 * the band is inserted before the pane only while the page in it has looks, so
 * a page with none has no band element at all. The pane itself is never moved:
 * re-parenting an iframe reloads it.
 *
 * ONLY WHERE A PAGE OF THE DRAFT IS SHOWN. `modes` names the panel's modes the
 * band belongs to; another (Story, Comparisons) has nothing to do with looks.
 *
 * EDIT IS FOR THE REAL PAGE. A look shown in Edit is shown, not edited, and the
 * band says so in one line.
 *
 * @param {object} options
 * @param {ReturnType<typeof createLooks>} options.looks
 * @param {object} options.panel the display panel
 * @param {HTMLElement} options.area the element holding `panel.element`
 * @param {string[]} options.modes the panel modes that show a page of the draft
 * @returns {{ element: HTMLElement, destroy: () => void }}
 */
export function mountLooksBand({ looks, panel, area, modes }) {
  const band = document.createElement('section')
  band.className = 'looks-band'
  band.setAttribute('aria-label', 'Looks')
  const line = (className, text, role) => {
    const p = document.createElement('p')
    p.className = className
    if (role) p.setAttribute('role', role)
    p.textContent = text
    return p
  }

  const draw = () => {
    const { members, index, look } = looks.state()
    const shown = members.length > 1 && index >= 0 && modes.includes(panel.getMode())
    if (!shown) {
      band.remove()
      return
    }
    const about = document.createElement('div')
    about.className = 'looks-band__about'
    about.append(
      line('looks-band__description', look ? (look.alternative.description ?? '') : LOOKS_CURRENT_DESCRIPTION),
      line('looks-band__invite', LOOKS_TELL_CONSULTANT),
    )
    if (look && panel.getMode() === 'edit') about.append(line('looks-band__note', LOOKS_EDIT_REAL_PAGE, 'status'))
    band.replaceChildren(
      carouselNav({
        label: look ? look.alternative.label : LOOKS_CURRENT,
        index,
        count: members.length,
        wrap: true,
        onMove: (to, direction) => looks.move(to, direction),
      }),
      about,
    )
    if (band.parentNode !== area) area.insertBefore(band, panel.element)
  }

  const off = [looks.onRefreshed(draw), ...['src', 'document', 'mode'].map((event) => panel.on(event, draw))]
  draw()
  return {
    element: band,
    destroy() {
      for (const unsubscribe of off) unsubscribe()
      band.remove()
    },
  }
}
