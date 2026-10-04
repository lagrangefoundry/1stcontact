/**
 * The preview's width ([[REQ-388]]) — which width the draft is shown at, and the
 * one place that answers "which width is the client looking at".
 *
 * WHY IT EXISTS. The pane used to show the draft at whatever width the divider
 * and the window happened to leave it — often between two of the site's layouts,
 * and able to cross a breakpoint as the client resized — and nothing told the
 * assistant what that was. A client describing a layout they see at 812px could
 * be answered from a desktop picture. This holds the choice, applies it to the
 * pane, and reports it with every prompt, so the two of them are always talking
 * about the same layout.
 *
 * IT OUTLIVES THE CONTROL. The toolbar throws its controls away on every mode and
 * site change, so the choice cannot live in a button's closure — the same reason
 * Marked Points' controller is held outside the strip. The control reads and
 * drives this; the chat reads {@link report} from it.
 *
 * THE WIDTHS ARE THE PAGE'S OWN LADDER, taken from the page listing the page
 * selector already holds — see `view-width.js` for the rule. A page with no
 * ladder yet is shown at the nominal width.
 *
 * REMEMBERED PER USER, in the builder's own storage, like the divider's position:
 * it is how this person likes to look at drafts, not a property of the site.
 */
import { presetWidth, VIEW_MODES } from './view-width.js'

const DEFAULT_MODE = 'fit'

/**
 * @param {object} options
 * @param {object} options.panel the display panel — `setViewport`, `viewport`, `on`
 * @param {object} [options.pages] the page index — `list`, `current`, `onRefreshed`
 * @param {Storage} [options.storage] where the choice is remembered
 */
export function createPreviewWidth({ panel, pages = null, storage = null }) {
  const saved = storage?.getItem('mode')
  let mode = VIEW_MODES.includes(saved) ? saved : DEFAULT_MODE
  const listeners = []

  /**
   * The ladder of the page on screen, or of the whole site while that page is not
   * in the listing yet. A listing that has not arrived is an empty ladder, which
   * renders at the nominal width until it does.
   */
  function ladder() {
    const rows = pages?.list() ?? []
    const here = pages?.current() ?? ''
    const row = rows.find((r) => r.slug === here)
    if (Array.isArray(row?.widths) && row.widths.length > 0) return row.widths
    return [...new Set(rows.flatMap((r) => (Array.isArray(r.widths) ? r.widths : [])))]
  }

  /** The layout width a setting renders at on this page, or `null` for Fit pane. */
  const widthOf = (m) => presetWidth(m, ladder())

  function apply() {
    panel.setViewport(widthOf(mode))
    for (const cb of listeners.slice()) cb(mode)
  }

  // The ladder can move under an unchanged choice: a different page, or a listing
  // that has just arrived. Subscribed for the panel's lifetime, like the index.
  panel.on('src', apply)
  pages?.onRefreshed(apply)
  apply()

  return {
    /** The current setting. */
    mode: () => mode,
    /** Choose a setting, remember it, and re-lay the pane out. */
    set(next) {
      if (!VIEW_MODES.includes(next)) return
      mode = next
      storage?.setItem('mode', next)
      apply()
    },
    widthOf,
    /**
     * What goes with a prompt: the width the draft is laid out at, how much of it
     * is visible, and which setting produced it. `null` before the pane has any
     * size at all, which is a pane nobody is looking at.
     */
    report() {
      const { width, height } = panel.viewport()
      if (!(width > 0)) return null
      return { width: Math.round(width), ...(height > 0 ? { height } : {}), mode }
    },
    /** Told whenever the setting or its width may have changed. Returns the unsubscribe. */
    onChange(cb) {
      listeners.push(cb)
      return () => {
        const i = listeners.indexOf(cb)
        if (i >= 0) listeners.splice(i, 1)
      }
    },
  }
}
