/**
 * The free web address: the field it is chosen in, and the dialog that makes it
 * permanent ([[REQ-249]], [[REQ-238]]).
 *
 * NOTHING HERE DECIDES ANYTHING. What a hostname may be, which labels this
 * product keeps, and whether one is still free are all [[REQ-238]]'s, answered by
 * the Worker and called through `api.js`. This module chooses WORDS and a
 * MOMENT: which sentence goes under the box for each answer, and where the
 * customer is asked whether they are sure. A client that carried its own copy of
 * the reserved list — or read the class of a refusal out of its prose — would be
 * a second rule that can disagree with the first, with the customer left holding
 * two answers and no way to tell which is right.
 *
 * IT IS NOT CALLED A DOMAIN, and the word matters more than it looks. A
 * `1stc.site` hostname is not a domain, and [[EPIC-6]] is going to sell the
 * customer a real one; teaching them "domain" here means unteaching it there, and
 * *"but I already have a free domain"* is the support conversation that wording
 * would buy. `free` stays, because it is true and it is worth saying.
 *
 * THE WHOLE HOST IS ALWAYS ON SCREEN, never a bare label. The apex is drawn
 * beside the box as the customer types and every sentence below names the host
 * rather than the word — a permanent name, entered as free text, by the low-tech
 * customer this product is for, is a permanent typo waiting to happen, and the
 * one defence against it that costs nothing is showing them what they are
 * actually about to own.
 *
 * MOST BUSINESSES, MOST OF THE TIME, SEE NO BOX. A business that has already
 * chosen is shown the host it holds and told the choice was permanent. A box that
 * can only ever be refused is worse than no box ([[DOC-47]]: never build a fake),
 * and the `held` refusal on the claim route exists for callers that arrive
 * another way rather than as this pane's ordinary path.
 */

import { createModalShell, modalButton, modalFooter } from './modal.js'
import { checkHostname, claimHostname } from './api.js'

export const HOSTNAME_TITLE = 'Your free web address'

/**
 * Said before they type, because afterwards is too late.
 *
 * [[REQ-238]]'s rule is that "this cannot be changed" has to reach the customer
 * BEFORE they commit. The dialog says it again at the moment of committing; this
 * says it while they are still choosing, which is when it can change what they
 * type rather than only whether they press the button.
 */
export const HOSTNAME_HINT =
  'Where anyone can find your site on the web, free with 1st Contact. Choose ' +
  'carefully: once you lock it in, it is your business’s address for good and ' +
  'cannot be changed.'

export const CHECK_LABEL = 'Check availability'
export const LOCK_LABEL = 'Lock it in'
export const CANCEL_LABEL = 'Cancel'
export const CONFIRM_TITLE = 'Lock in your free web address'

/** The confirming button names the act. `OK` is the weakest label available. */
export function lockInLabel(host) {
  return `Lock in ${host}`
}

/**
 * The four answers a check can give, as the one line under the box.
 *
 * FOUR AND NOT TWO. The route distinguishes them and collapsing them loses the
 * only thing that tells the customer what to do next: a name somebody else has is
 * answered by trying another; a name this product keeps is answered by changing
 * the WORD, because every decoration of it is kept too; and a name that is not a
 * hostname is answered by the rule it broke, which only the route can state.
 */
export function availableLine(host) {
  return `✓ ${host} is available`
}

export function takenLine(host) {
  return `✗ Sorry, ${host} is taken — try something else or ask the AI for help`
}

export function reservedLine(host) {
  return `✗ Sorry, ${host} is kept for 1st Contact itself — please choose a different word`
}

export function invalidLine(refusal) {
  return `✗ ${refusal}`
}

/**
 * Lost after the dialog was read and accepted.
 *
 * A CHECK RESERVES NOTHING, so this is an ordinary outcome of a first-come
 * namespace rather than a failure. It is one sentence beside the field the
 * customer is already looking at — not an error dialog, not a reload — and their
 * candidate is left in the box so the next attempt starts from what they typed.
 */
export function raceLostLine(host) {
  return `✗ ${host} went while you were deciding — try another one.`
}

/** What a business that has already chosen is shown instead of a field. */
export function heldLines(host) {
  return [`Your free web address is ${host}.`, 'This was chosen once and cannot be changed.']
}

