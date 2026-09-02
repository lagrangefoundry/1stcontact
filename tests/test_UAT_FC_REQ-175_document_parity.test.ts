/**
 * REQ-175 — **the consultant gets the whole of L1, and keeps getting it**.
 *
 * Two failures were behind this ticket and only one of them was a capability
 * gap. Most of L1 was already reachable and merely unknown; the page DOCUMENT
 * was genuinely unreachable. `set_l1` addresses a roots array that is literally
 * `[l1.root]`, so path `"0"` *is* `root` and the document's other five keys —
 * `widths`, `background`, `textColor`, `column`, `resources` — had no path at
 * all. No tool wrote them and no tool read them, which is how a session shipped
 * off-white text onto a white page without ever being able to discover the page
 * was white.
 *
 * What is under test:
 *
 * - **the document is addressable** — every key of `l1DocumentSchema` outside
 *   `root` reads and writes through the surface, colours as palette references
 *   because that is what the reproduction writes there;
 * - **the map says what colour the page is**, so the discovery that was missing
 *   arrives through the tool a session already calls;
 * - **L1 is self-validating** — a write that would break the page is refused
 *   whole, with a message naming what is wrong and what would be accepted:
 *   a ladder rung something is pinned to, a column something lines up against,
 *   a typeface with nothing to render it, a picture the site does not hold;
 * - **parity is structural, not promised** — every node and document-level key
 *   of a REPRODUCED page round-trips through the surface, and the key list the
 *   surface covers is derived from the schema rather than written down, so the
 *   sixth document key fails this file on the day it is added.
 *
 * The reproduction corpus in `storage/sites/` is the fixture for the parity
 * half, copied rather than mocked: a hand-written approximation of a captured
 * page is exactly the thing that stops resembling one.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew } from '../tools/generate/src/cli'
import { createL1Toolbox, L1_DECLARATION, L1_INSTANCES } from '../tools/generate/src/cli/ai/toolbox'
import { L1_DOCUMENT_KEYS } from '../packages/site-schema/src/index'
import type { L1Node } from '@1stcontact/site-schema'

const SLUG = 'studio'

/** The repo's reproduction corpus — the pages the importer actually produced. */
const CORPUS = path.resolve(__dirname, '..', 'storage', 'sites')

let cwd: string

interface Box {
  run: (tool: string, input: Record<string, unknown>) => Promise<string>
  toolNames: () => string[]
}

function consultant(slug: string = SLUG): Promise<Box> {
  return createL1Toolbox(slug, { cwd })
}

/** A read's payload, with the provenance markers a consumer strips after reading. */
function unwrap(answer: string): string {
  return answer.replace(/^<<<untrusted>>>\n/, '').replace(/\n<<<\/untrusted>>>$/, '')
}

async function json<T>(box: Box, tool: string, input: Record<string, unknown> = {}): Promise<T> {
  return JSON.parse(unwrap(await box.run(tool, input))) as T
}

function pagePath(slug: string, page: string): string {
  return path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', `${page}.json`)
}

function storedDocument(slug: string, page: string): Record<string, unknown> {
  return (JSON.parse(readFileSync(pagePath(slug, page), 'utf8')) as { l1: Record<string, unknown> })
    .l1
}

/** Rewrite the home page's stored document, for the cases a scaffold cannot seed. */
function patchDocument(slug: string, page: string, patch: Record<string, unknown>): void {
  const file = pagePath(slug, page)
  const stored = JSON.parse(readFileSync(file, 'utf8')) as { l1: Record<string, unknown> }
  stored.l1 = { ...stored.l1, ...patch }
  writeFileSync(file, `${JSON.stringify(stored, null, 2)}\n`, 'utf8')
}

// ── the document is addressable ──────────────────────────────────────────────

