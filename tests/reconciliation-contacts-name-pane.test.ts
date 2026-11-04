// @vitest-environment jsdom
/**
 * story-a55c2f35 — **a person's name, in the Contacts pane** ([[REQ-193]]): the
 * panel half of AC-2251 and AC-2252.
 *
 * The origin half — the rows, the partial unique index, the route's reasons and
 * refusals — is proved in workerd by `reconciliation-identity-person-addresses-
 * names.workers.test.ts`. This proves what the operator meets: the Their name
 * section's seven part boxes, the locked Greeting and Formerly rows, the
 * one-part-at-a-time correction, the Record a name change dialog, the refusal
 * beside the box, the *No name yet* list row, and that only a changed former name
 * is shown and searched.
 *
 * Mounted against the actually-installed components; the only double is the
 * transport, because that is the HTTP call. The double applies the record
 * route's rules — parts patched one at a time onto the current name, a missing
 * reason is a correction, only `changed` keeps a former name, clearing the
 * displayed name while a part remains is refused with the route's sentence, and
 * clearing every part leaves no name — so a panel that failed to put the SAVED
 * row back, or sent the wrong patch, fails here rather than passing.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createPeoplePanel: (opts?: Record<string, unknown>) => unknown
let NO_NAME_YET: string

if (!WEBUI_INSTALLED) console.warn(`story-a55c2f35 name-pane suite skipped: ${WEBUI_SKIP_REASON}`)

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))
const settleAll = async () => {
  for (let i = 0; i < 4; i += 1) await settle()
}

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

const PARTS = ['displayName', 'knownAs', 'title', 'givenName', 'middleNames', 'familyName', 'suffix'] as const
type Part = (typeof PARTS)[number]
type PersonName = Record<Part, string | null> & { id: string; createdAt: string; updatedAt: string }

/** The sentence the record route answers with (names.ts `InvalidNameError`). */
const NEEDS_SOMETHING =
  'A name needs something to show. Fill in the name itself, or clear the other parts too.'

const named = (displayName: string, over: Partial<Record<Part, string | null>> = {}): PersonName => ({
  id: 'nam_1',
  displayName,
  knownAs: null,
  title: null,
  givenName: null,
  middleNames: null,
  familyName: null,
  suffix: null,
  createdAt: '2026-09-01T09:00:00.000Z',
  updatedAt: '2026-09-01T09:00:00.000Z',
  ...over,
})

interface Row {
  id: string
  email: string
  name: PersonName | null
  formerNames: string[]
  [key: string]: unknown
}

const person = (over: Partial<Row> & { id: string; email: string }): Row => ({
  name: null,
  formerNames: [],
  status: 'active',
  invitedAt: '2026-09-01T10:00:00.000Z',
  firstSeenAt: null,
  lastSeenAt: null,
  termsAcceptedAt: null,
  pipelineStage: 'invited',
  createdAt: '2026-09-01T09:00:00.000Z',
  ...over,
})

/**
 * - `usr_robert` — Robert Smith, given name Robert, title Dr: the greeting falls
 *   back to the given name and never says the title.
 * - `usr_bob` — Robert Smith known as Bob, and nothing else: the refusal case.
 * - `usr_sarah` — Sarah Patel, formerly Sarah Jones (a genuine change). Her
 *   corrected typo, Sarah Jonse, never left the server, so it is not here.
 */
const PEOPLE = (): Row[] => [
  person({
    id: 'usr_robert',
    email: 'robert@example.test',
    name: named('Robert Smith', { givenName: 'Robert', familyName: 'Smith', title: 'Dr' }),
  }),
  person({ id: 'usr_bob', email: 'bob@example.test', name: named('Robert Smith', { knownAs: 'Bob' }) }),
  person({
    id: 'usr_sarah',
    email: 'sarah@example.test',
    name: named('Sarah Patel', { givenName: 'Sarah', familyName: 'Patel' }),
    formerNames: ['Sarah Jones'],
  }),
]

const clean = (value: unknown): string | null => {
  const text = String(value ?? '').trim()
  return text === '' ? null : text
}

/** A transport applying the record route's name rules to an in-memory business. */
function transportOver() {
  const people = PEOPLE()
  const saved: Array<Record<string, unknown>> = []
  return {
    saved,
    people,
    list: async () => ({ people: people.map((p) => ({ ...p })), canInvite: true, canFulfil: false }),
    item: async (id: string) => ({
      person: { ...people.find((p) => p.id === id)! },
      operates: [],
      grants: [],
    }),
    saveRecord: async (id: string, patch: Record<string, unknown>) => {
      const row = people.find((p) => p.id === id)!
      const next: Record<Part, string | null> = { ...named(''), ...(row.name ?? {}) }
      for (const part of PARTS) if (part in patch) next[part] = clean(patch[part])
      const remains = PARTS.some((part) => part !== 'displayName' && next[part] !== null)
      if (next.displayName === null && remains) throw new Error(NEEDS_SOMETHING)
      saved.push({ id, ...patch })
      if (patch.nameReason === 'changed' && row.name) row.formerNames = [...row.formerNames, String(row.name.displayName)]
      row.name = next.displayName === null ? null : { ...(row.name ?? named('')), ...next, displayName: next.displayName }
      return { ...row }
    },
    grant: async () => ({}),
    revoke: async () => ({}),
    invite: async () => ({ created: true, person: { ...people[0] } }),
    fulfil: async () => ({}),
  }
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ createPeoplePanel, NO_NAME_YET } = await import('../apps/control-app/src/builder/people.js'))
  }
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never
})

let root: HTMLElement
function freshRoot() {
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
}
beforeEach(freshRoot)

