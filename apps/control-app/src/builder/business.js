/**
 * The shell's scope controls ([[REQ-179]]) — the business switcher and the
 * account surface behind the avatar.
 *
 * THE RULE THIS MODULE CARRIES IS THE ONE THE TOOLBAR USED TO: a scope is chosen
 * in exactly ONE place, and a second control that could disagree with it is
 * worse than no control at all. Only the place changed. The site selector lived
 * in the site tab's toolbar, so it scoped one tab and every other tab reached
 * sideways for it; the business is what everything belongs to ([[DOC-40]] §2),
 * so its control belongs to the chrome that every tab is inside.
 *
 * NOTHING HERE KNOWS WHAT A SCOPE MEANS. This module renders a list, reports a
 * choice and remembers it. What a chosen business does to the pane, the Library,
 * the assistant and the uploads is `app.js`'s, because `app.js` is the one module
 * that knows all of them — the same layering the chat session already follows.
 */

import {
  ACCOUNT_INITIAL_FALLBACK,
  ACCOUNT_LABEL,
  BUSINESS_LABEL,
  BUSINESS_LAPSED_SUFFIX,
  BUSINESS_LAPSE_EXPIRED_ON,
  BUSINESS_LAPSE_SENTENCES,
} from './config.js'
import { createModalShell, modalButton, modalFooter } from './modal.js'

/**
 * Which business a fresh mount should open, given what was remembered.
 *
 * A STORED SELECTION IS A HINT, NEVER AN INSTRUCTION. Browser storage outlives
 * the grant it was written under: an account can be removed from a business, or
 * its grant can lapse, between one session and the next. Honouring the stored id
 * anyway would send every request to a business the server will refuse, and the
 * operator would meet a builder that 403s on every call with nothing on screen
 * to say why.
 *
 * SO AN INADMISSIBLE ID FALLS BACK SILENTLY to the first business that can be
 * entered. Silently, because the alternative — an error about a business the
 * person may genuinely no longer have anything to do with — is a worse answer to
 * "open my builder" than simply opening the one they can use. The switcher still
 * SHOWS the lapsed business, marked, so the fact is available where it is
 * relevant rather than blocking where it is not.
 *
 * Pure, and exported, so that fallback is provable without a DOM.
 *
 * @param {Array<{id: string, selectable?: boolean}>} businesses
 * @param {string|null} storedId
 * @returns {string|null} the id to open, or null when none can be entered
 */
export function resolveBusiness(businesses, storedId) {
  const list = Array.isArray(businesses) ? businesses : []
  const wanted = String(storedId ?? '').trim()
  const stored = list.find((b) => b.id === wanted)
  if (stored && stored.selectable !== false) return stored.id
  const first = list.find((b) => b.selectable !== false)
  return first ? first.id : null
}

/**
 * The sentence a lapsed business is explained with ([[REQ-180]] §1).
 *
 * PURE, AND EXPORTED, so every branch is provable without a DOM — including the
 * two that only occur against a Worker this client was not built alongside.
 *
 * A MISSING OR UNRECOGNISED LAPSE DEGRADES TO NULL, and the caller renders
 * nothing rather than a placeholder. Both states are ordinary rather than
 * defensive: a Worker that predates this ticket sends `selectable: false` with no
 * `lapse` at all, and one that outlives this client can send a reason it has
 * never heard of. In both cases the business is still marked unavailable by
 * {@link BUSINESS_LAPSED_SUFFIX} — so the answer degrades to less information,
 * never to a wrong one and never to the word `undefined` on a screen.
 *
 * THE DATE IS THE WIRE'S OWN, TRUNCATED TO THE DAY, and deliberately not
 * localised. `ends_at` is a timestamp and the fact worth stating is which day
 * access stopped; rendering the time as well invites the reader to reason about a
 * timezone this string does not carry, and `toLocaleDateString` would make the
 * sentence depend on the machine it is read on, which is the wrong property for
 * something a customer may quote back to us.
 *
 * @param {{reason?: string, endedAt?: string|null}|null|undefined} lapse
 * @returns {string|null}
 */
