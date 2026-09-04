// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { LIBRARY_TAB, SITE_TAB, TABS } from '../apps/control-app/src/builder/config.js'
import { materialFileUrl } from '../apps/control-app/src/builder/api.js'

/**
 * Reconciliation UATs for story-f775289b — **the Library's SURFACE half**, the
 * six criteria whose observable is a rendered pane.
 *
 *   AC-1558 — a Library surface sits beside the site surface, list beside detail.
 *   AC-1559 — the list is the whole account, newest first, the open site a mark.
 *   AC-1560 — four narrowings, conjunctive, every one of them reversible.
 *   AC-1561 — the row opens the FILE: a picture renders, everything else is
 *             offered by its own name, and absent bytes say so in words.
 *   AC-1562 — the rights record is read-only; the description is the one thing
 *             the client may change.
 *   AC-1567 — material nothing has read is still listed, says so plainly, and
 *             the correction works from that state.
 *
 * Its sibling `reconciliation-library-material-origin.workers.test.ts` carries
 * the seven criteria about the ORIGIN (AC-1563…AC-1566, AC-1568…AC-1570) against
 * real D1 and R2 inside workerd. The split is the runtime: these six need a DOM,
 * which workerd does not have, and those seven need real bindings, which jsdom
 * does not have.
 *
 * MOUNTED AGAINST THE ACTUALLY-INSTALLED COMPONENTS, on the pattern the REQ-122
 * and REQ-127 panel suites established. A mocked `list-detail` would assert the
 * mock, and the story's technical context is specifically that this surface is
 * `webui/split` + `webui/list-detail` + `mountFields` CONFIGURED — so the
 * components' own class names are the evidence that no second set was grown.
 *
 * ONE DOUBLE, AND IT IS THE NETWORK. `globalThis.fetch` is replaced by
 * {@link fakeOrigin}; everything above it is real — `api.js`'s own
 * `fetchMaterial` / `fetchMaterialItem` / `materialFileUrl` /
 * `saveMaterialDescription`, `library.js`, and the installed components. The
 * origin's own behaviour is proved in the workerd sibling; what is proved here
 * is what the browser DOES with it, including the exact request it sends.
 */

let createLibraryPanel: (opts?: Record<string, unknown>) => never
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`story-f775289b library suite skipped: ${WEBUI_SKIP_REASON}`)

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

interface Row {
  uid: string
  type: string
  title: string
  filename: string
  kind: string
  role: string | null
  rights: string
  republishable: boolean
  exportable: boolean
  origin: string
  site_slug: string | null
  source_url: string | null
  description_status: string | null
  description_model: string | null
  updated_at: string
}

/**
 * The account's material, as `/api/material` answers it — newest first, which is
 * the order `listMaterial` sorts into.
 *
 * DELIBERATELY SPANS TWO SITES AND NEITHER, and deliberately includes one piece
 * with NO role recorded and one nothing has read. [[DOC-38]] §7.7 lets one blob
 * back two sites and [[DOC-10]] §4.1 makes shared knowledge across a client's
 * sites deliberate, so a fixture bound only to the open site could not tell a
 * badge from a boundary — and a fixture in which every row has a role could not
 * tell "Anything" from "some role".
 */
const MATERIAL: Row[] = [
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
    site_slug: 'alpha',
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
    site_slug: null,
    source_url: null,
    description_status: 'ok',
    description_model: 'unpdf',
    updated_at: '2026-08-31T11:00:00.000Z',
  },
  {
    // Another site of the SAME account — present in the list, marked differently
    // — and the one nothing has read, which AC-1567 is about.
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
    site_slug: 'beta',
    source_url: null,
    description_status: 'no_describer',
    description_model: null,
    updated_at: '2026-08-31T10:00:00.000Z',
  },
  {
    // Fetched on the client's behalf: no role was ever asked, and it carries the
    // address it came from — the field AC-1562 asks the detail to state.
    uid: 'material-4',
    type: 'reference',
    title: 'Late-night trade in Edinburgh',
    filename: 'market-report.pdf',
    kind: 'document',
    role: null,
    rights: 'third_party',
    republishable: false,
    exportable: true,
    origin: 'fetched',
    site_slug: null,
    source_url: 'https://example.test/reports/late-night-trade.pdf',
    description_status: 'ok',
    description_model: 'unpdf',
    updated_at: '2026-08-31T09:00:00.000Z',
  },
  {
    uid: 'material-5',
    type: 'material',
    title: 'Founder headshot',
    filename: 'headshot.jpg',
    kind: 'image',
    role: 'reference',
    rights: 'owned',
    republishable: false,
    exportable: false,
    origin: 'uploaded',
    site_slug: null,
    source_url: null,
    description_status: 'ok',
    description_model: 'stub/vision-1',
    updated_at: '2026-08-31T08:00:00.000Z',
  },
]

