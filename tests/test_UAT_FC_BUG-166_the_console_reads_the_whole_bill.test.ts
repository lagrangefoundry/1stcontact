// @vitest-environment jsdom
/**
 * [[BUG-166]] — **what the operator reads on the cost pane**: a headline that is
 * the whole bill, a half that is called *Principal spend*, and a turn table whose
 * money is two columns rather than one.
 *
 * WHAT MAKES THIS EVIDENCE. The sections are the SHIPPED `{id, label, mount}`
 * objects the console's detail pane registers, mounted into a real DOM and read
 * back the way an operator reads them, with each one's single network read
 * injected at the seam the module already declares. The sibling `.workers` suites
 * are what prove the routes behind them put these figures on the wire.
 *
 * THE FALSIFIERS:
 *
 *   - *the headline showing the principal half*, which is the defect — and which
 *     is invisible unless a delegated half exists to be missing from it;
 *   - *the pane summing the two halves itself*, which would put a second money
 *     authority in a browser: the figures must be the ones the route settled;
 *   - *the decomposition collapsed into the headline*, which is the
 *     over-correction — the labelled pair must still be two figures;
 *   - *the turn table still carrying one summed cost*, which cannot say which
 *     half a delegating turn spent its money in;
 *   - *`$0.00` in a cell nothing was measured for*, at either level.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { tenantCostSection } from '../apps/control-app/src/builder/tenant-cost.js'
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

/**
 * One business's period, as `/api/admin/spend` answers it for a business that
 * DID delegate — which is the only shape in which the defect is visible.
 */
const DELEGATING = {
  business: 'biz_salon',
  period: { from: null, to: null },
  report: {
    turns: 9,
    engagedHours: 3,
    engagedMs: 10_800_000,
    costMicros: 24_000_000,
    unpricedTurns: 0,
    costPerEngagedHourMicros: 8_000_000,
    byModel: { 'claude-opus-5': { costMicros: 24_000_000 } },
  },
  days: [{ day: '2026-09-20', report: { costMicros: 24_000_000, engagedHours: 3 } }],
  delegated: {
    entries: 2,
    costMicros: 6_000_000,
    unpricedEntries: 0,
    byModel: { 'claude-haiku-4-5': { backend: 'claude_builder', entries: 2, costMicros: 6_000_000 } },
  },
  total: { costMicros: 30_000_000, costPerEngagedHourMicros: 10_000_000 },
}

function mountCost(answer: unknown) {
  const section = tenantCostSection({ fetchTenant: async () => answer })
  return section.mount(host, SELECTION)
}

