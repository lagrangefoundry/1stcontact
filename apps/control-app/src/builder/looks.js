/**
 * Alternative looks for a page, compared in the preview ([[REQ-391]], [[BUG-250]]).
 *
 * WHAT IT REPLACES. A "look" used to be an ordinary page the consultant named
 * `/workwear` and nobody linked to, so the client found it — if at all — in the
 * page dropdown among the real pages, marked with a word that told them nothing.
 * A look is now a page carrying an `alternative` block (whose look it is, the
 * set it belongs to, what the client calls it), and this is where the client
 * meets a set.
 *
 * A MODE OF ITS OWN ([[BUG-250]], reversing [[BUG-205]]'s "no separate mode").
 * Beside View, Edit, Story and Comparisons the looks are the pane's fifth mode,
 * **Looks**, offered on the toggle only while the page shown has looks on offer
 * and gone again once one is chosen or they are cleared. It shows only the
 * looks: the draft is not one of them, and Edit and Colours — which act on the
 * draft — are not on its toolbar.
 *
 * THE BAND ([[REQ-402]]) is Looks mode's: `‹ Name · n of N ›` on its left and
 * what the shown look is, in full, on its right, with the invitation to tell the
 * consultant which and why, and a link back to the page as it stands —
 * "Compare with your current page" — which is View on the real page. The Looks
 * tab brings the client back to the look they left.
 *
 * LOOKING ONLY. There is no "Choose this one": the client tells the consultant
 * which look they prefer and why, and the consultant chooses with `choose_look`
 * and their words — or records that they are keeping the page they have.
 *
 * MOVING IS A SWAP, NOT A NAVIGATION. The looks either side of the shown one are
 * loaded behind it in the panel's spare frames, so ‹ and › trade frames, which
 * is instant and can be animated (the panel's `swapDocument`).
 *
 * THE PANE AND THE LISTING ARE THE TRUTH. Which look is shown is read off the
 * page the pane is showing, and which looks a set holds off the page index,
 * every time — never copied. The one thing held here is which look the client
 * was last on, so the Looks tab returns them to it.
 */
import { previewPageUrl, previewRelPath, previewUrl } from './api.js'
import { carouselNav } from './carousel.js'
import { LOOKS_COMPARE, LOOKS_TELL_CONSULTANT } from './config.js'

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

/** The panel mode the looks are shown in ([[BUG-250]]). */
export const LOOKS_MODE = 'looks'

/**
 * @param {object} options
 * @param {object} options.panel the display panel
 * @param {object} options.pages the page index — `list`, `current`, `keyOf`, `refresh`, `onRefreshed`, `open`
 */
