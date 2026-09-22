// @vitest-environment jsdom
/**
 * [[REQ-297]] — **the operator console, and its first control**.
 *
 * WHAT MAKES THIS EVIDENCE. Every case below mounts the SHIPPED modules into a
 * real DOM and reads back what an operator would see. `console.js` and
 * `tenant-cost.js` compose `modal.js` — ours — so they need nothing from the
 * shared `webui-*` components and these cases run everywhere; the one case that
 * is a claim about the shell's own chrome mounts the real builder over the
 * actually-installed components and skips where they are absent, on
 * [[REQ-179]]'s reasoning.
 *
 * The two reads are injected because they are the network seams the control
 * already declares. The sibling `.workers` suite is what proves the routes
 * behind them against a real D1; what is at stake HERE is the surface: what is
 * shown, in what order, and — the half that is easiest to lose — what is
 * deliberately NOT shown.
 *
 * THE CLAIMS, in the order the ticket makes them:
 *
 *   1. THE CONSOLE HAS NO CONTENT OF ITS OWN. It is chrome and a registry; with
 *      nothing registered it says so, and it renders a control it has never
 *      heard of. A console that knew what a tenant was could not do either.
 *   2. THE ACTION IS GATED ON OWNING THE PLATFORM BUSINESS, and it is not a tab
 *      — and the fact it is gated on TRAVELS, from the endpoint that answers it,
 *      through the reader the browser calls, to the chrome that renders on it.
 *   3. THE LIST IS THE SERVER'S ORDER, one row per tenant, four columns.
 *   4. A ROW EXPANDS to per-day figures and to TWO labelled figures that are
 *      never added into one, each naming its models.
 *   5. NOTHING, NEVER ZERO reaches the pixel: an absent figure is a dash, an
 *      absent delegation is a sentence, and neither is `$0.00`.
 *   6. THE PERIOD IS A PARAMETER whose default is thirty days.
 */

import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { consoleActions, openOperatorConsole } from '../apps/control-app/src/builder/console.js'
import { fetchBusinesses } from '../apps/control-app/src/builder/api.js'
import {
  dollars,
  periodOfDays,
  TENANT_COST_ID,
  tenantCostControl,
} from '../apps/control-app/src/builder/tenant-cost.js'
import * as CONFIG from '../apps/control-app/src/builder/config.js'

const REPO = path.resolve(__dirname, '..')
const BUILDER = path.join(REPO, 'apps/control-app/src/builder')
const settle = () => new Promise((r) => setTimeout(r, 0))

let host: HTMLElement

beforeEach(() => {
  document.body.replaceChildren()
  host = document.createElement('div')
  document.body.append(host)
})

/** A fixed clock, so the window a request names is checkable rather than approximate. */
const NOW = Date.parse('2026-09-22T12:00:00.000Z')
const DAY = 24 * 60 * 60 * 1000

/**
 * The league, as the route answers it.
 *
 * ALREADY IN THE SERVER'S ORDER, dearest first with the unpriced tenant last —
 * because that ordering is a decision about what `null` means in a ranking of
 * money and is made beside the arithmetic. A fixture in a different order would
 * be testing a comparator the browser does not have.
 */
const LEAGUE = {
  period: { from: null, to: null },
  businesses: [
    {
      business: 'acct_salon',
      name: 'Salon',
      report: {
        turns: 9,
        engagedMs: 3 * 60 * 60 * 1000,
        engagedHours: 3,
        costMicros: 24_000_000,
        unpricedTurns: 0,
        costPerEngagedHourMicros: 8_000_000,
        byRole: {},
        byModel: {},
      },
    },
    {
      business: 'acct_studio',
      name: 'Studio',
      report: {
        turns: 4,
        engagedMs: 60 * 60 * 1000,
        engagedHours: 1,
        costMicros: 1_500_000,
        unpricedTurns: 0,
        costPerEngagedHourMicros: 1_500_000,
        byRole: {},
        byModel: {},
      },
    },
    {
      // MEASURED BUT NOT PRICED. It has hours and no cost, which is not a cost
      // of zero — so it sorts after every tenant that has one and renders a dash.
      business: 'acct_dark',
      name: null,
      report: {
        turns: 2,
        engagedMs: 30 * 60 * 1000,
        engagedHours: 0.5,
        costMicros: null,
        unpricedTurns: 2,
        costPerEngagedHourMicros: null,
        byRole: {},
        byModel: {},
      },
    },
  ],
}

