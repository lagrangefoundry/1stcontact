// @vitest-environment jsdom
/**
 * REQ-176 — **a type icon, a one-line row, and the wording clients read**.
 *
 * WHY ONE SUITE FOR THREE CHANGES. They are one change wearing three hats: the
 * icon exists so the row fits on one line, the one-line row exists because the
 * `kind` pill was spending a row's width restating what a picture says, and the
 * wording travels through the same constant the role pill on that row derives
 * from. Splitting them would assert three halves of one statement.
 *
 * WHAT IS ASSERTED AND WHAT DELIBERATELY IS NOT. This proves what the DOM says:
 * an icon on every row including the kinds nobody uploads, no `kind` pill, the
 * title sized like the component's own rows, and one constant reaching both the
 * overlay and the Library. It does NOT assert rendered geometry — jsdom computes
 * no layout, so "one line" is proven by the CSS contract that produces it (a row
 * axis, a title that may shrink and ellipse, pills that may not) rather than by
 * measuring a box that jsdom would report as zero either way.
 *
 * THE MANUAL IS IN HERE BECAUSE THE RENAME REACHES IT. The assistant's own
 * surface tells a client to drop a file and *choose the area by name*; rename
 * the area and that instruction sends them looking for a button that is not
 * there. So the note is asserted against the constant, not against a literal,
 * and the two can no longer drift.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createLibraryPanel: (opts?: Record<string, unknown>) => never
let createUploadOverlay: (spec?: Record<string, unknown>) => never
let UPLOAD_AREAS: Array<{ id: string; label: string; hint: string }>
let UPLOAD_PROMPT: string

if (!WEBUI_INSTALLED) console.warn(`REQ-176 library suite skipped: ${WEBUI_SKIP_REASON}`)

const repo = (...parts: string[]) => path.resolve(__dirname, '..', ...parts)

const CSS = readFileSync(repo('apps/control-app/src/builder/builder.css'), 'utf8')
const SURFACE = readFileSync(repo('tools/generate/src/cli/ai/l1-surface.json'), 'utf8')

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
    updated_at: '2026-09-02T12:00:00.000Z',
    ...over,
  }
}

/**
 * One row per kind DOC-38 §9 names, plus one for a kind it does not.
 *
 * THE LAST TWO ARE THE POINT OF THE FALLBACK. `capture` is a real §9 value that
 * no client uploads, and `hologram` stands in for whatever §9 adds after this
 * map was written — the map is partial by design, so both have to land on a
 * glyph rather than on nothing.
 */
const MATERIAL = [
  material({ uid: 'an-image', title: 'The wordmark', filename: 'wordmark.png', kind: 'image' }),
  material({
    uid: 'a-document',
    title: 'Positioning note',
    filename: 'positioning.md',
    kind: 'document',
    role: 'reference',
  }),
  material({ uid: 'a-font', title: 'Plex Sans', filename: 'plex.woff2', kind: 'font' }),
  material({ uid: 'a-capture', title: 'The old shopfront', filename: 'capture.json', kind: 'capture' }),
  material({ uid: 'a-future-kind', title: 'Something new', filename: 'new.bin', kind: 'hologram' }),
]

function transportOver(rows = MATERIAL) {
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
    ;({ createUploadOverlay } = await import('../apps/control-app/src/builder/upload.js'))
  }
  ;({ UPLOAD_AREAS, UPLOAD_PROMPT } = await import('../apps/control-app/src/builder/config.js'))
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

async function library(site = 'alpha') {
  const panel = createLibraryPanel({
    storage: memoryStorage(),
    transport: transportOver(),
    getSite: () => site,
  })
  root.append(panel.element)
  await panel.refresh()
  return panel
}

/** The declared block for a selector, so a rule can be read as a contract. */
function rule(selector: string): string {
  const at = CSS.indexOf(`${selector} {`)
  expect(at, `no rule for ${selector}`).toBeGreaterThan(-1)
  return CSS.slice(at, CSS.indexOf('}', at))
}

describe.skipIf(!WEBUI_INSTALLED)('REQ-176 — the Library row', () => {
  it('test_UAT_FC_REQ_176_every_row_opens_with_a_type_icon_including_the_kinds_nobody_uploads', async () => {
    const panel = await library()
    const rows = [...panel.element.querySelectorAll('.list-detail-row')]
    expect(rows).toHaveLength(MATERIAL.length)

    // EVERY row, and exactly one each. An iconless row reads as a rendering
    // fault, so the fallback is not allowed to be "nothing".
    for (const row of rows) {
      const icons = row.querySelectorAll('.builder-library__row-icon')
      expect(icons).toHaveLength(1)
      expect(icons[0].textContent?.trim()).not.toBe('')
    }

    const iconFor = (uid: string) =>
      panel.element
        .querySelector(`.list-detail-row[data-key="${uid}"] .builder-library__row-icon`)!
        .textContent

    // THE THREE A CLIENT UPLOADS ARE DISTINCT. A font is a real kind here —
    // `describeFont` reads SFNT name tables and the site-asset hint says
    // "Photos, logos, fonts" — so it is not allowed to share the document glyph.
    const named = ['an-image', 'a-document', 'a-font'].map(iconFor)
    expect(new Set(named).size).toBe(3)

    // AND THE TWO THE MAP DOES NOT NAME SHARE THE FALLBACK, rather than each
    // needing an entry before it can render.
    expect(iconFor('a-capture')).toBe(iconFor('a-future-kind'))
  })

  it('test_UAT_FC_REQ_176_the_icon_still_says_the_kind_to_a_screen_reader', async () => {
    // The pill was the only place the row said its type IN WORDS. Replacing it
    // with a glyph moves that fact; it may not delete it.
    const panel = await library()
    const icon = panel.element.querySelector(
      '.list-detail-row[data-key="a-font"] .builder-library__row-icon',
    )!
    expect(icon.getAttribute('role')).toBe('img')
    expect(icon.getAttribute('aria-label')).toBe('font')
  })

  it('test_UAT_FC_REQ_176_no_row_carries_a_kind_pill_and_the_other_pills_remain', async () => {
    const panel = await library()
    expect(panel.element.querySelectorAll('.builder-library__badge--kind')).toHaveLength(0)

    // The icon REPLACED the kind pill; it did not replace the row's meta. The
    // role pill and the placement badge are still the row's other two facts.
    const placed = await (async () => {
      const p = createLibraryPanel({
        storage: memoryStorage(),
        transport: transportOver([material({ uid: 'here', title: 'Logo', filename: 'l.png', placed_on: ['alpha'] })]),
        getSite: () => 'alpha',
      })
      root.append(p.element)
      await p.refresh()
      return p
    })()
    expect(placed.element.querySelectorAll('.builder-library__badge--role')).toHaveLength(1)
    expect(placed.element.querySelectorAll('.builder-library__badge--here')).toHaveLength(1)
  })
})

