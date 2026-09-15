import { previewPageUrl, previewRelPath } from './api.js'

/**
 * **Which pages this site has, and which one the pane is showing** ([[REQ-248]]).
 *
 * THE PROBLEM IT NAMES. A page is reached by clicking a link to it, so a page
 * nothing links to cannot be opened at all — not hidden, not awkward,
 * unreachable. The operator can see it in no list and click it from nowhere.
 * This is the answer to both halves of that: every page the site has, and a mark
 * on the ones a reader could never arrive at.
 *
 * WHY IT IS A MODULE AND NOT A CLOSURE IN THE TOOLBAR ACTION. The strip throws
 * its controls away on every mode and site change, so a list held in the
 * action's closure would be re-fetched on every flip of the View/Edit toggle and
 * the control would redraw empty each time. This outlives the control, exactly
 * as the Marked Points controller does and for the same reason.
 *
 * IT DECIDES NOTHING ABOUT CHANNELS. `open` rewrites the page within whatever
 * URL the pane is already showing, so it never learns which business, which site
 * or which channel that is — which is what keeps "choose a page" orthogonal to
 * View/Edit rather than a second thing that could disagree with it.
 */
export function createPageIndex(options) {
  const { panel, getSite, list } = options

  /** The site `rows` belongs to; another site's pages are not this site's. */
  let site = null
  let rows = []
  /**
   * The page the pane was last TOLD to show, until a document arrives.
   *
   * THE PANE SAYS WHERE IT IS GOING; THE DOCUMENT SAYS WHERE IT IS. Navigation
   * is not instant: for as long as it takes, the frame is still holding the page
   * being left, so a control that read only the document would answer the
   * chooser's own choice with the page they just chose to leave, and correct
   * itself a moment later. That flicker is the control contradicting the
   * operator, which is exactly what it exists not to do.
   *
   * Cleared by {@link arrived}, which the chrome calls on the pane's own
   * announcement that a document is there — so the document takes the answer
   * back the instant there is one to take it with.
   */
  let pending = null

  /**
   * The path within the channel the pane is showing.
   *
   * THE LIVE DOCUMENT FIRST, because it is the only thing that knows where the
   * reader actually is: following a link inside the render moves the document
   * and nothing else, so a control reading the URL the pane was ASKED for would
   * go on naming the page they left.
   *
   * THE PANE'S OWN `src` SECOND, for the document that cannot be read — one that
   * has not loaded yet, or is momentarily between documents. That is the URL the
   * pane last resolved, which is the right answer whenever there is no document
   * to disagree with it.
   */
  function relOf() {
    try {
      const live = previewRelPath(panel.frame?.contentWindow?.location?.pathname ?? '')
      if (live !== null) return live
    } catch {
      /* a document we cannot reach is one there is nothing to read */
    }
    return previewRelPath(panel.getSrc() ?? '') ?? ''
  }

  /**
   * The page a path within the channel names.
   *
   * It normalises the way the renderer resolves: a directory request and
   * `index.html` are both the home page's alias, and an extensionless path is
   * the sibling `.html` (REQ-113). So `/`, `index.html`, `about` and
   * `about.html?v=2` all answer the page they actually serve.
   */
  function pageKey(rel) {
    let bare = String(rel ?? '').split(/[?#]/)[0].replace(/^\/+/, '').replace(/\.html$/i, '')
    try {
      bare = decodeURIComponent(bare)
    } catch {
      /* a path the browser wrote is already valid; anything else stands as-is */
    }
    if (bare !== '' && bare !== 'index') return bare
    return home()?.slug ?? ''
  }

  /**
   * The page the channel root serves — the `home`-slugged one, else the first.
   * The same rule `renderSiteFiles` uses, because two opinions about which page
   * is the front door is two opinions about what `/` names.
   */
  function home() {
    return rows.find((r) => r.slug === 'home') ?? rows[0] ?? null
  }

  const api = {
    /** Every page of the site in scope, in the store's own stable order. */
    list: () => (site === getSite() ? rows : []),

    /**
     * The slug of the page the pane is showing, which is NOT necessarily one
     * this listing holds: a page deleted or renamed since the listing was taken
     * is still what the render in front of the operator is showing, and a
     * control that answered with a page it prefers would be the one thing this
     * must never do — disagree with the render.
     */
    current: () => pending ?? pageKey(relOf()),

    /**
     * A document has arrived: whatever it is, it is now the answer. See
     * {@link pending}.
     */
    arrived() {
      pending = null
    },

    /**
     * Re-take the listing for the site in scope.
     *
     * A FAILURE KEEPS THE LAST ANSWER. The listing is chrome: a blip should
     * leave a control naming a slightly old set of pages, not an empty control
     * implying the site has none.
     */
    async refresh() {
      const forSite = getSite()
      if (!forSite) {
        site = null
        rows = []
        return rows
      }
      try {
        const body = await list(forSite)
        // Another site may have been selected while this was in flight; a
        // listing that arrives for a site nobody is looking at is discarded
        // rather than shown against the wrong one.
        if (getSite() !== forSite) return api.list()
        site = forSite
        rows = Array.isArray(body?.pages) ? body.pages : []
      } catch {
        /* see above — the previous answer stands */
      }
      return api.list()
    },

    /**
     * Show `slug`, by moving the displayed document — which is exactly what
     * following a link inside the render does.
     *
     * NAVIGATING RATHER THAN RE-DERIVING THE PANE. The pane's URL is composed
     * from what the outgoing document held, so asking it to re-derive would
     * compose the page the operator is leaving. Moving the document instead
     * means everything downstream — the carry adopting the new page, the idle
     * channel being re-pointed at it, this control reading it back — happens
     * through the machinery that already handles a reader clicking a link, with
     * nothing here to keep in step.
     *
     * THE MODE IS NOT TOUCHED, which is the whole of AC-3: a page chosen in Edit
     * is shown in Edit, because choosing a page and choosing a channel are two
     * independent questions and this answers only one of them.
     */
    open(slug) {
      const src = panel.getSrc()
      if (!src) return
      pending = slug
      panel.navigateDocument(previewPageUrl(src, slug))
    },
  }

  return api
}
