// @vitest-environment jsdom
/**
 * story-1500b111 — **the Library tab: everything the client has given us, in one
 * place, with its description correctable** — browser half.
 *
 * WHAT THIS FILE PROVES, and what its sibling proves instead. The Library is a
 * browser surface over an origin contract, and the two halves fail in completely
 * different ways. `reconciliation-library-surface.workers.test.ts` is the
 * CONTRACT — what the list carries, what the bytes come back as, what a
 * correction does to the record and to retrieval. This file is the SURFACE: that
 * the tab is the workspace's own `split` + `list-detail` CONFIGURED rather than a
 * second browser built beside them, and that the one thing a client may change
 * about a piece of material is what it SAYS. The listing, the filters, the
 * read-only record and the placement warning are proved against REQ-181's design
 * in `reconciliation-library-badges-the-exception.test.ts`.
 *
 * MOUNTED AGAINST THE ACTUALLY-INSTALLED COMPONENTS, on the pattern the workspace
 * chrome suites established. A mocked `list-detail` would assert the mock, and
 * AC-1714's claim is specifically that this surface introduces no presentation
 * and no editing control that the workspace did not already have — a claim only
 * the components' own DOM can carry. The suites therefore SKIP with a reported
 * reason on a machine that has not run the out-of-band `webui` install, rather
 * than passing while proving nothing.
 *
 * THE ONLY DOUBLE IS THE NETWORK. `transport` stands in for the four routes, and
 * nothing else here is stood in for: the rows are the rows the origin answers
 * with (the sibling file proves that shape against real D1 and R2), and every
 * filter, badge, preview and field row below is produced by the real panel over
 * them.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

/**
 * `library.js` and `app.js` import the webui components by bare specifier, so
 * they are loaded DYNAMICALLY: on a machine without them a static import would
 * fail the whole file at transform time rather than reporting a skip.
 */
let createLibraryPanel: (opts?: Record<string, unknown>) => never
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => never
let LIBRARY_TAB: { id: string; label: string }
let SITE_TAB: { id: string; label: string }
let TABS: Array<{ id: string }>

if (!WEBUI_INSTALLED) console.warn(`story-1500b111 Library suites skipped: ${WEBUI_SKIP_REASON}`)

/** One macrotask — the panel builds the detail frame now and fills it from `item()`. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

function memoryStorage(): Storage {
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
  } as Storage
}

/**
 * The account's material, as the list route answers it — placement read from
 * the recorded `placed_on` (BUG-47).
 */
const MATERIAL = [
  {
    uid: 'material-1',
    type: 'material',
    title: 'The wordmark',
    filename: 'wordmark.svg',
    kind: 'image',
    role: 'site',
    rights: 'owned',
    republishable: true,
    exportable: false,
    origin: 'uploaded',
    placed_on: ['alpha'],
    source_url: null,
    description_status: 'ok',
    description_model: 'stub/vision-1',
    updated_at: '2026-08-31T12:00:00.000Z',
  },
  {
    uid: 'material-2',
    type: 'material',
    title: 'Brand guidelines',
    filename: 'guidelines.pdf',
    kind: 'document',
    role: 'reference',
    rights: 'owned',
    republishable: false,
    exportable: false,
    origin: 'uploaded',
    placed_on: [],
    source_url: null,
    description_status: 'ok',
    description_model: 'unpdf',
    updated_at: '2026-08-31T11:00:00.000Z',
  },
  {
    uid: 'material-3',
    type: 'material',
    title: 'The old shopfront',
    filename: 'shopfront.jpg',
    kind: 'image',
    role: 'site',
    rights: 'owned',
    republishable: true,
    exportable: false,
    origin: 'uploaded',
    placed_on: ['beta'],
    source_url: null,
    description_status: 'no_describer',
    description_model: null,
    updated_at: '2026-08-31T10:00:00.000Z',
  },
]

/** The description the item route adds to a row. `material-3` has none. */
const BODIES: Record<string, string> = {
  'material-1': 'The wordmark in gold on cream.',
  'material-2': 'Positioning, tone of voice, and the colour system.',
  'material-3': '',
}

/** A transport over the fixture, recording every description it was asked to save. */
function transportOver(rows = MATERIAL) {
  const saved: Array<{ uid: string; body: string }> = []
  return {
    saved,
    list: async () => ({ material: rows.map((row) => ({ ...row })) }),
    item: async (uid: string) => ({
      ...rows.find((row) => row.uid === uid)!,
      body: BODIES[uid] ?? '',
    }),
    save: async (uid: string, body: string) => {
      saved.push({ uid, body })
      return { ...rows.find((row) => row.uid === uid)!, description_status: 'ok', body }
    },
    fileUrl: (uid: string) => `/api/material/file?uid=${encodeURIComponent(uid)}`,
  }
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ createLibraryPanel } = await import('../apps/control-app/src/builder/library.js'))
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    ;({ LIBRARY_TAB, SITE_TAB, TABS } = await import('../apps/control-app/src/builder/config.js'))
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

/**
 * A mounted Library over the fixture, already loaded. The Library never asks
 * which site is open (REQ-181): the host clears and refreshes it on a business
 * switch, so there is no site to hand it.
 */
