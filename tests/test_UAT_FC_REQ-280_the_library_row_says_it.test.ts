// @vitest-environment jsdom
/**
 * [[REQ-280]] — **the operator's half of the shared name**.
 *
 * THE TICKET'S OWN SCREENSHOT. Three generated variants of one prompt, listed
 * under one title: the operator saw three rows that read the same, and had
 * nothing to type and nothing to say that would single one out. The consultant's
 * half is proved by the two suites beside this one; this is the half a person
 * looks at.
 *
 * WHAT IS ASSERTED. What the DOM says — the number is drawn on the row, it is
 * what tells three identical titles apart, the filter finds a row by it, and the
 * detail pane says what to call the item you are looking at. What is NOT
 * asserted is geometry: jsdom computes no layout, so *"it does not push the
 * title off the row"* is proved by the CSS contract that produces it — the same
 * treatment [[REQ-176]]'s suite gives the row it shares.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createLibraryPanel: (opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`REQ-280 library suite skipped: ${WEBUI_SKIP_REASON}`)

const repo = (...parts: string[]) => path.resolve(__dirname, '..', ...parts)
const CSS = readFileSync(repo('apps/control-app/src/builder/builder.css'), 'utf8')

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
    origin: 'generated',
    placed_on: [],
    source_url: null,
    description_status: 'ok',
    updated_at: '2026-09-18T12:00:00.000Z',
    ...over,
  }
}

/** The ticket's own three rows: one title, three pictures, three numbers. */
const CRUCIBLES = [
  material({
    uid: 'material-3328dff9',
    label: 'IMAGE-3',
    title: 'A crucible of molten metal leaning forward to pour',
    filename: 'crucible-a.png',
  }),
  material({
    uid: 'material-de9ac4ed',
    label: 'IMAGE-4',
    title: 'A crucible of molten metal leaning forward to pour',
    filename: 'crucible-b.png',
  }),
  material({
    uid: 'material-bd70d8d9',
    label: 'IMAGE-5',
    title: 'A crucible of molten metal leaning forward to pour',
    filename: 'crucible-c.png',
  }),
]

function transportOver(rows: Record<string, unknown>[]) {
  return {
    list: async () => ({ material: rows.map((row) => ({ ...row })) }),
    item: async (uid: string) => ({ ...rows.find((row) => row.uid === uid)!, body: 'About it.' }),
    save: async (uid: string, body: string) => ({ ...rows.find((row) => row.uid === uid)!, body }),
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

async function library(rows = CRUCIBLES) {
  const panel = createLibraryPanel({ storage: memoryStorage(), transport: transportOver(rows) })
  root.append(panel.element)
  await panel.refresh()
  return panel
}

const rowKeys = (panel: { element: HTMLElement }) =>
  [...panel.element.querySelectorAll('.list-detail-row')].map((row) =>
    row.getAttribute('data-key'),
  )

describe.skipIf(!WEBUI_INSTALLED)('REQ-280 — the number is on the row', () => {
  it('test_UAT_FC_REQ-280_three_rows_that_read_alike_are_told_apart_by_their_numbers', async () => {
    const panel = await library()
    const titles = [...panel.element.querySelectorAll('.builder-library__row-title')].map(
      (el) => el.textContent,
    )
    // THE PREMISE, ASSERTED SO NOTHING BELOW PASSES VACUOUSLY: the titles really
    // are identical, which is what the operator was looking at.
    expect(new Set(titles).size).toBe(1)

    const labels = [...panel.element.querySelectorAll('.builder-library__row-label')].map(
      (el) => el.textContent,
    )
    expect(labels).toEqual(['IMAGE-3', 'IMAGE-4', 'IMAGE-5'])
  })

  it('test_UAT_FC_REQ-280_a_row_with_no_number_yet_draws_no_empty_cell', async () => {
    // Material that predates the label is given one by the next listing, so the
    // gap closes itself — and an empty box would be the only lasting trace of a
    // state that is about to stop existing.
    const panel = await library([material({ uid: 'older', title: 'The wordmark', filename: 'w.png' })])
    expect(panel.element.querySelectorAll('.builder-library__row-label')).toHaveLength(0)
    expect(panel.element.querySelector('.builder-library__row-title')?.textContent).toBe(
      'The wordmark',
    )
  })

  it('test_UAT_FC_REQ-280_typing_the_number_the_consultant_said_finds_the_row', async () => {
    // THE OTHER HALF OF THE SHARED REFERENCE. The consultant says *"IMAGE-5"*;
    // the operator types it into the box above their own Library and lands on
    // the row. Without this the number is readable and unsearchable, which on a
    // list of identically-titled rows is most of the way back to where we were.
    const panel = await library()
    const search = panel.element.querySelector('input[type="search"], input') as HTMLInputElement
    search.value = 'IMAGE-5'
    search.dispatchEvent(new Event('input', { bubbles: true }))

    expect(rowKeys(panel)).toEqual(['material-bd70d8d9'])
  })

  it('test_UAT_FC_REQ-280_the_detail_pane_says_what_to_call_the_thing_you_are_looking_at', async () => {
    // A client who has opened one item is exactly the person about to say its
    // name to somebody else, so the record block is where the number belongs —
    // read-only, like everything else in that block that was not theirs to set.
    const panel = await library()
    const row = panel.element.querySelector(
      '.list-detail-row[data-key="material-de9ac4ed"]',
    ) as HTMLElement
    row.click()
    await Promise.resolve()

    const cell = panel.element.querySelector('.fields-row[data-field="label"] .fields-value')
    expect(cell?.textContent).toBe('IMAGE-4')
    // NOT EDITABLE. A number the client could type over would stop being a
    // reference the moment they did.
    expect(panel.element.querySelector('.fields-row[data-field="label"] input')).toBeNull()
  })
})

describe('REQ-280 — the number keeps its shape while the title takes the space', () => {
  it('test_UAT_FC_REQ-280_the_number_neither_shrinks_nor_wraps', () => {
    // The row is one line and the ONE shrinkable thing on it is the title
    // ([[REQ-176]]). A number that ellipsed to `IMA…` would not be something
    // anybody could say, which is the whole point of having one.
    const at = CSS.indexOf('.builder-library__row-label {')
    expect(at, 'no rule for .builder-library__row-label').toBeGreaterThan(-1)
    const rule = CSS.slice(at, CSS.indexOf('}', at))
    expect(rule).toMatch(/flex:\s*none/)
    expect(rule).toMatch(/white-space:\s*nowrap/)
  })
})
