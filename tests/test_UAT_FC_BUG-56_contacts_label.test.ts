// @vitest-environment jsdom
/**
 * BUG-56 — **the tab and its list both read "Contacts".**
 *
 * WHAT THIS FILE PROVES. That one population is named once. The tab strip said
 * "Users" and the list heading inside it said "People" — two words for the rows
 * the CRM and the invite flow already call contacts ([[DOC-42]] §9), and neither
 * of them the word the product uses.
 *
 * WHY BOTH SURFACES, AND NOT ONE. They are set in different files by different
 * mechanisms — `config.js` declares the tab label, `people.js` passes the list
 * heading into `mountListDetail` — so a rename that touches one and misses the
 * other is exactly the state this ticket found and is invisible to a suite that
 * checks either alone.
 *
 * THE ID IS ASSERTED ALONGSIDE THE LABEL, deliberately. `people` namespaces this
 * tab's persistence keys and is what `getPanel` mounts against; a later rename
 * that "tidied" it to match the label would silently orphan every operator's
 * saved split position rather than fail. Pinning the split is the point.
 *
 * MOUNTED AGAINST THE ACTUALLY-INSTALLED COMPONENTS, on the REQ-189 pattern: the
 * only double is the HTTP call, because that is the network.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { PEOPLE_TAB } from '../apps/control-app/src/builder/config.js'

let createPeoplePanel: (opts?: Record<string, unknown>) => { element: HTMLElement; refresh(): Promise<unknown> }

if (!WEBUI_INSTALLED) console.warn(`BUG-56 contacts-label suite skipped: ${WEBUI_SKIP_REASON}`)

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

const PEOPLE = [
  {
    id: 'usr_1',
    displayName: 'Alice',
    email: 'alice@example.com',
    status: 'active',
    invitedAt: null,
    tosAcceptedAt: '2026-01-01T00:00:00Z',
    firstSeenAt: '2026-01-01T00:00:00Z',
  },
]

const transport = () => ({
  list: async () => ({ people: PEOPLE.map((p) => ({ ...p })), canInvite: true, canFulfil: false }),
  detail: async () => ({ person: { ...PEOPLE[0] }, operates: [], grants: [] }),
  saveStatus: async () => ({}),
  grant: async () => ({}),
  revoke: async () => {},
  invite: async () => ({ created: true, person: PEOPLE[0] }),
  fulfil: async () => ({ businessId: 'acct_new', name: 'New', siteSlug: 'acct_new' }),
})

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

describe('BUG-56 — the contacts surface is named "Contacts" in both places', () => {
  it('labels the tab "Contacts" while keeping the addressable id "people"', () => {
    expect(PEOPLE_TAB.label).toBe('Contacts')
    expect(PEOPLE_TAB.id).toBe('people')
  })

  it.skipIf(!WEBUI_INSTALLED)('heads the mounted list "Contacts"', async () => {
    const made = createPeoplePanel({ storage: memoryStorage(), transport: transport() })
    root.append(made.element)
    await made.refresh()

    const title = root.querySelector('.list-detail-list-title')
    expect(title).not.toBeNull()
    expect(title?.textContent?.trim()).toBe('Contacts')
  })
})
