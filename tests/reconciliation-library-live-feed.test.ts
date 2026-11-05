// @vitest-environment jsdom
/**
 * Library (story-1500b111) — **the open tab is live**, as reconciled in BUNDLE-38
 * (REQ-201).
 *
 * WHAT THIS FILE PROVES: the TAB half of the change feed.
 *   - AC-1715 (extended): a business switch, driven through the header selector,
 *     closes the previous business's feed BEFORE the new list is asked for,
 *     opens a new one under the new scope from the cursor that read returned,
 *     and no event from the previous feed is applied afterwards — including when
 *     the re-read fails. Destroying the Library closes its feed.
 *   - AC-2324: a write made elsewhere reaches the open tab as one row entering
 *     (at the head), leaving, or redrawn in place, with the selection, the rail
 *     and the detail scroll undisturbed; a reset re-reads once and re-arms; a
 *     browser with no `EventSource` still lists and redraws after its own write.
 *   - AC-2326 (pane half): a row-visible field redraws from the event alone; a
 *     body event re-reads exactly the one open material, none other, and nothing
 *     while its description editor is open.
 *
 * The origin half (the SSE contract, scope, baseline tables, the event row's
 * equality with the list row) is `reconciliation-library-change-feed.workers.test.ts`.
 *
 * MOUNTED AGAINST THE INSTALLED COMPONENTS. The only double is the network: the
 * feed is a driver the test pushes into (jsdom has no `EventSource`), and for the
 * no-feed case `fetch` itself — the panel's own default transport is used.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createLibraryPanel: (opts?: Record<string, unknown>) => never
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Record<string, any>
let getBusinessScope: () => string | null

if (!WEBUI_INSTALLED) console.warn(`Library live-feed suite skipped: ${WEBUI_SKIP_REASON}`)

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

type Row = Record<string, unknown> & { uid: string; title: string }

function material(over: Partial<Row> & { uid: string; title: string }): Row {
  return {
    type: 'material',
    filename: `${over.uid}.png`,
    kind: 'image',
    role: 'site',
    rights: 'owned',
    republishable: true,
    exportable: false,
    origin: 'uploaded',
    placed_on: ['salon'],
    source_url: null,
    content_type: 'image/png',
    description_status: 'ok',
    description_model: 'stub/vision-1',
    updated_at: '2026-11-01T12:00:00.000Z',
    ...over,
  }
}

const WORDMARK = material({ uid: 'm-wordmark', title: 'The wordmark', updated_at: '2026-11-02T00:00:00.000Z' })
const GUIDE = material({
  uid: 'm-guide',
  title: 'Brand guidelines',
  filename: 'guide.md',
  kind: 'document',
  role: 'reference',
  placed_on: [],
  content_type: 'text/plain',
  updated_at: '2026-11-01T00:00:00.000Z',
})

type Feed = { business: string | null; since: number; closed: boolean; push: (c: unknown) => void }

/**
 * A transport whose feed is a driver. Records every list (and how many feeds
 * were open when it was asked), every item read, and every subscription with the
 * business scope it was raised under.
 */
function transportOver(rows: Row[], seq = 100) {
  const feeds: Feed[] = []
  const reads: string[] = []
  const lists: Array<{ business: string | null; openFeeds: number }> = []
  const bodies: Record<string, string> = { 'm-wordmark': 'The wordmark in gold.', 'm-guide': 'Tone of voice.' }
  return {
    feeds,
    reads,
    lists,
    bodies,
    get live() {
      return feeds.filter((f) => !f.closed)
    },
    list: async () => {
      lists.push({ business: getBusinessScope(), openFeeds: feeds.filter((f) => !f.closed).length })
      return { material: rows.map((r) => ({ ...r })), seq }
    },
    item: async (uid: string) => {
      reads.push(uid)
      return { ...(rows.find((r) => r.uid === uid) ?? {}), body: bodies[uid] ?? '', members: [] }
    },
    save: async (uid: string, body: string) => {
      bodies[uid] = body
      return { ...(rows.find((r) => r.uid === uid) ?? {}) }
    },
    fileUrl: (uid: string) => `/api/material/file?uid=${encodeURIComponent(uid)}`,
    subscribe: (since: number, onChange: (c: unknown) => void) => {
      const feed: Feed = { business: getBusinessScope(), since, closed: false, push: onChange }
      feeds.push(feed)
      return {
        close: () => {
          feed.closed = true
        },
      }
    },
  }
}

