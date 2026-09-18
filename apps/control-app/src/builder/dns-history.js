/**
 * **What we have changed about your domain** — the card in the conversation, and
 * the history on the settings pane ([[REQ-260]]).
 *
 * ONE MODULE, TWO SURFACES, and they are here together because they say the same
 * sentence with the same button under it. The card is the sentence at the moment
 * it happens; the history is the same sentence a year later, when the
 * conversation has scrolled away and the client is looking for the thing they
 * half remember. Two files would be two vocabularies for one fact, and the one
 * that drifted would be the one nobody had open.
 *
 * **THE CARD IS NOT A CONFIRMATION, AND THAT IS THE WHOLE DESIGN DECISION.** The
 * obvious shape is: the assistant proposes, a card asks, the change applies on
 * approval. It sounds safe and it is not — [[EPIC-5]] settled the same argument
 * one layer up, in bold: *a confirmation step they cannot meaningfully perform is
 * worse than none, because it launders our error into their approval.* The
 * client is a tech novice and DNS is arcane; they would click yes, and the first
 * time we break somebody's mail the audit trail would show they approved it.
 * That record would be true and worthless.
 *
 * SO IT SAYS WHAT IS HAPPENING, IN THE PRESENT TENSE, WITH THEIR NOUNS, AND
 * OFFERS AN UNDO. A brake rather than a gate. There is no `Yes`, no `No`, no
 * `Approve`, and nothing on this surface that names a record type — if a client
 * is being shown one, we have failed ([[REQ-259]]).
 *
 * THE SAFETY IS NOT HERE AND MUST NOT BE. Every rule lives in `dns-ops.ts`, on
 * the far side of the origin, where it holds for a caller that renders no card
 * at all. A guard in this file would be a guard that a caller could route around
 * by not being this file.
 *
 * AND THE UNDO'S REFUSAL IS A SENTENCE. *"I can't undo this — your settings have
 * changed since then"* is a real answer, shown verbatim, because it was written
 * to be read out. It is not an error state and is not drawn as one.
 */

import { fetchDnsChanges, undoDnsChange } from './api.js'

export const DNS_HISTORY_TITLE = 'Changes to your domain'

/**
 * Said above the list, and only when there is one.
 *
 * IT NAMES WHAT THE LIST IS FOR rather than what it contains. A client opening
 * Settings is not looking for an audit log; they are looking for *"what did it
 * do, and can I take it back"*.
 */
export const DNS_HISTORY_HINT =
  'Everything we have changed about your domain, newest first. You can put any ' +
  'of it back.'

/** What a business with nothing changed yet is told — which is most of them. */
export const DNS_HISTORY_EMPTY = 'Nothing has been changed about your domain.'

export const UNDO_LABEL = 'Undo'
export const UNDONE_LABEL = 'Put back'

/** Whose the button is. A member who may not change the domain may not undo one. */
export const ASK_THE_HOLDER =
  'Ask whoever owns the account if you need one of these put back.'

function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

/**
 * When it happened, as a client reads a date.
 *
 * THE DAY AND NOT THE SECOND. A change's exact timestamp is a support question,
 * and a list of them reads as machinery; *"17 September"* is what somebody
 * scanning for the change they half remember is actually matching against.
 */
export function whenText(iso, now = new Date()) {
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return ''
  const days = Math.floor((now.getTime() - at.getTime()) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return at.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })
}

/**
 * One entry: the sentence, when it was, and an Undo where there is one to press.
 *
 * SHARED BY BOTH SURFACES, which is what keeps the card and the history from
 * saying the same change two different ways.
 *
 * @param {{change: string, summary: string, at?: string, undone?: boolean,
 *          undoable?: boolean}} entry
 * @param {{onUndo?: Function, mayUndo?: boolean, now?: Date}} [options]
 */
