/**
 * Tenant cost ([[REQ-297]]) — the operator console's first control.
 *
 * THE QUESTION IT ANSWERS is *which tenant is costing us money*, which is the
 * one that decides pricing, caps and whether delegation worked. Until this
 * landed it was answerable only by running a script against a local `.wrangler`
 * SQLite file, which is not a thing that can exist in production.
 *
 * IT RENDERS [[REQ-293]]'S REPORT AND COMPUTES NO SECOND OPINION. Every figure
 * on screen arrives from the meter's own routes already settled — cost, engaged
 * hours, cost per engaged hour, and the per-day decomposition. This module
 * formats and orders; it does not divide, sum or average. A console that did its
 * own arithmetic would be a second authority on a number an operator is about to
 * price from, free to disagree with the route that is supposed to be the first.
 *
 * NOTHING, NEVER ZERO, ALL THE WAY TO THE PIXEL. A tenant with no measured turn
 * in the window is absent from the table rather than a zero row; a day nobody
 * worked has no row; a tenant that handed nothing off has no delegated figure.
 * An absent figure renders as a dash, which reads as *there is nothing here* —
 * where `$0.00` would claim a month of free consulting, or a delegation that
 * came free.
 *
 * THE TWO FIGURES ARE NEVER ONE. A caller's true total is its own spend PLUS
 * what it attributed to its workers, so a surface showing a single number
 * under-reports every delegating turn, silently and in the flattering direction:
 * a delegation that moved no work would look exactly like one that worked. So
 * the expansion labels both and adds neither, and the delegated half names the
 * model each figure was incurred on — which is how *did construction actually
 * move to the cheap model* is answered by looking rather than by inference.
 *
 * IT IS A CONTROL AND NOT THE CONSOLE. `console.js` knows nothing about any of
 * this; it is handed `{id, label, hint, mount}` and mounts it beside whatever
 * else is registered.
 */

import {
  CONSOLE_PERIOD_DAYS,
  CONSOLE_PERIOD_LABEL,
  TENANT_COST_BY_DAY,
  TENANT_COST_COLUMNS,
  TENANT_COST_DELEGATED,
  TENANT_COST_DELEGATED_NONE,
  TENANT_COST_EMPTY,
  TENANT_COST_HINT,
  TENANT_COST_LABEL,
  TENANT_COST_NOTHING,
  TENANT_COST_PRINCIPAL,
  TENANT_COST_UNPRICED,
} from './config.js'
import { fetchTenantCost, fetchTenantSpend } from './api.js'

/** The control's stable id — what `console.js` puts in `data-control`. */
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
 * `null` IS THE DASH AND NEVER `$0.00`, which is this control's whole rule about
 * absence arriving at the one place it is most easily lost.
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
 */
export function periodOfDays(days, now = Date.now()) {
  const span = Number(days)
  if (!Number.isFinite(span) || span <= 0) return { from: null, to: null }
  return { from: new Date(now - span * DAY_MS).toISOString(), to: null }
}

/**
 * The control, ready to register with {@link openOperatorConsole}.
 *
 * ITS TWO READS ARE INJECTED, defaulting to `api.js`. That is what lets a UAT
 * mount the real element against planted answers and read back what an operator
 * would see, rather than asserting against a mock of the surface itself.
 *
 * @param {object} [spec]
 * @param {(period: object) => Promise<object>} [spec.fetchLeague]
 * @param {(business: string, period: object) => Promise<object>} [spec.fetchTenant]
 * @param {() => number} [spec.now]
 * @param {number} [spec.days] the opening window — see `CONSOLE_PERIOD_DAYS`
 */
export function tenantCostControl({
  fetchLeague = fetchTenantCost,
  fetchTenant = fetchTenantSpend,
  now = () => Date.now(),
  days = CONSOLE_PERIOD_DAYS,
} = {}) {
  return {
    id: TENANT_COST_ID,
    label: TENANT_COST_LABEL,
    hint: TENANT_COST_HINT,
    mount: (container) => mountTenantCost(container, { fetchLeague, fetchTenant, now, days }),
  }
}

