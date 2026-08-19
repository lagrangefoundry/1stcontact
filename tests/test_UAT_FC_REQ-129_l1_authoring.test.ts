/**
 * REQ-129 — **L1 authoring on the control surface**.
 *
 * Before this ticket the assistant inherited a four-field copy editor, and it
 * inherited it accurately: `edit.ts` reached L1 only through `editCopySet`, over
 * the fields `copyFieldsOf` exposes. That is the right surface for a person
 * clicking a heading and typing words. It is the wrong surface for composing a
 * page, and the gap was measurable — on `xgd/home`, 86 of 122 nodes carry `axes`
 * that no projection reached, and the page map showed 67 of them.
 *
 * What is under test is read/write symmetry around one address:
 *
 * - the page map answers "where is everything", not "what can I edit";
 * - `get_l1` returns a subtree VERBATIM — axes, palette refs, responsive tracks,
 *   link roles, exactly as stored — because a resolved view cannot be written
 *   back, and writing back what you read is the whole point of the pair;
 * - `set_l1` replaces a subtree, and structure and roles survive the trip;
 * - the guarantee that no HTML, CSS or JavaScript can be written MOVED, from the
 *   shape of the surface to the closure of the schema, and still holds;
 * - **the operator's click-to-edit modal is untouched** — which the ticket
 *   requires be demonstrated rather than assumed, so it is exercised over the
 *   same `/api/copy` transport the browser uses.
 *
 * Nothing here mocks `edit.ts` or stubs the Toolbox. The draft on disk and the
 * rendered bytes are the only evidence that counts.
 */

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

const SLUG = 'studio'
const HEADLINE = 'A painted band.'

/**
 * A page carrying every shape the pair has to survive: copy nested two deep
 * inside painted containers, a node with a palette REFERENCE rather than a
 * literal, a responsive track, and a link role. The last three are exactly what
 * a resolved or projected read would quietly destroy, which is why they are here
 * rather than in a fixture that only has words in it.
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
          text: HEADLINE,
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
      ],
    },
    {
      kind: 'container',
      layout: 'row',
      gapPx: 12,
      children: [{ kind: 'text', text: 'Read on', link: { href: '/about' } }],
    },
  ],
}

/** Every address the seed contains, walked independently of the code under test. */
function everyAddress(node: L1Node, at: number[] = [0]): string[] {
  const kids = (node as { children?: L1Node[] }).children ?? []
  return [at.join('.'), ...kids.flatMap((kid, i) => everyAddress(kid, [...at, i]))]
}

function seedPage(cwd: string, slug: string): void {
  const homePath = path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')
  const home = JSON.parse(readFileSync(homePath, 'utf8'))
  home.l1.root = SEEDED_ROOT
  home.modules = []
  const site = path.join(cwd, 'storage', 'sites', slug, 'draft', 'site.json')
  const base = JSON.parse(readFileSync(site, 'utf8'))
  base.palette = {
    ...(base.palette ?? {}),
    ink: { value: '#101822' },
    paper: { value: '#f5f2ea' },
  }
  writeFileSync(site, JSON.stringify(base, null, 2))
  writeFileSync(homePath, JSON.stringify(home, null, 2))
}

let cwd: string

function draftBytes(): string {
  return readFileSync(
    path.join(cwd, 'storage', 'sites', SLUG, 'draft', 'pages', 'home.json'),
    'utf8',
  )
}

