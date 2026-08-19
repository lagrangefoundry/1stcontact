import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, cmdRender, startBuilder, type BuilderHandle } from '../tools/generate/src/cli'
import {
  createL1Toolbox,
  l1Operations,
  nodeOperations,
  L1_DECLARATION,
  L1_INSTANCES,
} from '../tools/generate/src/cli/ai/toolbox'
import type { L1Node } from '@1stcontact/site-schema'
import { fsOpts } from './support/site-factory'

/**
 * **Composing a page through the control surface** (story-189fc1ac).
 *
 * Read and write symmetry around ONE address: a map that answers "where is
 * everything" rather than "what can I edit", a read that returns a subtree
 * exactly as stored, and a replace that puts one back. Adding and removing are
 * that same replace applied to a group; there is no insert and no delete, and no
 * way to submit a whole page.
 *
 * The security guarantee — "it cannot write markup, stylesheets or scripts" —
 * has MOVED from the shape of the surface to the closure of the element
 * vocabulary, so it is measured here rather than assumed (DOC-2).
 *
 * Nothing is mocked. The draft's bytes on disk and the rendered document are the
 * only evidence that counts, and the operator's own click-to-edit gesture is
 * exercised over the same `/api/copy` transport the browser uses.
 */

const SLUG = 'studio'

/** Longer than any label bound a map could reasonably impose, and badly spaced. */
const LONG_TEXT = 'A painted band\n   that carries on well past whatever bound a short label imposes.'
/** Collapsed to single spaces — what a label is made from. */
const COLLAPSED = LONG_TEXT.replace(/\s+/g, ' ').trim()

/**
 * A page carrying every shape the pair has to survive: copy nested inside
 * painted containers, a palette REFERENCE rather than a literal, a per-width
 * track, a link role, an image with alt text and one without, and a mounting
 * seam. The reference and the track are exactly what a resolved or projected
 * read would quietly destroy, which is why they are here.
 */
const SEEDED_ROOT: L1Node = {
  kind: 'container',
  id: 'root',
  layout: 'stack',
  children: [
    {
      kind: 'container',
      layout: 'stack',
      axes: { surfaceFill: { ref: 'ink' } },
      children: [
        {
          kind: 'text',
          text: LONG_TEXT,
          axes: { fontSizePx: 32, color: { ref: 'paper' } },
          responsive: {
            fontSizePx: {
              keyframes: [
                { at: 375, value: 24 },
                { at: 1280, value: 32 },
              ],
            },
          },
        },
        { kind: 'image', src: 'assets/hero.jpg', alt: 'A hero image' },
        { kind: 'image', src: 'assets/plate.jpg', alt: '' },
      ],
    },
    {
      kind: 'container',
      layout: 'row',
      gapPx: 12,
      children: [{ kind: 'text', text: '  Read   on ', link: { href: '/about' } }],
    },
    { kind: 'slot', name: 'signup-form', behavior: 'contact-form' },
  ],
}

/** A component the surface can instantiate into the seeded seam. */
const SIGNUP_CONFIG = {
  action: '/api/lead',
  fields: [
    {
      name: 'email',
      label: 'Email address',
      labelMode: 'placeholder',
      type: 'email',
      required: true,
    },
  ],
  submitLabel: 'Join the waitlist',
}

let cwd: string

const pagePath = (page = 'home'): string =>
  path.join(cwd, 'storage', 'sites', SLUG, 'draft', 'pages', `${page}.json`)

/** The draft's bytes — the only evidence that an all-or-nothing write is atomic. */
function draftBytes(page = 'home'): string {
  return readFileSync(pagePath(page), 'utf8')
}

function readPage(page = 'home'): Record<string, unknown> {
  return JSON.parse(draftBytes(page)) as Record<string, unknown>
}

function homeRoot(): L1Node {
  return (readPage() as { l1: { root: L1Node } }).l1.root
}

/** Put a root on the seeded page, leaving its component instances alone. */
function writeRoot(root: L1Node): void {
  const page = readPage() as { l1: { root: L1Node } }
  page.l1.root = root
  writeFileSync(pagePath(), JSON.stringify(page, null, 2))
}