type Panel = {
  element: HTMLElement
  listDetail: { select: (k: string) => void; getSelectedKey: () => string | null; isListCollapsed: () => boolean }
  refresh: () => Promise<unknown>
  clear: () => void
  getRows: () => Row[]
  destroy: () => void
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ createLibraryPanel } = await import('../apps/control-app/src/builder/library.js'))
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    ;({ getBusinessScope } = await import('../apps/control-app/src/builder/api.js'))
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
const realFetch = globalThis.fetch
beforeEach(() => {
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})
afterEach(() => {
  globalThis.fetch = realFetch
})

async function library(transport: ReturnType<typeof transportOver> | Record<string, unknown>) {
  const panel = createLibraryPanel({ storage: memoryStorage(), transport }) as unknown as Panel
  root.append(panel.element)
  await panel.refresh()
  await settle()
  return panel
}

const rowsIn = (el: Element) => [...el.querySelectorAll('.list-detail-row')]
const keysIn = (el: Element) => rowsIn(el).map((r) => r.getAttribute('data-key'))
const titles = (el: Element) => rowsIn(el).map((r) => r.querySelector('.builder-library__row-title')?.textContent)
const rowEl = (el: Element, key: string) => el.querySelector(`.list-detail-row[data-key="${key}"]`)

const update = (row: Row, over: Record<string, unknown> = {}) => ({
  seq: 101,
  kind: 'update',
  cause: 'update',
  uid: row.uid,
  row,
  body_changed: false,
  ...over,
})

// ── AC-1715: the business switch closes the feed before the re-read ──────────