/** One tenant's period, expanded — the report, its days, and what it handed off. */
const EXPANDED = {
  business: 'acct_salon',
  period: { from: null, to: null },
  report: {
    turns: 9,
    engagedMs: 3 * 60 * 60 * 1000,
    engagedHours: 3,
    costMicros: 24_000_000,
    unpricedTurns: 0,
    costPerEngagedHourMicros: 8_000_000,
    byRole: {},
    byModel: {
      'claude-opus-5': { costMicros: 24_000_000 },
    },
  },
  days: [
    { day: '2026-09-20', report: { costMicros: 9_000_000, engagedHours: 1.2 } },
    { day: '2026-09-21', report: { costMicros: 15_000_000, engagedHours: 1.8 } },
  ],
  delegated: {
    entries: 3,
    costMicros: 900_000,
    unpricedEntries: 0,
    byModel: {
      'claude-haiku-4-5': { backend: 'claude_builder', entries: 3, costMicros: 900_000 },
    },
  },
}

/** The same tenant, having delegated nothing — the ordinary state today. */
const UNDELEGATED = { ...EXPANDED, business: 'acct_studio', delegated: null }

/** Mount the control on its own, with both reads recorded. */
function mountControl(over: Record<string, unknown> = {}) {
  const asked = { league: [] as unknown[], tenants: [] as unknown[] }
  const control = tenantCostControl({
    now: () => NOW,
    fetchLeague: async (period: unknown) => {
      asked.league.push(period)
      return LEAGUE
    },
    fetchTenant: async (business: string, period: unknown) => {
      asked.tenants.push({ business, period })
      return business === 'acct_studio' ? UNDELEGATED : EXPANDED
    },
    ...over,
  })
  openOperatorConsole({ host, controls: [control] })
  const body = document.querySelector(
    `[data-control="${TENANT_COST_ID}"] .builder-console__control-body`,
  ) as HTMLElement
  return { asked, body }
}

// ── 1: the console has no content ────────────────────────────────────────────

