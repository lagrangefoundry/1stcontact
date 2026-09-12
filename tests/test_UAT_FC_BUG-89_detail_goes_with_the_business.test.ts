// @vitest-environment jsdom
/**
 * BUG-89 — **the open detail goes with the business, not just the rows.**
 *
 * THE FAILURE THIS FILE PINS. Open a contact with 1st Contact's business
 * selected; switch to another business; open the Contacts tab. The list is empty
 * — correct, the other business has no contacts — and the detail pane is still
 * painting the contact from the business that is no longer open, with their
 * record, their addresses, what they run and everything we have said to them.
 *
 * IT IS THE COMPONENT'S TWO HALVES COMING APART. In `no-tab` mode
 * `mountListDetail` holds the open detail as a record keyed by the item, in a map
 * independent of the item list, so `setItems([])` re-renders the LIST pane and
 * never touches the detail body. Both panels' `clear()` dropped the rows and left
 * the pane standing.
 *
 * NOTHING LEAKED ON THE WIRE, AND IT IS STILL A TENANT VIOLATION. `personDetail`
 * scopes by tenant AND id and the material read goes through a scope-bound
 * handle; what was on screen was read legitimately under the previous business
 * and then OUTLIVED the scope it was read in. The pane asserts that what it shows
 * belongs to the business currently named, and an operator cannot tell that apart
 * from a real leak — which is why the claims below are about what is on screen
 * rather than about what was fetched.
 *
 * BOTH PANELS, BECAUSE IT IS ONE DEFECT. The Library had it in exactly the same
 * shape through the same primitive, so the rule is single-sourced in
 * `clearDetail` and asserted on each panel that holds a list-detail.
 *
 * MOUNTED AGAINST THE ACTUALLY-INSTALLED COMPONENTS, on the pattern REQ-199 /
 * REQ-201 / REQ-233 established: the detail pane's lifetime is `list-detail`'s
 * own, and a mocked component would assert the mock rather than that the pane
 * emptied.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createPeoplePanel: (opts?: Record<string, unknown>) => never
let createLibraryPanel: (opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`BUG-89 suite skipped: ${WEBUI_SKIP_REASON}`)

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

// --- the first business's contact ----------------------------------------------

/**
 * ONE CONTACT WITH SOMETHING UNMISTAKABLE ON THEIR PANE. The subject below is the
 * probe: it exists nowhere in the chrome, nowhere in the second business, and
 * only reaches the document if this contact's detail was built. Finding it after
 * a switch is finding the other business's data on screen.
 */
const PRIVATE_SUBJECT = 'Invitation to Alices Plumbing'

const ALICE = {
  id: 'usr_alice',
  email: 'alice@example.test',
  displayName: 'Alice Archer',
  formerNames: [],
  status: 'active',
  invitedAt: '2026-09-01T10:00:00.000Z',
  firstSeenAt: null,
  lastSeenAt: null,
  termsAcceptedAt: null,
  pipelineStage: 'invited',
  createdAt: '2026-09-01T09:00:00.000Z',
}

/**
 * The Contacts transport, over whichever rows the business in scope has.
 *
 * `state.rows` IS MUTABLE BECAUSE A BUSINESS SWITCH IS A DIFFERENT ANSWER FROM
 * THE SAME ROUTE. The panel's transport is fixed at mount and `/api/people` is
 * scoped by the business in scope, so changing what the next read returns is
 * exactly what the switch does from the pane's side.
 */
function contactsTransport(rows: Array<Record<string, unknown>> = [ALICE]) {
  const state = { rows }
  return {
    state,
    list: async () => ({
      people: state.rows.map((row) => ({ ...row })),
      canInvite: true,
      canFulfil: false,
      bounced: [],
    }),
    item: async (id: string) => ({
      person: { ...(state.rows.find((row) => row.id === id) ?? ALICE) },
      emails: [],
      operates: [],
      grants: [],
      events: [],
      provenance: null,
    }),
    messages: async () => ({
      messages: [
        {
          uid: 'tkt_1',
          subject: PRIVATE_SUBJECT,
          queuedAt: '2026-09-01T11:05:00.000Z',
          status: 'delivered',
          failure: null,
          contactId: ALICE.id,
        },
      ],
    }),
    saveRecord: async () => ({}),
    grant: async () => ({}),
    revoke: async () => {},
    add: async () => ({ created: true, person: ALICE }),
    inviteDraft: async () => ({ from: '', subject: '', body: '', declared: [] }),
    invite: async () => ({ results: [] }),
    fulfil: async () => ({}),
  }
}

// --- the first business's material ----------------------------------------------

const PRIVATE_TITLE = 'Alices Plumbing wordmark'

const WORDMARK = {
  uid: 'material-wordmark',
  type: 'material',
  title: PRIVATE_TITLE,
  filename: 'wordmark.svg',
  kind: 'image',
  role: 'site',
  rights: 'owned',
  republishable: true,
  exportable: false,
  origin: 'uploaded',
  placed_on: [],
  source_url: null,
  content_type: 'image/svg+xml',
  description_status: 'ok',
  description_model: 'stub/vision-1',
  updated_at: '2026-09-01T12:00:00.000Z',
}

