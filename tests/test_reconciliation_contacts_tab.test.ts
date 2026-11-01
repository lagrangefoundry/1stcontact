// @vitest-environment jsdom
/**
 * story-0034d937 — **the Contacts tab: the people of the business you are in,
 * and what each runs and holds.**
 *
 * The browser half of the story's evidence. Everything here mounts the real
 * panel (`createPeoplePanel`) — or the whole builder, where the claim is about
 * how the builder drives it (the tab strip, a business switch, a reload) —
 * against the actually-installed `webui-*` components. The only double is the
 * people transport, because that is the HTTP call. The origin half (who is in
 * the list, the 404, the grant's business name) is in the `.workers` sibling.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { PEOPLE_TAB, STORAGE_KEYS } from '../apps/control-app/src/builder/config.js'
import {
  ACCESS_STATES,
  PIPELINE_STAGES,
} from '../apps/control-app/src/builder/people-axes.js'

type Panel = {
  element: HTMLElement
  refresh(): Promise<unknown>
  clear(): void
  listDetail: { select(key: string): void }
}
type Handle = Record<string, any>

let createPeoplePanel: (opts?: Record<string, unknown>) => Panel
let NO_NAME_YET: string
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle
let setBusinessScope: (id: string | null) => string | null

if (!WEBUI_INSTALLED) console.warn(`story-0034d937 contacts-tab suite skipped: ${WEBUI_SKIP_REASON}`)

const repo = (...parts: string[]) => path.resolve(__dirname, '..', ...parts)
const CSS = readFileSync(repo('apps/control-app/src/builder/builder.css'), 'utf8')

const settle = async (n = 3) => {
  for (let i = 0; i < n; i += 1) await new Promise((r) => setTimeout(r, 0))
}

function memoryStorage() {
  const map = new Map<string, string>()
  return {
    map,
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
  invitedAt: null,
  firstSeenAt: null,
  lastSeenAt: null,
  termsAcceptedAt: null,
  pipelineStage: 'lead',
  createdAt: '2026-09-01T09:00:00.000Z',
  ...over,
})

const grant = (over: Record<string, unknown>) => ({
  accountId: null,
  source: 'admin_grant',
  status: 'active',
  startsAt: '2026-01-01T00:00:00.000Z',
  endsAt: null,
  note: null,
  ...over,
})

/**
 * The population, one person per shape the ACs name:
 *
 * - `usr_named` — has a display name; a Lead.
 * - `usr_nameless` — no display name; Invited; runs nothing and holds nothing.
 * - `usr_mixed` — runs X with no grant, and holds a grant on Y without running it.
 * - `usr_two` — runs X and holds two grants on X.
 * - `usr_gone` — holds a grant on a business whose row has vanished.
 * - `usr_novel` — at a pipeline stage this build has never heard of.
 */
const PEOPLE = [
  person({ id: 'usr_named', email: 'named@example.test', displayName: 'Alice Adams' }),
  person({
    id: 'usr_nameless',
    email: 'nameless@example.test',
    displayName: '',
    pipelineStage: 'invited',
    invitedAt: '2026-09-02T09:00:00.000Z',
  }),
  person({ id: 'usr_mixed', email: 'mixed@example.test', termsAcceptedAt: '2026-09-03T00:00:00Z' }),
  person({ id: 'usr_two', email: 'two@example.test' }),
  person({ id: 'usr_gone', email: 'gone@example.test' }),
  person({ id: 'usr_novel', email: 'novel@example.test', pipelineStage: 'qualified' }),
]

const X = { businessId: 'acct_x', name: 'X Ltd', role: 'owner', status: 'active', revokedAt: null }

const DETAILS: Record<string, { operates: unknown[]; grants: unknown[] }> = {
  usr_mixed: {
    operates: [X],
    grants: [
      grant({ id: 'ent_y', businessId: 'acct_y', businessName: 'Y Ltd', accountId: 'usr_mixed', plan: 'support' }),
    ],
  },
  usr_two: {
    operates: [X],
    grants: [
      grant({ id: 'ent_x1', businessId: 'acct_x', businessName: 'X Ltd', plan: 'starter', status: 'revoked' }),
      grant({ id: 'ent_x2', businessId: 'acct_x', businessName: 'X Ltd', plan: 'pro' }),
    ],
  },
  usr_gone: {
    operates: [],
    grants: [
      grant({ id: 'ent_gone', businessId: 'acct_gone', businessName: null, accountId: 'usr_gone', plan: 'pro' }),
    ],
  },
}

