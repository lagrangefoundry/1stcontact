// @vitest-environment jsdom
/**
 * REQ-181 — **badge the exception, not the rule**.
 *
 * THE MODEL THIS FOLLOWS FROM. A business holds ONE site in v1, so a material is
 * either this business's or it is not, and "on a different site of the same
 * client" is a state that cannot be constructed. The pill that said *On this
 * site* therefore fired on nearly every site-role row and told the client
 * nothing — while the one case they would actually want to be told about, a
 * promotion that failed and left the file behind, was rendered identically to
 * one that worked. This suite is that inversion.
 *
 * SUPERSEDED IN PART BY [[REQ-282]], AND THE SPLIT IS WORTH STATING. This
 * ticket made two arguments and only one of them survived. The PREDICATE —
 * that an unplaced site-role row is a failed promotion — was already false when
 * it was written: [[BUG-47]] had removed the placement it was detecting, so the
 * warning fired on every photograph a client had ever given us. Its cases live
 * in `test_UAT_FC_REQ-282_a_state_not_an_error`, inverted. What SURVIVES is
 * everything below: the placement pill is still gone, the filter axis is still
 * gone, and the Library still cannot ask which site is open.
 *
 * WHAT IS ASSERTED here now:
 *
 *   1. NO ROW SHOWS A "on this site" PLACEMENT PILL.
 *   2. THERE IS NO "used on this site" FILTER, and text, role and kind still
 *      narrow the list.
 *   3. THE LIBRARY NEVER READS WHICH SITE IS OPEN. This is the correctness check
 *      on the whole change rather than a style rule: under one site per business
 *      there is nothing for it to ask, so a module that still asks has kept a
 *      dimension the model removed.
 *   4. A BUSINESS SWITCH LEAVES NO ROW FROM THE PREVIOUS BUSINESS ON SCREEN —
 *      including when the re-read fails, which is the path the host is allowed
 *      to swallow.
 *
 * MOUNTED AGAINST THE REAL COMPONENTS AND, FOR CLAIM 5, THE REAL BUILDER. The
 * switch is driven through the control an operator uses; a stand-in for the
 * shell would prove the stand-in.
 */

import fs from 'node:fs'
import path from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const BUILDER = path.resolve(__dirname, '..', 'apps/control-app/src/builder')

let createLibraryPanel: (opts?: Record<string, unknown>) => never
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Record<string, any>

if (!WEBUI_INSTALLED) console.warn(`REQ-181 library suite skipped: ${WEBUI_SKIP_REASON}`)

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
    updated_at: '2026-09-03T12:00:00.000Z',
    ...over,
  }
}

/**
 * Three rows: the rule, the exception, and the row that is neither.
 *
 * THE THIRD IS WHY THE PREDICATE IS TWO FACTS AND NOT ONE. Background
 * information also has an empty `placed_on`, and always will — `placeOnSite`
 * returns early unless the role is `site` — so a warning keyed on placement
 * alone would fire on every reference document the client ever uploads.
 */
