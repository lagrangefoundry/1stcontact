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

/**
 * The Settings tab — the business's own record, and the assistant that keeps it
 * ([[REQ-239]], [[EPIC-4]]).
 *
 * RIGHTMOST, AND THAT IS WHERE SETTINGS BELONG. The three tabs before it are the
 * work; this is the record of who the work is for, opened rarely and mostly once.
 *
 * BUSINESS-SCOPED LIKE THE OTHER THREE, WHICH IS WHY IT MAY BE A TAB AT ALL. The
 * strip is uniformly business-scoped ([[REQ-179]]) and the account surface is kept
 * out of it precisely because the switcher above does not apply to an account —
 * *"a control that is present and ignored reads as a bug"*. A business's name and
 * its public address are properties OF a business, so this needs no exception to
 * that rule and makes none.
 *
 * `fill` for the reason the other three have it: it hosts a split, and a split
 * resolves its height against the panel.
 */
export const SETTINGS_TAB = { id: 'settings', label: 'Settings', fill: true }

/** Every tab the shell mounts, in order. */
export const TABS = [SITE_TAB, LIBRARY_TAB, PEOPLE_TAB, SETTINGS_TAB]

/**
 * The operator console ([[REQ-297]], re-housed by [[REQ-298]]) — a fourth header
 * action, a FULL-SURFACE VIEW, and DELIBERATELY NOT A TAB.
 *
 * THE ACCOUNT SURFACE'S ARGUMENT, APPLIED A SECOND TIME, AND IT SURVIVED THE
 * RE-HOUSING INTACT. The tab strip is uniformly business-scoped ([[REQ-179]]),
 * which is what lets the switcher sit above it with no exception to explain.
 * This console is about EVERY business at once, so a tab for it would be a
 * second place where the switcher is present and silently does not apply — and a
 * control that is present and ignored reads as a bug. [[REQ-298]] replaced the
 * container and left this reasoning where it was: no entry is added to
 * {@link TABS}, and the strip stays what it was.
 *
 * WHAT [[REQ-298]] DID CHANGE is what the action OPENS. A dialog is for a thing
 * you glance at and dismiss; this is a two-panel surface somebody works in, with
 * a divider to drag and a detail pane to scroll, so it takes over the shell's
 * content region the way a tab's panel does — no scrim, nothing of the builder
 * behind it, and Escape does not close it.
 *
 * IT IS RENDERED ON `ownsPlatformBusiness` AND ON NOTHING ELSE ([[DOC-42]] §7).
 * Not on a level, not on a seniority flag, not on `platform_operator` — whose
 * only reader is `scope.ts` and must stay so. A session that does not own the
 * 1st Contact business gets no action, and the routes behind it answer 404 to
 * anyone who types the URL anyway, so the absence is chrome and the refusal is
 * the gate.
 *
 * IT IS DECLARED HERE, ABOVE {@link STORAGE_KEYS}, BECAUSE THAT MAP READS IT.
 * The console's split position is namespaced by this id exactly as each tab's
 * state is namespaced by its own, so the id has to exist before the map that
 * derives a key from it — the same ordering the four tab declarations above are
 * already in.
 */
export const CONSOLE_ACTION_ID = 'console'
export const CONSOLE_LABEL = 'Console'
export const CONSOLE_HINT = 'Operating 1st Contact itself. Not about one business.'

/**
 * Leaving the console ([[REQ-298]]) — the dismissal, as opposed to the navigation.
 *
 * TWO WAYS OUT AND THEY ARE NOT REDUNDANT. Clicking any tab is NAVIGATION: it
 * dismisses the console and takes you to that tab, which is what "behaves like a
 * tab" has to mean at the one seam where it is testable. This is DISMISSAL: it
 * puts back the tab that was live when the console opened, which is the thing a
 * person who opened the console mid-task actually wants and which no tab in the
 * strip can express.
 *
 * AND NEITHER OF THEM IS ESCAPE. A transient overlay owes its reader that
 * reflex; a surface somebody has spent twenty minutes in, with a dragged divider
 * and a scrolled pane, owes them the opposite.
 */
