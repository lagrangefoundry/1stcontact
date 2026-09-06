// @vitest-environment jsdom
/**
 * REQ-201 — **the Library tab, subscribed rather than refreshed**.
 *
 * WHAT THIS FILE PROVES, and what its workerd sibling proves instead.
 * `…_material_changes.workers.test.ts` is the ORIGIN CONTRACT — that a write
 * nobody made on this connection produces an event, that the cursor is honest
 * enough to reconnect on, and that a feed raised under one business cannot see
 * another's. This one is the TAB: that an event redraws the row it names and
 * disturbs nothing else.
 *
 * THE CLAIM THAT MATTERS MOST IS THE ONE ABOUT WHAT *DOES NOT* HAPPEN. A
 * subscription is easy to build and easy to build wrongly, and the wrong version
 * is indistinguishable from the right one until somebody is halfway through
 * reading a document: it re-reads the whole list on every event, throws away the
 * selection, collapses the rail, and scrolls the detail back to the top. So the
 * cases below assert the survival of the selection, the rail and the scroll at
 * least as hard as they assert that the row changed.
 *
 * MOUNTED AGAINST THE ACTUALLY-INSTALLED COMPONENTS, on the pattern REQ-161
 * established: the selection and the collapse state are `list-detail`'s own, and
 * a mocked component would assert the mock rather than that they survived.
 *
 * THE ONLY DOUBLE IS THE FEED, because it is the network. `transport.subscribe`
 * is handed a driver the test pushes events into, which is the same seam
 * `transport.list` already occupies — jsdom has no `EventSource`, and a suite
 * that polyfilled one would be asserting the polyfill.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createLibraryPanel: (opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`REQ-201 library suite skipped: ${WEBUI_SKIP_REASON}`)

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

type Row = Record<string, unknown> & { uid: string; title: string; kind: string; role: string }

/** The business's material, as `/api/material` answers it. */
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
    placed_on: ['alpha'],
    source_url: null,
    content_type: 'image/svg+xml',
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
    content_type: 'application/pdf',
    description_status: 'ok',
    description_model: 'unpdf',
    updated_at: '2026-08-31T11:00:00.000Z',
  },
]

/**
 * A material the AI has not described yet — the row this ticket is about.
 *
 * It is what the tab shows the second after an upload returns: a row with no
 * description, waiting for a write it will never hear about unless it is
 * subscribed.
 */
const UNDESCRIBED: Row = {
  ...MATERIAL[0],
  uid: 'material-new',
  title: 'A photo of the shopfront',
  filename: 'shopfront.jpg',
  description_status: 'no_describer',
  description_model: null,
  updated_at: '2026-09-06T09:00:00.000Z',
}

/**
 * The transport, with the change feed as a driver the test pushes into.
 *
 * `opened` RECORDS EVERY SUBSCRIPTION AND ITS CURSOR, which is how the
 * business-switch and re-arm claims are made: what matters there is not only
 * that a feed exists but that the previous one was CLOSED and the next one
 * opened at the right position.
 */
function transportOver(rows: Row[] = MATERIAL, seq = 100) {
  const opened: Array<{ since: number; closed: boolean; push: (change: unknown) => void }> = []
  const reads: string[] = []
  let lists = 0
  const bodies: Record<string, string> = {
    'material-1': 'The wordmark in gold on cream.',
    'material-2': 'Positioning, tone of voice, and the colour system.',
    'material-new': '',
  }
  return {
    opened,
    reads,
    bodies,
    get lists() {
      return lists
    },
    /** The live feed, or undefined before anything subscribed. */
    get feed() {
      return opened.find((o) => !o.closed)
    },
    list: async () => {
      lists += 1
      return { material: rows.map((row) => ({ ...row })), seq }
    },
    item: async (uid: string) => {
      reads.push(uid)
      return { ...(rows.find((row) => row.uid === uid) ?? UNDESCRIBED), body: bodies[uid] ?? '' }
    },
    save: async (uid: string, body: string) => {
      bodies[uid] = body
      return { ...(rows.find((row) => row.uid === uid) ?? UNDESCRIBED), description_status: 'ok' }
    },
    fileUrl: (uid: string) => `/api/material/file?uid=${encodeURIComponent(uid)}`,
    subscribe: (since: number, onChange: (change: unknown) => void) => {
      const handle = { since, closed: false, push: onChange }
      opened.push(handle)
      return {
        close: () => {
          handle.closed = true
        },
      }
    },
  }
}