describe.skipIf(!WEBUI_INSTALLED)('AC-1715 — a business switch closes the feed, then re-reads, then reopens', () => {
  it('test_UAT_AC1715_business_switch_closes_the_feed_before_the_re_read_and_reopens_under_the_new_scope', async () => {
    const MATERIAL_OF: Record<string, Row[]> = {
      acct_salon: [material({ uid: 'salon-1', title: 'Salon awning' })],
      acct_studio: [material({ uid: 'studio-1', title: 'Studio reel' })],
    }
    const SEQ_OF: Record<string, number> = { acct_salon: 40, acct_studio: 70 }
    let failNext = false
    const feeds: Feed[] = []
    const lists: Array<{ business: string | null; openFeeds: number }> = []
    const app = mountBuilder(root, {
      businesses: [
        { id: 'acct_salon', name: 'Salon', selectable: true },
        { id: 'acct_studio', name: 'Studio', selectable: true },
      ],
      account: { name: 'Sam', email: 'sam@example.test' },
      storage: memoryStorage(),
      loadSites: async (id: string | null) => [{ slug: `${id ?? 'acct_salon'}-site`, latest: 1 }],
      chatTransport: {
        openSession: async () => ({ sessionId: 's', turns: [], ready: true }),
        streamPrompt: async function* () {
          yield { kind: 'done' }
        },
      },
      libraryTransport: {
        list: async () => {
          const business = getBusinessScope()
          lists.push({ business, openFeeds: feeds.filter((f) => !f.closed).length })
          if (failNext) throw new Error('the network went away')
          return { material: (MATERIAL_OF[business ?? ''] ?? []).map((r) => ({ ...r })), seq: SEQ_OF[business ?? ''] }
        },
        item: async () => ({ body: '', members: [] }),
        save: async () => ({}),
        fileUrl: (uid: string) => `/api/material/file?uid=${uid}`,
        subscribe: (since: number, onChange: (c: unknown) => void) => {
          const feed: Feed = { business: getBusinessScope(), since, closed: false, push: onChange }
          feeds.push(feed)
          return { close: () => void (feed.closed = true) }
        },
      },
    })
    await settleAll()
    expect(keysIn(app.library.element)).toEqual(['salon-1'])
    expect(feeds.filter((f) => !f.closed)).toHaveLength(1)
    const salonFeed = feeds.find((f) => !f.closed)!
    expect(salonFeed.business).toBe('acct_salon')
    expect(salonFeed.since).toBe(40)

    // SWITCH through the header selector.
    const select = root.querySelector('.builder-business__select') as HTMLSelectElement
    select.value = 'acct_studio'
    select.dispatchEvent(new Event('change'))
    await settleAll()

    // The previous feed is closed, and it was closed BEFORE the studio list was asked for.
    expect(salonFeed.closed).toBe(true)
    const studioList = lists.filter((l) => l.business === 'acct_studio')
    expect(studioList.length).toBeGreaterThan(0)
    for (const l of studioList) expect(l.openFeeds).toBe(0)
    // A new feed is open under the new scope, from the cursor ITS read returned.
    const open = feeds.filter((f) => !f.closed)
    expect(open).toHaveLength(1)
    expect(open[0].business).toBe('acct_studio')
    expect(open[0].since).toBe(70)
    expect(keysIn(app.library.element)).toEqual(['studio-1'])

    // AN EVENT FROM THE PREVIOUS BUSINESS'S FEED IS NOT APPLIED after the switch.
    salonFeed.push({
      seq: 41,
      kind: 'enter',
      cause: 'create',
      uid: 'salon-late',
      row: material({ uid: 'salon-late', title: 'Late salon photo' }),
      body_changed: false,
    })
    salonFeed.push(update(MATERIAL_OF.acct_salon[0], { kind: 'enter' }))
    await settleAll()
    expect(keysIn(app.library.element)).toEqual(['studio-1'])
    expect(app.library.element.textContent).not.toContain('Late salon photo')
    expect(app.library.element.textContent).not.toContain('Salon awning')

    // A FAILED RE-READ: no previous row, and no feed left open on the previous business.
    const studioFeed = open[0]
    failNext = true
    select.value = 'acct_salon'
    select.dispatchEvent(new Event('change'))
    await settleAll()
    expect(studioFeed.closed).toBe(true)
    expect(feeds.filter((f) => !f.closed)).toHaveLength(0)
    expect(rowsIn(app.library.element)).toHaveLength(0)
    studioFeed.push({
      seq: 71,
      kind: 'enter',
      cause: 'create',
      uid: 'studio-late',
      row: material({ uid: 'studio-late', title: 'Late studio still' }),
      body_changed: false,
    })
    await settleAll()
    expect(rowsIn(app.library.element)).toHaveLength(0)

    // DESTROYING THE LIBRARY CLOSES ITS FEED.
    failNext = false
    select.value = 'acct_studio'
    select.dispatchEvent(new Event('change'))
    await settleAll()
    const last = feeds.filter((f) => !f.closed)
    expect(last).toHaveLength(1)
    app.library.destroy()
    expect(last[0].closed).toBe(true)
  })
})

// ── AC-2324: a write made elsewhere reaches the open tab, one row at a time ──