export const CONSOLE_CLOSE_LABEL = 'Close'

/**
 * What the detail pane says when it has no sections ([[REQ-298]]), inheriting
 * [[REQ-297]]'s claim about the console at the seam that still exists.
 *
 * NOT A PLACEHOLDER. The pane composes sections somebody else registered and has
 * no subject of its own; with none registered there is genuinely nothing to
 * show, and saying so is what stops the next hand reading a blank pane as a
 * failure to load and "fixing" it by giving the pane content.
 */
export const CONSOLE_PANE_EMPTY = 'No sections are registered on this pane yet.'

/**
 * The console's own two-panel surface ([[REQ-298]]) — every site on the platform
 * on the left, the selected site's business on the right.
 *
 * ONE ROW PER SITE AND NOT PER BUSINESS, which is what `SITES_TITLE` has to
 * say without a sentence under it. A business with two sites is two rows,
 * because the operator's question starts from something they can see published.
 *
 * `SITES_NONE_SELECTED` IS A STATE AND NOT AN INSTRUCTION. The pane does not
 * pick a row on the operator's behalf: the first row is the dearest tenant, and
 * opening somebody's spending because nothing else was chosen is a decision this
 * surface should not make on its own.
 *
 * `SITE_NO_ADDRESS` IS A SENTENCE WHERE A LINK WOULD BE, never an empty anchor
 * and never a dead one. It is the same fact `POST /api/publish` refuses on with
 * `NO_PUBLIC_ADDRESS`, so what the console says and what the publish says cannot
 * disagree about whether a site is reachable.
 *
 * `BUSINESS_NAME_MISSING` and `ACCOUNT_PLATFORM` are two different absences and
 * are worded as two. A site whose `tenants` row has gone is a row worth
 * noticing; 1st Contact's own site has no owner account because it is nobody's
 * customer, which is not a gap at all. Rendering both as a blank cell would make
 * them indistinguishable to the one person who can act on either.
 */
export const CONSOLE_SITES_TITLE = 'Sites'
export const CONSOLE_SITES_EMPTY = 'No site has been provisioned on this platform yet.'
export const CONSOLE_SITES_NONE_SELECTED = 'Choose a site on the left to see whose it is.'
export const CONSOLE_SITE_NO_ADDRESS =
  'This site has no public address, so there is nowhere to link to. It cannot be published either.'
export const CONSOLE_BUSINESS_NAME_MISSING = 'No business record answers for this site.'
export const CONSOLE_ACCOUNT_PLATFORM = '1st Contact itself — no owner account.'
export const CONSOLE_ACCOUNT_MISSING = 'No account record answers for this business.'
export const CONSOLE_ACCOUNT_UNNAMED = 'Unnamed account'

/** The three sections of the detail pane, in the order they are read. */
export const CONSOLE_SECTION_ACCOUNT = 'Account'
export const CONSOLE_SECTION_ADDRESS = 'Published site'
export const CONSOLE_SECTION_COST = 'Cost'

/** What a section that could not be opened says, in its own block. */
export const CONSOLE_SECTION_FAILED = (message) => `This section could not be opened: ${message}`

/**
 * The labels of the account section's fields, declared here for the reason every
 * other label is: provisional chrome, addressed by code, changed in one edit.
 *
 * THE IDS ARE NOT DERIVED FROM THEM. A `data-field` computed by slugging the
 * label would make renaming a heading silently re-address the element a UAT
 * reads, which is the coupling this whole file exists to prevent.
 */
export const CONSOLE_FIELDS = {
  business: 'Business',
  businessId: 'Business id',
  account: 'Account',
  accountId: 'Account id',
  status: 'Status',
}

