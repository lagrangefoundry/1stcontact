// @vitest-environment jsdom
/**
 * REQ-282 Part 1 — **"not on the site" is a state, not an error**.
 *
 * THE REPORT. *"I see the big red error messages 'Not on the site' with a
 * warning triangle — that is nonsense. A Site asset has to be a POTENTIAL asset
 * — it's not an error if I choose not to use all the photos."*
 *
 * AND THE REPORT IS RIGHT ON THE MECHANICS, NOT ONLY THE TONE. [[REQ-181]]'s
 * predicate read `role === 'site' && placed_on === []` as a FAILED PROMOTION,
 * and it was already false when it was written: [[BUG-47]] had removed the
 * placement it was detecting, so nothing is attempted at upload and `placed_on`
 * is written only when somebody chooses to use the picture. An empty one is
 * therefore the ORDINARY INITIAL STATE of every site upload — and the badge
 * fired on every photograph a client had ever given us, telling them they had
 * asked for something, that it had not arrived, and that they should try again.
 *
 * WHAT IS ASSERTED, in the order the ticket claims it:
 *
 *   1. ONE PILL, ONE WORD. The pill reads the client's own statement of intent
 *      in both states; there is no second badge and no extra row.
 *   2. THE EMPHASIS RUNS THE OTHER WAY. In use is the emphasised state (accent
 *      AND bold); not yet used is the quiet one. That inversion is the whole
 *      correction in one detail.
 *   3. NOT AN ERROR MARK IN ANY REGISTER — no warning glyph, no danger colour,
 *      no sentence telling anybody to try again.
 *   4. THE STATE REACHES EVERY READER. Weight is the second channel, so a
 *      monochrome or colour-blind reader still has it; the `aria-label` carries
 *      it in words for a reader that has neither — and it is NOT a second
 *      visible word.
 *   5. BACKGROUND INFORMATION IS NEVER MARKED IN USE, however unplaced it is.
 */

import fs from 'node:fs'
import path from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const BUILDER = path.resolve(__dirname, '..', 'apps/control-app/src/builder')

let createLibraryPanel: (opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`REQ-282 library suite skipped: ${WEBUI_SKIP_REASON}`)

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
    placed_as: [],
    source_url: null,
    description_status: 'ok',
    description_model: 'stub/vision-1',
    updated_at: '2026-09-18T12:00:00.000Z',
    ...over,
  }
}

/**
 * Three rows: a site picture in use, one not yet used, and background
 * information.
 *
 * THE SECOND IS THE ONE THE OLD BADGE SHOUTED AT, and it is the ordinary case —
 * a photograph the client gave us for their site that nobody has placed on a
 * page yet. Nothing was attempted and nothing went wrong.
 */
const MATERIAL = [
  material({ uid: 'in-use', title: 'The wordmark', filename: 'wordmark.svg', placed_on: ['alpha'] }),
  material({ uid: 'not-yet', title: 'The shopfront', filename: 'shopfront.jpg' }),
  material({
    uid: 'just-to-read',
    title: 'Positioning note',
    filename: 'positioning.md',
    kind: 'document',
    role: 'reference',
    republishable: false,
  }),
]

