// @vitest-environment jsdom
/**
 * Reconciliation UATs for story-219b4217 — **the outgoing message record**
 * ([[REQ-198]]), the Contacts-tab half.
 *
 * Mounted against the shipped `createPeoplePanel`; the only double is the HTTP
 * transport, because that is the network. The route halves of AC2301, AC2302
 * and AC2304 (what `/api/people/messages` and `/api/people` answer) are proved
 * in the `.workers` sibling against real D1.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createPeoplePanel: (opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`story-219b4217 pane suite skipped: ${WEBUI_SKIP_REASON}`)

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
  pipelineStage: 'invited',
  createdAt: '2026-09-01T09:00:00.000Z',
  ...over,
})

const PEOPLE = [
  person({ id: 'usr_x', email: 'x@example.test', displayName: 'Contact X' }),
  person({ id: 'usr_y', email: 'y@example.test', displayName: 'Contact Y' }),
  person({ id: 'usr_quiet', email: 'quiet@example.test', displayName: 'Nobody Wrote' }),
]

/** As the route answers it: newest first by queued time. */
const MESSAGES: Record<string, unknown[]> = {
  usr_x: [
    {
      uid: 'tkt_c',
      subject: 'Bounced invite',
      queuedAt: '2026-09-03T09:15:42.123Z',
      status: 'bounced',
      failure: 'no such mailbox',
    },
    {
      uid: 'tkt_b',
      subject: '',
      queuedAt: '2026-09-02T08:05:00.000Z',
      status: 'sent',
      failure: null,
    },
    {
      uid: 'tkt_a',
      subject: 'Failed invite',
      queuedAt: '2026-09-01T07:00:59.999Z',
      status: 'failed',
      failure: 'domain not verified',
    },
  ],
  usr_y: [
    {
      uid: 'tkt_y',
      subject: 'Welcome',
      queuedAt: '2026-09-02T10:00:00.000Z',
      status: 'delivered',
      failure: null,
    },
  ],
}

/** Which business the transport is answering for, and how. */
const state = { business: 'with-bounces', messagesError: null as Error | null }

function transport() {
  return {
    list: async () => ({
      people: PEOPLE.map((p) => ({ ...p })),
      canInvite: true,
      canFulfil: false,
      bounced: state.business === 'with-bounces' ? ['usr_x'] : [],
    }),
    item: async (id: string) => ({
      person: { ...PEOPLE.find((p) => p.id === id)! },
      emails: [],
      operates: [],
      grants: [],
    }),
    messages: async (id: string) => {
      if (state.messagesError) throw state.messagesError
      return { messages: MESSAGES[id] ?? [] }
    },
    saveRecord: async () => ({}),
    grant: async () => ({}),
    revoke: async () => {},
    invite: async () => ({ created: true, person: PEOPLE[0] }),
    fulfil: async () => ({}),
  }
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ createPeoplePanel } = await import('../apps/control-app/src/builder/people.js'))
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
  state.business = 'with-bounces'
  state.messagesError = null
})

type Panel = {
  element: HTMLElement
  refresh(): Promise<unknown>
  clear(): void
  listDetail: { select(k: string): void }
}

async function panel(): Promise<Panel> {
  const made = createPeoplePanel({ storage: memoryStorage(), transport: transport() }) as unknown as Panel
  root.append(made.element)
  await made.refresh()
  return made
}

async function open(id: string): Promise<HTMLElement> {
  const made = await panel()
  made.listDetail.select(id)
  for (let i = 0; i < 4; i += 1) await settle()
  return root.querySelector('.builder-people__detail') as HTMLElement
}

const text = (node: Element | null) => (node?.textContent ?? '').trim()

/** The Messages section: the section whose heading reads "Messages". */
function messagesSection(detail: HTMLElement): Element {
  const heading = [...detail.querySelectorAll('h1,h2,h3,h4,h5,h6')].find(
    (h) => text(h) === 'Messages',
  )
  expect(heading, 'no Messages heading').toBeTruthy()
  return heading!.parentElement as Element
}

