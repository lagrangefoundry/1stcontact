// @vitest-environment jsdom
/**
 * REQ-189 — **the User tab is styled, and its detail panel is one table.**
 *
 * WHAT THIS FILE PROVES. Three claims that are one change: that every class the
 * tab emits is matched by a rule (it emitted correct DOM and `builder.css` held
 * no `builder-people` rule at all, so every field ran into the next at the
 * browser's default size); that the rules MATCH `webui-fields` rather than
 * inventing a second look for the same kind of content; and that the two tables
 * the detail pane used to hold — *Businesses they run* and *Grants* — are one
 * table keyed by business, where the mismatches an operator needs are an empty
 * cell on a filled row rather than a join to do in their head.
 *
 * WHAT IS ASSERTED AND WHAT DELIBERATELY IS NOT. jsdom computes no layout, so
 * "aligned" and "spaced" are proven by the CSS contract that produces them —
 * every emitted class has a rule, and the table's type scale and gutter are read
 * out of `fields.css` and compared rather than restated as literals. Measuring a
 * box jsdom reports as zero either way would prove nothing.
 *
 * MOUNTED AGAINST THE ACTUALLY-INSTALLED COMPONENTS, on the pattern the REQ-161
 * and REQ-186 suites established: the only double is the HTTP call, because that
 * is the network.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { webuiPackageDir } from '../tools/generate/src/cli/webui'

let createPeoplePanel: (opts?: Record<string, unknown>) => never
let joinBusinesses: (
  operates: Array<Record<string, unknown>>,
  grants: Array<Record<string, unknown>>,
) => Array<{ businessId: string; name: string | null; membership: unknown; grants: unknown[] }>
let NO_NAME_YET: string

if (!WEBUI_INSTALLED) console.warn(`REQ-189 users-tab suite skipped: ${WEBUI_SKIP_REASON}`)

const repo = (...parts: string[]) => path.resolve(__dirname, '..', ...parts)
const CSS = readFileSync(repo('apps/control-app/src/builder/builder.css'), 'utf8')

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

function memoryStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size
    },
  }
}

const person = (over: Record<string, unknown>) => ({
  displayName: null,
  status: 'active',
  invitedAt: '2026-09-01T10:00:00.000Z',
  firstSeenAt: null,
  lastSeenAt: null,
  termsAcceptedAt: null,
  createdAt: '2026-09-01T09:00:00.000Z',
  ...over,
})

/**
 * ONE PERSON CARRYING EVERY SHAPE THE TABLE HAS TO DRAW, because they co-occur
 * in real life and the join has to hold all three at once:
 *
 * - `acct_run` — a business they run, with a live grant. The ordinary row.
 * - `acct_lapsed` — a business they run with NO grant. The lapsed customer.
 * - `acct_stray` — a grant against a business they do NOT run. A support
 *   arrangement, or a mistake.
 * - `acct_two` — a business they run holding TWO grants, so the join is proven
 *   not to have collapsed a list into a single current value.
 */
const DETAIL = {
  operates: [
    { businessId: 'acct_run', name: 'Running Ltd', role: 'owner', status: 'active', revokedAt: null },
    {
      businessId: 'acct_lapsed',
      name: 'Lapsed Ltd',
      role: 'owner',
      status: 'active',
      revokedAt: null,
    },
    { businessId: 'acct_two', name: 'Two Grants Ltd', role: 'owner', status: 'active', revokedAt: null },
  ],
  grants: [
    {
      id: 'ent_1',
      businessId: 'acct_run',
      businessName: 'Running Ltd',
      accountId: null,
      plan: 'pro',
      source: 'admin_grant',
      status: 'active',
      startsAt: '2026-01-01T00:00:00.000Z',
      endsAt: null,
      note: null,
    },
    {
      id: 'ent_2',
      businessId: 'acct_stray',
      businessName: 'Somebody Else Ltd',
      accountId: 'usr_1',
      plan: 'support',
      source: 'admin_grant',
      status: 'active',
      startsAt: '2026-01-01T00:00:00.000Z',
      endsAt: '2026-12-01T00:00:00.000Z',
      note: null,
    },
    {
      id: 'ent_3',
      businessId: 'acct_two',
      businessName: 'Two Grants Ltd',
      accountId: null,
      plan: 'starter',
      source: 'admin_grant',
      status: 'revoked',
      startsAt: '2026-01-01T00:00:00.000Z',
      endsAt: null,
      note: null,
    },
    {
      id: 'ent_4',
      businessId: 'acct_two',
      businessName: 'Two Grants Ltd',
      accountId: null,
      plan: 'pro',
      source: 'admin_grant',
      status: 'active',
      startsAt: '2026-06-01T00:00:00.000Z',
      endsAt: null,
      note: null,
    },
  ],
}

