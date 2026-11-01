// @vitest-environment jsdom
/**
 * Library (STORY-1500b111) — badge the exception, as reconciled in BUNDLE-35
 * (REQ-181, with REQ-179's business switch driving the list).
 *
 * WHAT THIS FILE PROVES. The six criteria this bundle reshaped for one site per
 * business: the list is the whole of the open business's material and a business
 * switch leaves no row from the previous business (AC-1715); the filters are
 * role, kind and typed text with no "used on this site" axis (AC-1716); the
 * detail's read-only record names placement under *Placed on* (AC-1717); the
 * warning and the *Placed on* row read one placement list (AC-2018); a row is
 * icon · title · role pill on one line (AC-2020); and only a site asset that was
 * never placed is marked, in words, as not on the site (AC-2161).
 *
 * THE LIBRARY IS MOUNTED WITH NO `getSite`. Under one site per business it has
 * nothing to ask, so if it still needed the open site these cases would fail
 * rather than quietly render against `null`.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createLibraryPanel: (opts?: Record<string, unknown>) => never
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Record<string, any>

if (!WEBUI_INSTALLED) console.warn(`Library badges-the-exception suite skipped: ${WEBUI_SKIP_REASON}`)

const repo = (...parts: string[]) => path.resolve(__dirname, '..', ...parts)
const CSS = readFileSync(repo('apps/control-app/src/builder/builder.css'), 'utf8')
/** The stylesheet with its comments removed, so prose about a rule is never read as one. */
const CSS_RULES = CSS.replace(/\/\*[\s\S]*?\*\//g, '')

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

const UNPLACED_SENTENCE =
  'You asked for this to go on your site and it did not get there. It is still here — try adding it again.'

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
    updated_at: '2026-10-30T12:00:00.000Z',
    ...over,
  }
}

/**
 * Every placement state the criteria name. Two site-role rows carry no
 * placement — one empty, one with the field absent — and the background row is
 * empty by construction, which is why the warning is two facts and not one.
 */
const MATERIAL = [
  material({ uid: 'landed', title: 'The wordmark', filename: 'wordmark.png', placed_on: ['salon'] }),
  material({ uid: 'promotion-failed', title: 'The shopfront', filename: 'shopfront.jpg', placed_on: [] }),
  material({ uid: 'no-placement-field', title: 'The awning', filename: 'awning.jpg', placed_on: undefined }),
  material({
    uid: 'background',
    title: 'Brand guidelines',
    filename: 'guidelines.pdf',
    kind: 'document',
    content_type: 'application/pdf',
    role: 'reference',
    republishable: false,
  }),
  material({
    uid: 'a-font',
    title: 'Plex Sans',
    filename: 'plex.woff2',
    kind: 'font',
    content_type: 'font/woff2',
    placed_on: ['salon'],
  }),
  material({ uid: 'two-sites', title: 'The logo', filename: 'logo.png', placed_on: ['salon', 'annex'] }),
]

function transportOver(rows = MATERIAL) {
  const listCalls: number[] = []
  return {
    listCalls,
    list: async () => {
      listCalls.push(1)
      return { material: rows.map((row) => ({ ...row })) }
    },
    item: async (uid: string) => ({ ...rows.find((row) => row.uid === uid)!, body: 'About it.', members: [] }),
    save: async (uid: string, body: string) => ({ ...rows.find((row) => row.uid === uid)!, body }),
    fileUrl: (uid: string, member?: string) =>
      `/api/material/file?uid=${encodeURIComponent(uid)}${member ? `&member=${encodeURIComponent(member)}` : ''}`,
  }
}