async function library() {
  const transport = transportOver()
  const panel = createLibraryPanel({
    storage: memoryStorage(),
    transport,
  }) as unknown as {
    element: HTMLElement
    listDetail: { select: (uid: string) => void }
    refresh: () => Promise<unknown>
    getRows: () => Array<Record<string, unknown>>
  }
  root.append(panel.element)
  await panel.refresh()
  return { panel, transport }
}

const rowsIn = (el: Element) => [...el.querySelectorAll('.list-detail-row')]

/** Select a row and let the detail's second request land. */
async function open(panel: { element: HTMLElement; listDetail: { select: (uid: string) => void } }, uid: string) {
  panel.listDetail.select(uid)
  await settle()
  return panel.element.querySelector('.list-detail-detail-body')!
}

describe.skipIf(!WEBUI_INSTALLED)('AC-1714 — a Library beside the site tab, in the workspace’s own two panes', () => {
  it('test_UAT_AC1714_library_tab_is_the_workspace_split_list_detail_with_filters_in_the_list_header', async () => {
    const app = mountBuilder(root, {
      sites: [{ slug: 'alpha', latest: 1 }],
      storage: memoryStorage(),
      chatTransport: {
        openSession: async () => ({ sessionId: 's', turns: [], ready: true }),
        streamPrompt: async function* () {
          yield { kind: 'done' }
        },
      },
      libraryTransport: transportOver(),
    }) as unknown as {
      shell: { getPanel: (id: string) => HTMLElement }
      library: { element: HTMLElement; listDetail: { select: (uid: string) => void } }
    }
    await settle()

    // BESIDE the site tab, not inside it: the Library is the ACCOUNT's material
    // while the site tab is about one site, so nesting it would make a scope
    // claim the data does not have.
    expect(TABS.map((tab) => tab.id)).toEqual([SITE_TAB.id, LIBRARY_TAB.id])
    const hosting = app.shell.getPanel(LIBRARY_TAB.id)
    expect(hosting).toBeTruthy()
    expect(hosting.contains(app.library.element)).toBe(true)

    // THE COMPONENTS' OWN DOM, which is the evidence that this is the workspace's
    // split and list-detail configured rather than a second browsing surface
    // built beside them. None of these class names is authored in this repository.
    expect(app.library.element.querySelector('.split')).toBeTruthy()
    expect(app.library.element.querySelector('.list-detail-list')).toBeTruthy()
    expect(app.library.element.querySelector('.list-detail-detail')).toBeTruthy()

    // THE FILTERS ARE IN THE LIST'S OWN HEADER, not in a bar added above it.
    expect(
      app.library.element.querySelector('.list-detail-list-header .builder-library__filter'),
    ).toBeTruthy()

    // Every row the account holds is present with no filter set.
    await settle()
    expect(rowsIn(app.library.element)).toHaveLength(MATERIAL.length)

    // AND THE DETAIL'S ROWS ARE THE WORKSPACE'S EXISTING FIELD EDITORS — the
    // `fields` component's own markup, not something unique to this surface.
    const detail = await open(app.library, 'material-1')
    expect(detail.querySelector('.builder-library__rights .fields')).toBeTruthy()
    expect(detail.querySelectorAll('.fields-row').length).toBeGreaterThan(0)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('AC-1718 — the description is the one editable thing', () => {
  it('test_UAT_AC1718_undescribed_material_says_so_and_the_committed_correction_is_stored', async () => {
    const { panel, transport } = await library()

    // THE MATERIAL NOTHING HAS READ — the case the correction exists for. In
    // place of a description it carries a statement and an invitation, not an
    // empty box with no explanation.
    const detail = await open(panel, 'material-3')
    expect(detail.querySelector('.builder-library__status')!.textContent).toMatch(
      /Nothing has read this yet/i,
    )

    // EXACTLY ONE FIELD OF THE PANE ACCEPTS EDITING, AND IT IS THE DESCRIPTION.
    // Counted across the WHOLE detail — the rights block is on this pane too, and
    // a count taken inside the description block alone would pass whatever the
    // rights block did.
    const editableRows = [...detail.querySelectorAll('.fields-row.is-editable')]
    expect(editableRows.map((row) => row.getAttribute('data-field'))).toEqual(['body'])
    expect(detail.querySelector('.builder-library__description .fields')).toBeTruthy()

    // COMMIT IT THE WAY A CLIENT DOES — type, then leave the field.
    ;(editableRows[0].querySelector('.fields-value-editable') as HTMLElement).click()
    const control = detail.querySelector(
      '.builder-library__description textarea',
    ) as HTMLTextAreaElement
    expect(control).toBeTruthy()
    control.value = 'The old shopfront, before the repaint.'
    control.dispatchEvent(new Event('change', { bubbles: true }))
    control.dispatchEvent(new Event('blur'))
    await settle()

    // THE TYPED TEXT IS STORED AS THAT MATERIAL'S DESCRIPTION.
    expect(transport.saved).toEqual([
      { uid: 'material-3', body: 'The old shopfront, before the repaint.' },
    ])

    // AND THE PANE AND THE ROW REFLECT WHAT THE STORE NOW HOLDS rather than a
    // guess at what changed: the write also moved `description_status`, which the
    // row carries, and the row now reads it back from the answer.
    expect(detail.querySelector('.builder-library__status')!.textContent).toBe('')
    const row = panel.getRows().find((r) => r.uid === 'material-3')!
    expect(row.description_status).toBe('ok')
    expect(row.body).toBe('The old shopfront, before the repaint.')
  })
})