const BODIES: Record<string, string> = {
  'material-1': 'The wordmark in gold on cream.',
  'material-2': 'Positioning, tone of voice, and the colour system.',
  // NOTHING HAS READ THIS ONE. Empty, not absent: the record exists and is
  // honest about being unfindable by its contents.
  'material-3': '',
  'material-4': 'Trading hours and footfall for late-night food in the city.',
  'material-5': 'A head-and-shoulders photograph against a plain wall.',
}

interface Call {
  method: string
  path: string
  body: unknown
}

/**
 * The network, and nothing above it.
 *
 * Answers the three routes `api.js` actually calls, and RECORDS every request —
 * which is what lets a test assert what the surface sent rather than what a
 * transport double was asked to do.
 */
function fakeOrigin() {
  const rows = MATERIAL.map((row) => ({ ...row }))
  const bodies = { ...BODIES }
  const calls: Call[] = []

  const json = (status: number, payload: unknown) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { 'content-type': 'application/json' },
    })

  const impl = async (input: string, init?: RequestInit): Promise<Response> => {
    const url = new URL(String(input), 'https://app.test')
    const method = (init?.method ?? 'GET').toUpperCase()
    const parsed = typeof init?.body === 'string' ? JSON.parse(init.body) : null
    calls.push({ method, path: url.pathname, body: parsed })

    if (url.pathname === '/api/material' && method === 'GET') {
      return json(200, { material: rows.map((row) => ({ ...row })) })
    }
    if (url.pathname === '/api/material/item' && method === 'GET') {
      const uid = url.searchParams.get('uid') ?? ''
      const row = rows.find((r) => r.uid === uid)
      if (!row) return json(404, { error: `${uid} is not a piece of material.` })
      return json(200, { ...row, body: bodies[uid] ?? '' })
    }
    if (url.pathname === '/api/material/description' && method === 'POST') {
      const { uid, body } = parsed as { uid: string; body: string }
      const row = rows.find((r) => r.uid === uid)!
      // The contract the real route holds to (proved in the workerd sibling by
      // AC-1565): the description becomes a real one, credited to the client.
      bodies[uid] = body
      row.description_status = 'ok'
      row.description_model = 'client'
      return json(200, { ...row, body })
    }
    // Anything else the shell reaches for while mounting.
    return json(200, {})
  }

  return { impl, calls, bodies, rows }
}

let origin: ReturnType<typeof fakeOrigin>
const savedFetch = globalThis.fetch

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
  origin = fakeOrigin()
  globalThis.fetch = origin.impl as unknown as typeof fetch
})

afterEach(() => {
  globalThis.fetch = savedFetch
})

/** A mounted Library over the fake origin, already loaded. `site` is mutable. */
async function library(initialSite: string | null = 'alpha') {
  const state = { site: initialSite }
  const panel = createLibraryPanel({
    storage: memoryStorage(),
    getSite: () => state.site,
  })
  root.append(panel.element)
  await panel.refresh()
  return { panel, state }
}

const rowsIn = (el: Element) => [...el.querySelectorAll('.list-detail-row')]
const titlesIn = (el: Element) =>
  rowsIn(el).map((row) => row.querySelector('.builder-library__row-title')!.textContent)

/** Select a row and let the detail's second request land. */
async function open(panel: { element: HTMLElement; listDetail: { select(uid: string): void } }, uid: string) {
  panel.listDetail.select(uid)
  await settle()
  return panel.element.querySelector('.list-detail-detail-body')!
}

const control = (el: Element, cls: string) => el.querySelector(cls) as HTMLInputElement & HTMLSelectElement
const change = (el: HTMLElement) => el.dispatchEvent(new Event('change'))
const input = (el: HTMLElement) => el.dispatchEvent(new Event('input'))