describe('REQ-175 — the page document reads and writes', () => {
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req175-doc-'))
    cmdNew(SLUG, { cwd })
  })
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_FC_REQ_175_the_page_map_says_what_colour_the_page_is', async () => {
    const box = await consultant()

    // THE DISCOVERY THAT WAS MISSING. `describe_page` is what a session calls
    // first, and it returned the page's id, slug, title and search wording and
    // nothing about how the page is painted — so an assistant could not learn
    // the page was white, let alone that it had just written off-white onto it.
    const map = await json<{ style: Record<string, unknown> }>(box, 'describe_page', {
      page: 'home',
    })
    expect(map.style.background).toBe('#ffffff')
    expect(map.style.textColor).toBe('#111827')
  })

  it('test_UAT_FC_REQ_175_reads_and_writes_the_page_background_as_a_palette_reference', async () => {
    const box = await consultant()

    // The ticket's acceptance criterion, stated as it is written there: a
    // consultant can set a page's background colour and read back what it set.
    await box.run('add_palette_color', { name: 'sand', color: '#e8dfc8' })
    const written = await box.run('set_page_style', {
      page: 'home',
      style: { background: { ref: 'sand' } },
    })
    expect(written).not.toContain('SCHEMA_INVALID')

    const read = await json<{ document: Record<string, unknown> }>(box, 'get_page_style', {
      page: 'home',
    })

    // A REFERENCE, NOT THE HEX IT RESOLVES TO. The reproduction writes
    // `{"ref": "sand"}` here, so a hex-only surface would already be behind the
    // importer the day it landed — and a resolved read is unwritable, because
    // writing it back would silently sever the page from the palette entry it
    // was following.
    expect(read.document.background).toEqual({ ref: 'sand' })
    expect(storedDocument(SLUG, 'home').background).toEqual({ ref: 'sand' })
  })

  it('test_UAT_FC_REQ_175_naming_one_document_key_leaves_the_others_alone', async () => {
    const box = await consultant()
    const before = storedDocument(SLUG, 'home')

    await box.run('set_page_style', { page: 'home', style: { textColor: '#223344' } })

    const after = storedDocument(SLUG, 'home')
    expect(after.textColor).toBe('#223344')
    // Everything not named survives — the whole reason the write merges rather
    // than replaces. A caller changing the text colour must not lose the ladder.
    expect(after.widths).toEqual(before.widths)
    expect(after.background).toBe(before.background)
    expect(after.root).toEqual(before.root)
  })

  it('test_UAT_FC_REQ_175_every_document_key_the_schema_declares_is_writable', async () => {
    const box = await consultant()

    // DERIVED FROM THE SCHEMA, NEVER LISTED. This is the structural half of the
    // parity guarantee: a sixth document key appears in `L1_DOCUMENT_KEYS` the
    // moment it is added to `l1DocumentSchema`, and fails here the same day
    // unless the surface covers it. A hand-written list would go stale silently,
    // and the symptom would be this ticket again.
    const ladder = (storedDocument(SLUG, 'home').widths ?? []) as number[]
    const values: Record<string, unknown> = {
      widths: ladder,
      background: '#101010',
      textColor: '#f0f0f0',
      column: { containerPx: 1152, insetPx: 24, maxWidthPx: 896 },
      resources: { fonts: [{ family: 'Satoshi', src: '/assets/satoshi.woff2', weight: 400 }] },
    }
    expect(Object.keys(values).sort()).toEqual([...L1_DOCUMENT_KEYS].sort())

    for (const key of L1_DOCUMENT_KEYS) {
      const answer = await box.run('set_page_style', {
        page: 'home',
        style: { [key]: values[key] },
      })
      expect(answer, key).not.toContain('SCHEMA_INVALID')
      expect(storedDocument(SLUG, 'home')[key], key).toEqual(values[key])
    }

    // And every one of them reads back, which is the other half of "reachable".
    const read = await json<{ document: Record<string, unknown> }>(box, 'get_page_style', {
      page: 'home',
    })
    for (const key of L1_DOCUMENT_KEYS) expect(read.document[key], key).toEqual(values[key])
  })

  it('test_UAT_FC_REQ_175_a_document_key_can_be_given_back', async () => {
    const box = await consultant()
    await box.run('set_page_style', { page: 'home', style: { background: null } })

    // Four of the five are optional in the schema, and a page that has been
    // given a background must be able to give it back — otherwise the surface
    // could reach a state the importer can produce and never leave it, which is
    // this ticket's own gap pointed the other way.
    expect(storedDocument(SLUG, 'home')).not.toHaveProperty('background')
    const read = await json<{ document: Record<string, unknown> }>(box, 'get_page_style', {
      page: 'home',
    })
    expect(read.document).not.toHaveProperty('background')
  })

  it('test_UAT_FC_REQ_175_the_element_tree_is_refused_by_name_not_ignored', async () => {
    const box = await consultant()
    const answer = await box.run('set_page_style', {
      page: 'home',
      style: { root: { kind: 'container', layout: 'stack', children: [] } },
    })

    // `root` IS writable — as address "0", through `set_l1`. Silently dropping
    // it from a document write would report success for a change that did not
    // happen, and the caller would learn the difference from the render.
    expect(answer).toContain('SCHEMA_INVALID')
    expect(storedDocument(SLUG, 'home').root).toBeDefined()
  })
})