function seedPage(): void {
  const page = readPage() as { l1: { root: L1Node }; modules: unknown[] }
  page.l1.root = SEEDED_ROOT
  page.modules = []
  writeFileSync(pagePath(), JSON.stringify(page, null, 2))

  const siteFile = path.join(cwd, 'storage', 'sites', SLUG, 'draft', 'site.json')
  const site = JSON.parse(readFileSync(siteFile, 'utf8')) as { palette?: Record<string, unknown> }
  site.palette = { ...(site.palette ?? {}), ink: { value: '#101822' }, paper: { value: '#f5f2ea' } }
  writeFileSync(siteFile, JSON.stringify(site, null, 2))
}

/** A read's payload, with the provenance markers a consumer strips after reading them. */
function unwrap(answer: string): string {
  return answer.replace(/^<<<untrusted>>>\n/, '').replace(/\n<<<\/untrusted>>>$/, '')
}

interface Box {
  /**
   * `Toolbox.run` awaits what `surface.invoke` returns — REQ-142 made every L1
   * operation async, and the model's tool loop awaits the answer. So does every
   * call below.
   */
  run: (tool: string, input: Record<string, unknown>) => Promise<string>
  toolNames: () => string[]
  manual: () => string
}

function caretaker(): Promise<Box> {
  return createL1Toolbox(SLUG, { cwd }) as Promise<Box>
}

async function json<T>(box: Box, tool: string, input: Record<string, unknown> = {}): Promise<T> {
  return JSON.parse(unwrap(await box.run(tool, input))) as T
}

interface Segment {
  path: string
  kind: string
  label: string
  module?: string
  slot?: string
}

interface PageMap {
  page: Record<string, unknown>
  components: Record<string, unknown>[]
  segments: Segment[]
}

/** Every address a tree contains, walked in the test rather than by the code under test. */
function walk(nodes: readonly L1Node[], prefix: readonly number[] = []): { path: string; kind: string }[] {
  return nodes.flatMap((node, index) => {
    const at = [...prefix, index]
    const children = (node as { children?: L1Node[] }).children ?? []
    return [{ path: at.join('.'), kind: node.kind }, ...walk(children, at)]
  })
}

/** The same walk over each component instance's slots, which are addressable too. */
function moduleWalks(
  page: Record<string, unknown>,
): { module: string; slot: string; entries: { path: string; kind: string }[] }[] {
  const modules = Array.isArray(page.modules) ? (page.modules as Record<string, unknown>[]) : []
  const out: { module: string; slot: string; entries: { path: string; kind: string }[] }[] = []
  for (const instance of modules) {
    const id = instance.id as string
    const slots = (instance.slots ?? {}) as Record<string, unknown>
    for (const [slot, raw] of Object.entries(slots)) {
      const roots = (Array.isArray(raw) ? raw : [raw]) as L1Node[]
      out.push({ module: id, slot, entries: walk(roots) })
    }
  }
  return out
}

/** How many addresses a subtree occupies — one per element, itself included. */
const subtreeSize = (node: L1Node): number => walk([node]).length

/** Add the contact form the seeded seam was put there for. */
async function addForm(box: Box): Promise<void> {
  const answer = await box.run('add_component', {
    page: 'home',
    name: 'signup',
    behavior: 'contact-form',
    slot: 'signup-form',
    config: SIGNUP_CONFIG,
  })
  expect(answer).not.toContain('SCHEMA_INVALID')
}

function fresh(prefix: string): void {
  cwd = mkdtempSync(path.join(tmpdir(), prefix))
  cmdNew(SLUG, { cwd })
  seedPage()
}

// ── the map: where is everything ─────────────────────────────────────────────