export function lapseSentence(lapse) {
  const reason = lapse && typeof lapse.reason === 'string' ? lapse.reason : null
  if (!reason) return null
  const endedAt = typeof lapse.endedAt === 'string' ? lapse.endedAt.slice(0, 10) : ''
  if (reason === 'expired' && endedAt !== '') return BUSINESS_LAPSE_EXPIRED_ON(endedAt)
  return BUSINESS_LAPSE_SENTENCES[reason] ?? null
}

/**
 * The switcher, as a piece of shell chrome.
 *
 * TWO PRESENTATIONS, ONE CONTROL, and the split is a design decision rather than
 * an optimisation. With several businesses this is a real choice and renders as
 * one. With exactly one — which is every account in v1 ([[DOC-40]] §2.3) — a
 * select box would be a control offering a choice that does not exist, and the
 * operator would spend the first second of every session working out that it is
 * not asking them anything. So it renders the name and nothing else: present,
 * legible, claiming no more chrome than the fact it is stating.
 *
 * LAPSED MEMBERS ARE LISTED AND DISABLED rather than filtered — see
 * {@link resolveBusiness} for why the distinction is worth keeping on screen.
 *
 * @param {object} spec
 * @param {Array<{id: string, name?: string, selectable?: boolean}>} spec.businesses
 * @param {string|null} [spec.selected] the id to show as current
 * @param {(id: string) => void} [spec.onSelect] fired only on an operator change
 */
export function createBusinessSwitcher({ businesses = [], selected = null, onSelect = () => {} } = {}) {
  const element = document.createElement('div')
  element.className = 'builder-business'

  let current = selected
  /** @type {HTMLSelectElement|null} */
  let select = null

  const labelOf = (b) => `${b.name || b.id}${b.selectable === false ? BUSINESS_LAPSED_SUFFIX : ''}`

  if (businesses.length > 1) {
    select = document.createElement('select')
    select.className = 'builder-business__select'
    select.setAttribute('aria-label', BUSINESS_LABEL)
    for (const b of businesses) {
      const opt = document.createElement('option')
      opt.value = b.id
      opt.textContent = labelOf(b)
      // A lapsed business is readable and unreachable — the state the ticket
      // asks for, expressed with the attribute the platform already means it
      // with, so keyboard and assistive technology get it for free.
      if (b.selectable === false) opt.disabled = true
      select.append(opt)
    }
    if (current) select.value = current
    select.addEventListener('change', () => {
      current = select.value
      onSelect(current)
    })
    element.append(select)
  } else if (businesses.length === 1) {
    const name = document.createElement('span')
    name.className = 'builder-business__name'
    name.textContent = labelOf(businesses[0])
    element.append(name)
  }
  // Zero businesses renders nothing at all. An empty switcher would be a control
  // implying a choice that does not exist even in principle — and the state is
  // reachable: a host that mounts the builder with no identity behind it.

  return {
    element,
    get: () => current,
    /**
     * Show a selection made elsewhere. Deliberately does NOT fire `onSelect`:
     * this is the chrome catching up with a decision, not making one, and a
     * control that reports its own programmatic updates as operator input is how
     * a restore turns into a spurious re-scope.
     */
    set(id) {
      current = id
      if (select && id) select.value = id
      return current
    },
    destroy() {
      element.remove()
    },
  }
}