function mountTurns(turns: unknown[]) {
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

const totalOf = (id: string) =>
  host.querySelector(`[data-total="${id}"] .builder-tenant-cost__figure`)?.textContent

const halfOf = (half: string) =>
  host.querySelector(`[data-half="${half}"] .builder-tenant-cost__figure`)?.textContent

const turnRows = () =>
  [
    ...host.querySelectorAll(
      '.builder-turn-health__recent .builder-turn-health__row:not(.builder-turn-health__head)',
    ),
  ] as HTMLElement[]

const columnOf = (row: Element, id: string) =>
  row.querySelector(`[data-column="${id}"]`)?.textContent

describe('BUG-166 — the console reads the whole bill', () => {
  it('test_UAT_FC_BUG-166_the_headline_is_the_whole_bill_and_the_halves_are_still_two', async () => {
    mountCost(DELEGATING)
    await settle()

    // THE HEADLINE IS THE TOTAL. $24 of its own plus $6 handed off is $30, and
    // $24.00 in this cell — the figure that shipped — is the defect.
    expect(totalOf('cost')).toBe('$30.00')
    expect(totalOf('cost')).not.toBe('$24.00')
    // AND THE RATE MOVES WITH IT, so the two figures beside each other can be
    // divided into one another without producing a third answer.
    expect(totalOf('per-hour')).toBe('$10.00')
    expect(totalOf('hours')).toBe('3')

    // THE DECOMPOSITION IS UNTOUCHED — still two labelled figures, still unsummed
    // below the headline, which is what says where the $30 went.
    expect(halfOf('principal')).toBe('$24.00')
    expect(halfOf('delegated')).toBe('$6.00')
  })

  it('test_UAT_FC_BUG-166_the_principal_half_is_called_principal_spend', async () => {
    mountCost(DELEGATING)
    await settle()

    const heading = host.querySelector(
      '[data-half="principal"] .builder-tenant-cost__subheading',
    )!
    expect(heading.textContent).toBe(CONFIG.TENANT_COST_PRINCIPAL)
    expect(heading.textContent).toBe('Principal spend')
    // The word it replaces is gone from the pane, not merely from this element:
    // one label declared once is what makes that checkable at all.
    expect(host.textContent).not.toContain('Own spend')
  })

  it('test_UAT_FC_BUG-166_the_pane_adds_nothing_and_renders_what_the_route_settled', async () => {
    // THE RULE THIS MODULE IS BUILT ON, restated as a test now that a total
    // exists to be tempted by. The route is the single authority on a figure an
    // operator prices from; a pane that computed its own would be a second one,
    // free to disagree. A `total` the halves do not add up to is not a state the
    // route produces — which is exactly why it proves the pane is only
    // formatting.
    mountCost({
      ...DELEGATING,
      total: { costMicros: 99_000_000, costPerEngagedHourMicros: 33_000_000 },
    })
    await settle()

    expect(totalOf('cost')).toBe('$99.00')
    expect(totalOf('per-hour')).toBe('$33.00')
    expect(halfOf('principal')).toBe('$24.00')
  })

  it('test_UAT_FC_BUG-166_an_unmeasured_period_shows_the_dash_in_the_headline', async () => {
    // NOTHING, NEVER ZERO, at the cell most easily read as a bill.
    mountCost({
      ...DELEGATING,
      report: { ...DELEGATING.report, costMicros: null, costPerEngagedHourMicros: null },
      delegated: null,
      total: { costMicros: null, costPerEngagedHourMicros: null },
    })
    await settle()

    expect(totalOf('cost')).toBe(CONFIG.TENANT_COST_NOTHING)
    expect(totalOf('cost')).not.toBe('$0.00')
    expect(totalOf('per-hour')).toBe(CONFIG.TENANT_COST_NOTHING)
  })

  it('test_UAT_FC_BUG-166_a_turn_shows_a_principal_cost_and_a_delegated_cost', async () => {
    // WHAT THE OPERATOR ASKED FOR, AND WHY. A delegating turn and a turn that did
    // the same work itself are ONE number when the halves are summed and two very
    // different numbers when they are not — which is the whole question EPIC-20
    // is trying to read off this table.
    mountTurns([
      {
        turn: 'turn_bug166_handed',
        session: 'site-salon-key',
        startedAt: '2026-09-22T12:00:00.000Z',
        endedAt: '2026-09-22T12:00:30.000Z',
        outcome: 'complete',
        detail: null,
        state: 'complete',
        principalMicros: 1_500_000,
        delegatedMicros: 20_000,
      },
      {
        turn: 'turn_bug166_own',
        session: 'site-salon-key',
        startedAt: '2026-09-22T12:01:00.000Z',
        endedAt: '2026-09-22T12:01:30.000Z',
        outcome: 'complete',
        detail: null,
        state: 'complete',
        principalMicros: 900_000,
        delegatedMicros: null,
      },
    ])
    await settle()

    const [handed, own] = turnRows()
    expect(columnOf(handed, 'principal')).toBe('$1.50')
    expect(columnOf(handed, 'delegated')).toBe('$0.02')
    // THE TURN THAT DELEGATED NOTHING HAS NO DELEGATED FIGURE. Not `$0.00`, which
    // would claim a delegation that came free — the same rule the cost pane's own
    // delegated half has always followed.
    expect(columnOf(own, 'principal')).toBe('$0.90')
    expect(columnOf(own, 'delegated')).toBe(CONFIG.TENANT_COST_NOTHING)
    expect(columnOf(own, 'delegated')).not.toBe('$0.00')

    // AND THE HEADINGS NAME THEM, because a grid exists so figures can be read
    // DOWN a column and an unnamed column cannot be.
    const head = host.querySelector('.builder-turn-health__head')!
    expect(head.querySelector('[data-column="principal"]')?.textContent).toBe(
      CONFIG.TURN_HEALTH_COLUMNS.principal,
    )
    expect(head.querySelector('[data-column="delegated"]')?.textContent).toBe(
      CONFIG.TURN_HEALTH_COLUMNS.delegated,
    )
    // Nothing on the row is their sum: the two halves are reported, never added.
    expect(handed.textContent).not.toContain('$1.52')
  })
})
