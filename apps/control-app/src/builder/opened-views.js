/**
 * Which panes the client has ever opened, per business ([[BUG-246]]).
 *
 * WHY IT EXISTS. A client who has never opened Story does not know the preview
 * can show it, and "on the story board" means nothing to them until they are
 * told where it lives. The consultant is told which panes are still unopened, so
 * the first link to one comes with a line on where to find it.
 *
 * REMEMBERED PER BUSINESS, in the builder's own storage: opening Story for one
 * business teaches the client nothing about whether a second business's board
 * has anything on it, and the consultant of each is told separately. A pane
 * counts as opened whoever opened it — a pane the host put in front of the
 * client (Story, before the first draft) has been seen.
 */
import { CLIENT_PANES } from './client-pane.js'

/**
 * @param {object} [options]
 * @param {Storage} [options.storage] where the record is kept; absent, for the page's life
 */
export function createOpenedViews({ storage = null } = {}) {
  const memory = new Map()

  function read(site) {
    const raw = storage ? storage.getItem(site) : memory.get(site)
    try {
      const list = JSON.parse(raw ?? '[]')
      return new Set(Array.isArray(list) ? list.filter((p) => CLIENT_PANES.includes(p)) : [])
    } catch {
      return new Set()
    }
  }

  return {
    /** Record that the client has `pane` open on `site`. */
    opened(site, pane) {
      if (!site || !CLIENT_PANES.includes(pane)) return
      const seen = read(site)
      if (seen.has(pane)) return
      seen.add(pane)
      const value = JSON.stringify([...seen])
      if (storage) storage.setItem(site, value)
      else memory.set(site, value)
    },
    /** The panes in `offered` the client has never opened on `site`, in toggle order. */
    unopened(site, offered) {
      const seen = read(site)
      return CLIENT_PANES.filter((p) => offered.includes(p) && !seen.has(p))
    },
  }
}