export function renderChange(entry, options = {}) {
  const { onUndo = null, mayUndo = true, now = undefined } = options
  const row = el('div', 'builder-dns-change')
  const said = el('p', 'builder-dns-change__summary', entry.summary ?? '')
  row.append(said)

  const foot = el('div', 'builder-dns-change__foot')
  const when = entry.at ? whenText(entry.at, now ?? new Date()) : ''
  if (when) foot.append(el('span', 'builder-dns-change__when', when))

  // ALREADY PUT BACK IS A STATE AND NOT A DISABLED BUTTON. A control that cannot
  // do anything, with no sentence saying why, is how a client learns the surface
  // is unreliable.
  if (entry.undone) {
    foot.append(el('span', 'builder-dns-change__undone', UNDONE_LABEL))
    row.append(foot)
    return row
  }

  const undoable = entry.undoable !== false && typeof onUndo === 'function' && mayUndo
  if (!undoable) {
    row.append(foot)
    return row
  }

  const note = el('p', 'builder-dns-change__note', '')
  note.setAttribute('role', 'status')
  const button = el('button', 'builder-dns-change__undo', UNDO_LABEL)
  button.type = 'button'
  button.addEventListener('click', () => {
    if (button.disabled) return
    button.disabled = true
    note.textContent = ''
    Promise.resolve(onUndo(entry.change))
      .then(() => {
        button.remove()
        foot.append(el('span', 'builder-dns-change__undone', UNDONE_LABEL))
      })
      .catch((err) => {
        // SHOWN VERBATIM. The refusal was written to be read out — it says what
        // has moved and where to go — and a re-worded version of it here would be
        // a second voice on one subject.
        button.disabled = false
        note.textContent = err instanceof Error ? err.message : String(err)
      })
  })
  foot.append(button)
  row.append(foot, note)
  return row
}

/**
 * The card, for the conversation.
 *
 * IT IS APPENDED INTO AN ASSISTANT BUBBLE the panel has already created, rather
 * than being a message of its own: the change happened as part of what the
 * assistant was doing, and a separate bubble would read as a second speaker.
 *
 * @param {Element} host where to put it — a message element from the chat panel.
 * @param {{change: string, summary: string, settles_by?: string}} change
 * @param {{onUndo?: Function}} [options]
 */
export function appendDnsCard(host, change, options = {}) {
  const card = el('div', 'builder-dns-card')
  card.append(
    renderChange(
      { change: change.change, summary: change.summary, undoable: true },
      { onUndo: options.onUndo ?? null },
    ),
  )
  host.append(card)
  return card
}

/**
 * Mount the section.
 *
 * @param {object} [options]
 * @param {{load?: Function, undo?: Function}} [options.transport] injected by
 *   tests; each defaults to the origin call.
 */
export function createDnsHistorySection(options = {}) {
  const { transport = null } = options
  const load = transport?.load ?? fetchDnsChanges
  const undo = transport?.undo ?? undoDnsChange

  const element = el('section', 'builder-settings__section builder-dns-history')
  const title = el('h3', 'builder-settings__subtitle', DNS_HISTORY_TITLE)
  const body = el('div', 'builder-dns-history__body')
  element.append(title, body)

  /** Whose read is still wanted — `settings.js`'s generation guard, per section. */
  let generation = 0
  let mayUndo = true

  function draw(changes) {
    body.replaceChildren()
    if (!changes || changes.length === 0) {
      body.append(el('p', 'builder-settings__hint', DNS_HISTORY_EMPTY))
      return
    }
    body.append(el('p', 'builder-settings__hint', DNS_HISTORY_HINT))
    for (const change of changes) {
      body.append(
        renderChange(change, {
          mayUndo,
          onUndo: async (id) => {
            await undo(id)
            // RE-READ RATHER THAN PATCHED. An undo is itself a change and appears
            // in this list as one, so the honest redraw is the one that asks the
            // origin what the history now is.
            await refresh()
          },
        }),
      )
    }
    if (!mayUndo) body.append(el('p', 'builder-settings__hint', ASK_THE_HOLDER))
  }

  async function refresh() {
    const mine = ++generation
    const answer = await load().catch(() => null)
    if (mine !== generation) return
    if (!answer) return
    mayUndo = answer.mayUndo !== false
    draw(answer.changes ?? [])
  }

  return {
    element,
    /** Read the history and draw it. */
    refresh,
    /** Forget it — a business switch, before the next read lands. */
    clear() {
      generation += 1
      body.replaceChildren()
    },
    destroy() {
      element.remove()
    },
  }
}