describe.skipIf(!WEBUI_INSTALLED)('story-f775289b — a second surface in the workspace', () => {
  it('test_UAT_AC1558_a_library_surface_sits_beside_the_site_surface_as_list_and_detail', async () => {
    const app = mountBuilder(root, {
      sites: [{ slug: 'alpha', latest: 1 }],
      storage: memoryStorage(),
      chatTransport: {
        openSession: async () => ({ sessionId: 's', turns: [], ready: true }),
        streamPrompt: async function* () {
          yield { kind: 'done' }
        },
      },
    })
    await settle()

    // A SECOND CONTENT SURFACE, reached without leaving the workspace — beside
    // the site surface, not inside it. The Library is ACCOUNT-wide while the
    // site surface is about one site, so nesting it would make a scope claim the
    // data does not have.
    expect(TABS.map((tab) => tab.id)).toEqual([SITE_TAB.id, LIBRARY_TAB.id])
    const libraryPanel = app.shell.getPanel(LIBRARY_TAB.id)
    const sitePanel = app.shell.getPanel(SITE_TAB.id)
    expect(libraryPanel).toBeTruthy()
    expect(libraryPanel.contains(app.library.element)).toBe(true)

    // …AND THE SITE SURFACE IS STILL THERE, UNCHANGED. A second surface that
    // replaced the first would not be a second surface.
    expect(sitePanel).toBeTruthy()
    expect(sitePanel).not.toBe(libraryPanel)
    expect(sitePanel.contains(app.library.element)).toBe(false)
    expect(sitePanel.querySelector('iframe, .split')).toBeTruthy()

    // A LIST REGION AND A DETAIL REGION — the components' OWN class names, which
    // is the evidence that this is `webui/split` + `webui/list-detail`
    // configured rather than a second browser built beside them. None of these
    // is written anywhere in this repository.
    const surface = app.library.element
    expect(surface.querySelector('.split')).toBeTruthy()
    const list = surface.querySelector('.list-detail-list')!
    const detail = surface.querySelector('.list-detail-detail')!
    expect(list).toBeTruthy()
    expect(detail).toBeTruthy()

    // BEFORE ANYTHING IS SELECTED, AN INVITATION RATHER THAN A BLANK. An empty
    // pane reads as a surface that failed to load.
    const detailBody = surface.querySelector('.list-detail-detail-body')!
    expect(detailBody.textContent?.trim()).not.toBe('')
    expect(detailBody.textContent).toMatch(/Pick something on the left/)

    await settle()
    // EVERY ROW SAYS WHAT IT IS AND WHAT KIND OF THING IT IS.
    const rendered = rowsIn(surface)
    expect(rendered).toHaveLength(MATERIAL.length)
    for (const row of MATERIAL) {
      const node = rendered.find((r) => r.textContent?.includes(row.title))!
      expect(node, row.title).toBeTruthy()
      expect(node.querySelector('.builder-library__row-title')!.textContent).toBe(row.title)
      expect(node.querySelector('.builder-library__badge--kind')!.textContent).toBe(row.kind)
    }
  })
})

