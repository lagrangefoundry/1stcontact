// @vitest-environment jsdom
/**
 * Library (STORY-1500b111) — row presentation, as reconciled in BUNDLE-32
 * (REQ-176) and corrected for REQ-181.
 *
 * WHAT THIS FILE PROVES. Every row leads with one labelled type icon instead of
 * a kind pill, carrying only its role pill and — on an unplaced site asset — the
 * not-on-the-site warning (AC-2019); and the row is laid out on one line by its
 * stylesheet contract (AC-2020). The listing, the filters and the placement
 * warning are proved in `reconciliation-library-badges-the-exception.test.ts`.
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
 * and two kinds — placed, unplaced, and background.
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
    // Handed over as background — never placed, by construction.
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
  return {
    list: async () => ({ material: rows.map((row) => ({ ...row })) }),
    item: async (uid: string) => ({ ...rows.find((row) => row.uid === uid)!, body: 'About it.' }),
    save: async (uid: string, body: string) => ({ ...rows.find((row) => row.uid === uid)!, body }),
    fileUrl: (uid: string) => `/api/material/file?uid=${encodeURIComponent(uid)}`,
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

/** A mounted Library. It never asks which site is open (REQ-181). */
async function library(rows = PLACEMENT) {
  const transport = transportOver(rows)
  const panel = createLibraryPanel({ storage: memoryStorage(), transport }) as unknown as Panel
  root.append(panel.element)
  await panel.refresh()
  return { panel, transport }
}

const rowsIn = (el: Element) => [...el.querySelectorAll('.list-detail-row')]
const keysIn = (el: Element) => rowsIn(el).map((r) => r.getAttribute('data-key'))
const warnedKeys = (el: Element) =>
  [...el.querySelectorAll('.builder-library__badge--unplaced')].map((b) =>
    b.closest('.list-detail-row')!.getAttribute('data-key'),
  )