/** The Library transport, over whichever material the business in scope has. */
function libraryTransport(rows: Array<Record<string, unknown>> = [WORDMARK]) {
  return {
    list: async () => ({ material: rows.map((row) => ({ ...row })), seq: 1 }),
    item: async (uid: string) => ({
      ...(rows.find((row) => row.uid === uid) ?? WORDMARK),
      body: 'The wordmark in gold on cream.',
    }),
    save: async () => ({ ...WORDMARK }),
    fileUrl: (uid: string) => `/api/material/file?uid=${encodeURIComponent(uid)}`,
  }
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ createPeoplePanel } = await import('../apps/control-app/src/builder/people.js'))
    ;({ createLibraryPanel } = await import('../apps/control-app/src/builder/library.js'))
  }
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
})

let root: HTMLElement
beforeEach(() => {
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})

type Panel = {
  element: HTMLElement
  listDetail: { select: (key: string | null) => void; getSelectedKey: () => string | null }
  refresh: () => Promise<unknown>
  clear: () => void
}

/** A mounted Contacts pane with one contact open, exactly as an operator leaves it. */
async function contactsPaneWithAliceOpen(transport: ReturnType<typeof contactsTransport> = contactsTransport()) {
  const panel = createPeoplePanel({
    storage: memoryStorage(),
    transport,
  }) as unknown as Panel
  root.append(panel.element)
  await panel.refresh()
  panel.listDetail.select(ALICE.id)
  // THREE TURNS BECAUSE THE PANE IS BUILT IN STAGES — the record, the addresses,
  // then the history — and the probe lives in the last of them.
  await settle()
  await settle()
  await settle()
  return panel
}

/** A mounted Library with one material open. */
async function libraryWithWordmarkOpen(transport = libraryTransport()) {
  const panel = createLibraryPanel({
    storage: memoryStorage(),
    transport,
  }) as unknown as Panel
  root.append(panel.element)
  await panel.refresh()
  panel.listDetail.select(WORDMARK.uid)
  await settle()
  await settle()
  await settle()
  return panel
}

const paneText = (el: Element) => el.textContent ?? ''
const detailBody = (el: Element) => el.querySelector('.list-detail-detail-body') as HTMLElement
const rowsIn = (el: Element) => [...el.querySelectorAll('.list-detail-row')]

describe.skipIf(!WEBUI_INSTALLED)('BUG-89 — the Contacts detail goes with the business', () => {
  it('test_UAT_FC_BUG-89_clearing_the_contacts_pane_closes_the_open_contact', async () => {
    const panel = await contactsPaneWithAliceOpen()
    // The pane really is showing them, or the claim below proves nothing.
    expect(panel.element.querySelector('.builder-people__detail')).not.toBeNull()
    expect(paneText(panel.element)).toContain(PRIVATE_SUBJECT)

    panel.clear()

    // THE DETAIL VIEW IS GONE FROM THE DOCUMENT, not merely hidden or restyled:
    // the record is destroyed and the blank pane is back in its place.
    expect(panel.element.querySelector('.builder-people__detail')).toBeNull()
    expect(paneText(panel.element)).not.toContain(PRIVATE_SUBJECT)
    expect(detailBody(panel.element).querySelector('.builder-empty')?.textContent).toBe(
      'Select a person.',
    )
  })

  it('test_UAT_FC_BUG-89_a_business_switch_leaves_no_trace_of_the_previous_contact', async () => {
    // THE SWITCH AS THE HOST ACTUALLY PERFORMS IT ([[REQ-181]]'s pair): clear,
    // then re-read into the business now in scope. The business switched to has no
    // contacts at all, which is the reported case exactly — an empty list beside a
    // populated detail.
    const transport = contactsTransport()
    const panel = await contactsPaneWithAliceOpen(transport)

    transport.state.rows = []
    panel.clear()
    await panel.refresh()
    await settle()

    expect(rowsIn(panel.element)).toHaveLength(0)
    expect(panel.element.querySelector('.builder-people__detail')).toBeNull()
    expect(paneText(panel.element)).not.toContain(PRIVATE_SUBJECT)
    expect(paneText(panel.element)).not.toContain(ALICE.email)
  })

  it('test_UAT_FC_BUG-89_the_selection_does_not_outlive_the_list_it_pointed_into', async () => {
    // A KEY WITH NO ROW. Left standing it makes the component report a selected
    // contact the operator cannot see, in a business that has no such row.
    const panel = await contactsPaneWithAliceOpen()
    expect(panel.listDetail.getSelectedKey()).toBe(ALICE.id)
    panel.clear()
    expect(panel.listDetail.getSelectedKey()).toBeNull()
  })
})

describe.skipIf(!WEBUI_INSTALLED)('BUG-89 — the Library detail goes with the business', () => {
  it('test_UAT_FC_BUG-89_clearing_the_library_closes_the_open_material', async () => {
    // THE SAME DEFECT IN THE SAME SHAPE. This pane's own `clear` already promised
    // that one business's material may not be left on screen under a header
    // naming another; it kept the promise for the rows only.
    const panel = await libraryWithWordmarkOpen()
    expect(panel.element.querySelector('.builder-library__detail')).not.toBeNull()
    expect(paneText(panel.element)).toContain(PRIVATE_TITLE)

    panel.clear()

    expect(panel.element.querySelector('.builder-library__detail')).toBeNull()
    expect(paneText(panel.element)).not.toContain(PRIVATE_TITLE)
    expect(detailBody(panel.element).querySelector('.builder-empty')).not.toBeNull()
  })

  it('test_UAT_FC_BUG-89_the_librarys_selection_does_not_outlive_its_list', async () => {
    const panel = await libraryWithWordmarkOpen()
    expect(panel.listDetail.getSelectedKey()).toBe(WORDMARK.uid)
    panel.clear()
    expect(panel.listDetail.getSelectedKey()).toBeNull()
  })
})
