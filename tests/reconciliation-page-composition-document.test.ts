import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew } from '../tools/generate/src/cli'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox'
import { L1_DOCUMENT_KEYS, l1DocumentSchema } from '../packages/site-schema/src/index'
import type { L1Node } from '@1stcontact/site-schema'

/**
 * **Composing a page through the control surface — the page document half**
 * (story-189fc1ac, reconciled from BUNDLE-34 / REQ-175).
 *
 * The element tree already had its read/write pair (see
 * `reconciliation-page-composition-surface.test.ts`). What it did not have was
 * a reach into everything a page is OUTSIDE its element tree — the width
 * ladder, background, text colour, content column and font table — and a write
 * path that refuses a change painting something that does not exist.
 *
 * Nothing is mocked. Every call goes through the assistant's own toolbox, and
 * the draft's bytes on disk are the evidence that a refusal wrote nothing.
 */

const SLUG = 'studio'

/** The repo's reproduction corpus — the pages the importer actually produced. */
const CORPUS = path.resolve(__dirname, '..', 'storage', 'sites')

/** One served face — what a page with a font table looks like. */
const SATOSHI = { fonts: [{ family: 'Satoshi', src: '/assets/satoshi.woff2', weight: 400 }] }

let cwd: string

interface Box {
  run: (tool: string, input: Record<string, unknown>) => Promise<string>
  toolNames: () => string[]
}

function consultant(slug: string = SLUG): Promise<Box> {
  return createL1Toolbox(slug, { cwd }) as Promise<Box>
}

/** A read's payload, with the provenance markers a consumer strips after reading. */
function unwrap(answer: string): string {
  return answer.replace(/^<<<untrusted>>>\n/, '').replace(/\n<<<\/untrusted>>>$/, '')
}

async function json<T>(box: Box, tool: string, input: Record<string, unknown> = {}): Promise<T> {
  return JSON.parse(unwrap(await box.run(tool, input))) as T
}

function pagePath(slug: string = SLUG, page = 'home'): string {
  return path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', `${page}.json`)
}

function draftBytes(slug: string = SLUG, page = 'home'): string {
  return readFileSync(pagePath(slug, page), 'utf8')
}

function storedDocument(slug: string = SLUG, page = 'home'): Record<string, unknown> {
  return (JSON.parse(draftBytes(slug, page)) as { l1: Record<string, unknown> }).l1
}

/** Rewrite the home page's stored document, for states a scaffold cannot seed. */
function patchDocument(patch: Record<string, unknown>): void {
  const stored = JSON.parse(draftBytes()) as { l1: Record<string, unknown> }
  stored.l1 = { ...stored.l1, ...patch }
  writeFileSync(pagePath(), `${JSON.stringify(stored, null, 2)}\n`, 'utf8')
}

/** Give the site a palette entry, so a page colour can be a reference. */
function seedPalette(): void {
  const siteFile = path.join(cwd, 'storage', 'sites', SLUG, 'draft', 'site.json')
  const site = JSON.parse(readFileSync(siteFile, 'utf8')) as { palette?: Record<string, unknown> }
  site.palette = { ...(site.palette ?? {}), ink: { value: '#101822' } }
  writeFileSync(siteFile, JSON.stringify(site, null, 2))
}

/** A styled tree: copy whose type scales across the ladder, inside a painted box. */
function styledRoot(ladder: readonly number[]): L1Node {
  return {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [
      {
        kind: 'container',
        layout: 'stack',
        axes: { surfaceFill: '#eeeeee', borderRadiusPx: 12 },
        children: [
          {
            kind: 'text',
            text: 'Headline',
            axes: { fontSizePx: 48, color: '#111827', fontWeight: 700 },
            responsive: {
              fontSizePx: {
                keyframes: [
                  { at: ladder[0], value: 24 },
                  { at: ladder[ladder.length - 1], value: 48 },
                ],
              },
            },
          },
        ],
      },
      { kind: 'text', text: 'Body copy', axes: { fontSizePx: 16, color: '#111827' } },
    ],
  } as L1Node
}