function transport(over: Record<string, unknown> = {}) {
  return {
    list: async () => ({ people: PEOPLE.map((p) => ({ ...p })), canInvite: true, canFulfil: true }),
    item: async (id: string) => ({
      person: { ...PEOPLE.find((p) => p.id === id)! },
      operates: (DETAILS[id]?.operates ?? []).map((b) => ({ ...(b as object) })),
      grants: (DETAILS[id]?.grants ?? []).map((g) => ({ ...(g as object) })),
    }),
    saveRecord: async () => ({}),
    grant: async () => ({}),
    revoke: async () => {},
    invite: async () => ({ created: true, person: PEOPLE[0] }),
    fulfil: async () => ({ businessId: 'acct_new', name: 'New', siteSlug: 'acct_new' }),
    ...over,
  }
}

const unhandled: unknown[] = []
const onUnhandled = (event: PromiseRejectionEvent | { reason: unknown }) =>
  void unhandled.push((event as { reason: unknown }).reason)
const onProcessUnhandled = (reason: unknown) => void unhandled.push(reason)

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ createPeoplePanel, NO_NAME_YET } = await import('../apps/control-app/src/builder/people.js'))
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
  }
  ;({ setBusinessScope } = await import('../apps/control-app/src/builder/api.js'))
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never
  globalThis.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  })) as never
  // The stylesheet the builder ships, loaded so computed styles are the cascade.
  const style = document.createElement('style')
  style.textContent = CSS
  document.head.append(style)
})

let root: HTMLElement
beforeEach(() => {
  setBusinessScope(null)
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
  unhandled.length = 0
  window.addEventListener('unhandledrejection', onUnhandled as never)
  process.on('unhandledRejection', onProcessUnhandled)
})

afterEach(() => {
  window.removeEventListener('unhandledrejection', onUnhandled as never)
  process.off('unhandledRejection', onProcessUnhandled)
  setBusinessScope(null)
})

async function panel(over: Record<string, unknown> = {}, storage = memoryStorage()) {
  const made = createPeoplePanel({ storage, transport: transport(over) })
  root.append(made.element)
  await made.refresh()
  return made
}

async function open(id: string, over: Record<string, unknown> = {}) {
  const made = await panel(over)
  made.listDetail.select(id)
  await settle()
  return root.querySelector('.builder-people__detail') as HTMLElement
}

const table = (detail: HTMLElement) =>
  detail.querySelector('.builder-people__table') as HTMLTableElement

const rowOf = (id: string) =>
  root.querySelector(`.list-detail-row[data-key="${id}"]`) as HTMLElement

/** Font size as rendered: jsdom does not inherit `font-size`, so walk up to the declaring box. */
function renderedFontSize(node: Element): string {
  for (let at: Element | null = node; at; at = at.parentElement) {
    const size = getComputedStyle(at).fontSize
    if (size && size !== 'medium' && size !== 'inherit') return size
  }
  return ''
}

/** A builder mounted with every transport injected, so nothing reaches a network. */
function mountApp(people: Record<string, unknown>, storage = memoryStorage()) {
  const sitesOf: Record<string, Array<{ slug: string; latest: number | null }>> = {
    acct_salon: [{ slug: 'salon-site', latest: null }],
    acct_studio: [{ slug: 'studio-site', latest: null }],
  }
  return mountBuilder(root, {
    businesses: [
      { id: 'acct_salon', name: 'Salon', selectable: true, lapse: null },
      { id: 'acct_studio', name: 'Studio', selectable: true, lapse: null },
    ],
    account: { name: 'Robin Owner', email: 'robin@example.test' },
    storage,
    markdownReady: Promise.resolve(),
    loadSites: async (id: string | null) => sitesOf[id ?? ''] ?? [],
    chatTransport: {
      openSession: async (slug: string) => ({ sessionId: `s-${slug}`, turns: [], ready: true }),
      streamPrompt: async function* () {
        yield { kind: 'done' }
      },
    },
    libraryTransport: {
      list: async () => ({ material: [] }),
      item: async () => ({ body: '' }),
      save: async () => ({}),
      fileUrl: (uid: string) => `/api/material/file?uid=${uid}`,
      upload: async () => ({ uid: 'm', role: 'site', indexed: true }),
    },
    paletteTransport: {
      get: async () => ({ palette: {}, usage: {} }),
      write: async () => ({ palette: {}, usage: {} }),
    },
    peopleTransport: people,
  })
}

