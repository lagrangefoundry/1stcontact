// @vitest-environment jsdom
/**
 * REQ-195 — **the Contacts tab shows what happened to a contact.**
 *
 * WHAT THIS FILE PROVES. That the history is one sequence rather than a list per
 * kind, that a kind nothing has a name for still renders, that the origin is the
 * server's earliest event rather than the end of a capped list, and that a
 * contact with no history is told so instead of being shown a region that failed
 * to load.
 *
 * WHY THE UNKNOWN KIND MATTERS MOST. The set of things that can happen to a
 * contact grows ([[DOC-44]] §4) and the schema deliberately carries no
 * constraint on it, so the day a capability starts recording something new, this
 * pane has to draw it without being edited. A panel that branched on kinds would
 * be a file somebody has to find and extend — and would draw a blank row until
 * they did, which reads as a bug in the timeline rather than a gap in a label
 * table.
 *
 * MOUNTED AGAINST THE ACTUALLY-INSTALLED COMPONENTS, on the [[REQ-189]] and
 * [[REQ-191]] pattern: the only double is the HTTP call, because that is the
 * network.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { eventLabel } from '../apps/control-app/src/builder/contact-events.js'

let createPeoplePanel: (opts?: Record<string, unknown>) => never
let describeEvent: (event: Record<string, unknown>) => {
  label: string
  when: string
  learned: string | null
}

if (!WEBUI_INSTALLED) console.warn(`REQ-195 history suite skipped: ${WEBUI_SKIP_REASON}`)

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
  contactId: 'usr_told',
  businessId: 'acct_a',
  ref: null,
  detail: {},
  ...over,
})

/**
 * TWO PEOPLE, BECAUSE THE CLAIM IS A DIFFERENCE. `usr_told` has a history and
 * `usr_silent` has none; a suite with only the first would pass against a pane
 * that rendered a list of nothing and said nothing about it.
 */
const PEOPLE = [
  person({ id: 'usr_told', email: 'told@example.test' }),
  person({ id: 'usr_silent', email: 'silent@example.test' }),
]

/**
 * NEWEST FIRST, as the server returns them, and carrying one kind this panel has
 * never heard of. The imported signup is the row whose `recordedAt` differs.
 */
const HISTORY = [
  event({ kind: 'email.bounced', occurredAt: '2026-09-04T16:20:00.000Z', recordedAt: '2026-09-04T16:20:00.000Z', ref: 'email-1' }),
  event({ kind: 'email.sent', occurredAt: '2026-09-03T08:05:00.000Z', recordedAt: '2026-09-03T08:05:00.000Z', ref: 'email-1' }),
  event({ kind: 'consultation.booked', occurredAt: '2026-09-02T14:00:00.000Z', recordedAt: '2026-09-02T14:00:00.000Z' }),
  event({ kind: 'list.joined', occurredAt: '2026-03-04T12:00:00.000Z', recordedAt: '2026-09-01T09:00:00.000Z' }),
]

const DETAIL: Record<string, Record<string, unknown>> = {
  usr_told: { events: HISTORY, provenance: HISTORY[3] },
  usr_silent: { events: [], provenance: null },
}

