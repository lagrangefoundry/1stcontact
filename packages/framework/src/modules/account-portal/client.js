/**
 * Vetted client behaviour for the `account-portal` behavior ([[REQ-183]],
 * [[REQ-245]]).
 *
 * THREE JOBS, AND NONE OF THEM DELETES ANYTHING. It fills the account line and
 * the holdings sentence from the endpoint the instance names; it folds the
 * erasure explanation away behind the control; and it draws the contact's own
 * acceptances, offering a control on exactly the ones the endpoint marked
 * editable.
 *
 * THE THIRD JOB IS THE ONE OPENING IN A CONTRACT THAT WAS READ-ONLY, AND IT IS
 * BOUNDED AT BOTH ENDS ([[REQ-245]] §2). This file makes exactly two kinds of
 * request — a `GET` for facts and a `POST` that carries a key and a boolean —
 * and a UAT asserts there is no third, because "the button does not delete the
 * account" still has to be a property of the code rather than of a promise
 * ([[REQ-183]] §4.1). The other end of the bound is the endpoint, which refuses
 * every key whose type is not a preference; so even a `POST` this file could be
 * made to spell cannot revoke a document or move an entitlement.
 *
 * WHICH ROWS GET A CONTROL IS NOT DECIDED HERE. Each row arrives carrying
 * `editable` and `historic`, both computed from the acceptance's own type, and
 * this file reads them. It knows no key names and no type names, which is what
 * makes "a type 1 offers no control" a property of the acceptance rather than of
 * this markup — and what lets a business turn a new preference on and see it
 * appear with nothing here edited ([[REQ-245]] §3).
 *
 * IT ONLY EVER SUBTRACTS. The server renders the explanation OPEN
 * (`component.ts` explains why), so every failure of this file — no script, a
 * throw, an endpoint that refuses — leaves a page that shows more of the truth
 * rather than a control that claims something the page cannot do ([[DOC-37]]
 * §6.2). That is why the collapse happens here and the reveal does not.
 *
 * Authored as self-contained browser JavaScript (no imports) so the render
 * pipeline ships it verbatim in `capabilities.js`; unit-tested by importing this
 * module against a JSDOM + mocked `fetch`. **Isolation** ([[DOC-25]]): defensive
 * throughout, so a failure degrades to the fully-expanded baseline.
 */

const PORTAL_SELECTOR = '[data-account-portal]'
const IDENTITY_SELECTOR = '[data-account-identity]'
const HOLDINGS_SELECTOR = '[data-account-holdings]'
const ERASURE_SELECTOR = '[data-account-erasure]'
const ERROR_SELECTOR = '[data-account-error]'
const REVEAL_SELECTOR = 'button[aria-expanded]'
const AGREEMENTS_SELECTOR = '[data-account-agreements]'
const PREFERENCES_SELECTOR = '[data-account-preferences]'
const PREFS_ERROR_SELECTOR = '[data-account-prefs-error]'

/**
 * How the person reading this portal is named on it.
 *
 * THE EMAIL IS THE FALLBACK AND NOT THE ORNAMENT. It is the identity the login
 * verified ([[DOC-40]] §2), so it is always true; a display name is a label
 * somebody set and may not exist. A blank line where a person's name goes reads
 * as a failure to load rather than as a name nobody has set — which is the same
 * reasoning the avatar surface already uses.
 *
 * IT IS THE PERSON AND NOT THE ACCOUNT ([[REQ-194]]). It was `accountLine`, over
 * a payload field called `account` that carried a person's display name and their
 * verified address — which is what the account looked like while it had no table.
 * The account is the payer and the owner of businesses; a portal's first line is
 * "you are signed in as", so it names the person and the noun says so.
 *
 * Pure and exported so both branches are provable without a DOM.
 */
export function identityLine(person) {
  if (!person || typeof person !== 'object') return ''
  const email = typeof person.email === 'string' ? person.email.trim() : ''
  const name = typeof person.name === 'string' ? person.name.trim() : ''
  if (name && email) return name + ' — ' + email
  return name || email
}

