/**
 * Turn health ([[REQ-306]]) — the console detail pane's answer to *is this site
 * failing turns, and is it failing them right now*.
 *
 * THE FAILURE THIS SECTION EXISTS FOR. A tenant's every turn died mid-stream for
 * a period. The customer was told the connection to the reply had been lost; the
 * operator was told nothing at all, because every record this system kept of a
 * turn was written by code that ran after the model call and therefore died with
 * it. The ledger behind this section is written BEFORE the turn instead, so a row
 * nobody closed is the turn's death recorded by its own absence — and this is
 * where an operator sees that without a customer telling them first.
 *
 * IT RENDERS THE ROUTE'S ANSWER AND DERIVES NOTHING. Which turns are lost, and
 * how long the run at the head of the list is, are decided by `turn-log.ts`
 * beside the ceiling they depend on. A surface that re-derived either would be a
 * second opinion about the one fact the whole ticket turns on, free to disagree
 * with the tally printed next to it.
 *
 * THE FOUR STATES ARE NEVER SUMMED. A turn the customer abandoned and a turn the
 * platform killed are both *turns that did not complete*, and a figure that added
 * them would let a busy afternoon hide an outage.
 *
 * IT IS A SECTION AND NOT THE PANE, exactly as `tenant-cost.js` is: it is handed
 * `{id, label, mount}` and a failure here is reported in its own block while the
 * account, the address and the cost still render.
 */

import {
  TURN_HEALTH_COLUMNS,
  TURN_HEALTH_FAILING,
  TURN_HEALTH_LABEL,
  TURN_HEALTH_NONE,
  TURN_HEALTH_READING,
  TURN_HEALTH_RECENT,
  TURN_HEALTH_STATES,
} from './config.js'
import { fetchTenantTurns } from './api.js'

export const TURN_HEALTH_ID = 'turn-health'

function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

/**
 * The section, ready to register with the console's detail pane.
 *
 * ITS READ IS INJECTED, defaulting to `api.js`, for `tenantCostSection`'s
 * reason: a UAT mounts the real element against a planted answer and reads back
 * what an operator would see, rather than asserting against a mock of the
 * surface itself.
 *
 * IT TAKES NO PERIOD, where every other section on this pane does. The console's
 * period governs a meter; this is about the most recent turns whatever window
 * the operator has chosen, because a run of deaths at the head of the list is
 * the thing being looked for and a window is what would hide it.
 *
 * @param {object} [spec]
 * @param {(business: string) => Promise<object>} [spec.fetchTurns]
 */
export function turnHealthSection({ fetchTurns = fetchTenantTurns } = {}) {
  return {
    id: TURN_HEALTH_ID,
    label: TURN_HEALTH_LABEL,
    mount: (container, selection) => mountTurnHealth(container, selection, { fetchTurns }),
  }
}

function mountTurnHealth(container, { site }, { fetchTurns }) {
  let live = true

  container.append(el('p', 'builder-turn-health__loading', TURN_HEALTH_READING))

  ;(async () => {
    let answer = null
    try {
      answer = await fetchTurns(site.business)
    } catch (err) {
      if (!live) return
      container.replaceChildren(
        el(
          'p',
          'builder-turn-health__error',
          `This business's turns could not be read: ${
            err instanceof Error ? err.message : String(err)
          }`,
        ),
      )
      return
    }
    if (!live) return
    const view = el('div', 'builder-turn-health')
    /**
     * THE ALARM FIRST, ABOVE THE FIGURES IT IS DERIVED FROM. An operator who
     * reads nothing else must still read this one, and a sentence placed after a
     * table is a sentence somebody scrolls past.
     */
    if (answer?.consecutiveLost > 0) {
      view.append(
        el('p', 'builder-turn-health__alarm', TURN_HEALTH_FAILING(answer.consecutiveLost)),
      )
    }
    view.append(countsOf(answer?.counts ?? {}), recentOf(answer?.turns ?? []))
    container.replaceChildren(view)
  })()

  return {
    destroy() {
      // THE FLAG AND NOT AN ABORT, on `tenant-cost.js`'s reasoning: the read is
      // an ordinary `fetch` whose only effect is to paint, and a pane swapped
      // mid-read must only be stopped from painting into a detached tree.
      live = false
    },
  }
}

/**
 * One cell per state, in the order the labels declare.
 *
 * EVERY STATE IS SHOWN, INCLUDING THE ZEROES. A missing *Died* cell and a *Died*
 * cell reading zero say the same thing to a reader who is scanning, and only one
 * of them survives the first turn that dies.
 */
function countsOf(counts) {
  const row = el('div', 'builder-turn-health__counts')
  for (const [state, label] of Object.entries(TURN_HEALTH_STATES)) {
    const cell = el('div', 'builder-turn-health__count')
    cell.dataset.state = state
    cell.append(
      el('span', 'builder-turn-health__subheading', label),
      el('span', 'builder-turn-health__figure', `${counts[state] ?? 0}`),
    )
    row.append(cell)
  }
  return row
}

/**
 * The rows themselves — [[REQ-306]]'s fourth requirement, which is that a record
 * name the site, the conversation and the turn.
 *
 * THE CONVERSATION ID IS PRINTED WHOLE and not prettified into a site name. It
 * is `site-<key>` or `business-<id>`, which is what the transcript ticket is
 * found by and what a tail is searched for — so the string on screen is the
 * string an operator pastes somewhere else, rather than one they have to
 * translate back first.
 */
function recentOf(turns) {
  const section = el('div', 'builder-turn-health__recent')
  section.append(el('h4', 'builder-turn-health__heading', TURN_HEALTH_RECENT))
  if (turns.length === 0) {
    section.append(el('p', 'builder-turn-health__empty', TURN_HEALTH_NONE))
    return section
  }
  const head = el('div', 'builder-turn-health__row builder-turn-health__head')
  for (const [id, label] of Object.entries(TURN_HEALTH_COLUMNS)) {
    const cell = el('span', 'builder-turn-health__cell', label)
    cell.dataset.column = id
    head.append(cell)
  }
  section.append(head)
  for (const turn of turns) {
    const row = el('div', 'builder-turn-health__row')
    row.dataset.state = turn.state
    const cells = {
      started: turn.startedAt,
      session: turn.session,
      state: TURN_HEALTH_STATES[turn.state] ?? turn.state,
      turn: turn.turn,
    }
    for (const [id, value] of Object.entries(cells)) {
      const cell = el('span', 'builder-turn-health__cell', value)
      cell.dataset.column = id
      row.append(cell)
    }
    // WHY IT FAILED, WHERE IT SAID. Beneath the row rather than in a column of
    // its own: a message is a sentence and a column is a field, and a sentence
    // squeezed into a grid cell is a sentence nobody reads.
    section.append(row)
    if (turn.detail) {
      section.append(el('p', 'builder-turn-health__detail', turn.detail))
    }
  }
  return section
}