function homeRoot(): Record<string, unknown> {
  return (JSON.parse(draftBytes()) as { l1: { root: Record<string, unknown> } }).l1.root
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
  return createL1Toolbox(SLUG, { cwd })
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

// ── the map answers "where is everything" ────────────────────────────────────

describe('REQ-129 — the page map shows the whole page', () => {
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req129-map-'))
    cmdNew(SLUG, { cwd })
    seedPage(cwd, SLUG)
  })
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_FC_REQ_129_map_emits_every_element_including_layout_containers', async () => {
    const box = await caretaker()
    const map = await json<{ segments: Segment[] }>(box, 'describe_page', { page: 'home' })

    // Every node, not only the ones with copy fields. Compared against a walk of
    // the seed itself, so this cannot pass by agreeing with the implementation
    // about which nodes are "interesting".
    expect(map.segments.map((s) => s.path)).toEqual(everyAddress(SEEDED_ROOT))

    // The containers are what a caller composing a page needs, and they are what
    // the old projection dropped: they carry no copy field, so `copyFieldsOf`
    // returned null for them and they were skipped.
    const containers = map.segments.filter((s) => s.kind === 'container')
    expect(containers.map((s) => s.path)).toEqual(['0', '0.0', '0.1'])
  })

  it('test_UAT_FC_REQ_129_map_labels_are_recognisable_and_carry_no_axes', async () => {
    const box = await caretaker()
    const answer = await box.run('describe_page', { page: 'home' })
    const map = JSON.parse(unwrap(answer)) as { segments: Segment[] }

    // A label identifies a node among its siblings and no more. The map is the
    // cheap operation — a page is thousands of lines, and a map that inlined
    // what each element holds would defeat the reason `get_l1` is separate.
    expect(map.segments.find((s) => s.path === '0.0.0')?.label).toBe(HEADLINE)
    expect(map.segments.find((s) => s.path === '0.0.1')?.label).toBe('A hero image')
    expect(map.segments.find((s) => s.path === '0.1')?.label).toBe('row, 1 child')

    // Not one axis reaches the model here, so the map's size is bounded by the
    // node count rather than by how richly the page is styled.
    expect(answer).not.toContain('fontSizePx')
    expect(answer).not.toContain('surfaceFill')
    expect(answer).not.toContain('responsive')
  })
})

// ── read and write are symmetric around one address ──────────────────────────

describe('REQ-129 — a subtree reads and writes verbatim', () => {
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req129-pair-'))
    cmdNew(SLUG, { cwd })
    seedPage(cwd, SLUG)
  })
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_FC_REQ_129_get_l1_returns_the_subtree_exactly_as_stored', async () => {
    const box = await caretaker()
    const read = await json<{ node: unknown }>(box, 'get_l1', { page: 'home', path: '0.0' })

    // Byte-for-byte the stored subtree. Verbatim is the DECISION, not a default:
    // the palette ref stays a ref and the responsive track stays a track,
    // because a resolved view reads better and cannot be written back.
    expect(read.node).toEqual((SEEDED_ROOT as { children: L1Node[] }).children[0])
    const text = (read.node as { children: { axes: unknown; responsive: unknown }[] }).children[0]
    expect(text.axes).toEqual({ fontSizePx: 32, color: { ref: 'paper' } })
    expect(text.responsive).toEqual({
      fontSizePx: {
        keyframes: [
          { at: 375, value: 24 },
          { at: 1280, value: 32 },
        ],
      },
    })
  })

  it('test_UAT_FC_REQ_129_writing_back_what_was_read_changes_nothing', async () => {
    const box = await caretaker()
    const before = JSON.parse(draftBytes())

    // The property the whole pair rests on, measured rather than argued: if a
    // read cannot be written back unchanged, every edit silently loses whatever
    // the read dropped, and the loss compounds one turn at a time.
    const read = await json<{ node: unknown }>(box, 'get_l1', { page: 'home', path: '0' })
    const answer = await box.run('set_l1', { page: 'home', path: '0', node: read.node })

    // The write must have been ACCEPTED — a refused write also leaves the page
    // unchanged, so without this the assertion below passes on failure.
    expect(JSON.parse(answer)).toMatchObject({ changed: ['0'] })

    // Compared as a document, not as bytes. The Toolbox renders every result as
    // key-sorted JSON so two runs of one call produce identical bytes, which
    // means a round trip reorders keys on disk. Nothing is lost, and demanding
    // byte-identity would be testing the framework's serializer rather than this
    // surface's symmetry.
    expect(JSON.parse(draftBytes())).toEqual(before)
  })

  it('test_UAT_FC_REQ_129_set_l1_replaces_a_subtree_and_keeps_its_siblings', async () => {
    const box = await caretaker()

    const answer = await box.run('set_l1', {
      page: 'home',
      path: '0.1',
      node: { kind: 'text', text: 'A quieter close.', axes: { fontSizePx: 18 } },
    })
    expect(JSON.parse(answer)).toMatchObject({ changed: ['0.1'], message: /Replaced/ })

    const root = homeRoot() as { children: Record<string, unknown>[] }
    expect(root.children[1]).toEqual({
      kind: 'text',
      text: 'A quieter close.',
      axes: { fontSizePx: 18 },
    })
    // Everything the call did not address is untouched — the write is bounded by
    // the address, which is what makes it affordable and what keeps the model
    // from rewriting regions it never looked at.
    expect(root.children[0]).toEqual((SEEDED_ROOT as { children: L1Node[] }).children[0])
  })
})

