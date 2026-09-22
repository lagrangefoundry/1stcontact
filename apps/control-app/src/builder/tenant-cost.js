/**
 * Tenant cost ([[REQ-297]]'s figures, [[REQ-298]]'s pane) — the cost section of
 * the console's detail pane.
 *
 * THE QUESTION IT ANSWERS is *what did this business cost us over the period*,
 * which is the half of [[REQ-297]] that survived [[REQ-298]] whole. What went is
 * the LEAGUE — a sorted table of every tenant with a row that expanded in place.
 * The ranking is now the console's list, so this renders ONE business's period,
 * into a pane rather than into an expansion. Same route, same arithmetic, same
 * two figures; a different container.
 *
 * IT RENDERS [[REQ-293]]'S REPORT AND COMPUTES NO SECOND OPINION. Every figure
 * on screen arrives from the meter's own route already settled — cost, engaged
 * hours, cost per engaged hour, and the per-day decomposition. This module
 * formats; it does not divide, sum or average. A console that did its own
 * arithmetic would be a second authority on a number an operator is about to
 * price from, free to disagree with the route that is supposed to be the first.
 *
 * NOTHING, NEVER ZERO, ALL THE WAY TO THE PIXEL. A day nobody worked has no row;
 * a business that handed nothing off has no delegated figure. An absent figure
 * renders as a dash, which reads as *there is nothing here* — where `$0.00`
 * would claim a month of free consulting, or a delegation that came free.
 *
 * THE TWO FIGURES ARE NEVER ONE. A caller's true total is its own spend PLUS
 * what it attributed to its workers, so a surface showing a single number
 * under-reports every delegating turn, silently and in the flattering direction:
 * a delegation that moved no work would look exactly like one that worked. So
 * the pane labels both and adds neither, and the delegated half names the model
 * each figure was incurred on — which is how *did construction actually move to
 * the cheap model* is answered by looking rather than by inference.
 *
 * IT IS A SECTION AND NOT THE PANE. `platform-sites.js` knows nothing about any
 * of this; it is handed `{id, label, mount}` and mounts it beside whatever else
 * is registered, and a failure here is reported in this section's own block
 * while the account and the address still render.
 */

import {
  TENANT_COST_BY_DAY,
  TENANT_COST_DAY_COLUMNS,
  TENANT_COST_DELEGATED,
  TENANT_COST_DELEGATED_NONE,
  TENANT_COST_LABEL,
  TENANT_COST_MODEL_COLUMNS,
  TENANT_COST_NOTHING,
  TENANT_COST_PRINCIPAL,
  TENANT_COST_READING,
  TENANT_COST_TOTALS,
  TENANT_COST_UNPRICED,
} from './config.js'
import { fetchTenantSpend } from './api.js'

/** The section's stable id — what `platform-sites.js` puts in `data-section`. */
export const TENANT_COST_ID = 'tenant-cost'

const DAY_MS = 24 * 60 * 60 * 1000

function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

/**
 * Micros as money, or the dash.
 *
 * TWO DECIMALS, WHICH IS WHAT A DOLLAR HAS. The meter stores millionths of one
 * because that is what makes `tokens x rate` exact with no division; a person
 * reading a month's bill wants the unit they will quote, and the rounding
 * happens here — once, on the way to the screen — rather than in any figure
 * another figure is derived from.
 *
 * `null` IS THE DASH AND NEVER `$0.00`, which is this module's whole rule about
 * absence arriving at the one place it is most easily lost. The console's LIST
 * shares this function for exactly that reason: a business with no measured turn
 * shows a dash in the row and a dash in the pane, from one decision.
 */
export function dollars(micros) {
  if (micros === null || micros === undefined) return TENANT_COST_NOTHING
  return `$${(micros / 1_000_000).toFixed(2)}`
}

/** Hours as the report quoted them, or the dash. The report already rounded. */
export function hours(value) {
  if (value === null || value === undefined) return TENANT_COST_NOTHING
  return `${value}`
}

/**
 * The window `days` days back from `now`, as the wire's half-open pair.
 *
 * `to` IS LEFT OPEN. A period that ended "now" would exclude a turn that started
 * while the request was in flight, and the question being asked is *how much
 * lately* rather than *how much up to this instant* — so the window has a floor
 * and no ceiling, which is also what keeps two reads a second apart from
 * disagreeing about a turn in progress.
 *
 * ONE FUNCTION FOR THE LIST AND THE PANE, which is the client half of *one
 * period and not two*. The console orders its rows by a league read over this
 * window and opens a detail over the same one; two derivations of "thirty days"
 * could differ by a millisecond and would be a ranking and a figure that quietly
 * disagreed.
 */
