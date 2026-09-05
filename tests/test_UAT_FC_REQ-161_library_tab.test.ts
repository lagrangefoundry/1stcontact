// @vitest-environment jsdom
/**
 * REQ-161 — **the Library tab: list-detail over the client's material**.
 *
 * WHAT THIS FILE PROVES. Its siblings cover the origin contract
 * (`…_material_surface.workers.test.ts`) and the way in
 * (`…_upload_overlay.test.ts`). This is the tab: that it is the shared
 * components CONFIGURED rather than a bespoke browser rebuilt beside them, that
 * the list is the whole BUSINESS's material, and that the one thing a client may
 * change about a piece of material is what it SAYS.
 *
 * WHAT MOVED OUT (REQ-181). The placement pill and the "used on this site"
 * filter were asserted here; both are gone, and what replaced the pill — a
 * warning on a promotion that did not land — belongs to the ticket that
 * introduced it.
 *
 * MOUNTED AGAINST THE ACTUALLY-INSTALLED COMPONENTS, on the pattern the REQ-122
 * and REQ-127 panel suites established: a mocked `list-detail` would assert the
 * mock, and the ticket's acceptance is specifically that this is `webui/split` +
 * `webui/list-detail` with no new editing vocabulary. The only doubles are the
 * HTTP calls, because they are the network.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { LIBRARY_TAB, SITE_TAB, TABS } from '../apps/control-app/src/builder/config.js'

let createLibraryPanel: (opts?: Record<string, unknown>) => never
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`REQ-161 library suite skipped: ${WEBUI_SKIP_REASON}`)

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

/**
 * The business's material, as `/api/material` answers.
 *
 * PLACED AND UNPLACED, WHICH IS THE ONLY DISTINCTION LEFT ([[REQ-181]]). A
 * business holds one site, so a fixture cannot spread material across two — what
 * it can still show is a site asset whose bytes landed beside background
 * information whose never will.
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
    // PLACED, because its promotion onto `alpha` landed (BUG-47).
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
    // NEVER PLACED — dropped on "just for you to read", which is exactly the row
    // the old `site_slug` badged as being on the site (BUG-47).
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
    // Placed, like the wordmark — this row is here for its description, which
    // nothing has written ([[REQ-172]]), not for its placement.
    placed_on: ['alpha'],
    source_url: null,
    description_status: 'no_describer',
    description_model: null,
    updated_at: '2026-08-31T10:00:00.000Z',
  },
]

const BODIES: Record<string, string> = {
  'material-1': 'The wordmark in gold on cream.',
  'material-2': 'Positioning, tone of voice, and the colour system.',
  'material-3': '',
}

/** A transport over the fixture, recording what was written through it. */
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

/** A mounted Library over the fixture, already loaded. */
async function library() {
  const transport = transportOver()
  const panel = createLibraryPanel({
    storage: memoryStorage(),
    transport,
  })
  root.append(panel.element)
  await panel.refresh()
  return { panel, transport }
}

const rowsIn = (el: Element) => [...el.querySelectorAll('.list-detail-row')]

describe.skipIf(!WEBUI_INSTALLED)('REQ-161 — the tab is the shared components, configured', () => {
  it('test_UAT_FC_REQ-161_a_library_tab_sits_beside_the_site_and_is_split_over_list_detail', async () => {
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
    })
    await settle()

    // BESIDE the site tab, not inside it: the Library is TENANT-wide while the
    // site tab is about one site, so nesting it would make a scope claim the data
    // does not have.
    //
    // ASSERTS THE ADJACENCY AND NOT THE WHOLE LIST ([[REQ-170]]). This read
    // `toEqual([SITE_TAB.id, LIBRARY_TAB.id])` while those were the only two, and
    // that spelling pinned the tab COUNT as a side effect of pinning the
    // relationship — so the User tab arriving beside them failed a claim it does
    // not contradict. What REQ-161 actually says is that the Library is beside
    // the site tab rather than inside it, which is an ordering fact about those
    // two and stays true however many tabs exist.
    const ids = TABS.map((tab) => tab.id)
    expect(ids).toContain(SITE_TAB.id)
    expect(ids.indexOf(LIBRARY_TAB.id)).toBe(ids.indexOf(SITE_TAB.id) + 1)
    const panel = app.shell.getPanel(LIBRARY_TAB.id)
    expect(panel).toBeTruthy()
    expect(panel.contains(app.library.element)).toBe(true)

    // THE COMPONENTS' OWN DOM, which is the evidence that this is `webui/split` +
    // `webui/list-detail` configured rather than a second browser built beside
    // them. None of these class names is written anywhere in this repository.
    expect(app.library.element.querySelector('.split')).toBeTruthy()
    expect(app.library.element.querySelector('.list-detail-list')).toBeTruthy()
    expect(app.library.element.querySelector('.list-detail-detail')).toBeTruthy()
    // The filter lives in the list header's own slot, not in a bar bolted above.
    expect(
      app.library.element.querySelector('.list-detail-list-header .builder-library__filter'),
    ).toBeTruthy()

    await settle()
    expect(rowsIn(app.library.element)).toHaveLength(MATERIAL.length)
  })
})

