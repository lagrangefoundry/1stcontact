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

/**
 * The User tab — the people of this business ([[REQ-170]], [[DOC-42]]).
 *
 * `fill` for the reason the other two have it: this hosts a `list-detail`, which
 * is a split, which resolves its height against the panel.
 *
 * THE LABEL IS "Contacts" AND THE TAB IS NOT "Admin". It shows the people of
 * WHICHEVER business is selected — our customers when the 1st Contact business is
 * open, a customer's customers when theirs is. Naming it for the privileged half
 * would encode a platform-only reading in the one string every person sees, which
 * is [[DOC-40]] §2.1 rule 1's failure mode arriving through the tab strip
 * ([[DOC-42]] §2, §7). "Contacts" is business-relative in exactly the way that
 * argument requires, and is the word the product uses for this population.
 *
 * IT LISTS CONTACTS AS WELL AS MEMBERS. A person the business knows and has not
 * invited belongs here — the CRM reads the same rows and the invite is the
 * transition between the two states ([[DOC-42]] §9), so a tab that showed only
 * members would be a second population.
 *
 * THE ID STAYS `people` WHILE THE LABEL CHANGES. It namespaces this tab's
 * persistence keys (`STORAGE_KEYS.people`) and is what `getPanel` mounts
 * against, so renaming it would orphan every operator's saved split position
 * and selection to buy nothing anybody can see.
 */
export const PEOPLE_TAB = { id: 'people', label: 'Contacts', fill: true }

/** Every tab the shell mounts, in order. */
export const TABS = [SITE_TAB, LIBRARY_TAB, PEOPLE_TAB]

/**
 * Per-instance persistence keys, namespaced by the shell under `APP_ID`.
 *
 * `business` is the one key here that is NOT prefixed with a tab id, and the
 * asymmetry is the whole of [[REQ-179]]: every other key belongs to one tab's
 * state, and the selected business belongs to the shell — it applies to every
 * tab, so naming it after one would be a claim about its reach that is wrong in
 * exactly the way the toolbar's site selector was.
 */
export const STORAGE_KEYS = {
  business: 'business',
  split: `${SITE_TAB.id}:split`,
  panel: `${SITE_TAB.id}:panel`,
  chat: `${SITE_TAB.id}:chat`,
  library: `${LIBRARY_TAB.id}:list`,
  people: `${PEOPLE_TAB.id}:list`,
}

/**
 * The shell's two chrome controls ([[REQ-179]]) — labels, declared here for the
 * reason every other label is: provisional chrome, addressed by code, changed in
 * one edit.
 *
 * `BUSINESS_LABEL` is the switcher's accessible name. It is a NOUN rather than
 * an instruction ("Business", not "Choose a business") because the control also
 * renders when there is nothing to choose — one business is the modal case
 * ([[DOC-40]] §2.3) and a prompt over a settled fact reads as an unmade choice.
 *
 * `BUSINESS_LAPSED_SUFFIX` is what a business the account may no longer enter is
 * labelled with. It is SHOWN rather than filtered out: "your grant expired" and
 * "that business is gone" are different facts to the person who owns both, and a
 * list that omits the lapsed one makes them indistinguishable.
 */
export const BUSINESS_LABEL = 'Business'
export const BUSINESS_LAPSED_SUFFIX = ' (access ended)'

/**
 * What the builder says when NOTHING on the account can be entered ([[REQ-179]]
 * reopen, [[DOC-42]] §10.1).
 *
 * THIS STATE USED NOT TO EXIST. An account whose every grant had lapsed was
 * refused at the door, so the person whose problem was a payment met a login
 * failure — and could reach neither the page showing what they were charged nor
 * the button closing their account, which [[DOC-37]] makes an obligation rather
 * than a feature. Membership admits now; entitlement does not. So the session is
 * real, the chrome is live, and the TABS are what is unavailable.
 *
 * IT NAMES THE STATE AND POINTS AT THE ONE THING THAT STILL WORKS. "Nothing
 * loaded" is what a broken deployment looks like too, and a person who cannot
 * tell those apart will file the wrong support request — or none. The avatar is
 * named because it is where the account is, and the account is where the remedy
 * is once [[REQ-183]] renders it.
 *
 * WHY EACH BUSINESS LAPSED IS NOT HERE. That is per business and belongs beside
 * the business it is about — the account surface has a row each and says it
 * there ([[REQ-180]] §1). An account with two businesses lapsed for different
 * reasons would force this sentence to pick one and be wrong about the other.
 */