function fresh(prefix: string): void {
  cwd = mkdtempSync(path.join(tmpdir(), prefix))
  cmdNew(SLUG, { cwd })
}

// ── the page document reads ──────────────────────────────────────────────────

describe('the page document reads as stored', () => {
  beforeEach(() => fresh('compose-doc-read-'))
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_AC2068_page_style_reads_every_document_key_verbatim_from_a_schema_derived_set', async () => {
    seedPalette()
    const ladder = storedDocument().widths as number[]
    const seeded = {
      widths: ladder,
      background: { ref: 'ink', shade: 0.2 },
      textColor: '#223344',
      column: { containerPx: 1152, insetPx: 24 },
      resources: SATOSHI,
    }
    patchDocument(seeded)
    const box = await consultant()

    const read = await json<{ target: { pageId: string }; document: Record<string, unknown> }>(
      box,
      'get_page_style',
      { page: 'home' },
    )

    // A palette REFERENCE comes back as that reference, shade and all — not the
    // hex it resolves to — so what is read can be written back unchanged.
    expect(read.document.background).toEqual({ ref: 'ink', shade: 0.2 })
    expect(read.document.resources).toEqual(SATOSHI)
    expect(read.document).toEqual(seeded)
    // Nothing of the element tree.
    expect(read.document).not.toHaveProperty('root')
    expect(JSON.stringify(read)).not.toContain('"children"')

    // The covered key set IS the schema's own key set minus the element tree,
    // derived from the schema rather than listed.
    const schemaKeys = Object.keys(l1DocumentSchema.shape)
      .filter((key) => key !== 'root')
      .sort()
    expect([...L1_DOCUMENT_KEYS].sort()).toEqual(schemaKeys)
    expect(Object.keys(read.document).sort()).toEqual(schemaKeys)

    // A key the page does not carry is ABSENT, not defaulted.
    patchDocument({ textColor: undefined, column: undefined })
    const sparse = await json<{ document: Record<string, unknown> }>(box, 'get_page_style', {
      page: 'home',
    })
    expect(sparse.document).not.toHaveProperty('textColor')
    expect(sparse.document).not.toHaveProperty('column')

    // An unknown page is not-found.
    expect(await box.run('get_page_style', { page: 'nowhere' })).toContain('NOT_FOUND')
  })

  it('test_UAT_AC2070_describing_a_page_carries_its_document_keys_beside_a_styling_free_map', async () => {
    const ladder = storedDocument().widths as number[]
    patchDocument({ root: styledRoot(ladder), resources: SATOSHI })
    const box = await consultant()

    const set = await box.run('set_page_style', { page: 'home', style: { background: '#123456' } })
    expect(set).not.toContain('SCHEMA_INVALID')

    const map = await json<{
      page: Record<string, unknown>
      style: Record<string, unknown>
      segments: Record<string, unknown>[]
    }>(box, 'describe_page', { page: 'home' })

    // The document keys, exactly as stored, as a page-level member...
    expect(map.style.background).toBe('#123456')
    expect(map.style).toEqual(
      Object.fromEntries(
        Object.entries(storedDocument()).filter(([key]) => key !== 'root'),
      ),
    )
    // ...beside the metadata and the element map, not inside either.
    expect(map.page.id).toBe('home')
    expect(map.segments.length).toBeGreaterThan(0)

    // The element map stays free of styling.
    const allowed = new Set(['path', 'kind', 'label', 'module', 'slot'])
    for (const segment of map.segments) {
      for (const key of Object.keys(segment)) expect(allowed.has(key), key).toBe(true)
    }
    const serialised = JSON.stringify(map.segments)
    for (const styling of ['fontSizePx', 'fontWeight', 'surfaceFill', 'borderRadiusPx', 'color', '#123456']) {
      expect(serialised).not.toContain(styling)
    }
  })
})