// ── L1 is self-validating ────────────────────────────────────────────────────

describe('REQ-175 — a change that would break the page is refused, and says why', () => {
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req175-guard-'))
    cmdNew(SLUG, { cwd })
  })
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_FC_REQ_175_a_ladder_rung_something_is_pinned_to_cannot_be_taken_away', async () => {
    const ladder = (storedDocument(SLUG, 'home').widths ?? []) as number[]
    // A run whose type scales across the ladder — the shape a capture folds to,
    // and the one that makes a width load-bearing rather than decorative.
    patchDocument(SLUG, 'home', {
      root: {
        kind: 'container',
        id: 'root',
        layout: 'stack',
        children: [
          {
            kind: 'text',
            id: 'headline',
            text: 'Pinned',
            axes: { fontSizePx: 48, color: '#111827' },
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
    })
    const box = await consultant()

    const answer = await box.run('set_page_style', {
      page: 'home',
      style: { widths: ladder.slice(1) },
    })
    expect(answer).toContain('SCHEMA_INVALID')
    // Refused WHOLE — the draft is left exactly as it was, which is what makes a
    // refusal safe to retry rather than something to unpick.
    expect(storedDocument(SLUG, 'home').widths).toEqual(ladder)

    // And it can be done correctly: widening the ladder strands nothing.
    const wider = await box.run('set_page_style', {
      page: 'home',
      style: { widths: [...ladder, ladder[ladder.length - 1] + 320] },
    })
    expect(wider).not.toContain('SCHEMA_INVALID')
  })

  it('test_UAT_FC_REQ_175_a_column_elements_line_up_against_cannot_be_taken_away', async () => {
    const ladder = (storedDocument(SLUG, 'home').widths ?? []) as number[]
    patchDocument(SLUG, 'home', {
      column: { containerPx: 1152, insetPx: 24 },
      root: {
        kind: 'container',
        id: 'root',
        layout: 'stack',
        children: [
          {
            kind: 'text',
            id: 'anchored',
            text: 'Lined up',
            axes: { fontSizePx: 24, color: '#111827' },
            geometry: {
              anchor: 'column',
              keyframes: ladder.map((at) => ({ at, x: 0, y: 0, width: 600 })),
            },
          },
        ],
      },
    })
    const box = await consultant()

    const answer = await box.run('set_page_style', { page: 'home', style: { column: null } })
    expect(answer).toContain('SCHEMA_INVALID')
    expect(storedDocument(SLUG, 'home').column).toEqual({ containerPx: 1152, insetPx: 24 })
  })

  it('test_UAT_FC_REQ_175_a_typeface_with_nothing_to_render_it_is_refused', async () => {
    const box = await consultant()
    const map = await json<{ segments: { path: string }[] }>(box, 'describe_page', { page: 'home' })
    const run = map.segments.find((s) => s.path !== '0')!
    const node = (await json<{ node: L1Node }>(box, 'get_l1', { page: 'home', path: run.path })).node

    // THE FAILURE THIS CLOSES IS SILENT. `fontFamily: "Poppins"` on a page that
    // serves no Poppins face validated clean and painted the browser default;
    // nothing in the answer said so. Same class as the off-white text on the
    // white page — a plausible write, accepted, and wrong.
    const refused = await box.run('set_l1', {
      page: 'home',
      path: run.path,
      node: { ...node, axes: { ...(node as { axes: object }).axes, fontFamily: 'Poppins' } },
    })
    expect(refused).toContain('SCHEMA_INVALID')
    // Helpful, not merely negative: it says what would be accepted.
    expect(refused).toContain('Poppins, sans-serif')

    // Naming a fallback the browser has is accepted — the stack now says what to
    // paint when the face is unavailable, so nothing about it is silent.
    const accepted = await box.run('set_l1', {
      page: 'home',
      path: run.path,
      node: {
        ...node,
        axes: { ...(node as { axes: object }).axes, fontFamily: 'Poppins, sans-serif' },
      },
    })
    expect(accepted).not.toContain('SCHEMA_INVALID')

    // So is serving the face, which is the other half of the same rule and the
    // reason `resources` had to become writable for this check to be fair.
    await box.run('set_page_style', {
      page: 'home',
      style: { resources: { fonts: [{ family: 'Poppins', src: '/assets/poppins.woff2' }] } },
    })
    const served = await box.run('set_l1', {
      page: 'home',
      path: run.path,
      node: { ...node, axes: { ...(node as { axes: object }).axes, fontFamily: 'Poppins' } },
    })
    expect(served).not.toContain('SCHEMA_INVALID')
  })

  it('test_UAT_FC_REQ_175_a_picture_the_site_does_not_hold_is_refused', async () => {
    const box = await consultant()
    const map = await json<{ segments: { path: string }[] }>(box, 'describe_page', { page: 'home' })
    const root = (await json<{ node: L1Node }>(box, 'get_l1', { page: 'home', path: '0' })).node
    expect(map.segments.length).toBeGreaterThan(0)

    const withPicture = {
      ...root,
      children: [
        ...(root as { children: L1Node[] }).children,
        { kind: 'image', src: '/assets/logo-they-never-sent.png', alt: 'A logo' },
      ],
    }
    const refused = await box.run('set_l1', { page: 'home', path: '0', node: withPicture })
    expect(refused).toContain('SCHEMA_INVALID')
    expect(refused).toContain('logo-they-never-sent.png')

    // The same picture, once the site actually holds it.
    await box.run('write_image', {
      name: 'logo-they-never-sent',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8"/></svg>',
    })
    const drawn = {
      ...root,
      children: [
        ...(root as { children: L1Node[] }).children,
        { kind: 'image', src: '/assets/logo-they-never-sent.svg', alt: 'A logo' },
      ],
    }
    const accepted = await box.run('set_l1', { page: 'home', path: '0', node: drawn })
    expect(accepted).not.toContain('SCHEMA_INVALID')
  })

  it('test_UAT_FC_REQ_175_an_inherited_broken_reference_does_not_block_an_unrelated_edit', async () => {
    // A REPRODUCTION CAN CARRY BOTH, through no author's doing: a capture names
    // the family its source named and references the image its source served,
    // whether or not either could be mirrored. Refusing those outright would
    // make a reproduced page uneditable — trading a wrong font for a page nobody
    // can touch — so the rule is stated on the write: a write may not INTRODUCE
    // a dangling reference; it is not required to repair one it inherited.
    patchDocument(SLUG, 'home', {
      root: {
        kind: 'container',
        id: 'root',
        layout: 'stack',
        children: [
          {
            kind: 'text',
            id: 'headline',
            text: 'As captured',
            axes: { fontSizePx: 32, color: '#111827', fontFamily: 'Inter' },
          },
          { kind: 'image', id: 'hero', src: '/assets/never-mirrored.png', alt: 'A hero' },
        ],
      },
    })
    const box = await consultant()

    const node = (await json<{ node: L1Node }>(box, 'get_l1', { page: 'home', path: '0.0' })).node
    const answer = await box.run('set_l1', {
      page: 'home',
      path: '0.0',
      node: { ...node, text: 'Reworded' },
    })
    expect(answer).not.toContain('SCHEMA_INVALID')
    expect(storedDocument(SLUG, 'home')).toBeDefined()

    // Even moving the broken picture is fine — what an author introduces is a
    // reference, not a position, so an address that shifted is not a new fault.
    const root = (await json<{ node: L1Node }>(box, 'get_l1', { page: 'home', path: '0' })).node
    const reordered = {
      ...root,
      children: [...(root as { children: L1Node[] }).children].reverse(),
    }
    expect(await box.run('set_l1', { page: 'home', path: '0', node: reordered })).not.toContain(
      'SCHEMA_INVALID',
    )
  })
})

