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
 * WHAT IT SHOWS IS DELIBERATELY THIN. [[REQ-180]] owns the customer portal this
 * grows into — plan, invoices, details — and it is the portal of the 1st Contact
 * *site*, rendered by the code that will render the portal our customers give
 * their own customers ([[DOC-40]] §2.1). Sketching those surfaces here would be
 * building them twice, so this states what is true today and nothing more: who
 * is signed in, and which businesses that identity reaches.
 *
 * @param {object} spec
 * @param {Element} [spec.host] inside the shell root — see `modal.js`
 * @param {{name: string|null, email: string}|null} [spec.account]
 * @param {Array<{id: string, name?: string, selectable?: boolean}>} [spec.businesses]
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
    row.textContent = `${b.name || b.id}${b.selectable === false ? BUSINESS_LAPSED_SUFFIX : ''}`
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
