/**
 * [[REQ-301]] — **a new page that is an existing one.**
 *
 * WHAT THIS FILE PROVES. That `copy_page` produces a page holding everything the
 * page it was copied from holds — its content, the way the page itself is
 * painted, the components on it and how they are set up — under a new id, a new
 * address and a new title, and that it does so as one call rather than as a
 * page-long transcription. The request exists because the transcription was the
 * cost: thirteen top-level elements read one at a time and written out again,
 * sequenced because a document refuses duplicate ids, paid afresh for every
 * variant. An operation that leaves any part of that to the caller has not
 * closed the gap.
 *
 * SO EVERY CASE DRIVES THE REAL CONSULTANT TOOLBOX (`createL1Toolbox`, with the
 * grant it ships with) and never `editPageCopy` directly. A test calling the edit
 * function would prove a page can be copied and say nothing about whether the
 * assistant can reach it — and "the assistant could not do this" is the whole of
 * the request.
 *
 * THE IDS ARE NOT REWRITTEN, AND §"Element ids" ON THE TICKET SAYS WHY. The
 * request assumed a rename was required "since duplicates are refused". They are
 * refused *within one document*, because a node id becomes a real DOM id on that
 * page; nothing is site-wide but the page id and the page path, and this
 * operation is handed fresh values for both. Keeping the ids is therefore not a
 * shortcut but the safer reading: every intra-page reference survives by
 * construction rather than by a rewrite remembering to catch it. §3 asserts that
 * with the one reference class the validator actually checks — an `action` that
 * opens a `dialog` by id — because a rewrite that renamed the panel and missed
 * the button would be refused there and nowhere else.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *a copy that arrives unpainted* — the page style lives on the document, so
 *     a copy that carried `root` and dropped the document's own fields would look
 *     like a copy of the content and nothing else;
 *   - *a copy that arrives empty* — which is the blocker filed alongside this
 *     request, and the reason §2 writes to the copy immediately rather than
 *     assuming it can;
 *   - *components left behind, or brought across unconfigured* — the second is
 *     worse, because the page still renders and the thing it renders is wrong;
 *   - *image bytes duplicated* — a second copy of every picture per variant, for
 *     nothing: the handles already name what the site holds;
 *   - *the two pages sharing structure* — an edit to the copy reaching back into
 *     the original is the one failure a copy must not have;
 *   - *a refusal that has already written something* — the draft must be exactly
 *     as it was, or "try a different id" is not safe advice.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, run } from '../tools/generate/src/cli'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox'
import { validateSite } from '../packages/site-schema/src/index'

const SLUG = 'harbour'

/** The asset the source page's picture names. Bytes are irrelevant; the handle is not. */
const IMAGE = 'harbour.png'

let cwd: string

interface Box {
  run: (tool: string, input: Record<string, unknown>) => Promise<string>
  toolNames: () => string[]
}

/** The consultant, with exactly the grant it ships with. Nothing is added. */
function consultant(): Promise<Box> {
  return createL1Toolbox(SLUG, { cwd, sandbox: true }) as Promise<Box>
}

/** A read's payload, with the provenance markers a consumer strips after reading. */
function unwrap(answer: string): string {
  return answer.replace(/^<<<untrusted>>>\n/, '').replace(/\n<<<\/untrusted>>>$/, '')
}

async function json<T>(box: Box, tool: string, input: Record<string, unknown> = {}): Promise<T> {
  const answer = await box.run(tool, input)
  expect(answer, `${tool} was expected to succeed`).not.toMatch(/^Error:/)
  return JSON.parse(unwrap(answer)) as T
}

/**
 * Run an operation that must be REFUSED, and hand back what the caller was told.
 * The surface answers a refusal rather than throwing one — a model in a tool loop
 * can correct from words and cannot correct from an exception.
 */
async function refused(box: Box, tool: string, input: Record<string, unknown>): Promise<string> {
  const answer = await box.run(tool, input)
  expect(answer, `${tool} was expected to be refused`).toMatch(/^Error:/)
  return answer
}

const draftDir = (): string => path.join(cwd, 'storage', 'sandbox', SLUG, 'draft')

/** The whole draft as bytes, so "a refusal wrote nothing" is a comparison and not a claim. */
function draftSnapshot(): Record<string, string> {
  const out: Record<string, string> = {}
  const walk = (dir: string, prefix: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const here = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(here, `${prefix}${entry.name}/`)
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      else out[`${prefix}${entry.name}`] = require('node:fs').readFileSync(here, 'base64')
    }
  }
  walk(draftDir(), '')
  return out
}