/** An `update` event for one material, as the origin projects it. */
function update(row: Row, over: Record<string, unknown> = {}): Record<string, unknown> {
  return { seq: 101, kind: 'update', cause: 'update', uid: row.uid, row, body_changed: false, ...over }
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
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

/** A mounted Library over the fixture, already loaded and already subscribed. */
async function library(transport = transportOver()) {
  const panel = createLibraryPanel({ storage: memoryStorage(), transport }) as unknown as {
    element: HTMLElement
    listDetail: {
      select: (key: string) => void
      getSelectedKey: () => string | null
      getRows?: () => unknown
    }
    refresh: () => Promise<unknown>
    clear: () => void
    getRows: () => Row[]
    destroy: () => void
  }
  root.append(panel.element)
  await panel.refresh()
  await settle()
  return { panel, transport }
}

const rowsIn = (el: Element) => [...el.querySelectorAll('.list-detail-row')]
const titles = (el: Element) =>
  rowsIn(el).map((row) => row.querySelector('.builder-library__row-title')?.textContent)

describe.skipIf(!WEBUI_INSTALLED)('REQ-201 — the tab subscribes on mount', () => {
  it('test_UAT_FC_REQ-201_it_subscribes_from_the_cursor_the_list_read_returned', async () => {
    // NOT FROM "NOW", AND THE DIFFERENCE IS A LOST EVENT. The origin reads the
    // change head BEFORE it lists, so opening at that cursor is what makes a
    // write landing between the load and the subscription arrive twice rather
    // than never — and applying it twice is idempotent.
    const { transport } = await library()
    expect(transport.opened).toHaveLength(1)
    expect(transport.opened[0].since).toBe(100)
    expect(transport.opened[0].closed).toBe(false)
  })

  it('test_UAT_FC_REQ-201_a_tab_whose_transport_offers_no_feed_still_works', async () => {
    // THE DEGRADED PATH IS THE OLD BEHAVIOUR, NOT A BROKEN TAB. A browser with
    // no `EventSource` — and a suite injecting a transport to assert something
    // else entirely — gets the Library that redraws when it wrote, which is
    // exactly what this tab did before REQ-201.
    const bare = transportOver()
    const { subscribe: _dropped, ...withoutFeed } = bare
    const panel = createLibraryPanel({
      storage: memoryStorage(),
      transport: withoutFeed,
    }) as unknown as { element: HTMLElement; refresh: () => Promise<unknown> }
    root.append(panel.element)
    await panel.refresh()
    await settle()
    expect(rowsIn(panel.element)).toHaveLength(2)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-201 — events reach the existing render path', () => {
  it('test_UAT_FC_REQ-201_a_description_written_after_the_upload_reaches_an_open_tab', async () => {
    // THE CASE THE TAB CANNOT HANDLE TODAY. The row was already on screen with
    // nothing written about it; the AI writes seconds later, from somewhere that
    // is not this panel, and the detail has to show it with no operator action
    // and no full re-read.
    const transport = transportOver([...MATERIAL, UNDESCRIBED])
    const { panel } = await library(transport)
    panel.listDetail.select('material-new')
    await settle()

    const listsBefore = transport.lists
    const pane = panel.element.querySelector('.builder-library__description')!
    expect(pane.textContent).not.toContain('A shopfront in morning light')

    // The description lands. `body_changed` is the SIGNAL — the change log
    // carries a body as presence and never as content — so the pane re-reads.
    transport.bodies['material-new'] = 'A shopfront in morning light.'
    transport.feed!.push(
      update({ ...UNDESCRIBED, description_status: 'ok' }, { body_changed: true }),
    )
    await settle()
    await settle()

    expect(pane.textContent).toContain('A shopfront in morning light.')
    // NO FULL RE-READ. The list was not re-fetched to make this happen — one
    // item was, and only the one that was open.
    expect(transport.lists).toBe(listsBefore)
    expect(transport.reads.filter((uid) => uid === 'material-new').length).toBeGreaterThan(0)
  })

  it('test_UAT_FC_REQ-201_a_material_created_outside_this_panel_appears_in_the_list', async () => {
    const transport = transportOver()
    const { panel } = await library(transport)
    expect(titles(panel.element)).toHaveLength(2)

    transport.feed!.push({
      seq: 101,
      kind: 'enter',
      cause: 'create',
      uid: 'material-new',
      row: UNDESCRIBED,
      body_changed: false,
    })
    await settle()

    expect(titles(panel.element)).toContain('A photo of the shopfront')
    expect(rowsIn(panel.element)).toHaveLength(3)
  })

  it('test_UAT_FC_REQ-201_a_material_archived_elsewhere_is_removed_from_the_list', async () => {
    // BEHAVIOUR THE TAB HAS NO CURRENT PATH TO LEARN: nothing in the Library
    // archives material, so before the feed this row stayed on screen for ever.
    const transport = transportOver()
    const { panel } = await library(transport)

    transport.feed!.push({
      seq: 102,
      kind: 'exit',
      cause: 'archive',
      uid: 'material-2',
      row: null,
      body_changed: false,
    })
    await settle()

    expect(titles(panel.element)).toEqual(['The wordmark'])
  })

  it('test_UAT_FC_REQ-201_an_update_patches_the_row_in_place_rather_than_rebuilding_the_list', async () => {
    const transport = transportOver()
    const { panel } = await library(transport)
    const listsBefore = transport.lists

    transport.feed!.push(update({ ...MATERIAL[1], title: 'Brand guidelines, v2' } as Row))
    await settle()

    expect(titles(panel.element)).toEqual(['The wordmark', 'Brand guidelines, v2'])
    // PATCHED, NOT RE-READ. A re-read here would be the "refresh on any event"
    // design this ticket exists to avoid, and it is indistinguishable from the
    // right one until somebody has a selection to lose.
    expect(transport.lists).toBe(listsBefore)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-201 — an event for one material disturbs nothing else', () => {
  it('test_UAT_FC_REQ-201_the_selection_and_the_detail_survive_an_event_for_another_material', async () => {
    // THE CLAIM ABOUT WHAT DOES NOT HAPPEN. A subscription that re-read the list
    // on every event would pass every case above and fail this one — and this is
    // the one an operator notices, halfway through reading a document.
    const transport = transportOver()
    const { panel } = await library(transport)
    panel.listDetail.select('material-2')
    await settle()
    expect(panel.listDetail.getSelectedKey()).toBe('material-2')

    const detailBefore = panel.element.querySelector('.builder-library__detail')
    const scroller = panel.element.querySelector('.webui-scroll, .list-detail-detail')
    if (scroller) scroller.scrollTop = 40

    transport.feed!.push(update({ ...MATERIAL[0], title: 'The wordmark, redrawn' } as Row))
    await settle()

    expect(panel.listDetail.getSelectedKey()).toBe('material-2')
    // THE SAME ELEMENT, not an equal one: a detail rebuilt would have reset the
    // scroll and destroyed the reader inside it even if it looked identical.
    expect(panel.element.querySelector('.builder-library__detail')).toBe(detailBefore)
    if (scroller) expect(scroller.scrollTop).toBe(40)
    // And the other row did change, so this is not the absence of an event.
    expect(titles(panel.element)).toContain('The wordmark, redrawn')
  })

  it('test_UAT_FC_REQ-201_an_event_for_a_filtered_out_material_does_not_disturb_the_visible_list', async () => {
    const transport = transportOver()
    const { panel } = await library(transport)
    const kind = panel.element.querySelector('.builder-library__kind') as HTMLSelectElement
    kind.value = 'image'
    kind.dispatchEvent(new Event('change'))
    await settle()
    expect(titles(panel.element)).toEqual(['The wordmark'])

    // A document changes. It is excluded by the active filter, so the visible
    // list must not move.
    transport.feed!.push(update({ ...MATERIAL[1], title: 'Brand guidelines, v2' } as Row))
    await settle()
    expect(titles(panel.element)).toEqual(['The wordmark'])

    // BUT IT WAS APPLIED, not discarded. Filtering on the way IN would make what
    // the client sees depend on which filter happened to be set when the event
    // arrived — so clearing the box reveals the NEW title, not a stale one.
    kind.value = ''
    kind.dispatchEvent(new Event('change'))
    await settle()
    expect(titles(panel.element)).toContain('Brand guidelines, v2')
  })

  it('test_UAT_FC_REQ-201_a_body_event_for_a_material_nobody_has_open_costs_no_read', async () => {
    const transport = transportOver()
    const { panel } = await library(transport)
    panel.listDetail.select('material-1')
    await settle()
    const readsBefore = transport.reads.length

    transport.feed!.push(update(MATERIAL[1], { body_changed: true }))
    await settle()

    // THE RE-READ IS FOR THE ONE MATERIAL SOMEBODY IS LOOKING AT. Every other
    // body change costs nothing, which is what keeps "re-read on a body event"
    // from becoming a request per event.
    expect(transport.reads).toHaveLength(readsBefore)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-201 — the scope moving is still a clear and a re-read', () => {
  it('test_UAT_FC_REQ-201_a_business_switch_closes_the_old_feed_and_opens_one_under_the_new_scope', async () => {
    const transport = transportOver()
    const { panel } = await library(transport)
    const first = transport.opened[0]

    // What the host does on a switch, in the order it does it.
    panel.clear()
    await panel.refresh()
    await settle()

    expect(first.closed).toBe(true)
    expect(transport.opened).toHaveLength(2)
    expect(transport.opened[1].closed).toBe(false)
  })

  it('test_UAT_FC_REQ-201_no_event_from_the_previous_business_is_applied_after_the_switch', async () => {
    // THE LEAK THIS GUARDS. A frame already in flight when the switch happened
    // would otherwise splice the PREVIOUS business's material into a list whose
    // header names this one — which is the outcome REQ-181 says a failure here
    // may not produce, arriving through a new door.
    const transport = transportOver()
    const { panel } = await library(transport)
    const stale = transport.opened[0]

    panel.clear()
    await panel.refresh()
    await settle()

    stale.push({
      seq: 999,
      kind: 'enter',
      cause: 'create',
      uid: 'material-from-another-business',
      row: { ...UNDESCRIBED, uid: 'material-from-another-business', title: 'Not ours' },
      body_changed: false,
    })
    await settle()

    expect(titles(panel.element)).not.toContain('Not ours')
    expect(panel.getRows().map((row) => row.uid)).not.toContain('material-from-another-business')
  })

  it('test_UAT_FC_REQ-201_clearing_closes_the_feed_even_when_the_re_read_never_comes', async () => {
    // `clear` IS CALLED BEFORE THE RE-READ AND THE RE-READ MAY FAIL. If the feed
    // were closed by `refresh` alone, a failed switch would leave the previous
    // business's subscription running under a header naming the new one.
    const transport = transportOver()
    const { panel } = await library(transport)
    panel.clear()
    expect(transport.opened[0].closed).toBe(true)
    expect(transport.feed).toBeUndefined()
  })

  it('test_UAT_FC_REQ-201_destroying_the_panel_closes_the_feed', async () => {
    const transport = transportOver()
    const { panel } = await library(transport)
    panel.destroy()
    expect(transport.opened[0].closed).toBe(true)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-201 — a reset falls back to the full re-read', () => {
  it('test_UAT_FC_REQ-201_a_reset_frame_re_reads_the_list_and_re_arms_the_feed', async () => {
    // THE CURSOR FELL BELOW THE RETENTION FLOOR (DOC-24 §6.4). A partial history
    // is worse than none, because the consumer cannot tell it from a complete
    // one — so the honest recovery is the one this panel already has.
    const transport = transportOver()
    const { panel } = await library(transport)
    const listsBefore = transport.lists
    const first = transport.opened[0]

    transport.feed!.push({ kind: 'reset', seq: 500 })
    await settle()
    await settle()

    expect(transport.lists).toBe(listsBefore + 1)
    expect(first.closed).toBe(true)
    // RE-ARMED, not merely redrawn: after a reset what is on screen and what the
    // feed will deliver have to describe the same moment again.
    expect(transport.feed).toBeDefined()
    expect(rowsIn(panel.element)).toHaveLength(2)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-201 — a live edit is never overwritten by an event', () => {
  it('test_UAT_FC_REQ-201_a_background_re_describe_does_not_delete_what_the_operator_is_typing', async () => {
    // THE COST OF RE-READING AT ALL, PAID FOR EXPLICITLY. The re-describe pass
    // writes while the client is mid-correction; blindly repainting would delete
    // their sentence and replace it with ours. Losing what somebody typed is a
    // worse failure than showing a description one save behind.
    const transport = transportOver()
    const { panel } = await library(transport)
    panel.listDetail.select('material-1')
    await settle()

    // OPEN THE EDITOR THE WAY A CLIENT DOES — the component's own read cell is
    // the button, and clicking it is what `mountFields` turns into a textarea.
    const cell = panel.element.querySelector(
      '.builder-library__description .fields-value-editable',
    ) as HTMLElement
    expect(cell).toBeTruthy()
    cell.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await settle()

    const editing = panel.element.querySelector(
      '.builder-library__description textarea',
    ) as HTMLTextAreaElement
    // ASSERTED, NOT BRANCHED ON. A version of this case that tolerated the
    // editor failing to open would pass without ever exercising the guard it
    // exists to prove.
    expect(editing).toBeTruthy()
    editing.value = 'It is actually the shopfront, not the wordmark.'
    editing.dispatchEvent(new Event('input', { bubbles: true }))
    await settle()

    transport.bodies['material-1'] = 'Rewritten by the re-describe pass.'
    transport.feed!.push(update(MATERIAL[0], { body_changed: true }))
    await settle()
    await settle()

    // Their words are still there, and ours did not replace them.
    expect(editing.value).toBe('It is actually the shopfront, not the wordmark.')
    expect(panel.element.querySelector('.builder-library__description')!.textContent).not.toContain(
      'Rewritten by the re-describe pass.',
    )
    // AND NO READ WAS SPENT ON IT EITHER. The guard is checked before the
    // request, so a dirty field costs nothing rather than costing a round trip
    // whose answer is discarded.
    expect(transport.reads.filter((uid) => uid === 'material-1')).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-201_a_description_landing_on_an_untouched_detail_is_painted', async () => {
    // THE OTHER HALF OF THE SAME RULE. Nothing is being typed, so the re-read is
    // exactly the right thing and the new description lands — which is what
    // stops the guard above from being an excuse never to repaint.
    const transport = transportOver()
    const { panel } = await library(transport)
    panel.listDetail.select('material-1')
    await settle()

    transport.bodies['material-1'] = 'Rewritten by the re-describe pass.'
    transport.feed!.push(update(MATERIAL[0], { body_changed: true }))
    await settle()
    await settle()

    expect(panel.element.querySelector('.builder-library__description')!.textContent).toContain(
      'Rewritten by the re-describe pass.',
    )
  })
})