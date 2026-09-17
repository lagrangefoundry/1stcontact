/**
 * **Your domain** — the selector, the sending toggle, and release ([[REQ-259]]).
 *
 * THIS IS WHERE THE WORD *DOMAIN* IS FINALLY CORRECT, and that is not a
 * stylistic note. `hostname.js` immediately above refuses the word for a
 * `1stc.site` address on the grounds that [[EPIC-6]] is going to sell the
 * customer a real one and teaching them "domain" there means unteaching it here.
 * This section is the real one. The two sit on one pane and read as one sentence
 * about the same subject — *where people find you* — or they read as two
 * products.
 *
 * THREE CONTROLS AND NO RECORDS. Which domain, whether mail goes out from it,
 * and whether it stays. **If a customer is being shown a record type, we have
 * failed** — so nothing in this file names `A`, `CNAME`, `TXT`, `MX`, SPF, DKIM
 * or DMARC, nothing shows a record value, and nothing shows a zone id. The
 * origin's answer carries none of them either, which is what makes that a
 * property of the API rather than a discipline of this file ([[REQ-259]], and
 * `api.js`'s own note).
 *
 * IT NOTIFIES; IT DOES NOT ASK. What was already living on the domain is read
 * before the attach and said AFTER it, in their language — *"Your email is with
 * Microsoft 365 — I'll keep that working."* There is deliberately no confirm
 * step in front of it: [[EPIC-5]] settled that a confirmation a furniture
 * restorer cannot perform launders our error into their approval. The one dialog
 * in this file is in front of RELEASE, which is a thing the customer is choosing
 * to do rather than a thing we are doing to them.
 *
 * AND IT SAYS NOTHING WHEN THE DOMAIN IS CLEAN. A warning about a risk that does
 * not exist is how customers learn to dismiss warnings, so a domain carrying no
 * mail and no website attaches in silence.
 *
 * NOTHING HERE DECIDES ANYTHING, on `hostname.js`'s rule. Which domains this
 * account holds, whether one is free, whether this person may spend it and where
 * the verification got to are all the Worker's answers.
 *
 * AND WHETHER THE SENDING TOGGLE IS DRAWN AT ALL IS ONE OF THEM ([[REQ-264]]).
 * `state.emailAvailable` is false on a deployment that cannot configure sending
 * — no credential, or one the provider refuses — and the toggle is then not
 * rendered rather than rendered and refused. A control that cannot work is
 * *"worse than not offering it"*, and the customer is told nothing about it
 * because there is nothing about it that is theirs to act on: the website is
 * unaffected and mail keeps coming from 1st Contact, which is the ordinary
 * state `emailLine` already describes.
 */

import { createModalShell, modalButton, modalFooter } from './modal.js'
import { attachDomain, fetchDomain, releaseDomain, setDomainEmail } from './api.js'

export const DOMAIN_TITLE = 'Your domain'

/**
 * Said above the selector.
 *
 * IT NAMES WHAT CHANGES FOR A VISITOR, not what changes in a zone. The customer's
 * question is *what will people type*, and that is the whole of what this
 * sentence answers.
 */
export const DOMAIN_HINT =
  'Your own web address. Once it is switched over, anyone typing it lands on ' +
  'the site we have built for you.'

export const ATTACH_LABEL = 'Use this domain'
export const RELEASE_LABEL = 'Stop using this domain'
export const RELEASE_CONFIRM_TITLE = 'Stop using this domain'
export const CANCEL_LABEL = 'Cancel'
export const EMAIL_LABEL = 'Send email from this domain'

/** What a business with no domain on the account is told. */
export const NO_DOMAINS =
  'You do not have a domain with us yet. Ask and we will sort one out for you.'

/** Where mail from the domain got to, as one line each. */
export function emailLine(state, domain) {
  if (state === 'verified') return `Email to your customers comes from ${domain}.`
  if (state === 'pending') {
    return `Setting up email from ${domain}. This usually takes a few minutes — ` +
      'you can carry on, and it will come right on its own.'
  }
  if (state === 'failed') {
    return `Email from ${domain} could not be set up. Turn it off and on again, ` +
      'or ask us and we will look.'
  }
  return `Email to your customers comes from 1st Contact, not from ${domain}.`
}

/** What a business whose domain is serving is told. */
export function attachedLine(domain) {
  return `${domain} is your website address.`
}

/**
 * The release dialog's two sentences.
 *
 * IT SAYS WHAT COMES BACK, because the fear this dialog is actually answering is
 * *"will I lose my website"* — and the truthful answer is that the free address
 * takes over again and the domain stays theirs. A dialog that only said "are you
 * sure" would leave that unanswered at the one moment it is being asked.
 */
export function releaseLines(domain) {
  return [
    `${domain} will stop pointing at your site, and your free 1st Contact ` +
      'address takes over again.',
    'The domain stays yours and stays on your account — you can point it back ' +
      'here whenever you like.',
  ]
}