const listedEmails = () =>
  [...root.querySelectorAll('.builder-people__row .builder-people__email')].map((n) => n.textContent)

describe.skipIf(!WEBUI_INSTALLED)('story-0034d937 — the tab and its name', () => {
  it('test_UAT_AC2177_tab_and_list_read_contacts_and_selection_persists_under_people', async () => {
    const storage = memoryStorage()
    let app = mountApp(transport(), storage)
    await vi.waitFor(() => expect(listedEmails()).toContain('named@example.test'))

    // The tab strip shows "Contacts" (outside the panel itself), and no tab or
    // heading reads Users / People / Admin.
    const leaves = [...root.querySelectorAll('*')].filter(
      (n) => n.children.length === 0 && !n.closest('.builder-people'),
    )
    expect(leaves.some((n) => n.textContent?.trim() === 'Contacts')).toBe(true)
    for (const word of ['Users', 'People', 'Admin']) {
      expect(leaves.some((n) => n.textContent?.trim() === word), word).toBe(false)
    }
    expect(PEOPLE_TAB.label).toBe('Contacts')

    // The list heading inside the tab.
    const title = root.querySelector('.builder-people .list-detail-list-title')
    expect(title?.textContent?.trim()).toBe('Contacts')

    // The stable identity stays `people`: it is what the panel mounts against.
    expect(PEOPLE_TAB.id).toBe('people')
    expect(app.shell.getPanel('people').querySelector('.builder-people')).not.toBeNull()

    // Select a row: the selection is persisted in a key namespaced by that
    // identity (`people:list`), never by the visible label.
    rowOf('usr_named').click()
    await settle()
    expect(rowOf('usr_named').classList.contains('selected')).toBe(true)
    expect(STORAGE_KEYS.people).toBe(`${PEOPLE_TAB.id}:list`)
    const selectionKeys = () =>
      [...storage.map.keys()].filter((k) => k.endsWith(`:${STORAGE_KEYS.people}:tabs`))
    expect(selectionKeys()).toHaveLength(1)
    const [key] = selectionKeys()
    expect(key.split(':').slice(-3)).toEqual(['people', 'list', 'tabs'])
    expect(JSON.parse(storage.map.get(key)!)).toEqual({ open: ['usr_named'], active: 'usr_named' })
    expect([...storage.map.keys()].some((k) => /contacts/i.test(k))).toBe(false)
    app.destroy()
    root.replaceChildren()

    // Reload: the builder mounts the tab against the same identity, and the
    // persisted selection record under it is still there, intact.
    app = mountApp(transport(), storage)
    await vi.waitFor(() => expect(listedEmails()).toContain('named@example.test'))
    await settle()
    expect(app.shell.getPanel('people').querySelector('.builder-people')).not.toBeNull()
    expect(selectionKeys()).toEqual([key])
    expect(JSON.parse(storage.map.get(key)!)).toEqual({ open: ['usr_named'], active: 'usr_named' })
    app.destroy()
  })
})