describe.skipIf(!WEBUI_INSTALLED)("REQ-161 — the whole of the business's material", () => {
  it('test_UAT_FC_REQ-161_the_list_is_everything_the_business_has_given_us', async () => {
    const { panel } = await library()

    // ALL THREE, including the background information the site will never carry.
    // A Library that listed only what is on the site would be an asset picker,
    // which is REQ-132 and already exists one click away from an image.
    expect(rowsIn(panel.element)).toHaveLength(3)
    expect(panel.element.textContent).toContain('The old shopfront')
    expect(panel.element.textContent).toContain('Brand guidelines')
  })

  it('test_UAT_FC_REQ-161_the_filter_narrows_by_role_and_by_kind', async () => {
    const { panel } = await library()
    const select = (cls: string) => panel.element.querySelector(cls) as HTMLSelectElement
    const change = (el: HTMLElement) => el.dispatchEvent(new Event('change'))

    // BY ROLE — the axis the overlay writes, and the one that separates a hero
    // photograph from a competitor screenshot.
    select('.builder-library__role').value = 'reference'
    change(select('.builder-library__role'))
    expect(rowsIn(panel.element).map((r) => r.textContent)).toEqual([
      expect.stringContaining('Brand guidelines'),
    ])

    // BY KIND — inferred from the content type, never asked.
    select('.builder-library__role').value = ''
    change(select('.builder-library__role'))
    select('.builder-library__kind').value = 'image'
    change(select('.builder-library__kind'))
    expect(rowsIn(panel.element)).toHaveLength(2)

    // BOTH AT ONCE, because the axes are conjunctive — and `getRows` reports
    // what the client is actually looking at rather than what was fetched.
    select('.builder-library__role').value = 'site'
    change(select('.builder-library__role'))
    expect(panel.getRows().map((row: { uid: string }) => row.uid)).toEqual([
      'material-1',
      'material-3',
    ])
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-161 — the detail reuses the editors we already have', () => {
  it('test_UAT_FC_REQ-161_selecting_a_row_shows_the_blob_and_the_rights_record_read_only', async () => {
    const { panel } = await library()
    panel.listDetail.select('material-1')
    await settle()

    const detail = panel.element.querySelector('.list-detail-detail-body')!

    // THE BLOB, SHOWN RATHER THAN NAMED. A Library that could only list filenames
    // asks the client to recognise a picture by its path — the thing REQ-132
    // removed from the image picker.
    const img = detail.querySelector('.builder-library__image') as HTMLImageElement
    expect(img.getAttribute('src')).toBe('/api/material/file?uid=material-1')
    expect(img.alt).toBe('The wordmark')

    // BUILT FROM `mountFields`, which is the acceptance: no new editing
    // components. `.fields` and `.fields-row` are the component's own.
    const rights = detail.querySelector('.builder-library__rights .fields')!
    expect(rights).toBeTruthy()
    const named = (name: string) => rights.querySelector(`.fields-row[data-field="${name}"]`)!
    expect(named('kind').textContent).toContain('image')
    expect(named('rights').textContent).toContain('owned')
    expect(named('origin').textContent).toContain('uploaded')

    // READ-ONLY, AND NOT INCIDENTALLY. DOC-38 §10.1 infers the rights record from
    // provenance precisely so the client is never put in front of a legal
    // question; a `republishable` they could set by hand would be that question
    // with a checkbox on it. The component marks an editable row `is-editable`,
    // so its absence is the mechanical form of the claim.
    for (const row of rights.querySelectorAll('.fields-row')) {
      expect(row.classList.contains('is-editable'), row.getAttribute('data-field') ?? '').toBe(false)
    }
  })

  it('test_UAT_FC_REQ-161_the_client_can_correct_the_description_and_the_correction_is_written', async () => {
    const { panel, transport } = await library()
    // The material nothing has read — the case the correction exists for.
    panel.listDetail.select('material-3')
    await settle()

    const detail = panel.element.querySelector('.list-detail-detail-body')!
    expect(detail.querySelector('.builder-library__status')!.textContent).toMatch(
      /Nothing has read this yet/,
    )

    // ONE EDITABLE FIELD, and it is the description — the ticket body, which IS
    // what the system understands this to be (DOC-38 §6).
    const form = detail.querySelector('.builder-library__description .fields')!
    const editable = [...form.querySelectorAll('.fields-row.is-editable')]
    expect(editable.map((row) => row.getAttribute('data-field'))).toEqual(['body'])

    // Click into it and commit, exactly as an operator does.
    ;(editable[0].querySelector('.fields-value-editable') as HTMLElement).click()
    const control = form.querySelector('textarea') as HTMLTextAreaElement
    expect(control).toBeTruthy()
    control.value = 'The old shopfront, before the repaint.'
    control.dispatchEvent(new Event('change', { bubbles: true }))
    control.dispatchEvent(new Event('blur'))
    await settle()

    expect(transport.saved).toEqual([
      { uid: 'material-3', body: 'The old shopfront, before the repaint.' },
    ])
  })
})
