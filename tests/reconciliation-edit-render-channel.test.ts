import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, cmdPublish, cmdRender, cmdRevisions } from '../tools/generate/src/cli/commands'
import { editCopyGet } from '../tools/generate/src/cli/edit'
// The stamp vocabulary as the SITE DEFINITION SCHEMA publishes it (AC-1008) —
// the one contract the render writes and a client reads.
import {
  L1_EDIT_HOT_CLASS,
  L1_EDIT_MARKER_ATTR,
  L1_EDIT_MODULE_ATTR,
  L1_EDIT_PAGE_ATTR,
  L1_EDIT_PATH_ATTR,
  L1_EDIT_SEGMENT_ATTR,
  L1_EDIT_SLOT_ATTR,
  formatL1Path,
  parseL1Path,
  resolveL1Node,
} from '../packages/site-schema/src/index'
// ...and the same names as the RENDERER's published surface offers them, so the
// test can assert the two are the same values rather than equal-looking ones.
import {
  L1_EDIT_CSS,
  L1_EDIT_HOT_CLASS as FW_HOT_CLASS,
  L1_EDIT_MARKER_ATTR as FW_MARKER_ATTR,
  L1_EDIT_PAGE_ATTR as FW_PAGE_ATTR,
  L1_EDIT_PATH_ATTR as FW_PATH_ATTR,
  L1_EDIT_SEGMENT_ATTR as FW_SEGMENT_ATTR,
} from '../packages/framework/src/index'
import type { L1Node } from '../packages/site-schema/src/index'
// The behavior catalog itself — AC-954's obligation is on it, so the seam test
// iterates the registry rather than a hand-maintained list of module names.
import { registry } from '../packages/framework/src/modules/registry'
import type { BehaviorDefinition } from '../packages/framework/src/modules/behavior'
import { fsOpts } from './support/site-factory'

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

// ── the catalog's presentation seams ─────────────────────────────────────────
//
// AC-954 is an obligation on the CATALOG, not on the first module that happened
// to need it: every module exposing a seam marks it, "and for any module added
// after them". A hand-maintained table cannot say that on its own — a third
// module with no entry would simply never be exercised, which is silence, not
// evidence. So the table below carries only what a fixture genuinely cannot
// derive (the config a module requires, the shape of its seam value, and the
// resulting addresses), and {@link seamCaseFor} makes the CATALOG the index:
// the test iterates `registry`, and a module without a case fails loudly rather
// than quietly shipping copy nobody can address.

/** The two items of copy mounted into whichever seam is under test. */
const SEAM_COPY_ONE = 'The first thing in the seam.'
const SEAM_COPY_TWO = 'The second thing in the seam.'
/** A page-rooted run, so the page namespace is non-empty in every seam fixture. */
const PAGE_COPY = 'Page copy, outside every module.'

interface SeamCase {
  type: string
  version: number
  /** The behavior instance's id — the scope a seam-rooted address is read in. */
  instance: string
  /** The module's presentation seam. */
  slot: string
  config: Record<string, unknown>
  /** The seam's value, carrying two items of copy plus whatever the module needs. */
  slotValue: unknown
  /** The first and second addresses of the seam's own namespace. */
  addresses: [string, string]
}

const SEAM_CASES: SeamCase[] = [
  {
    type: 'carousel',
    version: 3,
    instance: 'gallery',
    slot: 'slide',
    config: {},
    // A REPEATED seam: one subtree per item, so the items are the node list
    // itself and their addresses are the bare `0` and `1`.
    slotValue: [
      { kind: 'text', text: SEAM_COPY_ONE },
      { kind: 'text', text: SEAM_COPY_TWO },
    ],
    addresses: ['0', '1'],
  },
  {
    type: 'contact-form',
    version: 4,
    instance: 'get-in-touch',
    slot: 'form',
    config: {
      action: FORM_ACTION,
      fields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
    },
    // A SINGLE-subtree seam: the node list is that one subtree, so the items are
    // its first two children. Same rule, one step deeper.
    slotValue: {
      kind: 'container',
      layout: 'stack',
      children: [
        { kind: 'text', text: SEAM_COPY_ONE },
        { kind: 'text', text: SEAM_COPY_TWO },
        { kind: 'control', control: 'email' },
        { kind: 'control', control: 'submit' },
      ],
    },
    addresses: ['0.0', '0.1'],
  },
]