const MATERIAL = [
  material({ uid: 'landed', title: 'The wordmark', filename: 'wordmark.svg', placed_on: ['alpha'] }),
  material({ uid: 'never-got-there', title: 'The shopfront', filename: 'shopfront.jpg' }),
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

/**
 * A mounted Library.
 *
 * NO `getSite`, AND THAT IS PART OF THE EVIDENCE. Every other Library suite used
 * to hand one in; if the pane still needed it, these cases would fail rather
 * than quietly render against `null`.
 */
async function library(rows = MATERIAL) {
  const panel = createLibraryPanel({ storage: memoryStorage(), transport: transportOver(rows) })
  root.append(panel.element)
  await panel.refresh()
  return panel
}

const rowsIn = (el: Element) => [...el.querySelectorAll('.list-detail-row')]
const titlesIn = (el: Element) => rowsIn(el).map((r) => r.textContent ?? '')

/** Comments stripped, so a rule about the code is not satisfied by prose. */
function codeOf(file: string): string {
  return fs
    .readFileSync(path.join(BUILDER, file), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
}

describe.skipIf(!WEBUI_INSTALLED)('REQ-181 — the row stops restating the rule', () => {
  it('test_UAT_FC_REQ-181_no_row_claims_to_be_on_this_site', async () => {
    const panel = await library()
    expect(rowsIn(panel.element)).toHaveLength(3)

    // THE PILL IS GONE. Under one site per business it was true of the normal
    // case and therefore said nothing — a separate badge restating what the role
    // already promised. What replaced it is not a second pill either: [[REQ-282]]
    // puts the state on the ROLE pill as colour and weight, at no extra width.
    expect(panel.element.querySelectorAll('.builder-library__badge--here')).toHaveLength(0)
    expect(panel.element.textContent).not.toContain('On this site')
  })

})

describe.skipIf(!WEBUI_INSTALLED)('REQ-181 — the filter loses the axis that degenerated', () => {
  it('test_UAT_FC_REQ-181_there_is_no_used_on_this_site_filter_and_the_rest_still_narrow', async () => {
    const panel = await library()

    // GONE — the checkbox, its label, and the words on it. Under one site per
    // business it meant "site assets whose promotion worked", which is the role
    // filter for the rule and the warning above for the exception.
    expect(panel.element.querySelector('.builder-library__here')).toBeNull()
    expect(panel.element.textContent).not.toContain('Used on this site')

    // THE OTHER THREE ARE UNTOUCHED. Removing an axis may not quietly remove the
    // ones that still mean something.
    const select = (cls: string) => panel.element.querySelector(cls) as HTMLSelectElement
    const change = (el: HTMLElement) => el.dispatchEvent(new Event('change'))

    select('.builder-library__role').value = 'reference'
    change(select('.builder-library__role'))
    expect(titlesIn(panel.element)).toEqual([expect.stringContaining('Positioning note')])

    select('.builder-library__role').value = ''
    change(select('.builder-library__role'))
    select('.builder-library__kind').value = 'image'
    change(select('.builder-library__kind'))
    expect(rowsIn(panel.element)).toHaveLength(2)

    select('.builder-library__kind').value = ''
    change(select('.builder-library__kind'))
    const search = panel.element.querySelector('.builder-library__search') as HTMLInputElement
    search.value = 'shopfront'
    search.dispatchEvent(new Event('input'))
    expect(titlesIn(panel.element)).toEqual([expect.stringContaining('The shopfront')])
  })

  it('test_UAT_FC_REQ-181_the_rights_record_still_holds_the_placement_under_its_own_name', async () => {
    // THE FULL FACT BELONGS IN THE DETAIL, which is why dropping the pill is not
    // dropping the information. It is a LIST there, because v2 restores the
    // multiplicity and a scalar would be a migration to undo.
    const panel = await library()
    panel.listDetail.select('landed')
    await settle()

    const row = panel.element.querySelector('.fields-row[data-field="placed_on"]')!
    expect(row.textContent).toContain('alpha')
    // `Used on` described usage; a draft asset is not in use by anyone until the
    // client publishes. The field says where the bytes went, so it is named for
    // that (a truthful "live on the site" mark is a read against published state
    // and is deliberately not this ticket).
    expect(row.textContent).toContain('Placed on')
    expect(row.textContent).not.toContain('Used on')
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-181 — the Library no longer knows about the site', () => {
  it('test_UAT_FC_REQ-181_the_library_reads_no_site_anywhere', () => {
    // THE CORRECTNESS CHECK ON THE WHOLE CHANGE. The badge and the filter were
    // the only two things that needed the open site; with both gone there is
    // nothing left for this module to ask, and a route back to asking is a
    // dimension the scope model removed being quietly reintroduced.
    const code = codeOf('library.js')
    expect(code).not.toContain('getSite')
    expect(code).not.toContain('placedHere')
    expect(code).not.toContain('hereOnly')
    expect(code).not.toContain('siteChanged')

    // Non-vacuity: the module really is the Library and really was read.
    expect(code).toContain('createLibraryPanel')

    // …and the host stopped calling the hook rather than keeping a no-op.
    expect(codeOf('app.js')).not.toContain('siteChanged')
  })

  it('test_UAT_FC_REQ-181_switching_business_leaves_no_row_from_the_previous_one', async () => {
    // THE ONE CORRECTNESS FIX IN THE TICKET, driven through the control an
    // operator uses. The old hook re-filtered a list it assumed was business-wide
    // in the sense of "all of them"; once the selector switches BUSINESSES that
    // assumption puts one client's material under another client's name.
    const MATERIAL_OF: Record<string, Array<Record<string, unknown>>> = {
      acct_salon: [material({ uid: 'salon-1', title: 'Salon awning', filename: 'awning.jpg' })],
      acct_studio: [material({ uid: 'studio-1', title: 'Studio reel', filename: 'reel.jpg' })],
    }
    let business = 'acct_salon'
    let failNext = false

    const app = mountBuilder(root, {
      businesses: [
        { id: 'acct_salon', name: 'Salon', selectable: true },
        { id: 'acct_studio', name: 'Studio', selectable: true },
      ],
      account: { name: 'Sam', email: 'sam@example.test' },
      storage: memoryStorage(),
      loadSites: async (id: string | null) => {
        business = id ?? 'acct_salon'
        return [{ site: `${business}-site`, latest: 1 }]
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
        item: async () => ({ body: '' }),
        save: async () => ({}),
        fileUrl: (uid: string) => `/api/material/file?uid=${uid}`,
      },
    })
    await settle()
    expect(app.library.element.textContent).toContain('Salon awning')

    const select = root.querySelector('.builder-business__select') as HTMLSelectElement
    select.value = 'acct_studio'
    select.dispatchEvent(new Event('change'))
    await settle()

    // THE LIST IS THE NEW BUSINESS'S, not the old one re-filtered.
    expect(app.library.element.textContent).toContain('Studio reel')
    expect(app.library.element.textContent).not.toContain('Salon awning')

    // AND A FAILED RE-READ SHOWS NOTHING RATHER THAN THE LAST BUSINESS. The host
    // swallows this error deliberately — a listing failure is not a failure to
    // run — so the rows have to be dropped BEFORE the fetch, not after it works.
    failNext = true
    select.value = 'acct_salon'
    select.dispatchEvent(new Event('change'))
    await settle()
    expect(app.library.element.textContent).not.toContain('Studio reel')
    expect(app.library.element.textContent).not.toContain('Salon awning')
  })
})