export function periodOfDays(days, now = Date.now()) {
  const span = Number(days)
  if (!Number.isFinite(span) || span <= 0) return { from: null, to: null }
  return { from: new Date(now - span * DAY_MS).toISOString(), to: null }
}

/**
 * The section, ready to register with the console's detail pane.
 *
 * ITS READ IS INJECTED, defaulting to `api.js`. That is what lets a UAT mount
 * the real element against a planted answer and read back what an operator would
 * see, rather than asserting against a mock of the surface itself.
 *
 * IT TAKES THE PERIOD FROM THE SELECTION AND NEVER FROM A FIELD OF ITS OWN.
 * [[REQ-297]]'s control carried the period control because it was the whole
 * console; the console now has one field above the split that governs both
 * halves, so a second one here would be the two-periods bug with a UI.
 *
 * @param {object} [spec]
 * @param {(business: string, period: object) => Promise<object>} [spec.fetchTenant]
 */
export function tenantCostSection({ fetchTenant = fetchTenantSpend } = {}) {
  return {
    id: TENANT_COST_ID,
    label: TENANT_COST_LABEL,
    mount: (container, selection) => mountTenantCost(container, selection, { fetchTenant }),
  }
}

function mountTenantCost(container, { site, period }, { fetchTenant }) {
  let live = true

  container.append(el('p', 'builder-tenant-cost__loading', TENANT_COST_READING))

  ;(async () => {
    let answer = null
    try {
      answer = await fetchTenant(site.business, period)
    } catch (err) {
      if (!live) return
      container.replaceChildren(
        el(
          'p',
          'builder-tenant-cost__error',
          `This business's period could not be read: ${
            err instanceof Error ? err.message : String(err)
          }`,
        ),
      )
      return
    }
    if (!live) return
    /**
     * ONE ROOT AROUND THE THREE BLOCKS, and not three siblings dropped into the
     * section body. The blocks are a headline, a decomposition by day and a
     * decomposition by payer — related closely enough that they need more air
     * between them than the section body gives its ordinary contents, and the
     * only place to say so once is a box that owns all three.
     */
    const view = el('div', 'builder-tenant-cost')
    view.append(totalsOf(answer), daysOf(answer?.days ?? []), splitOf(answer))
    container.replaceChildren(view)
  })()

  return {
    destroy() {
      // THE FLAG AND NOT AN ABORT. The read is an ordinary `fetch` whose only
      // effect is to paint; a pane swapped mid-read must not have its answer land
      // in a detached tree, and that is all this has to prevent.
      live = false
    },
  }
}

/**
 * The three headline figures, above the decomposition.
 *
 * THEY ARE THE LEAGUE'S OWN COLUMNS, MOVED. [[REQ-297]]'s table read cost,
 * engaged hours and cost per engaged hour across every tenant at once; with the
 * ranking now carried by the list, the same three facts about ONE business
 * belong at the top of its pane. Dropping them would have made the re-housing a
 * loss of information rather than a change of container.
 *
 * COST PER ENGAGED HOUR IS THE ROUTE'S AND IS NOT DIVIDED HERE, which is this
 * module's rule about second opinions at the one figure that most invites one.
 */
function totalsOf(answer) {
  const section = el('div', 'builder-tenant-cost__headline')
  const figuresRow = el('div', 'builder-tenant-cost__totals')
  section.append(figuresRow)
  const report = answer?.report ?? null
  const figures = {
    cost: dollars(report?.costMicros ?? null),
    hours: hours(report?.engagedHours ?? null),
    'per-hour': dollars(report?.costPerEngagedHourMicros ?? null),
  }
  for (const [id, label] of Object.entries(TENANT_COST_TOTALS)) {
    const cell = el('div', 'builder-tenant-cost__total')
    cell.dataset.total = id
    cell.append(
      el('span', 'builder-tenant-cost__subheading', label),
      el('span', 'builder-tenant-cost__figure', figures[id]),
    )
    figuresRow.append(cell)
  }
  // The count is what says a blank cost beside it is a gap in the price table
  // rather than a period nobody was billed for. BENEATH the figures and not
  // inside their row: the row is a set of columns, and a sentence added to it
  // becomes a fourth column of nothing.
  if (report?.unpricedTurns) {
    section.append(
      el('p', 'builder-tenant-cost__unpriced', TENANT_COST_UNPRICED(report.unpricedTurns)),
    )
  }
  return section
}