// ── the acceptance case: compose a nav bar through the chat surface ──────────

describe('REQ-129 — the assistant composes structure it could not reach before', () => {
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req129-nav-'))
    cmdNew(SLUG, { cwd })
    seedPage(cwd, SLUG)
  })
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_FC_REQ_129_authors_a_nav_bar_of_link_roles_and_it_renders', async () => {
    const box = await caretaker()

    // The ticket's acceptance case, run the way a session runs it. It needs BOTH
    // halves — reading a subtree with its axes, and writing one back with
    // structure and roles — so it cannot pass by accident.
    const map = await json<{ segments: Segment[] }>(box, 'describe_page', { page: 'home' })
    const rootAddress = map.segments[0].path

    const root = (await json<{ node: L1Node }>(box, 'get_l1', { page: 'home', path: rootAddress }))
      .node

    const nav: L1Node = {
      kind: 'container',
      layout: 'row',
      gapPx: 24,
      children: [
        { kind: 'text', text: 'About', link: { href: '/about' } },
        { kind: 'text', text: 'Contact', link: { href: '#contact' } },
      ],
    }
    // Adding is replacing the group with a group that has one more child. There
    // is no insert operation and the surface says so.
    const withNav = { ...root, children: [nav, ...(root as { children: L1Node[] }).children] }
    await box.run('set_l1', { page: 'home', path: rootAddress, node: withNav })

    const stored = homeRoot() as { children: Record<string, unknown>[] }
    expect(stored.children[0]).toEqual(nav)
    expect(stored.children).toHaveLength(3)

    // The draft is evidence that it was accepted; the render is evidence that it
    // is a nav bar. The renderer is the sole `<a>` sink (REQ-106), so a link role
    // that survived the write path is an anchor in the published bytes or the
    // role never took effect at all.
    // `/about` arrives as the document-relative `about`: a published snapshot
    // holds no absolute self-reference, which is what makes it content-
    // addressable and relocatable (DOC-12 §7). The anchor is unaffected.
    const { outDir } = await cmdRender(SLUG, { cwd })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')
    expect(html).toMatch(/<a[^>]+href="about"[^>]*>About<\/a>/)
    expect(html).toMatch(/<a[^>]+href="#contact"[^>]*>Contact<\/a>/)
  }, 120000)
})

// ── the security guarantee moved, and still holds ────────────────────────────

