/**
 * What the client can do to one of their uploads, wherever they see it ([[BUG-196]]).
 *
 * ONE MODULE, BECAUSE THE SAME UPLOAD IS SHOWN IN THREE PLACES — the Library's
 * row, the Library's detail pane, and the answered ask on the plan panel — and an
 * action that looked or behaved differently in one of them would be a second
 * action. So the controls, the delete confirmation and its sentences live here,
 * and each place mounts them.
 *
 * TWO ACTIONS, BOTH OVER ROUTES THAT ALREADY EXIST:
 *   - **Use on the site** moves a reference upload to the site, through
 *     [[REQ-213]]'s role route (`POST /api/material/role`), which also places it.
 *     Offered only where that route would succeed: an upload (`reviseRole` refuses
 *     anything else) that is still reference.
 *   - **Delete**, [[REQ-281]]'s erasure (`DELETE /api/material`), always asked
 *     first, in a dialog that stays open until the origin has answered.
 *
 * DELETE LOOKS DANGEROUS, AT BOTH STEPS. A real button with a trash icon and the
 * word, in the shell's danger colour — on the control that opens the dialog and on
 * the dialog's own confirm. Its accessible name stays {@link DELETE_LABEL}: the
 * icon is decoration and the label says where it deletes from.
 */
import { createModalShell, modalButton, modalFooter } from './modal.js'

/** The delete control's accessible name — [[REQ-281]]: it says where it goes from. */
export const DELETE_LABEL = 'Delete this from your Library'

/** What the delete control shows beside its icon. */
export const DELETE_TEXT = 'Delete'

/** The dialog's own confirm button. Short, because the title carries the noun. */
const DELETE_CONFIRM = 'Delete'

/** The way out, and the control that holds focus. */
const DELETE_CANCEL = 'Keep it'

/** The one-step move from background reading to the site. */
export const USE_ON_SITE = 'Use on the site'

/** Its longer explanation, for the tooltip. */
const USE_ON_SITE_TITLE = 'Make this a site asset, so it can go on your site'

/**
 * What a client loses, said in their terms — [[REQ-281]].
 *
 * THE RECIPE IS NAMED ONLY WHERE THERE IS ONE. *"Any edits you have made to it"*
 * is a true sentence about an uncropped PDF and a meaningless one, and a
 * confirmation that lists consequences a reader cannot place is a confirmation
 * they stop reading.
 */
const WHAT_GOES = 'The file itself and what we wrote about it are gone.'
const EDITS_GO = 'The crop and the adjustments you made to it go with it.'

/** A deleted number stops meaning anything to the consultant too ([[REQ-280]]). */
const NAME_GOES = (name) =>
  `If we have been calling it ${name}, that name will stop meaning anything.`

/**
 * **THE SENTENCE THE WHOLE CTA TURNS ON** — [[REQ-281]]. Placement COPIES the
 * bytes, so a picture on a page is the site's own file and deleting the Library
 * row cannot take it down. The natural assumption is the opposite one.
 */
const PLACED_STAYS =
  'It stays on your site. The page has its own copy, so this does not take the ' +
  'picture down — taking it down is a change to the page.'

/** The only way back, stated so nobody goes looking for a bin. */
const COMES_BACK = 'If you want it again you will have to upload it again.'

/** What a refused deletion opens with. */
const DELETE_FAILED = 'That could not be deleted'

const SVG_NS = 'http://www.w3.org/2000/svg'

function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text != null) node.textContent = text
  return node
}

function placedList(row) {
  return Array.isArray(row.placed_on) ? row.placed_on : []
}

/** A trash can, drawn in the current colour. Decorative: hidden from readers. */
function trashIcon() {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('class', 'builder-danger__icon')
  svg.setAttribute('viewBox', '0 0 16 16')
  svg.setAttribute('width', '14')
  svg.setAttribute('height', '14')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  const path = document.createElementNS(SVG_NS, 'path')
  path.setAttribute('fill', 'currentColor')
  path.setAttribute(
    'd',
    'M6 1h4l1 1h3v2H2V2h3l1-1zM3 5h10l-.8 9.1A1 1 0 0 1 11.2 15H4.8a1 1 0 0 1-1-.9L3 5zm3 2v6h1V7H6zm3 0v6h1V7H9z',
  )
  svg.append(path)
  return svg
}

