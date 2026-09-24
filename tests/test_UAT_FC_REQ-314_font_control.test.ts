// @vitest-environment jsdom
/**
 * [[REQ-314]] — the editor's font control: thirty curated faces, and a query box
 * that reaches the whole mirror.
 *
 * REAL EVERYTHING EXCEPT THE FONT BYTES, on the pattern the REQ-133 palette
 * suite established. The site is a real draft on disk, the origin is the real
 * builder Worker route table, the transport is the real `api.js`, the picker is
 * the real popup module and the binding runs through the real `editCopySet` —
 * which reaches `use_font`'s own `resolveFont`/`mergeFontFaces`. What is
 * synthesised is `fonts/platform.json` and the staged `woff2` files, because the
 * mirror is a build product this repository deliberately does not carry (see
 * `tests/fixtures/font-mirror.ts`); every family in it is lifted from the
 * repository's own committed catalogue, with its real category and stroke.
 *
 * WHAT THE SUITE IS SHAPED TO CATCH.
 *
 *  - **The shortlist is an affordance, never a gate.** Two tests attack it from
 *    opposite sides: a family outside the thirty must be reachable through the
 *    query box and bindable, and the assistant's own path must be untouched by
 *    the file the shortlist lives in.
 *  - **One binding mechanism, not two.** The binding test asserts on the page
 *    definition — the `resources.fonts` entries AND the run's painted stack —
 *    rather than on the request succeeding, because a control that posted a
 *    family name and wrote nothing but an axis would pass every test that only
 *    checked the response.
 *  - **Typing costs nothing.** The face-loading test supplies a real
 *    `IntersectionObserver` (jsdom has none) and counts injected `@font-face`
 *    rules, so "only visible curated rows are fetched, and typing fetches none"
 *    is measured rather than asserted.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { cmdNew, startBuilder, type BuilderHandle } from '../tools/generate/src/cli'
import { openFontPopup } from '../apps/control-app/src/builder/font-popup.js'
import { isFontField, mountFontField } from '../apps/control-app/src/builder/font-field.js'
import { fetchCopy, fetchFonts, saveCopy } from '../apps/control-app/src/builder/api.js'
import {
  CURATED_FAMILIES,
  FONT_LIST_LIMIT,
  UNSERVED_FAMILIES,
  browseCorpus,
} from '../tools/generate/src/fonts/shortlist'
import { buildIndex } from '../tools/generate/src/fonts/index-build'
import { resolveFont } from '../tools/generate/src/cli/ai/platform-fonts'
import { copyFieldsOf } from '../packages/site-schema/src/l1/edit'
import { repoCatalogue, seedFontMirror } from './fixtures/font-mirror'
import type { L1Node } from '@1stcontact/site-schema'

/**
 * The families the fixture mirror holds.
 *
 * THE CURATED THIRTY, plus the families the matching rules are stated in terms
 * of — `Ar` must find Archivo, Arimo and Arvo and must NOT find Cardo; `Mono`
 * must find Roboto Mono, JetBrains Mono and Space Mono — plus enough `Noto …`
 * families to push a query past the thirty-row cap, which is the only way to
 * assert that the cap is reported rather than applied silently.
 */
const EXTRA_FAMILIES = [
  'Arimo',
  'Cardo',
  'Roboto Mono',
  'Space Mono',
  'Open Sans',
  'Lato',
  'Merriweather',
  'Tinos',
  'Cousine',
]

/** Every `Noto …` family the catalogue carries, capped — the cap fixture. */
function notoFamilies(): string[] {
  return repoCatalogue()
    .filter((f) => f.family.startsWith('Noto ') && f.licence === 'OFL-1.1')
    .slice(0, 45)
    .map((f) => f.family)
}

function draftPath(cwd: string, slug: string, ...rest: string[]): string {
  return path.join(cwd, 'storage', 'sandbox', slug, 'draft', ...rest)
}

