/**
 * The Settings pane — the business's own record, as fields you edit in place
 * ([[REQ-239]], [[EPIC-4]]).
 *
 * EDITING DIRECTLY IS THE PRIMARY PATH AND NOT A CONCESSION. [[EPIC-4]] argued
 * Settings was *"a record-and-status surface, not a workshop"* and that the
 * conversational path was primary, from [[DOC-46]]'s position that the client is
 * not operating a tool. That is taken too far here, and this pane is the
 * correction: some things are simply easier done directly than through discursive
 * communication, and correcting a typo in your own business name is the clearest
 * possible example. A text field is better than a conversation, and a product
 * that insists on the conversation has added the friction it exists to remove.
 *
 * THE ASSISTANT IS NOT DEMOTED BY THAT. It can do everything this pane can,
 * whenever the customer would rather ask. What changes is that neither is a
 * fallback for the other.
 *
 * ONE API, TWO CALLERS. This pane and the settings assistant are both ordinary
 * callers of [[REQ-237]]'s rename — not the pane calling the assistant, and not
 * the assistant driving the pane. That is the rule that keeps the two honest: a
 * second write path with its own validation is how one half of a surface ends up
 * permitting what the other refuses, and here that would mean a name the field
 * accepts and the assistant rejects, with no way for the customer to tell which
 * is right.
 *
 * IT REPORTS EFFECTS AND PERFORMS NONE OF THEM. A rename touches the record and
 * nothing else — the site goes on saying what it said, and some pages go on
 * naming the old name in their prose. Both are shown as things to look at, and
 * neither is a button: what to do about them is a site edit, made in the site tab
 * with the assistant who does site edits. The whole point of a change that
 * deliberately propagates to nothing is that the customer is TOLD what is now
 * inconsistent and gets to choose.
 *
 * TWO SECTIONS, WITH OPPOSITE LIFECYCLES ([[REQ-249]]). The business's NAME is
 * changed freely and costs nothing to get approximately right; the free web
 * address beneath it is chosen once and lived with. They sit on one pane because
 * that is where a customer looks for either, and they are two sections rather
 * than two fields in one form because the sentences that have to travel with the
 * second one — what it is, that it is permanent — would read as pedantry if they
 * were stretched across both. The pane was written as a list of sections so that
 * the hostname would be an addition rather than a rewrite, and it is.
 */

import { mountFields } from '@lagrangefoundry/webui-fields'
import { fetchAddresses, saveBusinessName } from './api.js'
import { createHostnameSection } from './hostname.js'

/**
 * The field, and the two sentences around it.
 *
 * `label` IS WHAT THE CUSTOMER CALLS IT. Not "tenant", not "record" — the words
 * on the screen are the words they would use about their own business.
 *
 * THE HINT SAYS WHICH OF THE TWO NAMES THIS IS, because there are two and they
 * are allowed to differ. This one is what the business IS CALLED — what the
 * switcher above shows, what the Contacts tab shows, what an invoice would say.
 * What the SITE says is authored content, sitting beside the tagline, and is
 * changed by editing the site. A customer who asks to "change their name" means
 * one of those two, and the hint is where the difference is stated before they
 * type rather than after.
 */
export const BUSINESS_NAME_FIELD = Object.freeze({
  name: 'name',
  label: 'Business name',
  required: true,
})

export const SETTINGS_TITLE = 'Your business'
export const BUSINESS_NAME_HINT =
  'What we call your business — in the switcher above, on your contacts, and on ' +
  'anything we send you. Your site can say something different; changing this ' +
  'does not change your site.'

/** Said when the box is emptied. The origin refuses it too — see `onCommit`. */
export const NAME_REQUIRED = 'A business needs a name.'

/** Before a business is in scope, which is an account with nothing it may open. */
export const NO_BUSINESS = 'No business is open, so there is nothing here to change.'

/**
 * What a rename left out of date — an offer, never an action.
 *
 * THE ROUTE'S SHAPE AND NOT THE SURFACE'S. `/api/business/name` answers with what
 * `renameBusiness` returns; the snake_case shape beside it is what the declaration
 * renders for the MODEL, and this pane never sees it. Reading both would be a
 * second code path guarding against a payload that cannot arrive here.
 */
export function outOfDateNotes(effects) {
  const notes = []
  if (!effects) return notes
  if (effects.siteNameDiffers) {
    notes.push(
      `Your site still calls you “${effects.siteName}”. That is part of the site, so ` +
        'it changes in the site tab — ask there and it will be done.',
    )
  }
  const pages = effects.pagesNamingPreviousName ?? []
  if (pages.length > 0) {
    notes.push(
      pages.length === 1
        ? `Your old name is still written into one page (${pages[0]}).`
        : `Your old name is still written into ${pages.length} pages (${pages.join(', ')}).`,
    )
  }
  return notes
}

/**
 * Mount the pane.
 *
 * @param {object} [options]
 * @param {{saveName?: Function, loadAddresses?: Function, checkHostname?: Function,
 *   claimHostname?: Function}} [options.transport] injected by tests; each
 *   defaults to the origin call.
 * @param {(business: {id: string, name: string}) => void} [options.onRenamed]
 *   told the record the origin returned, so the chrome that also shows this name
 *   can follow. The switcher is the reason this exists: a rename that relabelled
 *   the field and left the switcher above it saying the old name would be the
 *   product disagreeing with itself on one screen.
 */
