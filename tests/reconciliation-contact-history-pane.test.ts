// @vitest-environment jsdom
/**
 * Reconciliation UATs — story-4630e921 (REQ-195): the History section of the
 * Contacts tab detail pane.
 *
 * Mounted against the actually-installed people panel; the only double is the
 * HTTP transport, because that is the network. One test per acceptance
 * criterion.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createPeoplePanel: (opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`story-4630e921 history pane suite skipped: ${WEBUI_SKIP_REASON}`)

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
  pipelineStage: 'invited',
  invitedAt: '2026-09-01T10:00:00.000Z',
  firstSeenAt: null,
  lastSeenAt: null,
  termsAcceptedAt: null,
  createdAt: '2026-09-01T09:00:00.000Z',
  ...over,
})

const event = (over: Record<string, unknown>) => ({
  id: 'evt_x',
  contactId: 'usr_mixed',
  businessId: 'acct_a',
  ref: null,
  detail: {},
  ...over,
})

const same = (at: string) => ({ occurredAt: at, recordedAt: at })

const PEOPLE = [
  person({ id: 'usr_mixed', email: 'mixed@example.test' }),
  person({ id: 'usr_known', email: 'known@example.test' }),
  person({ id: 'usr_silent', email: 'silent@example.test' }),
]

/** Newest first as the server returns it; mixes known and unknown kinds. */
const MIXED = [
  event({ kind: 'email.bounced', ...same('2026-09-04T16:20:00.000Z'), ref: 'email-1' }),
  event({ kind: 'email.sent', ...same('2026-09-03T08:05:00.000Z'), ref: 'email-1' }),
  event({ kind: 'consultation.booked', ...same('2026-09-02T14:00:00.000Z') }),
  event({
    kind: 'list.joined',
    occurredAt: '2026-03-04T12:00:00.000Z',
    recordedAt: '2026-09-01T09:00:00.000Z',
  }),
]

/** Every labelled kind once, newest first. */
const KNOWN = [
  event({ kind: 'email.received', ...same('2026-09-10T10:06:00.000Z') }),
  event({ kind: 'email.bounced', ...same('2026-09-10T10:05:00.000Z') }),
  event({ kind: 'email.delivered', ...same('2026-09-10T10:04:00.000Z') }),
  event({ kind: 'email.sent', ...same('2026-09-10T10:03:00.000Z') }),
  event({ kind: 'member.signed_up', ...same('2026-09-10T10:02:00.000Z') }),
  event({ kind: 'contact.invited', ...same('2026-09-10T10:01:00.000Z') }),
  event({ kind: 'contact.created', ...same('2026-09-10T10:00:00.000Z') }),
]

/**
 * Provenance is supplied separately by the server. For `usr_known` it is a
 * DIFFERENT event from the last displayed row, so a pane reading the list's
 * tail would draw the wrong origin.
 */
const DETAIL: Record<string, Record<string, unknown>> = {
  usr_mixed: { events: MIXED, provenance: MIXED[3] },
  usr_known: {
    events: KNOWN,
    provenance: event({ kind: 'list.joined', ...same('2025-12-31T23:30:00.000Z') }),
  },
  usr_silent: { events: [], provenance: null },
}

function transport() {
  return {
    list: async () => ({ people: PEOPLE.map((p) => ({ ...p })), canInvite: true, canFulfil: false }),
    item: async (id: string) => ({
      person: { ...PEOPLE.find((p) => p.id === id)! },
      emails: [{ id: 'eml_1', email: 'x@example.test', isPrimary: true, createdAt: '2026-01-01T00:00:00.000Z' }],
      operates: [],
      grants: [],
      ...DETAIL[id],
    }),
    saveRecord: async () => ({ ...PEOPLE[0] }),
    saveStatus: async () => ({}),
    grant: async () => ({}),
    revoke: async () => {},
    invite: async () => ({ created: true, person: PEOPLE[0] }),
    fulfil: async () => ({ businessId: 'acct_new', name: 'New', siteSlug: 'new' }),
  }
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    const panel = await import('../apps/control-app/src/builder/people.js')
    ;({ createPeoplePanel } = panel as never)
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
})

async function open(id: string): Promise<HTMLElement> {
  const made = createPeoplePanel({ storage: memoryStorage(), transport: transport() })
  root.append((made as unknown as { element: HTMLElement }).element)
  await (made as unknown as { refresh(): Promise<unknown> }).refresh()
  ;(made as unknown as { listDetail: { select(k: string): void } }).listDetail.select(id)
  await settle()
  await settle()
  return root.querySelector('.builder-people__detail') as HTMLElement
}

/** The body that follows the "History" heading — the whole section. */
function historySection(detail: HTMLElement): HTMLElement {
  const heading = [...detail.querySelectorAll('.builder-people__heading')].find(
    (h) => h.textContent?.trim() === 'History',
  )
  expect(heading, 'no History heading').toBeDefined()
  const body = heading!.nextElementSibling as HTMLElement
  expect(body.classList.contains('builder-people__section')).toBe(true)
  return body
}