// ── the grant ────────────────────────────────────────────────────────────────

describe('REQ-175 — painting a page is authoring', () => {
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req175-grant-'))
    cmdNew(SLUG, { cwd })
  })
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_FC_REQ_175_the_document_pair_sits_with_set_l1_in_the_authoring_grant', async () => {
    const groups = (
      L1_DECLARATION as { groups: { group: string; operations: string[] }[] }
    ).groups
    const author = groups.find((g) => g.group === 'AuthorPages')!
    const read = groups.find((g) => g.group === 'ReadSite')!

    // NOT `ManagePages`. Page appearance there would sit beside slug and search
    // wording, so a role granted authoring but not page management could paint
    // every element on a page and not the page it sits on.
    expect(author.operations).toContain('set_page_style')
    expect(author.operations).toContain('set_l1')
    expect(read.operations).toContain('get_page_style')
    for (const group of groups) {
      if (group.group === 'ManagePages') expect(group.operations).not.toContain('set_page_style')
    }

    // And the consultant, which is granted `AuthorPages`, actually has them.
    expect(
      (L1_INSTANCES as Record<string, { l1: { groups: string[] } }>).consultant.l1.groups,
    ).toContain('AuthorPages')
    const box = await consultant()
    expect(box.toolNames()).toEqual(expect.arrayContaining(['get_page_style', 'set_page_style']))
  })
})

