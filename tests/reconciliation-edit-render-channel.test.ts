import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, cmdPublish, cmdRender, cmdRevisions } from '../tools/generate/src/cli/commands'
import type { L1Node } from '@1stcontact/site-schema'

/**
 * story-af36c2cb — **the edit render**: a third render channel that deliberately
 * does not work, showing all content at once with every editable region outlined
 * and addressable.
 *
 * These UATs drive the real entry point — the `1c render <slug> [--edit]` command
 * functions — and read the bytes written to disk. Nothing reaches into the
 * emitter directly: every claim here is about what a browser would be handed.
 *
 * Channel names: the story calls the two shipped channels **preview** and
 * **published**. In the store those are the `draft` and `published` dist
 * directories — `cmdRender(slug)` renders the preview, `cmdPublish` /
 * `cmdRender(slug, { source: 'latest' })` the published one.
 *
 * The fixture page is authored to hit every discriminating case in one document:
 * a scroll-revealed run (the settled-state trap), a linked run, an image, a
 * PAINTED container carrying an author id and an UNPAINTED one (the derived
 * segmentation boundary), an unmounted seam, and both behavior modules mounted
 * into L1 slots — the carousel supplying two slides in one seam and the contact
 * form supplying control leaves.
 */

/** A run whose preview render fades in on scroll — invisible until seen. */
const REVEALED_COPY = 'Fades in when you scroll to it.'
/** A run the preview render makes a real link. */
const LINKED_COPY = 'Read the whitepaper'
const BAND_COPY = 'A painted band.'
const SLIDE_ONE = 'The first slide.'
const SLIDE_TWO = 'The second slide, off-screen until you swipe.'
const FORM_ACTION = 'https://example.com/submit'
const LINK_HREF = 'https://example.com/paper'

const homeJsonPath = (cwd: string, slug: string): string =>
  path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')

/**
 * Author a page exercising every segment kind and every "does not work" clause.
 * Returns the page definition so a test can resolve an address against the very
 * object the render was produced from.
 */