describe('REQ-129 — the closed vocabulary is what refuses markup now', () => {
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req129-safe-'))
    cmdNew(SLUG, { cwd })
    seedPage(cwd, SLUG)
  })
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_FC_REQ_129_an_element_outside_the_vocabulary_is_refused_whole', async () => {
    const box = await caretaker()
    const before = draftBytes()

    // "The AI cannot write HTML, CSS or JavaScript" used to hold because no
    // operation ACCEPTED them. Under `set_l1` it holds because the schema is
    // CLOSED — `.strict()` objects, closed enums, a URL-scheme allowlist. That
    // is a deliberate move of where the guarantee lives, so it is measured here
    // rather than left to be discovered.
    const rejected: Record<string, unknown>[] = [
      // A raw-markup hole, if one existed.
      { kind: 'text', text: 'x', html: '<script>alert(1)</script>' },
      // A raw-CSS hole, if one existed.
      { kind: 'text', text: 'x', style: 'color:red' },
      // A script URL through the link role's href.
      { kind: 'text', text: 'x', link: { href: 'javascript:alert(1)' } },
      // A script URL through an image src.
      { kind: 'image', src: 'javascript:alert(1)', alt: 'x' },
      // Not an element of the vocabulary at all.
      { kind: 'iframe', src: 'https://example.com' },
      // Well-known kind, wrong type for a typed axis.
      { kind: 'text', text: 'x', axes: { fontSizePx: 'huge' } },
    ]

    for (const node of rejected) {
      const answer = await box.run('set_l1', { page: 'home', path: '0.0.0', node })
      expect(answer, JSON.stringify(node)).toContain('SCHEMA_INVALID')
    }

    // A refusal is never a partial write: the replacement lands in a clone, the
    // whole resulting site is validated, and the clone is discarded.
    expect(draftBytes()).toBe(before)
  })

  it('test_UAT_FC_REQ_129_a_refusal_is_correctable_within_the_turn', async () => {
    const box = await caretaker()

    // A refusal the model cannot act on is a dead end, and it will either retry
    // the identical call or give up and tell the user the site is broken. So a
    // refusal has to carry the code AND what to do about it.
    //
    // `validateOrThrow` reports the offending JSON pointer, and a `1c` user sees
    // it — but `Toolbox._renderHostError` renders a DECLARED code as the code
    // plus the surface's declared meaning and drops the host message, with no
    // per-call detail channel. Recorded as an upstream finding; until it lands,
    // the declared meaning has to carry the strategy rather than the specifics.
    const answer = await box.run('set_l1', {
      page: 'home',
      path: '0.0.0',
      node: { kind: 'text', text: 'x', axes: { fontSizePx: 'huge' } },
    })
    expect(answer).toContain('SCHEMA_INVALID')
    expect(answer).toMatch(/nothing was written/i)
    expect(answer).toMatch(/Do not send it again unchanged/i)
    expect(answer).toMatch(/Read the element back/i)
  })

  it('test_UAT_FC_REQ_129_an_address_that_does_not_exist_writes_nothing', async () => {
    const box = await caretaker()
    const before = draftBytes()

    const answer = await box.run('set_l1', {
      page: 'home',
      path: '9.9.9',
      node: { kind: 'text', text: 'nope' },
    })
    expect(answer).toContain('NOT_FOUND')
    expect(answer).toMatch(/Re-read the listing/)
    expect(draftBytes()).toBe(before)
  })
})

// ── the retired pair ─────────────────────────────────────────────────────────