describe('the page map answers where every element is', () => {
  beforeEach(() => fresh('compose-map-'))
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_AC1083_map_emits_every_element_with_its_address_kind_and_scope', async () => {
    const box = await caretaker()
    await addForm(box)

    const map = await json<PageMap>(box, 'describe_page', { page: 'home' })
    const stored = readPage()

    // Compared against a walk of the STORED definition written here, not against
    // the mapping implementation's own idea of which elements are interesting.
    // That is the whole point: the old projection emitted only what carried a
    // copy field, so every layout container was invisible.
    const ownTree = walk([(stored as { l1: { root: L1Node } }).l1.root])
    const pageEntries = map.segments.filter((s) => s.module === undefined)
    expect(pageEntries.map((s) => ({ path: s.path, kind: s.kind }))).toEqual(ownTree)

    // The containers are exactly what a caller composing a page needs and exactly
    // what exposes no editable field of its own.
    expect(pageEntries.filter((s) => s.kind === 'container').map((s) => s.path)).toEqual([
      '0',
      '0.0',
      '0.1',
    ])

    // Every entry carries the address a read or a write takes, a kind, and a label.
    for (const segment of map.segments) {
      expect(segment.path).toMatch(/^\d+(\.\d+)*$/)
      expect(typeof segment.kind).toBe('string')
      expect(typeof segment.label).toBe('string')
    }

    // An element in the page's own tree carries no component scope...
    for (const segment of pageEntries) {
      expect(segment).not.toHaveProperty('module')
      expect(segment).not.toHaveProperty('slot')
    }

    // ...and one inside a component instance's slot names its instance AND slot,
    // together, because an address inside a slot is meaningless without both.
    const scoped = moduleWalks(stored)
    expect(scoped.length).toBeGreaterThan(0)
    let mapped = pageEntries.length
    for (const { module, slot, entries } of scoped) {
      const inSlot = map.segments.filter((s) => s.module === module && s.slot === slot)
      expect(inSlot.map((s) => ({ path: s.path, kind: s.kind }))).toEqual(entries)
      mapped += entries.length
    }
    // No entry belongs to neither space, and none is emitted twice.
    expect(map.segments).toHaveLength(mapped)
  })

  it('test_UAT_AC1084_labels_identify_an_element_and_carry_no_styling', async () => {
    const box = await caretaker()
    await addForm(box)

    const answer = await box.run('describe_page', { page: 'home' })
    const map = JSON.parse(unwrap(answer)) as PageMap
    const at = (address: string): Segment =>
      map.segments.find((s) => s.path === address && s.module === undefined) as Segment

    // A text run is labelled by its own words, whitespace collapsed...
    expect(at('0.1.0').label).toBe('Read on')
    // ...and cut with an ellipsis beyond a short bound, so one long paragraph
    // cannot dominate the listing.
    const long = at('0.0.0').label
    expect(COLLAPSED.length).toBeGreaterThan(long.length)
    expect(long.endsWith('…')).toBe(true)
    expect(COLLAPSED.startsWith(long.slice(0, -1))).toBe(true)
    expect(long).not.toMatch(/\s\s/)

    // An image by its alt text, or by its file when it has none.
    expect(at('0.0.1').label).toBe('A hero image')
    expect(at('0.0.2').label).toBe('assets/plate.jpg')

    // A component seam by its slot name and the behaviour it names.
    expect(at('0.2').label).toBe('signup-form (contact-form)')

    // A box or a row by its layout and how many children it holds.
    expect(at('0').label).toBe('stack, 3 children')
    expect(at('0.1').label).toBe('row, 1 child')

    // A control by the control's name — read off the stored instance, so this
    // checks the RULE rather than agreeing with a fixture.
    const controls = map.segments.filter((s) => s.kind === 'control')
    expect(controls.length).toBeGreaterThan(0)
    const stored = readPage()
    for (const control of controls) {
      const scope = moduleWalks(stored).find(
        (w) => w.module === control.module && w.slot === control.slot,
      )
      expect(scope).toBeDefined()
      const instance = (stored.modules as Record<string, unknown>[]).find(
        (m) => m.id === control.module,
      ) as Record<string, unknown>
      const raw = (instance.slots as Record<string, unknown>)[control.slot as string]
      const roots = (Array.isArray(raw) ? raw : [raw]) as L1Node[]
      const node = control.path
        .split('.')
        .map(Number)
        .reduce<L1Node | undefined>(
          (acc, index, depth) =>
            depth === 0 ? roots[index] : ((acc as { children?: L1Node[] })?.children ?? [])[index],
          undefined,
        )
      expect(control.label).toBe((node as { control: string }).control)
    }

    // Not one typed appearance property reaches the map, whatever the element —
    // which is what keeps its size a function of how many elements a page has.
    const styling = new Set<string>(['axes', 'responsive'])
    const collect = (node: L1Node): void => {
      const axes = (node as { axes?: Record<string, unknown> }).axes ?? {}
      for (const key of Object.keys(axes)) styling.add(key)
      for (const child of (node as { children?: L1Node[] }).children ?? []) collect(child)
    }
    collect(SEEDED_ROOT)
    for (const name of styling) expect(answer).not.toContain(name)

    // And measured rather than argued: the same tree, richly styled and not,
    // produces the same map.
    const unstyled = (node: L1Node): L1Node => {
      const rest = { ...(node as Record<string, unknown>) }
      delete rest.axes
      delete rest.responsive
      const children = rest.children as L1Node[] | undefined
      if (children) rest.children = children.map(unstyled)
      return rest as L1Node
    }
    writeRoot(unstyled(SEEDED_ROOT))
    const light = await box.run('describe_page', { page: 'home' })
    writeRoot(SEEDED_ROOT)
    const heavy = await box.run('describe_page', { page: 'home' })
    expect(heavy).toBe(light)
  })
})