const PEOPLE = [
  person({ id: 'usr_1', email: 'alice@example.test', displayName: 'Alice Adams' }),
  // Nothing in the system can set `display_name` yet (REQ-183 §5), so this is
  // what every row looks like today — and the reason the empty state matters.
  person({ id: 'usr_2', email: 'nameless@example.test', displayName: null }),
]

const revoked: string[] = []

function transport() {
  return {
    list: async () => ({ people: PEOPLE.map((p) => ({ ...p })), canInvite: true, canFulfil: true }),
    item: async (id: string) => ({
      person: { ...PEOPLE.find((p) => p.id === id)! },
      operates: id === 'usr_1' ? DETAIL.operates.map((b) => ({ ...b })) : [],
      grants: id === 'usr_1' ? DETAIL.grants.map((g) => ({ ...g })) : [],
    }),
    saveStatus: async (_id: string, _status: string) => ({}),
    grant: async () => ({}),
    revoke: async (id: string) => void revoked.push(id),
    invite: async () => ({ created: true, person: PEOPLE[0] }),
    fulfil: async () => ({ businessId: 'acct_new', name: 'New', siteSlug: 'acct_new' }),
  }
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ createPeoplePanel, joinBusinesses, NO_NAME_YET } = await import(
      '../apps/control-app/src/builder/people.js'
    ))
  }
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never
})

let root: HTMLElement
beforeEach(() => {
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
  revoked.length = 0
})

async function panel() {
  const made = createPeoplePanel({ storage: memoryStorage(), transport: transport() })
  root.append(made.element)
  await made.refresh()
  return made
}

async function open(id: string) {
  const made = await panel()
  ;(made as unknown as { listDetail: { select(k: string): void } }).listDetail.select(id)
  await settle()
  await settle()
  return root.querySelector('.builder-people__detail') as HTMLElement
}

const table = (detail: HTMLElement) =>
  detail.querySelector('.builder-people__table') as HTMLTableElement

/** Every `builder-people*` class the tab actually renders. */
function emittedClasses(scope: ParentNode): string[] {
  const found = new Set<string>()
  for (const node of scope.querySelectorAll('[class]')) {
    for (const name of node.classList) if (name.startsWith('builder-people')) found.add(name)
  }
  return [...found].sort()
}

