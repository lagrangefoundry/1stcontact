/**
 * What the customer is shown when Publish refuses for want of an address
 * ([[REQ-250]], [[REQ-238]]).
 *
 * THE REFUSAL ALREADY EXISTS AND NOTHING HERE DECIDES IT. `POST /api/publish`
 * answers 409 with `NO_PUBLIC_ADDRESS` when a site has no address at all, and
 * that gate is the Worker's — over a list that has two kinds, which is
 * [[REQ-238]]'s own falsifier. This module chooses WORDS and a MOMENT. A client
 * that read the business's addresses to decide whether to offer the Publish
 * button would be a second implementation of that gate, free to disagree with the
 * real one, and the disagreement would be invisible until it let a publish
 * through. So Publish is always pressable, the post always happens, and this is a
 * rendering of the answer.
 *
 * THE DIALOG IS NOT THE POINT — THE BUTTON IS. The customer who reaches this is by
 * definition the one who does not know what a web address is; a dialog that only
 * says no leaves them exactly where they were, holding a button that refuses. So
 * the refusal carries the route out of itself, and that route is [[REQ-249]]'s
 * section on the Settings tab.
 *
 * AND IT IS A DIALOG RATHER THAN THE PUBLISH BLOCK'S FAILURE BANNER, which is
 * where every other publish failure still goes and where this one went before.
 * That banner is the right register for *the ladder was larger than one request*
 * — a thing that went wrong, said once, in grey, where the site was going to
 * appear. This is not that. It is the single most consequential refusal in the
 * product and it has something for the customer to DO, so it interrupts.
 *
 * IT NAMES BOTH FIXES AND MAKES ONE A BUTTON. The sentence says a free web
 * address or a domain you already own, because that is what the gate actually
 * asks — so the day [[EPIC-6]] lands the copy is already right. The second half
 * is not yet a button because there is not yet anywhere for it to go, and a
 * button that went nowhere would be the fake [[DOC-47]] forbids.
 */

import { createModalShell, modalButton, modalFooter } from './modal.js'

/**
 * The one refusal this module answers, named as the wire names it.
 *
 * DECLARED TWICE ACROSS A RUNTIME BOUNDARY AND PINNED BY A UAT. The Worker's
 * copy is `NO_PUBLIC_ADDRESS_CODE` beside the error that raises it; the browser
 * builder cannot import that module, so this is the near half and a static test
 * asserts the two are the same string. That is the closest thing to one
 * declaration the boundary allows, and it is better than the alternative, which
 * is a literal in a conditional with nothing watching it.
 */
export const NO_PUBLIC_ADDRESS = 'NO_PUBLIC_ADDRESS'

export const NO_ADDRESS_TITLE = 'Your site needs an address before it can go live.'

/**
 * Why, in the customer's terms and not the system's.
 *
 * NOT "no public address was found for this site". *There is nowhere for anyone
 * to type yet* is the same fact said as a consequence they can picture, which is
 * the difference between a refusal that teaches them what an address is for and
 * one that asks them to already know.
 */
export const NO_ADDRESS_BODY =
  'There is nowhere for anyone to type yet. Choose your free web address, or ' +
  'connect a domain you already own — either one is enough.'

/** The way out, and the way through. Neither is an apology. */
export const NOT_NOW_LABEL = 'Not now'
export const CHOOSE_LABEL = 'Choose my web address'

/**
 * Open it.
 *
 * `onChoose` IS CALLED AND THEN THE DIALOG CLOSES, in that order and not the
 * other: what it does is move the customer to another tab, and a dialog still on
 * screen over the destination would be the product congratulating itself in front
 * of the thing it just asked them to look at.
 *
 * `Not now` TAKES FOCUS, for the reason the hostname confirm dialog's Cancel
 * does: a Return press that was aimed at the Publish button behind this must not
 * land on a navigation the customer did not ask for. Nothing here is destructive,
 * but a dialog that moves you somewhere on a keystroke you meant for something
 * else is the same kind of surprise.
 *
 * @param {object} spec
 * @param {Element} [spec.host] inside the shell root — `modal.js` resolves the
 *   theme tokens and the app font from an ancestor, and a dialog appended to
 *   `document.body` follows neither.
 * @param {() => void} [spec.onChoose] open the hostname section
 * @returns the shell's handle, so a host can close it on teardown
 */
export function openNoAddressModal({ host = null, onChoose = () => {} } = {}) {
  const modal = createModalShell({ host, title: NO_ADDRESS_TITLE })
  modal.element.classList.add('builder-no-address')

  const heading = document.createElement('h2')
  heading.className = 'builder-modal__title'
  heading.textContent = NO_ADDRESS_TITLE

  const body = document.createElement('p')
  body.className = 'builder-no-address__body'
  body.textContent = NO_ADDRESS_BODY

  const notNow = modalButton(NOT_NOW_LABEL, 'builder-modal__btn', () => modal.close())
  const choose = modalButton(
    CHOOSE_LABEL,
    'builder-modal__btn builder-modal__btn--primary',
    () => {
      onChoose()
      modal.close()
    },
  )

  // THE WAY OUT BEFORE THE WAY THROUGH in the DOM as well as in focus, which is
  // the order the hostname dialog's footer reads in.
  modal.panel.append(heading, body, modalFooter([notNow, choose]))
  modal.mount()
  notNow.focus()
  return modal
}
