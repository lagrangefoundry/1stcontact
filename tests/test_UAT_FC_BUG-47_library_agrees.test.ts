// @vitest-environment jsdom
/**
 * BUG-47 — **the surface reads placement, never upload context**.
 *
 * WHAT THIS FILE PROVES, and what its sibling proves instead. The origin half —
 * that `placed_on` is written by the promotion and only where the bytes landed —
 * is `test_UAT_FC_BUG-47_placement.workers.test.ts`. This is the surface: that
 * what the pane says about a material is decided by where the BYTES went, not by
 * which site happened to be open when the file was dropped.
 *
 * THE BUG WAS THAT UPLOAD CONTEXT WAS READ AS PLACEMENT. A note dropped on *"just
 * for you to read"* was sent with the open site's slug, stored it as `site_slug`,
 * and came back claiming to be on the site its own hint had promised seconds
 * earlier it would stay off.
 *
 * TWO READERS NOW, NOT THREE ([[REQ-181]]). The `On this site` pill and the
 * `Used on this site` checkbox are gone — under one site per business they said
 * nothing — so what remains is the `Placed on` row in the rights record and the
 * warning that fires when a site asset was never placed. Both still read this one
 * field and still cannot disagree with each other.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createLibraryPanel: (opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`BUG-47 library suite skipped: ${WEBUI_SKIP_REASON}`)

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

function material(over: Record<string, unknown>): Record<string, unknown> {
  return {
    type: 'material',
    kind: 'image',
    role: 'site',
    rights: 'owned',
    republishable: true,
    exportable: false,
    origin: 'uploaded',
    placed_on: [],
    source_url: null,
    description_status: 'ok',
    description_model: 'stub/vision-1',
    updated_at: '2026-09-02T12:00:00.000Z',
    ...over,
  }
}

/**
 * Four rows, one per case the ticket names.
 *
 * THE SECOND ROW IS THE BUG. It was uploaded while `alpha` was open — so the
 * overlay sent `alpha` with it — and dropped on *"just for you to read"*. Under
 * the old field it carried `site_slug: 'alpha'` and was reported as being on the
 * site the client had just been promised it would stay off.
 *
 * THE FOURTH IS KEPT THOUGH V1 CANNOT PRODUCE IT. `placed_on` is a list because
 * the store's multiplicity outlives the one-site-per-business invariant
 * ([[REQ-181]]), and a fixture that only ever held one slug could not tell a
 * rendered list from a rendered scalar.
 */
const MATERIAL = [
  material({
    uid: 'placed-here',
    title: 'The wordmark',
    filename: 'wordmark.svg',
    placed_on: ['alpha'],
  }),
  material({
    uid: 'kept-for-reading',
    title: 'Positioning note',
    filename: 'positioning.md',
    kind: 'document',
    role: 'reference',
    republishable: false,
    placed_on: [],
  }),
  material({
    uid: 'promotion-failed',
    title: 'The old shopfront',
    filename: 'shopfront.jpg',
    // "Put it on the site", and the promotion did not land. Promotion fails
    // softly and keeps the material, so the row exists — unplaced.
    placed_on: [],
  }),
  material({
    uid: 'on-both-sites',
    title: 'The logo',
    filename: 'logo.svg',
    placed_on: ['alpha', 'beta'],
  }),
]

function transportOver(rows = MATERIAL) {
  return {
    list: async () => ({ material: rows.map((row) => ({ ...row })) }),
    item: async (uid: string) => ({ ...rows.find((row) => row.uid === uid)!, body: 'About it.' }),
    save: async (uid: string, body: string) => ({
      ...rows.find((row) => row.uid === uid)!,
      body,
    }),
    fileUrl: (uid: string) => `/api/material/file?uid=${encodeURIComponent(uid)}`,
  }
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

/** A mounted Library over the fixture. */
async function library() {
  const panel = createLibraryPanel({
    storage: memoryStorage(),
    transport: transportOver(),
  })
  root.append(panel.element)
  await panel.refresh()
  return { panel }
}

const rowsIn = (el: Element) => [...el.querySelectorAll('.list-detail-row')]
const titles = (el: Element) => rowsIn(el).map((r) => r.textContent)

/** The rows carrying the "never got there" warning ([[REQ-181]]). */
function warned(el: Element): string[] {
  return [...el.querySelectorAll('.builder-library__badge--unplaced')].map(
    (b) => b.closest('.list-detail-row')!.textContent ?? '',
  )
}

describe.skipIf(!WEBUI_INSTALLED)('BUG-47 — the surface reads placement, not upload context', () => {
  it('test_UAT_FC_BUG-47_a_file_kept_for_reading_is_not_marked_as_being_on_the_site', async () => {
    const { panel } = await library()

    // ALL FOUR ARE LISTED — the Library is the business's material and placement
    // is never a boundary ([[REQ-181]]).
    expect(rowsIn(panel.element)).toHaveLength(4)

    // THE NOTE SAYS NOTHING ABOUT THE SITE, in either direction. Under the old
    // field it claimed to be ON the site because the upload named one; it must
    // not now swing to claiming it FAILED to get there — it was never going.
    expect(titles(panel.element).join(' ')).toContain('Positioning note')
    expect(warned(panel.element).join(' ')).not.toContain('Positioning note')

    // AND THE ONE THAT WAS GOING, AND DID NOT ARRIVE, IS THE ONE MARKED.
    const warnings = warned(panel.element)
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('The old shopfront')
  })

  it('test_UAT_FC_BUG-47_the_placed_on_field_agrees_with_the_warning', async () => {
    const { panel } = await library()

    // THE `Placed on` FIELD. The row the client was promised would stay off the
    // site says so in its own rights record — it named `alpha` before.
    panel.listDetail.select('kept-for-reading')
    await settle()
    const rights = panel.element.querySelector('.builder-library__rights')!
    const placedOn = rights.querySelector('.fields-row[data-field="placed_on"]')!
    expect(placedOn.textContent).not.toContain('alpha')

    // …and a row with placement names it, from the same field the warning reads,
    // rendered as a list because that is what the field holds.
    panel.listDetail.select('on-both-sites')
    await settle()
    const both = panel.element
      .querySelector('.builder-library__rights')!
      .querySelector('.fields-row[data-field="placed_on"]')!
    expect(both.textContent).toContain('alpha')
    expect(both.textContent).toContain('beta')
  })

})