// ── the page document writes ─────────────────────────────────────────────────

describe('the page document writes by top-level merge', () => {
  beforeEach(() => fresh('compose-doc-write-'))
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_AC2069_page_style_write_merges_top_level_replaces_whole_removes_null_and_validates', async () => {
    seedPalette()
    const ladder = storedDocument().widths as number[]
    patchDocument({ root: styledRoot(ladder), resources: SATOSHI })
    const box = await consultant()
    const tree = (): string => JSON.stringify(storedDocument().root)
    const rootBefore = tree()

    // Naming the background leaves the font table alone; the reply names the change.
    const reply = await json<{ changed: string[] }>(box, 'set_page_style', {
      page: 'home',
      style: { background: { ref: 'ink', shade: 0.2 } },
    })
    expect(reply.changed).toEqual(['background'])
    let read = await json<{ document: Record<string, unknown> }>(box, 'get_page_style', {
      page: 'home',
    })
    expect(read.document.background).toEqual({ ref: 'ink', shade: 0.2 })
    expect(read.document.resources).toEqual(SATOSHI)
    expect(read.document.widths).toEqual(ladder)
    expect(tree()).toBe(rootBefore)

    // Replaced WHOLE, not merged into: no shade survives from the previous value.
    await box.run('set_page_style', { page: 'home', style: { background: { ref: 'ink' } } })
    read = await json(box, 'get_page_style', { page: 'home' })
    expect(read.document.background).toEqual({ ref: 'ink' })
    expect(tree()).toBe(rootBefore)

    // The same for a structured value: a column is replaced, not merged.
    await box.run('set_page_style', {
      page: 'home',
      style: { column: { containerPx: 1152, insetPx: 24, maxWidthPx: 896 } },
    })
    await box.run('set_page_style', { page: 'home', style: { column: { containerPx: 960, insetPx: 16 } } })
    expect(storedDocument().column).toEqual({ containerPx: 960, insetPx: 16 })
    expect(tree()).toBe(rootBefore)

    // Null removes the key.
    await box.run('set_page_style', { page: 'home', style: { background: null } })
    read = await json(box, 'get_page_style', { page: 'home' })
    expect(read.document).not.toHaveProperty('background')
    expect(tree()).toBe(rootBefore)

    // Every refusal leaves the draft byte-for-byte as it was.
    const refusals: [string, Record<string, unknown>, RegExp[]][] = [
      // A width ladder that strands the headline's per-width variation.
      ['stranded width', { widths: ladder.slice(1) }, []],
      // The wrong shape of value.
      ['wrong shape', { background: 'not a colour' }, []],
      // Nothing named at all.
      ['empty write', {}, []],
      // Not a document key: named, with the writable keys.
      ['unknown key', { margin: 12 }, [/margin/, new RegExp(L1_DOCUMENT_KEYS.join(', '))]],
      // The element tree's own key: pointed at the element operation.
      [
        'element tree',
        { root: { kind: 'container', layout: 'stack', children: [] } },
        [/root/, /set_l1/],
      ],
    ]
    for (const [name, style, mentions] of refusals) {
      const before = draftBytes()
      const answer = await box.run('set_page_style', { page: 'home', style })
      expect(answer, name).toContain('SCHEMA_INVALID')
      // Soft, so one missing mention does not hide the byte-unchanged check or
      // the remaining refusals.
      for (const mention of mentions) expect.soft(answer, name).toMatch(mention)
      expect(draftBytes(), name).toBe(before)
    }

    // Removing the column while an element is anchored to it is refused too.
    const anchored = styledRoot(ladder) as { children: unknown[] }
    anchored.children.push({
      kind: 'text',
      text: 'Lined up',
      axes: { fontSizePx: 16, color: '#111827' },
      geometry: { anchor: 'column', keyframes: ladder.map((at) => ({ at, x: 0, y: 0, width: 600 })) },
    })
    patchDocument({ root: anchored })
    const before = draftBytes()
    expect(await box.run('set_page_style', { page: 'home', style: { column: null } })).toContain(
      'SCHEMA_INVALID',
    )
    expect(draftBytes()).toBe(before)
  })
})