describe.skipIf(!WEBUI_INSTALLED)('story-219b4217 — the Messages section', () => {
  it('test_UAT_AC2301_messages_section_lists_rows_newest_first_with_subject_time_status_and_reason', async () => {
    const detail = await open('usr_x')
    const section = messagesSection(detail)
    const rows = [...section.querySelectorAll('.builder-people__message')]
    expect(rows).toHaveLength(3)

    const seen = rows.map((row) => ({
      subject: text(row.querySelector('.builder-people__msgsubject')),
      when: text(row.querySelector('.builder-people__msgwhen')),
      status: text(row.querySelector('.builder-people__msgstatus')),
      dataStatus: (row.querySelector('.builder-people__msgstatus') as HTMLElement).dataset.status,
      failure: row.querySelector('.builder-people__msgfailure')
        ? text(row.querySelector('.builder-people__msgfailure'))
        : null,
    }))
    expect(seen).toEqual([
      {
        subject: 'Bounced invite',
        when: '2026-09-03 09:15',
        status: 'bounced',
        dataStatus: 'bounced',
        failure: 'no such mailbox',
      },
      {
        subject: '(no subject)',
        when: '2026-09-02 08:05',
        status: 'sent',
        dataStatus: 'sent',
        failure: null,
      },
      {
        subject: 'Failed invite',
        when: '2026-09-01 07:00',
        status: 'failed',
        dataStatus: 'failed',
        failure: 'domain not verified',
      },
    ])
    // Shortened from the stored stamp, never reformatted into another value.
    for (const [i, row] of seen.entries()) {
      const stored = String((MESSAGES.usr_x[i] as { queuedAt: string }).queuedAt)
      expect(row.when).toBe(`${stored.slice(0, 10)} ${stored.slice(11, 16)}`)
    }
  })

  it('test_UAT_AC2302_no_messages_says_nothing_sent_and_a_failed_read_says_it_could_not_be_read', async () => {
    const quiet = messagesSection(await open('usr_quiet'))
    expect(text(quiet)).toContain('Nothing has been sent to them yet.')
    expect(quiet.querySelector('.builder-people__messages')).toBeNull()
    expect(quiet.querySelectorAll('.builder-people__message')).toHaveLength(0)

    document.body.replaceChildren()
    root = document.createElement('div')
    document.body.append(root)
    state.messagesError = new Error('the store said no')
    const failed = messagesSection(await open('usr_x'))
    expect(text(failed)).toContain('Their messages could not be read: the store said no')
    expect(text(failed)).not.toContain('Nothing has been sent to them yet.')
    expect(failed.querySelectorAll('.builder-people__message')).toHaveLength(0)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('story-219b4217 — the bounced marker in the list', () => {
  it('test_UAT_AC2304_contacts_list_marks_only_bounced_contacts_and_drops_marks_on_business_switch', async () => {
    const made = await panel()
    const rowFor = (email: string) =>
      [...root.querySelectorAll('.builder-people__row')].find(
        (row) => text(row.querySelector('.builder-people__email')) === email,
      ) as Element
    expect(rowFor('x@example.test')).toBeTruthy()
    expect(rowFor('y@example.test')).toBeTruthy()

    expect(text(rowFor('x@example.test').querySelector('.builder-people__bounced'))).toBe('bounced')
    expect(rowFor('y@example.test').querySelector('.builder-people__bounced')).toBeNull()
    expect(rowFor('quiet@example.test').querySelector('.builder-people__bounced')).toBeNull()
    expect(root.querySelectorAll('.builder-people__bounced')).toHaveLength(1)

    // Switch to a business with no bounces: no row carries the marker.
    made.clear()
    state.business = 'no-bounces'
    await made.refresh()
    await settle()
    expect(root.querySelectorAll('.builder-people__row').length).toBeGreaterThan(0)
    expect(root.querySelectorAll('.builder-people__bounced')).toHaveLength(0)
  })
})
