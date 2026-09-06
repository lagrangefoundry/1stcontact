// @vitest-environment jsdom
/**
 * REQ-191 — **the detail pane shows the addresses the row cannot.**
 *
 * WHAT THIS FILE PROVES. That a second address is OBSERVABLE. A person holds as
 * many addresses as they have; the list row and the `Email` field both show the
 * primary one, so without this section a second address exists in the database
 * and nowhere on screen — which is precisely the state that lets an operator
 * invite one human twice, believing they are two.
 *
 * AND THAT IT APPEARS ONLY WHEN THERE IS SOMETHING TO SHOW. A heading that
 * rendered for everybody would say "and no others" to the whole list and mean
 * nothing; a reader learns to skip a region that is almost always empty, which
 * is the region the one interesting case needs to be noticed in.
 *
 * READ-ONLY, AND ASSERTED AS SUCH. Nothing in the product adds an address yet —
 * which surface does that, and re-primaries it, is [[REQ-189]]'s territory or
 * later — so a control here would be the shape that reads as supported and is
 * not. Editing the `Email` field rewrites the primary row and leaves these
 * alone, which is the server's half and is proved in the workerd suite.
 *
 * MOUNTED AGAINST THE ACTUALLY-INSTALLED COMPONENTS, on the [[REQ-189]] pattern:
 * the only double is the HTTP call, because that is the network.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createPeoplePanel: (opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`REQ-191 other-addresses suite skipped: ${WEBUI_SKIP_REASON}`)

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

/**
 * TWO PEOPLE, BECAUSE THE CLAIM IS A DIFFERENCE. `usr_many` holds three
 * addresses and `usr_one` holds the single address every row has today; a suite
 * with only the first would pass against a section that always renders.
 */
const PEOPLE = [
  person({ id: 'usr_many', email: 'primary@example.test' }),
  person({ id: 'usr_one', email: 'only@example.test' }),
]

const EMAILS: Record<string, Array<Record<string, unknown>>> = {
  usr_many: [
    { id: 'eml_1', email: 'primary@example.test', isPrimary: true, createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 'eml_2', email: 'work@example.test', isPrimary: false, createdAt: '2026-02-01T00:00:00.000Z' },
    { id: 'eml_3', email: 'old@example.test', isPrimary: false, createdAt: '2026-03-01T00:00:00.000Z' },
  ],
  usr_one: [
    { id: 'eml_4', email: 'only@example.test', isPrimary: true, createdAt: '2026-01-01T00:00:00.000Z' },
  ],
}

function transport() {
  return {
    list: async () => ({ people: PEOPLE.map((p) => ({ ...p })), canInvite: true, canFulfil: false }),
    item: async (id: string) => ({
      person: { ...PEOPLE.find((p) => p.id === id)! },
      emails: EMAILS[id].map((e) => ({ ...e })),
      operates: [],
      grants: [],
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

describe.skipIf(!WEBUI_INSTALLED)('REQ-191 — a second address is visible', () => {
  it('test_UAT_FC_REQ-191_the_pane_lists_every_address_that_is_not_the_primary', async () => {
    const detail = await open('usr_many')
    expect(headings(detail)).toContain('Other addresses')

    const listed = [...detail.querySelectorAll('.builder-people__address')].map(
      (li) => li.textContent?.trim() ?? '',
    )
    // THE PRIMARY IS NOT REPEATED. It is already the `Email` field above and the
    // list row beside it; printing it a third time under a heading that says
    // "other" would be actively misleading.
    expect(listed).toEqual(['work@example.test', 'old@example.test'])
  })

  it('test_UAT_FC_REQ-191_the_section_is_absent_for_a_person_holding_one_address', async () => {
    const detail = await open('usr_one')
    expect(headings(detail)).not.toContain('Other addresses')
    expect(detail.querySelector('.builder-people__address')).toBeNull()
  })

  it('test_UAT_FC_REQ-191_the_addresses_it_shows_are_styled_and_offer_no_control', async () => {
    // The [[REQ-189]] rule, applied to the classes this ticket adds: a class the
    // tab emits with no rule behind it renders at the browser's default size
    // inside a panel that is otherwise the app's.
    const detail = await open('usr_many')
    for (const name of ['builder-people__addresses', 'builder-people__address']) {
      expect(CSS.includes(`.${name}`), `no rule matches .${name}`).toBe(true)
    }

    // READ-ONLY: no input and no button anywhere in the section, because nothing
    // in the product adds or re-primaries an address yet.
    const section = detail.querySelector('.builder-people__addresses') as HTMLElement
    expect(section.querySelector('input, button, select')).toBeNull()
  })
})