/**
 * The heading row over a grid of figures — the whole of *which number is which*.
 *
 * SAME CLASS AS THE ROWS IT SITS OVER, so the columns cannot drift apart: one
 * grid definition, used twice. `data-column` is what a UAT addresses, for the
 * reason `data-total` exists one function up.
 */
function columnsOf(rowClass, columns) {
  const head = el('div', `${rowClass} builder-tenant-cost__head`)
  for (const [id, label] of Object.entries(columns)) {
    const cell = el('span', 'builder-tenant-cost__cell', label)
    cell.dataset.column = id
    head.append(cell)
  }
  return head
}

/** Cost and hours per day — what makes a spike attributable to a session. */
function daysOf(rows) {
  const section = el('div', 'builder-tenant-cost__days')
  section.append(el('h4', 'builder-tenant-cost__subheading', TENANT_COST_BY_DAY))
  if (rows.length > 0) {
    section.append(columnsOf('builder-tenant-cost__day', TENANT_COST_DAY_COLUMNS))
  }
  for (const day of rows) {
    const line = el('div', 'builder-tenant-cost__day')
    line.dataset.day = day.day
    line.append(
      el('span', 'builder-tenant-cost__cell', day.day),
      el('span', 'builder-tenant-cost__cell', dollars(day.report?.costMicros ?? null)),
      el('span', 'builder-tenant-cost__cell', hours(day.report?.engagedHours ?? null)),
    )
    section.append(line)
  }
  return section
}

/**
 * The principal figure beside the delegated one — TWO figures, always, never
 * added.
 *
 * BOTH SIDES NAME THEIR MODELS. The principal half's models come from the
 * report's own `byModel`; the delegated half's come from the backend each
 * worker ran on, resolved through the document that binds a backend to a model.
 * That pairing is the whole readable answer to whether moving construction to
 * a cheaper model moved the money or merely moved it to the other side of the
 * same bill.
 */
function splitOf(answer) {
  const section = el('div', 'builder-tenant-cost__split')

  const own = el('div', 'builder-tenant-cost__half')
  own.dataset.half = 'principal'
  own.append(el('h4', 'builder-tenant-cost__subheading', TENANT_COST_PRINCIPAL))
  own.append(el('p', 'builder-tenant-cost__figure', dollars(answer?.report?.costMicros ?? null)))
  if (Object.keys(answer?.report?.byModel ?? {}).length > 0) {
    own.append(columnsOf('builder-tenant-cost__model', TENANT_COST_MODEL_COLUMNS))
  }
  for (const [model, totals] of Object.entries(answer?.report?.byModel ?? {})) {
    const line = el('div', 'builder-tenant-cost__model')
    line.dataset.model = model
    line.append(
      el('span', 'builder-tenant-cost__cell', model),
      el('span', 'builder-tenant-cost__cell', dollars(totals?.costMicros ?? null)),
    )
    own.append(line)
  }

  const handed = el('div', 'builder-tenant-cost__half')
  handed.dataset.half = 'delegated'
  handed.append(el('h4', 'builder-tenant-cost__subheading', TENANT_COST_DELEGATED))
  const delegated = answer?.delegated ?? null
  if (delegated === null) {
    // ABSENT RATHER THAN ZERO, and this is the one the ticket names outright:
    // this deployment ships delegation off, so no delegated spend is the
    // ordinary state, and `$0.00` here would read as a measurement — "we handed
    // work off and it was free" — rather than as the absence it is.
    handed.append(el('p', 'builder-tenant-cost__nothing', TENANT_COST_DELEGATED_NONE))
  } else {
    handed.append(el('p', 'builder-tenant-cost__figure', dollars(delegated.costMicros ?? null)))
    if (Object.keys(delegated.byModel ?? {}).length > 0) {
      handed.append(columnsOf('builder-tenant-cost__model', TENANT_COST_MODEL_COLUMNS))
    }
    for (const [model, slice] of Object.entries(delegated.byModel ?? {})) {
      const line = el('div', 'builder-tenant-cost__model')
      line.dataset.model = model
      line.append(
        el('span', 'builder-tenant-cost__cell', model),
        el('span', 'builder-tenant-cost__cell', dollars(slice?.costMicros ?? null)),
      )
      handed.append(line)
    }
  }

  section.append(own, handed)
  return section
}
