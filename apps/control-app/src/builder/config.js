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

/** The site tab. `id` is the stable address; `label` is provisional chrome. */
export const SITE_TAB = { id: 'site', label: 'Site' }

/** Every tab the shell mounts, in order. One today; the list is the seam. */
export const TABS = [SITE_TAB]

/** Per-instance persistence keys, namespaced by the shell under `APP_ID`. */
export const STORAGE_KEYS = {
  split: `${SITE_TAB.id}:split`,
  panel: `${SITE_TAB.id}:panel`,
}