/**
 * The seam case for one catalog entry — the point at which the CATALOG, not this
 * file, decides what gets exercised.
 *
 * A module in `registry` that declares a slot and has no case here throws, so
 * adding a behavior module to the catalog without extending this table fails
 * AC-954 instead of passing it by omission. The declared-slot check is the same
 * guard pointed the other way: a case naming a seam its module does not declare
 * would exercise nothing while looking like coverage.
 */
function seamCaseFor(def: BehaviorDefinition): SeamCase {
  const { id, version, slots } = def.meta
  const found = SEAM_CASES.find((c) => c.type === id && c.version === version)
  if (!found) {
    throw new Error(
      `AC-954: behavior '${id}@${version}' exposes seam(s) ${Object.keys(slots)
        .map((s) => `'${s}'`)
        .join(', ')} but has no SEAM_CASES entry, so its seam marker is unproven. ` +
        `Add one — the criterion holds "for any module added after" the first two.`,
    )
  }
  if (!(found.slot in slots)) {
    throw new Error(
      `AC-954: SEAM_CASES entry for '${id}@${version}' names seam '${found.slot}', ` +
        `which the module does not declare (declared: ${Object.keys(slots).join(', ')}).`,
    )
  }
  return found
}

/** A fresh site whose home page mounts `seam`'s module with two items of copy. */
function seedSeamPage(cwd: string, slug: string, seam: SeamCase): Record<string, unknown> {
  cmdNew(slug, { cwd })
  const homePath = homeJsonPath(cwd, slug)
  const home = JSON.parse(readFileSync(homePath, 'utf8'))
  home.l1.root = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [
      { kind: 'text', text: PAGE_COPY, axes: { fontSizePx: 20 } },
      { kind: 'slot', name: 'seam' },
    ],
  }
  home.modules = [
    {
      id: seam.instance,
      type: seam.type,
      version: seam.version,
      slot: 'seam',
      config: seam.config,
      slots: { [seam.slot]: seam.slotValue },
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
  beforeEach(async () => {
    cwd = mkdtempSync(path.join(tmpdir(), 'edit-render-'))
    cmdNew('acme', { cwd })
    seedPage(cwd, 'acme')
  })
  afterEach(async () => {
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
    expect(previewHtml).not.toMatch(/<body[^>]*\sdata-fc-edit(?=[\s>])/)
    expect(previewCss).toContain('overflow-x: auto')
    expect(previewCss).toContain('scroll-snap-type: x mandatory')

    // The edit render sets the marker, which is what arms the carousel's own
    // settled-state declaration: the track wraps and stops snapping, so every
    // slide is on screen — and clickable — at once.
    expect(editHtml).toMatch(/<body[^>]*\sdata-fc-edit(?=[\s>])/)
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
  // The renderer draws the outline — resting AND hot — and neither becoming a
  // segment nor being hovered can move a box.
  it('test_UAT_AC952_every_segment_is_outlined_by_the_render_without_reserving_layout_space', async () => {
    const { previewHtml, editHtml } = await renderBoth(cwd, 'acme')

    // Exactly two outline treatments are emitted by the render itself — the
    // renderer knows which boxes are segments, so no client hit-tests for them.
    const treatments = editHtml.match(/\[data-l1-segment\][^{]*\{[^}]*\}/g) ?? []
    expect(treatments).toHaveLength(2)
    const [resting, hot] = treatments

    // The resting treatment is selected on the presence of a region stamp
    // ALONE, so it applies to precisely the stamped set and to nothing else...
    expect(resting).toMatch(/^\[data-l1-segment\]\s*\{/)
    // ...and the hot one on that same stamp TOGETHER WITH the marker a client
    // puts on the one region under the pointer. The render owns what a hot
    // segment looks like; the client only says which segment is hot.
    expect(hot).toMatch(/^\[data-l1-segment\]\.l1-edit-hot\s*\{/)
    // Both apply to a set the page actually has members of.
    expect(stampedSegments(editHtml).length).toBeGreaterThan(0)

    // Both are painted OUTSIDE the page's layout: `outline` reserves no space,
    // and neither rule declares a box-model property that could displace
    // anything. So a region's box in the edit render is its box in the preview
    // render, and stays so while it is hot — the movement in the hot treatment
    // is the outline lifting off the box, never the box moving.
    expect(resting).toMatch(/outline:\s*1px solid/)
    expect(resting).toContain('outline-offset: -1px')
    expect(hot).toMatch(/outline:\s*2px solid/)
    expect(hot).toMatch(/outline-offset:\s*3px/)
    for (const rule of treatments) {
      expect(rule).not.toMatch(/(^|[^-])border\s*:/)
      expect(rule).not.toMatch(/\bmargin\s*:/)
      expect(rule).not.toMatch(/\bpadding\s*:/)
      expect(rule).not.toMatch(/\bwidth\s*:/)
      expect(rule).not.toMatch(/\bheight\s*:/)
      // Only outline properties are declared — nothing that repositions a box.
      const decls = /\{([^}]*)\}/.exec(rule)?.[1] ?? ''
      for (const decl of decls.split(';').map((d) => d.trim()).filter(Boolean)) {
        expect(decl).toMatch(/^(outline|outline-offset|transition):/)
      }
    }

    // The preview render of the same page carries neither treatment.
    expect(previewHtml).not.toContain('[data-l1-segment]')
    expect(previewHtml).not.toContain('outline-offset: -1px')
    expect(previewHtml).not.toContain('l1-edit-hot')
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
  // Seam content is addressable, rooted at the instance rather than the page —
  // and EVERY module in the catalog that exposes a seam marks it, because copy
  // inside an unmarked seam carries an address that cannot be told apart from a
  // page-rooted one and is therefore unresolvable.
  it('test_UAT_AC954_seam_content_is_addressable_rooted_at_the_behavior_instance', async () => {
    // "For each module in the catalog that exposes a presentation seam" — read
    // from the catalog itself, so the loop's membership is the registry's and
    // not this file's. Every entry currently declares slots; a future behavior
    // with none is legitimately not a seam case and drops out here.
    const catalog = [...registry.values()].filter((d) => Object.keys(d.meta.slots).length > 0)
    expect(catalog.length, 'the catalog must expose at least one seam to prove').toBeGreaterThan(0)

    // The guard discriminates before it is relied on: a module the catalog could
    // hold tomorrow, with a seam and no case, fails here rather than passing by
    // never being iterated. Without this, "every module in the catalog" is a
    // claim the loop cannot make.
    const newcomer = {
      meta: { ...catalog[0].meta, id: 'a-module-added-after-them', version: 1 },
      Component: catalog[0].Component,
    } as BehaviorDefinition
    expect(() => seamCaseFor(newcomer)).toThrow(/no SEAM_CASES entry/)
    // And a case pointed at a seam its module does not declare is caught too, so
    // an entry cannot survive a module renaming its slot out from under it.
    const drifted = {
      meta: { ...catalog[0].meta, slots: { 'renamed-seam': { required: true } } },
      Component: catalog[0].Component,
    } as BehaviorDefinition
    expect(() => seamCaseFor(drifted)).toThrow(/does not declare/)

    for (const def of catalog) {
      const seam = seamCaseFor(def)
      const site = `seam-${seam.type}`
      const page = seedSeamPage(cwd, site, seam)
      const render = await cmdRender(site, { cwd, edit: true })
      const editHtml = readFileSync(path.join(render.outDir, 'index.html'), 'utf8')
      const where = `module '${seam.type}', seam '${seam.slot}'`

      // Copy placed into a behavior module's presentation seam is an editable
      // region like any other: stamped with a region kind and an address. Each
      // item is rooted at the INSTANCE — the first and second addresses of the
      // seam's own namespace — rather than continuing the page's numbering.
      for (const [i, copy] of [SEAM_COPY_ONE, SEAM_COPY_TWO].entries()) {
        expect(
          editHtml,
          `${where}: ${copy} must be stamped at '${seam.addresses[i]}'`,
        ).toMatch(
          new RegExp(
            `<p[^>]*data-l1-path="${seam.addresses[i]}"[^>]*data-l1-segment="copy"[^>]*>${copy}</p>`,
          ),
        )
      }

      // The surrounding markup names both the behavior instance and the seam —
      // the module's own declaration, in every channel — so an address inside a
      // module and an identical-looking address on the page are distinguishable
      // and the scope of a seam-rooted address is recoverable from the markup
      // around it.
      expect(editHtml, `${where}: instance must be named`).toContain(
        `data-fc-module="${seam.instance}"`,
      )
      expect(editHtml, `${where}: type must be named`).toContain(`data-fc-type="${seam.type}"`)
      expect(editHtml, `${where}: the seam itself must be marked`).toContain(
        `data-l1-slot="${seam.slot}"`,
      )
      // The seam marker encloses the stamped copy: the copy sits inside the
      // element that names the seam, not beside it.
      const seamScope = new RegExp(
        `data-l1-slot="${seam.slot}"[\\s\\S]*?${SEAM_COPY_ONE}`,
      )
      expect(editHtml, `${where}: seam marker must enclose its copy`).toMatch(seamScope)

      // One resolution rule serves both whole pages and mounted fragments:
      // index the render's root node LIST, then walk `children`. The seam's own
      // node list is its subtree array (repeated) or its single subtree.
      const raw = (
        page.modules as Array<{ id: string; slots: Record<string, unknown> }>
      ).find((m) => m.id === seam.instance)!.slots[seam.slot]
      const seamRoots = (Array.isArray(raw) ? raw : [raw]) as L1Node[]
      expect((resolveAddress(seamRoots, seam.addresses[0]) as { text?: string }).text).toBe(
        SEAM_COPY_ONE,
      )
      expect((resolveAddress(seamRoots, seam.addresses[1]) as { text?: string }).text).toBe(
        SEAM_COPY_TWO,
      )

      // And the page-rooted addresses resolve against the definition without
      // the module's regions being drawn into that namespace.
      const roots = [(page.l1 as { root: L1Node }).root]
      const docSegments = stampedSegments(documentOnly(editHtml))
      expect(docSegments.length, `${where}: the page has its own regions`).toBeGreaterThan(0)
      for (const seg of docSegments) {
        const node = resolveAddress(roots, seg.path)
        expect(node, `${where}: page address '${seg.path}' must resolve`).toBeDefined()
        expect((node as { text?: string }).text).not.toBe(SEAM_COPY_ONE)
        expect((node as { text?: string }).text).not.toBe(SEAM_COPY_TWO)
      }
      // The two namespaces are separate even where their addresses LOOK the
      // same — which is the whole reason the seam has to be marked. Resolving a
      // seam address against the page yields something other than the seam's
      // copy (or nothing at all), so a bare address is ambiguous and the
      // enclosing instance/seam markup is what disambiguates it.
      for (const addr of seam.addresses) {
        const inPage = resolveAddress(roots, addr) as { text?: string } | undefined
        expect(inPage?.text, `${where}: '${addr}' must not mean the seam's copy on the page`)
          .not.toBe(SEAM_COPY_ONE)
        expect(inPage?.text).not.toBe(SEAM_COPY_TWO)
      }
    }
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
      // stamp, no page stamp, no document-level edit marker, and neither
      // outline treatment — resting or hot.
      expect(html).not.toContain('data-l1-path')
      expect(html).not.toContain('data-l1-segment')
      expect(html).not.toContain('data-fc-page')
      expect(html).not.toContain('data-fc-edit')
      expect(html).not.toContain('outline-offset: -1px')
      expect(html).not.toContain('l1-edit-hot')
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
    const revisionsBefore = await cmdRevisions('acme', { cwd })
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
    expect(await cmdRevisions('acme', { cwd })).toEqual(revisionsBefore)
    const history = JSON.parse(
      readFileSync(path.join(cwd, 'storage', 'sites', 'acme', 'history.json'), 'utf8'),
    )
    expect(history.revisions).toHaveLength(1)
    expect(JSON.stringify(history)).not.toContain('edit')
  })

  // ── AC-1007 ───────────────────────────────────────────────────────────────
  // The document names the page it came from, so an address is a complete
  // coordinate — and it is the definition id, never the slug or the file name.
  it('test_UAT_AC1007_edit_render_stamps_the_definition_id_of_the_page_it_came_from', async () => {
    // A site whose home page's definition id differs from BOTH its slug and the
    // file name it is emitted under: slug `home` emits `home.html` plus the
    // `index.html` alias, and the id is neither.
    cmdNew('stamped', { cwd })
    const homePath = homeJsonPath(cwd, 'stamped')
    const home = JSON.parse(readFileSync(homePath, 'utf8'))
    home.id = 'landing'
    home.slug = 'home'
    home.l1.root = {
      kind: 'container',
      layout: 'stack',
      children: [{ kind: 'text', text: BAND_COPY, axes: { fontSizePx: 24 } }],
    }
    home.modules = []
    writeFileSync(homePath, JSON.stringify(home, null, 2))

    // ...plus one non-home page, whose id likewise differs from its slug.
    const second = {
      ...home,
      id: 'contact-us',
      slug: 'contact',
      title: 'Contact',
      seoMeta: { title: 'Contact', description: 'Say hello.' },
      l1: {
        ...home.l1,
        root: {
          kind: 'container',
          layout: 'stack',
          children: [{ kind: 'text', text: LINKED_COPY, axes: { fontSizePx: 24 } }],
        },
      },
    }
    writeFileSync(
      path.join(cwd, 'storage', 'sites', 'stamped', 'draft', 'pages', 'contact.json'),
      JSON.stringify(second, null, 2),
    )

    const edit = await cmdRender('stamped', { cwd, edit: true })

    // Each page's rendered document carries the page stamp under the PUBLISHED
    // attribute name, on the same element as the edit-mode marker — and its
    // value is that page's definition id.
    const stamped: Array<[string, string, string]> = [
      // file, definition id, the slug/file name it must NOT be
      ['index.html', 'landing', 'home'],
      ['home.html', 'landing', 'home'],
      ['contact.html', 'contact-us', 'contact'],
    ]
    for (const [file, id, notThis] of stamped) {
      const html = readFileSync(path.join(edit.outDir, file), 'utf8')
      // One element carries both: the marker and the page stamp together.
      expect(html, `${file}: marker and stamp on the same element`).toMatch(
        new RegExp(`<body[^>]*\\s${L1_EDIT_MARKER_ATTR}\\s+${L1_EDIT_PAGE_ATTR}="[^"]*"`),
      )
      const value = new RegExp(`${L1_EDIT_PAGE_ATTR}="([^"]*)"`).exec(html)?.[1]
      expect(value, `${file}: stamp is the definition id`).toBe(id)
      // Never the slug, and never the file name the page was emitted under —
      // `index.html` is an ALIAS, so the file on screen does not name the page.
      expect(value).not.toBe(notThis)
      expect(value).not.toBe(path.basename(file, '.html'))
    }

    // The stamped id together with a stamped address from the SAME document
    // identifies the region the address was derived from: the two halves of the
    // coordinate resolve, through the published address form, to that copy.
    const indexHtml = readFileSync(path.join(edit.outDir, 'index.html'), 'utf8')
    const pageId = new RegExp(`${L1_EDIT_PAGE_ATTR}="([^"]*)"`).exec(indexHtml)![1]
    const address = addressOf(indexHtml, BAND_COPY)
    expect(address).not.toBe('')
    const resolved = (await editCopyGet('stamped', pageId, address, fsOpts(cwd))).data as {
      kind: string
      values: Record<string, string>
    }
    expect(resolved.kind).toBe('text')
    expect(resolved.values.text).toBe(BAND_COPY)

    // The shipped channels carry no such stamp.
    const preview = await cmdRender('stamped', { cwd })
    const published = await cmdPublish('stamped', { cwd, now: '2026-01-01T00:00:00.000Z' })
    for (const dir of [preview.outDir, published.outDir]) {
      for (const file of ['index.html', 'home.html', 'contact.html']) {
        expect(readFileSync(path.join(dir, file), 'utf8')).not.toContain(L1_EDIT_PAGE_ATTR)
      }
    }
  })

  // ── AC-1008 ───────────────────────────────────────────────────────────────
  // One published vocabulary: the render writes it, a client reads it, and a
  // rename lands on both sides at once.
  it('test_UAT_AC1008_the_stamp_vocabulary_is_one_published_contract_the_render_and_a_client_share', async () => {
    // The site definition schema publishes every name a client needs in order
    // to read a stamped render.
    const published = {
      marker: L1_EDIT_MARKER_ATTR,
      page: L1_EDIT_PAGE_ATTR,
      segment: L1_EDIT_SEGMENT_ATTR,
      path: L1_EDIT_PATH_ATTR,
      module: L1_EDIT_MODULE_ATTR,
      slot: L1_EDIT_SLOT_ATTR,
      hot: L1_EDIT_HOT_CLASS,
    }
    for (const [name, value] of Object.entries(published)) {
      expect(typeof value, `${name} is published`).toBe('string')
      expect(value.length, `${name} is non-empty`).toBeGreaterThan(0)
    }
    // ...including the dotted form an address is written in — read and write.
    expect(parseL1Path('0.1.2')).toEqual([0, 1, 2])
    expect(formatL1Path([0, 1, 2])).toBe('0.1.2')
    expect(parseL1Path('nope')).toBeNull()

    // The renderer's own surface RE-EXPORTS the contract rather than declaring
    // its own, so the two are the same values and not merely equal-looking ones.
    expect(FW_MARKER_ATTR).toBe(L1_EDIT_MARKER_ATTR)
    expect(FW_PAGE_ATTR).toBe(L1_EDIT_PAGE_ATTR)
    expect(FW_SEGMENT_ATTR).toBe(L1_EDIT_SEGMENT_ATTR)
    expect(FW_PATH_ATTR).toBe(L1_EDIT_PATH_ATTR)
    expect(FW_HOT_CLASS).toBe(L1_EDIT_HOT_CLASS)

    const { previewHtml, editHtml } = await renderBoth(cwd, 'acme')

    // Every stamp the edit channel emits is named by a published value: the
    // attributes the edit render adds over the preview render of the same
    // definition are exactly members of the vocabulary above, so there is no
    // markup a reader holding the contract cannot parse.
    const attrsOf = (html: string): Set<string> =>
      new Set((html.match(/\sdata-[a-z0-9-]+/g) ?? []).map((a) => a.trim()))
    const previewAttrs = attrsOf(previewHtml)
    const editOnly = [...attrsOf(editHtml)].filter((a) => !previewAttrs.has(a))
    expect(editOnly.length).toBeGreaterThan(0)
    for (const attr of editOnly) {
      expect(Object.values(published), `'${attr}' must be published vocabulary`).toContain(attr)
    }
    // And the ones the criterion names are all actually emitted.
    for (const attr of [published.marker, published.page, published.segment, published.path]) {
      expect(editHtml).toContain(attr)
    }
    // The seam's names are the module's declaration, and are emitted too.
    for (const attr of [published.module, published.slot]) {
      expect(editHtml).toContain(attr)
    }

    // The hot treatment's selector is COMPOSED from the published region-stamp
    // name together with the published hot class — the render says what a hot
    // segment looks like, a client says which segment is hot, neither owns the
    // name, and the stylesheet the page carries is the one the renderer
    // publishes.
    expect(L1_EDIT_CSS).toContain(`[${L1_EDIT_SEGMENT_ATTR}].${L1_EDIT_HOT_CLASS} {`)
    expect(editHtml).toContain(L1_EDIT_CSS)

    // An address read off the output THROUGH the published form addresses the
    // node it was derived from, using the published resolution rule.
    const page = readHome(cwd, 'acme')
    const raw = new RegExp(`${L1_EDIT_PATH_ATTR}="([^"]*)"[^>]*>${BAND_COPY}<`).exec(editHtml)?.[1]
    expect(raw).toBeDefined()
    const parsed = parseL1Path(raw!)
    expect(parsed).not.toBeNull()
    const node = resolveL1Node([(page.l1 as { root: L1Node }).root], parsed!)
    expect((node as { kind?: string; text?: string }).kind).toBe('text')
    expect((node as { text?: string }).text).toBe(BAND_COPY)
  })
})
