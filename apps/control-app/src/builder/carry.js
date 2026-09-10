import { previewRelPath } from './api.js'

/**
 * **What the pane is showing, carried across a channel switch** ([[REQ-215]]).
 *
 * The two channels are two renders of one page, and the operator experiences
 * them as one page with a toggle. Everything the reader's own interaction
 * produced lives in the document, and swapping the frame's `src` destroys the
 * document — so this is the thing that holds it in between.
 *
 * WHY IT IS A MODULE AND NOT FOUR VARIABLES IN `app.js`. The rule it implements
 * has three separate cases (a channel switch, a reload after a save, a change of
 * site), and they are exactly the cases that are awkward to reach through an
 * iframe in a suite. Holding them here makes them a function of a window and a
 * site rather than of the builder being open.
 *
 * THE PAGE STATE ITSELF IS THE FRAMEWORK'S, injected rather than imported: the
 * builder runs `packages/framework`'s own `page-state`, so what "open" means
 * here is what it means to the renderer that wrote the markers, not a second
 * opinion. The host supplies it for the same reason it supplies the edit bridge
 * — those modules are fetched from the origin by absolute URL, which only a
 * browser can resolve.
 */
export function createPageCarry(options = {}) {
  const pageState = options.pageState ?? null

  /**
   * The site the carried state BELONGS TO.
   *
   * Another site's page is not this page in another state, so the site is part
   * of the carried value rather than a thing the caller has to remember to
   * clear. `pathFor` answers for a site and declines for any other, and `adopt`
   * discards the state outright — which makes a stale carry impossible rather
   * than merely unlikely:
   * the panel re-derives its `src` DURING `setSite`, when the
   * site has already moved and the document has not.
   */
  let site = null
  let rel = ''
  let state = initial()

  function initial() {
    return { dialogs: [], scrollY: 0 }
  }

  /** Where in the channel this window is, or `null` if it is not a preview. */
  function relOf(win) {
    try {
      return previewRelPath(win?.location?.pathname ?? '')
    } catch {
      // A frame that has not loaded anything yet, or is momentarily between
      // documents. Nothing to take; the next `adopt` takes it.
      return null
    }
  }

  const api = {
    /** The path within the channel the pane should open for this site. */
    pathFor: (forSite) => (forSite === site ? rel : ''),

    /**
     * Take what this document holds, because it is about to be replaced.
     *
     * Called on every re-derivation of the pane, including the ones that turn
     * out to change nothing: reading a document is cheap, and the alternative is
     * predicting which refreshes navigate — which is the panel's business and
     * would put a copy of it here.
     */
    capture(win) {
      const at = relOf(win)
      if (at === null) return
      rel = at
      if (pageState) {
        try {
          state = pageState.readL1PageState(win)
        } catch {
          /* a document that cannot be read holds no state worth guessing at */
        }
      }
    },

    /**
     * The document that has just arrived: note where it is, and put it into the
     * carried state.
     *
     * A DIFFERENT PAGE DISCARDS THE STATE, and so does a different site. The
     * carry answers "the same page in the same state" and nothing wider: a
     * reader who followed a link out of an open panel has gone somewhere else,
     * and arriving there with that panel re-opened over them — or halfway down a
     * page they have not read — would be the carry acting on a page it was never
     * about. A channel switch and the reload after a save both keep the same
     * path, which is exactly when it should survive.
     */
    adopt(win, forSite) {
      const at = relOf(win)
      if (forSite !== site || (at !== null && at !== rel)) state = initial()
      site = forSite
      if (at !== null) rel = at
      api.apply(win)
    },

    /** Put a loaded document into the carried state, without reloading it. */
    apply(win) {
      if (!pageState || !win) return
      try {
        pageState.applyL1PageState(win, state)
      } catch {
        /* the document went away between the load event and this call */
      }
    },

    /**
     * Which panel is showing — the chrome's half.
     *
     * The carried value is a LIST because a page may have several panels open at
     * once, but the control that sets it offers one at a time (see the panel
     * selector): choosing an arrangement of overlapping modals is not something
     * an operator wants to do, and reproducing one faithfully is not something
     * they asked for.
     */
    openDialog: () => state.dialogs[0] ?? '',
    setOpenDialog(id) {
      state = { ...state, dialogs: id ? [id] : [] }
    },

    /** The panels this document declares, for chrome offering a choice. */
    listDialogs(doc) {
      if (!pageState || !doc) return []
      try {
        return pageState.listL1Dialogs(doc)
      } catch {
        return []
      }
    },
  }

  return api
}