/**
 * What erasure would take with it, in this account's own terms ([[REQ-183]] D6).
 *
 * THE SENTENCE IS COMPUTED, NOT AUTHORED, and that is the answer to the ticket's
 * third open question. "Delete account" is a request about the account, and an
 * account is relative to the business it is an account of ([[DOC-42]] §6) — so a
 * fixed sentence about businesses is wrong at one level or the other. This names
 * the businesses this account actually operates, and one level down, where an
 * account operates none, it returns nothing and the sentence does not appear.
 *
 * LAPSED BUSINESSES ARE INCLUDED. They are still the person's, they still hold
 * their site and their customers, and the population most likely to be reading
 * this page is exactly the one whose grants have lapsed. Omitting them would make
 * the surface understate what it destroys, on the one page where understating is
 * the failure ([[DOC-37]] §6.2).
 *
 * Pure and exported for the same reason as above.
 */
export function holdingsLine(businesses) {
  const list = Array.isArray(businesses) ? businesses : []
  const names = []
  for (let i = 0; i < list.length; i++) {
    const entry = list[i]
    if (!entry || typeof entry !== 'object') continue
    const name = typeof entry.name === 'string' && entry.name.trim() ? entry.name.trim() : entry.id
    if (typeof name === 'string' && name) names.push(name)
  }
  if (names.length === 0) return ''
  const noun = names.length === 1 ? 'business' : 'businesses'
  return 'This account operates ' + names.length + ' ' + noun + ': ' + names.join(', ') + '.'
}

/** Show a node's text, or hide the node when there is nothing true to put in it. */
function fill(node, text) {
  if (!node) return
  if (text) {
    node.textContent = text
    node.hidden = false
  } else {
    node.textContent = ''
    node.hidden = true
  }
}

/** Fold the explanation away, or open it, keeping the control's state honest. */
export function setDisclosure(section, open) {
  try {
    const erasure = section.querySelector(ERASURE_SELECTOR)
    if (erasure) erasure.hidden = !open
    const buttons = section.querySelectorAll(REVEAL_SELECTOR)
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-expanded', open ? 'true' : 'false')
    }
  } catch (_e) {
    // A disclosure that cannot be moved stays where the server left it — open.
  }
}

/** Read the caller's own account and write it into the two invariant elements. */
export async function loadAccount(section, fetchImpl) {
  const src = section.getAttribute('data-account-src')
  if (!src) return
  const call = fetchImpl || (typeof fetch === 'function' ? fetch : null)
  if (!call) return

  let payload
  try {
    // GET, credentials included — the endpoint authenticates by the origin's own
    // session ([[DOC-40]] §3). No method, no body, nothing to send.
    const response = await call(src, { method: 'GET', credentials: 'same-origin' })
    if (!response || !response.ok) throw new Error('refused')
    payload = await response.json()
  } catch (_e) {
    const error = section.querySelector(ERROR_SELECTOR)
    if (error) error.hidden = false
    return
  }

  if (!payload || typeof payload !== 'object') return
  fill(section.querySelector(IDENTITY_SELECTOR), identityLine(payload.person))
  fill(section.querySelector(HOLDINGS_SELECTOR), holdingsLine(payload.businesses))
}


/* -- Agreements ([[REQ-245]]) -------------------------------------------- */

/**
 * A date, as a person reads one, or the raw value when it is not one.
 *
 * THE LOCALE IS THE READER'S. A portal is the one surface here whose audience is
 * the contact rather than an operator, so the browser's own formatting is more
 * right than any fixed one this file could choose.
 */
export function whenText(iso) {
  if (typeof iso !== 'string' || iso === '') return ''
  var at = new Date(iso)
  if (isNaN(at.getTime())) return iso
  try {
    return at.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
  } catch (_e) {
    return iso.slice(0, 10)
  }
}

/**
 * Where this contact stands on one acceptance, in a sentence.
 *
 * NEVER-ASKED IS ITS OWN ANSWER AND IS NOT DRAWN AS A REFUSAL. A key with no
 * record means nobody put the question, which is a different fact from a
 * withdrawal and would be a lie about the contact if the two were drawn alike --
 * the same distinction the operator's own Agreements pane keeps.
 *
 * THE TENSE COMES FROM `historic`. A request is a statement about something that
 * happened, so it reads "Asked"; everything else carries a value that currently
 * stands, so it reads in the present. Neither branch names a type.
 *
 * AN OUTSTANDING DOCUMENT SAYS SO. They agreed, and the business has published a
 * newer one since, so "Agreed" on its own would be true of the act and false
 * about where they stand today.
 *
 * Pure and exported, because the phrasing IS the claim and it is provable
 * without a DOM.
 */