describe('REQ-129 — the AI-facing copy operations are retired, not shadowed', () => {
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req129-retired-'))
    cmdNew(SLUG, { cwd })
    seedPage(cwd, SLUG)
  })
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_FC_REQ_129_no_second_way_to_change_a_page_survives', async () => {
    // `get_l1`/`set_l1` subsume `get_copy`/`set_copy`, and two ways to do one
    // thing on one surface is exactly what the no-legacy-modes rule forbids —
    // the model would have to choose, and the narrower one would silently be the
    // wrong choice for anything structural.
    const declared = (L1_DECLARATION.operations as { op: string }[]).map((o) => o.op)
    expect(declared).toEqual(expect.arrayContaining(['get_l1', 'set_l1']))
    expect(declared).not.toContain('get_copy')
    expect(declared).not.toContain('set_copy')

    // Declaration and implementation stay in correspondence — a method with no
    // declaration is a capability nothing documents, validates or audits.
    //
    // COMPOSED FROM BOTH HALVES since REQ-146, for the same reason REQ-126's
    // twin of this assertion is: `l1Operations` is the runtime-agnostic core and
    // `nodeOperations` supplies the two that need a disk (`add_asset` reads a
    // file the operator names, `publish` snapshots a tree). Node's surface is
    // their union, and the union is what the declaration describes — checking
    // the core alone asserts a declared operation is unimplemented, which is the
    // opposite of the invariant.
    const opts = fsOpts(cwd)
    const implemented = Object.keys({
      ...l1Operations(SLUG, opts),
      ...nodeOperations(SLUG, opts),
    }).sort()
    expect(implemented).toEqual([...declared].sort())

    const box = await caretaker()
    expect(box.toolNames()).toEqual(expect.arrayContaining(['get_l1', 'set_l1']))
    expect(box.toolNames()).not.toContain('set_copy')
    expect(box.manual()).not.toContain('set_copy')
    expect(await box.run('set_copy', { page: 'home', path: '0.0.0', values: { text: 'x' } })).toMatch(
      /unknown tool|not enabled/i,
    )
  })

  it('test_UAT_FC_REQ_129_the_grant_still_names_a_group_the_surface_declares', async () => {
    // Renaming `WriteCopy` to `AuthorPages` is a configuration change as well as
    // a declaration one, and a grant naming a group the surface no longer has is
    // a startup failure on an operator's machine with a turn in flight.
    const groups = (L1_DECLARATION.groups as { group: string }[]).map((g) => g.group)
    const granted = (L1_INSTANCES.caretaker as { l1: { groups: string[] } }).l1.groups
    for (const group of granted) expect(groups).toContain(group)
    expect(granted).toContain('AuthorPages')
  })
})

// ── the operator's editor is untouched ───────────────────────────────────────

/**
 * The invariants the ticket requires be PROVEN rather than asserted.
 *
 * `editCopyGet`/`editCopySet`/`copyFieldsOf` are the click-to-edit modal's
 * contract (REQ-117 / REQ-118 / DOC-28 §4) and were not touched. The modal never
 * called the toolbox, so it cannot be affected — but "cannot be affected" is the
 * claim, and the claim is what gets tested. Driven over `/api/copy`, the same
 * origin the browser talks to, on subtrees the ASSISTANT authored.
 *
 * Ungated on `WEBUI_INSTALLED` for the reason the REQ-118 suite gives: what is
 * measured is the API, and `startBuilder` binds a port without touching the
 * shared artifact store.
 */
describe('REQ-129 — the click-to-edit modal still works on what the AI authored', () => {
  let builder: BuilderHandle

  beforeAll(async () => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req129-modal-'))
    cmdNew(SLUG, { cwd })
    seedPage(cwd, SLUG)

    // The assistant authors a subtree of its own — a container holding a text run
    // and an image, none of it written by hand.
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

  const copyGet = (p: string) =>
    fetch(new URL(`/api/copy?slug=${SLUG}&page=home&path=${p}`, builder.url))

  it('test_UAT_FC_REQ_129_modal_opens_and_saves_on_an_ai_authored_node', async () => {
    // Invariant 1. An AI-authored `text` node is indistinguishable to
    // `copyFieldsOf` from one written by hand, so the modal derives the same
    // descriptors and Save takes the same path.
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

    // ...and the assistant's own axis survived the operator's edit, which is what
    // makes the two surfaces peers rather than rivals.
    const root = homeRoot() as { children: { children: { axes: unknown }[] }[] }
    expect(root.children[1].children[0].axes).toEqual({ fontSizePx: 20 })
  })

  it('test_UAT_FC_REQ_129_modal_stays_blind_to_kinds_it_does_not_expose', async () => {
    // Invariant 2. The AI can now create rows, boxes and plain containers freely.
    // They must stay invisible to the modal rather than opening an empty form —
    // `copyFieldsOf` returns null for them, and that has to remain true now that
    // there are many more of them.
    const container = (await (await copyGet('0.1')).json()) as {
      kind: string
      fields: unknown[]
      values: Record<string, unknown>
    }
    expect(container.kind).toBe('container')
    expect(container.fields).toEqual([])
    expect(container.values).toEqual({})
  })
})