describe('REQ-176 — the row is one line, and truncation lands on the title', () => {
  it('test_UAT_FC_REQ_176_the_row_lays_out_on_one_axis_with_the_title_taking_the_space', () => {
    const row = rule('.builder-library__row')
    // The row used to be `flex-direction: column` — title above, pills below.
    expect(row).not.toMatch(/flex-direction:\s*column/)
    expect(row).toMatch(/display:\s*flex/)

    // The title is the only thing here that can be cut and still read, so it is
    // the only thing allowed to shrink — and it ellipses rather than wrapping.
    const title = rule('.builder-library__row-title')
    expect(title).toMatch(/flex:\s*1 1 auto/)
    expect(title).toMatch(/min-width:\s*0/)
    expect(title).toMatch(/text-overflow:\s*ellipsis/)
    expect(title).toMatch(/white-space:\s*nowrap/)
  })

  it('test_UAT_FC_REQ_176_pills_keep_their_width_and_never_wrap', () => {
    // A half-rendered pill reads as a bug rather than as a name that was too
    // long, so the meta strip may neither wrap onto a second line nor shrink.
    const meta = rule('.builder-library__row-meta')
    expect(meta).toMatch(/flex:\s*none/)
    expect(meta).not.toMatch(/flex-wrap:\s*wrap/)
    expect(rule('.builder-library__row-icon')).toMatch(/flex:\s*none/)
  })

  it('test_UAT_FC_REQ_176_the_row_title_is_sized_like_the_components_own_rows', () => {
    // `renderRow` owns the whole content cell and builds its own title span, so
    // it inherited the shell's body size and made the Library the one list in
    // the builder with a larger row title. 13px is `.list-detail-row-title`.
    // Set HERE and not in `webui-list-detail`, which other hosts share.
    expect(rule('.builder-library__row-title')).toMatch(/font-size:\s*13px/)
  })
})

describe('REQ-176 — the wording', () => {
  it('test_UAT_FC_REQ_176_the_overlay_asks_purpose_and_names_its_two_areas_plainly', () => {
    expect(UPLOAD_PROMPT).toBe('Purpose')
    expect(UPLOAD_AREAS.map((a) => a.label)).toEqual(['Site asset', 'Background information'])

    // THE WIRE VOCABULARY DID NOT MOVE. `site` and `reference` are what the
    // ingestion route validates against; only the copy is provisional.
    expect(UPLOAD_AREAS.map((a) => a.id)).toEqual(['site', 'reference'])

    // The hints are unchanged, and the second one is the load-bearing promise a
    // shorter label leans on MORE, not less.
    expect(UPLOAD_AREAS[1].hint).toMatch(/won't appear on your site/i)
  })

  it.skipIf(!WEBUI_INSTALLED)('test_UAT_FC_REQ_176_the_overlay_and_the_library_role_pill_read_identically', async () => {
    // ONE CONSTANT, TWO SURFACES. `ROLE_LABEL` derives the pill from the same
    // areas the overlay draws, which is exactly what that derivation is for —
    // renaming an area may not leave the Library describing the same file by a
    // name the client was never shown.
    const overlay = createUploadOverlay({ host: root, onUpload: () => {} })
    root.append(overlay.element)
    const shown = [...overlay.element.querySelectorAll('.builder-upload__label')].map(
      (n) => n.textContent,
    )
    expect(shown).toEqual(UPLOAD_AREAS.map((a) => a.label))
    expect(overlay.element.querySelector('.builder-upload__prompt')!.textContent).toBe(UPLOAD_PROMPT)

    const panel = await library()
    const pills = [...panel.element.querySelectorAll('.builder-library__badge--role')].map(
      (n) => n.textContent,
    )
    expect(new Set(pills)).toEqual(new Set(['Site asset', 'Background information']))
  })

  it('test_UAT_FC_REQ_176_the_assistants_manual_names_the_area_the_client_will_actually_see', () => {
    // The absence note tells a client to drop a file and choose the area BY
    // NAME. Asserted against the constant rather than a literal, because a note
    // quoting a button that no longer exists sends them hunting for it.
    expect(SURFACE).toContain(UPLOAD_AREAS[0].label)
    expect(SURFACE).not.toContain('Put it on the site')
  })
})
