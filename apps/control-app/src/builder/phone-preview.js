import { createModalShell, modalButton, modalFooter } from './modal.js'
import { qrSvg } from './qr.js'

/**
 * "View on your phone" — the draft, carried to another device as a QR code
 * ([[REQ-376]]).
 *
 * A CLIENT WHO IS ASKED TO LOOK ON THEIR PHONE NEEDS A WAY TO. Without this the
 * only route was copying the address, sending it to themselves and opening it
 * on the phone, and nothing on screen suggested any of that. A camera pointed
 * at the screen is the whole gesture.
 *
 * THE CODE IS A WAY TO CARRY A URL, NOT A CREDENTIAL. It encodes exactly the
 * address "Open in new tab" opens, and the phone meets the same sign-in any
 * other browser would. That is why the dialog says so before the client scans:
 * a sign-in page arriving unannounced on a phone reads as something broken.
 *
 * DRAWN HERE, NEVER FETCHED. The address is a private draft's, and a QR service
 * that drew it would be handed it — see `qr.js`.
 *
 * THE DIALOG FOLLOWS THE PAGE. The opener re-sends the address whenever the pane
 * moves, and {@link update} redraws both the code and the written URL from it,
 * so the code on screen can never name a page that is no longer in the pane.
 *
 * @param {object} spec
 * @param {Element} [spec.host] - where the dialog mounts (`modal.js`'s rule)
 * @param {string} spec.url - the draft address, as "Open in new tab" has it
 * @returns {{ element: Element, update: (url: string) => void, close: () => void }}
 */
export function openPhonePreview({ host = null, url }) {
  const shell = createModalShell({ host, title: 'View on your phone' })
  shell.element.classList.add('builder-phone')

  const title = document.createElement('h2')
  title.className = 'builder-modal__title'
  title.textContent = 'View on your phone'

  const code = document.createElement('div')
  code.className = 'builder-phone__code'

  const how = document.createElement('p')
  how.className = 'builder-phone__how'
  how.textContent =
    "Point your phone's camera at this code to open this page of your draft on your phone. " +
    "You'll be asked to sign in — use the same email you use here."

  const row = document.createElement('div')
  row.className = 'builder-phone__url'
  const field = document.createElement('input')
  field.type = 'text'
  field.readOnly = true
  field.setAttribute('aria-label', 'Draft address')
  const copy = modalButton('Copy', 'builder-modal__btn', async () => {
    try {
      await navigator.clipboard.writeText(field.value)
      copy.textContent = 'Copied'
    } catch {
      // No clipboard in this context (an insecure origin, a denied permission):
      // the address is still on screen, so hand it to the client selected.
      field.select()
      copy.textContent = 'Press Ctrl+C / ⌘C'
    }
  })
  row.append(field, copy)

  shell.panel.append(
    title,
    code,
    how,
    row,
    modalFooter([modalButton('Close', 'builder-modal__btn', shell.close)]),
  )

  /** Redraw for `next` — the code and the written address, from one value. */
  function update(next) {
    // Absolute, because the address is about to leave this browser: a phone has
    // no base URL to resolve the pane's root-relative path against.
    const absolute = new URL(String(next), document.baseURI).href
    if (absolute === field.value) return
    field.value = absolute
    code.innerHTML = qrSvg(absolute)
    code.firstElementChild?.setAttribute('aria-label', `QR code for ${absolute}`)
    copy.textContent = 'Copy'
  }

  update(url)
  shell.mount()
  return { element: shell.element, update, close: shell.close }
}
