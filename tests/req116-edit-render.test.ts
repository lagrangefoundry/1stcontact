import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, cmdRender } from '../tools/generate/src/cli/commands'
import type { L1Node } from '@1stcontact/site-schema'

/**
 * REQ-116 — **the edit render** (DOC-28 §5, §6): a third render channel producing
 * the page the builder's editor works on. Same document, same renderer, rendered
 * so the page deliberately does NOT work, shows all its content at once, and
 * carries an address on every editable region.
 *
 * These UATs drive the real entry point — `1c render <slug> --edit` — and read the
 * bytes it writes to disk. Nothing here reaches into the emitter directly: the
 * whole claim is about what a browser would be handed.
 *
 * The fixture page is authored to hit every discriminating case in one document:
 * a scroll-revealed run (the settled-state trap), a linked run, an image, a
 * PAINTED container and an UNPAINTED one (the derived-segmentation boundary), and
 * both surviving behavior modules mounted into L1 slots.
 */

/** A run whose copy the draft render fades in on scroll — invisible until seen. */
const REVEALED_COPY = 'Fades in when you scroll to it.'
/** A run the draft render makes a real link. */
const LINKED_COPY = 'Read the whitepaper'
const SLIDE_ONE = 'The first slide.'
const SLIDE_TWO = 'The second slide, off-screen until you swipe.'

/**
 * Author a page exercising every segment kind and every "does not work" clause.
 * Returns the page definition so a test can resolve an address against the very
 * object the render was produced from.
 */
function seedPage(cwd: string, slug: string): Record<string, unknown> {
  const homePath = path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')
  const home = JSON.parse(readFileSync(homePath, 'utf8'))

  const root: L1Node = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [
      // [0.0] A painted container — a container segment — holding copy.
      {
        kind: 'container',
        layout: 'stack',
        axes: { surfaceFill: '#101822' },
        children: [
          // [0.0.0] copy segment
          { kind: 'text', text: 'A painted band.', axes: { fontSizePx: 32 } },
          // [0.0.1] copy segment, revealed on scroll
          {
            kind: 'text',
            text: REVEALED_COPY,
            axes: { fontSizePx: 18 },
            reveal: { fromOpacity: 0, yPx: 24, durationMs: 500 },
          },
        ],
      },
      // [0.1] An UNPAINTED container — pure structure, nothing to edit.
      {
        kind: 'container',
        layout: 'stack',
        children: [
          // [0.1.0] a linked copy segment
          {
            kind: 'text',
            text: LINKED_COPY,
            axes: { fontSizePx: 18 },
            link: { href: 'https://example.com/paper', newTab: true },
          },
          // [0.1.1] an image segment
          { kind: 'image', src: 'assets/hero.jpg', alt: 'A hero image' },
        ],
      },
      // [0.2] / [0.3] the seams the two behavior modules mount into.
      { kind: 'slot', name: 'gallery' },
      { kind: 'slot', name: 'get-in-touch' },
      // [0.4] An unmounted seam — an inert placeholder, nothing to edit.
      { kind: 'slot', name: 'nothing-here' },
    ],
  }

  home.l1.root = root
  home.modules = [
    {
      id: 'gallery',
      type: 'carousel',
      version: 3,
      slot: 'gallery',
      config: {},
      slots: {
        slide: [
          { kind: 'text', text: SLIDE_ONE },
          { kind: 'text', text: SLIDE_TWO },
        ],
      },
    },
    {
      id: 'get-in-touch',
      type: 'contact-form',
      version: 4,
      slot: 'get-in-touch',
      config: {
        action: 'https://example.com/submit',
        fields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
      },
      slots: {
        form: {
          kind: 'container',
          layout: 'stack',
          children: [
            { kind: 'control', control: 'email' },
            { kind: 'control', control: 'submit' },
          ],
        },
      },
    },
  ]
  writeFileSync(homePath, JSON.stringify(home, null, 2))
  return home
}