/**
 * The account surface, opened from the avatar ([[REQ-179]], [[REQ-180]]).
 *
 * A DIALOG RATHER THAN A TAB, for the reason `config.js` states: it is the one
 * surface that is not business-scoped, and a tab for it would be the single
 * place where the shell's switcher is present and does not apply.
 *
 * IT DOES NOT GROW INTO THE PORTAL — IT LINKS TO IT. [[REQ-180]] settled the
 * question this comment used to leave open: the surface showing an account its
 * plan, its invoices and its details is the customer portal of the 1st Contact
 * *site*, rendered through the site pipeline by the code that will render the
 * portal our customers give their own customers ([[DOC-40]] §2.1). Building any
 * of it here would be the named failure mode of §2.1 rule 1 — the bespoke admin
 * billing page — and would guarantee the portal gets built a second time by
 * someone reverse-engineering what this one decided.
 *
 * SO WHAT THIS DIALOG MAY EVER HOLD IS BOUNDED, and the bound is the useful part
 * of the decision: who is signed in, and which businesses that identity reaches.
 * Both are facts about the SESSION, which is the one thing a portal rendered on
 * another origin cannot state. Plan, invoices and details are not thin here
 * pending more work; they are absent because they belong somewhere else.
 *
 * ADDING A BUSINESS IS NOT HERE EITHER, and for a different reason ([[REQ-180]]
 * D2). It is an operator action while we are pre-billing — `provisionBusiness`
 * writes a live grant — so it lives on `/api/admin/businesses`, behind owning
 * the 1st Contact business ([[REQ-185]]), and has no control in the product at
 * all.
 *
 * @param {object} spec
 * @param {Element} [spec.host] inside the shell root — see `modal.js`
 * @param {{name: string|null, email: string}|null} [spec.account]
 * @param {Array<{id: string, name?: string, selectable?: boolean, lapse?: object|null}>} [spec.businesses]
 * @param {string|null} [spec.selected]
 */
export function openAccountSurface({ host = null, account = null, businesses = [], selected = null } = {}) {
  const modal = createModalShell({ host, title: ACCOUNT_LABEL })

  const heading = document.createElement('h2')
  heading.className = 'builder-account__heading'
  heading.textContent = ACCOUNT_LABEL
  modal.panel.append(heading)

  const who = document.createElement('p')
  who.className = 'builder-account__who'
  // The email is the identity Access verified, so it is what is shown when there
  // is no display name — a blank line where a person's name goes reads as a
  // failure to load rather than as a name nobody has set.
  who.textContent = account ? [account.name, account.email].filter(Boolean).join(' — ') : 'Not signed in.'
  modal.panel.append(who)

  const list = document.createElement('ul')
  list.className = 'builder-account__businesses'
  for (const b of businesses) {
    const row = document.createElement('li')
    row.className = 'builder-account__business'
    if (b.id === selected) row.dataset.current = 'true'
    if (b.selectable === false) row.dataset.lapsed = 'true'

    const label = document.createElement('span')
    label.className = 'builder-account__business-name'
    label.textContent = `${b.name || b.id}${b.selectable === false ? BUSINESS_LAPSED_SUFFIX : ''}`
    row.append(label)

    // THE REASON GOES BESIDE THE BUSINESS IT BELONGS TO, and this is the one
    // place in the product it is stated ([[REQ-180]] §1). An account operating
    // three businesses can have two of them lapsed for different reasons, so a
    // single banner over the list would have to pick one and be wrong about the
    // other. It is rendered ONLY for a lapsed business: a selectable one carries
    // no lapse — the server computes the pair from one answer — and a row saying
    // why access is fine would be noise on every line of the ordinary case.
    const sentence = b.selectable === false ? lapseSentence(b.lapse) : null
    if (sentence) {
      const why = document.createElement('span')
      why.className = 'builder-account__business-lapse'
      why.textContent = sentence
      row.append(why)
    }
    list.append(row)
  }
  modal.panel.append(list)

  modal.panel.append(
    modalFooter([modalButton('Close', 'builder-modal__button', () => modal.close())]),
  )
  modal.mount()
  return modal
}

/**
 * The avatar the account surface hangs off.
 *
 * A NODE RATHER THAN A STRING, because the shell's action `content` accepts one
 * and the initial is derived rather than fixed — see `config.js` for why it
 * identifies whose account it is instead of merely marking where the account is.
 */
export function accountAvatar(account) {
  const avatar = document.createElement('span')
  avatar.className = 'builder-avatar'
  const source = account?.name || account?.email || ''
  avatar.textContent = (source.trim()[0] || ACCOUNT_INITIAL_FALLBACK).toUpperCase()
  return avatar
}
