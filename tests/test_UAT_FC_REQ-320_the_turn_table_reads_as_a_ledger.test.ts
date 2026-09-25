// @vitest-environment jsdom
/**
 * [[REQ-320]] — **the recent-turn table stops being a wall of identifiers and
 * becomes a ledger**.
 *
 * WHAT WAS WRONG WITH THE SURFACE [[REQ-306]] SHIPPED. It succeeded at the alarm
 * and failed at the rows. Two of its four columns were an identifier repeated
 * unchanged down every row of a pane already scoped to one business and an opaque
 * turn id; the stamp was ISO-8601 in UTC, so an operator who watched a turn happen
 * at 19:05 was shown `02:05` and had to do arithmetic before answering the only
 * question that column is ever asked; and what the turn COST — the figure EPIC-20
 * exists to read — was not on the pane at all.
 *
 * WHAT MAKES THIS EVIDENCE. The section is the SHIPPED `{id, label, mount}` the
 * console's detail pane registers, mounted into a real DOM and read back as an
 * operator would read it, with its one network read injected at the seam the
 * module already declares. The sibling `.workers` suite is what proves the route
 * behind it puts a cost on the wire against a real D1 and a real price table.
 *
 * THE FALSIFIERS:
 *
 *   - *the stored stamp printed verbatim*, which is the defect — a reader who has
 *     to convert a zone does not read the column;
 *   - *a stamp to the minute*, which renders a retry and the turn it retried as
 *     one moment, since recent turns routinely sit seconds apart;
 *   - *an identifier still in a column*, or merely moved to a narrower one;
 *   - *`$0.00` where nothing was measured*, which claims a turn that died was
 *     free — and would make the dash and a genuinely free turn one fact;
 *   - *the failure sentence lost with the columns*, which is the part of
 *     [[REQ-306]] that already worked.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { turnHealthSection } from '../apps/control-app/src/builder/turn-health.js'
import * as CONFIG from '../apps/control-app/src/builder/config.js'

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

let host: HTMLElement

beforeEach(() => {
  document.body.replaceChildren()
  host = document.createElement('div')
  document.body.append(host)
})

const SELECTION = { site: { site: 'site_salon', business: 'biz_salon' }, period: {} }

/** One row as `/api/admin/turns` answers it, cost included. */
function turn(over: Record<string, unknown> = {}) {
  return {
    turn: 'turn_0123456789abcdef0123456789abcdef',
    session: 'site-salon-key',
    startedAt: '2026-09-22T12:00:00.000Z',
    endedAt: '2026-09-22T12:00:30.000Z',
    outcome: 'complete',
    detail: null,
    state: 'complete',
    costMicros: null,
    ...over,
  }
}

/** The same row as a route that has not joined the meter would send it. */
function unmetered(row: Record<string, unknown>) {
  const { costMicros: _absent, ...rest } = row
  return rest
}

function mount(turns: unknown[]) {
  const section = turnHealthSection({
    fetchTurns: async () => ({
      business: 'biz_salon',
      counts: { complete: turns.length, aborted: 0, error: 0, lost: 0, open: 0 },
      consecutiveLost: 0,
      turns,
    }),
  })
  return section.mount(host, SELECTION)
}

const rows = () =>
  [
    ...host.querySelectorAll(
      '.builder-turn-health__recent .builder-turn-health__row:not(.builder-turn-health__head)',
    ),
  ] as HTMLElement[]

const columnOf = (row: Element, id: string) =>
  row.querySelector(`[data-column="${id}"]`)?.textContent