async function panel(transport = transportOver()) {
  const made = createPeoplePanel({ storage: memoryStorage(), transport }) as unknown as {
    element: HTMLElement
    refresh(): Promise<unknown>
    listDetail: { select(k: string): void }
  }
  root.append(made.element)
  await made.refresh()
  return { made, transport }
}

async function open(id: string) {
  const opened = await panel()
  opened.made.listDetail.select(id)
  await settleAll()
  return opened
}

/** The `webui-fields` row for one field, by its label. */
function field(label: string): HTMLElement | null {
  for (const row of root.querySelectorAll('.fields-row')) {
    if (row.querySelector('.fields-label')?.textContent?.trim() === label) return row as HTMLElement
  }
  return null
}

const valueOf = (label: string) => field(label)?.querySelector('.fields-value')?.textContent ?? null
const errorOf = (label: string) => field(label)?.querySelector('.fields-error')?.textContent ?? ''

/** Type into a field the way the operator does: click, type, confirm with Enter. */
async function type(label: string, text: string): Promise<void> {
  const cell = field(label)!.querySelector('.fields-value') as HTMLElement
  cell.click()
  await settle()
  const box = field(label)!.querySelector('input, textarea') as HTMLInputElement
  box.value = text
  box.dispatchEvent(new Event('input', { bubbles: true }))
  box.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  await settleAll()
}

const headings = () => [...root.querySelectorAll('.builder-people__heading')].map((h) => h.textContent?.trim())
const rows = () => [...root.querySelectorAll('.builder-people__row')]
const who = () => rows().map((r) => r.querySelector('.builder-people__who')!.textContent)

async function search(text: string) {
  const box = root.querySelector('.builder-people__search') as HTMLInputElement
  box.value = text
  box.dispatchEvent(new Event('input', { bubbles: true }))
  await settle()
}

describe.skipIf(!WEBUI_INSTALLED)('story-a55c2f35 — Their name', () => {
  it('test_UAT_AC2252_their_name_edits_one_part_at_a_time_shows_the_greeting_and_records_a_change_as_one_act', async () => {
    const { transport } = await open('usr_robert')

    expect(headings()).toContain('Their name')
    for (const label of ['Name', 'Known as', 'Title', 'Given name', 'Middle names', 'Family name', 'Suffix']) {
      expect(field(label), `no ${label} box`).not.toBeNull()
    }
    expect(valueOf('Name')).toBe('Robert Smith')

    // The greeting falls back to the given name and never says the title.
    expect(valueOf('Greeting')).toBe('Hi Robert,')

    // Editing one part sends that part alone, as a correction (no reason).
    await type('Known as', 'Bob')
    expect(transport.saved).toEqual([{ id: 'usr_robert', knownAs: 'Bob' }])
    expect(valueOf('Greeting')).toBe('Hi Bob,')
    expect(valueOf('Greeting')).not.toContain('Dr')
    expect(valueOf('Title')).toBe('Dr')
    expect(valueOf('Family name')).toBe('Smith')

    // Record a name change: a dialog prefilled with the current parts, saved at once, marked changed.
    ;(root.querySelector('.builder-people__rename') as HTMLButtonElement).click()
    await settle()
    const box = (name: string) =>
      root.querySelector(`.builder-people__rename-box[name="${name}"]`) as HTMLInputElement
    expect(box('displayName').value).toBe('Robert Smith')
    expect(box('knownAs').value).toBe('Bob')
    box('displayName').value = 'Robert Jones'
    box('familyName').value = 'Jones'
    ;(root.querySelector('.builder-modal__btn--primary') as HTMLButtonElement).click()
    await settleAll()

    expect(transport.saved).toHaveLength(2)
    const change = transport.saved[1]!
    expect(change).toMatchObject({ id: 'usr_robert', displayName: 'Robert Jones', familyName: 'Jones', nameReason: 'changed' })
    expect(Object.keys(change).sort()).toEqual([...PARTS, 'id', 'nameReason'].sort())
    // The Formerly row shows the previous displayed name.
    expect(valueOf('Formerly')).toContain('Robert Smith')
  })

  it('test_UAT_AC2252_clearing_the_displayed_name_alone_is_refused_and_clearing_every_part_leaves_no_name_yet', async () => {
    const { transport } = await open('usr_bob')

    // Clearing the displayed name while Known as remains: refused beside the box, name unchanged.
    await type('Name', '')
    expect(errorOf('Name')).toContain('needs something to show')
    expect(valueOf('Name')).toBe('Robert Smith')
    expect(transport.people.find((p) => p.id === 'usr_bob')!.name?.displayName).toBe('Robert Smith')
    expect(transport.saved).toEqual([])

    // Clearing every part leaves the person with no current name.
    await type('Known as', '')
    await type('Name', '')
    expect(transport.people.find((p) => p.id === 'usr_bob')!.name).toBeNull()
    expect(valueOf('Greeting')).toBe(NO_NAME_YET)
    const row = rows().find((r) => r.querySelector('.builder-people__email')?.textContent === 'bob@example.test')
    expect(row?.querySelector('.builder-people__who')?.textContent).toBe(NO_NAME_YET)
  })

  it('test_UAT_AC2251_only_a_changed_former_name_is_shown_as_formerly_and_found_by_search', async () => {
    await panel()

    // The changed former name is drawn on the row and matched by search.
    await search('sarah jones')
    expect(who()).toEqual(['Sarah Patel'])
    expect(rows()[0]!.querySelector('.builder-people__formerly')!.textContent).toContain('Sarah Jones')

    // The corrected typo never reached the client, so it finds nobody.
    await search('sarah jonse')
    expect(who()).toEqual([])

    // A person with no changed former name draws no formerly line.
    await search('robert')
    expect(rows().length).toBeGreaterThan(0)
    for (const r of rows()) expect(r.querySelector('.builder-people__formerly')).toBeNull()
  })
})