describe('REQ-297 — the console is chrome and a registry', () => {
  it('test_UAT_FC_REQ-297_the_console_with_no_controls_is_an_empty_console_not_a_broken_one', () => {
    openOperatorConsole({ host, controls: [] })

    const dialog = host.querySelector('.builder-modal')!
    expect(dialog).toBeTruthy()
    // It names itself and states its scope — this surface is about operating
    // 1st Contact rather than about the business the switcher has selected.
    expect(dialog.querySelector('.builder-console__heading')!.textContent).toBe(
      CONFIG.CONSOLE_LABEL,
    )
    expect(dialog.querySelector('.builder-console__hint')!.textContent).toBe(CONFIG.CONSOLE_HINT)
    // AND IT SAYS THERE IS NOTHING TO SHOW, which is the assertion that makes
    // "no content of its own" a property rather than a description. A blank
    // dialog reads as a failure to load, and the next hand fixes a failure to
    // load by giving the console content.
    expect(dialog.querySelector('.builder-console__empty')!.textContent).toBe(CONFIG.CONSOLE_EMPTY)
    expect(dialog.querySelectorAll('.builder-console__control')).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-297_the_console_mounts_a_control_it_has_never_heard_of', () => {
    // A CONTROL THIS MODULE CANNOT KNOW ABOUT. If the console had a subject, an
    // invented control could not be mounted by it — which is exactly why the
    // registry is worth the one indirection it costs.
    const mounted: Element[] = []
    let destroyed = 0
    openOperatorConsole({
      host,
      controls: [
        {
          id: 'weather',
          label: 'Weather',
          hint: 'Nothing to do with spend.',
          mount: (into: Element) => {
            mounted.push(into)
            into.append(document.createTextNode('fine'))
            return { destroy: () => void (destroyed += 1) }
          },
        },
      ],
    })

    const section = host.querySelector('[data-control="weather"]')!
    expect(section.querySelector('.builder-console__control-label')!.textContent).toBe('Weather')
    expect(section.querySelector('.builder-console__control-hint')!.textContent).toBe(
      'Nothing to do with spend.',
    )
    expect(section.querySelector('.builder-console__control-body')!.textContent).toBe('fine')
    expect(mounted).toHaveLength(1)
    // Its teardown runs on the dialog's close, on `modal.js`'s own contract, so
    // a control's subscription cannot outlive the surface that opened it.
    expect(destroyed).toBe(0)
    ;(host.querySelector('.builder-modal__backdrop') as HTMLElement).click()
    expect(destroyed).toBe(1)
  })

  it('test_UAT_FC_REQ-297_the_console_module_names_no_subject_of_its_own', () => {
    // THE FORM THAT STOPS THE NEXT HAND. A decision recorded only in prose is
    // one somebody re-opens by accident — by adding "just this one table" to the
    // console because the second control has not arrived yet.
    const source = fs.readFileSync(path.join(BUILDER, 'console.js'), 'utf8')
    const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    for (const subject of ['tenant', 'spend', 'cost', 'Tenant', 'TENANT']) {
      expect(code, `console.js must not name ${subject}`).not.toContain(subject)
    }
    // And the control that DOES know those words is a separate module.
    expect(fs.existsSync(path.join(BUILDER, 'tenant-cost.js'))).toBe(true)
  })

  it('test_UAT_FC_REQ-297_the_two_paths_the_control_reads_are_the_routers_own', () => {
    // THE LITERALS ARE DUPLICATED AND A UAT PINS THEM. `api.js` is browser
    // JavaScript and cannot import the Worker's TypeScript — the same
    // constraint `SIGN_OUT_HREF` lives under — so the two are held equal here
    // rather than by an import. A typo would otherwise be a 404 that looks
    // exactly like the console's own refusal.
    const client = fs.readFileSync(path.join(BUILDER, 'api.js'), 'utf8')
    const router = fs.readFileSync(
      path.join(REPO, 'apps/control-app/src/router.ts'),
      'utf8',
    )
    for (const declared of [
      "export const ADMIN_SPEND_PATH = '/api/admin/spend'",
      "export const ADMIN_BUSINESS_SPEND_PATH = '/api/admin/spend/businesses'",
    ]) {
      expect(router).toContain(declared)
      expect(client).toContain(declared.split("'")[1])
    }
  })
})

// ── 2: the gate ──────────────────────────────────────────────────────────────

