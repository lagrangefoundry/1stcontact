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

/**
 * The Library — everything the client has given us (REQ-161, DOC-38 §6).
 *
 * `fill` for the same reason the site tab has it: this hosts a `list-detail`,
 * which is a split, which resolves its height against the panel. Without it the
 * list collapses to the height of its rows and the detail pane to nothing.
 *
 * BESIDE the site tab and not inside it. The Library is TENANT-wide while the
 * site tab is about one site (DOC-38 §7.7, DOC-10 §4.1) — a client's second site
 * should not start as cold as their first — so nesting it under a site would
 * make a scope claim the data does not have.
 */
export const LIBRARY_TAB = { id: 'library', label: 'Library', fill: true }

/** Every tab the shell mounts, in order. */
export const TABS = [SITE_TAB, LIBRARY_TAB]

/** Per-instance persistence keys, namespaced by the shell under `APP_ID`. */
export const STORAGE_KEYS = {
  split: `${SITE_TAB.id}:split`,
  panel: `${SITE_TAB.id}:panel`,
  chat: `${SITE_TAB.id}:chat`,
  library: `${LIBRARY_TAB.id}:list`,
}

/**
 * The two drop areas of the upload overlay — REQ-161, and the only question this
 * product ever asks about a file.
 *
 * ROLES, NOT FILE TYPES, and the reason is the whole of the ticket. Sorting by
 * type asks the client for something the system already knows (a `.pdf` is a
 * document, a `.woff2` is a font) while leaving unasked the one thing it cannot
 * infer: what the file is FOR. A JPEG may be a hero photograph destined for the
 * site or a screenshot of a competitor the assistant should look at and must
 * never publish — identical bytes, identical content type, opposite rights.
 *
 * THE SECOND SUB-LINE IS LOAD-BEARING, not decoration. A client uploading their
 * positioning document wants to know it stays private, and the moment they are
 * deciding where to drop it is the moment to say so (DOC-35's register: plain,
 * reassuring, no jargon). REQ-176 shortened `label` to `Background information`,
 * which puts MORE of that reassurance on the hint, not less — so the hints are
 * unchanged and the second one stays exactly as load-bearing as it was.
 *
 * `id` is the wire value the ingestion route validates against — `site` and
 * `reference` are what the route matches on and do not move when the copy does;
 * the copy is provisional and lives here for the same reason every other label
 * does. The Library's role pill and role filter derive from these labels rather
 * than restating them (`ROLE_LABEL` in `library.js`), so the overlay and the
 * list cannot come to describe the same file differently.
 */
export const UPLOAD_PROMPT = 'Purpose'

export const UPLOAD_AREAS = [
  {
    id: 'site',
    label: 'Site asset',
    hint: 'Photos, logos, fonts. Things your visitors will see.',
    icon: '🖼',
  },
  {
    id: 'reference',
    label: 'Background information',
    hint: "Brand guidelines, notes, reports. I'll use these to understand your business; they won't appear on your site.",
    icon: '📄',
  },
]