/** The stylesheet with its comments removed, so prose about a rule is never read as one. */
const CSS_RULES = CSS.replace(/\/\*[\s\S]*?\*\//g, '')

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Whether one selector (one item of a comma list) styles the element `target`
 * names: it ends in that class, optionally compounded with further classes,
 * attributes or pseudo-CLASSES (a state of the same element) — but not a longer
 * class name that merely starts with it, and not a pseudo-ELEMENT (`::after`
 * styles a different box).
 */
function selects(selector: string, target: string): boolean {
  return new RegExp(
    `${escapeRe(target)}(?:\\.[\\w-]+|\\[[^\\]]*\\]|:(?!:)[\\w-]+(?:\\([^)]*\\))?)*$`,
  ).test(selector.trim())
}

/**
 * EVERY declared block that styles a selector, concatenated — wherever it sits
 * (a comma list, a later override, inside an at-rule) — so a contract cannot be
 * satisfied by the first block and silently undone by a later one.
 */
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

describe.skipIf(!WEBUI_INSTALLED)('AC-2019 — one labelled type icon per row, no kind pill', () => {
  it('test_UAT_AC2019_each_row_leads_with_one_labelled_type_icon_and_carries_no_kind_pill', async () => {
    const { panel } = await library(KINDS)
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

    // No kind pill; the role pill and, on an unplaced site asset, the warning
    // are the only pills a row may carry (REQ-181).
    expect(panel.element.querySelectorAll('.builder-library__badge--kind')).toHaveLength(0)
    // NOT BY ANY NAME. A kind pill renamed to another class, or a kind printed in
    // words anywhere on the row, is still the pill this criterion removed. Every
    // kind word the fixture carries — and the "file" a kind-less row is announced
    // as — is checked against everything a row SHOWS (its text, not the icon's
    // accessible label, which is where the kind is meant to be).
    const KIND_WORDS = /\b(image|document|font|capture|hologram|file)\b/i
    for (const row of rows) {
      const key = row.getAttribute('data-key')
      const content = row.querySelector('.builder-library__row')!
      // Nothing on the row is classed as a kind of anything.
      expect(content.querySelectorAll('[class*="kind"]'), `${key}: kind-classed element`).toHaveLength(0)
      // Every pill is one of the two that remain: the role pill, or the
      // not-on-the-site warning. Never a kind pill, never a placement badge.
      for (const pill of content.querySelectorAll('.builder-library__row-meta > *')) {
        const isRole = pill.classList.contains('builder-library__badge--role')
        const isUnplaced = pill.classList.contains('builder-library__badge--unplaced')
        expect(isRole || isUnplaced, `${key}: unexpected pill ${pill.className}`).toBe(true)
        expect(pill.textContent ?? '', `${key}: pill text`).not.toMatch(KIND_WORDS)
      }
      expect(content.querySelectorAll('.builder-library__badge--here'), `${key}: placement badge`).toHaveLength(0)
      // And no element on the row other than the icon prints a kind.
      for (const node of content.querySelectorAll('*')) {
        if (node.classList.contains('builder-library__row-icon')) continue
        if (node.contains(content.querySelector('.builder-library__row-icon'))) continue
        expect(node.textContent ?? '', `${key}: ${node.className}`).not.toMatch(KIND_WORDS)
      }
      // The icon itself prints a glyph, never the kind's word.
      expect(content.querySelector('.builder-library__row-icon')!.textContent ?? '').not.toMatch(KIND_WORDS)
    }
    expect(panel.element.querySelectorAll('.builder-library__badge--role')).toHaveLength(KINDS.length)
    // The warning sits only on the site-role rows placed nowhere — the placed
    // image and the background document carry the role pill alone.
    expect(warnedKeys(panel.element).sort()).toEqual(['a-capture', 'a-font', 'a-future-kind', 'no-kind'])

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

    // EVERY BLOCK AGREES — not just the first one found. No later rule, override
    // or at-rule turns any of these back: each property, wherever it is declared
    // for that element, has the one value the contract needs.
    expect(values('.builder-library__row', 'display')).toEqual(['flex'])
    for (const v of values('.builder-library__row', 'flex-direction')) expect(v).toMatch(/^row\b/)
    for (const v of values('.builder-library__row', 'flex-flow')) expect(v).not.toMatch(/column|(^|\s)wrap/)
    expect(values('.builder-library__row-title', 'font-size')).toEqual(['13px'])
    expect(values('.builder-library__row-title', 'white-space')).toEqual(['nowrap'])
    expect(values('.builder-library__row-title', 'text-overflow')).toEqual(['ellipsis'])
    expect(values('.builder-library__row-title', 'overflow')).toEqual(['hidden'])
    expect(values('.builder-library__row-title', 'min-width')).toEqual(['0'])
    expect(values('.builder-library__row-title', 'flex')).toEqual(['1 1 auto'])
    expect(values('.builder-library__row-icon', 'flex')).toEqual(['none'])
    expect(values('.builder-library__row-meta', 'flex')).toEqual(['none'])
    for (const sel of ['.builder-library__row-icon', '.builder-library__row-meta']) {
      expect(values(sel, 'flex-shrink').filter((v) => v !== '0'), sel).toEqual([])
      expect(values(sel, 'flex-grow').filter((v) => v !== '0'), sel).toEqual([])
    }
    for (const v of values('.builder-library__row-meta', 'flex-wrap')) expect(v).toBe('nowrap')
    for (const v of values('.builder-library__badge', 'white-space')) expect(v).toBe('nowrap')

    // The shared list component is not restyled here: no rule in the builder
    // stylesheet targets the component's own row title.
    expect(CSS).not.toMatch(/\.list-detail-row-title\s*\{/)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('AC-2020 — the row is laid out icon, then title, then pills', () => {
  it('test_UAT_AC2020_row_dom_order_is_icon_then_title_then_pills', async () => {
    // The flex contract above only puts the row on ONE AXIS; the order along it
    // is the DOM's. Asserted on every row, with and without the warning.
    const { panel } = await library(PLACEMENT)
    const rows = rowsIn(panel.element)
    expect(rows).toHaveLength(PLACEMENT.length)
    for (const row of rows) {
      const key = row.getAttribute('data-key')
      const content = row.querySelector('.builder-library__row')!
      expect(content, `${key}: row content cell`).toBeTruthy()
      expect(
        [...content.children].map((c) =>
          ['builder-library__row-icon', 'builder-library__row-title', 'builder-library__row-meta'].find((cls) =>
            c.classList.contains(cls),
          ) ?? c.className,
        ),
        `${key}: icon, title, pills`,
      ).toEqual(['builder-library__row-icon', 'builder-library__row-title', 'builder-library__row-meta'])
      // Every pill sits in the strip that follows the title, none before it.
      const badges = [...content.querySelectorAll('.builder-library__badge')]
      expect(badges.length, `${key}: at least the role pill`).toBeGreaterThan(0)
      for (const badge of badges) {
        expect(badge.parentElement!.classList.contains('builder-library__row-meta'), `${key}`).toBe(true)
      }
    }
  })
})