describe('REQ-297 — the action is gated on owning the platform business', () => {
  it('test_UAT_FC_REQ-297_a_session_that_owns_nothing_here_gets_no_action_at_all', () => {
    // NOT A DISABLED CONTROL AND NOT A DIFFERENT-LOOKING REFUSAL. A caller who
    // does not own the 1st Contact business gets the same chrome they would get
    // if the console did not exist.
    expect(consoleActions({ ownsPlatformBusiness: false })).toEqual([])
    expect(consoleActions({})).toEqual([])

    const [action] = consoleActions({ ownsPlatformBusiness: true, open: () => {} })
    expect(action.id).toBe(CONFIG.CONSOLE_ACTION_ID)
    expect(action.ariaLabel).toBe(CONFIG.CONSOLE_LABEL)
    // It is an ACTION and never a tab: the tab strip is uniformly
    // business-scoped and this console is about every tenant at once.
    expect(CONFIG.TABS.map((t: { id: string }) => t.id)).not.toContain(CONFIG.CONSOLE_ACTION_ID)
  })

  it('test_UAT_FC_REQ-297_the_gate_is_ownership_and_never_the_platform_operator_column', () => {
    // [[DOC-42]] §7 and `identity.ts`, in the form that survives a refactor.
    // `scope.ts` is `platform_operator`'s only reader and must stay so — a
    // surface that appeared "because you are an admin" is [[DOC-40]] §2.1 rule
    // 1's named failure mode, and this console is the surface most likely to
    // acquire it.
    for (const file of ['console.js', 'tenant-cost.js', 'app.js']) {
      const source = fs.readFileSync(path.join(BUILDER, file), 'utf8')
      const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
      expect(code, `${file} must not read platform_operator`).not.toContain('platform_operator')
      expect(code, `${file} must not gate on an admin level`).not.toMatch(/\bisAdmin\b|\blevel\b/)
    }
  })
})

// ── 2b: the flag arrives ─────────────────────────────────────────────────────

/**
 * A `/api/businesses` response, exactly as the route composes it.
 *
 * THE THIRD FIELD IS THE POINT. A fixture carrying only what a case reads would
 * be a fixture that cannot catch a reader dropping a field, which is the defect
 * these cases exist for.
 */
const businessesResponse = (ownsPlatformBusiness: boolean) => ({
  ok: true,
  status: 200,
  json: async () => ({
    person: { name: 'Martin', email: 'operator@example.test' },
    businesses: [{ id: 'biz_platform', name: '1st Contact', selectable: true, lapse: null }],
    ownsPlatformBusiness,
  }),
})

describe('REQ-297 — the flag reaches the chrome that renders on it', () => {
  it('test_UAT_FC_REQ-297_the_reader_carries_ownership_through_to_the_mount', async () => {
    // THE SEAM, AND WHY IT NEEDS A CASE OF ITS OWN. Every case above hands the
    // gate a flag that is already in hand. `fetchBusinesses` rebuilds its result
    // from NAMED fields, so a fact the endpoint answers and that list does not
    // name is dropped between a server saying `true` and a gate that is correct
    // — which is a console that is missing with every part of it working.
    const owner = await fetchBusinesses((async () => businessesResponse(true)) as never)
    expect(owner.ownsPlatformBusiness).toBe(true)
    // The two facts that were always carried are still carried: this is a third
    // field, not a replacement shape.
    expect(owner.person).toEqual({ name: 'Martin', email: 'operator@example.test' })
    expect(owner.businesses).toHaveLength(1)

    // AND IT IS THE SESSION'S ANSWER, not a constant: a session that does not
    // own the platform business reads back false over the same function.
    const other = await fetchBusinesses((async () => businessesResponse(false)) as never)
    expect(other.ownsPlatformBusiness).toBe(false)

    // NOT MERELY PRESENT — CONSEQUENTIAL. What the reader answers is what the
    // gate is asked, over `main.js`'s own expression, so the two cannot drift.
    expect(consoleActions({ ownsPlatformBusiness: owner.ownsPlatformBusiness === true })).toHaveLength(1)
    expect(consoleActions({ ownsPlatformBusiness: other.ownsPlatformBusiness === true })).toEqual([])
  })

  it('test_UAT_FC_REQ-297_a_session_that_could_not_be_asked_about_owns_nothing', async () => {
    // BOTH REFUSAL PATHS, AND THEY MUST AGREE. A non-OK response and a caught
    // failure are the two ways this call fails; a third field is exactly how one
    // refusal literal starts quietly disagreeing with its twin.
    const refused = await fetchBusinesses((async () => ({ ok: false, status: 500 })) as never)
    expect(refused.ownsPlatformBusiness).toBe(false)
    expect(refused.person).toBeNull()
    expect(refused.businesses).toEqual([])

    // A REJECTED FETCH THAT IS NOT A SESSION FAILURE. `send` turns a rejection
    // into a SessionEndedError, which this function rethrows ([[BUG-52]]); what
    // reaches the `catch` and returns is a body that would not parse.
    const unparseable = await fetchBusinesses(
      (async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('nope') } })) as never,
    )
    expect(unparseable.ownsPlatformBusiness).toBe(false)

    // AND THE REFUSAL IS NOT SHARED STATE. Each caller gets its own, so one
    // refused load cannot rewrite another's through an in-place sort.
    expect(refused.businesses).not.toBe(unparseable.businesses)

    // AN ENDPOINT THAT OMITS THE FIELD IS A SESSION WE WERE NOT TOLD ABOUT, and
    // that does not round up to ownership — nor does anything merely truthy.
    const silent = await fetchBusinesses(
      (async () => ({ ok: true, status: 200, json: async () => ({ person: null, businesses: [] }) })) as never,
    )
    expect(silent.ownsPlatformBusiness).toBe(false)
    const truthy = await fetchBusinesses(
      (async () => ({
        ok: true,
        status: 200,
        json: async () => ({ person: null, businesses: [], ownsPlatformBusiness: 'yes' }),
      })) as never,
    )
    expect(truthy.ownsPlatformBusiness).toBe(false)
  })
})

