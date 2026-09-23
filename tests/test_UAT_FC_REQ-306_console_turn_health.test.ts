// @vitest-environment jsdom
/**
 * [[REQ-306]] — **the operator console shows a business whose turns are dying**.
 *
 * WHAT MAKES THIS EVIDENCE. The section is the SHIPPED `{id, label, mount}` the
 * console's detail pane registers, mounted into a real DOM and read back as an
 * operator would see it. Its one read is injected because that is the network
 * seam the module already declares; the sibling `.workers` suite is what proves
 * the route behind it against a real D1. What is at stake HERE is the surface:
 * what is shown, what is shouted, and what is deliberately not added up.
 *
 * THE SENTENCE THIS SECTION EXISTS TO PUT ON A SCREEN. A tenant failed every
 * turn for a period, and the operator's own console said nothing — every figure
 * it carried was about money. The alarm below is the whole remedy: it names a
 * RUN, because a run is what distinguishes *broken now* from *a bad afternoon
 * once*, and those were indistinguishable in every artefact that existed when
 * the incident happened.
 *
 * THE FALSIFIERS:
 *
 *   - *a total in place of the run*, which reads identically for an outage and
 *     for a busy week;
 *   - *abandoned and died summed into one "did not complete"*, which would let
 *     ordinary tab-closing hide an outage;
 *   - *the alarm below the table*, where it is scrolled past by the one reader
 *     it exists for;
 *   - *a missing cell for a state with a zero*, which is the same thing as a
 *     missing cell for a state nobody has counted;
 *   - *the whole pane taken down by a read that failed*, which would hide who
 *     owns the business because its ledger was unavailable.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { turnHealthSection, TURN_HEALTH_ID } from '../apps/control-app/src/builder/turn-health.js'
import * as CONFIG from '../apps/control-app/src/builder/config.js'

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

let host: HTMLElement

beforeEach(() => {
  document.body.replaceChildren()
  host = document.createElement('div')
  document.body.append(host)
})

const SELECTION = { site: { site: 'site_salon', business: 'biz_salon' }, period: {} }

/** One row as `/api/admin/turns` answers it. */
function turn(state: string, over: Record<string, unknown> = {}) {
  return {
    turn: `turn_${state}`,
    session: 'site_salon',
    startedAt: '2026-09-22T12:00:00.000Z',
    endedAt: state === 'lost' || state === 'open' ? null : '2026-09-22T12:00:30.000Z',
    outcome: state === 'lost' || state === 'open' ? null : state,
    detail: null,
    state,
    ...over,
  }
}

function mount(answer: unknown, fails = false) {
  const section = turnHealthSection({
    fetchTurns: async () => {
      if (fails) throw new Error('the ledger is unavailable')
      return answer
    },
  })
  expect(section.id).toBe(TURN_HEALTH_ID)
  expect(section.label).toBe(CONFIG.TURN_HEALTH_LABEL)
  return section.mount(host, SELECTION)
}

const cell = (state: string) =>
  host.querySelector(`[data-state="${state}"] .builder-turn-health__figure`)?.textContent