describe.skipIf(!WEBUI_INSTALLED)('AC-2324 — a write elsewhere appears without a reload, disturbing nothing else', () => {
  it('test_UAT_AC2324_an_outside_write_enters_leaves_or_redraws_one_row_preserving_selection_rail_and_scroll', async () => {
    const transport = transportOver([WORDMARK, GUIDE])
    const panel = await library(transport)
    expect(transport.live).toHaveLength(1)
    const listsAtStart = transport.lists.length

    // Select one, collapse the list to its rail, scroll the detail.
    panel.listDetail.select('m-guide')
    await settleAll()
    const collapse = panel.element.querySelector('.list-detail-list-collapse') as HTMLElement | null
    expect(collapse, 'the list-detail component offers a collapse control').toBeTruthy()
    collapse!.click()
    await settle()
    expect(panel.listDetail.isListCollapsed()).toBe(true)
    const rail = () => panel.listDetail.isListCollapsed()
    const detail = panel.element.querySelector('.builder-library__detail')
    const scroller = panel.element.querySelector('.list-detail-detail') as HTMLElement
    expect(scroller).toBeTruthy()
    scroller.scrollTop = 40
    const untouchedRow = rowEl(panel.element, 'm-guide')

    // AN UPDATE TO THE OTHER MATERIAL: only its row redraws.
    transport.live[0].push(update({ ...WORDMARK, title: 'The wordmark, described' }))
    await settleAll()
    expect(titles(panel.element)).toEqual(['The wordmark, described', 'Brand guidelines'])
    expect(transport.lists.length).toBe(listsAtStart)
    expect(panel.listDetail.getSelectedKey()).toBe('m-guide')
    expect(rail()).toBe(true)
    expect(panel.element.querySelector('.builder-library__detail')).toBe(detail)
    expect(scroller.scrollTop).toBe(40)
    expect(rowEl(panel.element, 'm-guide')!.textContent).toBe(untouchedRow!.textContent)

    // ENTER: a material created elsewhere appears AT THE HEAD.
    transport.live[0].push({
      seq: 102,
      kind: 'enter',
      cause: 'create',
      uid: 'm-new',
      row: material({ uid: 'm-new', title: 'A shopfront photo', updated_at: '2026-11-05T00:00:00.000Z' }),
      body_changed: false,
    })
    await settleAll()
    expect(keysIn(panel.element)).toEqual(['m-new', 'm-wordmark', 'm-guide'])
    expect(panel.listDetail.getSelectedKey()).toBe('m-guide')

    // EXIT: a material archived elsewhere leaves.
    transport.live[0].push({ seq: 103, kind: 'exit', cause: 'archive', uid: 'm-wordmark', row: null, body_changed: false })
    await settleAll()
    expect(keysIn(panel.element)).toEqual(['m-new', 'm-guide'])
    expect(panel.listDetail.getSelectedKey()).toBe('m-guide')
    expect(rail()).toBe(true)
    expect(transport.lists.length).toBe(listsAtStart)

    // A CHANGE FOR A FILTERED-OUT MATERIAL does not disturb the visible rows.
    const kind = panel.element.querySelector('.builder-library__kind') as HTMLSelectElement
    kind.value = 'document'
    kind.dispatchEvent(new Event('change'))
    await settle()
    expect(keysIn(panel.element)).toEqual(['m-guide'])
    transport.live[0].push(update(material({ uid: 'm-new', title: 'A shopfront, retitled' })))
    await settleAll()
    expect(keysIn(panel.element)).toEqual(['m-guide'])
    kind.value = ''
    kind.dispatchEvent(new Event('change'))
    await settle()

    // RESET: one full re-read, then a new subscription at the cursor it returned.
    const before = transport.live[0]
    transport.live[0].push({ kind: 'reset', seq: 900 })
    await settleAll()
    expect(transport.lists.length).toBe(listsAtStart + 1)
    expect(before.closed).toBe(true)
    expect(transport.live).toHaveLength(1)
    expect(transport.live[0].since).toBe(100)
    expect(keysIn(panel.element).sort()).toEqual(['m-guide', 'm-wordmark'])
  })

  it('test_UAT_AC2324_a_browser_without_eventsource_still_lists_and_redraws_after_its_own_write', async () => {
    // THE PANEL'S OWN DEFAULT TRANSPORT, over a stubbed network, in a document
    // with no `EventSource` — the degraded path a real browser would take.
    expect((globalThis as { EventSource?: unknown }).EventSource).toBeUndefined()
    const requests: string[] = []
    let status = 'no_describer'
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      requests.push(`${init?.method ?? 'GET'} ${url}`)
      const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } })
      const row = () => ({ ...GUIDE, description_status: status })
      if (url.includes('/api/material/item')) return json({ ...row(), body: status === 'ok' ? 'Our tone of voice.' : '', members: [] })
      if (url.includes('/api/material/description')) {
        status = 'ok'
        return json(row())
      }
      if (url.includes('/api/material')) return json({ material: [row()], seq: 5 })
      return new Response('not found', { status: 404 })
    }) as typeof fetch

    const panel = createLibraryPanel({ storage: memoryStorage() }) as unknown as Panel
    root.append(panel.element)
    await panel.refresh()
    await settleAll()
    expect(keysIn(panel.element)).toEqual(['m-guide'])
    expect(panel.getRows()[0].description_status).toBe('no_describer')

    // ITS OWN WRITE: commit a description the way a client does.
    panel.listDetail.select('m-guide')
    await settleAll()
    const cell = panel.element.querySelector('.builder-library__description .fields-value-editable') as HTMLElement
    expect(cell).toBeTruthy()
    cell.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await settle()
    const control = panel.element.querySelector('.builder-library__description textarea') as HTMLTextAreaElement
    expect(control).toBeTruthy()
    control.value = 'Our tone of voice.'
    control.dispatchEvent(new Event('input', { bubbles: true }))
    control.dispatchEvent(new Event('change', { bubbles: true }))
    control.dispatchEvent(new Event('blur'))
    await settleAll()

    expect(requests.some((r) => r.startsWith('POST') && r.includes('/api/material/description'))).toBe(true)
    // REDRAWN from what the write returned, with no feed in sight.
    expect(panel.getRows()[0].description_status).toBe('ok')
    expect(panel.element.querySelector('.builder-library__description')!.textContent).toContain('Our tone of voice.')
    expect(requests.some((r) => r.includes('/api/material/changes'))).toBe(false)
  })
})