/** One page as the store holds it, read off disk — the definition, not a projection. */
function storedPage(id: string): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('node:fs')
  return JSON.parse(fs.readFileSync(path.join(draftDir(), 'pages', `${id}.json`), 'utf8'))
}

function storedSite(): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('node:fs')
  const base = JSON.parse(fs.readFileSync(path.join(draftDir(), 'site.json'), 'utf8'))
  const dir = path.join(draftDir(), 'pages')
  const pages = readdirSync(dir)
    .filter((n) => n.endsWith('.json'))
    .map((n) => JSON.parse(fs.readFileSync(path.join(dir, n), 'utf8')))
  return { ...base, pages }
}

/**
 * The page the copy is taken from: a dark treatment carrying every kind of thing
 * the request says must come across — words, a picture, a panel opened by a
 * button elsewhere in the tree, and a seam with a configured component in it.
 *
 * AUTHORED THROUGH THE SURFACE, not written to disk, so what is copied is a page
 * the assistant could have built — which is the page it will actually be asked
 * to copy.
 */
async function authorSourcePage(box: Box): Promise<void> {
  await json(box, 'set_l1', {
    page: 'home',
    path: '0',
    node: {
      kind: 'container',
      id: 'root',
      layout: 'stack',
      align: 'center',
      gapPx: 32,
      padding: { topPx: 96, rightPx: 24, bottomPx: 96, leftPx: 24 },
      children: [
        {
          kind: 'text',
          id: 'headline',
          text: 'Quiet Harbour',
          axes: { color: '#f5f5f5', fontSizePx: 48, fontWeight: 700, lineHeightPx: 56 },
        },
        {
          kind: 'image',
          id: 'hero-shot',
          src: `/assets/${IMAGE}`,
          alt: 'The harbour at dusk',
        },
        {
          kind: 'text',
          id: 'open-rates',
          text: 'See our rates',
          action: { opens: 'rates-panel' },
          axes: { color: '#9ad7c4', fontSizePx: 18, fontWeight: 600, lineHeightPx: 26 },
        },
        {
          kind: 'box',
          id: 'rates-panel',
          dialog: { placement: 'center', ariaLabel: 'Rates' },
          children: [
            {
              kind: 'text',
              id: 'rates-body',
              text: 'From £120 a night.',
              axes: { color: '#111827', fontSizePx: 16, fontWeight: 400, lineHeightPx: 24 },
            },
          ],
        },
        { kind: 'slot', name: 'gallery' },
      ],
    },
  })

  await json(box, 'set_page_style', {
    page: 'home',
    style: { background: '#101014', textColor: '#f5f5f5' },
  })

  await json(box, 'add_component', {
    page: 'home',
    name: 'views',
    behavior: 'carousel',
    slot: 'gallery',
    config: { autoplay: true, loop: true },
    presentation: {
      slide: [
        {
          kind: 'box',
          id: 'slide-one',
          children: [
            {
              kind: 'text',
              id: 'slide-one-caption',
              text: 'The east quay',
              axes: { color: '#f5f5f5', fontSizePx: 14, fontWeight: 400, lineHeightPx: 20 },
            },
          ],
        },
      ],
    },
  })
}

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'req301-'))
  cmdNew(SLUG, { cwd, sandbox: true })
  // The picture the source page names. `add_asset` is not in the consultant's
  // grant, and this is fixture rather than behaviour under test.
  mkdirSync(path.join(draftDir(), 'assets'), { recursive: true })
  writeFileSync(path.join(draftDir(), 'assets', IMAGE), Buffer.from([0x89, 0x50, 0x4e, 0x47]))
})
afterEach(() => rmSync(cwd, { recursive: true, force: true }))