export function preferenceStatus(entry) {
  if (!entry || typeof entry !== 'object') return ''
  var when = whenText(entry.since)
  if (entry.granted === null || entry.granted === undefined) return 'Not asked yet'
  if (entry.historic) return when ? 'Asked ' + when : 'Asked'
  if (entry.editable) {
    var state = entry.granted ? 'On' : 'Off'
    return when ? state + ' since ' + when : state
  }
  if (!entry.granted) return 'Not agreed'
  if (entry.outstanding) return 'Agreed to an earlier version'
  return when ? 'Agreed ' + when : 'Agreed'
}

/** Every text node this file writes goes through `textContent`, never markup. */
function span(doc, className, text) {
  var node = doc.createElement('span')
  node.className = className
  node.textContent = text
  return node
}

/**
 * Draw one acceptance.
 *
 * THE CONTROL IS A REAL CHECKBOX INSIDE ITS OWN LABEL, so the wording the
 * contact is agreeing to is the control's accessible name rather than a
 * neighbouring string -- which is the difference between a screen reader saying
 * what the box means and saying "checkbox".
 *
 * `type="checkbox"` AND NOT A BUTTON. The thing being expressed is a standing
 * two-state answer, and every assistive technology already knows how to say
 * that; a button would need this file to invent the announcement.
 */
function drawPreference(doc, entry, onChange) {
  var row = doc.createElement('li')
  row.className = 'account-portal__preference'
  row.setAttribute('data-preference-key', String(entry.key || ''))

  if (entry.editable) {
    var label = doc.createElement('label')
    label.className = 'account-portal__preflabel'
    var box = doc.createElement('input')
    box.type = 'checkbox'
    box.className = 'account-portal__prefbox'
    box.checked = entry.granted === true
    box.setAttribute('data-preference-input', '')
    label.appendChild(box)
    // The wording when the business wrote one, the label otherwise -- a control
    // with no name at all is worse than one named by its heading.
    label.appendChild(
      span(doc, 'account-portal__prefwording', entry.wording || entry.label || entry.key || ''),
    )
    row.appendChild(label)
    box.addEventListener('change', function () {
      onChange(entry, box)
    })
  } else {
    // NO CONTROL, AND NOT A DISABLED ONE. A greyed checkbox says "you could
    // change this, but not now", which is false: a document acceptance is not
    // revocable and a request has nothing to take back.
    row.appendChild(span(doc, 'account-portal__prefname', entry.label || entry.key || ''))
  }
  row.appendChild(span(doc, 'account-portal__prefwhen', preferenceStatus(entry)))
  return row
}

/** Replace the list with these rows, revealing the section when there are any. */
function paintPreferences(section, entries, onChange) {
  var list = section.querySelector(PREFERENCES_SELECTOR)
  var region = section.querySelector(AGREEMENTS_SELECTOR)
  if (!list) return
  var doc = list.ownerDocument
  while (list.firstChild) list.removeChild(list.firstChild)
  for (var i = 0; i < entries.length; i++) {
    list.appendChild(drawPreference(doc, entries[i], onChange))
  }
  // HIDDEN WHEN THERE IS NOTHING, which is not the same as a section that failed
  // to load. A business that has turned no acceptances on has none to show, and a
  // heading over an empty list would claim this person has no preferences.
  if (region) region.hidden = entries.length === 0
}

/** Rows the endpoint returned, defensively -- anything else is no rows. */
export function preferenceRows(payload) {
  if (!payload || typeof payload !== 'object') return []
  var list = payload.acceptances
  if (!Array.isArray(list)) return []
  var rows = []
  for (var i = 0; i < list.length; i++) {
    var entry = list[i]
    if (entry && typeof entry === 'object' && typeof entry.key === 'string' && entry.key) {
      rows.push(entry)
    }
  }
  return rows
}

/** Where the acceptances endpoint is named -- on the section or on the region. */
function acceptancesSrc(section) {
  var src = section.getAttribute('data-acceptances-src')
  if (src) return src
  var region = section.querySelector(AGREEMENTS_SELECTOR)
  return region ? region.getAttribute('data-acceptances-src') : null
}