describe('REQ-320 the recent-turn table reads as a ledger', () => {
  it('test_UAT_FC_REQ-320_the_stamp_reads_in_the_readers_own_zone_to_the_second', async () => {
    // THE DEFECT, AT THE PIXEL. `2026-09-22T12:00:00.000Z` is what the ledger
    // stores and what the column used to print. What an operator needs is the
    // moment in THEIR zone — which is what `Date`'s local getters mean by
    // definition, whatever zone this test happens to run in — and to the SECOND,
    // because two turns seconds apart must not read as one.
    const startedAt = '2026-09-22T12:34:56.000Z'
    mount([turn({ startedAt })])
    await settle()

    const shown = columnOf(rows()[0], 'started')!
    expect(shown).not.toBe(startedAt)
    expect(shown).not.toContain('T')
    expect(shown).not.toContain('Z')
    const local = new Date(startedAt)
    expect(shown).toContain(String(local.getFullYear()))
    // Hour in whatever clock the reader's locale uses, then the minute and the
    // second: a stamp to the minute is the falsifier this last one closes.
    expect(shown).toMatch(new RegExp(`${local.getHours() % 12 || local.getHours()}`))
    expect(shown).toContain(`${String(local.getMinutes()).padStart(2, '0')}`)
    expect(shown).toContain(`${String(local.getSeconds()).padStart(2, '0')}`)

    // ONE DEFINITION SITE. The format is declared beside the labels in
    // `config.js`, under that file's own rule, so a change to it moves the whole
    // surface rather than one of two spellings.
    expect(shown).toBe(CONFIG.TURN_HEALTH_STARTED(startedAt))

    // A STAMP THE LEDGER HOLDS THAT WILL NOT PARSE IS STILL SHOWN. It is the text
    // somebody diagnosing the row needs, and *Invalid Date* is not.
    expect(CONFIG.TURN_HEALTH_STARTED('not a date')).toBe('not a date')
  })

  it('test_UAT_FC_REQ-320_no_column_carries_an_identifier', async () => {
    // WHAT WENT. Three columns in the order a reader asks them, addressed by
    // `data-column` rather than by position — and the two identifiers are gone
    // from the table entirely, not merely narrowed. The failure sentence beneath
    // the row is untouched: it is the part of REQ-306 that already worked.
    mount([
      turn({
        state: 'error',
        outcome: 'error',
        detail: 'the assistant ran out of room',
        costMicros: 4_000,
      }),
    ])
    await settle()

    const head = host.querySelector('.builder-turn-health__head')!
    expect([...head.querySelectorAll('[data-column]')].map((c) => c.getAttribute('data-column'))).toEqual(
      ['started', 'state', 'cost'],
    )
    expect(Object.keys(CONFIG.TURN_HEALTH_COLUMNS)).toEqual(['started', 'state', 'cost'])

    const section = host.querySelector('.builder-turn-health__recent')!
    expect(section.querySelector('[data-column="session"]')).toBeNull()
    expect(section.querySelector('[data-column="turn"]')).toBeNull()
    // Not anywhere in the text either — a column removed from the heading and
    // still printed in the row would read as the same defect.
    expect(section.textContent).not.toContain('site-salon-key')
    expect(section.textContent).not.toContain('turn_0123456789abcdef0123456789abcdef')

    expect(columnOf(rows()[0], 'state')).toBe(CONFIG.TURN_HEALTH_STATES.error)
    expect(host.querySelector('.builder-turn-health__detail')?.textContent).toBe(
      'the assistant ran out of room',
    )
  })

  it('test_UAT_FC_REQ-320_what_the_turn_cost_is_the_rightmost_column', async () => {
    // THE FIGURE EPIC-20 CAME FOR, formatted by the money function the cost pane
    // already uses rather than by a second one free to round differently.
    mount([turn({ costMicros: 1_520_000 })])
    await settle()

    expect(columnOf(rows()[0], 'cost')).toBe('$1.52')
    const head = host.querySelector('.builder-turn-health__head')!
    expect(head.querySelector('[data-column="cost"]')?.textContent).toBe(
      CONFIG.TURN_HEALTH_COLUMNS.cost,
    )
    // Rightmost, because it is the figure the eye lands on last and the one a
    // column of numbers is read down.
    expect(head.lastElementChild?.getAttribute('data-column')).toBe('cost')
  })

  it('test_UAT_FC_REQ-320_a_turn_with_no_spend_row_shows_the_dash_and_never_zero', async () => {
    // ABSENCE IS ORDINARY HERE AND WILL BE COMMON: a turn in flight, a turn that
    // died, and a turn that failed before its terminal meta arrived have no meter
    // row at all. *Nothing, never zero* — and the third row is what makes the
    // distinction load-bearing rather than rhetorical: a turn that genuinely cost
    // nothing is a DIFFERENT fact and must not read as an unmeasured one.
    mount([
      turn({ state: 'lost', outcome: null, endedAt: null, costMicros: null }),
      unmetered(turn({ state: 'open', outcome: null, endedAt: null })),
      turn({ costMicros: 0 }),
    ])
    await settle()

    const [died, inFlight, free] = rows()
    expect(columnOf(died, 'cost')).toBe(CONFIG.TENANT_COST_NOTHING)
    expect(columnOf(died, 'cost')).not.toBe('$0.00')
    // The field absent altogether reads as the dash too, so a route that has not
    // yet joined the meter cannot make every turn look free.
    expect(columnOf(inFlight, 'cost')).toBe(CONFIG.TENANT_COST_NOTHING)
    expect(columnOf(free, 'cost')).toBe('$0.00')
  })
})