/** One page with one text run, which is the segment every test edits. */
function seedSite(cwd: string, slug: string, axes: Record<string, unknown>): void {
  const homePath = draftPath(cwd, slug, 'pages', 'home.json')
  const home = JSON.parse(fs.readFileSync(homePath, 'utf8'))
  const root: L1Node = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [{ kind: 'text', id: 'headline', text: 'We fix boilers.', axes } as L1Node],
  }
  home.l1 = { ...(home.l1 as Record<string, unknown>), root }
  fs.writeFileSync(homePath, JSON.stringify(home, null, 2))
}

function readHome(cwd: string, slug: string): Record<string, any> {
  return JSON.parse(fs.readFileSync(draftPath(cwd, slug, 'pages', 'home.json'), 'utf8'))
}

/** The browser's own URL resolution, so the real `api.js` reaches the real origin. */
function bindFetch(originUrl: string): () => void {
  const real = globalThis.fetch
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) =>
    real(
      typeof input === 'string' ? (new URL(input, originUrl) as URL) : (input as URL),
      init,
    )) as typeof fetch
  return () => {
    globalThis.fetch = real
  }
}

/** The address of the one text run: root, then its first child. */
const RUN = '0.0'

describe('REQ-314 the editor font control', () => {
  let cwd: string
  let bare: string
  let builder: BuilderHandle
  let bareBuilder: BuilderHandle
  let unbindFetch: () => void
  let host: HTMLElement

  beforeAll(async () => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'req314-'))
    cmdNew('acme', { cwd, sandbox: true })
    seedSite(cwd, 'acme', { fontSizePx: 32, fontWeight: 700 })
    seedFontMirror(cwd, [...CURATED_FAMILIES, ...EXTRA_FAMILIES, ...notoFamilies()])
    builder = await startBuilder({ cwd, sandbox: true })
    unbindFetch = bindFetch(builder.url)

    // A SECOND WORKSPACE WITH NO MIRROR AT ALL, which is not an error state: the
    // font bytes are a build product and a fresh checkout has none. It gets its
    // own origin because that absence has to be answered by the real route.
    bare = fs.mkdtempSync(path.join(os.tmpdir(), 'req314-bare-'))
    cmdNew('acme', { cwd: bare, sandbox: true })
    seedSite(bare, 'acme', { fontSizePx: 32 })
    bareBuilder = await startBuilder({ cwd: bare, sandbox: true })
  }, 240000)

  afterAll(async () => {
    unbindFetch?.()
    await builder?.close()
    await bareBuilder?.close()
    fs.rmSync(cwd, { recursive: true, force: true })
    fs.rmSync(bare, { recursive: true, force: true })
  })

  beforeEach(() => {
    document.body.replaceChildren()
    host = document.createElement('div')
    document.body.append(host)
  })

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).IntersectionObserver
  })

  // ── the picker ─────────────────────────────────────────────────────────────

  /** Open the real popup against the real origin, and wait for its first paint. */
  async function openPicker(
    extra: Record<string, unknown> = {},
  ): Promise<{ answer: Promise<string | null> }> {
    const answer = openFontPopup({
      host,
      loadCorpus: () => fetchFonts(),
      previewBase: 'http://origin.test/preview/acme/draft/index.html',
      ...extra,
    }) as Promise<string | null>
    for (let i = 0; i < 400; i += 1) {
      if (host.querySelector('.builder-font__row, .builder-font__status')?.textContent) break
      await new Promise((r) => setTimeout(r, 5))
    }
    return { answer }
  }

  const rows = () => [...host.querySelectorAll<HTMLElement>('.builder-font__row')]
  const rowNames = () => rows().map((r) => r.dataset.family ?? '')
  const search = () => host.querySelector<HTMLInputElement>('.builder-font__search')!
  const statusText = () => host.querySelector<HTMLElement>('.builder-font__status')?.textContent ?? ''
  const nameEl = (row: HTMLElement) => row.querySelector<HTMLElement>('.builder-font__name')!

  function type(text: string): void {
    search().value = text
    search().dispatchEvent(new Event('input', { bubbles: true }))
  }

  function chip(label: string): HTMLButtonElement {
    const found = [...host.querySelectorAll<HTMLButtonElement>('.builder-font__chip')].find(
      (c) => c.textContent === label,
    )
    if (!found) throw new Error(`no chip labelled "${label}"`)
    return found
  }

  function faceRules(): string[] {
    const sheet = host.querySelector('style[data-font-preview]')
    return (sheet?.textContent ?? '').split('@font-face').slice(1)
  }

  it('test_UAT_FC_REQ_314_empty_query_shows_the_curated_thirty_in_their_own_faces', async () => {
    await openPicker()

    // The curated default, in the authored order — popularity, not the
    // alphabet, which is the order a query switches to.
    expect(rowNames()).toEqual([...CURATED_FAMILIES])
    expect(rowNames().length).toBe(FONT_LIST_LIMIT)

    // EACH WRITTEN IN ITS OWN FACE. A font control that names fonts in a UI font
    // is asking somebody to choose a typeface from a list of words.
    for (const row of rows()) {
      expect(nameEl(row).style.fontFamily).toContain(`"${row.dataset.family}"`)
    }

    // The query box is present and focusable the moment the dialog opens —
    // reaching the full mirror takes no discovery, no toggle and no second
    // screen.
    expect(search()).toBeTruthy()
    expect(document.activeElement).toBe(search())
    expect(statusText()).toMatch(/type to search all \d+/i)
  })

  it('test_UAT_FC_REQ_314_query_reaches_the_whole_mirror_alphabetically_in_the_ui_face', async () => {
    await openPicker()
    type('Ar')

    // Word-prefix over the WHOLE mirror, not over the curated thirty: Arimo is
    // not a favourite and must still be reachable.
    expect(rowNames()).toContain('Arimo')
    expect(rowNames()).toContain('Archivo')
    expect(rowNames()).toContain('Arvo')
    // `Cardo` contains `ar` and begins no word with it. Mid-word hits are what
    // makes a prefix search unpredictable.
    expect(rowNames()).not.toContain('Cardo')

    // ALPHABETICAL, because somebody typing a name is looking for a specific
    // family rather than a popular one.
    expect(rowNames()).toEqual([...rowNames()].sort((a, b) => a.localeCompare(b)))

    // LISTED IN THE UI FACE. Someone typing `Ar` is looking something up, and
    // the preview earns its cost in browse mode rather than in lookup mode —
    // which is also why typing fetches no fonts at all.
    for (const row of rows()) expect(nameEl(row).style.fontFamily).toBe('')

    // Clearing restores the curated thirty, in their own faces.
    type('')
    expect(rowNames()).toEqual([...CURATED_FAMILIES])
    expect(nameEl(rows()[0]).style.fontFamily).toContain(`"${CURATED_FAMILIES[0]}"`)
  })

  it('test_UAT_FC_REQ_314_word_prefix_matching_is_case_and_space_tolerant', async () => {
    await openPicker()

    // The case the rule exists for: nobody's font is CALLED "Mono…", so plain
    // string-prefix would answer the commonest query with nothing at all.
    type('Mono')
    expect(rowNames()).toEqual(
      expect.arrayContaining(['Roboto Mono', 'JetBrains Mono', 'Space Mono', 'IBM Plex Mono']),
    )

    // Case-insensitive, and tolerant of the space between two words of a name —
    // which is not something anybody holds in their head.
    type('playfair')
    expect(rowNames()).toContain('Playfair Display')
    type('PLAYFAIR DISPLAY')
    expect(rowNames()).toContain('Playfair Display')
    type('playfairdisplay')
    expect(rowNames()).toContain('Playfair Display')
  })

  it('test_UAT_FC_REQ_314_the_cap_is_visible_when_more_families_match', async () => {
    await openPicker()
    type('Noto')

    // A list that silently stopped at thirty reads as "that is all there is",
    // which is exactly the wrong thing to tell a developer who is looking for
    // something.
    expect(rows().length).toBe(FONT_LIST_LIMIT)
    expect(statusText()).toMatch(new RegExp(`Showing ${FONT_LIST_LIMIT} of \\d+`))
    const total = Number(/of (\d+)/.exec(statusText())![1])
    expect(total).toBeGreaterThan(FONT_LIST_LIMIT)
  })

  it('test_UAT_FC_REQ_314_a_commercial_family_is_explained_not_answered_with_nothing', async () => {
    await openPicker()
    type('Helvetica')

    // "No such font" is false and unhelpable. The true answer names the
    // obstacle — a per-licensee licence that cannot be shared across customer
    // sites — and the way round it.
    const note = host.querySelector<HTMLElement>('.builder-font__note')!
    expect(note.hidden).toBe(false)
    expect(note.querySelector('.builder-font__why')!.textContent).toMatch(/per-licensee/i)
    expect(note.querySelector('.builder-font__how')!.textContent).toMatch(/upload/i)

    // And offers the open faces that set a page the same way — pressable, so
    // they are advice somebody can act on rather than a name to go and find.
    const swaps = [...note.querySelectorAll<HTMLButtonElement>('.builder-font__swap')]
    expect(swaps.map((s) => s.textContent)).toContain('Arimo')
    swaps.find((s) => s.textContent === 'Arimo')!.click()
    expect(rowNames()).toContain('Arimo')

    // A system font is a DIFFERENT fact and says so: it is licensed with the
    // operating system, not sold as a web font.
    type('Arial')
    expect(host.querySelector('.builder-font__why')!.textContent).toMatch(/operating system/i)

    // A name that is neither known-commercial nor in the mirror is simply not
    // there, and says that instead.
    type('Zzzqqx')
    expect(host.querySelector<HTMLElement>('.builder-font__note')!.hidden).toBe(true)
    expect(statusText()).toMatch(/No font matches/i)
  })

  it('test_UAT_FC_REQ_314_chips_narrow_either_list_and_slab_refines_serif', async () => {
    await openPicker()

    chip('Monospace').click()
    expect(rowNames()).toEqual(['JetBrains Mono', 'IBM Plex Mono'])
    expect(chip('Monospace').getAttribute('aria-pressed')).toBe('true')
    chip('Monospace').click()
    expect(rowNames()).toEqual([...CURATED_FAMILIES])

    // SLAB SERIF NARROWS SERIF RATHER THAN EXCLUDING IT. Every family the
    // catalogue calls a slab serif it also calls a serif, so hiding Roboto Slab
    // from the Serif chip to make room for a narrower one would be a lie about
    // what Roboto Slab is.
    chip('Slab Serif').click()
    expect(rowNames()).toEqual(['Roboto Slab', 'Arvo'])
    chip('Slab Serif').click()
    chip('Serif').click()
    expect(rowNames()).toContain('Roboto Slab')
    expect(rowNames()).toContain('Lora')
    expect(rowNames()).not.toContain('Inter')

    // CHIPS COMBINE WITH A QUERY, and narrow whichever list is showing — the
    // curated thirty above, the whole mirror here. The Serif chip is still down.
    const categoryOf = new Map(repoCatalogue().map((f) => [f.family, f.category]))
    type('Noto')
    const serifNotos = rowNames()
    expect(serifNotos.length).toBeGreaterThan(0)
    expect(serifNotos.map((n) => categoryOf.get(n))).toEqual(serifNotos.map(() => 'Serif'))

    chip('Serif').click()
    const allNotos = rowNames()
    expect(allNotos.length).toBeGreaterThan(serifNotos.length)
    expect(allNotos.some((n) => categoryOf.get(n) !== 'Serif')).toBe(true)
  })

  it('test_UAT_FC_REQ_314_only_visible_curated_rows_load_a_face_and_typing_loads_none', async () => {
    // jsdom HAS NO `IntersectionObserver`, so the suite supplies one. This is
    // the browser platform the control runs against, not a double of anything
    // this repository owns — and without it the only observable claim would be
    // "every row loads", which is the behaviour being ruled out.
    const observed: { row: Element; fire: () => void }[] = []
    class TestObserver {
      constructor(private readonly cb: (entries: unknown[]) => void) {}
      observe(row: Element): void {
        observed.push({ row, fire: () => this.cb([{ isIntersecting: true, target: row }]) })
      }
      disconnect(): void {}
      unobserve(): void {}
    }
    ;(globalThis as Record<string, unknown>).IntersectionObserver = TestObserver

    await openPicker()

    // Thirty rows are watched and NONE has loaded: opening the dialog fetches
    // no bytes at all.
    expect(observed.length).toBe(FONT_LIST_LIMIT)
    expect(faceRules()).toEqual([])

    // Scroll three into view and exactly three faces arrive, each one resolved
    // against the PREVIEW'S OWN ROOT — the root the page's own faces resolve
    // at — and each one `swap`, so a row paints in a fallback immediately and
    // upgrades rather than blocking the list.
    observed.slice(0, 3).forEach((entry) => entry.fire())
    const loaded = faceRules()
    expect(loaded.length).toBe(3)
    for (const rule of loaded) {
      expect(rule).toContain('http://origin.test/preview/acme/draft/_fonts/')
      expect(rule).toContain('font-display:swap')
    }

    // TYPING FETCHES NOTHING. Results are listed in the UI face, so the
    // debounce-and-fetch-storm problem this control could have had does not
    // arise at all.
    type('Noto')
    type('Noto Sans')
    type('Lato')
    expect(faceRules().length).toBe(3)
  })

  // ── the row, and what a pick binds ─────────────────────────────────────────

  it('test_UAT_FC_REQ_314_the_closed_control_shows_the_selected_family_in_its_own_face', async () => {
    // The descriptor comes from the real derivation over the real draft, so the
    // row under test is the row the modal actually mounts.
    const loaded = await fetchCopy({ site: 'acme', page: 'home', path: RUN })
    const field = (loaded.fields as { name: string; type: string }[]).find(
      (f) => f.name === 'fontFamily',
    )!
    expect(field).toBeTruthy()
    expect(isFontField(field)).toBe(true)

    const control = mountFontField(host, {
      field,
      value: 'Playfair Display',
      openPicker: async () => 'Lora',
    })
    const face = host.querySelector<HTMLElement>('.builder-font__face')!
    expect(face.textContent).toBe('Playfair Display')
    expect(face.style.fontFamily).toContain('"Playfair Display"')

    // However it was chosen: a pick repaints the chip in the family it named.
    host.querySelector<HTMLButtonElement>('.builder-font__current')!.click()
    await new Promise((r) => setTimeout(r, 0))
    expect(face.textContent).toBe('Lora')
    expect(face.style.fontFamily).toContain('"Lora"')
    expect(control.getValue()).toBe('Lora')
    expect(control.isDirty()).toBe(true)
  })

  it('test_UAT_FC_REQ_314_choosing_a_family_binds_it_by_the_path_use_font_uses', async () => {
    // Arimo is NOT one of the curated thirty — which is the point. The shortlist
    // narrows what is shown first to a human; it does not narrow what may be
    // bound.
    expect(CURATED_FAMILIES).not.toContain('Arimo')

    await saveCopy({ site: 'acme', page: 'home', path: RUN }, { fontFamily: 'Arimo' }, null)

    const home = readHome(cwd, 'acme')
    // THE FACES ARE IN THE PAGE'S OWN RESOURCE TABLE, in exactly the shape
    // `use_font` writes — because they were written by `use_font`'s own
    // resolver and merger, not by a second binder.
    const faces = home.l1.resources.fonts as { family: string; src: string; weight: number }[]
    expect(faces.length).toBeGreaterThan(0)
    for (const face of faces) {
      expect(face.family).toBe('Arimo')
      expect(face.src.startsWith('/_fonts/arimo/')).toBe(true)
    }
    // The run's own weight travels with the defaults, so a heading set in 700
    // can still draw 700 in the family it was just given.
    expect(faces.map((f) => f.weight)).toContain(700)

    // AND THE RUN PAINTS IT — as a stack with the generic its category implies,
    // which is what stops a page painting in whatever the browser felt like if a
    // face fails to load.
    expect(home.l1.root.children[0].axes.fontFamily).toBe('Arimo, sans-serif')

    // The derivation now reports the family rather than the stack, because the
    // control is choosing between typefaces and the fallbacks are not part of
    // the choice.
    const derived = copyFieldsOf(home.l1.root.children[0] as L1Node, { fonts: faces })!
    expect(derived.values.fontFamily).toBe('Arimo')
  })

  it('test_UAT_FC_REQ_314_choosing_the_family_already_in_use_writes_nothing', async () => {
    cmdNew('idem', { cwd, sandbox: true })
    seedSite(cwd, 'idem', { fontFamily: 'Lora, serif', fontSizePx: 24 })

    const result = await saveCopy(
      { site: 'idem', page: 'home', path: RUN },
      { fontFamily: 'Lora' },
      null,
    )
    // The modal posts every staged field rather than only the touched ones, so a
    // save that edited the words carries the run's current family too. Binding on
    // that would rewrite the run's captured stack to ours and add faces to a page
    // that never asked for them.
    expect(result.changed).toEqual([])
    const home = readHome(cwd, 'idem')
    expect(home.l1.resources?.fonts ?? []).toEqual([])
    expect(home.l1.root.children[0].axes.fontFamily).toBe('Lora, serif')
  })

  it('test_UAT_FC_REQ_314_a_family_the_page_serves_itself_is_refused_not_repointed', async () => {
    cmdNew('own', { cwd, sandbox: true })
    seedSite(cwd, 'own', { fontSizePx: 20 })
    const homePath = draftPath(cwd, 'own', 'pages', 'home.json')
    const home = JSON.parse(fs.readFileSync(homePath, 'utf8'))
    home.l1.resources = { fonts: [{ family: 'Lora', src: 'assets/lora-400.woff2', weight: 400 }] }
    fs.writeFileSync(homePath, JSON.stringify(home, null, 2))

    // Those bytes are the tenant's, on their word that they hold a licence for
    // them. Swapping them for the platform's would change what a client serves
    // without anybody deciding to, and the two are not the same file.
    await expect(
      saveCopy({ site: 'own', page: 'home', path: RUN }, { fontFamily: 'Lora' }, null),
    ).rejects.toThrow(/own uploaded files/i)

    const after = JSON.parse(fs.readFileSync(homePath, 'utf8'))
    expect(after.l1.resources.fonts).toEqual([
      { family: 'Lora', src: 'assets/lora-400.woff2', weight: 400 },
    ])
  })

  it('test_UAT_FC_REQ_314_the_control_offers_only_what_the_deployment_serves', async () => {
    // A checkout with no mirror is an ORDINARY STATE — the font bytes are a build
    // product — so the control says so rather than drawing an empty list that
    // reads as a broken control.
    const real = globalThis.fetch
    const corpus = await real(new URL('/api/fonts', bareBuilder.url)).then((r) => r.json())
    expect(corpus.mirror).toBeNull()
    expect(corpus.families).toEqual([])
    expect(corpus.curated).toEqual([])

    await openPicker({ loadCorpus: async () => corpus })
    expect(rows()).toEqual([])
    expect(statusText()).toMatch(/serves no fonts yet/i)

    // And a family it cannot serve cannot be bound through it either: the write
    // side resolves against the same corpus and refuses with a sentence, so a
    // stale list can only ever produce a clean refusal.
    const res = await real(new URL('/api/copy', bareBuilder.url), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ site: 'acme', page: 'home', path: RUN, values: { fontFamily: 'Lora' } }),
    })
    expect(res.ok).toBe(false)
    expect(JSON.stringify(await res.json())).toMatch(/font mirror was never built/i)
  })

  // ── the guarantees the list itself has to keep ─────────────────────────────

  it('test_UAT_FC_REQ_314_every_curated_family_is_one_the_catalogue_carries', () => {
    const catalogued = new Map(repoCatalogue().map((f) => [f.family, f]))

    for (const name of CURATED_FAMILIES) {
      const entry = catalogued.get(name)
      // A curated name upstream has renamed or withdrawn would otherwise become
      // a row that paints in a fallback and refuses on Save. This is the rot
      // guard, and it runs on a checkout with no mirror because the catalogue is
      // committed and the mirror is not.
      expect(entry, `curated family '${name}' is not in fonts/catalogue.json`).toBeTruthy()
      expect(
        entry!.licence === 'OFL-1.1' || entry!.licence === 'Apache-2.0',
        `curated family '${name}' is licensed ${entry!.licence}, which the mirror excludes`,
      ).toBe(true)
    }

    // EVERY CHIP HAS MEMBERS. A category chip that empties the curated view the
    // moment it is pressed reads as a broken control rather than as an empty
    // category.
    const of = (test: (f: Record<string, unknown>) => boolean) =>
      CURATED_FAMILIES.filter((n) => test(catalogued.get(n)!))
    expect(of((f) => f.category === 'Sans Serif').length).toBeGreaterThan(0)
    expect(of((f) => f.category === 'Serif').length).toBeGreaterThan(0)
    expect(of((f) => f.stroke === 'Slab Serif').length).toBeGreaterThan(0)
    expect(of((f) => f.category === 'Display').length).toBeGreaterThan(0)
    expect(of((f) => f.category === 'Handwriting').length).toBeGreaterThan(0)
    expect(of((f) => f.category === 'Monospace').length).toBeGreaterThan(0)

    // Every substitute offered for a family we cannot serve is a family we can.
    for (const entry of UNSERVED_FAMILIES) {
      for (const swap of entry.instead) {
        expect(catalogued.has(swap), `'${swap}' is offered instead of '${entry.family}'`).toBe(true)
      }
    }
  })

  it('test_UAT_FC_REQ_314_the_shortlist_does_not_narrow_what_the_assistant_may_choose', () => {
    const index = buildIndex(cwd)

    // The assistant's own binder resolves a family the shortlist has never heard
    // of, exactly as it resolves one the shortlist promotes. The shortlist is an
    // affordance over what a HUMAN is shown first; it is not a gate.
    expect(CURATED_FAMILIES).not.toContain('Merriweather')
    expect(resolveFont(index, { family: 'Merriweather' }).family.family).toBe('Merriweather')
    expect(resolveFont(index, { family: 'Inter' }).family.family).toBe('Inter')

    // And nothing on the assistant's path imports the file the shortlist lives
    // in — checked statically, because "it happens not to be narrowed today" is
    // a property one import away from being false.
    const aiDir = path.join(process.cwd(), 'tools', 'generate', 'src', 'cli', 'ai')
    for (const name of fs.readdirSync(aiDir).filter((f) => f.endsWith('.ts'))) {
      const source = fs.readFileSync(path.join(aiDir, name), 'utf8')
      expect(source, `${name} reaches the editor's shortlist`).not.toMatch(/shortlist/)
    }

    // The corpus the control browses is DERIVED from the same index the
    // assistant reads, so the two can never come to disagree about what exists.
    const corpus = browseCorpus(index)
    expect(corpus.families.length).toBe(index.families.length)
  })
})
