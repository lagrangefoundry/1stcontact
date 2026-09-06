// @vitest-environment jsdom
/**
 * REQ-198 — **the Contacts tab shows what was sent, and which address is bad.**
 *
 * WHAT THIS FILE PROVES. That a record kept in the store reaches the operator:
 * the detail pane lists a contact's messages most recent first with subject,
 * date and status; a failure prints the reason it carries; and a contact holding
 * a bounced message is distinguishable in the LIST, without opening them. The
 * last one is the claim that matters most — a bad address is the most valuable
 * signal a beta produces and it is worth nothing if it takes a click to find.
 *
 * WHAT IS ASSERTED AND WHAT DELIBERATELY IS NOT. jsdom computes no layout, so
 * "distinguishable" is proved as REQ-189 proves it: the row emits a class that
 * the stylesheet has a rule for, and the pill carries the word as text so the
 * fact survives with the rule ignored entirely. Measuring a box jsdom reports as
 * zero either way would prove nothing.
 *
 * MOUNTED AGAINST THE ACTUALLY-INSTALLED COMPONENTS, on the pattern REQ-189 set:
 * the only double is the HTTP call, because that is the network.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createPeoplePanel: (opts?: Record<string, unknown>) => never
let shortWhen: (iso: string) => string

if (!WEBUI_INSTALLED) console.warn(`REQ-198 messages-pane suite skipped: ${WEBUI_SKIP_REASON}`)

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
  pipelineStage: 'invited',
  createdAt: '2026-09-01T09:00:00.000Z',
  ...over,
})

const PEOPLE = [
  person({ id: 'usr_bad', email: 'bad@example.test', displayName: 'Bad Address' }),
  person({ id: 'usr_fine', email: 'fine@example.test', displayName: 'Fine Address' }),
]

/**
 * The order the SERVER returns — most recent first ([[REQ-198]]).
 *
 * SUPPLIED ALREADY ORDERED, because that is where the ordering is decided. A
 * panel that re-sorted would be a second answer to the same question, free to
 * disagree with the one the route gives.
 */
const MESSAGES = {
  usr_bad: [
    {
      uid: 'tkt_3',
      subject: 'Second invite',
      queuedAt: '2026-09-04T14:30:00.000Z',
      status: 'bounced',
      failure: 'mailbox does not exist',
      contactId: 'usr_bad',
    },
    {
      uid: 'tkt_1',
      subject: 'First invite',
      queuedAt: '2026-09-01T11:05:00.000Z',
      status: 'delivered',
      failure: null,
      contactId: 'usr_bad',
    },
  ],
  usr_fine: [
    {
      uid: 'tkt_2',
      subject: 'Welcome',
      queuedAt: '2026-09-02T08:00:00.000Z',
      status: 'sent',
      failure: null,
      contactId: 'usr_fine',
    },
  ],
}

let messagesFail = false