// ── read and replace are symmetric around one address ────────────────────────

describe('one address reads and writes the element at it', () => {
  beforeEach(() => fresh('compose-pair-'))
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_AC1085_get_returns_the_subtree_exactly_as_stored', async () => {
    const box = await caretaker()
    await addForm(box)

    const read = await json<{ target: Record<string, unknown>; node: L1Node }>(box, 'get_l1', {
      page: 'home',
      path: '0.0',
    })

    // Verbatim is the DECISION, not a default: the palette ref stays a ref and
    // the per-width track stays a track, because a resolved view reads better
    // and cannot be written back.
    const seeded = (SEEDED_ROOT as { children: L1Node[] }).children[0]
    expect(read.node).toEqual(seeded)
    const text = (read.node as { children: { axes: unknown; responsive: unknown }[] }).children[0]
    expect(text.axes).toEqual({ fontSizePx: 32, color: { ref: 'paper' } })
    expect(text.responsive).toEqual({
      fontSizePx: { keyframes: [{ at: 375, value: 24 }, { at: 1280, value: 32 }] },
    })

    // The reply states where it read from: the page and the address asked for,
    // and an unscoped read is attributed to no component on the page.
    const map = await json<PageMap>(box, 'describe_page', { page: 'home' })
    expect(read.target).toMatchObject({ pageId: 'home', path: '0.0' })
    expect(map.components.map((c) => c.id)).not.toContain(read.target.module)

    // ...and, inside a component instance, the scope the address is resolved in.
    const inSlot = map.segments.find((s) => s.module !== undefined) as Segment
    const scoped = await json<{ target: Record<string, unknown>; node: L1Node }>(box, 'get_l1', {
      page: 'home',
      path: inSlot.path,
      module: inSlot.module,
      slot: inSlot.slot,
    })
    expect(scoped.target).toMatchObject({
      pageId: 'home',
      path: inSlot.path,
      module: inSlot.module,
      slot: inSlot.slot,
    })
    const raw = (
      (readPage().modules as Record<string, unknown>[]).find((m) => m.id === inSlot.module) as {
        slots: Record<string, unknown>
      }
    ).slots[inSlot.slot as string]
    expect(scoped.node).toEqual((Array.isArray(raw) ? raw : [raw])[Number(inSlot.path)])
  })

  it('test_UAT_AC1086_writing_back_what_was_read_is_accepted_and_changes_nothing', async () => {
    const box = await caretaker()
    const before = readPage()

    const read = await json<{ node: L1Node }>(box, 'get_l1', { page: 'home', path: '0' })
    const answer = await box.run('set_l1', { page: 'home', path: '0', node: read.node })

    // Asserted FIRST: a refused write also leaves the page unchanged, so
    // unchanged-ness on its own is not evidence of a round trip.
    expect(JSON.parse(answer)).toMatchObject({ changed: ['0'] })

    // Compared as a structure rather than as bytes — a reply is serialised in
    // key-sorted order, so byte-identity would be measuring the serialiser.
    expect(readPage()).toEqual(before)
  })

  it('test_UAT_AC1087_replacing_an_element_replaces_its_subtree_and_spares_its_siblings', async () => {
    const box = await caretaker()
    await box.run('add_page', { page: 'about', title: 'About' })
    const otherPage = draftBytes('about')

    const before = homeRoot() as { children: L1Node[] }
    const beforeCount = walk([before]).length
    const replaced = before.children[1]

    // Differently shaped from what it replaces: a box of three runs where a row
    // of one was. The replacement is whole, not a patch.
    const replacement: L1Node = {
      kind: 'box',
      axes: { surfaceFill: '#101822' },
      children: [
        { kind: 'text', text: 'One' },
        { kind: 'text', text: 'Two' },
        { kind: 'text', text: 'Three' },
      ],
    }
    const answer = JSON.parse(
      await box.run('set_l1', { page: 'home', path: '0.1', node: replacement }),
    ) as { changed: string[]; message: string }

    // The reply names the address that changed.
    expect(answer.changed).toEqual(['0.1'])
    expect(answer.message).toContain('0.1')

    const after = homeRoot() as { children: L1Node[] }
    expect(after.children[1]).toEqual(replacement)

    // Its siblings — and every other page — are byte-identical to before.
    expect(JSON.stringify(after.children[0])).toBe(JSON.stringify(before.children[0]))
    expect(JSON.stringify(after.children[2])).toBe(JSON.stringify(before.children[2]))
    expect(draftBytes('about')).toBe(otherPage)

    // The page's element count moved by exactly the difference the replacement
    // implies, so nothing was inserted beside it and nothing else was dropped.
    expect(walk([after]).length).toBe(
      beforeCount - subtreeSize(replaced) + subtreeSize(replacement),
    )
  })

  it('test_UAT_AC1088_adding_and_removing_are_replacing_a_group_and_the_result_renders', async () => {
    const box = await caretaker()

    // The surface's own worked sequences say this is how it is done — there is no
    // insert operation to look for and the manual does not imply one.
    const sequences = L1_DECLARATION.sequences as { name: string; steps: string[]; note: string }[]
    const adding = sequences.find((s) => /add/i.test(s.name) && /away|remove/i.test(s.name))
    expect(adding).toBeDefined()
    expect(adding?.steps).toEqual(['describe_page', 'get_l1', 'set_l1'])
    expect(adding?.note).toMatch(/no separate way to insert or delete/i)

    // Map → read the group → write it back with one more child. Both halves are
    // needed, so this cannot pass by accident.
    const map = await json<PageMap>(box, 'describe_page', { page: 'home' })
    const rootAddress = map.segments[0].path
    const root = (await json<{ node: L1Node }>(box, 'get_l1', { page: 'home', path: rootAddress }))
      .node
    const originalChildren = (root as { children: L1Node[] }).children.length

    const nav: L1Node = {
      kind: 'container',
      layout: 'row',
      gapPx: 24,
      children: [
        { kind: 'text', text: 'About', link: { href: '/about' } },
        { kind: 'text', text: 'Contact', link: { href: '#contact' } },
      ],
    }
    const withNav = { ...root, children: [nav, ...(root as { children: L1Node[] }).children] }
    expect(
      await box.run('set_l1', { page: 'home', path: rootAddress, node: withNav }),
    ).not.toContain('SCHEMA_INVALID')

    const stored = homeRoot() as { children: L1Node[] }
    expect(stored.children).toHaveLength(originalChildren + 1)
    expect(stored.children[0]).toEqual(nav)

    // The draft says it was accepted; the render says it is a nav bar. The
    // renderer is the sole `<a>` sink, so an anchor in the published bytes means
    // the link role survived the write path. `/about` arrives document-relative,
    // because a published snapshot holds no absolute self-reference.
    const { outDir } = await cmdRender(SLUG, { cwd })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')
    expect(html).toMatch(/<a[^>]+href="about"[^>]*>About<\/a>/)
    expect(html).toMatch(/<a[^>]+href="#contact"[^>]*>Contact<\/a>/)

    // Removing is the same call with one fewer child.
    const back = (await json<{ node: L1Node }>(box, 'get_l1', { page: 'home', path: rootAddress }))
      .node
    const withoutNav = {
      ...back,
      children: (back as { children: L1Node[] }).children.slice(1),
    }
    await box.run('set_l1', { page: 'home', path: rootAddress, node: withoutNav })
    expect((homeRoot() as { children: L1Node[] }).children).toHaveLength(originalChildren)
  }, 180000)
})