/**
 * The two things the console says when a read fails, and WHY THEY ARE TWO.
 *
 * The directory is what this surface cannot do without: without it there are no
 * rows, so its failure empties the list. The meter is an ornament on rows that
 * exist — an operator who came to see what we have published should not be shown
 * nothing because the meter was unavailable — so its failure leaves the list
 * standing, in the route's own order, with no cost beside any row and this
 * sentence saying so.
 */
export const CONSOLE_SITES_UNREADABLE = (message) =>
  `The site list could not be read: ${message}`
export const CONSOLE_METER_UNREADABLE = (message) =>
  `The meter could not be read, so no cost is shown: ${message}`

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
  /**
   * The Settings tab's own two ([[REQ-239]]).
   *
   * A SECOND `:split` AND A SECOND `:chat`, NOT A SHARED ONE. The site tab's
   * split position is where the operator wants the PREVIEW divided; this one is
   * where they want a short form divided from a conversation, and the two have no
   * reason to be the same number. The chat key is the composer's draft storage
   * and is per conversation by the same argument `chat.js` makes: a half-typed
   * message belongs to the conversation it was typed in.
   */
  settingsSplit: `${SETTINGS_TAB.id}:split`,
  settingsChat: `${SETTINGS_TAB.id}:chat`,
  /**
   * The operator console's list/detail ([[REQ-298]]).
   *
   * NAMED FOR THE CONSOLE AND NOT FOR A TAB, which is the one thing that makes
   * it consistent with the rule above rather than an exception to it. Every
   * other key here is prefixed with the id of the tab whose state it holds;
   * `business` is unprefixed because the selected business belongs to the shell.
   * This split position belongs to a surface that is neither — so it is prefixed
   * with the CONSOLE's own stable id, and the prefix is a true claim about
   * whose state it is.
   *
   * IT PERSISTS AT ALL BECAUSE THE VIEW IS ONE SOMEBODY WORKS IN. A divider the
   * operator drags and that resets on the next open would be the whole of why
   * [[REQ-298]] is not a dialog, reproduced inside the thing that replaced it.
   */
  console: `${CONSOLE_ACTION_ID}:list`,
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
 * Ending the session, from the account dialog ([[REQ-204]]).
 *
 * A PATH RATHER THAN A HANDLER, because signing out is a navigation: the Worker
 * ends the row, clears the cookie and answers a 303 to the sign-in page, and
 * letting the browser follow that is what makes the control work when script has
 * failed and leaves no error branch to invent. The dialog posts a real form at
 * it — the same reasoning that makes the portal link an anchor rather than a
 * button.
 *
 * THE LITERAL IS DUPLICATED, AND A UAT PINS IT. `sessions.ts` owns
 * `SIGN_OUT_PATH`; this file is browser JavaScript and cannot import the
 * Worker's TypeScript, so the two are held equal by a test rather than by an
 * import.
 *
 * THE LABEL CLAIMS EXACTLY WHAT HAPPENS AND SO CARRIES NO HINT UNDER IT. What
 * ends is this session, which is the ordinary meaning of the words and the whole
 * of what the endpoint does. The dialog's other outward control has a hint
 * because "your account portal" is a place nobody has been yet; a sentence
 * explaining a Sign out button would be explaining the one control here whose
 * name is already its whole behaviour.
 */
export const SIGN_OUT_HREF = '/sign-out'
export const SIGN_OUT_LABEL = 'Sign out'

/**
 * Signing out of every browser ([[REQ-231]]).
 *
 * THE SAME ENDPOINT, WITH A FIELD — see `sign-in.ts` for why it is not a second
 * path. The field's name is duplicated here for the reason the path above is:
 * this is browser JavaScript and cannot import the Worker's TypeScript, so a
 * UAT holds the two equal.
 *
 * THE LABEL SAYS EVERYWHERE BECAUSE THE HINT CANNOT BE RELIED ON TO BE READ.
 * This control is destructive in a way its neighbour is not — it ends sessions
 * on machines the person is not looking at, and there is no undo but signing in
 * again on each of them — so the words on the button have to carry that on
 * their own.
 *
 * AND THE HINT IS THERE ANYWAY, because the reason to press it is not obvious
 * from the name. It is the answer to a device somebody no longer has, which is
 * the one risk rotation cannot detect, and nobody reaches for a control whose
 * purpose they have to infer.
 */
