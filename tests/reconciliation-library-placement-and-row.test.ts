// @vitest-environment jsdom
/**
 * Library (STORY-1500b111) — placement, filters and row presentation, as
 * reconciled in BUNDLE-32 (BUG-47, REQ-176).
 *
 * WHAT THIS FILE PROVES. The five criteria this bundle reshaped: the list is the
 * whole account's material with the open site as a badge decided by the recorded
 * placement (`placed_on`), the four filter axes narrow that same list, the badge,
 * the `Used on` row and the `Used on this site` filter agree on every row across
 * a site switch, every row leads with one labelled type icon instead of a kind
 * pill, and the row is laid out on one line by its stylesheet contract.
 *
 * THE FIXTURE CARRIES THE BUG. One row was handed over as background while the
 * open site was selected, one is a promotion that failed — both carry an empty
 * `placed_on`, so a surface that still read upload context would badge them.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createLibraryPanel: (opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`Library placement suite skipped: ${WEBUI_SKIP_REASON}`)

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
 * Five rows spanning every placement case the criteria name, across both roles
 * and two kinds. `alpha` is the open site; `beta` is the client's other site.
 */
const PLACEMENT = [
  material({ uid: 'placed-here', title: 'The wordmark', filename: 'wordmark.svg', placed_on: ['alpha'] }),
  material({ uid: 'placed-elsewhere', title: 'The menu photo', filename: 'menu.jpg', placed_on: ['beta'] }),
  material({
    uid: 'placed-nowhere',
    title: 'Brand guidelines',
    filename: 'guidelines.pdf',
    kind: 'document',
    role: 'reference',
    republishable: false,
  }),
  material({
    // Handed over as background while `alpha` was open — never placed.
    uid: 'background-while-here',
    title: 'Positioning note',
    filename: 'positioning.md',
    kind: 'document',
    role: 'reference',
    republishable: false,
    placed_on: [],
  }),
  // "Put it on the site", and the promotion did not land.
  material({ uid: 'promotion-failed', title: 'The old shopfront', filename: 'shopfront.jpg', placed_on: [] }),
  material({ uid: 'on-both-sites', title: 'The logo', filename: 'logo.svg', placed_on: ['alpha', 'beta'] }),
]

/** One row per declared kind, one unknown kind, and one with no kind at all. */
const KINDS = [
  material({ uid: 'an-image', title: 'The wordmark', filename: 'wordmark.png', kind: 'image', placed_on: ['alpha'] }),
  material({ uid: 'a-document', title: 'Positioning note', filename: 'positioning.md', kind: 'document', role: 'reference' }),
  material({ uid: 'a-font', title: 'Plex Sans', filename: 'plex.woff2', kind: 'font' }),
  material({ uid: 'a-capture', title: 'The old shopfront', filename: 'capture.json', kind: 'capture' }),
  material({ uid: 'a-future-kind', title: 'Something new', filename: 'new.bin', kind: 'hologram' }),
  material({ uid: 'no-kind', title: 'Unfiled', filename: 'unfiled.bin', kind: undefined }),
]

function transportOver(rows: Array<Record<string, unknown>>) {
  const listCalls: number[] = []
  return {
    listCalls,
    list: async () => {
      listCalls.push(1)
      return { material: rows.map((row) => ({ ...row })) }
    },
    item: async (uid: string) => ({ ...rows.find((row) => row.uid === uid)!, body: 'About it.' }),
    save: async (uid: string, body: string) => ({ ...rows.find((row) => row.uid === uid)!, body }),
    fileUrl: (uid: string) => `/api/material/file?uid=${encodeURIComponent(uid)}`,
  }
}