// ── the guarantee moved into the vocabulary, and still holds ─────────────────

describe('the closed vocabulary is what refuses markup, stylesheets and scripts', () => {
  beforeEach(() => fresh('compose-safe-'))
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_AC1089_an_element_outside_the_vocabulary_is_refused_whole', async () => {
    const box = await caretaker()
    const before = draftBytes()

    // These six ARE the guarantee. It used to hold because no operation accepted
    // markup; it now holds because an element carrying it is not an element.
    const refused: Record<string, unknown>[] = [
      { kind: 'text', text: 'x', html: '<script>alert(1)</script>' },
      { kind: 'text', text: 'x', style: 'color:red' },
      { kind: 'text', text: 'x', link: { href: 'javascript:alert(1)' } },
      { kind: 'image', src: 'javascript:alert(1)', alt: 'x' },
      { kind: 'iframe', src: 'https://example.com' },
      { kind: 'text', text: 'x', axes: { fontSizePx: 'huge' } },
    ]

    for (const node of refused) {
      const answer = await box.run('set_l1', { page: 'home', path: '0.0.0', node })
      expect(answer, JSON.stringify(node)).toContain('SCHEMA_INVALID')
    }

    // A refusal is never a partial write: the replacement lands in a clone, the
    // whole resulting site is validated, and the clone is discarded.
    expect(draftBytes()).toBe(before)
  })

  it('test_UAT_AC1090_a_refusal_carries_the_code_and_a_recovery_strategy', async () => {
    const box = await caretaker()

    // A refusal the caller cannot act on is a dead end — it retries the identical
    // call or tells the user the site is broken. This caller does not receive the
    // offending field (the write path reports it and a `1c` user sees it; the
    // tool layer renders only the declared meaning), so the declared meaning
    // carries the STRATEGY rather than promising specifics it cannot deliver.
    const answer = await box.run('set_l1', {
      page: 'home',
      path: '0.0.0',
      node: { kind: 'text', text: 'x', axes: { fontSizePx: 'huge' } },
    })
    expect(answer).toContain('SCHEMA_INVALID')
    expect(answer).toMatch(/nothing was written/i)
    expect(answer).toMatch(/do not send it again unchanged/i)
    expect(answer).toMatch(/read the element back/i)
  })

  it('test_UAT_AC1091_an_address_that_resolves_to_nothing_writes_nothing', async () => {
    const box = await caretaker()
    const before = draftBytes()

    // Beyond the tree: refused as not-found, and told where a real address comes
    // from rather than left to guess a neighbouring one.
    const missing = await box.run('set_l1', {
      page: 'home',
      path: '9.9.9',
      node: { kind: 'text', text: 'nope' },
    })
    expect(missing).toContain('NOT_FOUND')
    expect(missing).toMatch(/re-read the listing/i)

    // Not an address at all: refused as malformed rather than resolved to
    // something nearby.
    const malformed = await box.run('set_l1', {
      page: 'home',
      path: 'first.heading',
      node: { kind: 'text', text: 'nope' },
    })
    expect(malformed).toContain('SCHEMA_INVALID')
    expect(malformed).not.toContain('NOT_FOUND')

    expect(draftBytes()).toBe(before)
  })

  it('test_UAT_AC1092_one_way_to_change_a_page_and_every_operation_is_declared', async () => {
    // Two ways to do one thing on one surface is what the no-legacy-modes rule
    // forbids: the caller would have to choose, and the narrower one would
    // silently be the wrong choice for anything structural.
    const declared = (L1_DECLARATION.operations as { op: string }[]).map((o) => o.op).sort()
    //
    // COMPOSED FROM BOTH HALVES since REQ-146: `l1Operations` is the
    // runtime-agnostic core and `nodeOperations` supplies the two that need a
    // disk (`add_asset` reads a file the operator names, `publish` snapshots a
    // tree). Node's surface is their union, and the union is what the
    // declaration describes — checking the core alone asserts a declared
    // operation is unimplemented, which is the opposite of the invariant.
    const pcOpts = fsOpts(cwd)
    const implemented = Object.keys({
      ...l1Operations(SLUG, pcOpts),
      ...nodeOperations(SLUG, pcOpts),
    }).sort()

    // Exact equality, in both directions: nothing implemented is undeclared, and
    // nothing declared is unimplemented.
    expect(implemented).toEqual(declared)
    expect(declared).toEqual(expect.arrayContaining(['get_l1', 'set_l1']))
    expect(declared).not.toContain('get_copy')
    expect(declared).not.toContain('set_copy')

    const box = await caretaker()
    expect(box.toolNames()).toEqual(expect.arrayContaining(['get_l1', 'set_l1']))
    expect(box.toolNames()).not.toContain('get_copy')
    expect(box.toolNames()).not.toContain('set_copy')
    expect(box.manual()).not.toContain('set_copy')
    expect(
      await box.run('set_copy', { page: 'home', path: '0.0.0', values: { text: 'x' } }),
    ).toMatch(/unknown tool|not enabled/i)

    // A grant naming a group the surface does not declare is a startup failure on
    // an operator's machine with a turn in flight.
    const groups = L1_DECLARATION.groups as { group: string; operations: string[] }[]
    const granted = (L1_INSTANCES.caretaker as { l1: { groups: string[] } }).l1.groups
    for (const group of granted) expect(groups.map((g) => g.group)).toContain(group)
    expect(granted).toContain('AuthorPages')
    // ...and that group is the one changing a page belongs to.
    expect(groups.find((g) => g.group === 'AuthorPages')?.operations).toContain('set_l1')
  })
})

