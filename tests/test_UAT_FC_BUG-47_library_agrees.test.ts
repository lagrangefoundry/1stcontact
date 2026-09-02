// @vitest-environment jsdom
/**
 * BUG-47 — **the pill, the field and the filter say the same thing**.
 *
 * WHAT THIS FILE PROVES, and what its sibling proves instead. The origin half —
 * that `placed_on` is written by the promotion and only where the bytes landed —
 * is `test_UAT_FC_BUG-47_placement.workers.test.ts`. This is the surface: that
 * the three consumers which used to read `site_slug` now read one fact, and
 * therefore cannot disagree with each other or with what the client was told at
 * the moment they dropped the file.
 *
 * THE THREE WERE ALWAYS ONE STATEMENT. `On this site`, the `Used on` row in the
 * rights block, and the `Used on this site` checkbox are three renderings of
 * "the bytes are on the site you have open". They were three separate readings
 * of a field that meant something else, so all three were wrong together — which
 * is why they are asserted together here rather than one per test.
 *
 * AND PLACEMENT IS PLURAL. DOC-38 §7.7 lets one blob back two of a client's
 * sites, so the fixture holds a logo on both and the suite switches sites to
 * check that each one badges it. A scalar could not have expressed that at all.
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
 * the old field it carried `site_slug: 'alpha'` and was badged as being on the
 * site the client had just been promised it would stay off.
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

/** A mounted Library over the fixture. `site` is read on every draw. */
async function library(initial = 'alpha') {
  let site = initial
  const panel = createLibraryPanel({
    storage: memoryStorage(),
    transport: transportOver(),
    getSite: () => site,
  })
  root.append(panel.element)
  await panel.refresh()
  return { panel, setSite: (s: string) => void (site = s) }
}

const rowsIn = (el: Element) => [...el.querySelectorAll('.list-detail-row')]
const titles = (el: Element) => rowsIn(el).map((r) => r.textContent)

/** The rows currently wearing the pill. */
function badged(el: Element): string[] {
  return [...el.querySelectorAll('.builder-library__badge--here')].map(
    (b) => b.closest('.list-detail-row')!.textContent ?? '',
  )
}

describe.skipIf(!WEBUI_INSTALLED)('BUG-47 — the badge marks placement, not upload context', () => {
  it('test_UAT_FC_BUG-47_a_file_kept_for_reading_is_not_badged_as_being_on_the_site', async () => {
    const { panel } = await library('alpha')

    // ALL FOUR ARE LISTED — the Library is tenant-wide and the site is a badge,
    // never a boundary (DOC-38 §7.7, DOC-10 §4.1).
    expect(rowsIn(panel.element)).toHaveLength(4)

    // AND EXACTLY THE PLACED ONES ARE BADGED. The note the client asked us only
    // to read, and the picture whose promotion did not land, carry no pill —
    // under the old field both did, because both uploads named the open site.
    const here = badged(panel.element)
    expect(here).toHaveLength(2)
    expect(here.join(' ')).toContain('The wordmark')
    expect(here.join(' ')).toContain('The logo')
    expect(here.join(' ')).not.toContain('Positioning note')
    expect(here.join(' ')).not.toContain('The old shopfront')
  })

  it('test_UAT_FC_BUG-47_the_filter_and_the_used_on_field_agree_with_the_pill', async () => {
    const { panel } = await library('alpha')

    // THE FILTER. "Used on this site" narrows to exactly the badged rows, because
    // it now asks the same field the badge does.
    const here = panel.element.querySelector('.builder-library__here input') as HTMLInputElement
    here.checked = true
    here.dispatchEvent(new Event('change'))
    expect(titles(panel.element)).toHaveLength(2)
    expect(titles(panel.element).join(' ')).not.toContain('Positioning note')

    // THE `Used on` FIELD. The row the client was promised would stay off the
    // site says so in its own rights record — it named `alpha` before.
    here.checked = false
    here.dispatchEvent(new Event('change'))
    panel.listDetail.select('kept-for-reading')
    await settle()
    const rights = panel.element.querySelector('.builder-library__rights')!
    const usedOn = rights.querySelector('.fields-row[data-field="placed_on"]')!
    expect(usedOn.textContent).not.toContain('alpha')

    // …and the row that IS on two sites names both, because placement is plural.
    panel.listDetail.select('on-both-sites')
    await settle()
    const both = panel.element
      .querySelector('.builder-library__rights')!
      .querySelector('.fields-row[data-field="placed_on"]')!
    expect(both.textContent).toContain('alpha')
    expect(both.textContent).toContain('beta')
  })

  it('test_UAT_FC_BUG-47_a_material_on_two_sites_is_badged_on_both_of_them', async () => {
    // THE SHAPE A SCALAR COULD NOT HOLD. One blob backs two of the client's sites
    // (DOC-38 §7.7), so switching site re-decides the badge from the same row —
    // the material did not change, only which site is asking.
    const { panel, setSite } = await library('alpha')
    expect(badged(panel.element).join(' ')).toContain('The logo')

    setSite('beta')
    await panel.refresh()

    const here = badged(panel.element)
    expect(here).toHaveLength(1)
    expect(here[0]).toContain('The logo')
    // The wordmark is on `alpha` only, so `beta` does not claim it.
    expect(here.join(' ')).not.toContain('The wordmark')
  })
})