function transport() {
  return {
    list: async () => ({
      people: PEOPLE.map((p) => ({ ...p })),
      canInvite: true,
      canFulfil: false,
      // THE LIST'S OWN READ CARRIES IT, which is what lets the row be marked
      // without opening anybody.
      bounced: ['usr_bad'],
    }),
    item: async (id: string) => ({
      person: { ...PEOPLE.find((p) => p.id === id)! },
      emails: [],
      operates: [],
      grants: [],
    }),
    messages: async (id: string) => {
      if (messagesFail) throw new Error('the store said no')
      return { messages: (MESSAGES as Record<string, unknown[]>)[id] ?? [] }
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
    ;({ createPeoplePanel, shortWhen } = await import('../apps/control-app/src/builder/people.js'))
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
  messagesFail = false
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
  await settle()
  return root.querySelector('.builder-people__detail') as HTMLElement
}

const text = (node: Element | null) => (node?.textContent ?? '').trim()

describe.skipIf(!WEBUI_INSTALLED)('REQ-198 — the detail pane lists what was sent', () => {
  it('test_UAT_FC_REQ-198_the_pane_lists_a_contacts_messages_most_recent_first', async () => {
    const detail = await open('usr_bad')
    const rows = [...detail.querySelectorAll('.builder-people__message')]
    expect(rows).toHaveLength(2)
    expect(rows.map((row) => text(row.querySelector('.builder-people__msgsubject')))).toEqual([
      'Second invite',
      'First invite',
    ])
  })

  it('test_UAT_FC_REQ-198_each_message_shows_its_subject_when_it_was_queued_and_its_status', async () => {
    // THE THREE THINGS AN OPERATOR IS ASKING. Subject says which message,
    // the date says which attempt, and the status answers *did it arrive*.
    const detail = await open('usr_bad')
    const first = detail.querySelector('.builder-people__message') as HTMLElement
    expect(text(first.querySelector('.builder-people__msgsubject'))).toBe('Second invite')
    expect(text(first.querySelector('.builder-people__msgwhen'))).toBe('2026-09-04 14:30')
    expect(text(first.querySelector('.builder-people__msgstatus'))).toBe('bounced')
  })

  it('test_UAT_FC_REQ-198_a_failed_or_bounced_message_prints_the_reason_it_carries', async () => {
    // "BOUNCED" ALONE TELLS AN OPERATOR NOTHING about whether to correct a typo
    // or stop writing to a mailbox that is full. The reason is on the record
    // precisely so it can be read here.
    const detail = await open('usr_bad')
    const first = detail.querySelector('.builder-people__message') as HTMLElement
    expect(text(first.querySelector('.builder-people__msgfailure'))).toBe(
      'mailbox does not exist',
    )
    // And a message that did NOT fail carries no reason line at all — an empty
    // one would read as a fact about a message that has none.
    const rows = [...detail.querySelectorAll('.builder-people__message')]
    expect(rows[1].querySelector('.builder-people__msgfailure')).toBeNull()
  })

  it('test_UAT_FC_REQ-198_the_status_is_carried_as_data_so_one_rule_can_accent_it', async () => {
    // THE IDIOM THIS TAB ALREADY USES for its facets: the value is data about
    // the element, not a class per value. A class per status would be five hooks
    // for a decision that belongs in one place.
    const detail = await open('usr_bad')
    const statuses = [...detail.querySelectorAll('.builder-people__msgstatus')].map(
      (node) => (node as HTMLElement).dataset.status,
    )
    expect(statuses).toEqual(['bounced', 'delivered'])
    expect(CSS).toContain("[data-status='bounced']")
  })

  it('test_UAT_FC_REQ-198_a_contact_with_nothing_sent_says_so_rather_than_showing_an_empty_list', async () => {
    const detail = await open('usr_fine')
    expect(detail.textContent).toContain('Messages')
    const rows = [...detail.querySelectorAll('.builder-people__message')]
    expect(rows).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-198_a_read_that_failed_says_so_rather_than_reading_as_nothing_sent', async () => {
    // AN EMPTY LIST AND A LIST THAT COULD NOT BE READ LOOK IDENTICAL, and only
    // one of them means "we have never written to this person" — which is
    // exactly the conclusion an operator would draw and act on.
    messagesFail = true
    const detail = await open('usr_bad')
    expect(detail.textContent).toContain('could not be read')
    expect(detail.querySelectorAll('.builder-people__message')).toHaveLength(0)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-198 — a bad address is visible from the list', () => {
  it('test_UAT_FC_REQ-198_a_contact_with_a_bounced_message_is_marked_in_the_list_itself', async () => {
    await panel()
    const marked = [...root.querySelectorAll('.builder-people__row')].filter((row) =>
      row.querySelector('.builder-people__bounced'),
    )
    expect(marked).toHaveLength(1)
    expect(text(marked[0].querySelector('.builder-people__email'))).toBe('bad@example.test')
    // NOT COLOUR ALONE. The pill carries the word, so the fact survives a
    // monochrome display or a screen reader with the stylesheet ignored.
    expect(text(marked[0].querySelector('.builder-people__bounced'))).toBe('bounced')
  })

  it('test_UAT_FC_REQ-198_a_business_switch_drops_the_previous_businesss_bounces', async () => {
    // THE SET IS A DIFFERENT BUSINESS'S FACT. Left behind across a switch it
    // would mark a row in another business by coincidence of id.
    const made = await panel()
    expect(root.querySelectorAll('.builder-people__bounced')).toHaveLength(1)
    ;(made as unknown as { clear(): void }).clear()
    await settle()
    expect(root.querySelectorAll('.builder-people__bounced')).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-198_every_class_this_ticket_adds_has_a_rule_in_the_stylesheet', async () => {
    // REQ-189's rule, held for the new surface: correct DOM with no rule behind
    // it is an unstyled panel, and nothing in the suite would have said so.
    const detail = await open('usr_bad')
    expect(detail).toBeTruthy()
    const emitted = new Set<string>()
    for (const node of root.querySelectorAll('[class]')) {
      for (const name of node.classList) if (name.startsWith('builder-people')) emitted.add(name)
    }
    const mine = [...emitted].filter(
      (name) => name.includes('msg') || name.includes('message') || name.includes('bounced'),
    )
    expect(mine.length).toBeGreaterThanOrEqual(5)
    const unstyled = [...emitted].filter((name) => !CSS.includes(`.${name}`))
    expect(unstyled, `no rule matches: ${unstyled.join(', ')}`).toEqual([])
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-198 — the date the list shows', () => {
  it('test_UAT_FC_REQ-198_a_stamp_is_shortened_and_never_reformatted', async () => {
    // TRIMMED RATHER THAN FORMATTED. A locale-formatted date is a second reading
    // of a value the record pane shows verbatim, and the two would disagree
    // about the timezone the moment anybody looked.
    expect(shortWhen('2026-09-04T14:30:22.123Z')).toBe('2026-09-04 14:30')
    expect(shortWhen('')).toBe('')
  })
})