function transportOver(rows = MATERIAL) {
  return {
    list: async () => ({ material: rows.map((row) => ({ ...row })) }),
    item: async (uid: string) => ({ ...rows.find((row) => row.uid === uid)!, body: 'About it.' }),
    save: async (uid: string, body: string) => ({ ...rows.find((r) => r.uid === uid)!, body }),
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

async function library(rows = MATERIAL) {
  const panel = createLibraryPanel({ storage: memoryStorage(), transport: transportOver(rows) })
  root.append(panel.element)
  await panel.refresh()
  return panel
}

const rowFor = (el: Element, uid: string) =>
  el.querySelector(`.list-detail-row[data-key="${uid}"]`)!
const pillIn = (el: Element, uid: string) =>
  rowFor(el, uid).querySelector('.builder-library__badge--role')!
const badgesIn = (el: Element, uid: string) =>
  [...rowFor(el, uid).querySelectorAll('.builder-library__badge')]

const CSS = () => fs.readFileSync(path.join(BUILDER, 'builder.css'), 'utf8')

/** Comments stripped, so a rule about the code is not satisfied by prose. */
function codeOf(file: string): string {
  return fs
    .readFileSync(path.join(BUILDER, file), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
}

describe.skipIf(!WEBUI_INSTALLED)('REQ-282 — one pill, two treatments', () => {
  it('test_UAT_FC_REQ-282_the_pill_reads_the_same_word_in_both_states_and_there_is_no_second_badge', async () => {
    const panel = await library()

    // CLAIM 1 — the LABEL does not change. The pill says what the client said
    // the file was for, and says it whether or not the picture is in use.
    expect(pillIn(panel.element, 'in-use').textContent).toBe('Site asset')
    expect(pillIn(panel.element, 'not-yet').textContent).toBe('Site asset')

    // AND IT IS THE ONLY BADGE ON THE ROW. *"TBH this is NOT a very valuable
    // thing for the user to know. I do not want to use a lot of real estate on
    // it."* — so it costs exactly the pill that was already there.
    expect(badgesIn(panel.element, 'in-use')).toHaveLength(1)
    expect(badgesIn(panel.element, 'not-yet')).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-282_the_emphasis_is_spent_on_the_picture_that_is_in_use', async () => {
    const panel = await library()

    // CLAIM 2 — the inversion. The USED state is the emphasised one; the unused
    // one is quiet. That is the opposite of what was here, where the unplaced
    // item was the one that shouted.
    expect(pillIn(panel.element, 'in-use').classList.contains('is-placed')).toBe(true)
    expect(pillIn(panel.element, 'not-yet').classList.contains('is-placed')).toBe(false)

    // AND THE TREATMENT IS COLOUR *AND* WEIGHT, which is what keeps the state
    // off colour alone: bold survives a monochrome display, a forced-colours
    // mode and a colour-blind reader. Read off the stylesheet, because that is
    // where the claim actually lives.
    const css = CSS()
    const at = css.indexOf('.builder-library__badge--role.is-placed {')
    expect(at).toBeGreaterThan(-1)
    const rule = css.slice(at, css.indexOf('}', at))
    expect(rule).toContain('--shell-accent')
    expect(rule).toMatch(/font-weight:\s*700/)
    expect(rule).not.toContain('--shell-danger')
  })

  it('test_UAT_FC_REQ-282_nothing_on_the_row_marks_an_error_in_any_register', async () => {
    const panel = await library()

    // CLAIM 3 — no warning glyph, no second string, no sentence telling the
    // client to try again at something nobody attempted.
    expect(panel.element.textContent).not.toContain('Not on the site')
    expect(panel.element.textContent).not.toContain('⚠')
    expect(panel.element.querySelector('.builder-library__badge--unplaced')).toBeNull()
    expect(panel.element.querySelector('.builder-library__warn-glyph')).toBeNull()
    expect(panel.element.querySelector('[title*="did not get there"]')).toBeNull()

    // THE STRINGS AND THE PREDICATE ARE GONE FROM THE CODE, not merely unused:
    // *"recolouring while leaving the predicate meaning 'failure' would leave a
    // false claim in the code and in the hint text, waiting for the next
    // reader."*
    const code = codeOf('library.js')
    expect(code).not.toContain('UNPLACED_LABEL')
    expect(code).not.toContain('UNPLACED_HINT')
    expect(code).not.toContain('WARN_GLYPH')
    expect(code).not.toContain('function unplaced')

    // AND SO IS THE DANGER RULE THE BADGE PAINTED WITH.
    expect(CSS()).not.toContain('.builder-library__badge--unplaced')
  })

  it('test_UAT_FC_REQ-282_the_state_reaches_a_reader_who_gets_neither_colour_nor_weight', async () => {
    const panel = await library()

    // CLAIM 4 — bold is not announced, so the pill says the state in words for
    // a screen reader. Zero pixels, no layout change.
    expect(pillIn(panel.element, 'in-use').getAttribute('aria-label')).toBe(
      'Site asset — in use',
    )
    expect(pillIn(panel.element, 'not-yet').getAttribute('aria-label')).toBe(
      'Site asset — not yet used',
    )

    // AND EXPLICITLY NOT A SECOND VISIBLE WORD. The row still reads one label.
    expect(pillIn(panel.element, 'not-yet').textContent).not.toContain('not yet')
    expect(panel.element.textContent).not.toContain('not yet used')
  })

  it('test_UAT_FC_REQ-282_background_information_is_never_marked_in_use_however_unplaced', async () => {
    const panel = await library()

    // CLAIM 5 — a reference row's `placed_on` is empty by construction, and it
    // reads as the quiet state rather than as anything to be told about. It was
    // never going on the site; there is nothing here that failed.
    const note = pillIn(panel.element, 'just-to-read')
    expect(note.textContent).toBe('Background information')
    expect(note.classList.contains('is-placed')).toBe(false)
    expect(note.getAttribute('aria-label')).toBe('Background information — not yet used')
  })
})