describe.skipIf(!WEBUI_INSTALLED)('story-0034d937 — the list', () => {
  it('test_UAT_AC2179_row_shows_name_and_address_in_two_cells_or_no_name_yet', async () => {
    await panel()
    const named = rowOf('usr_named')
    expect(named.querySelector('.builder-people__who')!.textContent).toBe('Alice Adams')
    expect(named.querySelector('.builder-people__email')!.textContent).toBe('named@example.test')

    // Empty string, like null, is "no display name".
    const nameless = rowOf('usr_nameless')
    expect(NO_NAME_YET).toBe('No name yet')
    expect(nameless.querySelector('.builder-people__who')!.textContent).toBe('No name yet')
    expect(nameless.querySelector('.builder-people__email')!.textContent).toBe('nameless@example.test')
    // Two separate cells, and the name cell is never blank.
    expect(nameless.querySelector('.builder-people__who')).not.toBe(
      nameless.querySelector('.builder-people__email'),
    )
    for (const cell of root.querySelectorAll('.builder-people__who')) {
      expect(cell.textContent!.trim().length).toBeGreaterThan(0)
    }
  })

  it('test_UAT_AC2180_business_switch_empties_the_list_then_rereads_for_the_new_business', async () => {
    const SALON = [person({ id: 'usr_salon', email: 'salon@example.test' })]
    const STUDIO = [person({ id: 'usr_studio', email: 'studio@example.test' })]
    const calls: string[] = []
    const studio = { release: () => {} }
    let failSalon = false
    let app: Handle | null = null

    const people = transport({
      list: async () => {
        const business = app!.scope.getBusiness() as string
        calls.push(business)
        if (business === 'acct_studio') {
          await new Promise<void>((resolve) => (studio.release = resolve))
          return { people: STUDIO.map((p) => ({ ...p })) }
        }
        if (failSalon) throw new Error('GET /api/people → 500')
        return { people: SALON.map((p) => ({ ...p })) }
      },
    })
    app = mountApp(people)
    await vi.waitFor(() => expect(listedEmails()).toEqual(['salon@example.test']))

    // Switch: the list is emptied before the new business's read has answered.
    const switching = app.scope.setBusiness('acct_studio')
    await vi.waitFor(() => expect(calls).toContain('acct_studio'))
    expect(listedEmails(), 'the old business is still listed under the new one').toEqual([])

    studio.release()
    await switching
    await settle()
    expect(listedEmails()).toEqual(['studio@example.test'])

    // A failed re-read leaves the list empty — never the previous business's rows.
    failSalon = true
    await app.scope.setBusiness('acct_salon')
    await settle()
    expect(calls.at(-1)).toBe('acct_salon')
    expect(listedEmails()).toEqual([])
    app.destroy()
  })
})

describe.skipIf(!WEBUI_INSTALLED)('story-0034d937 — the detail pane', () => {
  it('test_UAT_AC2182_selecting_a_person_opens_a_pane_at_once_that_fills_with_both_sections', async () => {
    const gate = { release: () => {} }
    const base = transport()
    const made = await panel({
      item: async (id: string) => {
        await new Promise<void>((resolve) => (gate.release = resolve))
        return base.item(id)
      },
    })

    made.listDetail.select('usr_named')
    // Mounted immediately, before the read resolves.
    const detail = root.querySelector('.builder-people__detail') as HTMLElement
    expect(detail).not.toBeNull()

    gate.release()
    await settle()
    const headings = [...detail.querySelectorAll('.builder-people__heading')].map((h) => h.textContent)
    expect(headings).toContain('Who they are')
    expect(headings).toContain('Businesses')
    expect(detail.textContent).toContain('named@example.test')
    expect(detail.textContent).toContain('Alice Adams')
    expect(detail.children.length).toBeGreaterThan(0)
    expect(unhandled, String(unhandled[0])).toEqual([])
  })

  it('test_UAT_AC2183_businesses_is_one_headed_table_keyed_by_business_with_named_gaps', async () => {
    const detail = await open('usr_mixed')
    expect(detail.querySelectorAll('table').length).toBe(1)
    const t = table(detail)
    expect([...t.querySelectorAll('thead th')].map((th) => th.textContent)).toEqual([
      'Business',
      'Role',
      'Plan',
      'Access',
      'Status',
    ])

    const names = [...t.querySelectorAll('.builder-people__name')].map((td) => td.textContent)
    // Operated businesses first, grant-only businesses after.
    expect(names).toEqual(['X Ltd', 'Y Ltd'])

    const lines = [...t.querySelectorAll('tbody tr')]
    const x = lines.find((tr) => tr.textContent?.includes('X Ltd'))!
    expect(x.querySelector('.builder-people__role')!.textContent).toBe('owner')
    const noGrant = [...x.querySelectorAll('.builder-people__none')].map((td) => td.textContent)
    expect(noGrant).toEqual(['No grant'])

    const y = lines.find((tr) => tr.textContent?.includes('Y Ltd'))!
    expect(y.querySelector('.builder-people__none')!.textContent).toBe('Not an operator')
    expect(y.querySelector('.builder-people__plan')!.textContent).toBe('support')
    expect(y.querySelector('.builder-people__window')!.textContent).toBe('open-ended')
    expect(y.querySelector('.builder-people__grantstatus')!.textContent).toContain('active')

    // Neither relation: a sentence and no table.
    root.replaceChildren()
    const none = await open('usr_nameless')
    expect(none.querySelector('table')).toBeNull()
    expect(none.querySelector('.builder-people__empty')!.textContent).toBe(
      'None — they run no business, and hold no grant.',
    )
  })

  it('test_UAT_AC2184_several_grants_on_one_business_share_one_business_and_role_cell', async () => {
    const detail = await open('usr_two')
    const t = table(detail)
    const xNames = [...t.querySelectorAll('td')].filter((td) => td.textContent === 'X Ltd')
    expect(xNames.length).toBe(1)
    expect((xNames[0] as HTMLTableCellElement).rowSpan).toBe(2)
    const role = t.querySelector('.builder-people__role') as HTMLTableCellElement
    expect(role.rowSpan).toBe(2)

    // Both grants, each on its own line; neither dropped nor merged.
    const lines = [...t.querySelectorAll('tbody tr')]
    expect(lines.length).toBe(2)
    expect(lines.map((tr) => tr.querySelector('.builder-people__plan')?.textContent)).toEqual([
      'starter',
      'pro',
    ])
  })

  it('test_UAT_AC2185_rendered_business_cell_shows_the_name_or_the_id_of_a_vanished_business', async () => {
    // A grant on a business they do not run renders under that business's name.
    const mixed = await open('usr_mixed')
    const y = [...table(mixed).querySelectorAll('tbody tr')].find((tr) =>
      tr.querySelector('.builder-people__plan')?.textContent === 'support',
    )!
    expect(y.querySelector('.builder-people__name')!.textContent).toBe('Y Ltd')

    // A grant whose business row is gone is still listed, under the business id.
    root.replaceChildren()
    const gone = await open('usr_gone')
    const lines = [...table(gone).querySelectorAll('tbody tr')]
    expect(lines.length).toBe(1)
    expect(lines[0].querySelector('.builder-people__name')!.textContent).toBe('acct_gone')
    expect(lines[0].querySelector('.builder-people__plan')!.textContent).toBe('pro')
  })
})