const rows = (scopeEl: HTMLElement): HTMLElement[] =>
  [...scopeEl.querySelectorAll('.builder-people__event')] as HTMLElement[]

const textOf = (row: HTMLElement, cls: string): string =>
  (row.querySelector(`.${cls}`) as HTMLElement | null)?.textContent?.trim() ?? ''

const STAMP = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/

describe.skipIf(!WEBUI_INSTALLED)('story-4630e921 — the History section', () => {
  it('test_UAT_AC2270_history_lists_events_newest_first_with_labels_and_unknown_kinds_verbatim', async () => {
    const mixed = historySection(await open('usr_mixed'))
    const mixedRows = rows(mixed)
    expect(mixedRows.map((r) => textOf(r, 'builder-people__eventkind'))).toEqual([
      'Email bounced',
      'Email sent',
      'consultation.booked',
      'list.joined',
    ])
    const unknown = mixedRows[2]
    expect(textOf(unknown, 'builder-people__eventkind')).toBe('consultation.booked')
    expect(textOf(unknown, 'builder-people__eventwhen')).toBe('2026-09-02 14:00')
    for (const r of mixedRows) {
      expect(textOf(r, 'builder-people__eventkind')).not.toBe('')
      expect(textOf(r, 'builder-people__eventwhen')).toMatch(STAMP)
    }

    root.replaceChildren()
    const known = historySection(await open('usr_known'))
    expect(rows(known).map((r) => textOf(r, 'builder-people__eventkind'))).toEqual([
      'Email received',
      'Email bounced',
      'Email delivered',
      'Email sent',
      'Signed up',
      'Invited',
      'Added as a contact',
    ])
    expect(rows(known).map((r) => textOf(r, 'builder-people__eventwhen'))).toEqual([
      '2026-09-10 10:06',
      '2026-09-10 10:05',
      '2026-09-10 10:04',
      '2026-09-10 10:03',
      '2026-09-10 10:02',
      '2026-09-10 10:01',
      '2026-09-10 10:00',
    ])
  })

  it('test_UAT_AC2271_a_recorded_stamp_appears_only_when_it_differs_from_occurred', async () => {
    const section = historySection(await open('usr_mixed'))
    const all = rows(section)
    const stamps = all.map((r) => textOf(r, 'builder-people__eventlearned'))
    expect(stamps.filter((s) => s !== '')).toEqual(['recorded 2026-09-01 09:00'])
    expect(section.querySelectorAll('.builder-people__eventlearned')).toHaveLength(1)

    const imported = all.find((r) => textOf(r, 'builder-people__eventkind') === 'list.joined')!
    expect(textOf(imported, 'builder-people__eventwhen')).toBe('2026-03-04 12:00')
    // Still placed at its occurred time: last, beneath the September events.
    expect(all[all.length - 1]).toBe(imported)
  })

  it('test_UAT_AC2272_origin_line_comes_from_server_provenance_and_is_absent_without_it', async () => {
    const mixed = historySection(await open('usr_mixed'))
    const origins = mixed.querySelectorAll('.builder-people__origin')
    expect(origins).toHaveLength(1)
    expect(origins[0].textContent).toBe('Origin: list.joined, 2026-03-04 12:00')

    // Built from provenance, not from the last displayed row.
    root.replaceChildren()
    const known = historySection(await open('usr_known'))
    expect(known.querySelector('.builder-people__origin')?.textContent).toBe(
      'Origin: list.joined, 2025-12-31 23:30',
    )

    root.replaceChildren()
    const silent = historySection(await open('usr_silent'))
    expect(silent.querySelector('.builder-people__origin')).toBeNull()
  })

  it('test_UAT_AC2273_an_empty_history_still_shows_the_section_with_nothing_recorded_yet', async () => {
    const detail = await open('usr_silent')
    const section = historySection(detail)
    expect(rows(section)).toHaveLength(0)
    expect(section.querySelector('.builder-people__origin')).toBeNull()
    const said = [...section.querySelectorAll('.builder-people__empty')].map(
      (p) => p.textContent?.trim() ?? '',
    )
    expect(said).toEqual(['Nothing recorded yet.'])
  })

  it('test_UAT_AC2274_history_section_is_read_only_and_every_emitted_class_is_styled', async () => {
    const section = historySection(await open('usr_mixed'))
    expect(section.querySelector('input, button, select, textarea')).toBeNull()

    const emitted = new Set<string>()
    for (const node of [section, ...section.querySelectorAll('*')]) {
      for (const cls of node.classList) emitted.add(cls)
    }
    for (const name of [
      'builder-people__events',
      'builder-people__event',
      'builder-people__eventkind',
      'builder-people__eventwhen',
      'builder-people__eventlearned',
      'builder-people__origin',
    ]) {
      expect(emitted.has(name), `section does not emit .${name}`).toBe(true)
    }
    for (const name of emitted) {
      // Exact class match: `.builder-people__event` must not be satisfied by
      // the `.builder-people__events` rule.
      expect(new RegExp(`\\.${name}(?![\\w-])`).test(CSS), `no rule matches .${name}`).toBe(true)
    }
  })
})