/**
 * Whether *Use on the site* would succeed on this row: an upload that is still
 * reference. The same rule `reviseRole` enforces, so a control that always fails
 * is never offered.
 */
export function canUseOnSite(row) {
  return Boolean(row) && row.role === 'reference' && (row.origin ?? 'uploaded') === 'uploaded'
}

/**
 * A button that does not let its click reach a clickable container — a Library
 * row opens its detail when clicked, and pressing an action on it must not.
 */
function actionButton(className, onClick) {
  const button = el('button', className)
  button.type = 'button'
  button.addEventListener('click', (event) => {
    event.stopPropagation()
    onClick()
  })
  return button
}

/** The *Use on the site* control. */
export function useOnSiteButton(onClick) {
  const button = actionButton('builder-action', onClick)
  button.textContent = USE_ON_SITE
  button.title = USE_ON_SITE_TITLE
  button.dataset.action = 'use-on-site'
  return button
}

/** The delete control: one style everywhere, trash icon and the word, danger colour. */
export function deleteButton(onClick, className = '') {
  const button = actionButton(`builder-danger${className ? ` ${className}` : ''}`, onClick)
  button.append(trashIcon(), el('span', 'builder-danger__text', DELETE_TEXT))
  button.setAttribute('aria-label', DELETE_LABEL)
  button.title = DELETE_LABEL
  button.dataset.action = 'delete'
  return button
}

/**
 * What the confirmation says about THIS item — [[REQ-281]]. Each line is
 * conditioned on a fact the row already carries.
 */
export function deletionLines(row) {
  const lines = [WHAT_GOES]
  if (Array.isArray(row.edits) && row.edits.length > 0) lines.push(EDITS_GO)
  if (row.label) lines.push(NAME_GOES(row.label))
  if (placedList(row).length > 0) lines.push(PLACED_STAYS)
  lines.push(COMES_BACK)
  return lines
}

/**
 * Ask before deleting, and say what will and will not happen — [[REQ-281]].
 *
 * **CANCEL TAKES FOCUS**: a return press aimed at something else must not land on
 * the control that deletes a client's file. **IT STAYS OPEN UNTIL THE ORIGIN HAS
 * ANSWERED**: this is the one write that cannot be rolled back by redrawing, so a
 * refusal has to reach the person who asked, in the dialog they are looking at.
 *
 * @param {object} spec
 * @param {object} spec.row        the material row being deleted
 * @param {Element|null} [spec.host] where the dialog mounts
 * @param {(uid: string) => Promise<unknown>} spec.remove the origin's delete
 * @param {() => void} [spec.onDeleted]  after the origin has said yes
 * @param {() => void} [spec.onClose]    on every way out
 * @returns the modal handle
 */
export function confirmDelete({ row, host = null, remove, onDeleted = () => {}, onClose = () => {} }) {
  const name = row.label || row.title || row.filename
  const modal = createModalShell({ host, title: `Delete ${name}?`, onClose })
  modal.panel.append(el('h2', 'builder-modal__title', `Delete ${name}?`))
  for (const line of deletionLines(row)) {
    modal.panel.append(el('p', 'builder-library__confirm', line))
  }
  // EMPTY RATHER THAN ABSENT, hidden by the stylesheet's `:empty`, so announcing
  // into it does not depend on having just inserted it.
  const failed = el('p', 'builder-library__confirm-failed')
  failed.setAttribute('role', 'status')
  modal.panel.append(failed)

  const cancel = modalButton(DELETE_CANCEL, 'builder-modal__btn', () => modal.close())
  const confirm = modalButton(
    DELETE_CONFIRM,
    'builder-modal__btn builder-danger builder-library__confirm-delete',
    async () => {
      confirm.disabled = true
      cancel.disabled = true
      failed.textContent = ''
      try {
        await remove(row.uid)
      } catch (err) {
        // THE ORIGIN'S OWN SENTENCE, unaltered.
        failed.textContent = `${DELETE_FAILED}: ${err.message}`
        confirm.disabled = false
        cancel.disabled = false
        return
      }
      modal.close()
      onDeleted()
    },
  )
  confirm.prepend(trashIcon())
  modal.panel.append(modalFooter([cancel, confirm]))
  modal.mount()
  cancel.focus()
  return modal
}