export const BUSINESS_NONE_SELECTABLE_MESSAGE =
  'None of your businesses is open to you at the moment, so there is nothing ' +
  'here to edit. Your account is still yours — open it from the avatar above ' +
  'to see each business and why its access ended.'

/**
 * WHY a business lapsed, in words ([[REQ-180]] §1).
 *
 * THE SUFFIX ABOVE MARKS; THIS EXPLAINS, and the split is where each one can be
 * read. The suffix goes on an `<option>`, which is a label and cannot carry a
 * sentence; the account surface has a row per business and room for one. So the
 * switcher says a business is unavailable and the account surface says why —
 * neither is the other's abbreviation, and the person who wants the reason knows
 * where the reason is.
 *
 * TWO SENTENCES, NOT ONE, because they have different fixes. "Ended" is settled
 * by paying; "withdrawn" is settled by talking to us. A person told only that
 * their access is gone will do neither, which is the failure the whole reason
 * exists to prevent.
 *
 * Keyed by the wire's `reason`, and `lapseSentence` falls back to the bare
 * suffix for a reason this build has never heard of — a Worker ahead of the
 * client it is serving is an ordinary state during a deploy, and an unrecognised
 * key must degrade to less information rather than to `undefined` on screen.
 */
export const BUSINESS_LAPSE_SENTENCES = {
  expired: 'Access ended.',
  revoked: 'Access was withdrawn.',
  not_yet: 'Access has not started yet.',
  never_granted: 'No access has been granted.',
}

/** What an `expired` lapse says when the wire carried the date it ended. */
export const BUSINESS_LAPSE_EXPIRED_ON = (date) => `Access ended on ${date}.`

/**
 * The account surface, behind the avatar and DELIBERATELY NOT A TAB.
 *
 * It is the one surface in this product that is not business-scoped
 * ([[DOC-40]] §2), so a tab for it would be the single place where the shell's
 * switcher is present and silently does not apply — and a control that is
 * present and ignored reads as a bug. The tab strip stays uniformly
 * business-scoped, with no exception to explain.
 *
 * `ACCOUNT_ACTION_ID` is the shell action's stable id, which is what code
 * addresses; the label and the fallback initial are chrome. The avatar itself is
 * derived from the account (its first letter), so it identifies WHOSE account
 * this is rather than merely marking where the account lives — which matters the
 * moment an operator has two browser profiles open.
 */
export const ACCOUNT_ACTION_ID = 'account'
export const ACCOUNT_LABEL = 'Account'
export const ACCOUNT_INITIAL_FALLBACK = '?'

/**
 * The one thing the account dialog links OUT to ([[REQ-183]]).
 *
 * THE DIALOG LINKS; IT DOES NOT GROW. The surface showing an account its plan,
 * its charges and its details is the customer portal of the 1st Contact SITE,
 * rendered through the site pipeline by the code that will render the portal our
 * customers give their own customers ([[DOC-40]] §2.1). Building any of it in
 * this dialog would be §2.1 rule 1's named failure mode — the bespoke admin
 * billing page — and would guarantee the portal gets built a second time by
 * someone reverse-engineering what this one decided. So the dialog's bound is
 * unchanged: facts about the session, and a way out to the surface that is not
 * one.
 *
 * A NEW TAB, because the portal is a site page rather than a builder surface.
 * Leaving the builder should look like leaving it, and the builder's state
 * should still be there on the way back.
 *
 * THE PATH IS THE ORIGIN'S, and the origin is the provisional half of that
 * design — the pages are not ([[REQ-183]] D1). When the credential layer is ours
 * this is a different href and nothing else changes.
 */
export const PORTAL_HREF = '/account'
export const PORTAL_LINK_LABEL = 'Open your account portal'
export const PORTAL_LINK_HINT =
  'Your details and what closing your account means. Opens in a new tab.'

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