// ── a write may not introduce a broken reference ─────────────────────────────

describe('a write may not introduce a reference to something that does not exist', () => {
  beforeEach(() => fresh('compose-doc-refs-'))
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_AC2071_a_font_stack_with_no_served_face_and_no_generic_is_refused_naming_the_family', async () => {
    const ladder = storedDocument().widths as number[]
    patchDocument({ root: styledRoot(ladder), resources: SATOSHI })
    const box = await consultant()
    const node = (await json<{ node: L1Node }>(box, 'get_l1', { page: 'home', path: '0.1' })).node
    const paint = (fontFamily: string): Record<string, unknown> => ({
      page: 'home',
      path: '0.1',
      node: { ...node, axes: { ...(node as { axes: object }).axes, fontFamily } },
    })

    // A family the page does not serve, and no generic: refused, naming the
    // family and the face the page DOES serve, with the strategy and the fix.
    const before = draftBytes()
    const refused = await box.run('set_l1', paint('Poppins'))
    expect(refused).toContain('SCHEMA_INVALID')
    expect(refused).toContain("'Poppins'")
    expect(refused).toContain('Satoshi')
    expect(refused).toMatch(/nothing was written/i)
    expect(refused).toMatch(/do not send it again unchanged/i)
    expect(refused).toContain('Poppins, sans-serif')
    expect(draftBytes()).toBe(before)

    // The same family with a generic fallback: accepted.
    expect(await box.run('set_l1', paint('Poppins, sans-serif'))).not.toContain('SCHEMA_INVALID')
    // A generic named anywhere in the stack counts.
    expect(await box.run('set_l1', paint('Poppins, Helvetica Neue, system-ui'))).not.toContain(
      'SCHEMA_INVALID',
    )
    // A served face first, matched case-insensitively and ignoring quotes: accepted.
    expect(await box.run('set_l1', paint('"satoshi"'))).not.toContain('SCHEMA_INVALID')
    expect(await box.run('set_l1', paint('Satoshi'))).not.toContain('SCHEMA_INVALID')
    expect(
      (storedDocument().root as { children: { axes: { fontFamily: string } }[] }).children[1].axes
        .fontFamily,
    ).toBe('Satoshi')

    // The rule applies to the page-style write too: taking away the face an
    // element paints with no generic would leave it resolving to nothing.
    const painted = draftBytes()
    const unserve = await box.run('set_page_style', { page: 'home', style: { resources: null } })
    expect(unserve).toContain('SCHEMA_INVALID')
    expect(unserve).toContain("'Satoshi'")
    expect(unserve).toMatch(/serves no font faces/i)
    expect(draftBytes()).toBe(painted)
  })

  it('test_UAT_AC2072_a_reference_to_an_asset_the_site_does_not_hold_is_refused_naming_it', async () => {
    const box = await consultant()
    expect(
      await box.run('write_image', {
        name: 'held',
        svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8"/></svg>',
      }),
    ).not.toContain('SCHEMA_INVALID')
    const map = await json<{ segments: { path: string }[] }>(box, 'describe_page', { page: 'home' })
    const at = map.segments.find((s) => s.path !== '0')!.path
    const put = (node: Record<string, unknown>): Promise<string> =>
      box.run('set_l1', { page: 'home', path: at, node })

    // An image naming an asset the site does not hold: refused, naming the
    // reference, saying it would be a broken image, listing what IS held.
    const before = draftBytes()
    const image = await put({ kind: 'image', src: '/assets/missing.png', alt: 'Missing' })
    expect(image).toContain('SCHEMA_INVALID')
    expect(image).toContain('/assets/missing.png')
    expect(image).toMatch(/broken image/i)
    expect(image).toContain('/assets/held.svg')
    expect(image).toMatch(/nothing was written/i)
    // ...and says what to do: reference something held, or add it first.
    expect.soft(image).toMatch(/reference something the site holds|add it to the site first/i)
    expect(draftBytes()).toBe(before)

    // A box whose background image names a missing asset: refused.
    const backdrop = await put({
      kind: 'container',
      layout: 'stack',
      axes: { backgroundImageUrl: '/assets/missing-backdrop.png' },
      children: [],
    })
    expect(backdrop).toContain('SCHEMA_INVALID')
    expect(backdrop).toContain('missing-backdrop.png')
    expect(draftBytes()).toBe(before)

    // A held asset is matched ignoring query and fragment, with or without the prefix.
    expect(await put({ kind: 'image', src: '/assets/held.svg?v=3', alt: 'Held' })).not.toContain(
      'SCHEMA_INVALID',
    )
    expect(await put({ kind: 'image', src: '/assets/held.svg#frag', alt: 'Held' })).not.toContain(
      'SCHEMA_INVALID',
    )
    expect(await put({ kind: 'image', src: 'held.svg', alt: 'Held' })).not.toContain(
      'SCHEMA_INVALID',
    )
    // An absolute web reference is not the site's to vouch for.
    expect(
      await put({ kind: 'image', src: 'https://example.com/elsewhere.png', alt: 'Elsewhere' }),
    ).not.toContain('SCHEMA_INVALID')
  })

  it('test_UAT_AC2073_an_inherited_broken_reference_does_not_block_a_write_even_when_it_moves', async () => {
    // As a reproduction can leave a page: a family no face serves and no generic
    // backs, and a picture the mirror never fetched.
    patchDocument({
      root: {
        kind: 'container',
        id: 'root',
        layout: 'stack',
        children: [
          { kind: 'text', text: 'Unrelated', axes: { fontSizePx: 16, color: '#111827' } },
          { kind: 'text', text: 'As captured', axes: { fontSizePx: 32, color: '#111827', fontFamily: 'Inter' } },
          { kind: 'image', src: '/assets/never-mirrored.png', alt: 'A hero' },
        ],
      },
    })
    const box = await consultant()

    // The page can still be read.
    expect(await box.run('describe_page', { page: 'home' })).not.toMatch(/SCHEMA_INVALID|NOT_FOUND/)
    const unrelated = (await json<{ node: L1Node }>(box, 'get_l1', { page: 'home', path: '0.0' }))
      .node

    // An unrelated change is accepted.
    const reworded = await box.run('set_l1', {
      page: 'home',
      path: '0.0',
      node: { ...unrelated, text: 'Reworded' },
    })
    expect(reworded).not.toContain('SCHEMA_INVALID')
    expect(JSON.stringify(storedDocument().root)).toContain('Reworded')

    // Inserting an element ABOVE the inherited references shifts their
    // addresses; compared by value, they are still inherited, so it is accepted.
    const root = (await json<{ node: L1Node }>(box, 'get_l1', { page: 'home', path: '0' })).node
    const children = (root as { children: L1Node[] }).children
    const inserted = await box.run('set_l1', {
      page: 'home',
      path: '0',
      node: {
        ...root,
        children: [{ kind: 'text', text: 'Nav', axes: { fontSizePx: 14, color: '#111827' } }, ...children],
      },
    })
    expect(inserted).not.toContain('SCHEMA_INVALID')
    expect((storedDocument().root as { children: unknown[] }).children).toHaveLength(4)

    // A DIFFERENT broken reference introduced in the same page is still refused.
    const before = draftBytes()
    const shifted = (await json<{ node: L1Node }>(box, 'get_l1', { page: 'home', path: '0.1' })).node
    const introduced = await box.run('set_l1', {
      page: 'home',
      path: '0.1',
      node: { ...shifted, axes: { ...(shifted as { axes: object }).axes, fontFamily: 'Poppins' } },
    })
    expect(introduced).toContain('SCHEMA_INVALID')
    expect(introduced).toContain("'Poppins'")
    expect(draftBytes()).toBe(before)
  })
})