describe('REQ-301 — a copy arrives holding what it was copied from', () => {
  /**
   * The central claim. Everything the request lists — content, page style,
   * components with their configuration — is on the copy, and only the three
   * things that identify a page are different.
   *
   * ASSERTED AS ONE COMPARISON of the whole stored definition rather than as a
   * handful of spot-checks, because the failure this is guarding against is
   * *something was left behind*, and a spot-check can only ever find the things
   * somebody thought to name.
   */
  it('test_UAT_FC_REQ-301_a_copy_is_the_source_page_but_for_id_path_and_title', async () => {
    const box = await consultant()
    await authorSourcePage(box)

    const source = storedPage('home')
    await json(box, 'copy_page', {
      from: 'home',
      page: 'home-dark',
      path: 'home-dark',
      title: 'Home (dark)',
    })

    const copy = storedPage('home-dark')
    expect({ ...copy, id: source.id, slug: source.slug, title: source.title }).toEqual(source)
    expect(copy.id).toBe('home-dark')
    expect(copy.slug).toBe('home-dark')
    expect(copy.title).toBe('Home (dark)')

    // The page style is on the DOCUMENT, so a copy that carried only `root`
    // would pass an assertion about content and arrive unpainted. Compared
    // through the surface that projects it, minus the envelope naming which page
    // was asked about — which is the one field that SHOULD differ.
    const styleOf = async (page: string): Promise<unknown> =>
      (await json<{ document: unknown }>(box, 'get_page_style', { page })).document
    expect(await styleOf('home-dark')).toEqual(await styleOf('home'))

    // The component came across MOUNTED AND CONFIGURED, not merely present — the
    // worse failure of the two, because a page missing its carousel is obvious
    // and a page whose carousel forgot its settings renders and is wrong.
    // Compared against the source's own listing, so the claim is "the same
    // components" rather than a shape restated here that could drift.
    const componentsOf = async (page: string): Promise<unknown> =>
      (await json<{ components: unknown }>(box, 'describe_page', { page })).components
    expect(await componentsOf('home-dark')).toEqual([
      { id: 'views', type: 'carousel', version: 3, slot: 'gallery', config: { autoplay: true, loop: true } },
    ])
    expect(await componentsOf('home-dark')).toEqual(await componentsOf('home'))

    // And it is a page like any other: it is in the list, under its own title.
    const listed = await json<{ pages: { id: string; title: string }[] }>(box, 'list_pages')
    expect(listed.pages.map((p) => p.id)).toEqual(expect.arrayContaining(['home', 'home-dark']))
  })

  /**
   * The independence claim. A copied page is born holding a document root, so it
   * is editable the instant it exists — no scaffolding step, and nothing waiting
   * on the blocker filed alongside this request. This is what makes copy usable
   * on its own rather than only once that is fixed.
   *
   * Both writes are made, because they fail for different reasons: `set_l1`
   * needs an address to resolve and `set_page_style` needs a document to project.
   */
  it('test_UAT_FC_REQ-301_the_copy_is_editable_immediately_with_no_scaffolding', async () => {
    const box = await consultant()
    await authorSourcePage(box)
    await json(box, 'copy_page', { from: 'home', page: 'home-light', title: 'Home (light)' })

    await json(box, 'set_page_style', { page: 'home-light', style: { background: '#fdfdfb' } })
    await json(box, 'set_l1', {
      page: 'home-light',
      path: '0.0',
      node: {
        kind: 'text',
        id: 'headline',
        text: 'Quiet Harbour — in daylight',
        axes: { color: '#101014', fontSizePx: 48, fontWeight: 700, lineHeightPx: 56 },
      },
    })

    const restyled = storedPage('home-light') as { l1: { background: string; root: { children: { text: string }[] } } }
    expect(restyled.l1.background).toBe('#fdfdfb')
    expect(restyled.l1.root.children[0].text).toBe('Quiet Harbour — in daylight')

    // THE ORIGINAL IS UNTOUCHED, which is the whole point of copying before
    // restyling: the two treatments exist at once and can be compared.
    const original = storedPage('home') as { l1: { background: string; root: { children: { text: string }[] } } }
    expect(original.l1.background).toBe('#101014')
    expect(original.l1.root.children[0].text).toBe('Quiet Harbour')
  })

  /**
   * Ids are kept, and the references built on them still resolve.
   *
   * THE VALIDATOR IS THE WITNESS. `action.opens` must name a node carrying
   * `dialog`, and that is checked over the whole document — so a rewrite that
   * renamed the panel and missed the button produces a site that does not
   * validate. Running `validateSite` over the resulting definition is therefore
   * a stronger statement than comparing the ids by hand.
   */
  it('test_UAT_FC_REQ-301_ids_are_kept_so_intra_page_references_survive', async () => {
    const box = await consultant()
    await authorSourcePage(box)
    await json(box, 'copy_page', { from: 'home', page: 'home-dark', title: 'Home (dark)' })

    const copy = storedPage('home-dark') as {
      l1: { root: { children: ({ id?: string; action?: { opens?: string }; dialog?: unknown })[] } }
    }
    const ids = copy.l1.root.children.map((c) => c.id)
    expect(ids).toEqual(['headline', 'hero-shot', 'open-rates', 'rates-panel', undefined])

    const opener = copy.l1.root.children.find((c) => c.action !== undefined)
    expect(opener?.action?.opens).toBe('rates-panel')
    expect(copy.l1.root.children.find((c) => c.id === 'rates-panel')?.dialog).toBeDefined()

    const verdict = validateSite(storedSite())
    expect(verdict.errors ?? [], JSON.stringify(verdict.errors ?? [])).toEqual([])
  })

  /**
   * Pictures are referenced, not duplicated. The copy names the same handles and
   * the site holds exactly the files it held before — which is what makes a
   * variant cost a page definition rather than a second copy of every image.
   */
  it('test_UAT_FC_REQ-301_images_are_referenced_and_no_bytes_are_duplicated', async () => {
    const box = await consultant()
    await authorSourcePage(box)
    const before = await json<{ assets: unknown[] }>(box, 'list_assets')

    await json(box, 'copy_page', { from: 'home', page: 'home-dark' })

    expect(await json<{ assets: unknown[] }>(box, 'list_assets')).toEqual(before)
    expect(readdirSync(path.join(draftDir(), 'assets'))).toEqual([IMAGE])

    const srcOf = (id: string): unknown =>
      (storedPage(id) as { l1: { root: { children: { kind: string; src?: string }[] } } }).l1.root.children.find(
        (c) => c.kind === 'image',
      )?.src
    expect(srcOf('home-dark')).toBe(`/assets/${IMAGE}`)
    expect(srcOf('home-dark')).toBe(srcOf('home'))
  })

  /**
   * The defaults, which are what make the short call the ordinary one: `path`
   * falls back to the new page id exactly as `add_page`'s does, and `title` to
   * the source page's — a copy that arrived untitled would not be a copy.
   */
  it('test_UAT_FC_REQ-301_path_defaults_to_the_new_id_and_title_to_the_sources', async () => {
    const box = await consultant()
    await authorSourcePage(box)
    await json(box, 'copy_page', { from: 'home', page: 'home-dark' })

    const copy = storedPage('home-dark')
    expect(copy.slug).toBe('home-dark')
    expect(copy.title).toBe(storedPage('home').title)
  })

  /**
   * The refusals, and the property that makes them safe to act on.
   *
   * EACH REFUSAL IS FOLLOWED BY A BYTE COMPARISON OF THE WHOLE DRAFT, because
   * "choose a different id" is only good advice if the failed attempt left
   * nothing behind — a half-written page under a taken name is worse than no
   * operation at all.
   */
  it('test_UAT_FC_REQ-301_a_refused_copy_names_what_is_wrong_and_writes_nothing', async () => {
    const box = await consultant()
    await authorSourcePage(box)
    await json(box, 'copy_page', { from: 'home', page: 'home-dark', path: 'dark' })

    const before = draftSnapshot()

    expect(await refused(box, 'copy_page', { from: 'nowhere', page: 'x' })).toMatch(/nowhere/)
    expect(await refused(box, 'copy_page', { from: 'home', page: 'home-dark' })).toMatch(
      /already exists/i,
    )
    expect(await refused(box, 'copy_page', { from: 'home', page: 'home-two', path: 'dark' })).toMatch(
      /already used/i,
    )

    expect(draftSnapshot()).toEqual(before)
  })

  /**
   * No new surface. The operation is declared, it is in the grant a consultant
   * already holds, and it is in `ManagePages` beside the other ways a page comes
   * into being — so nobody has to be given anything new to use it.
   */
  it('test_UAT_FC_REQ-301_copy_page_is_reachable_with_the_grant_that_already_exists', async () => {
    const box = await consultant()
    expect(box.toolNames()).toContain('copy_page')
  })

  /**
   * `1c` copies a page too, over the same function — so the CLI and the
   * assistant author a copy with one vocabulary, as they already do for adding,
   * updating and removing one. A second implementation behind the CLI is how the
   * two would come to disagree about what a copy is.
   */
  it('test_UAT_FC_REQ-301_the_cli_copies_a_page_over_the_same_function', async () => {
    const box = await consultant()
    await authorSourcePage(box)

    const origCwd = process.cwd()
    process.chdir(cwd)
    try {
      const logs: string[] = []
      const origLog = console.log
      console.log = (...a: unknown[]) => logs.push(a.map(String).join(' '))
      try {
        await run(['page', 'copy', SLUG, 'home', 'home-dark', '--title', 'Home (dark)', '--json'])
      } finally {
        console.log = origLog
      }
      const envelope = JSON.parse(logs.join('\n')) as { ok: boolean; data: { page: { id: string } } }
      expect(envelope.ok).toBe(true)
      expect(envelope.data.page.id).toBe('home-dark')
    } finally {
      process.chdir(origCwd)
    }

    const source = storedPage('home')
    const copy = storedPage('home-dark')
    expect({ ...copy, id: source.id, slug: source.slug, title: source.title }).toEqual(source)
    expect(copy.title).toBe('Home (dark)')
  })
})