describe.skipIf(!WEBUI_INSTALLED)('REQ-189 — nothing on this tab is unstyled', () => {
  it('test_UAT_FC_REQ-189_every_class_the_tab_emits_has_a_rule_in_the_stylesheet', async () => {
    // THE DEFECT, STATED AS A TEST. The tab rendered correct DOM and the
    // stylesheet held no `builder-people` rule at all, so this assertion is the
    // whole presentation claim: rendered, not merely written down.
    // Opened, because half the classes only exist once a person is selected.
    expect(await open('usr_1')).toBeTruthy()
    const classes = emittedClasses(root)
    expect(classes.length).toBeGreaterThan(12)
    const unstyled = classes.filter((name) => !CSS.includes(`.${name}`))
    expect(unstyled, `no rule matches: ${unstyled.join(', ')}`).toEqual([])
  })

  it('test_UAT_FC_REQ-189_the_dialogs_this_tab_opens_are_styled_too', async () => {
    // The same defect one surface along: the invite and provisioning dialogs
    // emit `builder-people__*` fields that nothing matched either, so they were
    // default-sized boxes inside a panel that is otherwise the app's.
    const made = await panel()
    ;(root.querySelector('.builder-people__invite') as HTMLButtonElement).click()
    await settle()
    const unstyled = emittedClasses(root).filter((name) => !CSS.includes(`.${name}`))
    expect(unstyled, `no rule matches: ${unstyled.join(', ')}`).toEqual([])
    expect(made).toBeTruthy()
  })

  it('test_UAT_FC_REQ-189_the_table_takes_its_type_scale_and_gutter_from_webui_fields', async () => {
    // MATCHED, NOT RESTATED. The two numbers are read out of the component's own
    // stylesheet and compared, so the day `fields.css` moves either one this
    // fails rather than the tab quietly acquiring a second look for the same
    // kind of content.
    const fields = readFileSync(
      path.join(webuiPackageDir('webui-fields'), 'src', 'fields.css'),
      'utf8',
    )
    const size = /--fields-font-size,\s*(\d+px)/.exec(fields)![1]
    const gutter = /\.fields-row\s*\{[^}]*?padding:\s*([^;]+);/s.exec(fields)![1].trim()

    const rule = /\.builder-people__table th,\s*\.builder-people__table td\s*\{([^}]*)\}/s.exec(CSS)![1]
    expect(rule).toContain(`padding: ${gutter};`)
    expect(/\.builder-people__table\s*\{([^}]*)\}/s.exec(CSS)![1]).toContain(`font-size: ${size};`)
  })

  it('test_UAT_FC_REQ-189_no_rule_here_branches_on_what_a_state_is_called', async () => {
    // [[REQ-188]] replaced Member/Contact with two axes whose value sets both
    // grow ([[DOC-44]] §3, §4). A rule per label would have to be found and
    // edited again on each of those days, so there is none: classes name the
    // AXIS — `__stage`, `__access` — and the choice of which value earns a badge
    // is made in the panel, in one line.
    const people = CSS.split('\n').filter((line) => line.includes('builder-people'))
    const branching = people.filter((line) => /member|contact|invited|lead/i.test(line))
    expect(branching, branching.join(' | ')).toEqual([])
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-189 — the list shows the name when there is one', () => {
  it('test_UAT_FC_REQ-189_a_row_shows_the_name_and_the_address_rather_than_one_or_the_other', async () => {
    await panel()
    const rows = [...root.querySelectorAll('.builder-people__row')]
    const alice = rows[0]
    expect(alice.querySelector('.builder-people__who')!.textContent).toBe('Alice Adams')
    // The address is NOT lost to the name. The row used to print
    // `displayName || email`, so a person with a name fell off the list as an
    // address and the list read as addresses only.
    expect(alice.querySelector('.builder-people__email')!.textContent).toBe('alice@example.test')
  })

  it('test_UAT_FC_REQ-189_a_row_with_no_name_reads_as_no_name_yet_and_not_as_a_broken_cell', async () => {
    // It will be empty for everybody until something can set `display_name`
    // (REQ-183 §5). That is the reason the empty state has to say which of the
    // two it is — in words, and quietly rather than in an error colour.
    await panel()
    const nameless = [...root.querySelectorAll('.builder-people__row')][1]
    const cell = nameless.querySelector('.builder-people__who')!
    expect(cell.textContent).toBe(NO_NAME_YET)
    expect(/no name/i.test(NO_NAME_YET)).toBe(true)
    expect(cell.classList.contains('builder-people__noname')).toBe(true)
    expect(nameless.querySelector('.builder-people__email')!.textContent).toBe(
      'nameless@example.test',
    )
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-189 — one table keyed by business, and the mismatches show', () => {
  it('test_UAT_FC_REQ-189_the_detail_panel_holds_one_table_and_not_two', async () => {
    const detail = await open('usr_1')
    expect(detail.querySelectorAll('table').length).toBe(1)
    // ...and the headings the old pair never had, so the reader is no longer
    // inferring what each value means from its shape.
    const headings = [...table(detail).querySelectorAll('th')].map((th) => th.textContent)
    expect(headings).toEqual(['Business', 'Role', 'Plan', 'Access', 'Status'])
  })

  it('test_UAT_FC_REQ-189_one_row_per_business_carries_both_the_membership_and_the_grant_facts', async () => {
    const detail = await open('usr_1')
    const running = [...table(detail).querySelectorAll('tr')].find((tr) =>
      tr.textContent?.includes('Running Ltd'),
    )!
    // Membership fact and grant fact, on ONE row. Two tables put these on two
    // rows in two places and left the join to the reader.
    expect(running.querySelector('.builder-people__role')!.textContent).toContain('owner')
    expect(running.querySelector('.builder-people__plan')!.textContent).toBe('pro')
    expect(running.querySelector('.builder-people__grantstatus')!.textContent).toContain('active')
  })

  it('test_UAT_FC_REQ-189_a_business_they_run_with_no_grant_says_so_on_its_own_row', async () => {
    // THE LAPSED CUSTOMER. Two tables hid this state — it was a row in one and
    // an absence in the other, visible only to somebody reading both.
    const detail = await open('usr_1')
    const lapsed = [...table(detail).querySelectorAll('tr')].find((tr) =>
      tr.textContent?.includes('Lapsed Ltd'),
    )!
    expect(lapsed.querySelector('.builder-people__role')!.textContent).toContain('owner')
    const empty = lapsed.querySelector('.builder-people__none')!
    expect(empty.textContent).toBe('No grant')
    // Said in words rather than left blank: a blank cell is indistinguishable
    // from a value that failed to load.
    expect(empty.textContent!.trim().length).toBeGreaterThan(0)
  })

  it('test_UAT_FC_REQ-189_a_grant_against_a_business_they_do_not_run_says_so_on_its_own_row', async () => {
    // A SUPPORT ARRANGEMENT, OR A MISTAKE — and under two tables it was neither,
    // it was just another grant row that looked exactly like the legitimate one.
    const detail = await open('usr_1')
    const stray = [...table(detail).querySelectorAll('tr')].find((tr) =>
      tr.textContent?.includes('Somebody Else Ltd'),
    )!
    expect(stray.querySelector('.builder-people__none')!.textContent).toBe('Not an operator')
    expect(stray.querySelector('.builder-people__plan')!.textContent).toBe('support')
    expect(stray.querySelector('.builder-people__window')!.textContent).toContain('until')
  })

  it('test_UAT_FC_REQ-189_a_business_holding_two_grants_shows_both_under_one_business_cell', async () => {
    // GRANTS ARE STILL A LIST (DOC-40 §5). The join changed which axis they are
    // grouped on; a table that picked a current value would misrepresent an
    // account holding two the moment billing lands.
    const detail = await open('usr_1')
    const lines = [...table(detail).querySelectorAll('tbody tr')].filter((tr) =>
      ['starter', 'pro'].includes(tr.querySelector('.builder-people__plan')?.textContent ?? ''),
    )
    const two = lines.filter((tr) => tr.querySelector('.builder-people__name') === null)
    expect(two.length).toBeGreaterThanOrEqual(1)
    const name = [...table(detail).querySelectorAll('.builder-people__name')].find(
      (td) => td.textContent === 'Two Grants Ltd',
    ) as HTMLTableCellElement
    // The business is named ONCE and spans its grants, so two grants read as two
    // grants on one business rather than as two businesses sharing a name.
    expect(name.rowSpan).toBe(2)
  })

  it('test_UAT_FC_REQ-189_withdrawing_a_grant_is_offered_only_where_there_is_one_to_withdraw', async () => {
    const detail = await open('usr_1')
    const rows = [...table(detail).querySelectorAll('tbody tr')]
    const revokedRow = rows.find(
      (tr) => tr.querySelector('.builder-people__grantstatus')?.textContent?.includes('revoked'),
    )!
    expect(revokedRow.querySelector('.builder-people__revokegrant')).toBeNull()

    const live = rows.find((tr) => tr.textContent?.includes('Running Ltd'))!
    ;(live.querySelector('.builder-people__revokegrant') as HTMLButtonElement).click()
    await settle()
    expect(revoked).toEqual(['ent_1'])
  })

  it('test_UAT_FC_REQ-189_somebody_who_runs_nothing_and_holds_nothing_is_told_so', async () => {
    const detail = await open('usr_2')
    expect(detail.querySelector('.builder-people__table')).toBeNull()
    expect(detail.querySelector('.builder-people__empty')!.textContent).toContain('None')
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-189 — the join itself', () => {
  it('test_UAT_FC_REQ-189_the_join_keys_on_the_business_and_keeps_operated_ones_first', async () => {
    // PURE, so the claim the ticket makes is provable without a DOM: operator
    // and entitled are different relations that share a key, and the join is
    // where that shape lives.
    const rows = joinBusinesses(DETAIL.operates, DETAIL.grants)
    expect(rows.map((r) => r.businessId)).toEqual([
      'acct_run',
      'acct_lapsed',
      'acct_two',
      // The exception sorts to the end rather than interleaving into an order
      // the operator learned to read.
      'acct_stray',
    ])
    expect(rows.find((r) => r.businessId === 'acct_lapsed')!.grants).toEqual([])
    expect(rows.find((r) => r.businessId === 'acct_stray')!.membership).toBeNull()
    expect(rows.find((r) => r.businessId === 'acct_two')!.grants.length).toBe(2)
  })

  it('test_UAT_FC_REQ-189_a_business_named_only_by_a_grant_still_gets_its_name', async () => {
    // Which is why the origin joins `tenants` for the grant too — see the
    // workers sibling. Without it this row could only ever say `acct_stray`.
    const rows = joinBusinesses([], DETAIL.grants)
    expect(rows.find((r) => r.businessId === 'acct_stray')!.name).toBe('Somebody Else Ltd')
  })
})