function seedPage(cwd: string, slug: string): Record<string, unknown> {
  const homePath = homeJsonPath(cwd, slug)
  const home = JSON.parse(readFileSync(homePath, 'utf8'))

  const root: L1Node = {
    kind: 'container',
    // An author-supplied identifier on a node that is NOT an editable region:
    // the root container paints nothing, so it carries the id and no address.
    id: 'root',
    layout: 'stack',
    children: [
      // [0.0] A painted container — a container segment — that ALSO carries an
      // author id, so one element is both identified and editable.
      {
        kind: 'container',
        id: 'band',
        layout: 'stack',
        axes: { surfaceFill: '#101822' },
        children: [
          // [0.0.0] copy segment
          { kind: 'text', text: BAND_COPY, axes: { fontSizePx: 32 } },
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
            link: { href: LINK_HREF, newTab: true },
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
        action: FORM_ACTION,
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

/** Read the stored draft definition of the home page. */
function readHome(cwd: string, slug: string): Record<string, unknown> {
  return JSON.parse(readFileSync(homeJsonPath(cwd, slug), 'utf8'))
}

function writeHome(cwd: string, slug: string, home: unknown): void {
  writeFileSync(homeJsonPath(cwd, slug), JSON.stringify(home, null, 2))
}

/** Render preview + edit from the same draft and hand back both documents. */
async function renderBoth(cwd: string, slug: string) {
  const preview = await cmdRender(slug, { cwd })
  const edit = await cmdRender(slug, { cwd, edit: true })
  return {
    previewDir: preview.outDir,
    editDir: edit.outDir,
    previewHtml: readFileSync(path.join(preview.outDir, 'index.html'), 'utf8'),
    editHtml: readFileSync(path.join(edit.outDir, 'index.html'), 'utf8'),
  }
}

/** The shared stylesheet a channel's output directory carries. */
function themeCss(dir: string): string {
  return readFileSync(path.join(dir, 'theme.css'), 'utf8')
}

/** Every `data-l1-path`/`data-l1-segment` pair in a rendered document, in order. */
function stampedSegments(html: string): Array<{ path: string; kind: string }> {
  const out: Array<{ path: string; kind: string }> = []
  const re = /data-l1-path="([^"]*)" data-l1-segment="([^"]*)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) out.push({ path: m[1], kind: m[2] })
  return out
}

/** The document's own address namespace: everything outside a mounted instance. */
function documentOnly(html: string): string {
  return html.replace(/<section data-fc-module=[\s\S]*?<\/section>/g, '')
}

/** The render-scoped address of the run carrying `copy`, or `''`. */
function addressOf(html: string, copy: string): string {
  const m = new RegExp(`<p[^>]*data-l1-path="([^"]*)"[^>]*>${copy}</p>`).exec(html)
  return m ? m[1] : ''
}

/**
 * Resolve an address the way a client would: index the render's root node LIST,
 * then walk `children` at every later step. This is the *only* rule — it is what
 * makes the same path format work for a document (`[doc.root]`) and for a
 * fragment mounted into a seam (that seam's subtree array).
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

describe('story-af36c2cb — the edit render channel', () => {
  let cwd: string
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'edit-render-'))
    cmdNew('acme', { cwd })
    seedPage(cwd, 'acme')
  })
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  // ── AC-948 ────────────────────────────────────────────────────────────────
  // Same content as the preview render, and every means of using it removed.
  it('test_UAT_AC948_edit_render_carries_the_same_content_and_deliberately_does_not_work', async () => {
    const { previewHtml, editHtml, editDir } = await renderBoth(cwd, 'acme')

    // Same content: the copy, the image and the module instances the preview
    // renders are the copy, image and instances the edit render renders. A
    // channel that dropped content would not be an edit surface.
    for (const copy of [BAND_COPY, REVEALED_COPY, LINKED_COPY, SLIDE_ONE, SLIDE_TWO]) {
      expect(previewHtml).toContain(copy)
      expect(editHtml).toContain(copy)
    }
    for (const html of [previewHtml, editHtml]) {
      expect(html).toContain('src="assets/hero.jpg"')
      expect(html).toContain('data-fc-module="gallery"')
      expect(html).toContain('data-fc-module="get-in-touch"')
    }

    // The preview page works: a real link destination, a real form destination
    // and verb, a real behaviour bundle.
    expect(previewHtml).toContain(`href="${LINK_HREF}"`)
    expect(previewHtml).toContain(`action="${FORM_ACTION}"`)
    expect(previewHtml).toContain('method="post"')
    expect(previewHtml).toContain('capabilities.js')

    // No navigable link target — and no `target`/`rel` window-opener protection
    // riding along, because there is no new tab to open.
    expect(editHtml).not.toContain(`href="${LINK_HREF}"`)
    expect(editHtml).not.toMatch(/<a[^>]*\shref=/)
    expect(editHtml).not.toContain('target="_blank"')
    expect(editHtml).not.toContain('rel="noopener')

    // No form destination and no submit verb: nothing can send anything anywhere.
    expect(editHtml).not.toContain(`action="${FORM_ACTION}"`)
    expect(editHtml).not.toContain('method="post"')

    // No behaviour or motion code — and no bundle written into the edit
    // channel's output directory beside the page, because a bundle left in the
    // directory is one stray reference away from the page working again.
    expect(editHtml).not.toContain('capabilities.js')
    expect(existsSync(path.join(editDir, 'capabilities.js'))).toBe(false)
    expect(editHtml).not.toContain('data-l1-motion')

    // The link ELEMENT survives around the same copy, so the page's structure,
    // styling and geometry are unchanged — it differs by the missing navigation
    // and nothing else.
    expect(editHtml).toMatch(new RegExp(`<a class="[^"]*"[^>]*>${LINKED_COPY}</a>`))
  })

  // ── AC-949 ────────────────────────────────────────────────────────────────
  // The settled-state trap: revealed copy must be VISIBLE, not merely present.
  it('test_UAT_AC949_scroll_revealed_copy_renders_settled_visible_and_editable', async () => {
    const { previewHtml, editHtml } = await renderBoth(cwd, 'acme')

    // The preview render holds the copy in its hidden pre-state until the
    // visitor scrolls: it starts transparent and carries the reveal marker the
    // observer binds to.
    expect(previewHtml).toMatch(/opacity:\s*0(?![.\d])/)
    expect(previewHtml).toContain('l1-rv')

    // The edit render carries neither the pre-state nor the marker. Suppressing
    // only the reveal SCRIPT would be the trap — the pre-state rule alone would
    // hold the copy at opacity 0, and a region nobody can see is a region
    // nobody can click.
    expect(editHtml).not.toContain('l1-rv')
    expect(editHtml).not.toContain('l1-in')
    expect(editHtml).not.toMatch(/opacity:\s*0(?![.\d])/)

    // And the copy is not merely present but actually available to edit: it is
    // carried by an element stamped as an editable copy region.
    expect(editHtml).toMatch(
      new RegExp(`<p[^>]*data-l1-segment="copy"[^>]*>${REVEALED_COPY}</p>`),
    )
  })

  // ── AC-950 ────────────────────────────────────────────────────────────────
  // The carousel declares its own behaviour-off state, keyed on the marker.
  it('test_UAT_AC950_carousel_slides_are_all_visible_because_the_module_declares_settled_state', async () => {
    const { previewHtml, editHtml, previewDir, editDir } = await renderBoth(cwd, 'acme')

    // Both channels carry both slides' copy (a scroll track, not display:none).
    for (const html of [previewHtml, editHtml]) {
      expect(html).toContain(SLIDE_ONE)
      expect(html).toContain(SLIDE_TWO)
    }

    // The behavioural chrome is folded into theme.css (the container render
    // drops each module's scoped <style>), so the track's rules are read there.
    const previewCss = themeCss(previewDir)
    const editCss = themeCss(editDir)

    // The preview does not set the document-level marker, and its track
    // scrolls and snaps — so the second slide sits off-screen until a swipe.
    expect(previewHtml).not.toMatch(/<body\s+data-fc-edit>/)
    expect(previewCss).toContain('overflow-x: auto')
    expect(previewCss).toContain('scroll-snap-type: x mandatory')

    // The edit render sets the marker, which is what arms the carousel's own
    // settled-state declaration: the track wraps and stops snapping, so every
    // slide is on screen — and clickable — at once.
    expect(editHtml).toMatch(/<body\s+data-fc-edit>/)
    expect(editCss).toMatch(/\[data-fc-edit\]\s*\.carousel__track\s*\{[^}]*flex-wrap:\s*wrap/)
    expect(editCss).toMatch(/\[data-fc-edit\]\s*\.carousel__track\s*\{[^}]*scroll-snap-type:\s*none/)

    // The declaration is the MODULE's, keyed on the marker — so it is inert in
    // every other channel even though the stylesheet is shared. The preview
    // carries the identical rule and still shows the scrolling, snapping track.
    expect(previewCss).toMatch(/\[data-fc-edit\]\s*\.carousel__track\s*\{[^}]*flex-wrap:\s*wrap/)
  })

  // ── AC-951 ────────────────────────────────────────────────────────────────
  // Segmentation is derived from structure; a region with nothing to edit is
  // neither stamped nor outlined.
  it('test_UAT_AC951_segmentation_is_derived_and_regions_with_nothing_to_edit_are_not_stamped', async () => {
    const { editHtml } = await renderBoth(cwd, 'acme')

    // Nothing in the definition declares any of this — no annotation is
    // authored on the seeded page, and none is required.
    const home = readHome(cwd, 'acme')
    expect(JSON.stringify(home)).not.toContain('data-l1-segment')
    expect(JSON.stringify(home)).not.toContain('segment')

    const segments = stampedSegments(editHtml)
    const kinds = segments.map((s) => s.kind)
    // Every stamped region carries BOTH its kind and its address.
    for (const seg of segments) {
      expect(seg.path).not.toBe('')
      expect(['copy', 'image', 'container', 'module']).toContain(seg.kind)
    }

    // A run of text is a copy region: three on the page, two more in the
    // carousel's seam.
    expect(kinds.filter((k) => k === 'copy')).toHaveLength(5)
    for (const copy of [BAND_COPY, REVEALED_COPY, LINKED_COPY, SLIDE_ONE, SLIDE_TWO]) {
      expect(editHtml).toMatch(new RegExp(`data-l1-segment="copy"[^>]*>${copy}<`))
    }

    // An image is an image region.
    expect(kinds.filter((k) => k === 'image')).toHaveLength(1)
    expect(editHtml).toMatch(/<img[^>]*data-l1-segment="image"[^>]*src="assets\/hero\.jpg"/)

    // A container that paints something is a container region. Three containers
    // are authored (root, the painted band, the unpainted wrapper) plus the
    // contact form's own wrapper; exactly one carries paint, so exactly one is
    // stamped — and it is the painted one.
    expect(kinds.filter((k) => k === 'container')).toHaveLength(1)
    expect(editHtml).toMatch(/<div class="[^"]*" id="band" data-l1-path="0\.0" data-l1-segment="container"/)

    // A seam with a behavior mounted in it is a module region: two are mounted.
    expect(kinds.filter((k) => k === 'module')).toHaveLength(2)
    for (const seam of ['gallery', 'get-in-touch']) {
      expect(editHtml).toMatch(new RegExp(`data-l1-segment="module"[^>]*data-l1-slot="${seam}"`))
    }

    // Deliberately NOT segments, and therefore drawing no outline:
    // — a seam with nothing mounted in it (an inert placeholder);
    expect(editHtml).toMatch(/data-l1-slot="nothing-here"/)
    expect(editHtml).not.toMatch(/data-l1-segment="[^"]*"[^>]*data-l1-slot="nothing-here"/)
    // — a container that paints nothing (there is nothing about it to change);
    expect(editHtml).toMatch(/<div class="[^"]*" id="root"(?! data-l1-)/)
    // — a leaf control belonging to a mounted behavior (its element, attributes
    //   and behaviour are the module's).
    expect(editHtml).toMatch(/<input[^>]*type="email"/)
    expect(editHtml).not.toMatch(/<input[^>]*data-l1-segment=/)
    expect(editHtml).not.toMatch(/<button[^>]*data-l1-segment=/)
  })

  // ── AC-952 ────────────────────────────────────────────────────────────────
  // The renderer draws the outline; becoming a segment cannot move a box.
  it('test_UAT_AC952_every_segment_is_outlined_by_the_render_without_reserving_layout_space', async () => {
    const { previewHtml, editHtml } = await renderBoth(cwd, 'acme')

    // Exactly one outline treatment is emitted by the render itself — the
    // renderer knows which boxes are segments, so no client hit-tests for them.
    const treatments = editHtml.match(/\[data-l1-segment\]\s*\{[^}]*\}/g) ?? []
    expect(treatments).toHaveLength(1)
    const rule = treatments[0]

    // It is selected on the presence of a region stamp, so it applies to
    // precisely the stamped set and to nothing else.
    expect(rule).toMatch(/^\[data-l1-segment\]\s*\{/)
    expect(stampedSegments(editHtml).length).toBeGreaterThan(0)

    // It is applied in a way that reserves no space in the layout: `outline` is
    // painted outside the box, and the rule declares no box-model property that
    // could displace anything.
    expect(rule).toMatch(/outline:\s*1px solid/)
    expect(rule).toContain('outline-offset: -1px')
    expect(rule).not.toMatch(/(^|[^-])border\s*:/)
    expect(rule).not.toMatch(/\bmargin\s*:/)
    expect(rule).not.toMatch(/\bpadding\s*:/)
    expect(rule).not.toMatch(/\bwidth\s*:/)
    expect(rule).not.toMatch(/\bheight\s*:/)

    // The preview render of the same page carries no such treatment.
    expect(previewHtml).not.toContain('[data-l1-segment]')
    expect(previewHtml).not.toContain('outline-offset: -1px')
  })

  // ── AC-953 ────────────────────────────────────────────────────────────────
  // Every address resolves to exactly one node, of the kind stamped beside it,
  // and no address repeats within its namespace.
  it('test_UAT_AC953_every_stamped_address_resolves_to_exactly_one_node_and_is_unique', async () => {
    const page = seedPage(cwd, 'acme')
    const { editHtml } = await renderBoth(cwd, 'acme')
    const roots = [(page.l1 as { root: L1Node }).root]

    // The page's OWN namespace. A mounted instance's markup is a separate
    // address space (rooted at the instance — AC-954), so it is excluded here
    // rather than resolved against the document.
    const docSegments = stampedSegments(documentOnly(editHtml))
    expect(docSegments).toHaveLength(7)

    // A copy address resolves to a text node, an image address to an image, a
    // container address to a container, a module address to the seam the
    // behavior is mounted in.
    const expectedKind: Record<string, string[]> = {
      copy: ['text'],
      image: ['image'],
      container: ['container', 'box'],
      module: ['slot'],
    }
    for (const seg of docSegments) {
      const node = resolveAddress(roots, seg.path)
      expect(node, `address '${seg.path}' must resolve`).toBeDefined()
      expect(expectedKind[seg.kind]).toContain((node as L1Node).kind)
    }

    // No two regions in the same namespace carry the same address.
    const paths = docSegments.map((s) => s.path)
    expect(new Set(paths).size).toBe(paths.length)
  })

  // ── AC-954 ────────────────────────────────────────────────────────────────
  // Seam content is addressable, rooted at the instance rather than the page.
  it('test_UAT_AC954_seam_content_is_addressable_rooted_at_the_behavior_instance', async () => {
    const page = seedPage(cwd, 'acme')
    const { editHtml } = await renderBoth(cwd, 'acme')

    // Copy placed into a behavior module's presentation seam is an editable
    // region like any other, and each item mounted into the seam is rooted
    // INDEPENDENTLY — first item `0`, second `1` — rather than continuing the
    // page's numbering (which by then is already four levels deep).
    expect(editHtml).toMatch(
      new RegExp(`<p[^>]*data-l1-path="0"[^>]*data-l1-segment="copy"[^>]*>${SLIDE_ONE}</p>`),
    )
    expect(editHtml).toMatch(
      new RegExp(`<p[^>]*data-l1-path="1"[^>]*data-l1-segment="copy"[^>]*>${SLIDE_TWO}</p>`),
    )

    // The surrounding markup names both the behavior instance and the seam, so
    // an address inside a module and an identical-looking address on the page
    // are distinguishable.
    expect(editHtml).toContain('data-fc-module="gallery"')
    expect(editHtml).toContain('data-fc-type="carousel"')
    expect(editHtml).toMatch(/data-l1-slot="slide"[^>]*>\s*<p[^>]*data-l1-path="0"/)

    // One resolution rule serves both: index the render's root node LIST, then
    // walk `children`. Against the seam's own subtree array, `0` and `1` are
    // the two slides...
    const slideRoots = (
      (page.modules as Array<{ id: string; slots: { slide: L1Node[] } }>).find(
        (m) => m.id === 'gallery',
      ) as { slots: { slide: L1Node[] } }
    ).slots.slide
    expect((resolveAddress(slideRoots, '0') as { text?: string }).text).toBe(SLIDE_ONE)
    expect((resolveAddress(slideRoots, '1') as { text?: string }).text).toBe(SLIDE_TWO)

    // ...and the page-rooted addresses resolve against the definition without
    // the module's regions being drawn into that namespace: the document's own
    // stamps are exactly the seven page regions, none of them a slide.
    const roots = [(page.l1 as { root: L1Node }).root]
    const docSegments = stampedSegments(documentOnly(editHtml))
    for (const seg of docSegments) {
      const node = resolveAddress(roots, seg.path)
      expect(node, `page address '${seg.path}' must resolve`).toBeDefined()
      expect((node as { text?: string }).text).not.toBe(SLIDE_ONE)
      expect((node as { text?: string }).text).not.toBe(SLIDE_TWO)
    }
    // `0` and `1` are the slides' addresses, and belong to no page region.
    expect(docSegments.map((s) => s.path)).not.toContain('0')
    expect(docSegments.map((s) => s.path)).not.toContain('1')
  })

  // ── AC-955 ────────────────────────────────────────────────────────────────
  // Reordering siblings and re-rendering yields addresses that still resolve.
  it('test_UAT_AC955_reordering_siblings_yields_addresses_that_still_resolve', async () => {
    const before = await cmdRender('acme', { cwd, edit: true })
    const beforeHtml = readFileSync(path.join(before.outDir, 'index.html'), 'utf8')

    // The addresses of two sibling copy regions, as first rendered.
    expect(addressOf(beforeHtml, BAND_COPY)).toBe('0.0.0')
    expect(addressOf(beforeHtml, REVEALED_COPY)).toBe('0.0.1')

    // Swap the two siblings in the stored definition and render again.
    const home = readHome(cwd, 'acme')
    ;(home.l1 as { root: { children: Array<{ children: L1Node[] }> } }).root.children[0].children.reverse()
    writeHome(cwd, 'acme', home)

    const after = await cmdRender('acme', { cwd, edit: true })
    const afterHtml = readFileSync(path.join(after.outDir, 'index.html'), 'utf8')

    // Each region's address in the new render is the other one's former
    // address: the addresses moved with the nodes.
    expect(addressOf(afterHtml, REVEALED_COPY)).toBe('0.0.0')
    expect(addressOf(afterHtml, BAND_COPY)).toBe('0.0.1')

    // And resolving both new addresses against the CHANGED definition yields
    // the copy that carries them.
    const roots = [(home.l1 as { root: L1Node }).root]
    expect((resolveAddress(roots, '0.0.0') as { text?: string }).text).toBe(REVEALED_COPY)
    expect((resolveAddress(roots, '0.0.1') as { text?: string }).text).toBe(BAND_COPY)

    // The address is valid for the render it was produced from and no longer —
    // an address read from the earlier render is not expected to survive the
    // reorder, because any edit re-renders the page and regenerates it.
    expect(addressOf(afterHtml, BAND_COPY)).not.toBe(addressOf(beforeHtml, BAND_COPY))
  })

  // ── AC-956 ────────────────────────────────────────────────────────────────
  // No leakage: the two shipped channels are byte-unchanged and still work.
  it('test_UAT_AC956_preview_and_published_renders_carry_no_edit_artefacts_and_still_work', async () => {
    // The bytes the preview channel produces for this definition BEFORE any
    // edit render has ever been asked for.
    const baselineDir = path.join(cwd, 'baseline-preview')
    const { files: baselineFiles } = await cmdRender('acme', { cwd, out: baselineDir })

    // Now exercise the edit channel, twice, against the same definition.
    await cmdRender('acme', { cwd, edit: true })
    await cmdRender('acme', { cwd, edit: true })

    // The preview channel's bytes for the same definition are unchanged by the
    // existence of the edit channel — file for file, byte for byte.
    const afterDir = path.join(cwd, 'after-preview')
    const { files: afterFiles } = await cmdRender('acme', { cwd, out: afterDir })
    expect(afterFiles).toEqual(baselineFiles)
    for (const file of [...baselineFiles, 'theme.css', 'capabilities.js']) {
      const a = path.join(baselineDir, file)
      const b = path.join(afterDir, file)
      expect(existsSync(b)).toBe(existsSync(a))
      if (!existsSync(a)) continue
      expect(readFileSync(b)).toEqual(readFileSync(a))
    }

    // Both shipped channels: the preview, and the published render publish
    // produces from the locked revision.
    const published = await cmdPublish('acme', { cwd, now: '2026-01-01T00:00:00.000Z' })
    const previewHtml = readFileSync(path.join(afterDir, 'index.html'), 'utf8')
    const publishedHtml = readFileSync(path.join(published.outDir, 'index.html'), 'utf8')

    for (const html of [previewHtml, publishedHtml]) {
      // Nothing belonging to the edit channel appears: no address, no region
      // stamp, no document-level edit marker, no outline treatment.
      expect(html).not.toContain('data-l1-path')
      expect(html).not.toContain('data-l1-segment')
      expect(html).not.toContain('data-fc-edit')
      expect(html).not.toContain('outline-offset: -1px')
      // And both remain fully functional.
      expect(html).toContain(`href="${LINK_HREF}"`)
      expect(html).toContain(`action="${FORM_ACTION}"`)
      expect(html).toContain('method="post"')
      expect(html).toContain('capabilities.js')
    }
  })

  // ── AC-957 ────────────────────────────────────────────────────────────────
  // The author's identifier keeps its meaning and emission; the address is
  // stamped alongside it, never in place of it.
  it('test_UAT_AC957_author_identifier_is_unchanged_and_the_address_is_stamped_alongside_it', async () => {
    const { previewHtml, editHtml } = await renderBoth(cwd, 'acme')

    // The optional identifier an author may put on an element is emitted
    // identically in the edit channel and in the shipped channel.
    for (const id of ['root', 'band']) {
      expect(previewHtml).toContain(`id="${id}"`)
      expect(editHtml).toContain(`id="${id}"`)
    }
    // Emitted the same way, in the same place on the element.
    expect(previewHtml).toMatch(/<div class="[^"]*" id="root"/)
    expect(editHtml).toMatch(/<div class="[^"]*" id="root"/)

    // The root element carries the identifier but is not an editable region (it
    // paints nothing): it carries the identifier and NO region stamp beside it.
    expect(editHtml).toMatch(/<div class="[^"]*" id="root"(?! data-l1-)/)

    // On an element that is both identified and editable, the identifier and
    // the address are both present — the address is added alongside, never
    // substituted for it.
    expect(editHtml).toMatch(
      /<div class="[^"]*" id="band" data-l1-path="0\.0" data-l1-segment="container"/,
    )

    // The edit channel neither writes the identifier nor consumes it: across
    // the document's own markup, the ids emitted are exactly the ids the
    // definition declares — the channel adds none and drops none. (A mounted
    // behavior's `for`<->`id` control wiring is the module's own and lives
    // inside its instance markup, so it is excluded here.)
    const emitted = new Set(
      (documentOnly(editHtml).match(/ id="([^"]*)"/g) ?? []).map((s) => s.trim()),
    )
    expect(emitted).toEqual(new Set(['id="root"', 'id="band"']))
    // Both channels emit that same set — the edit render substitutes nothing.
    const previewIds = new Set(
      (documentOnly(previewHtml).match(/ id="([^"]*)"/g) ?? []).map((s) => s.trim()),
    )
    expect(previewIds).toEqual(emitted)
  })

  // ── AC-958 ────────────────────────────────────────────────────────────────
  // A render mode: own output location, always the draft, never a revision.
  it('test_UAT_AC958_edit_channel_has_its_own_output_location_renders_draft_and_creates_no_revision', async () => {
    // Lock a revision, then diverge the draft from it.
    const published = await cmdPublish('acme', { cwd, now: '2026-01-01T00:00:00.000Z' })
    expect(published.id).toBe(1)
    const revisionsBefore = cmdRevisions('acme', { cwd })
    expect(revisionsBefore).toHaveLength(1)

    const DRAFT_ONLY_COPY = 'Only the draft says this.'
    const home = readHome(cwd, 'acme')
    ;(home.l1 as { root: { children: Array<{ children: Array<{ text: string }> }> } }).root.children[0].children[0].text =
      DRAFT_ONLY_COPY
    writeHome(cwd, 'acme', home)

    // Requesting the edit render while SELECTING the stored revision as the
    // source: `--edit` settles on the draft rather than combining with it,
    // because a revision is immutable and there is nothing on it to edit.
    const edit = await cmdRender('acme', { cwd, source: 'latest', edit: true })
    const editHtml = readFileSync(path.join(edit.outDir, 'index.html'), 'utf8')
    expect(editHtml).toContain(DRAFT_ONLY_COPY)
    expect(editHtml).not.toContain(BAND_COPY)

    // The command reports the edit channel as what it rendered, at an output
    // location distinct from the preview and published channels' — a page that
    // deliberately does not work can never be served from the working page's
    // location.
    const preview = await cmdRender('acme', { cwd })
    expect(edit.outDir).not.toBe(preview.outDir)
    expect(edit.outDir).not.toBe(published.outDir)
    expect(edit.outDir.endsWith(path.join('acme', 'edit'))).toBe(true)

    // No number of edit renders creates a revision: the site's revision history
    // is unchanged by them, and nothing about the edit render is publishable or
    // content-addressed.
    await cmdRender('acme', { cwd, edit: true })
    await cmdRender('acme', { cwd, source: 'draft', edit: true })
    expect(cmdRevisions('acme', { cwd })).toEqual(revisionsBefore)
    const history = JSON.parse(
      readFileSync(path.join(cwd, 'storage', 'sites', 'acme', 'history.json'), 'utf8'),
    )
    expect(history.revisions).toHaveLength(1)
    expect(JSON.stringify(history)).not.toContain('edit')
  })
})