// ── 3, 4, 5: the control ─────────────────────────────────────────────────────

describe('REQ-297 — tenant cost, the first control', () => {
  it('test_UAT_FC_REQ-297_the_list_is_one_row_per_tenant_in_the_servers_order', async () => {
    const { body } = mountControl()
    await settle()

    // THE COLUMNS THE TICKET NAMES, and no fifth one: the question is who is
    // costing us money, so anything about a tenant other than its spend is out.
    const head = [...body.querySelectorAll('.builder-tenant-cost__head .builder-tenant-cost__cell')]
    expect(head.map((c) => c.textContent)).toEqual(CONFIG.TENANT_COST_COLUMNS)

    const rows = [...body.querySelectorAll('.builder-tenant-cost__row')]
    // THE SERVER'S ORDER, UNTOUCHED — dearest first, unpriced last.
    expect(rows.map((r) => (r as HTMLElement).dataset.business)).toEqual([
      'acct_salon',
      'acct_studio',
      'acct_dark',
    ])

    const cells = [...rows[0].querySelectorAll('.builder-tenant-cost__summary span')]
    expect(cells.map((c) => c.textContent)).toEqual(['Salon', '$24.00', '3', '$8.00'])

    // A TENANT WITH NO NAME FALLS BACK TO ITS ID rather than rendering a blank
    // cell — an opaque label is worse than a human one and better than a gap.
    const dark = [...rows[2].querySelectorAll('.builder-tenant-cost__summary span')]
    expect(dark[0].textContent).toBe('acct_dark')
    // NOTHING, NEVER ZERO, at the pixel: a tenant whose every turn was unpriced
    // has no cost and no rate, and `$0.00` there would claim a free month.
    expect(dark[1].textContent).toBe(CONFIG.TENANT_COST_NOTHING)
    expect(dark[3].textContent).toBe(CONFIG.TENANT_COST_NOTHING)
    expect(dark[2].textContent).toBe('0.5')
    // And the count is what says the blank beside it is a gap in the price
    // table rather than a month nobody was billed for.
    expect(rows[2].querySelector('.builder-tenant-cost__unpriced')!.textContent).toBe(
      CONFIG.TENANT_COST_UNPRICED(2),
    )
  })

  it('test_UAT_FC_REQ-297_a_period_with_nothing_in_it_is_no_rows_and_says_so', async () => {
    const { body } = mountControl({
      fetchLeague: async () => ({ period: { from: null, to: null }, businesses: [] }),
    })
    await settle()

    expect(body.querySelectorAll('.builder-tenant-cost__row')).toHaveLength(0)
    expect(body.querySelector('.builder-tenant-cost__empty')!.textContent).toBe(
      CONFIG.TENANT_COST_EMPTY,
    )
    // No table of zeros — a period nobody worked is a period with no rows.
    expect(body.textContent).not.toContain('$0.00')
  })

  it('test_UAT_FC_REQ-297_a_row_expands_to_days_and_to_two_figures_that_are_never_one', async () => {
    const { asked, body } = mountControl()
    await settle()

    const row = body.querySelector('[data-business="acct_salon"]')!
    const summary = row.querySelector('.builder-tenant-cost__summary') as HTMLButtonElement
    expect(summary.getAttribute('aria-expanded')).toBe('false')
    summary.click()
    await settle()
    expect(summary.getAttribute('aria-expanded')).toBe('true')
    expect((asked.tenants[0] as { business: string }).business).toBe('acct_salon')

    // BY DAY, which is what makes a spike attributable to a session rather than
    // to a month. One row per day that has a measured turn, and none for a day
    // that does not.
    const days = [...row.querySelectorAll('.builder-tenant-cost__day')]
    expect(days.map((d) => (d as HTMLElement).dataset.day)).toEqual(['2026-09-20', '2026-09-21'])
    expect([...days[0].querySelectorAll('span')].map((c) => c.textContent)).toEqual([
      '2026-09-20',
      '$9.00',
      '1.2',
    ])

    // THE TWO FIGURES, LABELLED, AND NEVER ADDED. A caller's true total is its
    // own spend plus what it handed off, so one number would under-report every
    // delegating turn — a delegation that moved no work would look like one that
    // worked. The sum is deliberately absent from the surface.
    const own = row.querySelector('[data-half="principal"]')!
    const handed = row.querySelector('[data-half="delegated"]')!
    expect(own.querySelector('.builder-tenant-cost__subheading')!.textContent).toBe(
      CONFIG.TENANT_COST_PRINCIPAL,
    )
    expect(handed.querySelector('.builder-tenant-cost__subheading')!.textContent).toBe(
      CONFIG.TENANT_COST_DELEGATED,
    )
    expect(own.querySelector('.builder-tenant-cost__figure')!.textContent).toBe('$24.00')
    expect(handed.querySelector('.builder-tenant-cost__figure')!.textContent).toBe('$0.90')
    expect(row.textContent).not.toContain('$24.90')

    // AND EACH NAMES THE MODEL IT WAS INCURRED ON, which is how "did
    // construction actually move to the cheap model" is answered by looking.
    expect(own.querySelector('[data-model="claude-opus-5"]')).toBeTruthy()
    expect(handed.querySelector('[data-model="claude-haiku-4-5"]')!.textContent).toContain('$0.90')
  })

  it('test_UAT_FC_REQ-297_a_tenant_that_delegated_nothing_shows_an_absence_and_not_a_zero', async () => {
    const { body } = mountControl()
    await settle()

    const row = body.querySelector('[data-business="acct_studio"]')!
    ;(row.querySelector('.builder-tenant-cost__summary') as HTMLButtonElement).click()
    await settle()

    const handed = row.querySelector('[data-half="delegated"]')!
    // THE SPLIT IS STILL SHOWN — both halves, always — and the delegated half
    // states an absence. This deployment ships delegation off, so this is the
    // ordinary case, and `$0.00` here would read as a measurement: "we handed
    // work off and it was free."
    expect(handed).toBeTruthy()
    expect(handed.querySelector('.builder-tenant-cost__nothing')!.textContent).toBe(
      CONFIG.TENANT_COST_DELEGATED_NONE,
    )
    expect(handed.querySelector('.builder-tenant-cost__figure')).toBeNull()
    expect(handed.textContent).not.toContain('$0.00')
  })

  it('test_UAT_FC_REQ-297_the_period_is_a_parameter_whose_default_is_thirty_days', async () => {
    const { asked, body } = mountControl()
    await settle()

    // THE DEFAULT IS THE CONSOLE'S AND TRAVELS IN THE REQUEST. The route's own
    // contract is [[REQ-293]]'s — absent means unbounded — so a console that
    // sent no period would be asking for every turn ever measured.
    expect(CONFIG.CONSOLE_PERIOD_DAYS).toBe(30)
    const first = asked.league[0] as { from: string; to: string | null }
    expect(first.from).toBe(new Date(NOW - 30 * DAY).toISOString())
    // THE FAR END IS LEFT OPEN, so a turn that begins while the request is in
    // flight is not excluded by a ceiling the reader did not ask for.
    expect(first.to).toBeNull()

    // AND IT IS A DEFAULT RATHER THAN A CONSTANT: a day-long investigation is
    // this field with a different number in it.
    const field = body.querySelector('.builder-tenant-cost__period-field') as HTMLInputElement
    expect(field.value).toBe('30')
    expect(
      (body.querySelector('.builder-tenant-cost__period-label') as HTMLLabelElement).textContent,
    ).toBe(CONFIG.CONSOLE_PERIOD_LABEL)
    field.value = '1'
    field.dispatchEvent(new Event('change'))
    await settle()
    expect((asked.league[1] as { from: string }).from).toBe(new Date(NOW - DAY).toISOString())

    // A number that is not a period is refused and the field snaps back, rather
    // than silently asking for an unbounded window.
    field.value = '0'
    field.dispatchEvent(new Event('change'))
    await settle()
    expect(field.value).toBe('1')
    expect(asked.league).toHaveLength(2)
  })

  it('test_UAT_FC_REQ-297_money_and_windows_are_formatted_in_one_place', () => {
    // The two pure halves of the surface, asserted directly because every figure
    // on screen goes through them.
    expect(dollars(24_000_000)).toBe('$24.00')
    expect(dollars(1)).toBe('$0.00') // a real, measured, sub-cent figure
    expect(dollars(null)).toBe(CONFIG.TENANT_COST_NOTHING) // and an absence is not one
    expect(periodOfDays(7, NOW)).toEqual({ from: new Date(NOW - 7 * DAY).toISOString(), to: null })
    expect(periodOfDays(0, NOW)).toEqual({ from: null, to: null })
  })
})