// ── parity with the reproduction path ────────────────────────────────────────

/** Every reproduced page in the corpus, read from disk rather than listed. */
function reproducedPages(): { slug: string; page: string }[] {
  if (!existsSync(CORPUS)) return []
  const out: { slug: string; page: string }[] = []
  for (const slug of readdirSync(CORPUS).sort()) {
    const dir = path.join(CORPUS, slug, 'draft', 'pages')
    if (!existsSync(dir)) continue
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
      const stored = JSON.parse(readFileSync(path.join(dir, file), 'utf8')) as {
        id: string
        l1?: unknown
      }
      if (stored.l1) out.push({ slug, page: stored.id })
    }
  }
  return out
}

describe('what the reproduction path can write, the assistant can write', () => {
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'compose-doc-parity-'))
  })
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it(
    'test_UAT_AC2074_every_element_and_document_key_of_every_reproduced_page_round_trips_unchanged',
    async () => {
      const pages = reproducedPages()
      // The fixture must be worth something, or every assertion passes vacuously.
      expect(pages.length).toBeGreaterThan(0)
      const covered = new Set<string>()

      for (const target of pages) {
        const label = `${target.slug}/${target.page}`
        // A COPY: the corpus is the repo's record of what the importer produced.
        if (!existsSync(path.join(cwd, 'storage', 'sites', target.slug))) {
          cpSync(path.join(CORPUS, target.slug), path.join(cwd, 'storage', 'sites', target.slug), {
            recursive: true,
          })
        }
        const file = readdirSync(path.join(cwd, 'storage', 'sites', target.slug, 'draft', 'pages'))
          .map((f) => f.replace(/\.json$/, ''))
          .find(
            (name) =>
              (JSON.parse(draftBytes(target.slug, name)) as { id: string }).id === target.page,
          )!
        const before = JSON.parse(draftBytes(target.slug, file)) as Record<string, unknown>
        const box = await consultant(target.slug)

        // Every element: read, write straight back, accepted.
        const map = await json<{ segments: { path: string; module?: string; slot?: string }[] }>(
          box,
          'describe_page',
          { page: target.page },
        )
        expect(map.segments.length, label).toBeGreaterThan(0)
        for (const segment of map.segments) {
          const scope = {
            page: target.page,
            path: segment.path,
            ...(segment.module === undefined ? {} : { module: segment.module }),
            ...(segment.slot === undefined ? {} : { slot: segment.slot }),
          }
          const read = await json<{ node: L1Node }>(box, 'get_l1', scope)
          const written = await box.run('set_l1', { ...scope, node: read.node })
          expect(written, `${label} ${segment.path}`).not.toMatch(/SCHEMA_INVALID|NOT_FOUND/)
        }

        // Every document-level key: read, write straight back, accepted.
        const style = await json<{ document: Record<string, unknown> }>(box, 'get_page_style', {
          page: target.page,
        })
        const carried = Object.keys((before as { l1: Record<string, unknown> }).l1).filter(
          (key) => key !== 'root',
        )
        expect(Object.keys(style.document).sort(), label).toEqual(carried.sort())
        for (const key of carried) {
          covered.add(key)
          const answer = await box.run('set_page_style', {
            page: target.page,
            style: { [key]: style.document[key] },
          })
          expect(answer, `${label} ${key}`).not.toMatch(/SCHEMA_INVALID|NOT_FOUND/)
        }

        // And the stored page is unchanged by all of it.
        expect(JSON.parse(draftBytes(target.slug, file)), label).toEqual(before)
      }

      // Every document schema key other than the element tree was exercised.
      expect([...covered].sort()).toEqual([...L1_DOCUMENT_KEYS].sort())
    },
    120_000,
  )
})
