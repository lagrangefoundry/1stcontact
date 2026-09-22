// @vitest-environment jsdom
/**
 * [[REQ-298]] — **the console's two panels: every site on the left, one
 * business on the right**.
 *
 * WHAT MAKES THIS EVIDENCE. Every case mounts the SHIPPED body — the real
 * `webui/list-detail` in `no-tab` mode, the real detail pane, the real sections
 * — into a real DOM and reads back what an operator would see. The two reads are
 * injected because they are the network seams the module already declares; the
 * sibling `.workers` suite is what proves the route behind one of them against a
 * real D1. What is at stake HERE is the surface: what is shown, in what ORDER,
 * and — the half that is easiest to lose — what is deliberately not shown.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *a site dropped for having no spend*, which would make a directory that
 *     reads as complete and is not;
 *   - *`$0.00` anywhere an absence belongs* — nothing, never zero, at the pixel;
 *   - *a row picked for the operator* when nothing is selected, which would open
 *     the dearest tenant's spending because nobody chose anything;
 *   - *an empty anchor or a dead link* for a site with no public address;
 *   - *one failing section taking the pane down*, which would hide who owns a
 *     business because its meter was unavailable;
 *   - *a pane that knows what a section shows*, asserted by handing it none and
 *     by handing it one this codebase has never heard of;
 *   - *two periods* — a ranking over one window beside a figure over another.
 *
 * THE CLAIMS, in the order the ticket makes them (conditions 6–12):
 *
 *   6. TWO PANELS: every site on the left, the selected site's business right.
 *   7. ROWS ARE ORDERED BY THE BUSINESS'S COST, dearest first, sites of one
 *      business adjacent, no-spend businesses last by name.
 *   8. A SITE WHOSE BUSINESS HAS NO MEASURED TURN is listed with no cost.
 *   9. SELECTING A ROW SHOWS the account, the published link, and the cost.
 *  10. A SITE WITH NO PUBLIC ADDRESS SAYS SO.
 *  11. A SECTION THAT FAILS is reported in its own block; the others render.
 *  12. THE PERIOD DEFAULTS TO THIRTY DAYS and governs both halves.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import * as CONFIG from '../apps/control-app/src/builder/config.js'

const settle = () => new Promise((r) => setTimeout(r, 0))
const NOW = Date.parse('2026-09-22T12:00:00.000Z')
const DAY = 24 * 60 * 60 * 1000

let host: HTMLElement

beforeEach(() => {
  document.body.replaceChildren()
  host = document.createElement('div')
  document.body.append(host)
})

/**
 * The directory, as `/api/admin/sites` answers it.
 *
 * IN THE ROUTE'S OWN ORDER — by business, then by age — which is deliberately
 * NOT the order the console shows. A fixture pre-sorted by cost would be testing
 * a comparator the browser does not run.
 */
const SITES = {
  sites: [
    site('site_dark', 'biz_dark', null, { address: null, ownerAccount: null }),
    site('site_quiet_a', 'biz_quiet', 'Quiet Ltd'),
    site('site_quiet_b', 'biz_quiet', 'Quiet Ltd', { address: 'quiet-two.1stc.site' }),
    site('site_salon', 'biz_salon', 'Salon'),
    site('site_absent', 'biz_absent', 'Absent Ltd', { address: null }),
    site('site_aardvark', 'biz_aardvark', 'Aardvark Ltd'),
  ],
}

function site(id: string, business: string, businessName: string | null, over = {}) {
  return {
    site: id,
    business,
    businessName,
    ownerAccount: `acct_${business}`,
    ownerAccountName: `${businessName ?? business} Holdings`,
    ownerAccountStatus: 'active',
    address: `${id.replace(/_/g, '-')}.1stc.site`,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...over,
  }
}

/**
 * The league, as `/api/admin/spend/businesses` answers it — ALREADY IN THE
 * SERVER'S ORDER, dearest first with the unpriced business last.
 *
 * `biz_absent` AND `biz_aardvark` ARE NOT IN IT, which is the record's own rule:
 * a business with no measured turn in the window is absent from the meter rather
 * than a zero row. Their sites must still be listed.
 */
const LEAGUE = {
  period: { from: null, to: null },
  businesses: [
    { business: 'biz_salon', name: 'Salon', report: { costMicros: 24_000_000 } },
    { business: 'biz_quiet', name: 'Quiet Ltd', report: { costMicros: 1_500_000 } },
    // MEASURED BUT NOT PRICED. It has turns and no cost, which is not a cost of
    // zero — the server sorts it after every business that has one.
    { business: 'biz_dark', name: null, report: { costMicros: null } },
  ],
}