// ── AC-2326 (pane half): what an event costs the pane ────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('AC-2326 — a row redraws from the event; the body is re-read only for the open, unedited detail', () => {
  it('test_UAT_AC2326_row_redraws_from_the_event_and_only_the_open_unedited_detail_re_reads_its_description', async () => {
    const transport = transportOver([WORDMARK, GUIDE])
    const panel = await library(transport)
    const listsAtStart = transport.lists.length

    // A ROW-VISIBLE FIELD redraws from the event alone: the site asset loses its
    // placement and gains the warning, with no request made.
    expect(rowEl(panel.element, 'm-wordmark')!.querySelector('.builder-library__badge--unplaced')).toBeNull()
    const readsBefore = transport.reads.length
    transport.live[0].push(update({ ...WORDMARK, placed_on: [], description_status: 'failed' }))
    await settleAll()
    expect(rowEl(panel.element, 'm-wordmark')!.querySelector('.builder-library__badge--unplaced')).toBeTruthy()
    expect(panel.getRows().find((r) => r.uid === 'm-wordmark')!.description_status).toBe('failed')
    expect(transport.reads.length).toBe(readsBefore)
    expect(transport.lists.length).toBe(listsAtStart)

    // OPEN A DETAIL; its description is written elsewhere: exactly one item read.
    panel.listDetail.select('m-guide')
    await settleAll()
    const afterOpen = transport.reads.length
    transport.bodies['m-guide'] = 'Rewritten by the re-describe pass.'
    transport.live[0].push(update(GUIDE, { body_changed: true }))
    await settleAll()
    expect(transport.reads.slice(afterOpen)).toEqual(['m-guide'])
    expect(panel.element.querySelector('.builder-library__description')!.textContent).toContain(
      'Rewritten by the re-describe pass.',
    )

    // ANOTHER MATERIAL'S DESCRIPTION: no read.
    const afterOwn = transport.reads.length
    transport.live[0].push(update(WORDMARK, { body_changed: true }))
    await settleAll()
    expect(transport.reads.length).toBe(afterOwn)

    // EDIT MODE: no read, and the typed text stays exactly as typed.
    const cell = panel.element.querySelector('.builder-library__description .fields-value-editable') as HTMLElement
    expect(cell).toBeTruthy()
    cell.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await settle()
    const editing = panel.element.querySelector('.builder-library__description textarea') as HTMLTextAreaElement
    expect(editing).toBeTruthy()
    editing.value = 'Actually, our house style.'
    editing.dispatchEvent(new Event('input', { bubbles: true }))
    await settle()
    const beforeEdit = transport.reads.length
    transport.bodies['m-guide'] = 'Overwritten again by the pass.'
    transport.live[0].push(update(GUIDE, { body_changed: true }))
    await settleAll()
    expect(transport.reads.length).toBe(beforeEdit)
    expect(editing.value).toBe('Actually, our house style.')
    expect(panel.element.querySelector('.builder-library__description')!.textContent).not.toContain(
      'Overwritten again by the pass.',
    )
  })
})