export function createSettingsPanel(options = {}) {
  const { transport = null, onRenamed = () => {} } = options

  const element = document.createElement('div')
  element.className = 'builder-settings'

  const heading = document.createElement('h2')
  heading.className = 'builder-settings__title'
  heading.textContent = SETTINGS_TITLE
  element.append(heading)

  // A SECTION PER SETTING, so [[REQ-238]]'s hostname is an append rather than a
  // restructure — and so each setting can carry its own hint and its own notes
  // without them running together into one block of prose.
  const section = document.createElement('section')
  section.className = 'builder-settings__section'
  const fieldHost = document.createElement('div')
  const hint = document.createElement('p')
  hint.className = 'builder-settings__hint'
  hint.textContent = BUSINESS_NAME_HINT
  const notes = document.createElement('div')
  notes.className = 'builder-settings__notes'
  // `status` AND NOT `alert`: what is out of date is information the customer
  // asked for by renaming, not an error and not a warning about their own change.
  notes.setAttribute('role', 'status')
  section.append(fieldHost, hint, notes)

  const empty = document.createElement('p')
  empty.className = 'builder-settings__empty'
  empty.textContent = NO_BUSINESS

  /**
   * The free web address, as its own section ([[REQ-249]]).
   *
   * ITS OWN MODULE AND NOT MORE OF THIS ONE. What it draws depends on an answer
   * from the origin, it owns a dialog, and the four sentences it says are the
   * whole substance of the ticket that asked for it — none of which is true of a
   * text field over a rename. Keeping it here would make this file a pane and a
   * registrar at once.
   *
   * THE CONFIRM DIALOG IS HOSTED ON THE PANE, because `modal.js` resolves the
   * shell's tokens and the app font from an ancestor: appended to `document.body`
   * — a sibling of the shell — a dialog renders in the browser's default serif
   * and does not follow a theme switch.
   */
  const hostname = createHostnameSection({
    modalHost: element,
    transport: {
      ...(transport?.checkHostname ? { check: transport.checkHostname } : {}),
      ...(transport?.claimHostname ? { claim: transport.claimHostname } : {}),
    },
  })

  const loadAddresses = transport?.loadAddresses ?? fetchAddresses

  let fields = null
  let business = null
  /**
   * WHOSE ADDRESSES ARE STILL WANTED. The read is a round trip and the customer
   * may switch business while it is in flight; without this the previous
   * business's answer arrives last and draws its hostname under this one's name
   * — the crossing [[REQ-181]] refuses for the Library, on the one fact on this
   * pane that cannot be corrected.
   */
  let addressGeneration = 0

  function showNotes(effects) {
    notes.replaceChildren()
    for (const text of outOfDateNotes(effects)) {
      const line = document.createElement('p')
      line.className = 'builder-settings__note'
      line.textContent = text
      notes.append(line)
    }
  }

  /** The one write this pane makes — the origin's, or a suite's stand-in for it. */
  const save = transport?.saveName ?? saveBusinessName

  /**
   * Show a business, or nothing.
   *
   * A REMOUNT AND NOT A `setValues`, for the reason `chat.js` remounts on a
   * conversation switch: this is a DIFFERENT business's record rather than the
   * same one redrawn, and the notes from the last rename belong to the business
   * they were about. Leaving them under a heading naming another one is the
   * outcome [[REQ-181]] refuses for the Library, applied to a form.
   */
  function setBusiness(next) {
    business = next ?? null
    fields?.destroy()
    fields = null
    notes.replaceChildren()
    // CLEARED BEFORE THE READ, NOT AFTER IT. The previous business's address is
    // the one thing on this pane that must never be shown under another
    // business's heading, and the re-read is allowed to fail.
    hostname.clear()
    const mine = ++addressGeneration
    if (!business) {
      section.remove()
      hostname.element.remove()
      element.append(empty)
      return
    }
    empty.remove()
    element.append(section, hostname.element)
    void loadAddresses()
      .then((answer) => {
        if (mine !== addressGeneration) return
        hostname.setAddresses(answer)
      })
      .catch(() => {})
    fields = mountFields(fieldHost, {
      schema: [BUSINESS_NAME_FIELD],
      values: { name: business.name ?? '' },
      layout: 'stacked',
      editable: ['name'],
      // `auto`, FOR THE REASON THE LIBRARY'S NAME FIELD GIVES: one field and no
      // other decision beside it, so a Save button would be a second click to
      // confirm the first — and `auto` reverts the control itself when the origin
      // refuses, which a hand-rolled Save would have to reimplement.
      commit: 'auto',
      onCommit: async (changes) => {
        const next = String(changes.name ?? '').trim()
        // REFUSED HERE AS WELL AS AT THE ORIGIN, and the duplication is
        // deliberate: `auto` reverts on a throw, so throwing is how the customer
        // gets their own word back instead of watching the box empty itself and a
        // request go out that the Worker will refuse anyway.
        if (next === '') throw new Error(NAME_REQUIRED)
        const record = await save(next)
        business = { id: business.id, name: record.name ?? next }
        showNotes(record.effects)
        onRenamed(business)
      },
    })
  }

  return {
    element,
    setBusiness,
    /** What the pane believes the record says — for the host and for a suite. */
    getBusiness: () => business,
    /** The free web address section — for the host and for a suite. */
    hostname,
    clear: () => setBusiness(null),
    destroy() {
      fields?.destroy()
      fields = null
      hostname.destroy()
      element.remove()
    },
  }
}