export const SIGN_OUT_EVERYWHERE_FIELD = 'everywhere'
export const SIGN_OUT_EVERYWHERE_LABEL = 'Sign out everywhere'
export const SIGN_OUT_EVERYWHERE_HINT =
  'Ends this sign-in on every browser and device, including ones you no longer have.'

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

/**
 * What the file picker offers, as an `accept` list ([[REQ-221]]).
 *
 * IT EXISTS BECAUSE THE PICKER ADVERTISED NOTHING. The overlay's input was built
 * with `multiple` and no `accept` at all, so the picker offered every file on
 * the disk and the first thing a client learned about what we take was a refusal
 * after the upload — which is the same experience as dropping a photograph and
 * getting silence, arrived at differently.
 *
 * IT IS A HINT AND NOT A GATE, in both directions, and neither is a defect.
 * A client can always choose *All Files* in the picker, and a drag-and-drop
 * never consults this list at all — so the origin's refusals remain the only
 * real enforcement and stay exactly as load-bearing as they were. What this buys
 * is the ordinary case: the formats we actually read are the ones shown first.
 *
 * HEIC IS ON THE LIST, and it is the entry that makes the list worth writing.
 * We take an iPhone photograph and convert it at the door ([[REQ-221]]), so a
 * picker that greyed it out would refuse a file the product now handles. The two
 * extensions and both HEIF media types are named because the browser's idea of
 * what `.heic` is varies by platform, and an unrecognised token in an `accept`
 * list is ignored rather than fatal.
 *
 * `image/*` IS DELIBERATELY NOT USED. It would resolve to whatever the platform
 * thinks an image is, which on some browsers excludes HEIC and on others admits
 * formats nothing here can read — an advertisement whose content depends on the
 * client's operating system is not an advertisement. Every entry below is a
 * format some step of this pipeline can actually do something with, which is the
 * rule `TYPE_BY_EXTENSION` in `material.ts` already follows.
 */
export const UPLOAD_ACCEPT = [
  // Photographs and pictures, including the one this ticket is about.
  '.heic',
  '.heif',
  'image/heic',
  'image/heif',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.avif',
  '.svg',
  // Documents the describer reads or extracts.
  '.pdf',
  '.md',
  '.markdown',
  '.txt',
  '.csv',
  '.tsv',
  '.html',
  '.json',
  '.xml',
  '.yaml',
  '.yml',
  // Fonts, whose name tables the pipeline parses.
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.ttc',
].join(',')

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

/**
 * The window the console asks for when nobody has said otherwise ([[REQ-297]]).
 *
 * THIRTY DAYS, AND IT LIVES HERE RATHER THAN ON THE ROUTE. `/api/admin/spend`'s
 * contract is [[REQ-293]]'s — both ends optional, absent meaning unbounded,
 * because the meter is retained rather than pruned and *everything this tenant
 * has ever spent* is a question it must still answer. A default on the server
 * would quietly give a different answer to a caller who asked for all of it. So
 * the default is the CONSOLE's opinion about what "lately" means, and it travels
 * in the request.
 *
 * AND IT IS A DEFAULT RATHER THAN A CONSTANT, which is the ticket's own phrase.
 * The control renders the number and re-reads when it changes, so a day-long
 * investigation and a month-long billing question are both askable from the
 * surface — and a calendar month stays expressible on the wire, which takes
 * `from` and `to`, without this control growing a date picker.
 */