describe('REQ-306 the console shows a business failing its turns', () => {
  it('test_UAT_FC_REQ-306_a_run_of_deaths_is_shouted_above_the_figures', async () => {
    // THE INCIDENT ON SCREEN. Three deaths at the head of the list is a site
    // that is broken as the operator reads it, and the alarm is the only line on
    // this console allowed to say so loudly.
    mount({
      business: 'biz_salon',
      counts: { complete: 1, aborted: 0, error: 0, lost: 3, open: 0 },
      consecutiveLost: 3,
      turns: [turn('lost'), turn('lost'), turn('lost'), turn('complete')],
    })
    await settle()

    const alarm = host.querySelector('.builder-turn-health__alarm')
    expect(alarm?.textContent).toContain('last 3 turns')
    // ABOVE THE TABLE IT IS DERIVED FROM. A sentence placed after a grid is a
    // sentence the reader it was written for has already scrolled past.
    const view = host.querySelector('.builder-turn-health')!
    expect(view.firstElementChild).toBe(alarm)

    // THE FOUR STATES ARE NAMED AND NEVER SUMMED: a turn the customer abandoned
    // and a turn the platform killed are not one figure.
    expect(cell('lost')).toBe('3')
    expect(cell('complete')).toBe('1')
    expect(cell('aborted')).toBe('0')
  })

  it('test_UAT_FC_REQ-306_a_healthy_business_is_not_shouted_at', async () => {
    // THE FALSIFIER. An alarm that is always on the pane is an alarm nobody
    // reads, and every zero is still shown — a missing *Died* cell and a *Died*
    // cell reading zero say the same thing to somebody scanning, and only one of
    // them survives the first turn that dies.
    mount({
      business: 'biz_salon',
      counts: { complete: 9, aborted: 1, error: 0, lost: 0, open: 1 },
      consecutiveLost: 0,
      turns: [turn('open'), turn('complete'), turn('aborted')],
    })
    await settle()

    expect(host.querySelector('.builder-turn-health__alarm')).toBeNull()
    expect(cell('lost')).toBe('0')
    expect(cell('open')).toBe('1')
  })

  it('test_UAT_FC_REQ-306_each_row_names_the_conversation_and_the_turn', async () => {
    // REQUIREMENT 4 AT THE PIXEL. The identifiers are printed whole, so the
    // string on screen is the string an operator pastes into a tail or a query
    // rather than one they have to translate back first — and the reason, where
    // the turn had one, sits with the row it belongs to.
    mount({
      business: 'biz_salon',
      counts: { complete: 0, aborted: 0, error: 1, lost: 0, open: 0 },
      consecutiveLost: 0,
      turns: [
        turn('error', {
          turn: 'turn_0123456789abcdef0123456789abcdef',
          session: 'site-salon-key',
          detail: 'the assistant ran out of room',
        }),
      ],
    })
    await settle()

    const row = host.querySelector('.builder-turn-health__recent .builder-turn-health__row:not(.builder-turn-health__head)')!
    expect(row.querySelector('[data-column="session"]')?.textContent).toBe('site-salon-key')
    expect(row.querySelector('[data-column="turn"]')?.textContent).toBe(
      'turn_0123456789abcdef0123456789abcdef',
    )
    expect(row.querySelector('[data-column="state"]')?.textContent).toBe(
      CONFIG.TURN_HEALTH_STATES.error,
    )
    expect(host.querySelector('.builder-turn-health__detail')?.textContent).toBe(
      'the assistant ran out of room',
    )
  })

  it('test_UAT_FC_REQ-306_a_ledger_that_cannot_be_read_says_so_and_nothing_else', async () => {
    // A SECTION THAT FAILS IS A SECTION, not a pane. The console's other blocks
    // must still tell the operator whose business this is and where the site is;
    // this one says what it could not do and stops.
    mount(null, true)
    await settle()

    expect(host.querySelector('.builder-turn-health__error')?.textContent).toContain(
      'the ledger is unavailable',
    )
    expect(host.querySelector('.builder-turn-health__alarm')).toBeNull()
  })

  it('test_UAT_FC_REQ-306_a_business_with_no_turns_reads_as_quiet', async () => {
    // *Nothing, never zero* applied to an alarm: a business nobody has talked to
    // must not look like an outage.
    mount({
      business: 'biz_salon',
      counts: { complete: 0, aborted: 0, error: 0, lost: 0, open: 0 },
      consecutiveLost: 0,
      turns: [],
    })
    await settle()

    expect(host.querySelector('.builder-turn-health__empty')?.textContent).toBe(
      CONFIG.TURN_HEALTH_NONE,
    )
    expect(host.querySelector('.builder-turn-health__alarm')).toBeNull()
  })
})
