/**
 * The builder's naming and namespace constants — every user-visible name that
 * code addresses lives here exactly once.
 *
 * The distinction that matters (REQ-115, DOC-28 §12 T1): a tab's **id** is
 * stable and is what code addresses — `shell.getPanel(SITE_TAB.id)`, mode
 * routing, persistence keys. Its **label** is provisional and must be a
 * one-line edit to change, so it is declared here and referenced from here.
 * A label string must never appear as a literal anywhere else in the repo.
 */

/** Storage namespace for every `shell.storage(...)` handle (DOC-8 §9.2). */
export const APP_ID = '1c-builder'

/**
 * The application typeface (REQ-121).
 *
 * ONE DEFINITION, APPLIED ONCE, at the shell root — everything in the chrome is
 * `font: inherit`, so this single value decides the whole builder. It is set
 * through the shell's `font` design token (upstream REQ-68) rather than by
 * out-specifying `.shell` from `builder.css`: the token is the component's own
 * extension point, and an override would be invisible to it and free to break
 * silently when upstream refactors the selector.
 *
 * It is deliberately NOT part of a theme. Themes swap palettes — colour is the
 * half that varies between light and dark; the typeface is the half that does
 * not, and binding it to a theme would mean re-declaring it in every future one.
 *
 * The faces are self-hosted and declared in `builder.css`; the fallbacks are
 * what renders for the moment before they load and on the machine where they
 * 404.
 */
export const APP_FONT = "'IBM Plex Sans', system-ui, -apple-system, sans-serif"

/**
 * The site tab. `id` is the stable address; `label` is provisional chrome.
 *
 * `fill` is the shell's own opt-in for a VIEWPORT-HEIGHT panel instead of a
 * content-height one. It is not cosmetic: `.shell` ships `min-height: 100%` and
 * no height, so without it every `flex: 1` beneath — the split, and therefore
 * the preview frame — resolves against CONTENT and collapses to a few lines.
 * This tab hosts an app-shaped thing (a split with an iframe in it), which is
 * precisely the case `fill` exists for, and it is the reason the height chain
 * below is allowed to be pure `flex`. Upstream's affordance, not an override:
 * the alternative is reaching into three of the shell's internal elements.
 */
export const SITE_TAB = { id: 'site', label: 'Site', fill: true }

/** Every tab the shell mounts, in order. One today; the list is the seam. */
export const TABS = [SITE_TAB]

/** Per-instance persistence keys, namespaced by the shell under `APP_ID`. */
export const STORAGE_KEYS = {
  split: `${SITE_TAB.id}:split`,
  panel: `${SITE_TAB.id}:panel`,
  chat: `${SITE_TAB.id}:chat`,
}