export const CONSOLE_PERIOD_DAYS = 30
export const CONSOLE_PERIOD_LABEL = 'Period (days)'

/**
 * The cost section of the console's detail pane ([[REQ-297]]'s figures,
 * [[REQ-298]]'s pane) — its name, and the words its figures use.
 *
 * THE LEAGUE TABLE'S VOCABULARY IS GONE AND THE FIGURES' IS NOT. [[REQ-298]]
 * replaced the console's content: there is no longer a sorted table of every
 * tenant with a row that expands, so the four column headings, the empty-table
 * sentence and the control's hint had nothing left to name. What survives is
 * everything about ONE business's period — the per-day rows and the
 * principal/delegated split — because that arithmetic is unchanged and is now
 * rendered into a pane instead of an expansion.
 *
 * THE IDENTIFIERS SAY `TENANT` AND THE WORDS SAY *BUSINESS*, and that split is
 * [[REQ-180]] §3 rather than an inconsistency. The meter's own vocabulary is the
 * schema's — `turn_spend.tenant_id`, `tenantSpendReport` — and §3 explicitly
 * keeps internal identifiers. What it forbids is the word reaching a screen: a
 * person came here to run a business, and *tenant* describes our data model. The
 * operator reads screens too, and is the one reader most likely to be handed the
 * data model by accident, because they also read the schema.
 *
 * THE LABELS ARE DECLARED HERE for the reason every other label is: provisional
 * chrome, addressed by code, changed in one edit. `TENANT_COST_PRINCIPAL` and
 * `TENANT_COST_DELEGATED` are the load-bearing pair — the two figures must be
 * labelled and must never be added into one, because a caller's true total is
 * its own spend PLUS what it handed off, and a reader taking the first alone
 * under-reports every delegating turn in the flattering direction.
 *
 * `TENANT_COST_NOTHING` IS WHAT AN ABSENT FIGURE SAYS. Nothing, never zero: a
 * business that delegated nothing has no delegated cost, and `$0.00` there would
 * claim work was handed off and came free.
 */
export const TENANT_COST_LABEL = 'Business cost'
export const TENANT_COST_NOTHING = '—'
export const TENANT_COST_READING = 'Reading the meter…'
/**
 * The three headline figures above the decomposition — [[REQ-297]]'s league
 * columns, now about one business.
 *
 * KEYED BY A STABLE ID rather than listed, so the element a UAT addresses is
 * `[data-total="cost"]` and not a slug of whatever the heading currently says.
 * That is the same split this file makes between a tab's `id` and its `label`,
 * applied one level down.
 */
export const TENANT_COST_TOTALS = {
  cost: 'Cost',
  hours: 'Engaged hours',
  'per-hour': 'Cost / hour',
}
export const TENANT_COST_BY_DAY = 'By day'
/**
 * The column headings over the day rows and over the model rows.
 *
 * WITHOUT THEM A DAY IS THREE BARE VALUES — a date and two numbers — and nothing
 * on screen says which number is money and which is time. The figures share a
 * grid precisely so they can be read down a column, and a column that is not
 * named is a column that cannot be.
 *
 * KEYED LIKE `TENANT_COST_TOTALS`, and for the same reason: a UAT addresses
 * `[data-column="cost"]` rather than the words currently in it.
 */
export const TENANT_COST_DAY_COLUMNS = {
  day: 'Day',
  cost: 'Cost',
  hours: 'Engaged',
}
export const TENANT_COST_MODEL_COLUMNS = {
  model: 'Model',
  cost: 'Cost',
}
export const TENANT_COST_PRINCIPAL = 'Own spend'
export const TENANT_COST_DELEGATED = 'Delegated spend'
export const TENANT_COST_DELEGATED_NONE = 'Nothing was delegated in this period.'
export const TENANT_COST_UNPRICED = (turns) =>
  `${turns} turn${turns === 1 ? '' : 's'} had no price, so the cost beside it is a floor.`