/**
 * The dialog's two sentences.
 *
 * IT SAYS *YOUR BUSINESS*, NOT *THIS SITE*. [[REQ-238]]'s rule is one platform
 * address per business, and this is the moment that promise is made; "this site"
 * would promise something narrower than what is actually enforced.
 */
export function confirmLines(host) {
  return [
    `You have chosen ${host} as your free 1st Contact web address.`,
    'Are you sure this is correct? Once you lock it in, this is your business’s ' +
      'address for good and cannot be undone — not by you, not by us on request.',
  ]
}

/** The address a business holds, out of the list the route answered with. */
export function platformAddress(addresses) {
  return (addresses ?? []).find((a) => a?.kind === 'platform') ?? null
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
 * @param {{check?: Function, claim?: Function}} [options.transport] injected by
 *   tests; defaults to the origin calls.
 * @param {Element|null} [options.modalHost] where the confirm dialog is appended.
 *   Inside the shell root — see `modal.js`, which is the whole reason this is a
 *   parameter rather than `document.body`.
 * @param {(address: object) => void} [options.onClaimed]
 */
export function createHostnameSection(options = {}) {
  const { transport = null, modalHost = null, onClaimed = () => {} } = options
  const check = transport?.check ?? checkHostname
  const claim = transport?.claim ?? claimHostname

  const element = el('section', 'builder-settings__section builder-hostname')
  const title = el('h3', 'builder-settings__subtitle', HOSTNAME_TITLE)
  element.append(title)
  const hint = el('p', 'builder-settings__hint', HOSTNAME_HINT)

  // ── the field, which is a whole host and not a label ──────────────────────
  const row = el('div', 'builder-hostname__row')
  const input = document.createElement('input')
  input.type = 'text'
  input.className = 'builder-hostname__label'
  input.setAttribute('aria-label', HOSTNAME_TITLE)
  const apex = el('span', 'builder-hostname__apex', '')
  const checkButton = modalButton(CHECK_LABEL, 'builder-hostname__check', () => void runCheck())
  row.append(input, apex, checkButton)

  // ONE LINE, AND IT IS `status` RATHER THAN `alert`: every one of the four is
  // the answer to a question the customer asked by pressing Check, including the
  // three that are refusals. None of them is something going wrong.
  const line = el('p', 'builder-hostname__line', '')
  line.setAttribute('role', 'status')

  const lock = modalButton(LOCK_LABEL, 'builder-modal__btn builder-modal__btn--primary', () =>
    openConfirm(),
  )
  lock.classList.add('builder-hostname__lock')

  const held = el('div', 'builder-hostname__held')

  /** The check that produced the line now on screen, or null. */
  let candidate = null
  let dialog = null

  function say(text) {
    line.textContent = text
  }

  /**
   * WITHDRAWN THE MOMENT THE BOX CHANGES. The button commits the host the LAST
   * CHECK answered about, so leaving it up beside an edited box would offer to
   * make permanent a name nobody has been told is free.
   */
  function forgetCandidate() {
    candidate = null
    lock.remove()
    say('')
  }

  input.addEventListener('input', forgetCandidate)
  // RETURN CHECKS, and so does the button. A check reachable only by mouse is
  // this field with the registrar experience taken out of it.
  input.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter') return
    ev.preventDefault()
    void runCheck()
  })

  async function runCheck() {
    const label = input.value.trim()
    // AN EMPTY BOX ASKS NOTHING. The route would answer it — with the refusal
    // for a label of no characters — but reporting a rule as broken by somebody
    // who has not typed yet is a refusal they did not earn.
    if (label === '') {
      forgetCandidate()
      return
    }
    checkButton.disabled = true
    try {
      const answer = await check(label)
      candidate = answer
      if (answer.available) {
        say(availableLine(answer.host))
        line.after(lock)
        return
      }
      lock.remove()
      say(
        answer.reason === 'taken'
          ? takenLine(answer.host)
          : answer.reason === 'reserved'
            ? reservedLine(answer.host)
            : invalidLine(answer.refusal),
      )
    } catch (err) {
      candidate = null
      lock.remove()
      say(`✗ ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      checkButton.disabled = false
    }
  }

  /**
   * The confirm dialog, in the shell every builder modal wears.
   *
   * CANCEL TAKES FOCUS. A return press that was aimed at the check box must not
   * land on the most irreversible action in the product.
   */
  function openConfirm() {
    if (!candidate?.available) return
    const host = candidate.host
    const modal = createModalShell({
      host: modalHost ?? element,
      title: CONFIRM_TITLE,
      onClose: () => {
        dialog = null
      },
    })
    dialog = modal
    modal.panel.append(el('h2', 'builder-modal__title', CONFIRM_TITLE))
    for (const text of confirmLines(host)) {
      modal.panel.append(el('p', 'builder-hostname__confirm', text))
    }
    const confirm = modalButton(
      lockInLabel(host),
      'builder-modal__btn builder-modal__btn--primary',
      async () => {
        confirm.disabled = true
        cancel.disabled = true
        await commit(input.value.trim(), modal)
      },
    )
    const cancel = modalButton(CANCEL_LABEL, 'builder-modal__btn', () => modal.close())
    // CANCEL FIRST IN THE DOM AS WELL AS IN FOCUS: the footer reads left to
    // right, and the way out belongs before the way through.
    modal.panel.append(modalFooter([cancel, confirm]))
    modal.mount()
    cancel.focus()
    return modal
  }

  /**
   * Take it, and live with whatever the Worker says.
   *
   * THE DIALOG CLOSES EITHER WAY. A refusal here is not the dialog's business —
   * it is answered at the field, where the candidate still is and where trying
   * another one is one keystroke away.
   */
  async function commit(label, modal) {
    try {
      const address = await claim(label)
      modal.close()
      showHeld(address)
      onClaimed(address)
    } catch (err) {
      modal.close()
      lock.remove()
      candidate = null
      if (err?.held) {
        // ARRIVED AT ANOTHER WAY, and the only honest thing left is to stop
        // offering a box: this business already has an address and it is final.
        showHeld(err.held)
        return
      }
      say(err?.taken && err.host ? raceLostLine(err.host) : `✗ ${err?.message ?? String(err)}`)
    }
  }

  /** The state most businesses are in most of the time: no box at all. */
  function showHeld(address) {
    hint.remove()
    row.remove()
    line.remove()
    lock.remove()
    held.replaceChildren(
      ...heldLines(address.host).map((text) => el('p', 'builder-hostname__held-line', text)),
    )
    element.append(held)
  }

  /** The field, for a business that has not chosen yet. */
  function showField(apexHost) {
    held.remove()
    apex.textContent = `.${apexHost}`
    input.value = ''
    candidate = null
    say('')
    lock.remove()
    element.append(hint, row, line)
  }

  return {
    element,
    /**
     * WHAT IT HOLDS DECIDES WHAT IS DRAWN, and that is read out of the addresses
     * the pane already asked for rather than out of a second question. "Has this
     * business chosen yet" is not a fact the server has to be asked twice.
     */
    setAddresses({ apex: apexHost, addresses } = {}) {
      dialog?.close()
      const mine = platformAddress(addresses)
      if (mine) showHeld(mine)
      else showField(apexHost ?? '')
    },
    /**
     * Put it where the customer is looking, and put the cursor in it
     * ([[REQ-250]]).
     *
     * IT EXISTS BECAUSE ANOTHER SURFACE SENDS PEOPLE HERE. Publish refuses a site
     * with no address and offers the route out of itself; that route lands on the
     * Settings tab, where this is the second section and may be below the fold.
     * Switching tab and leaving them to find it would be the same dead end one
     * screen further on.
     *
     * IT IS SAFE ON A BUSINESS THAT HAS ALREADY CHOSEN, which cannot reach it by
     * the route that motivates it but can by any other: `showHeld` has removed the
     * box, so there is nothing to focus and the section is merely scrolled to. The
     * guard is `isConnected` rather than a flag about which state is drawn, so
     * there is no second copy of that question to keep in step.
     *
     * `scrollIntoView` IS OPTIONAL AT THE CALL, not assumed: jsdom does not
     * implement it, and a suite driving this would otherwise be asserting a
     * polyfill.
     */
    reveal() {
      element.scrollIntoView?.({ block: 'start' })
      if (input.isConnected) input.focus()
    },
    clear() {
      dialog?.close()
      element.replaceChildren(title)
      held.remove()
      input.value = ''
      candidate = null
      say('')
      lock.remove()
    },
    /** What the section believes it holds — for a suite, and for the host. */
    getCandidate: () => candidate,
    destroy() {
      dialog?.close()
      element.remove()
    },
  }
}
