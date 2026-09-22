/**
 * The console's body ([[REQ-298]]) — every site on the platform on the left, the
 * selected site's business on the right.
 *
 * THE QUESTION IT ANSWERS is *which tenant is costing us money, and what have we
 * actually built for them* — the first half is [[REQ-297]]'s and the second is
 * why a league table was not enough. A ranked list of business names answers
 * "who is expensive" and nothing else; an operator who then wants to look at
 * what that business has published, or at who to talk to about it, has nowhere
 * to go from the number.
 *
 * ONE ROW PER SITE, ACROSS EVERY BUSINESS — not one row per business. A business
 * with two sites is two rows, because the operator's question starts from
 * something they can see published.
 *
 * STANDARD `webui/list-detail` IN `no-tab` MODE, CONFIGURED RATHER THAN REBUILT,
 * which is the same decision the Library and the Contacts tab already made. This
 * is a master/detail; a second implementation of one would diverge from theirs
 * on divider behaviour, collapse and split persistence the first time any of
 * those was touched — and the divider is the whole reason [[REQ-298]] is a view
 * and not a dialog, so it is the last thing that should be hand-rolled here.
 *
 * TWO READS, JOINED HERE AND NOT ON THE SERVER. `/api/admin/sites` is the
 * directory and `/api/admin/spend/businesses` is the meter; they are separate
 * routes because a site with no spend must appear and a meter route that grew an
 * optional non-meter row would be one route with two answers. The join is by
 * business id, and the ORDER that comes out of it is a property of this surface
 * and of the period this surface is showing — neither of which either route
 * knows about.
 *
 * THE PERIOD IS ONE PERIOD AND NOT TWO. It governs the costs the rows are
 * ordered by AND the detail's figures, so changing it re-reads both and the list
 * re-orders — which is the point of it being one. Two would let an operator
 * compare a ranking over a month against a detail over a day and never see that
 * they had.
 *
 * IT KNOWS WHAT A SECTION IS AND NOT WHAT ONE SHOWS. The detail pane composes
 * `{id, label, mount(container, selection)}` — [[REQ-297]]'s registry, moved
 * from console-to-control to pane-to-section — and a section that throws is
 * reported in its own block while the rest of the pane renders. That matters
 * more here than it did there: a business whose spend read fails must still show
 * the operator who owns it and where the site is.
 */

import {
  CONSOLE_ACCOUNT_MISSING,
  CONSOLE_ACCOUNT_PLATFORM,
  CONSOLE_ACCOUNT_UNNAMED,
  CONSOLE_BUSINESS_NAME_MISSING,
  CONSOLE_FIELDS,
  CONSOLE_METER_UNREADABLE,
  CONSOLE_PANE_EMPTY,
  CONSOLE_PERIOD_DAYS,
  CONSOLE_PERIOD_LABEL,
  CONSOLE_SECTION_ACCOUNT,
  CONSOLE_SECTION_ADDRESS,
  CONSOLE_SECTION_FAILED,
  CONSOLE_SITES_EMPTY,
  CONSOLE_SITES_NONE_SELECTED,
  CONSOLE_SITES_TITLE,
  CONSOLE_SITES_UNREADABLE,
  CONSOLE_SITE_NO_ADDRESS,
} from './config.js'
import { mountListDetail } from '@lagrangefoundry/webui-list-detail'
import { clearDetail } from './detail-pane.js'
import { fetchPlatformSites, fetchTenantCost } from './api.js'
import { dollars, periodOfDays } from './tenant-cost.js'

/** The list/detail's stable id — what namespaces its split position. */
export const PLATFORM_SITES_ID = 'console-sites'

function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

/**
 * The rows, in the order the console shows them.
 *
 * COST DESCENDING, DEAREST BUSINESS FIRST, with the sites of one business
 * adjacent and every business with no measured spend after those that have some,
 * ordered by name. *Which tenant is costing us money* is the question this
 * console was built for and this is the only ordering that answers it by being
 * looked at; an alphabetical directory would answer nothing and would have to
 * grow a sort control on its first day.
 *
 * THE RANKING IS THE SERVER'S AND IS NOT RE-DERIVED HERE, which is the rule
 * [[REQ-297]]'s control already held itself to. `tenantSpendLeague` decides what
 * `null` means in a ranking of money — a business measured but not priced sorts
 * after every business that has a cost, because null is not a position on a
 * scale — and that decision belongs beside the arithmetic rather than in a
 * comparator the browser could get subtly different. So this reads the league's
 * POSITION rather than its figures.
 *
 * THE TAIL IS EVERY BUSINESS THE LEAGUE DOES NOT MENTION. Absent from the meter
 * means no measured turn in the window, which is exactly *nothing, never zero* —
 * so these businesses have no rank to sort by and are ordered by the one thing
 * they do have, their name. A site is never dropped for being in the tail: the
 * list is the platform's sites, and a list that quietly omitted the quiet ones
 * would be read as complete.
 *
 * THE SORT IS STABLE, SO WITHIN ONE BUSINESS THE ORDER IS THE ROUTE'S — oldest
 * site first. Nothing about a site other than its business is a reason to rank
 * it, and re-sorting would only make the order depend on a field nobody chose.
 */