function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

/**
 * Mount the section.
 *
 * @param {object} [options]
 * @param {{load?: Function, attach?: Function, release?: Function, setEmail?: Function}}
 *   [options.transport] injected by tests; each defaults to the origin call.
 * @param {Element|null} [options.modalHost] where the release dialog is
 *   appended. Inside the shell root — `modal.js` resolves the shell's tokens and
 *   the app font from an ancestor, so a dialog on `document.body` renders in the
 *   browser's default serif and does not follow a theme switch.
 * @param {(state: object) => void} [options.onChanged] told the state the origin
 *   returned, so a surface that also shows the address can follow.
 */
export function createDomainSection(options = {}) {
  const { transport = null, modalHost = null, onChanged = () => {} } = options
  const load = transport?.load ?? fetchDomain
  const attach = transport?.attach ?? attachDomain
  const release = transport?.release ?? releaseDomain
  const setEmail = transport?.setEmail ?? setDomainEmail

  const element = el('section', 'builder-settings__section builder-domain')
  const title = el('h3', 'builder-settings__subtitle', DOMAIN_TITLE)
  const body = el('div', 'builder-domain__body')
  element.append(title, body)

  /** The state the origin last answered with, or null before the first read. */
  let state = null
  /** What was found on the domain when it was taken over. Shown once, after. */
  let pending = []
  let dialog = null
  let busy = false

  /**
   * ONE LINE, AND IT IS `status` RATHER THAN `alert`. Every sentence this
   * section says — including *"that domain is already in use"* — is the answer to
   * something the customer asked by pressing a control. None of them is
   * something going wrong.
   */
  const line = el('p', 'builder-domain__line', '')
  line.setAttribute('role', 'status')

  function say(text) {
    line.textContent = text ?? ''
  }

  /** Run one write, keeping the controls disabled while it is in flight. */
  async function run(work) {
    if (busy) return
    busy = true
    draw()
    try {
      const next = await work()
      busy = false
      if (next) {
        state = next
        draw()
        onChanged(state)
      }
    } catch (err) {
      busy = false
      draw()
      say(`✗ ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  /**
   * The selector, for an account holder with something to spend.
   *
   * A TAKEN DOMAIN IS LISTED AND DISABLED RATHER THAN OMITTED. A customer who
   * bought two domains and can only see one has been shown a bug; one who can see
   * both and is told which is already in use has been shown the truth. The option
   * says so in a sentence, and names no other site — which one holds it is not
   * this customer's business to be told.
   */
  function drawSelector() {
    const free = state.pool.filter((option) => option.available)
    if (state.pool.length === 0) {
      body.append(el('p', 'builder-settings__hint', NO_DOMAINS))
      return
    }
    body.append(el('p', 'builder-settings__hint', DOMAIN_HINT))

    const row = el('div', 'builder-domain__row')
    const select = document.createElement('select')
    select.className = 'builder-domain__select'
    select.setAttribute('aria-label', DOMAIN_TITLE)
    for (const option of state.pool) {
      const item = document.createElement('option')
      item.value = option.domain
      item.textContent = option.available
        ? option.domain
        : `${option.domain} — ${option.refusal}`
      item.disabled = !option.available
      select.append(item)
    }
    if (free.length > 0) select.value = free[0].domain

    // THE TOGGLE IS BESIDE THE SELECTOR AND DEFAULTS ON, so the customer decides
    // once rather than attaching and then being asked a second question about a
    // domain that is already live. It is absent entirely when this deployment
    // cannot configure sending ([[REQ-264]]), and the attach then asks for no
    // email — the customer gets their website and is not shown a promise the
    // deployment cannot keep.
    const offerEmail = state.emailAvailable !== false
    const toggle = document.createElement('input')
    toggle.type = 'checkbox'
    toggle.className = 'builder-domain__email'
    toggle.checked = true
    toggle.id = 'builder-domain-email-new'
    const toggleLabel = el('label', 'builder-domain__email-label', EMAIL_LABEL)
    toggleLabel.htmlFor = toggle.id

    const button = modalButton(
      ATTACH_LABEL,
      'builder-modal__btn builder-modal__btn--primary builder-domain__attach',
      () =>
        void run(async () => {
          const done = await attach(select.value, offerEmail && toggle.checked)
          // THE NOTES ARE THE ATTACH'S OWN ANSWER AND ARE SHOWN ONCE. They
          // describe what was found on the domain at the moment it was taken
          // over, which is not a fact a later read could reproduce.
          pending = done.liveUse?.notes ?? []
          return load()
        }),
    )
    button.disabled = busy || free.length === 0
    select.disabled = busy || free.length === 0
    toggle.disabled = busy || free.length === 0

    row.append(select, button)
    toggleLabel.prepend(toggle)
    body.append(row)
    if (offerEmail) body.append(toggleLabel)
  }

  /** The state most businesses with a domain are in: it is on, and it works. */
  function drawAttached() {
    body.append(el('p', 'builder-domain__attached', attachedLine(state.attached)))

    // NO TOGGLE AND NO LINE ABOUT MAIL when this deployment cannot configure
    // sending ([[REQ-264]]). The website is the thing the customer asked for and
    // it is working; a dead control beside it, or a sentence explaining why the
    // control is dead, would put our configuration on their screen.
    if (state.emailAvailable !== false) {
      const toggle = document.createElement('input')
      toggle.type = 'checkbox'
      toggle.className = 'builder-domain__email'
      toggle.id = 'builder-domain-email'
      toggle.checked = state.email !== 'off'
      toggle.disabled = busy || !state.mayAttach
      toggle.addEventListener('change', () =>
        void run(async () => {
          await setEmail(toggle.checked)
          return load()
        }),
      )
      const label = el('label', 'builder-domain__email-label', EMAIL_LABEL)
      label.htmlFor = toggle.id
      label.prepend(toggle)
      body.append(
        label,
        el('p', 'builder-domain__email-line', emailLine(state.email, state.attached)),
      )
    }

    if (!state.mayAttach) return
    // RELEASE IS ALWAYS AVAILABLE, and that is the rule this section exists to
    // hold. `1stc.site` is chosen once and never changed because it is scarce,
    // public and first-come; a customer's own domain is none of those things and
    // must be movable, removable and takeable away. Any refusal to move or
    // remove one is this ticket's falsifier.
    const stop = modalButton(RELEASE_LABEL, 'builder-modal__btn builder-domain__release', () =>
      openRelease(),
    )
    stop.disabled = busy
    body.append(stop)
  }

  /** Draw whatever the state says. One function, so there is one answer. */
  function draw() {
    body.replaceChildren()
    if (state === null) return
    if (state.attached) drawAttached()
    else if (state.mayAttach) drawSelector()
    // A MEMBER WHO MAY NOT SPEND THE ACCOUNT'S DOMAINS IS SHOWN NO POOL AT ALL,
    // not a disabled one. The pool is a list of things somebody else paid for,
    // and showing it invites them to ask for a specific one — which is a
    // conversation about somebody else's assets that we started.
    else body.append(el('p', 'builder-settings__hint', state.refusal ?? NO_DOMAINS))

    for (const note of pending) {
      body.append(el('p', 'builder-domain__note', note))
    }
    body.append(line)
  }

  /**
   * The release dialog.
   *
   * CANCEL TAKES FOCUS, on `hostname.js`'s reasoning: a return press aimed at
   * something else must not land on the control that takes a customer's website
   * address down.
   */
  function openRelease() {
    const domain = state.attached
    const modal = createModalShell({
      host: modalHost ?? element,
      title: RELEASE_CONFIRM_TITLE,
      onClose: () => {
        dialog = null
      },
    })
    dialog = modal
    modal.panel.append(el('h2', 'builder-modal__title', RELEASE_CONFIRM_TITLE))
    for (const text of releaseLines(domain)) {
      modal.panel.append(el('p', 'builder-domain__confirm', text))
    }
    const confirm = modalButton(
      RELEASE_LABEL,
      'builder-modal__btn builder-modal__btn--primary',
      async () => {
        confirm.disabled = true
        cancel.disabled = true
        modal.close()
        pending = []
        await run(async () => {
          await release()
          return load()
        })
      },
    )
    const cancel = modalButton(CANCEL_LABEL, 'builder-modal__btn', () => modal.close())
    modal.panel.append(modalFooter([cancel, confirm]))
    modal.mount()
    cancel.focus()
    return modal
  }

  return {
    element,
    /** Draw from an answer the pane already has, or asked for on its behalf. */
    setState(next) {
      dialog?.close()
      pending = []
      state = next ?? null
      draw()
    },
    /**
     * Read again and follow it.
     *
     * IT ACTS ONLY ON A DIFFERENCE, on `hostname.js`'s reasoning: a re-read
     * happens while the customer is sitting in front of the section, most often
     * because the assistant beside it answered a question and changed nothing.
     * Redrawing unconditionally would reset a selection they had just made.
     *
     * THE VERIFICATION STATE IS WHY IT IS CALLED AT ALL. Resend's wait is
     * minutes; the section says *"this will come right on its own"*, and a
     * re-read is how that sentence becomes true rather than an invitation to
     * reload the page.
     */
    refresh(next) {
      if (!next) return false
      if (
        state &&
        next.attached === state.attached &&
        next.email === state.email &&
        next.mayAttach === state.mayAttach &&
        next.pool.length === state.pool.length
      ) {
        return false
      }
      dialog?.close()
      state = next
      draw()
      return true
    },
    clear() {
      dialog?.close()
      state = null
      pending = []
      body.replaceChildren()
    },
    /** What the section believes the origin said — for a suite, and the host. */
    getState: () => state,
    destroy() {
      dialog?.close()
      element.remove()
    },
  }
}