/** One business's period, as `/api/admin/spend` answers it. */
const PERIOD_ANSWER = {
  business: 'biz_salon',
  period: { from: null, to: null },
  report: {
    turns: 9,
    engagedHours: 3,
    costMicros: 24_000_000,
    unpricedTurns: 0,
    costPerEngagedHourMicros: 8_000_000,
    byModel: { 'claude-opus-5': { costMicros: 24_000_000 } },
  },
  days: [
    { day: '2026-09-20', report: { costMicros: 9_000_000, engagedHours: 1.2 } },
    { day: '2026-09-21', report: { costMicros: 15_000_000, engagedHours: 1.8 } },
  ],
  delegated: null,
}

if (!WEBUI_INSTALLED) console.warn(`REQ-298 pane cases skipped: ${WEBUI_SKIP_REASON}`)

/** Mount the shipped body with both reads recorded. */
async function mount(over: Record<string, unknown> = {}) {
  const { mountPlatformSites, accountSection, addressSection } = await import(
    '../apps/control-app/src/builder/platform-sites.js'
  )
  const { tenantCostSection } = await import('../apps/control-app/src/builder/tenant-cost.js')
  const asked = { league: [] as unknown[], tenants: [] as unknown[] }
  const handle = mountPlatformSites(host, {
    now: () => NOW,
    fetchSites: async () => SITES,
    fetchLeague: async (period: unknown) => {
      asked.league.push(period)
      return LEAGUE
    },
    sections: [
      accountSection(),
      addressSection(),
      tenantCostSection({
        fetchTenant: async (business: string, period: unknown) => {
          asked.tenants.push({ business, period })
          return { ...PERIOD_ANSWER, business }
        },
      }),
    ],
    ...over,
  })
  await settle()
  return { asked, handle }
}

const rows = () =>
  [...host.querySelectorAll('.builder-console-sites__row')] as HTMLElement[]
const rowKeys = () => rows().map((r) => r.dataset.site)
const detail = () => host.querySelector('.builder-console-sites__detail')
const sectionOf = (id: string) => host.querySelector(`[data-section="${id}"]`)!

/** Open a row the way an operator does — by clicking it in the list. */
async function open(key: string) {
  const row = rows().find((r) => r.dataset.site === key)!
  ;(row.closest('[role="button"], button, li, [data-key]') ?? row).dispatchEvent(
    new MouseEvent('click', { bubbles: true }),
  )
  await settle()
  await settle()
}