/**
 * Read the caller's own acceptances and draw them, wiring each control.
 *
 * A FAILURE COSTS THE SECTION AND NOTHING ELSE. It stays hidden, exactly as the
 * server rendered it, so a portal whose endpoint is unreachable shows the copy
 * its author wrote and claims nothing about what this person has agreed to.
 */
export async function loadPreferences(section, fetchImpl) {
  var src = acceptancesSrc(section)
  if (!src) return
  var call = fetchImpl || (typeof fetch === 'function' ? fetch : null)
  if (!call) return

  var payload
  try {
    var response = await call(src, { method: 'GET', credentials: 'same-origin' })
    if (!response || !response.ok) throw new Error('refused')
    payload = await response.json()
  } catch (_e) {
    return
  }
  paintPreferences(section, preferenceRows(payload), function (entry, box) {
    void setPreference(section, entry, box, call)
  })
}

/**
 * The one write this module makes ([[REQ-245]] section 2).
 *
 * IT SENDS A KEY AND A DIRECTION AND NOTHING ELSE. No contact id -- the endpoint
 * reads that from the session and refuses a body that names another -- and no
 * wording: what the contact was shown is read at the other end from the
 * business's own definition, so a client cannot supply its own evidence of what
 * somebody read, which is the one field here worth forging.
 *
 * A REFUSAL PUTS THE BOX BACK. The checkbox is the reader's belief about what is
 * recorded, so leaving it moved after a write that did not land would make the
 * surface lie about the only thing on it that is theirs to change.
 */
export async function setPreference(section, entry, box, fetchImpl) {
  var src = acceptancesSrc(section)
  var error = section.querySelector(PREFS_ERROR_SELECTOR)
  var call = fetchImpl || (typeof fetch === 'function' ? fetch : null)
  var wanted = box.checked
  if (!src || !call) {
    box.checked = !wanted
    if (error) error.hidden = false
    return
  }
  box.disabled = true
  try {
    var response = await call(src, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: entry.key, granted: wanted }),
    })
    if (!response || !response.ok) throw new Error('refused')
    var payload = await response.json()
    var updated = payload && typeof payload === 'object' ? payload.acceptance : null
    if (!updated || typeof updated !== 'object') throw new Error('unreadable')
    // THE ANSWER IS THE TRUTH, NOT THE REQUEST. Everything visible is redrawn
    // from what the endpoint says it recorded, so a write that landed differently
    // from what was asked says so instead of being echoed back.
    entry.granted = updated.granted
    entry.since = updated.since
    entry.outstanding = updated.outstanding
    box.checked = updated.granted === true
    var row = box.closest ? box.closest('li') : null
    var when = row ? row.querySelector('.account-portal__prefwhen') : null
    if (when) when.textContent = preferenceStatus(entry)
    if (error) error.hidden = true
  } catch (_e) {
    box.checked = !wanted
    if (error) error.hidden = false
  } finally {
    box.disabled = false
  }
}

/** Attach every behaviour to one portal `<section>`. */
export function enhanceAccountPortal(section, fetchImpl) {
  try {
    setDisclosure(section, false)
    const buttons = section.querySelectorAll('button[aria-controls]')
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i]
      const opens = button.hasAttribute('aria-expanded')
      button.addEventListener('click', function () {
        setDisclosure(section, opens)
      })
    }
    void loadAccount(section, fetchImpl)
    void loadPreferences(section, fetchImpl)
  } catch (_e) {
    // Isolation: enhancement failure leaves the fully-expanded server baseline.
  }
}

/** Enhance every portal in `root` (defaults to `document`). */
export function enhanceAllAccountPortals(root) {
  const scope = root || (typeof document !== 'undefined' ? document : null)
  if (!scope) return
  const sections = scope.querySelectorAll(PORTAL_SELECTOR)
  for (let i = 0; i < sections.length; i++) enhanceAccountPortal(sections[i])
}

// Auto-init when shipped to the browser; inert under Node/JSDOM-less imports.
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      enhanceAllAccountPortals()
    })
  } else {
    enhanceAllAccountPortals()
  }
}