// ── parity with the reproduction path ────────────────────────────────────────

/**
 * The reproduced pages this repo actually holds. Read from disk rather than
 * listed, so a page added to the corpus is covered without anyone remembering
 * to add it here — the same reason `L1_DOCUMENT_KEYS` is derived.
 */
function reproducedPages(): { slug: string; page: string; keys: string[] }[] {
  if (!existsSync(CORPUS)) return []
  const out: { slug: string; page: string; keys: string[] }[] = []
  for (const slug of ['xgd', 'gigabytealchemy']) {
    const dir = path.join(CORPUS, slug, 'draft', 'pages')
    if (!existsSync(dir)) continue
    for (const file of ['home.json', 'whitepapers.json', 'contact.json']) {
      const full = path.join(dir, file)
      if (!existsSync(full)) continue
      const stored = JSON.parse(readFileSync(full, 'utf8')) as {
        id: string
        l1?: Record<string, unknown>
      }
      if (!stored.l1) continue
      out.push({
        slug,
        page: stored.id,
        keys: L1_DOCUMENT_KEYS.filter((key) => stored.l1![key] !== undefined),
      })
    }
  }
  return out
}

describe('REQ-175 — what the reproduction path can write, the consultant can write', () => {
  const pages = reproducedPages()

  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req175-parity-'))
  })
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_FC_REQ_175_the_corpus_is_present_and_exercises_every_document_key', () => {
    // The fixture has to be worth something. If the corpus vanished or stopped
    // carrying document-level keys, every assertion below would pass vacuously —
    // which is the failure mode a parity test cannot afford.
    expect(pages.length).toBeGreaterThan(0)
    const covered = new Set(pages.flatMap((p) => p.keys))
    expect([...covered].sort()).toEqual([...L1_DOCUMENT_KEYS].sort())
  })

  it.each(pages.map((p) => [`${p.slug}/${p.page}`, p] as const))(
    'test_UAT_FC_REQ_175_every_node_and_document_key_of_%s_round_trips',
    async (_name, target) => {
      // A COPY. The corpus is the repo's own record of what the importer
      // produced; a test that wrote into it would be editing its own fixture.
      cpSync(
        path.join(CORPUS, target.slug),
        path.join(cwd, 'storage', 'sites', target.slug),
        { recursive: true },
      )
      const box = await consultant(target.slug)

      // Every node the reproduction emitted is reachable AND writable: read it
      // through the surface, write exactly it back, and the page still validates.
      // This is what catches a surface that strips or refuses something the
      // importer emits — the gap that widens every time L1 grows.
      const map = await json<{ segments: { path: string; module?: string; slot?: string }[] }>(
        box,
        'describe_page',
        { page: target.page },
      )
      expect(map.segments.length).toBeGreaterThan(0)

      for (const segment of map.segments) {
        const scope = {
          page: target.page,
          path: segment.path,
          ...(segment.module === undefined ? {} : { module: segment.module }),
          ...(segment.slot === undefined ? {} : { slot: segment.slot }),
        }
        const read = await json<{ node: L1Node }>(box, 'get_l1', scope)
        const written = await box.run('set_l1', { ...scope, node: read.node })
        expect(written, segment.path).not.toContain('SCHEMA_INVALID')
      }

      // And every document-level key it emitted, through the pair this ticket
      // added. `resources`, `column` and the palette-referenced colours are the
      // ones that had no path at all before.
      const style = await json<{ document: Record<string, unknown> }>(box, 'get_page_style', {
        page: target.page,
      })
      for (const key of target.keys) {
        expect(style.document, key).toHaveProperty(key)
        const answer = await box.run('set_page_style', {
          page: target.page,
          style: { [key]: style.document[key] },
        })
        expect(answer, key).not.toContain('SCHEMA_INVALID')
      }

      const after = await json<{ document: Record<string, unknown> }>(box, 'get_page_style', {
        page: target.page,
      })
      expect(after.document).toEqual(style.document)
    },
    120_000,
  )
})