describe.skipIf(!WEBUI_INSTALLED)('REQ-298 — the list', () => {
  it('test_UAT_FC_REQ-298_rows_are_every_site_ordered_by_their_businesss_cost', async () => {
    // CONDITIONS 6 AND 7. One row per SITE and not per business — `biz_quiet`
    // has two sites and contributes two rows, adjacent, because the operator's
    // question starts from something they can see published.
    await mount()

    expect(rowKeys()).toEqual([
      'site_salon', // dearest
      'site_quiet_a', // next, and its two sites are adjacent
      'site_quiet_b',
      'site_dark', // measured but unpriced — after everything with a cost
      'site_aardvark', // no measured turn at all — the tail, by name
      'site_absent',
    ])

    // THE RANKED HEAD IS THE SERVER'S ORDER AND IS NOT RE-DERIVED HERE. What
    // `null` means in a ranking of money is decided beside the arithmetic; a
    // comparator in the browser could get it subtly different, and the one it
    // would most likely get wrong is exactly `biz_dark`.
    expect(LEAGUE.businesses.map((b) => b.business)).toEqual([
      'biz_salon',
      'biz_quiet',
      'biz_dark',
    ])
  })

  it('test_UAT_FC_REQ-298_a_business_with_no_measured_turn_is_listed_with_no_cost', async () => {
    // CONDITION 8, and the reason this list is not the league. A business the
    // meter has never seen is ABSENT from `/api/admin/spend/businesses` by that
    // route's own rule — so a console that showed only the league would omit
    // exactly the customer nobody has looked at, which is the one worth finding.
    await mount()

    const quiet = rows().find((r) => r.dataset.site === 'site_aardvark')!
    expect(quiet.querySelector('.builder-console-sites__row-cost')!.textContent).toBe(
      CONFIG.TENANT_COST_NOTHING,
    )
    // NOTHING, NEVER ZERO, at the pixel: `$0.00` there would claim a month of
    // free consulting rather than a month nobody measured.
    expect(quiet.textContent).not.toContain('$0.00')

    // A BUSINESS MEASURED BUT NOT PRICED READS THE SAME WAY, and is a different
    // fact — it is in the league, with a null cost.
    const dark = rows().find((r) => r.dataset.site === 'site_dark')!
    expect(dark.querySelector('.builder-console-sites__row-cost')!.textContent).toBe(
      CONFIG.TENANT_COST_NOTHING,
    )

    // AND A BUSINESS THAT DOES HAVE ONE SHOWS IT, so the dash means something.
    const salon = rows().find((r) => r.dataset.site === 'site_salon')!
    expect(salon.querySelector('.builder-console-sites__row-cost')!.textContent).toBe('$24.00')
  })

  it('test_UAT_FC_REQ-298_the_pane_says_nothing_is_selected_and_picks_no_row', async () => {
    // CONDITION 9's opening state. The first row is the dearest tenant, and
    // opening somebody's spending because nothing else was chosen is a decision
    // this surface should not make on its own.
    await mount()

    expect(host.querySelector('.builder-console-sites__unselected')!.textContent).toBe(
      CONFIG.CONSOLE_SITES_NONE_SELECTED,
    )
    expect(detail()).toBeNull()
    // Nothing was read about any business, because nothing was opened.
    expect(host.querySelector('[data-section]')).toBeNull()
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-298 — the detail pane', () => {
  it('test_UAT_FC_REQ-298_selecting_a_row_shows_the_account_the_link_and_the_cost', async () => {
    // CONDITION 9. Three sections, in the order the questions arrive in: whose
    // is this, what did we build them, what is it costing us.
    const { asked } = await mount()
    await open('site_salon')

    expect(detail()).toBeTruthy()
    expect(
      [...host.querySelectorAll('[data-section]')].map((s) => (s as HTMLElement).dataset.section),
    ).toEqual(['account', 'address', 'tenant-cost'])

    // THE ACCOUNT — the business, its owner account and that account's status.
    const account = sectionOf('account')
    expect(account.querySelector('[data-field="business"] .builder-console-sites__field-value')!.textContent).toBe('Salon')
    expect(account.querySelector('[data-field="account"] .builder-console-sites__field-value')!.textContent).toBe('Salon Holdings')
    expect(account.querySelector('[data-field="status"] .builder-console-sites__field-value')!.textContent).toBe('active')

    // THE LINK — the site's canonical public address, opening in a new browser
    // tab, because the published site is not a builder surface.
    const link = sectionOf('address').querySelector('a') as HTMLAnchorElement
    expect(link.textContent).toBe('site-salon.1stc.site')
    expect(link.getAttribute('href')).toBe('https://site-salon.1stc.site')
    expect(link.target).toBe('_blank')

    // THE COST — [[REQ-297]]'s figures, unchanged, over the console's period and
    // read from the route that is authoritative about them.
    expect((asked.tenants[0] as { business: string }).business).toBe('biz_salon')
    const cost = sectionOf('tenant-cost')
    expect(cost.querySelector('[data-total="cost"] .builder-tenant-cost__figure')!.textContent).toBe('$24.00')
    const days = [...cost.querySelectorAll('.builder-tenant-cost__day')]
    expect(days.map((d) => (d as HTMLElement).dataset.day)).toEqual(['2026-09-20', '2026-09-21'])

    // THE TWO FIGURES, LABELLED, AND NEVER ADDED — the claim that survived the
    // re-housing intact. A caller's true total is its own spend plus what it
    // handed off, so one number would under-report every delegating turn.
    expect(cost.querySelector('[data-half="principal"] .builder-tenant-cost__figure')!.textContent).toBe('$24.00')
    const handed = cost.querySelector('[data-half="delegated"]')!
    expect(handed.querySelector('.builder-tenant-cost__nothing')!.textContent).toBe(
      CONFIG.TENANT_COST_DELEGATED_NONE,
    )
    expect(handed.textContent).not.toContain('$0.00')
  })

  it('test_UAT_FC_REQ-298_a_site_with_no_public_address_says_so_and_renders_no_link', async () => {
    // CONDITION 10. This is the same fact `POST /api/publish` refuses on with
    // `NO_PUBLIC_ADDRESS`, from the same read, so the console and the refusal
    // cannot disagree about whether a site is reachable — and an anchor with
    // nothing behind it would train the operator to click something that cannot
    // work.
    await mount()
    await open('site_absent')

    const address = sectionOf('address')
    expect(address.querySelector('a')).toBeNull()
    expect(address.querySelector('.builder-console-sites__nothing')!.textContent).toBe(
      CONFIG.CONSOLE_SITE_NO_ADDRESS,
    )
  })

  it('test_UAT_FC_REQ-298_the_platform_business_says_it_has_no_owner_account', async () => {
    // `tenants.owner_account_id` IS NULL FOR 1st CONTACT AND NOTHING ELSE, so
    // the one row where this is empty is the row where empty is CORRECT — and a
    // blank cell would make it indistinguishable from an account record that has
    // gone missing, which is the other thing it can be and the one worth
    // noticing. A missing business record is a third absence and reads as one.
    await mount()
    await open('site_dark')

    const account = sectionOf('account')
    expect(account.querySelector('.builder-console-sites__nothing')!.textContent).toBe(
      CONFIG.CONSOLE_ACCOUNT_PLATFORM,
    )
    expect(account.querySelector('[data-field="account"]')).toBeNull()
    expect(account.querySelector('[data-field="business"] .builder-console-sites__field-value')!.textContent).toBe(
      CONFIG.CONSOLE_BUSINESS_NAME_MISSING,
    )
  })

  it('test_UAT_FC_REQ-298_a_section_that_fails_is_reported_alone_and_the_others_render', async () => {
    // CONDITION 11, and [[REQ-297]]'s failure-isolation rule at its new seam.
    // It matters more here than it did there: a business whose spend read fails
    // must still show the operator who owns it and where the site is.
    const { accountSection, addressSection } = await import(
      '../apps/control-app/src/builder/platform-sites.js'
    )
    await mount({
      sections: [
        accountSection(),
        {
          id: 'broken',
          label: 'Broken',
          mount: () => {
            throw new Error('the meter is down')
          },
        },
        addressSection(),
      ],
    })
    await open('site_salon')

    expect(sectionOf('broken').querySelector('.builder-console-sites__section-error')!.textContent).toBe(
      CONFIG.CONSOLE_SECTION_FAILED('the meter is down'),
    )
    // THE NEIGHBOURS ARE UNTOUCHED — both of them, on both sides of the failure.
    expect(sectionOf('account').querySelector('[data-field="business"]')).toBeTruthy()
    expect(sectionOf('address').querySelector('a')).toBeTruthy()
  })

  it('test_UAT_FC_REQ-298_the_pane_mounts_a_section_it_has_never_heard_of_and_none_at_all', async () => {
    // THE REGISTRY, MOVED AND STILL A REGISTRY. A section this codebase cannot
    // know about mounts, which is exactly what could not be done if the pane had
    // a subject — and a pane with nothing registered is an EMPTY pane rather
    // than a broken one, which is what stops the next hand reading a blank pane
    // as a failure to load and "fixing" it by giving the pane content.
    const seen: Element[] = []
    let destroyed = 0
    await mount({
      sections: [
        {
          id: 'weather',
          label: 'Weather',
          mount: (into: Element) => {
            seen.push(into)
            into.append(document.createTextNode('fine'))
            return { destroy: () => void (destroyed += 1) }
          },
        },
      ],
    })
    await open('site_salon')

    expect(sectionOf('weather').querySelector('.builder-console-sites__section-label')!.textContent).toBe('Weather')
    expect(sectionOf('weather').textContent).toContain('fine')
    expect(seen).toHaveLength(1)

    // ITS TEARDOWN RUNS WHEN THE PANE IS SWAPPED, so a section's subscription
    // cannot outlive the row that opened it.
    expect(destroyed).toBe(0)
    await open('site_quiet_a')
    expect(destroyed).toBe(1)

    // AND WITH NOTHING REGISTERED THE PANE SAYS THERE IS NOTHING TO SHOW.
    document.body.replaceChildren()
    host = document.createElement('div')
    document.body.append(host)
    await mount({ sections: [] })
    await open('site_salon')
    expect(host.querySelector('.builder-console-sites__empty')!.textContent).toBe(
      CONFIG.CONSOLE_PANE_EMPTY,
    )
    expect(host.querySelector('[data-section]')).toBeNull()
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-298 — one period, governing both halves', () => {
  it('test_UAT_FC_REQ-298_the_period_defaults_to_thirty_days_and_travels_in_both_reads', async () => {
    // CONDITION 12. The route's own contract is [[REQ-293]]'s — absent means
    // unbounded — so a console that sent no period would be asking for every
    // turn ever measured. Thirty days is the CONSOLE's opinion about "lately"
    // and travels in the request.
    const { asked } = await mount()
    expect(CONFIG.CONSOLE_PERIOD_DAYS).toBe(30)

    const league = asked.league[0] as { from: string; to: string | null }
    expect(league.from).toBe(new Date(NOW - 30 * DAY).toISOString())
    // THE FAR END IS LEFT OPEN, so a turn that begins while the request is in
    // flight is not excluded by a ceiling the reader did not ask for.
    expect(league.to).toBeNull()

    await open('site_salon')
    expect((asked.tenants[0] as { period: { from: string } }).period.from).toBe(league.from)
  })

  it('test_UAT_FC_REQ-298_changing_the_period_re_orders_the_list_and_re_reads_the_detail', async () => {
    // THE WHOLE POINT OF IT BEING ONE PERIOD. Two would let an operator compare
    // a ranking over a month against a figure over a day and never see that they
    // had — so the field moves both, and the open pane is re-mounted rather than
    // left showing the window the operator just left.
    const cheapestFirst = {
      period: { from: null, to: null },
      businesses: [
        { business: 'biz_quiet', name: 'Quiet Ltd', report: { costMicros: 9_000_000 } },
        { business: 'biz_salon', name: 'Salon', report: { costMicros: 1_000_000 } },
      ],
    }
    const windows: Array<{ from: string | null }> = []
    let call = 0
    const { asked } = await mount({
      fetchLeague: async (period: { from: string | null }) => {
        windows.push(period)
        call += 1
        return call === 1 ? LEAGUE : cheapestFirst
      },
    })
    await open('site_salon')
    expect(asked.tenants).toHaveLength(1)

    const field = host.querySelector('.builder-console-sites__period-field') as HTMLInputElement
    expect(field.value).toBe('30')
    expect(
      (host.querySelector('.builder-console-sites__period-label') as HTMLLabelElement).textContent,
    ).toBe(CONFIG.CONSOLE_PERIOD_LABEL)

    field.value = '1'
    field.dispatchEvent(new Event('change'))
    await settle()
    await settle()

    // THE LIST RE-ORDERED, over the new window.
    expect(windows[1].from).toBe(new Date(NOW - DAY).toISOString())
    expect(rowKeys().slice(0, 3)).toEqual(['site_quiet_a', 'site_quiet_b', 'site_salon'])

    // AND THE OPEN DETAIL WAS RE-READ, over the same new window. Without this
    // the pane would be figures for a period the list is no longer showing.
    expect(asked.tenants).toHaveLength(2)
    expect((asked.tenants[1] as { period: { from: string } }).period.from).toBe(
      new Date(NOW - DAY).toISOString(),
    )

    // A NUMBER THAT IS NOT A PERIOD IS REFUSED AND THE FIELD SNAPS BACK, rather
    // than silently asking for an unbounded window.
    field.value = '0'
    field.dispatchEvent(new Event('change'))
    await settle()
    expect(field.value).toBe('1')
    expect(windows).toHaveLength(2)
  })

  it('test_UAT_FC_REQ-298_a_meter_that_cannot_be_read_leaves_the_directory_standing', async () => {
    // THE TWO READS FAIL DIFFERENTLY BECAUSE THEY MATTER DIFFERENTLY. An
    // operator who came to see what we have published should not be shown
    // nothing because the meter was unavailable — so every site still renders,
    // with no cost beside any row, and the surface says why.
    //
    // AND THE ORDER IS THE NO-SPEND ORDER, WHICH IS THE RULE AND NOT A FALLBACK.
    // An unreadable meter means no business has a measured cost, so every row is
    // in the tail and the tail is ordered by business name — the same ordering a
    // quiet business gets on an ordinary read. A second rule for this case would
    // be a second ordering to keep in step.
    await mount({
      fetchLeague: async () => {
        throw new Error('the meter is down')
      },
    })

    expect(rowKeys()).toEqual([
      'site_aardvark', // Aardvark Ltd
      'site_absent', // Absent Ltd
      'site_dark', // no name — falls back to its business id
      'site_quiet_a', // Quiet Ltd, both its sites adjacent
      'site_quiet_b',
      'site_salon', // Salon
    ])
    expect(host.querySelector('.builder-console-sites__notice')!.textContent).toBe(
      CONFIG.CONSOLE_METER_UNREADABLE('the meter is down'),
    )
    for (const row of rows()) {
      expect(row.querySelector('.builder-console-sites__row-cost')!.textContent).toBe(
        CONFIG.TENANT_COST_NOTHING,
      )
    }

    // AND A DIRECTORY THAT CANNOT BE READ EMPTIES THE LIST, because without it
    // there are no rows to show a cost beside.
    document.body.replaceChildren()
    host = document.createElement('div')
    document.body.append(host)
    await mount({
      fetchSites: async () => {
        throw new Error('no sites')
      },
    })
    expect(rows()).toHaveLength(0)
    expect(host.querySelector('.builder-console-sites__notice')!.textContent).toBe(
      CONFIG.CONSOLE_SITES_UNREADABLE('no sites'),
    )
  })
})