type Panel = {
  element: HTMLElement
  listDetail: { select: (uid: string) => void }
  refresh: () => Promise<unknown>
  siteChanged: () => void
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

/** A mounted Library; the open site is boxed so it can change under the list. */
async function library(rows = PLACEMENT, initialSite: string | null = 'alpha') {
  const site = { slug: initialSite }
  const transport = transportOver(rows)
  const panel = createLibraryPanel({
    storage: memoryStorage(),
    transport,
    getSite: () => site.slug,
  }) as unknown as Panel
  root.append(panel.element)
  await panel.refresh()
  return { panel, transport, site }
}

const rowsIn = (el: Element) => [...el.querySelectorAll('.list-detail-row')]
const keysIn = (el: Element) => rowsIn(el).map((r) => r.getAttribute('data-key'))
const badgedKeys = (el: Element) =>
  [...el.querySelectorAll('.builder-library__badge--here')].map((b) =>
    b.closest('.list-detail-row')!.getAttribute('data-key'),
  )

/** The `Used on` row's value: its text with the label removed. */
async function usedOn(panel: Panel, uid: string): Promise<string> {
  panel.listDetail.select(uid)
  await settle()
  const row = panel.element.querySelector('.builder-library__rights .fields-row[data-field="placed_on"]')!
  expect(row, 'no Used on row in the record').toBeTruthy()
  return (row.textContent ?? '').replace('Used on', '').trim()
}

/** The declared block for a selector, so a rule can be read as a contract. */
function rule(selector: string): string {
  const at = CSS.indexOf(`${selector} {`)
  expect(at, `no rule for ${selector}`).toBeGreaterThan(-1)
  return CSS.slice(at, CSS.indexOf('}', at))
}

describe.skipIf(!WEBUI_INSTALLED)('AC-1715 — the whole account, with the open site as a badge', () => {
  it('test_UAT_AC1715_every_placement_is_listed_and_only_material_placed_on_the_open_site_is_badged', async () => {
    const { panel } = await library(PLACEMENT, 'alpha')

    // ALL OF IT, unfiltered: placed here, placed on the other site, placed nowhere,
    // and handed over as background while this site was open.
    expect(keysIn(panel.element).sort()).toEqual(PLACEMENT.map((r) => r.uid as string).sort())

    // THE BADGE FOLLOWS RECORDED PLACEMENT, NOT UPLOAD CONTEXT.
    expect(badgedKeys(panel.element).sort()).toEqual(['on-both-sites', 'placed-here'])
    expect(badgedKeys(panel.element)).not.toContain('background-while-here')
    expect(badgedKeys(panel.element)).not.toContain('promotion-failed')
    expect(badgedKeys(panel.element)).not.toContain('placed-elsewhere')

    // A row that predates `placed_on` (only the retired field) is placed nowhere.
    const legacy = material({ uid: 'legacy', title: 'Old row', filename: 'old.png', placed_on: undefined, site_slug: 'alpha' })
    const { panel: legacyPanel } = await library([legacy], 'alpha')
    expect(keysIn(legacyPanel.element)).toEqual(['legacy'])
    expect(badgedKeys(legacyPanel.element)).toEqual([])
  })
})

describe.skipIf(!WEBUI_INSTALLED)('AC-1716 — four axes, conjunctive, over the same listed material', () => {
  it('test_UAT_AC1716_role_kind_placement_and_text_narrow_conjunctively_over_one_listing', async () => {
    const { panel, transport, site } = await library(PLACEMENT, 'alpha')
    const q = <T extends HTMLElement>(cls: string) => panel.element.querySelector(cls) as T
    const fire = (el: HTMLElement, type: string) => el.dispatchEvent(new Event(type))
    const role = () => q<HTMLSelectElement>('.builder-library__role')
    const kind = () => q<HTMLSelectElement>('.builder-library__kind')
    const here = () => q<HTMLInputElement>('.builder-library__here input')
    const search = () => q<HTMLInputElement>('.builder-library__search')
    const all = PLACEMENT.length

    // BY ROLE.
    role().value = 'reference'
    fire(role(), 'change')
    expect(keysIn(panel.element).sort()).toEqual(['background-while-here', 'placed-nowhere'])
    role().value = ''
    fire(role(), 'change')
    expect(rowsIn(panel.element)).toHaveLength(all)

    // BY KIND.
    kind().value = 'document'
    fire(kind(), 'change')
    expect(keysIn(panel.element).sort()).toEqual(['background-while-here', 'placed-nowhere'])

    // CONJUNCTIVE with typed text — `guidelines` is the filename half.
    search().value = 'guidelines'
    fire(search(), 'input')
    expect(keysIn(panel.element)).toEqual(['placed-nowhere'])
    search().value = ''
    fire(search(), 'input')
    kind().value = ''
    fire(kind(), 'change')
    expect(rowsIn(panel.element)).toHaveLength(all)

    // BY USED ON THIS SITE — recorded placement only, never upload context.
    here().checked = true
    fire(here(), 'change')
    expect(keysIn(panel.element).sort()).toEqual(['on-both-sites', 'placed-here'])

    // CONJUNCTIVE with kind: images placed here, typed text narrows to the logo.
    search().value = 'logo'
    fire(search(), 'input')
    expect(keysIn(panel.element)).toEqual(['on-both-sites'])
    search().value = ''
    fire(search(), 'input')

    // SWITCHING SITE re-decides the filter from the material already listed.
    site.slug = 'beta'
    panel.siteChanged()
    expect(keysIn(panel.element).sort()).toEqual(['on-both-sites', 'placed-elsewhere'])

    // WITH NO SITE OPEN, the placement filter leaves nothing.
    site.slug = null
    panel.siteChanged()
    expect(rowsIn(panel.element)).toHaveLength(0)

    // Turning it off restores the whole account's material.
    here().checked = false
    fire(here(), 'change')
    expect(rowsIn(panel.element)).toHaveLength(all)

    // None of that was a re-scoped request.
    expect(transport.listCalls).toHaveLength(1)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('AC-2018 — badge, Used on row and filter read one placement list', () => {
  it('test_UAT_AC2018_badge_used_on_row_and_filter_agree_on_every_row_across_a_site_switch', async () => {
    const { panel, transport, site } = await library(PLACEMENT, 'alpha')
    const here = () => panel.element.querySelector('.builder-library__here input') as HTMLInputElement
    const setHere = (on: boolean) => {
      here().checked = on
      here().dispatchEvent(new Event('change'))
    }

    // Badge on `alpha` = exactly the placed rows; the filter keeps exactly those.
    const badgedAlpha = badgedKeys(panel.element).sort()
    expect(badgedAlpha).toEqual(['on-both-sites', 'placed-here'])
    setHere(true)
    expect(keysIn(panel.element).sort()).toEqual(badgedAlpha)
    setHere(false)

    // The `Used on` row lists every placed site, and nothing for unplaced rows.
    const expected: Record<string, string[]> = {
      'placed-here': ['alpha'],
      'placed-elsewhere': ['beta'],
      'placed-nowhere': [],
      'background-while-here': [],
      'promotion-failed': [],
      'on-both-sites': ['alpha', 'beta'],
    }
    for (const [uid, sites] of Object.entries(expected)) {
      const value = await usedOn(panel, uid)
      if (sites.length === 0) {
        // Empty: the fields component's own empty placeholder, naming no site.
        expect(value, `${uid} should show no placement`).toMatch(/^[—-]?$/)
      } else {
        expect(value.split(/,\s*/).sort(), `${uid} placement`).toEqual(sites)
      }
      // Agreement with the badge on the open site.
      expect(badgedKeys(panel.element).includes(uid)).toBe(sites.includes('alpha'))
    }

    // Switch to `beta`: the two-site material is still badged and kept.
    // Re-decided from the material already listed — no further list request.
    site.slug = 'beta'
    panel.siteChanged()
    expect(transport.listCalls).toHaveLength(1)
    const badgedBeta = badgedKeys(panel.element).sort()
    expect(badgedBeta).toEqual(['on-both-sites', 'placed-elsewhere'])
    setHere(true)
    expect(keysIn(panel.element).sort()).toEqual(badgedBeta)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('AC-2019 — one labelled type icon per row, no kind pill', () => {
  it('test_UAT_AC2019_each_row_leads_with_one_labelled_type_icon_and_carries_no_kind_pill', async () => {
    const { panel } = await library(KINDS, 'alpha')
    const rows = rowsIn(panel.element)
    expect(rows).toHaveLength(KINDS.length)

    const iconOf = (uid: string) =>
      panel.element.querySelector(`.list-detail-row[data-key="${uid}"] .builder-library__row-icon`)!

    for (const row of rows) {
      const content = row.querySelector('.builder-library__row')!
      expect(content, 'row content cell').toBeTruthy()
      // FIRST element, exactly one, never empty.
      expect(content.firstElementChild!.classList.contains('builder-library__row-icon')).toBe(true)
      const icons = row.querySelectorAll('.builder-library__row-icon')
      expect(icons).toHaveLength(1)
      expect(icons[0].textContent?.trim()).not.toBe('')
    }

    // The three named kinds are pairwise distinct; capture and unknown share a fallback.
    const named = ['an-image', 'a-document', 'a-font'].map((u) => iconOf(u).textContent)
    expect(new Set(named).size).toBe(3)
    const fallback = iconOf('a-capture').textContent
    expect(iconOf('a-future-kind').textContent).toBe(fallback)
    expect(iconOf('no-kind').textContent).toBe(fallback)
    expect(named).not.toContain(fallback)

    // Announced as an image labelled with the kind; no recorded kind → "file".
    const labels: Record<string, string> = {
      'an-image': 'image',
      'a-document': 'document',
      'a-font': 'font',
      'a-capture': 'capture',
      'a-future-kind': 'hologram',
      'no-kind': 'file',
    }
    for (const [uid, label] of Object.entries(labels)) {
      expect(iconOf(uid).getAttribute('role')).toBe('img')
      expect(iconOf(uid).getAttribute('aria-label')).toBe(label)
    }

    // No kind pill; role pills and the placement badge remain where they apply.
    expect(panel.element.querySelectorAll('.builder-library__badge--kind')).toHaveLength(0)
    expect(panel.element.querySelectorAll('.builder-library__badge--role')).toHaveLength(KINDS.length)
    expect(badgedKeys(panel.element)).toEqual(['an-image'])

    // Kind is still a filter and still in the detail record.
    const kindSelect = panel.element.querySelector('.builder-library__kind') as HTMLSelectElement
    expect(kindSelect).toBeTruthy()
    kindSelect.value = 'font'
    kindSelect.dispatchEvent(new Event('change'))
    expect(keysIn(panel.element)).toEqual(['a-font'])
    panel.listDetail.select('a-font')
    await settle()
    const kindRow = panel.element.querySelector('.builder-library__rights .fields-row[data-field="kind"]')!
    expect(kindRow.textContent).toContain('font')
  })
})

describe('AC-2020 — the row is one line, and truncation lands on the title', () => {
  it('test_UAT_AC2020_row_is_a_flex_line_with_a_13px_ellipsing_title_and_rigid_icon_and_pills', () => {
    const row = rule('.builder-library__row')
    expect(row).toMatch(/display:\s*flex/)
    expect(row).not.toMatch(/flex-direction:\s*column/)
    expect(row).not.toMatch(/flex-wrap:\s*wrap/)

    const title = rule('.builder-library__row-title')
    expect(title).toMatch(/flex:\s*1 1 auto/)
    expect(title).toMatch(/min-width:\s*0/)
    expect(title).toMatch(/font-size:\s*13px/)
    expect(title).toMatch(/white-space:\s*nowrap/)
    expect(title).toMatch(/overflow:\s*hidden/)
    expect(title).toMatch(/text-overflow:\s*ellipsis/)

    expect(rule('.builder-library__row-icon')).toMatch(/flex:\s*none/)
    const meta = rule('.builder-library__row-meta')
    expect(meta).toMatch(/flex:\s*none/)
    expect(meta).not.toMatch(/flex-wrap:\s*wrap/)

    // The shared list component is not restyled here: no rule in the builder
    // stylesheet targets the component's own row title.
    expect(CSS).not.toMatch(/\.list-detail-row-title\s*\{/)
  })
})