/** Render both channels of the same draft and hand back the two HTML documents. */
async function renderBoth(cwd: string, slug: string) {
  const draft = await cmdRender(slug, { cwd })
  const edit = await cmdRender(slug, { cwd, edit: true })
  return {
    draftDirOut: draft.outDir,
    editDirOut: edit.outDir,
    draftHtml: readFileSync(path.join(draft.outDir, 'index.html'), 'utf8'),
    editHtml: readFileSync(path.join(edit.outDir, 'index.html'), 'utf8'),
  }
}

/** Every `data-l1-path`/`data-l1-segment` pair in a rendered document, in order. */
function stampedSegments(html: string): Array<{ path: string; kind: string }> {
  const out: Array<{ path: string; kind: string }> = []
  const re = /data-l1-path="([^"]*)" data-l1-segment="([^"]*)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) out.push({ path: m[1], kind: m[2] })
  return out
}

/**
 * Resolve an address the way a client would: index the render's root node LIST,
 * then walk `children` at every later step. This is the *only* rule — it is what
 * makes the same path format work for a document (`[doc.root]`) and for a
 * fragment (the subtree array).
 */
function resolveAddress(roots: L1Node[], address: string): L1Node | undefined {
  const idx = address.split('.').map(Number)
  let node: L1Node | undefined = roots[idx[0]]
  for (const i of idx.slice(1)) {
    const kids: L1Node[] | undefined = (node as { children?: L1Node[] } | undefined)?.children
    node = kids?.[i]
    if (!node) return undefined
  }
  return node
}

describe('REQ-116 — the edit render', () => {
  let cwd: string
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req116-'))
    cmdNew('acme', { cwd })
    seedPage(cwd, 'acme')
  })
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  // AC1 — the channel renders the same document, deliberately non-functional.
  it('test_UAT_FC_REQ-116_edit_channel_renders_the_page_inert', async () => {
    const { draftHtml, editHtml, editDirOut } = await renderBoth(cwd, 'acme')

    // Same document: the copy the draft renders is the copy the edit render
    // renders. A channel that dropped content would not be an edit surface.
    for (const copy of ['A painted band.', REVEALED_COPY, LINKED_COPY, SLIDE_ONE]) {
      expect(draftHtml).toContain(copy)
      expect(editHtml).toContain(copy)
    }

    // The draft page works: a real link, a real endpoint, a real client bundle.
    expect(draftHtml).toContain('href="https://example.com/paper"')
    expect(draftHtml).toContain('action="https://example.com/submit"')
    expect(draftHtml).toContain('method="post"')
    expect(draftHtml).toContain('capabilities.js')

    // The edit page does not. No link target — and no `target`/`rel` riding along.
    expect(editHtml).not.toContain('href="https://example.com/paper"')
    expect(editHtml).not.toMatch(/<a[^>]*\shref=/)
    expect(editHtml).not.toContain('target="_blank"')
    // No form action and no submit verb: nothing can leave the page.
    expect(editHtml).not.toContain('action="https://example.com/submit"')
    expect(editHtml).not.toContain('method="post"')
    // No behaviour script is referenced, and none is written beside the page —
    // a bundle left in the directory is one stray <script> from working again.
    expect(editHtml).not.toContain('capabilities.js')
    expect(existsSync(path.join(editDirOut, 'capabilities.js'))).toBe(false)
    // No motion script either (REQ-100's observer marks the document itself).
    expect(editHtml).not.toContain('data-l1-motion')

    // The anchor ELEMENT survives, stripped of its target — so the edit render
    // differs from the draft by the missing navigation and nothing else.
    expect(editHtml).toMatch(/<a class="[^"]*"[^>]*>Read the whitepaper<\/a>/)
  })

  // AC2 — the settled-state trap: revealed copy must be VISIBLE, not merely present.
  it('test_UAT_FC_REQ-116_scroll_revealed_copy_renders_settled_and_visible', async () => {
    const { draftHtml, editHtml } = await renderBoth(cwd, 'acme')

    // The draft render pins the pre-state: the run starts transparent and is
    // brought in by the observer.
    expect(draftHtml).toMatch(/opacity:\s*0/)
    expect(draftHtml).toContain('l1-rv')

    // The edit render emits no reveal at all. Dropping only the SCRIPT would be
    // the trap — the pre-state rule would still hold the copy at opacity 0, and
    // a segment nobody can see is a segment nobody can click.
    expect(editHtml).not.toContain('l1-rv')
    expect(editHtml).not.toContain('l1-in')
    expect(editHtml).not.toMatch(/opacity:\s*0(?![.\d])/)

    // And the run is a stamped, outlined copy segment — i.e. actually editable.
    const revealedTag = new RegExp(`<p[^>]*data-l1-segment="copy"[^>]*>${REVEALED_COPY}</p>`)
    expect(editHtml).toMatch(revealedTag)
  })

  // AC3 — a carousel's slides are all simultaneously visible.
  it('test_UAT_FC_REQ-116_carousel_slides_are_all_visible_at_once', async () => {
    const { draftHtml, editHtml } = await renderBoth(cwd, 'acme')

    // Both channels carry both slides in the DOM (a scroll track, not display:none).
    for (const html of [draftHtml, editHtml]) {
      expect(html).toContain(SLIDE_ONE)
      expect(html).toContain(SLIDE_TWO)
    }

    // The behavioural chrome is folded into theme.css (the container render drops
    // each module's scoped <style>), so the track's rules are read from there.
    const cssOf = (channel: string): string =>
      readFileSync(path.join(cwd, 'storage', 'dist', 'sites', 'acme', channel, 'theme.css'), 'utf8')

    // The track is one scrolling, snapping row — so in the draft render the
    // second slide sits off-screen until the reader swipes.
    expect(cssOf('draft')).toContain('scroll-snap-type: x mandatory')
    expect(draftHtml).not.toContain('data-fc-edit')

    // The edit render sets the document marker, which is what arms the
    // carousel's own settled-state rule: the track wraps, so every slide is on
    // screen — and clickable — at once.
    expect(editHtml).toMatch(/<body\s+data-fc-edit>/)
    const editCss = cssOf('edit')
    expect(editCss).toMatch(/\[data-fc-edit\]\s*\.carousel__track\s*{[^}]*flex-wrap:\s*wrap/)
    expect(editCss).toMatch(/\[data-fc-edit\]\s*\.carousel__track\s*{[^}]*scroll-snap-type:\s*none/)

    // The rule is keyed on the document marker, so it is inert in every other
    // channel even though the stylesheet is shared.
    expect(cssOf('draft')).toMatch(/\[data-fc-edit\]\s*\.carousel__track/)
    expect(draftHtml).not.toMatch(/<body\s+data-fc-edit>/)
  })

  // AC4 — derived segmentation: what is a segment, and what is deliberately not.
  it('test_UAT_FC_REQ-116_segments_are_derived_and_only_editable_regions_outline', async () => {
    const { editHtml } = await renderBoth(cwd, 'acme')
    const segments = stampedSegments(editHtml)
    const kinds = segments.map((s) => s.kind)

    // Every text run is a copy segment; the image is an image segment.
    expect(kinds.filter((k) => k === 'copy').length).toBeGreaterThanOrEqual(3)
    expect(kinds).toContain('image')

    // The PAINTED container is a container segment; the unpainted one is not.
    // Two containers are authored on this page and exactly one carries paint.
    expect(kinds.filter((k) => k === 'container')).toEqual(['container'])

    // A MOUNTED slot is a module segment; the unmounted seam is an inert
    // placeholder with nothing to edit, so it is not stamped and not outlined.
    expect(kinds.filter((k) => k === 'module').length).toBe(2)
    expect(editHtml).toMatch(/data-l1-slot="nothing-here"/)
    expect(editHtml).not.toMatch(/data-l1-segment="[^"]*"[^>]*data-l1-slot="nothing-here"/)

    // The outline is drawn by the renderer, once, for exactly the stamped set —
    // and as an `outline`, which is painted outside layout, so becoming a segment
    // cannot move a box.
    expect(editHtml).toMatch(/\[data-l1-segment\]\s*{[^}]*outline:/)
    expect(editHtml).toContain('outline-offset: -1px')

    // A control leaf is NOT a segment: its element, attributes and behaviour
    // belong to the mounted module, and it holds no copy and no asset.
    expect(editHtml).toMatch(/<input[^>]*type="email"/)
    expect(editHtml).not.toMatch(/<input[^>]*data-l1-segment=/)
  })

  // AC5 + AC7 — an address resolves to exactly one node, document and slot alike.
  it('test_UAT_FC_REQ-116_every_stamped_address_resolves_to_the_node_it_came_from', async () => {
    const page = seedPage(cwd, 'acme')
    const { editHtml } = await renderBoth(cwd, 'acme')
    const l1 = page.l1 as { root: L1Node }
    const roots = [l1.root]

    // Document-rooted addresses only. A mounted module's markup is a SEPARATE
    // address space (rooted at the instance, AC7 below), so it is excluded here
    // rather than resolved against the document — the two namespaces reuse the
    // same short paths by design, and it is the enclosing `data-fc-module` that
    // tells them apart.
    const documentOnly = editHtml.replace(/<section data-fc-module=[\s\S]*?<\/section>/g, '')
    const expectedKind: Record<string, string[]> = {
      copy: ['text'],
      image: ['image'],
      container: ['container', 'box'],
      module: ['slot'],
    }
    const docSegments = stampedSegments(documentOnly)
    expect(docSegments.length).toBeGreaterThan(0)
    for (const seg of docSegments) {
      const node = resolveAddress(roots, seg.path)
      // Every stamped address resolves to exactly one node...
      expect(node, `address '${seg.path}' must resolve`).toBeDefined()
      // ...and it is the node the stamp was derived from.
      expect(expectedKind[seg.kind]).toContain((node as L1Node).kind)
    }

    // One address per node: no address is stamped twice within a namespace.
    const docPaths = docSegments.map((s) => s.path)
    expect(new Set(docPaths).size).toBe(docPaths.length)

    // AC7 — copy inside a behavior module's slot is addressable, ROOTED AT THE
    // INSTANCE: the run carries a path, and the enclosing markup names both the
    // instance and the seam, so the client can say "gallery / slide / 0".
    const slideMatch = new RegExp(
      `<p[^>]*data-l1-path="0"[^>]*data-l1-segment="copy"[^>]*>${SLIDE_ONE}</p>`,
    )
    expect(editHtml).toMatch(slideMatch)
    expect(editHtml).toContain('data-fc-module="gallery"')
    expect(editHtml).toContain('data-l1-slot="slide"')

    // Each slide is rooted independently in the fragment's own node list, so the
    // second slide is address `1` — not a continuation of the document's walk.
    const slideTwo = new RegExp(
      `<p[^>]*data-l1-path="1"[^>]*data-l1-segment="copy"[^>]*>${SLIDE_TWO}</p>`,
    )
    expect(editHtml).toMatch(slideTwo)
  })

  // AC6 — reordering siblings re-renders to addresses that still resolve.
  it('test_UAT_FC_REQ-116_reordering_siblings_yields_addresses_that_still_resolve', async () => {
    const before = await cmdRender('acme', { cwd, edit: true })
    const beforeHtml = readFileSync(path.join(before.outDir, 'index.html'), 'utf8')

    // The address of the painted band's two runs, as first rendered.
    const addressOf = (html: string, copy: string): string => {
      const m = new RegExp(`<p[^>]*data-l1-path="([^"]*)"[^>]*>${copy}</p>`).exec(html)
      return m ? m[1] : ''
    }
    const firstBefore = addressOf(beforeHtml, 'A painted band.')
    const revealedBefore = addressOf(beforeHtml, REVEALED_COPY)
    expect(firstBefore).toBe('0.0.0')
    expect(revealedBefore).toBe('0.0.1')

    // Swap the two runs in the definition and re-render.
    const homePath = path.join(cwd, 'storage', 'sites', 'acme', 'draft', 'pages', 'home.json')
    const home = JSON.parse(readFileSync(homePath, 'utf8'))
    const band = home.l1.root.children[0]
    band.children.reverse()
    writeFileSync(homePath, JSON.stringify(home, null, 2))

    const after = await cmdRender('acme', { cwd, edit: true })
    const afterHtml = readFileSync(path.join(after.outDir, 'index.html'), 'utf8')

    // The addresses swapped with the nodes — which is the whole point of a
    // render-scoped path. A client only ever resolves against the render in
    // front of it, so reordering cannot strand it: it re-renders and re-reads.
    expect(addressOf(afterHtml, REVEALED_COPY)).toBe('0.0.0')
    expect(addressOf(afterHtml, 'A painted band.')).toBe('0.0.1')

    // And each resolves, against the NEW definition, to the node it came from.
    const roots = [home.l1.root as L1Node]
    expect((resolveAddress(roots, '0.0.0') as { text?: string }).text).toBe(REVEALED_COPY)
    expect((resolveAddress(roots, '0.0.1') as { text?: string }).text).toBe('A painted band.')
  })

  // AC8 + AC9 — no leakage into the other channels, and `id` is untouched.
  it('test_UAT_FC_REQ-116_draft_and_published_renders_carry_no_edit_artefacts', async () => {
    const { draftHtml } = await renderBoth(cwd, 'acme')
    const published = await cmdRender('acme', { cwd, source: 'draft' })
    const publishedHtml = readFileSync(path.join(published.outDir, 'index.html'), 'utf8')

    for (const html of [draftHtml, publishedHtml]) {
      // No handle, no outline, no marker — the published bytes are untouched.
      expect(html).not.toContain('data-l1-path')
      expect(html).not.toContain('data-l1-segment')
      expect(html).not.toContain('data-fc-edit')
      expect(html).not.toContain('outline-offset: -1px')
      // And the page still works.
      expect(html).toContain('href="https://example.com/paper"')
      expect(html).toContain('method="post"')
    }

    // AC9 — L1's `id` keeps its REQ-106 meaning (the real DOM id) in BOTH
    // channels. Nothing in the edit render writes it or depends on it.
    const { editHtml } = await renderBoth(cwd, 'acme')
    expect(draftHtml).toContain('id="root"')
    expect(editHtml).toContain('id="root"')
    // The edit render adds its address ALONGSIDE the id, never in place of it —
    // the root container here is unpainted, so it carries the id and no segment.
    expect(editHtml).toMatch(/<div class="[^"]*" id="root"/)
  })

  // The channel is a render MODE, not a new artifact (DOC-12 §11).
  it('test_UAT_FC_REQ-116_edit_channel_has_its_own_address_and_no_revision', async () => {
    const { editDirOut, draftDirOut } = await renderBoth(cwd, 'acme')

    // Its own directory — a non-functional page can never be served from the
    // working page's URL (DOC-12 principle 4).
    expect(editDirOut).not.toBe(draftDirOut)
    expect(editDirOut.endsWith(path.join('acme', 'edit'))).toBe(true)

    // It never becomes a revision: publishing is untouched by it, and no history
    // entry exists for an edit render.
    const historyPath = path.join(cwd, 'storage', 'sites', 'acme', 'history.json')
    if (existsSync(historyPath)) {
      const history = JSON.parse(readFileSync(historyPath, 'utf8'))
      expect(history.revisions ?? []).toHaveLength(0)
    }
  })
})