// ── the operator's own editing gesture is untouched ──────────────────────────

/**
 * The invariants the story requires be PROVEN rather than assumed.
 *
 * `copyFieldsOf` is the click-to-edit modal's contract (REQ-117 / REQ-118) and
 * was not touched. The modal never called the toolbox, so it cannot be
 * affected — but "cannot be affected" is the claim, and the claim is what gets
 * tested. Driven over `/api/copy`, the same origin the browser talks to, on
 * subtrees the ASSISTANT authored.
 */
describe("the click-to-edit gesture still works on what the assistant composed", () => {
  let builder: BuilderHandle

  beforeAll(async () => {
    fresh('compose-modal-')

    const box = await caretaker()
    await box.run('set_l1', {
      page: 'home',
      path: '0.1',
      node: {
        kind: 'container',
        layout: 'row',
        gapPx: 8,
        children: [
          { kind: 'text', text: 'Written by the assistant.', axes: { fontSizePx: 20 } },
          { kind: 'image', src: 'assets/hero.jpg', alt: 'Also the assistant' },
        ],
      },
    })

    builder = await startBuilder({ cwd })
  }, 180000)

  afterAll(async () => {
    await builder?.close()
    if (cwd) rmSync(cwd, { recursive: true, force: true })
  })

  const copyGet = (address: string): Promise<Response> =>
    fetch(new URL(`/api/copy?slug=${SLUG}&page=home&path=${address}`, builder.url))

  it('test_UAT_AC1093_the_gesture_opens_and_saves_and_leaves_the_assistants_styling_alone', async () => {
    // An assistant-authored text run is indistinguishable to the derivation from
    // one written by hand, so the modal derives the same descriptors...
    const read = (await (await copyGet('0.1.0')).json()) as {
      kind: string
      fields: { name: string }[]
      values: Record<string, string>
    }
    expect(read.kind).toBe('text')
    // The copy field is first and is the words. REQ-135 derives the run's
    // typography beside it — for an assistant-authored node exactly as for a
    // hand-written one, which is the indistinguishability this asserts.
    expect(read.fields[0].name).toBe('text')
    expect(read.values.text).toBe('Written by the assistant.')

    const before = homeRoot() as { children: { children: { axes: unknown }[] }[] }
    const axes = JSON.stringify(before.children[1].children[0].axes)

    // ...and Save takes the same validated write path.
    const saved = await fetch(new URL('/api/copy', builder.url), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        slug: SLUG,
        page: 'home',
        path: '0.1.0',
        values: { text: 'Corrected by the operator.' },
      }),
    })
    expect(saved.status).toBe(200)

    const after = (await (await copyGet('0.1.0')).json()) as { values: Record<string, string> }
    expect(after.values.text).toBe('Corrected by the operator.')

    // Every typed appearance property the assistant set survived the operator's
    // save byte-for-byte, which is what makes the two surfaces peers.
    const stored = homeRoot() as { children: { children: { axes: unknown }[] }[] }
    expect(JSON.stringify(stored.children[1].children[0].axes)).toBe(axes)
    expect(stored.children[1].children[0].axes).toEqual({ fontSizePx: 20 })
  })

  it('test_UAT_AC1094_the_gesture_exposes_no_fields_on_a_kind_it_does_not_edit', async () => {
    // The assistant can now compose rows, boxes and plain containers freely. They
    // stay a legitimate "nothing to edit here" rather than a failure, so no form
    // opens — the gesture's exposure rule does not widen to follow the
    // assistant's wider reach.
    const answer = await copyGet('0.1')
    expect(answer.status).toBe(200)

    const container = (await answer.json()) as {
      kind: string
      fields: unknown[]
      values: Record<string, unknown>
    }
    expect(container.kind).toBe('container')
    expect(container.fields).toEqual([])
    expect(container.values).toEqual({})
  })
})