function transport() {
  return {
    list: async () => ({ people: PEOPLE.map((p) => ({ ...p })), canInvite: true, canFulfil: false }),
    item: async (id: string) => ({
      person: { ...PEOPLE.find((p) => p.id === id)! },
      emails: [{ id: 'eml_1', email: 'told@example.test', isPrimary: true, createdAt: '2026-01-01T00:00:00.000Z' }],
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
    ;({ createPeoplePanel, describeEvent } = panel as never)
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

const headings = (detail: HTMLElement): string[] =>
  [...detail.querySelectorAll('.builder-people__heading')].map((h) => h.textContent?.trim() ?? '')

const rows = (detail: HTMLElement): HTMLElement[] =>
  [...detail.querySelectorAll('.builder-people__event')] as HTMLElement[]

const textOf = (row: HTMLElement, cls: string): string =>
  (row.querySelector(`.${cls}`) as HTMLElement | null)?.textContent?.trim() ?? ''

describe.skipIf(!WEBUI_INSTALLED)('REQ-195 — a contact has a history on the tab', () => {
  it('test_UAT_FC_REQ-195_the_pane_lists_the_history_newest_first_in_one_sequence', async () => {
    const detail = await open('usr_told')
    expect(headings(detail)).toContain('History')

    // ONE LIST, IN THE ORDER THE SERVER SENT, and mail and meetings interleaved
    // rather than grouped. Grouped by kind, "we mailed them the day after they
    // booked" stops being visible at all.
    expect(rows(detail).map((row) => textOf(row, 'builder-people__eventkind'))).toEqual([
      'Email bounced',
      'Email sent',
      'consultation.booked',
      'list.joined',
    ])
  })

  it('test_UAT_FC_REQ-195_a_kind_with_no_label_renders_as_itself', async () => {
    // THE FALLBACK IS THE DOTTED STRING AND NOT A BLANK. A row drawn empty is
    // indistinguishable from a timeline that failed to load; the raw kind is
    // ugly, is the truth, and says which capability wrote it — which is exactly
    // what somebody looking at an unrecognised event needs to know.
    expect(eventLabel('consultation.booked')).toBe('consultation.booked')
    expect(eventLabel('email.sent')).toBe('Email sent')

    const detail = await open('usr_told')
    const unknown = rows(detail).find(
      (row) => textOf(row, 'builder-people__eventkind') === 'consultation.booked',
    )
    expect(unknown).toBeDefined()
    expect(textOf(unknown!, 'builder-people__eventwhen')).toBe('2026-09-02 14:00')
  })

  it('test_UAT_FC_REQ-195_the_second_stamp_is_drawn_only_when_it_differs', async () => {
    // `occurredAt` AND `recordedAt` ARE THE SAME VALUE FOR EVERYTHING THIS
    // SYSTEM DOES ITSELF, so a clause printed on every row would train the eye
    // to skip the region where the one interesting case appears.
    expect(
      describeEvent({ occurredAt: '2026-09-03T08:05:00.000Z', recordedAt: '2026-09-03T08:05:00.000Z', kind: 'email.sent' }),
    ).toEqual({ label: 'Email sent', when: '2026-09-03 08:05', learned: null })

    const detail = await open('usr_told')
    const drawn = rows(detail).map((row) => textOf(row, 'builder-people__eventlearned'))
    // Exactly one — the imported signup, which happened in March and was learned
    // of in September.
    expect(drawn.filter((said) => said !== '')).toEqual(['recorded 2026-09-01 09:00'])

    const imported = rows(detail).find(
      (row) => textOf(row, 'builder-people__eventkind') === 'list.joined',
    )
    // AND IT STILL SORTS UNDER MARCH. Ordered by when we heard of it, an import
    // reads as a flood of activity today, which is the reading a timeline exists
    // to prevent.
    expect(textOf(imported!, 'builder-people__eventwhen')).toBe('2026-03-04 12:00')
  })

  it('test_UAT_FC_REQ-195_the_origin_is_the_servers_earliest_event', async () => {
    // FROM `provenance`, NOT FROM THE END OF THE LIST. The list is capped, so a
    // pane reading its tail would be quietly wrong for exactly the contacts with
    // the longest histories.
    const detail = await open('usr_told')
    const origin = detail.querySelector('.builder-people__origin') as HTMLElement
    expect(origin.textContent).toBe('Origin: list.joined, 2026-03-04 12:00')
  })

  it('test_UAT_FC_REQ-195_a_contact_with_no_history_is_told_so', async () => {
    // THE SECTION IS DRAWN EVEN WHEN EMPTY, unlike `Other addresses`. An empty
    // address list means "there is nothing more to say"; an empty history means
    // "we have no record of this person", which is a fact about them and is what
    // every contact created before this table existed truthfully shows.
    const detail = await open('usr_silent')
    expect(headings(detail)).toContain('History')
    expect(rows(detail)).toHaveLength(0)
    expect(detail.querySelector('.builder-people__origin')).toBeNull()
    const said = [...detail.querySelectorAll('.builder-people__empty')].map(
      (p) => p.textContent?.trim() ?? '',
    )
    expect(said).toContain('Nothing recorded yet.')
  })

  it('test_UAT_FC_REQ-195_the_history_is_styled_and_offers_no_control', async () => {
    // The [[REQ-189]] rule applied to the classes this ticket adds: a class the
    // tab emits with no rule behind it renders at the browser's default size
    // inside a panel that is otherwise the app's.
    const detail = await open('usr_told')
    for (const name of [
      'builder-people__events',
      'builder-people__event',
      'builder-people__eventkind',
      'builder-people__eventwhen',
      'builder-people__eventlearned',
      'builder-people__origin',
    ]) {
      expect(CSS.includes(`.${name}`), `no rule matches .${name}`).toBe(true)
    }

    // READ-ONLY, and structurally so: an event is written once and never
    // rewritten, so a control here would be the shape that reads as supported
    // and is refused by the database.
    const list = detail.querySelector('.builder-people__events') as HTMLElement
    expect(list.querySelector('input, button, select, textarea')).toBeNull()
  })
})