export function createLooks({ panel, pages }) {
  const inLooks = () => panel.getMode() === LOOKS_MODE
  const rowOf = (slug) => pages.list().find((row) => row.slug === slug) ?? null
  /** The page in the pane as a listing row, or `null`. */
  const shownRow = () => rowOf(pages.current())
  /** The looks on offer for `real`, in the set's order — empty when it has none. */
  const looksOf = (real) =>
    real ? ([...liveSets(pages.list()).values()].find((set) => set[0].alternative.of === real.id) ?? []) : []
  /** Whether `slug` is a look still on offer. */
  const live = (slug) => [...liveSets(pages.list()).values()].some((set) => set.some((row) => row.slug === slug))

  /**
   * The look the client was last on — what the Looks tab returns to. Forgotten
   * when the pane shows a page of the draft it is not a look at, so the tab on
   * another page with looks opens that page's first.
   */
  let last = null

  /**
   * Where the pane stands: the real page shown (or the one the shown look is a
   * look at), its looks on offer, and — in Looks mode — the look shown and its
   * position among them.
   */
  function position() {
    const here = shownRow()
    const real = realPageOf(pages.list(), here)
    const members = looksOf(real)
    const look = inLooks() && here?.alternative ? here : null
    return { members, index: look ? members.indexOf(look) : -1, look, real }
  }

  /** A look's address in the pane's own channel. */
  const urlOf = (row) => previewPageUrl(panel.getSrc(), row.slug)

  /** Load the looks either side of the shown one behind it. */
  function preloadNeighbours() {
    const { members, index } = position()
    if (index < 0 || members.length < 2 || !panel.getSrc()) return
    const n = members.length
    panel.preload([...new Set([members[(index + n - 1) % n], members[(index + 1) % n]])].map(urlOf))
  }

  /** The draft's page `real` in View — "Compare with your current page", and where a chosen set leaves the client. */
  function toPage(real) {
    panel.setMode('view')
    if (real && pages.current() !== real.slug) pages.open(real.slug)
  }

  /**
   * Keep the pane honest about what it shows. In Looks mode on something that is
   * not a look on offer — the consultant chose from its set, or the looks were
   * cleared — back to View on the page they were looks at, to see the choice
   * there. Anywhere else, forget a remembered look that is not this page's.
   */
  function follow() {
    if (!inLooks()) {
      if (last && !position().members.some((row) => row.slug === last)) last = null
      return
    }
    const here = shownRow()
    if (!here && pages.list().length === 0) return
    if (here && live(here.slug)) {
      last = here.slug
      return
    }
    toPage(realPageOf(pages.list(), here))
  }

  panel.on('document', () => {
    follow()
    if (inLooks()) preloadNeighbours()
  })
  panel.on('site', () => {
    last = null
  })
  pages.onRefreshed(() => {
    follow()
    if (inLooks()) preloadNeighbours()
  })

  const api = {
    /** What the band draws. */
    state: position,

    /** Told whenever the listing is re-taken. Returns the unsubscribe. */
    onRefreshed: (cb) => pages.onRefreshed(cb),

    /** Whether the toggle offers Looks: the page shown has looks on offer. */
    offered: () => inLooks() || position().members.length > 0,

    /**
     * The URL Looks mode shows for `site`: the look the client was last on,
     * else the first look of the page shown, else nothing.
     */
    src(site) {
      const slug = last && live(last) ? last : position().members[0]?.slug
      return slug ? previewUrl(site, 'draft', slug) : ''
    },

    /** "Compare with your current page" — View, on the page these are looks at. */
    compare: () => toPage(position().real),

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
      return Boolean(rowOf(slug)?.alternative)
    },

    /**
     * Move to the look at `to`, animated from the side it is on — or from
     * `direction`, which a step round the end of the ring needs.
     */
    move(to, direction = null) {
      const { members, index } = position()
      if (index < 0 || to === index || to < 0 || to >= members.length) return
      last = members[to].slug
      panel.swapDocument(urlOf(members[to]), direction ?? (to > index ? 'next' : 'previous'))
      preloadNeighbours()
    },

    /**
     * Show a set's look in Looks mode — from a link the consultant posted.
     * `look` picks which one; the set's first otherwise. A set the listing does
     * not hold yet (the consultant made it a moment ago) is looked for again
     * once before the call gives up. [[REQ-413]] — and so is a named look; one
     * that is no longer on offer answers false rather than showing another in
     * its place.
     */
    async open(set, look = null) {
      const find = (rows) => (look ? rows?.find((row) => row.id === look || row.slug === look) : rows?.[0])
      if (!find(liveSets(pages.list()).get(set))) await pages.refresh()
      const target = find(liveSets(pages.list()).get(set))
      if (!target) return false
      last = target.slug
      if (!inLooks()) {
        panel.setMode(LOOKS_MODE)
        return true
      }
      const { members, index } = position()
      const at = members.indexOf(target)
      if (index >= 0 && at >= 0) api.move(at)
      else {
        panel.swapDocument(urlOf(target), 'next')
        preloadNeighbours()
      }
      return true
    },
  }
  return api
}

/**
 * The band across the top of the preview in Looks mode ([[REQ-402]],
 * [[BUG-250]]): `‹ Name · n of N ›` on the left, and on the right — taking the
 * rest of the width — what the shown look is, in full and wrapped, with the
 * invitation to say which and why and the link back to the page as it stands.
 *
 * IT IS PUT IN AND TAKEN OUT, NOT HIDDEN. `area` is the preview's column, and
 * the band is inserted before the pane only while Looks mode shows a look, so
 * any other mode has no band element at all. The pane itself is never moved:
 * re-parenting an iframe reloads it.
 *
 * @param {object} options
 * @param {ReturnType<typeof createLooks>} options.looks
 * @param {object} options.panel the display panel
 * @param {HTMLElement} options.area the element holding `panel.element`
 * @returns {{ element: HTMLElement, destroy: () => void }}
 */
export function mountLooksBand({ looks, panel, area }) {
  const band = document.createElement('section')
  band.className = 'looks-band'
  band.setAttribute('aria-label', 'Looks')
  const line = (className, text) => {
    const p = document.createElement('p')
    p.className = className
    p.textContent = text
    return p
  }

  const draw = () => {
    const { members, index, look } = looks.state()
    if (panel.getMode() !== LOOKS_MODE || !look || index < 0) {
      band.remove()
      return
    }
    const compare = document.createElement('button')
    compare.type = 'button'
    compare.className = 'looks-band__compare'
    compare.textContent = LOOKS_COMPARE
    compare.addEventListener('click', () => looks.compare())
    const about = document.createElement('div')
    about.className = 'looks-band__about'
    about.append(line('looks-band__description', look.alternative.description ?? ''), line('looks-band__invite', LOOKS_TELL_CONSULTANT), compare)
    band.replaceChildren(
      carouselNav({
        label: look.alternative.label,
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