describe.skipIf(!WEBUI_INSTALLED)('story-0034d937 — presentation', () => {
  it('test_UAT_AC2186_list_detail_table_and_both_dialogs_are_styled_to_webui_fields_metrics', async () => {
    const made = await panel()
    // The panel fills its tab's height.
    expect(getComputedStyle(made.element).height).toBe('100%')

    // List rows: the name at 13px; the address muted and on one line.
    const row = rowOf('usr_named')
    const who = row.querySelector('.builder-people__who')!
    const email = row.querySelector('.builder-people__email')!
    expect(renderedFontSize(who)).toBe('13px')
    expect(getComputedStyle(email).whiteSpace).toBe('nowrap')
    const muted = getComputedStyle(email).color
    expect(muted).not.toBe('')

    // Detail pane: padded, gapped, sections under headings.
    made.listDetail.select('usr_two')
    await settle()
    const detail = root.querySelector('.builder-people__detail') as HTMLElement
    expect(getComputedStyle(detail).paddingLeft).toBe('12px')
    // jsdom's style engine does not model `gap`, so the gap is read from the rule.
    expect(/\.builder-people__detail\s*\{([^}]*)\}/.exec(CSS)![1]).toMatch(/gap:\s*12px/)
    for (const heading of detail.querySelectorAll('.builder-people__heading')) {
      expect(heading.nextElementSibling?.classList.contains('builder-people__section')).toBe(true)
    }

    // Joined table: 13px, 3px/8px cells, a 1px rule, muted weight-500 headings.
    const t = table(detail)
    for (const td of t.querySelectorAll('td')) {
      const cs = getComputedStyle(td)
      expect(renderedFontSize(td)).toBe('13px')
      expect(cs.paddingTop).toBe('3px')
      expect(cs.paddingLeft).toBe('8px')
      expect(cs.paddingRight).toBe('8px')
      expect(cs.borderBottomWidth || cs.borderBottom).toMatch(/^1px/)
    }
    for (const th of t.querySelectorAll('th')) {
      expect(getComputedStyle(th).fontWeight).toBe('500')
      expect(getComputedStyle(th).color).toBe(muted)
    }

    // Empty-state paragraph: 13px, muted.
    made.listDetail.select('usr_nameless')
    await settle()
    const empty = root.querySelector('.builder-people__empty')!
    expect(renderedFontSize(empty)).toBe('13px')
    expect(getComputedStyle(empty).color).toBe(muted)

    // The invite dialog: styled inputs, 13px hint and outcome.
    ;(root.querySelector('.builder-people__invite') as HTMLButtonElement).click()
    await settle()
    for (const name of ['.builder-people__invite-email', '.builder-people__invite-name']) {
      const input = root.querySelector(name)!
      expect(getComputedStyle(input).paddingLeft, name).toBe('10px')
      expect(getComputedStyle(input).display, name).toBe('block')
    }
    expect(renderedFontSize(root.querySelector('.builder-people__invite-hint')!)).toBe('13px')
    expect(renderedFontSize(root.querySelector('.builder-people__invite-said')!)).toBe('13px')

    // The provisioning dialog, opened from a person.
    made.listDetail.select('usr_named')
    await settle()
    ;(root.querySelector('.builder-people__fulfil') as HTMLButtonElement).click()
    await settle()
    const fulfilName = root.querySelector('.builder-people__fulfil-name')!
    expect(getComputedStyle(fulfilName).paddingLeft).toBe('10px')
    expect(getComputedStyle(fulfilName).display).toBe('block')
    expect(renderedFontSize(root.querySelector('.builder-people__fulfil-who')!)).toBe('13px')
    expect(renderedFontSize(root.querySelector('.builder-people__fulfil-said')!)).toBe('13px')
  })

  it('test_UAT_AC2187_no_contacts_style_rule_keys_on_a_stage_access_or_grant_status_value', async () => {
    const GRANT_STATUSES = ['active', 'revoked', 'expired']

    // Every selector of every rule that styles this tab.
    const selectors = [...CSS.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{/g)]
      .flatMap((m) => m[1].split(','))
      .map((s) => s.trim())
      .filter((s) => s.includes('builder-people'))
    expect(selectors.length).toBeGreaterThan(20)

    const classTokens = selectors.flatMap((s) => [...s.matchAll(/\.([\w-]+)/g)].map((m) => m[1]))
    const suffixes = classTokens.map((c) => c.replace(/^builder-people(__|--)?/, '').split(/__|--/).pop()!)
    const attributeValues = selectors.flatMap((s) =>
      [...s.matchAll(/\[[^\]=]+[~|^$*]?=\s*["']?([^"'\]]+)["']?\s*\]/g)].map((m) => m[1]),
    )
    for (const value of [...PIPELINE_STAGES, ...ACCESS_STATES]) {
      expect(suffixes, `a class keys on "${value}"`).not.toContain(value)
      expect(attributeValues, `an attribute keys on "${value}"`).not.toContain(value)
    }
    for (const value of GRANT_STATUSES) {
      expect(attributeValues, `an attribute keys on "${value}"`).not.toContain(value)
    }
    // The grant-status cell takes one rule for every value: no compound selector
    // narrows it by another class or attribute.
    const grantStatus = selectors.filter((s) => s.includes('builder-people__grantstatus'))
    expect(grantStatus.length).toBeGreaterThan(0)
    for (const s of grantStatus) {
      const compound = s.split(/\s+|>|\+|~/).find((part) => part.includes('builder-people__grantstatus'))!
      expect(compound.replace('.builder-people__grantstatus', ''), s).not.toMatch(/[.[]/)
    }

    // Rendered: Lead, Invited and a never-seen stage carry the same single class.
    await panel()
    const stageOf = (id: string) => rowOf(id).querySelector('[class*="stage"]') as HTMLElement
    const stages = ['usr_named', 'usr_nameless', 'usr_novel'].map(stageOf)
    expect(stages.map((s) => s.textContent)).toEqual(['Lead', 'Invited', 'qualified'])
    for (const s of stages) expect(s.className).toBe('builder-people__stage')

    // Grant-status cells holding different statuses carry the same single class.
    root.replaceChildren()
    const detail = await open('usr_two')
    const cells = [...detail.querySelectorAll('td')].filter((td) =>
      ['active', 'revoked'].some((v) => td.firstChild?.textContent === v),
    )
    expect(cells.map((td) => td.firstChild?.textContent).sort()).toEqual(['active', 'revoked'])
    for (const td of cells) expect(td.className).toBe('builder-people__grantstatus')
  })
})