export function orderedSites(sites, league = []) {
  const rank = new Map()
  league.forEach((row, index) => rank.set(row.business, index))
  const label = (row) => row.businessName ?? row.business

  const ranked = []
  const tail = []
  for (const site of sites) (rank.has(site.business) ? ranked : tail).push(site)

  ranked.sort((a, b) => rank.get(a.business) - rank.get(b.business))
  tail.sort((a, b) => {
    const byName = label(a).localeCompare(label(b))
    return byName !== 0 ? byName : a.business < b.business ? -1 : a.business > b.business ? 1 : 0
  })
  return [...ranked, ...tail]
}

/**
 * The account of the selected site's business — who to talk to, and whether
 * their account is in good standing.
 *
 * `NULL` IS THE PLATFORM BUSINESS AND SAYS SO rather than rendering blank.
 * `tenants.owner_account_id` is null for 1st Contact itself and for nothing
 * else, so the one row where this is empty is the row where it is CORRECT to be
 * empty — and a blank cell would make that indistinguishable from an account
 * record that has gone missing, which is the other thing this can be and is the
 * one worth noticing.
 *
 * A SECTION AND THEREFORE A FACTORY. It closes over nothing and reads nothing;
 * everything it renders is already on the row the pane hands it, which is why it
 * cannot fail and why the failure-isolation the pane provides is for its
 * neighbours rather than for this.
 */
export function accountSection() {
  return {
    id: 'account',
    label: CONSOLE_SECTION_ACCOUNT,
    mount(container, { site }) {
      container.append(
        field('business', CONSOLE_FIELDS.business, site.businessName ?? CONSOLE_BUSINESS_NAME_MISSING),
        field('business-id', CONSOLE_FIELDS.businessId, site.business),
      )
      if (site.ownerAccount === null) {
        container.append(el('p', 'builder-console-sites__nothing', CONSOLE_ACCOUNT_PLATFORM))
        return
      }
      container.append(
        field('account', CONSOLE_FIELDS.account, site.ownerAccountName ?? CONSOLE_ACCOUNT_UNNAMED),
        field('account-id', CONSOLE_FIELDS.accountId, site.ownerAccount),
        field('status', CONSOLE_FIELDS.status, site.ownerAccountStatus ?? CONSOLE_ACCOUNT_MISSING),
      )
    },
  }
}

/**
 * A link to the published site, or a sentence saying there is none.
 *
 * NEVER AN EMPTY ANCHOR AND NEVER A DEAD LINK. A site with no public address is
 * a real and common state — it is exactly what `POST /api/publish` refuses on
 * with `NO_PUBLIC_ADDRESS` — and an anchor with nothing behind it would train
 * the operator to click something that cannot work. The sentence says the same
 * fact the refusal says, from the same read, so the two cannot disagree.
 *
 * A NEW BROWSER TAB, because the published site is not a builder surface.
 * Leaving the builder should look like leaving it, and the console's split
 * position and selection should still be there on the way back. `rel` is set for
 * the ordinary reason an outward link in this app sets it.
 */
export function addressSection() {
  return {
    id: 'address',
    label: CONSOLE_SECTION_ADDRESS,
    mount(container, { site }) {
      if (!site.address) {
        container.append(el('p', 'builder-console-sites__nothing', CONSOLE_SITE_NO_ADDRESS))
        return
      }
      const link = document.createElement('a')
      link.className = 'builder-console-sites__address'
      link.href = `https://${site.address}`
      link.textContent = site.address
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      container.append(link)
    },
  }
}

/** One labelled fact in the detail pane, addressed by its id and never its label. */
function field(id, label, value) {
  const row = el('div', 'builder-console-sites__field')
  row.dataset.field = id
  row.append(
    el('span', 'builder-console-sites__field-label', label),
    el('span', 'builder-console-sites__field-value', value),
  )
  return row
}