function mountTenantCost(container, { fetchLeague, fetchTenant, now, days }) {
  let window = days
  let live = true

  /**
   * THE PERIOD IS A CONTROL AND NOT A CONSTANT, which is the ticket's condition
   * 6 rendered. A billing question wants a month and an investigation wants a
   * day, and both are this field with a different number in it. The wire takes
   * `from` and `to`, so a calendar month stays expressible without this growing a
   * date picker — what it offers is the form of the question an operator asks
   * most: how much lately.
   */
  const form = el('div', 'builder-tenant-cost__period')
  const label = el('label', 'builder-tenant-cost__period-label', CONSOLE_PERIOD_LABEL)
  const field = document.createElement('input')
  field.type = 'number'
  field.min = '1'
  field.className = 'builder-tenant-cost__period-field'
  field.value = String(window)
  label.htmlFor = 'builder-tenant-cost-period'
  field.id = 'builder-tenant-cost-period'
  form.append(label, field)

  const table = el('div', 'builder-tenant-cost__table')
  container.append(form, table)

  field.addEventListener('change', () => {
    const next = Number(field.value)
    if (!Number.isFinite(next) || next <= 0) {
      field.value = String(window)
      return
    }
    window = next
    void draw()
  })

  async function draw() {
    table.replaceChildren(el('p', 'builder-tenant-cost__loading', 'Reading the meter…'))
    let answer = null
    try {
      answer = await fetchLeague(periodOfDays(window, now()))
    } catch (err) {
      if (!live) return
      table.replaceChildren(
        el(
          'p',
          'builder-tenant-cost__error',
          `The meter could not be read: ${err instanceof Error ? err.message : String(err)}`,
        ),
      )
      return
    }
    if (!live) return
    render(answer?.businesses ?? [])
  }

  function render(rows) {
    table.replaceChildren()
    if (rows.length === 0) {
      // ABSENT, NOT ZERO, at the level of the whole table: a period nobody worked
      // is a period with no rows, and a table of `$0.00` would be a claim.
      table.append(el('p', 'builder-tenant-cost__empty', TENANT_COST_EMPTY))
      return
    }

    const head = el('div', 'builder-tenant-cost__head')
    for (const column of TENANT_COST_COLUMNS) {
      head.append(el('span', 'builder-tenant-cost__cell', column))
    }
    table.append(head)

    // THE ORDER IS THE SERVER'S AND IS NOT RE-SORTED HERE. Most expensive first,
    // with an unpriced business after every one that has a cost — which is a
    // decision about what `null` means in a ranking of money, and belongs beside
    // the arithmetic rather than in a comparator the browser could get subtly
    // different.
    for (const row of rows) {
      table.append(rowFor(row))
    }
  }

  function rowFor(tenant) {
    const wrapper = el('div', 'builder-tenant-cost__row')
    wrapper.dataset.business = tenant.business

    const row = document.createElement('button')
    row.type = 'button'
    row.className = 'builder-tenant-cost__summary'
    row.append(
      el('span', 'builder-tenant-cost__cell', tenant.name || tenant.business),
      el('span', 'builder-tenant-cost__cell', dollars(tenant.report?.costMicros ?? null)),
      el('span', 'builder-tenant-cost__cell', hours(tenant.report?.engagedHours ?? null)),
      el('span', 'builder-tenant-cost__cell', dollars(tenant.report?.costPerEngagedHourMicros ?? null)),
    )
    wrapper.append(row)

    const detail = el('div', 'builder-tenant-cost__detail')
    detail.hidden = true
    wrapper.append(detail)

    let opened = false
    row.addEventListener('click', () => {
      detail.hidden = !detail.hidden
      row.setAttribute('aria-expanded', detail.hidden ? 'false' : 'true')
      if (detail.hidden || opened) return
      opened = true
      void expand(tenant.business, detail)
    })
    row.setAttribute('aria-expanded', 'false')

    if (tenant.report?.unpricedTurns) {
      wrapper.append(
        el('p', 'builder-tenant-cost__unpriced', TENANT_COST_UNPRICED(tenant.report.unpricedTurns)),
      )
    }
    return wrapper
  }

  async function expand(business, into) {
    into.replaceChildren(el('p', 'builder-tenant-cost__loading', 'Reading the period…'))
    let answer = null
    try {
      answer = await fetchTenant(business, periodOfDays(window, now()))
    } catch (err) {
      if (!live) return
      into.replaceChildren(
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
    into.replaceChildren(daysOf(answer?.days ?? []), splitOf(answer))
  }

  /** Cost and hours per day — what makes a spike attributable to a session. */
  function daysOf(rows) {
    const section = el('div', 'builder-tenant-cost__days')
    section.append(el('h4', 'builder-tenant-cost__subheading', TENANT_COST_BY_DAY))
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
    own.append(
      el('p', 'builder-tenant-cost__figure', dollars(answer?.report?.costMicros ?? null)),
    )
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

  void draw()

  return {
    destroy() {
      // THE FLAG AND NOT AN ABORT. Both reads are ordinary `fetch`es whose only
      // effect is to paint; a dialog closed mid-read must not have its answer
      // land in a detached tree, and that is all this has to prevent.
      live = false
    },
  }
}