type Panel = {
  element: HTMLElement
  listDetail: { select: (uid: string) => void }
  refresh: () => Promise<unknown>
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

async function library(rows = MATERIAL) {
  const transport = transportOver(rows)
  const panel = createLibraryPanel({ storage: memoryStorage(), transport }) as unknown as Panel
  root.append(panel.element)
  await panel.refresh()
  return { panel, transport }
}

async function open(panel: Panel, uid: string) {
  panel.listDetail.select(uid)
  await settle()
  return panel.element.querySelector('.list-detail-detail-body')!
}

const rowsIn = (el: Element) => [...el.querySelectorAll('.list-detail-row')]
const keysIn = (el: Element) => rowsIn(el).map((r) => r.getAttribute('data-key'))
const warnedKeys = (el: Element) =>
  [...el.querySelectorAll('.builder-library__badge--unplaced')].map((b) =>
    b.closest('.list-detail-row')!.getAttribute('data-key'),
  )

/** The *Placed on* row of the open record: its label and its value. */
async function placedOn(panel: Panel, uid: string) {
  const detail = await open(panel, uid)
  const row = detail.querySelector('.builder-library__rights .fields-row[data-field="placed_on"]')!
  expect(row, `${uid}: no placement row in the record`).toBeTruthy()
  const text = row.textContent ?? ''
  return { detail, text, value: text.replace('Placed on', '').trim() }
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Whether one selector styles the element `target` names (states included, pseudo-elements not). */
function selects(selector: string, target: string): boolean {
  return new RegExp(
    `${escapeRe(target)}(?:\\.[\\w-]+|\\[[^\\]]*\\]|:(?!:)[\\w-]+(?:\\([^)]*\\))?)*$`,
  ).test(selector.trim())
}

/** EVERY block that styles a selector, wherever it sits, concatenated. */
function rule(selector: string): string {
  const blocks: string[] = []
  const re = /([^{}]+)\{([^{}]*)\}/g
  for (let m = re.exec(CSS_RULES); m; m = re.exec(CSS_RULES)) {
    if (m[1].split(',').some((s) => selects(s, selector))) blocks.push(m[2])
  }
  expect(blocks.length, `no rule for ${selector}`).toBeGreaterThan(0)
  return blocks.join('\n')
}

/** Every value any block styling `selector` declares for `property`. */
function values(selector: string, property: string): string[] {
  const re = new RegExp(`(?:^|[;{\\s])${escapeRe(property)}\\s*:\\s*([^;}]+)`, 'g')
  return [...rule(selector).matchAll(re)].map((m) => m[1].trim())
}

describe.skipIf(!WEBUI_INSTALLED)('AC-1715 — the whole business, and a switch leaves nothing behind', () => {
  it('test_UAT_AC1715_whole_business_listed_unbadged_and_a_business_switch_leaves_no_previous_row', async () => {
    // EVERY ROW, PLACED OR NOT, WITH NO FILTER SET — and none marked as on the site.
    const { panel } = await library()
    expect(keysIn(panel.element).sort()).toEqual(MATERIAL.map((r) => r.uid as string).sort())
    expect(panel.element.querySelectorAll('.builder-library__badge--here')).toHaveLength(0)
    expect(panel.element.textContent).not.toContain('On this site')

    // THE SWITCH, driven through the header selector an operator uses.
    const MATERIAL_OF: Record<string, Array<Record<string, unknown>>> = {
      acct_salon: [material({ uid: 'salon-1', title: 'Salon awning', filename: 'awning.jpg', placed_on: ['s'] })],
      acct_studio: [
        material({ uid: 'studio-1', title: 'Studio reel', filename: 'reel.jpg' }),
        material({ uid: 'studio-2', title: 'Studio notes', filename: 'notes.md', kind: 'document', role: 'reference' }),
      ],
    }
    let business = 'acct_salon'
    let failNext = false
    document.body.replaceChildren()
    root = document.createElement('div')
    document.body.append(root)
    const app = mountBuilder(root, {
      businesses: [
        { id: 'acct_salon', name: 'Salon', selectable: true },
        { id: 'acct_studio', name: 'Studio', selectable: true },
      ],
      account: { name: 'Sam', email: 'sam@example.test' },
      storage: memoryStorage(),
      loadSites: async (id: string | null) => {
        business = id ?? 'acct_salon'
        return [{ slug: `${business}-site`, latest: 1 }]
      },
      chatTransport: {
        openSession: async () => ({ sessionId: 's', turns: [], ready: true }),
        streamPrompt: async function* () {
          yield { kind: 'done' }
        },
      },
      libraryTransport: {
        list: async () => {
          if (failNext) throw new Error('the network went away')
          return { material: (MATERIAL_OF[business] ?? []).map((r) => ({ ...r })) }
        },
        item: async () => ({ body: '', members: [] }),
        save: async () => ({}),
        fileUrl: (uid: string) => `/api/material/file?uid=${uid}`,
      },
    })
    await settle()
    expect(keysIn(app.library.element)).toEqual(['salon-1'])

    const select = root.querySelector('.builder-business__select') as HTMLSelectElement
    select.value = 'acct_studio'
    select.dispatchEvent(new Event('change'))
    await settle()
    expect(keysIn(app.library.element).sort()).toEqual(['studio-1', 'studio-2'])
    expect(app.library.element.textContent).not.toContain('Salon awning')

    // A FAILED RE-READ SHOWS AN EMPTY LIST, not the previous business's rows.
    failNext = true
    select.value = 'acct_salon'
    select.dispatchEvent(new Event('change'))
    await settle()
    expect(rowsIn(app.library.element)).toHaveLength(0)
    expect(app.library.element.textContent).not.toContain('Studio reel')
    expect(app.library.element.textContent).not.toContain('Salon awning')
  })
})

describe.skipIf(!WEBUI_INSTALLED)('AC-1716 — role, kind and text narrow one listing; no used-on-this-site axis', () => {
  it('test_UAT_AC1716_role_kind_and_text_narrow_conjunctively_with_no_refetch_and_no_used_here_filter', async () => {
    const { panel, transport } = await library()
    const role = panel.element.querySelector('.builder-library__role') as HTMLSelectElement
    const kind = panel.element.querySelector('.builder-library__kind') as HTMLSelectElement
    const search = panel.element.querySelector('.builder-library__search') as HTMLInputElement
    const setSelect = (s: HTMLSelectElement, v: string) => {
      s.value = v
      s.dispatchEvent(new Event('change'))
    }
    const setText = (v: string) => {
      search.value = v
      search.dispatchEvent(new Event('input'))
    }

    // EXACTLY THE TEXT, ROLE AND KIND CONTROLS — no "used on this site" control.
    const filter = panel.element.querySelector('.builder-library__filter')!
    expect(filter.contains(search) && filter.contains(role) && filter.contains(kind)).toBe(true)
    expect(filter.querySelectorAll('input, select')).toHaveLength(3)
    expect(panel.element.querySelector('.builder-library__here')).toBeNull()
    expect(panel.element.querySelector('input[type="checkbox"]')).toBeNull()
    expect(panel.element.textContent).not.toMatch(/used on this site/i)

    // Each axis alone.
    setSelect(role, 'reference')
    expect(keysIn(panel.element)).toEqual(['background'])
    setSelect(role, '')
    setSelect(kind, 'font')
    expect(keysIn(panel.element)).toEqual(['a-font'])
    setSelect(kind, '')
    setText('shopfront') // matches the title "The shopfront" and filename shopfront.jpg
    expect(keysIn(panel.element)).toEqual(['promotion-failed'])
    setText('awning.jpg') // filename only
    expect(keysIn(panel.element)).toEqual(['no-placement-field'])
    setText('')
    expect(rowsIn(panel.element)).toHaveLength(MATERIAL.length)

    // Conjunctive: site role AND image kind AND "the" in the title.
    setSelect(role, 'site')
    setSelect(kind, 'image')
    expect(keysIn(panel.element).sort()).toEqual(
      ['landed', 'no-placement-field', 'promotion-failed', 'two-sites'].sort(),
    )
    setText('logo')
    expect(keysIn(panel.element)).toEqual(['two-sites'])
    setSelect(kind, 'font')
    expect(rowsIn(panel.element)).toHaveLength(0)

    // Cleared: the full list returns.
    setSelect(role, '')
    setSelect(kind, '')
    setText('')
    expect(rowsIn(panel.element)).toHaveLength(MATERIAL.length)

    // NOT ONE NARROWING WAS A REQUEST.
    expect(transport.listCalls).toHaveLength(1)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('AC-1717 — the file itself, and the record read-only', () => {
  it('test_UAT_AC1717_detail_shows_the_file_with_a_download_and_a_read_only_record_under_placed_on', async () => {
    const { panel } = await library()

    // AN IMAGE, rendered from its own bytes, beside a download under its filename.
    const image = await open(panel, 'landed')
    const img = image.querySelector('.builder-library__image') as HTMLImageElement
    expect(img.getAttribute('src')).toBe('/api/material/file?uid=landed')
    expect(img.alt).toBe('The wordmark')
    expect((image.querySelector('.builder-library__download') as HTMLAnchorElement).getAttribute('download')).toBe(
      'wordmark.png',
    )

    // …AND IF ITS BYTES CANNOT BE READ, A PLAIN STATEMENT REPLACES IT.
    img.dispatchEvent(new Event('error'))
    expect(image.querySelector('.builder-library__image')).toBeNull()
    expect(image.querySelector('.builder-library__missing')!.textContent).toMatch(/no longer in storage/i)

    // A DOCUMENT THE PLATFORM CAN READ is shown in the reader above the record,
    // with the download still present and pointing at the same bytes.
    const doc = await open(panel, 'background')
    const reader = doc.querySelector('.builder-reader')!
    expect(reader).toBeTruthy()
    const frame = doc.querySelector('.builder-reader__frame') as HTMLIFrameElement
    expect(frame.getAttribute('src')).toBe('/api/material/file?uid=background')
    const docDownload = doc.querySelector('.builder-library__download') as HTMLAnchorElement
    expect(docDownload.getAttribute('download')).toBe('guidelines.pdf')
    expect(docDownload.getAttribute('href')).toBe('/api/material/file?uid=background')
    const rights = doc.querySelector('.builder-library__rights')!
    expect(reader.compareDocumentPosition(rights) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    // THE RECORD: every field displayed, none editable, placement under *Placed on*.
    const named = (name: string) => rights.querySelector(`.fields-row[data-field="${name}"]`)!
    expect(named('filename').textContent).toContain('guidelines.pdf')
    expect(named('kind').textContent).toContain('document')
    expect(named('role')).toBeTruthy()
    expect(named('origin').textContent).toContain('uploaded')
    expect(named('rights').textContent).toContain('owned')
    expect(named('republishable')).toBeTruthy()
    expect(named('placed_on').textContent).toContain('Placed on')
    expect(named('source_url')).toBeTruthy()
    expect(rights.textContent).not.toContain('Used on')
    for (const row of rights.querySelectorAll('.fields-row')) {
      expect(row.classList.contains('is-editable'), row.getAttribute('data-field') ?? '').toBe(false)
    }
    expect(rights.querySelectorAll('.fields-value-editable, input, select, textarea')).toHaveLength(0)

    // NOTHING ON THE PANE LETS A CLIENT ASSERT RIGHTS: outside the description,
    // no control on the detail edits anything.
    const controls = [...doc.querySelectorAll('input, select, textarea, [contenteditable="true"]')]
    for (const c of controls) {
      expect(c.closest('.fields-row[data-field="body"]'), c.outerHTML).toBeTruthy()
    }

    // A KIND NOTHING CAN RENDER: the download alone, no reader, no picture.
    const font = await open(panel, 'a-font')
    expect(font.querySelector('.builder-reader')).toBeNull()
    expect(font.querySelector('.builder-library__image')).toBeNull()
    expect((font.querySelector('.builder-library__download') as HTMLAnchorElement).getAttribute('download')).toBe(
      'plex.woff2',
    )
  })
})

describe.skipIf(!WEBUI_INSTALLED)('AC-2018 — the warning and the Placed on row read one list', () => {
  it('test_UAT_AC2018_warning_and_placed_on_row_agree_on_every_row', async () => {
    const { panel } = await library()

    // The landed asset: *Placed on* names its site, no warning.
    const landed = await placedOn(panel, 'landed')
    expect(landed.text).toContain('Placed on')
    expect(landed.text).not.toContain('Used on')
    expect(landed.value).toContain('salon')

    // Every placed site, joined on one line.
    const both = await placedOn(panel, 'two-sites')
    expect(both.value).toContain('salon, annex')

    // The failed promotion: *Placed on* empty, and it carries the warning.
    const failed = await placedOn(panel, 'promotion-failed')
    expect(failed.value).toMatch(/^[—-]?$/)

    // Background: *Placed on* empty, and no warning.
    const background = await placedOn(panel, 'background')
    expect(background.value).toMatch(/^[—-]?$/)

    // Agreement on every row: a site-role row is warned iff its record is empty.
    const warned = new Set(warnedKeys(panel.element))
    for (const row of MATERIAL) {
      const { value } = await placedOn(panel, row.uid as string)
      const empty = /^[—-]?$/.test(value)
      expect(warned.has(row.uid as string), `${row.uid}`).toBe(row.role === 'site' && empty)
    }
    expect(warned.has('landed')).toBe(false)
    expect(warned.has('promotion-failed')).toBe(true)
    expect(warned.has('background')).toBe(false)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('AC-2020 — icon, title, role pill on one line', () => {
  it('test_UAT_AC2020_row_is_one_flex_line_icon_title_role_pill_with_the_warning_only_on_the_exception', async () => {
    // THE STYLESHEET CONTRACT, read across every block that styles each element.
    expect(values('.builder-library__row', 'display')).toEqual(['flex'])
    for (const v of values('.builder-library__row', 'flex-direction')) expect(v).toMatch(/^row\b/)
    for (const v of values('.builder-library__row', 'flex-wrap')) expect(v).toBe('nowrap')
    for (const v of values('.builder-library__row', 'flex-flow')) expect(v).not.toMatch(/column|(^|\s)wrap/)
    expect(values('.builder-library__row-title', 'flex')).toEqual(['1 1 auto'])
    expect(values('.builder-library__row-title', 'min-width')).toEqual(['0'])
    expect(values('.builder-library__row-title', 'font-size')).toEqual(['13px'])
    expect(values('.builder-library__row-title', 'white-space')).toEqual(['nowrap'])
    expect(values('.builder-library__row-title', 'overflow')).toEqual(['hidden'])
    expect(values('.builder-library__row-title', 'text-overflow')).toEqual(['ellipsis'])
    expect(values('.builder-library__row-icon', 'flex')).toEqual(['none'])
    expect(values('.builder-library__row-meta', 'flex')).toEqual(['none'])
    for (const sel of ['.builder-library__row-icon', '.builder-library__row-meta']) {
      expect(values(sel, 'flex-shrink').filter((v) => v !== '0'), sel).toEqual([])
      expect(values(sel, 'flex-grow').filter((v) => v !== '0'), sel).toEqual([])
    }
    for (const v of values('.builder-library__row-meta', 'flex-wrap')) expect(v).toBe('nowrap')
    for (const v of values('.builder-library__badge', 'white-space')) expect(v).toBe('nowrap')
    // The shared list component is not restyled by the Library.
    expect(CSS_RULES).not.toMatch(/\.list-detail-row-title\s*\{/)

    // THE DOM ORDER, on every row.
    const { panel } = await library()
    const ROLE_WORDS: Record<string, string> = { site: 'Site asset', reference: 'Background information' }
    for (const row of rowsIn(panel.element)) {
      const key = row.getAttribute('data-key')!
      const fixture = MATERIAL.find((m) => m.uid === key)!
      const content = row.querySelector('.builder-library__row')!
      expect(
        [...content.children].map(
          (c) =>
            ['builder-library__row-icon', 'builder-library__row-title', 'builder-library__row-meta'].find((cls) =>
              c.classList.contains(cls),
            ) ?? c.className,
        ),
        `${key}: icon, title, pills`,
      ).toEqual(['builder-library__row-icon', 'builder-library__row-title', 'builder-library__row-meta'])
      for (const badge of content.querySelectorAll('.builder-library__badge')) {
        expect(badge.parentElement!.classList.contains('builder-library__row-meta'), key).toBe(true)
      }

      // The strip: the role pill, named in the hand-over words, and — only on the
      // exception — the warning beside it. Never a placement pill.
      const strip = [...content.querySelector('.builder-library__row-meta')!.children]
      const role = strip[0]
      expect(role.classList.contains('builder-library__badge--role'), key).toBe(true)
      expect(role.textContent, key).toBe(ROLE_WORDS[fixture.role as string])
      const exception = fixture.role === 'site' && !(Array.isArray(fixture.placed_on) && fixture.placed_on.length)
      if (exception) {
        expect(strip, key).toHaveLength(2)
        expect(strip[1].classList.contains('builder-library__badge--unplaced'), key).toBe(true)
      } else {
        expect(strip, key).toHaveLength(1)
      }
    }
  })
})

describe.skipIf(!WEBUI_INSTALLED)('AC-2161 — only the never-placed site asset is marked', () => {
  it('test_UAT_AC2161_only_unplaced_site_assets_carry_a_worded_danger_coloured_warning', async () => {
    const { panel } = await library()

    // NO PLACEMENT BADGE ON ANY ROW.
    expect(panel.element.querySelectorAll('.builder-library__badge--here')).toHaveLength(0)
    expect(panel.element.textContent).not.toContain('On this site')

    // THE WARNING ON EXACTLY THE TWO SITE-ROLE ROWS WITH NO PLACEMENT — the empty
    // list and the absent field alike — and on neither the placed nor background row.
    expect(warnedKeys(panel.element).sort()).toEqual(['no-placement-field', 'promotion-failed'])

    // A placed row shows only icon, title and role pill.
    const placed = panel.element.querySelector('.list-detail-row[data-key="landed"] .builder-library__row')!
    expect(placed.querySelectorAll('.builder-library__badge')).toHaveLength(1)
    expect(placed.querySelector('.builder-library__badge--role')).toBeTruthy()

    for (const warn of panel.element.querySelectorAll('.builder-library__badge--unplaced')) {
      // In words, inside the badge, apart from the glyph.
      const glyph = warn.querySelector('.builder-library__warn-glyph')!
      expect(glyph).toBeTruthy()
      expect(glyph.getAttribute('aria-hidden')).toBe('true')
      const spoken = [...warn.childNodes]
        .filter((n) => n !== glyph)
        .map((n) => n.textContent ?? '')
        .join('')
        .trim()
      expect(spoken).toBe('Not on the site')
      // The full sentence on hover.
      expect(warn.getAttribute('title')).toBe(UNPLACED_SENTENCE)
    }

    // THE DANGER COLOUR, NOT THE ACCENT; and no rule styles a placement badge.
    const warnRule = rule('.builder-library__badge--unplaced')
    expect(warnRule).toContain('--shell-danger')
    expect(warnRule).not.toContain('--shell-accent')
    expect(CSS_RULES).not.toContain('.builder-library__badge--here')

    // A ROW THAT PREDATES `placed_on` — carrying only the retired upload-context
    // `site_slug` (BUG-47, no backfill) — reads as placed nowhere: the retired
    // field is never mistaken for placement, so it is warned and its *Placed on*
    // is empty.
    root.replaceChildren()
    const legacy = material({ uid: 'legacy', title: 'Old row', filename: 'old.png', placed_on: undefined, site_slug: 'salon' })
    const { panel: legacyPanel } = await library([legacy])
    expect(keysIn(legacyPanel.element)).toEqual(['legacy'])
    expect(warnedKeys(legacyPanel.element)).toEqual(['legacy'])
    expect((await placedOn(legacyPanel, 'legacy')).value).toMatch(/^[—-]?$/)
  })
})