/**
 * Mount the console's body into `container`.
 *
 * ITS TWO READS ARE INJECTED, defaulting to `api.js`, on [[REQ-297]]'s reasoning
 * exactly: that is what lets a UAT mount the real element against planted
 * answers and read back what an operator would see, rather than asserting
 * against a mock of the surface itself.
 *
 * @param {Element} container
 * @param {object} [spec]
 * @param {() => Promise<object>} [spec.fetchSites]
 * @param {(period: object) => Promise<object>} [spec.fetchLeague]
 * @param {Array<{id: string, label: string, mount: (el: Element, selection: object) => ({destroy?: () => void}|void)}>} [spec.sections]
 * @param {object} [spec.storage] a `shell.storage(...)` handle — the split position
 * @param {() => number} [spec.now]
 * @param {number} [spec.days] the opening window — see `CONSOLE_PERIOD_DAYS`
 */
export function mountPlatformSites(
  container,
  {
    fetchSites = fetchPlatformSites,
    fetchLeague = fetchTenantCost,
    sections = [],
    storage = null,
    now = () => Date.now(),
    days = CONSOLE_PERIOD_DAYS,
  } = {},
) {
  let periodDays = days
  let live = true
  let rows = []

  /**
   * THE PERIOD IS A CONTROL AND NOT A CONSTANT, and it sits ABOVE the split
   * rather than inside either pane. It governs both halves, so putting it in one
   * of them would be a control whose reach is wider than the box it is drawn in
   * — which is [[REQ-179]]'s objection to the toolbar's site selector, arriving
   * one level down.
   */
  const form = el('div', 'builder-console-sites__period')
  const label = el('label', 'builder-console-sites__period-label', CONSOLE_PERIOD_LABEL)
  const periodField = document.createElement('input')
  periodField.type = 'number'
  periodField.min = '1'
  periodField.className = 'builder-console-sites__period-field'
  periodField.value = String(periodDays)
  label.htmlFor = 'builder-console-sites-period'
  periodField.id = 'builder-console-sites-period'
  form.append(label, periodField)

  /**
   * One line above the split for whatever the surface has to say.
   *
   * IT CARRIES A TONE, because it says two different kinds of thing. *No site
   * has been provisioned yet* is an ordinary state of a young platform; *the
   * meter could not be read* is a fault. Rendering a settled fact in the colour
   * of a failure would send somebody looking for a problem that is not there.
   */
  const notice = el('p', 'builder-console-sites__notice')
  notice.hidden = true

  const element = el('div', 'builder-console-sites')
  container.append(form, notice, element)

  periodField.addEventListener('change', () => {
    const next = Number(periodField.value)
    if (!Number.isFinite(next) || next <= 0) {
      periodField.value = String(periodDays)
      return
    }
    periodDays = next
    void draw()
  })

  /**
   * The detail pane for one row — the sections, each in a block of its own.
   *
   * A SECTION IS HANDED THE SELECTION AS WELL AS ITS ELEMENT, which is the one
   * place this contract differs from the registry [[REQ-297]] wrote. A control
   * on that console mounted once and closed over its own subject; a section here
   * is re-mounted every time the operator picks a different row, so the subject
   * cannot be closed over — it has to arrive. `{site, period}` is the whole of
   * it: which row, and over what window.
   *
   * A SECTION THAT THROWS IS REPORTED IN ITS OWN BLOCK AND THE REST RENDER. A
   * business whose spend read fails must still show who owns it and where the
   * site is, which is the case that makes the isolation worth the indirection.
   *
   * A PANE WITH NO SECTIONS IS AN EMPTY PANE AND NOT A BROKEN ONE — the same
   * assertion the console made of itself, at the seam that survived the move.
   */
  function openDetail(site) {
    const view = el('div', 'builder-console-sites__detail')
    const mounted = []
    const selection = { site, period: periodOfDays(periodDays, now()) }

    if (sections.length === 0) {
      view.append(el('p', 'builder-console-sites__empty', CONSOLE_PANE_EMPTY))
    }

    for (const section of sections) {
      const block = el('section', 'builder-console-sites__section')
      block.dataset.section = section.id
      block.append(el('h3', 'builder-console-sites__section-label', section.label))
      const body = el('div', 'builder-console-sites__section-body')
      block.append(body)
      view.append(block)
      try {
        const handle = section.mount(body, selection)
        if (handle) mounted.push(handle)
      } catch (err) {
        body.replaceChildren(
          el(
            'p',
            'builder-console-sites__section-error',
            CONSOLE_SECTION_FAILED(err instanceof Error ? err.message : String(err)),
          ),
        )
      }
    }

    return {
      element: view,
      destroy() {
        for (const handle of mounted) {
          try {
            handle.destroy?.()
          } catch {
            // A section that cannot be torn down must not keep the pane open.
          }
        }
      },
    }
  }

  /**
   * One row: the site, whose it is, and what that business cost over the period.
   *
   * THE COST IS THE BUSINESS'S AND THE ROW SAYS SO. Two sites of one business
   * carry the same figure because the meter measures a business and not a site
   * ([[REQ-292]]'s `turn_spend.tenant_id`), and a row that divided it between
   * them would be inventing an attribution the data does not have.
   *
   * A SITE WHOSE BUSINESS HAS NO MEASURED TURN SHOWS NO COST — the dash, not a
   * zero. Nothing, never zero, arriving at the one place it is most easily lost.
   */
  function renderRow(site) {
    const row = el('div', 'builder-console-sites__row')
    row.dataset.site = site.site
    row.dataset.business = site.business
    row.append(
      el(
        'span',
        'builder-console-sites__row-business',
        site.businessName ?? site.business,
      ),
      el('span', 'builder-console-sites__row-address', site.address ?? ''),
      el('span', 'builder-console-sites__row-cost', dollars(site.costMicros ?? null)),
    )
    return row
  }

  const listDetail = mountListDetail(element, {
    id: PLATFORM_SITES_ID,
    ...(storage ? { storage } : {}),
    items: [],
    getKey: (site) => site.site,
    listTitle: CONSOLE_SITES_TITLE,
    renderRow,
    // ONE PANE, NOT TABS, on the Library's reasoning: this is browsed one site
    // at a time, and a tab bar that fills up as the operator clicks through a
    // customer list is clutter with a close button on it.
    mode: 'no-tab',
    openDetail,
    emptyDetail: el('p', 'builder-console-sites__unselected', CONSOLE_SITES_NONE_SELECTED),
  })

  /**
   * Read both routes, join them, and repaint.
   *
   * THE READS ARE SEQUENTIAL RATHER THAN CONCURRENT, on `tenantSpendLeague`'s
   * own reasoning about a console read: this is a person looking at a table
   * rather than a request on a hot path, and the league is already a fan-out
   * behind it.
   *
   * A FAILING METER DOES NOT EMPTY THE DIRECTORY. The sites read is the one this
   * surface cannot do without; if the league fails the list still renders, with
   * no cost beside any row and a notice saying why — an operator who came to see
   * what we have published should not be shown nothing because the meter was
   * unavailable. The order is then the no-spend order, by business name, which
   * is the RULE rather than a fallback: an unreadable meter means no business
   * has a measured cost, so every row is in the tail exactly as a quiet business
   * is on an ordinary read. A second ordering for this case would be a second
   * ordering to keep in step.
   */
  async function draw() {
    let sites = []
    try {
      sites = (await fetchSites())?.sites ?? []
    } catch (err) {
      if (!live) return
      rows = []
      listDetail.setItems([])
      clearDetail(listDetail)
      say(CONSOLE_SITES_UNREADABLE(reason(err)), 'problem')
      return
    }
    if (!live) return

    let league = []
    let meter = null
    try {
      league = (await fetchLeague(periodOfDays(periodDays, now())))?.businesses ?? []
    } catch (err) {
      meter = CONSOLE_METER_UNREADABLE(reason(err))
    }
    if (!live) return

    const cost = new Map(league.map((row) => [row.business, row.report?.costMicros ?? null]))
    rows = orderedSites(sites, league).map((site) => ({
      ...site,
      costMicros: cost.has(site.business) ? cost.get(site.business) : null,
    }))

    if (meter) say(meter, 'problem')
    else say(rows.length === 0 ? CONSOLE_SITES_EMPTY : null, 'quiet')
    const chosen = listDetail.getSelectedKey?.() ?? null
    listDetail.setItems(rows)
    /**
     * THE SELECTION SURVIVES A PERIOD CHANGE AND THE DETAIL IS RE-MOUNTED.
     * Re-selecting the same key is a no-op in `list-detail`, so the pane would
     * otherwise keep showing figures for the window the operator just left —
     * the exact disagreement between the two halves that one period exists to
     * prevent. Clearing first is what forces `openDetail` to run again with the
     * new period in hand.
     */
    if (chosen !== null && rows.some((row) => row.site === chosen)) {
      clearDetail(listDetail)
      listDetail.select(chosen)
    }
  }

  function say(message, tone = 'quiet') {
    notice.textContent = message ?? ''
    notice.dataset.tone = tone
    notice.hidden = message === null || message === undefined
  }

  const reason = (err) => (err instanceof Error ? err.message : String(err))

  void draw()

  return {
    destroy() {
      // THE FLAG AND THEN THE COMPONENT. `live` is what stops an in-flight read
      // painting into a detached tree; `destroy()` is what releases the split's
      // listeners. Both are needed and neither is the other.
      live = false
      listDetail.destroy()
    },
  }
}