// ── the chrome, over the real shell ──────────────────────────────────────────

if (!WEBUI_INSTALLED) console.warn(`REQ-297 chrome case skipped: ${WEBUI_SKIP_REASON}`)

describe.skipIf(!WEBUI_INSTALLED)('REQ-297 — the console in the builder chrome', () => {
  it('test_UAT_FC_REQ-297_the_console_is_a_header_action_and_not_a_tab', async () => {
    const { mountBuilder } = await import('../apps/control-app/src/builder/app.js')
    const root = document.createElement('div')
    document.body.append(root)

    const common = {
      businesses: [{ id: 'acct_salon', name: 'Salon', selectable: true }],
      person: { name: 'Sam', email: 'sam@example.test' },
      loadSites: async () => [],
      chatTransport: {
        openSession: async () => ({ sessionId: 's', turns: [], ready: true }),
        streamPrompt: async function* () {
          yield { kind: 'done' }
        },
      },
      libraryTransport: {
        list: async () => ({ material: [] }),
        item: async () => ({ body: '' }),
        save: async () => ({}),
        fileUrl: () => '',
        upload: async () => ({}),
      },
      paletteTransport: { get: async () => ({ palette: {}, usage: {} }), write: async () => ({}) },
    }

    const app = mountBuilder(root, { ...common, ownsPlatformBusiness: true })
    await settle()
    const button = app.shell.element.querySelector(
      `[data-action="${CONFIG.CONSOLE_ACTION_ID}"]`,
    ) as HTMLButtonElement
    expect(button).toBeTruthy()
    // The shell's own controls survived being joined by a fourth — `actions`
    // REPLACES the defaults rather than extending them.
    const actionIds = [...app.shell.element.querySelectorAll('[data-action]')].map(
      (el) => (el as HTMLElement).dataset.action,
    )
    expect(actionIds).toEqual(
      expect.arrayContaining(['theme', 'about', CONFIG.ACCOUNT_ACTION_ID, CONFIG.CONSOLE_ACTION_ID]),
    )
    // NOT A TAB. The strip stays uniformly business-scoped, with no exception.
    expect(app.shell.getTabs().map((t: { id: string }) => t.id)).not.toContain(
      CONFIG.CONSOLE_ACTION_ID,
    )

    // It opens the console, inside the shell root so the `--shell-*` tokens and
    // the app font resolve — the reason every builder dialog is hosted there.
    button.click()
    const dialog = app.shell.element.querySelector('.builder-console')!
    expect(dialog).toBeTruthy()
    // And the first control is registered on it.
    expect(dialog.querySelector(`[data-control="${TENANT_COST_ID}"]`)).toBeTruthy()

    // A SESSION THAT DOES NOT OWN THE PLATFORM BUSINESS GETS NO ACTION AT ALL.
    document.body.replaceChildren()
    const other = document.createElement('div')
    document.body.append(other)
    const plain = mountBuilder(other, { ...common })
    await settle()
    expect(
      plain.shell.element.querySelector(`[data-action="${CONFIG.CONSOLE_ACTION_ID}"]`),
    ).toBeNull()
  })

  it('test_UAT_FC_REQ-297_a_server_that_says_true_puts_a_console_in_the_header', async () => {
    // THE WHOLE PATH, IN ONE CASE. The case above hands `mountBuilder` the flag
    // directly, which is what let a reader that never passed it on stay
    // invisible: the server answered `true`, the gate was right, the shell
    // renders every action it is given, and the header had no Console. So this
    // one starts where the browser starts — a response off the wire — and ends
    // where the operator looks.
    const { mountBuilder } = await import('../apps/control-app/src/builder/app.js')
    const { fetchBusinesses } = await import('../apps/control-app/src/builder/api.js')

    for (const owns of [true, false]) {
      document.body.replaceChildren()
      const root = document.createElement('div')
      document.body.append(root)

      const session = await fetchBusinesses((async () => businessesResponse(owns)) as never)
      // `main.js`'s expression, restated here because that module imports three
      // absolute URLs only a browser resolves and cannot itself be imported.
      const app = mountBuilder(root, {
        businesses: session.businesses,
        person: session.person,
        ownsPlatformBusiness: session.ownsPlatformBusiness === true,
        loadSites: async () => [],
        chatTransport: {
          openSession: async () => ({ sessionId: 's', turns: [], ready: true }),
          streamPrompt: async function* () {
            yield { kind: 'done' }
          },
        },
        libraryTransport: {
          list: async () => ({ material: [] }),
          item: async () => ({ body: '' }),
          save: async () => ({}),
          fileUrl: () => '',
          upload: async () => ({}),
        },
        paletteTransport: { get: async () => ({ palette: {}, usage: {} }), write: async () => ({}) },
      })
      await settle()

      const button = app.shell.element.querySelector(
        `[data-action="${CONFIG.CONSOLE_ACTION_ID}"]`,
      )
      if (owns) {
        expect(button, 'a server answering true must put a Console in the header').toBeTruthy()
        expect((button as HTMLElement).textContent).toContain(CONFIG.CONSOLE_LABEL)
      } else {
        expect(button, 'a server answering false must leave the header alone').toBeNull()
      }
      // The account avatar is present either way: the console's absence is the
      // console's, and never a header that failed to draw.
      expect(
        app.shell.element.querySelector(`[data-action="${CONFIG.ACCOUNT_ACTION_ID}"]`),
      ).toBeTruthy()
    }
  })
})