describe.skipIf(!WEBUI_INSTALLED)('story-f775289b — the whole account, with the site as a mark', () => {
  it('test_UAT_AC1559_the_list_is_the_whole_account_newest_first_and_the_open_site_only_marks_it', async () => {
    const { panel, state } = await library('alpha')

    // EVERY PIECE THE ACCOUNT HOLDS — including the material bound to the
    // client's OTHER site and the material bound to none. A Library that showed
    // only the open site's material would make their second site start as cold
    // as their first.
    expect(rowsIn(panel.element)).toHaveLength(MATERIAL.length)
    const shown = titlesIn(panel.element)
    expect(shown).toContain('The wordmark') // bound to the open site
    expect(shown).toContain('The old shopfront') // bound to the client's other site
    expect(shown).toContain('Brand guidelines') // bound to no site at all

    // MOST RECENTLY CHANGED FIRST, computed from the rows rather than restated,
    // so this fails if the ordering the surface renders stops being that one.
    const newestFirst = [...MATERIAL]
      .sort((a, b) => (a.updated_at < b.updated_at ? 1 : a.updated_at > b.updated_at ? -1 : 0))
      .map((row) => row.title)
    expect(shown).toEqual(newestFirst)

    /** Which rows carry the used-here mark, by title. */
    const marked = () =>
      [...panel.element.querySelectorAll('.builder-library__badge--here')].map(
        (badge) => badge.closest('.list-detail-row')!.querySelector('.builder-library__row-title')!
          .textContent,
      )

    // THE MARK IS ON THE OPEN SITE'S MATERIAL AND ONLY THAT — and there is no
    // "not used here" mark on the rest, which would be noise about the majority
    // to say something about the few.
    expect(marked()).toEqual(['The wordmark'])
    expect(panel.element.querySelectorAll('[class*="--not-here"]')).toHaveLength(0)

    // CHANGING WHICH SITE IS OPEN RE-MARKS THE SAME LIST. No row leaves it: the
    // material did not change, only which of it is in use here.
    state.site = 'beta'
    panel.siteChanged()
    expect(titlesIn(panel.element)).toEqual(newestFirst)
    expect(marked()).toEqual(['The old shopfront'])
  })

  it('test_UAT_AC1560_the_list_narrows_four_ways_conjunctively_and_every_narrowing_is_reversible', async () => {
    const { panel } = await library('alpha')
    const el = panel.element
    const all = titlesIn(el)
    expect(all).toHaveLength(MATERIAL.length)

    const role = control(el, '.builder-library__role')
    const kind = control(el, '.builder-library__kind')
    const search = control(el, '.builder-library__search')
    const here = control(el, '.builder-library__here input')

    // 1. WHAT THE MATERIAL IS FOR. The axis the upload overlay writes, and the
    //    one that separates a hero photograph from a competitor screenshot.
    role.value = 'reference'
    change(role)
    expect(titlesIn(el)).toEqual(['Brand guidelines', 'Founder headshot'])
    // The neutral choice shows EVERY row — including the fetched one, for which
    // no role was ever asked.
    role.value = ''
    change(role)
    expect(titlesIn(el)).toEqual(all)
    expect(titlesIn(el)).toContain('Late-night trade in Edinburgh')

    // 2. WHAT KIND OF THING IT IS — inferred from the content type, never asked.
    kind.value = 'image'
    change(kind)
    expect(titlesIn(el)).toEqual(['The wordmark', 'The old shopfront', 'Founder headshot'])
    kind.value = ''
    change(kind)
    expect(titlesIn(el)).toEqual(all)

    // 3. USED ON THE OPEN SITE — a view the client turns on, not a scope the
    //    origin imposed. Turning it off restores the other site's and the
    //    unbound material.
    here.checked = true
    change(here)
    expect(titlesIn(el)).toEqual(['The wordmark'])
    here.checked = false
    change(here)
    expect(titlesIn(el)).toEqual(all)

    // 4. BY NAME, case-insensitively — a library of a client's own files is
    //    unusable at any real size without it.
    search.value = 'SHOPFRONT'
    input(search)
    expect(titlesIn(el)).toEqual(['The old shopfront'])
    search.value = ''
    input(search)
    expect(titlesIn(el)).toEqual(all)

    // THEY COMBINE: a row is shown only if it survives all four. Neither of
    // these two alone leaves one row — together they do.
    role.value = 'reference'
    change(role)
    kind.value = 'image'
    change(kind)
    expect(titlesIn(el)).toEqual(['Founder headshot'])

    // AND RETURNING EVERY NARROWING TO NEUTRAL RESTORES THE LIST EXACTLY.
    role.value = ''
    change(role)
    kind.value = ''
    change(kind)
    here.checked = false
    change(here)
    search.value = ''
    input(search)
    expect(titlesIn(el)).toEqual(all)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('story-f775289b — the detail shows the file and the record', () => {
  it('test_UAT_AC1561_a_picture_renders_every_kind_is_reachable_and_absent_bytes_say_so', async () => {
    const { panel } = await library('alpha')

    // AN IMAGE IS RENDERED, not named. A Library that could only list filenames
    // asks the client to recognise a picture by its path — the thing REQ-132
    // removed from the image picker.
    const detail = await open(panel, 'material-1')
    const img = detail.querySelector('.builder-library__image') as HTMLImageElement
    expect(img).toBeTruthy()
    // ADDRESSED AT THIS ACCOUNT'S COPY OF THOSE BYTES: the builder origin's own
    // material route, which reads the private store through the account's handle
    // — never the host that serves published sites.
    expect(img.getAttribute('src')).toBe(materialFileUrl('material-1'))
    expect(img.getAttribute('src')).toMatch(/^\/api\/material\/file\?uid=/)
    // …carrying the material's name as its text alternative.
    expect(img.alt).toBe('The wordmark')

    // EVERY KIND IS REACHABLE AS A FILE, not only images. A document renders no
    // picture and is still offered under the name it arrived with, in a form
    // that opens or saves the actual file.
    const docDetail = await open(panel, 'material-2')
    expect(docDetail.querySelector('.builder-library__image')).toBeNull()
    const link = docDetail.querySelector('.builder-library__download') as HTMLAnchorElement
    expect(link).toBeTruthy()
    expect(link.textContent).toBe('guidelines.pdf')
    expect(link.getAttribute('download')).toBe('guidelines.pdf')
    expect(link.getAttribute('href')).toBe(materialFileUrl('material-2'))

    // BYTES THAT CANNOT BE RETRIEVED SAY SO IN PLAIN WORDS, rather than leaving
    // a broken-image glyph. The browser's own failure signal is what the pane
    // listens for, so it is what is raised here.
    const backAgain = await open(panel, 'material-1')
    const broken = backAgain.querySelector('.builder-library__image') as HTMLImageElement
    broken.dispatchEvent(new Event('error'))
    expect(backAgain.querySelector('.builder-library__image')).toBeNull()
    const missing = backAgain.querySelector('.builder-library__missing')!
    expect(missing).toBeTruthy()
    expect(missing.textContent).toMatch(/no longer in storage/)
  })

  it('test_UAT_AC1562_the_rights_record_is_read_only_and_the_description_is_the_one_editable_thing', async () => {
    const { panel } = await library('alpha')
    // The fetched report: the one piece that carries an address it was retrieved
    // from, which is the field the criterion asks for "where there is one".
    const detail = await open(panel, 'material-4')

    // BUILT FROM `mountFields`, which is the story's own acceptance: no new
    // editing components. `.fields` and `.fields-row` are the component's.
    const rights = detail.querySelector('.builder-library__rights .fields')!
    expect(rights).toBeTruthy()
    const named = (name: string) => rights.querySelector(`.fields-row[data-field="${name}"]`)!

    // EVERY FIELD THE CRITERION NAMES, WITH THE STORED VALUE.
    expect(named('filename').textContent).toContain('market-report.pdf')
    expect(named('kind').textContent).toContain('document')
    expect(named('origin').textContent).toContain('fetched')
    expect(named('rights').textContent).toContain('third_party')
    expect(named('site_slug')).toBeTruthy()
    expect(named('source_url').textContent).toContain(
      'https://example.test/reports/late-night-trade.pdf',
    )
    // The role the client said it was for, in the words the overlay used.
    expect(named('role')).toBeTruthy()
    // …AND REPUBLISHABILITY AS THE STATE IT ACTUALLY HOLDS, not a default —
    // read off the value cell rather than the row, so the label cannot satisfy
    // the assertion. Contrasted against a republishable row below, because a
    // constant would pass either one of these on its own.
    const republishability = (row: Element) => row.querySelector('.fields-value')!.textContent
    expect(republishability(named('republishable'))).toBe('No')

    // READ-ONLY, AND NOT INCIDENTALLY. [[DOC-38]] §10.1 infers the rights record
    // from provenance precisely so the client is never put in front of a legal
    // question; a `republishable` they could set by hand would be that question
    // with a checkbox on it. Three independent forms of the same claim:
    for (const row of rights.querySelectorAll('.fields-row')) {
      expect(row.classList.contains('is-editable'), row.getAttribute('data-field') ?? '').toBe(false)
    }
    expect(rights.querySelector('input, select, textarea')).toBeNull()
    expect(rights.querySelector('.fields-value-editable')).toBeNull()

    // ATTEMPTING TO CHANGE REPUBLISHABILITY THROUGH THE SURFACE. Clicking the
    // value is the gesture that opens an editor on an editable row; here it
    // opens nothing, and nothing is sent.
    const before = origin.calls.length
    ;(named('republishable').querySelector('.fields-value') as HTMLElement).click()
    await settle()
    expect(named('republishable').querySelector('input')).toBeNull()
    expect(origin.calls.slice(before).filter((c) => c.method !== 'GET')).toEqual([])
    expect(origin.rows.find((r) => r.uid === 'material-4')!.republishable).toBe(false)

    // AND THE DESCRIPTION IS THE ONE THING THEY MAY CHANGE — exactly one
    // editable row on the pane, and it is what the system understands the file
    // to be.
    const description = detail.querySelector('.builder-library__description .fields')!
    const editable = [...description.querySelectorAll('.fields-row.is-editable')]
    expect(editable.map((row) => row.getAttribute('data-field'))).toEqual(['body'])

    // THE CONTRAST. A material that MAY appear on a published site states the
    // opposite, still with no control offering to change it — so the pane is
    // reporting the record rather than printing a constant.
    const publishable = await open(panel, 'material-1')
    const publishableRights = publishable.querySelector('.builder-library__rights .fields')!
    expect(
      republishability(publishableRights.querySelector('.fields-row[data-field="republishable"]')!),
    ).toBe('Yes')
    expect(publishableRights.querySelector('input, select, textarea')).toBeNull()
  })
})

describe.skipIf(!WEBUI_INSTALLED)('story-f775289b — material nothing has read yet', () => {
  it('test_UAT_AC1567_undescribed_material_is_listed_says_so_plainly_and_takes_a_correction', async () => {
    const { panel } = await library('alpha')

    // IT IS IN THE LIST LIKE ANY OTHER. Material that could not be described is
    // stored whole; withholding it from the Library would hide the very thing
    // the client needs to correct.
    expect(titlesIn(panel.element)).toContain('The old shopfront')

    const detail = await open(panel, 'material-3')

    // IN THE CLIENT'S OWN TERMS: nothing has read it, so it cannot be found by
    // what is in it, and here is the invitation to say what it is.
    const status = detail.querySelector('.builder-library__status')!
    expect(status.textContent).toMatch(/Nothing has read this yet/)
    expect(status.textContent).toMatch(/can't find it by what's in it/)
    expect(status.textContent).toMatch(/Tell me what it is/)
    // NOT AN ERROR, and not a fabricated description.
    expect(status.textContent).not.toMatch(/could not be loaded|failed|error/i)
    const form = detail.querySelector('.builder-library__description .fields')!
    expect(form.querySelector('.fields-row[data-field="body"]')!.textContent).not.toContain(
      'shopfront',
    )

    // THE INVITATION IS NOT A DEAD END: correcting from this state behaves
    // exactly as correcting a system-written one does — the same one editable
    // field, committed the same way.
    const editable = form.querySelector('.fields-row.is-editable[data-field="body"]')!
    ;(editable.querySelector('.fields-value-editable') as HTMLElement).click()
    const box = form.querySelector('textarea') as HTMLTextAreaElement
    expect(box).toBeTruthy()
    const CLIENT_TEXT = 'The old shopfront on Fettes Row, before the repaint.'
    box.value = CLIENT_TEXT
    box.dispatchEvent(new Event('change', { bubbles: true }))
    box.dispatchEvent(new Event('blur'))
    await settle()

    // STORED — asserted as the request the surface actually made, through
    // `api.js`'s real `saveMaterialDescription`, to the correction route. What
    // that route then does with it (credit the client, drop the material out of
    // the re-describe query) is AC-1565, proved against the real origin in the
    // workerd sibling.
    const written = origin.calls.filter((call) => call.path === '/api/material/description')
    expect(written).toHaveLength(1)
    expect(written[0].method).toBe('POST')
    expect(written[0].body).toEqual({ uid: 'material-3', body: CLIENT_TEXT })
    expect(origin.bodies['material-3']).toBe(CLIENT_TEXT)

    // …and the pane has left the "nothing has read this" state.
    expect(status.textContent).toBe('')
    expect(origin.rows.find((r) => r.uid === 'material-3')!.description_status).toBe('ok')
  })
})
