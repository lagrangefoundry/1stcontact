import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, cmdRender, run, startBuilder } from '../tools/generate/src/cli'
import type { BuilderHandle } from '../tools/generate/src/cli'
import { L1_EDIT_PATH_ATTR } from '../packages/site-schema/src/l1/edit'
import type { L1Node } from '@1stcontact/site-schema'

/**
 * story-37a3921b — **what colour a region is painted in, and what to say when a
 * control cannot honour a pick.**
 *
 * Two halves of one answer. Colour arrives as one more thing a region can say
 * about itself — a run's own colour, a painted panel's fill, and the panel a run
 * sits on — written as a reference into the site's own palette and never as a
 * free colour value. Availability is the rule that keeps the first half honest:
 * where a control would be inert, lossy or unsupported it is still offered, in
 * the same position, reporting what the region holds, and marked unavailable
 * *with a plain-English reason* that is one string with one definition — the
 * sentence the row shows and the sentence a refused write returns.
 *
 * The subtle claim running through both, and the one nothing in either feature
 * surfaces on its own: **every rule here binds a change and never the status
 * quo.** A saved form posts every field the region exposed, so an unavailable
 * colour and a folded site's free colour literal both ride along on a save that
 * only rewrote the words. Refusing either would have made the words of the
 * measured runs uneditable the moment colour shipped.
 *
 * Real entry points only: the **command line** through `run(argv)` (argv in, an
 * `{ok,data}` / `{ok,error}` envelope and an exit code out), the **builder
 * origin** over HTTP through `startBuilder`, and the **bytes on disk** — the
 * draft page document and the rendered page — for every claim about what an edit
 * did or did not change.
 */

/** The family as a run asks for it — a stack — against the bare family a face declares. */
const STACK = 'Satoshi, Helvetica Neue, Arial, sans-serif'
const FAMILY = 'Satoshi'

/**
 * The site's palette. Every entry resolves to a hex that appears nowhere else in
 * the fixture, so "the page paints what this entry resolves to" is a claim the
 * rendered bytes can actually settle.
 */
const PALETTE = {
  neutral: { value: '#f6f7f4' },
  amber: { value: '#d4a017' },
  orange: { value: '#ff7a00' },
  brand: { value: '#2e86a3' },
  ink: { value: '#123456' },
  moss: { value: '#3a7d44' },
  plum: { value: '#6d3f7c' },
  teal: { value: '#0f8b8d' },
}
const PALETTE_NAMES = Object.keys(PALETTE)

const HERO = '/assets/hero.png'
const BETA = '/assets/beta.png'

/** What the seeded site's asset store holds. */
const ASSET_FILES: Record<string, string> = {
  'hero.png': 'bytes:hero',
  'beta.png': 'bytes:beta',
}

// The literals the fixture paints with. None of them is a palette hex, so a
// write can never be confused with what was already there.
const ROOT_FILL = '#0b1220'
const LEDE_COLOR = '#e8eef2'
const PANEL_FILL = '#101820'
const BACKDROP_FILL = '#101822'
const GRADIENT_PANEL_FILL = '#1a1a2e'
const PAINTED_COPY_FILL = '#221122'
const SYSTEM_COLOR = '#101825'

const WORDMARK_COPY = 'Gigabyte Alchemy'
const LEDE_COPY = 'An ordinary run, painted by its colour axis.'
const PANEL_COPY = 'Sitting on a panel.'
const PAINTED_COPY = 'A run that carries a fill of its own.'
const SYSTEM_COPY = 'Set in whatever the reader has.'
const BARE_PAGE_COPY = 'Nothing painted behind these words.'

// Addresses, as the edit render stamps them (`data-l1-path`).
/** A run whose glyphs are painted by a gradient, over a real flat colour. */
const A_WORDMARK = '0.0'
/** The ordinary run beside it — the contrast that keeps unavailability local. */
const A_LEDE = '0.1'
/** A painted panel, carrying other paint beside its fill. */
const A_PANEL = '0.2'
/** A run nested inside it, so "nearest painted ancestor" and "outermost" differ. */
const A_PANEL_COPY = '0.2.0'
/** A panel whose only paint is a rounded corner: painted, but holding no fill. */
const A_BARE_BOX = '0.3'
/** A band carrying a photograph, a scrim over it and a fill under both. */
const A_BACKDROP = '0.4'
/** A panel carrying a gradient layer over its fill. */
const A_GRADIENT_PANEL = '0.5'
/** A run of copy that also carries a fill — the axis is still not its field. */
const A_PAINTED_COPY = '0.6'
/** A container that paints nothing at all. */
const A_WRAPPER = '0.7'
/** A run in a family the page declares no faces for. */
const A_SYSTEM = '0.8'
/** The seam a behavior module mounts into. */
const A_SEAM = '0.9'

/** The run on a page whose root paints nothing — no panel behind it to escalate to. */
const A_BARE_PAGE_COPY = '0.0'
/** The run on the palette-less site. */
const A_PLAIN_COPY = '0.0'

const draftPath = (cwd: string, slug: string, ...rest: string[]): string =>
  path.join(cwd, 'storage', 'sites', slug, 'draft', ...rest)

const pageJsonPath = (cwd: string, slug: string, pageId: string): string =>
  draftPath(cwd, slug, 'pages', `${pageId}.json`)

/** Replace a page's L1 root (and optionally its modules) in place. */
function writePageL1(
  cwd: string,
  slug: string,
  pageId: string,
  root: L1Node,
  extra: Record<string, unknown> = {},
): void {
  const file = pageJsonPath(cwd, slug, pageId)
  const page = JSON.parse(readFileSync(file, 'utf8'))
  page.l1 = { ...(page.l1 as Record<string, unknown>), root }
  Object.assign(page, extra)
  writeFileSync(file, JSON.stringify(page, null, 2))
}

/**
 * One page carrying every distinction colour and availability turn on.
 *
 * The wordmark carries a real flat colour UNDER its gradient on purpose — that
 * is the measured shape of the run this rule exists for, and a node with no
 * colour axis could not tell "the row is unavailable" from "there was nothing to
 * report". The root paints and the panel inside it paints, so the escalation has
 * a wrong answer available (the outermost painted ancestor) as well as a right
 * one (the nearest). And the panel carries a radius and an opacity beside its
 * fill, so "a colour write disturbs nothing else" is measured against something.
 */
function seedRichSite(cwd: string, slug: string): void {
  mkdirSync(draftPath(cwd, slug, 'assets'), { recursive: true })
  for (const [name, bytes] of Object.entries(ASSET_FILES)) {
    writeFileSync(draftPath(cwd, slug, 'assets', name), bytes)
  }

  const root: L1Node = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    axes: { surfaceFill: ROOT_FILL },
    children: [
      {
        kind: 'text',
        id: 'wordmark',
        text: WORDMARK_COPY,
        axes: {
          fontFamily: STACK,
          fontSizePx: 48,
          fontWeight: 700,
          color: { ref: 'neutral' },
          gradientFill: {
            angleDeg: 90,
            stops: [
              { color: { ref: 'amber' }, position: 0 },
              { color: { ref: 'orange' }, position: 100 },
            ],
          },
        },
      },
      {
        kind: 'text',
        id: 'lede',
        text: LEDE_COPY,
        axes: { fontFamily: STACK, fontSizePx: 18, color: LEDE_COLOR },
      },
      {
        kind: 'container',
        id: 'panel',
        layout: 'stack',
        axes: { surfaceFill: PANEL_FILL, borderRadiusPx: 12, opacity: 0.95 },
        children: [
          // NO colour axis: a run that inherits, so the derivation has to report
          // an absent value rather than a resolved one.
          { kind: 'text', id: 'panel-copy', text: PANEL_COPY, axes: { fontSizePx: 18 } },
        ],
      },
      // Paints, but holds no fill — a segment that had nothing to edit before.
      { kind: 'box', id: 'bare', axes: { borderRadiusPx: 8 } },
      // A photograph, a scrim over it and a fill under both: three painting axes,
      // none of which hides the other two.
      {
        kind: 'container',
        id: 'backdrop',
        layout: 'stack',
        axes: {
          backgroundImageUrl: HERO,
          surfaceFill: BACKDROP_FILL,
          overlay: { color: '#000000', opacity: 0.35 },
        },
        children: [{ kind: 'text', id: 'over', text: 'Over the backdrop.' }],
      },
      // A gradient layer over a fill — the fill shows through, so it stays live.
      {
        kind: 'box',
        id: 'gradient-panel',
        axes: {
          surfaceFill: GRADIENT_PANEL_FILL,
          surfaceGradient: {
            angleDeg: 180,
            stops: [
              { color: { ref: 'plum' }, position: 0 },
              { color: { ref: 'teal' }, position: 100 },
            ],
          },
        },
      },
      // A run carrying a fill of its own: still not a field on a run.
      {
        kind: 'text',
        id: 'painted-copy',
        text: PAINTED_COPY,
        axes: { fontSizePx: 20, surfaceFill: PAINTED_COPY_FILL },
      },
      // Paints nothing: not a region at all.
      {
        kind: 'container',
        id: 'wrapper',
        layout: 'stack',
        children: [{ kind: 'text', id: 'wrapped', text: 'Inside a plain wrapper.' }],
      },
      // A family the page declares no faces for — nothing is unavailable here.
      {
        kind: 'text',
        id: 'system',
        text: SYSTEM_COPY,
        axes: { fontFamily: 'system-ui, sans-serif', fontSizePx: 16, color: SYSTEM_COLOR },
      },
      { kind: 'slot', name: 'gallery' },
    ],
  } as L1Node

  writePageL1(cwd, slug, 'home', root, {
    modules: [
      {
        id: 'gallery',
        type: 'carousel',
        version: 3,
        slot: 'gallery',
        config: {},
        slots: { slide: [{ kind: 'text', text: 'The only slide.' }] },
      },
    ],
  })

  // Two weights, NO italic face — which is what makes italic unavailable on
  // every run set in this family, and leaves the system run's control alone.
  const homeFile = pageJsonPath(cwd, slug, 'home')
  const home = JSON.parse(readFileSync(homeFile, 'utf8'))
  home.l1.resources = {
    fonts: [400, 700].map((weight) => ({
      family: FAMILY,
      src: `/assets/satoshi-${weight}.woff2`,
      weight,
      style: 'normal',
    })),
  }
  writeFileSync(homeFile, JSON.stringify(home, null, 2))

  const siteFile = draftPath(cwd, slug, 'site.json')
  const site = JSON.parse(readFileSync(siteFile, 'utf8'))
  site.palette = PALETTE
  writeFileSync(siteFile, JSON.stringify(site, null, 2))
}

/**
 * A second page on the same site whose root paints nothing, so a run on it sits
 * on no panel at all. The rich page cannot supply that case: its root paints, so
 * every run on it has a painted ancestor.
 */
async function addBarePage(cwd: string, slug: string): Promise<void> {
  const added = await invoke(cwd, ['page', 'add', slug, 'bare', '--title', 'Bare'], true)
  if (!added.ok) throw new Error(`could not add the bare page: ${added.error?.message}`)

  // A page added through the command line carries no L1 document at all, so the
  // document-level declarations (the widths a responsive rule is sampled at, the
  // page's own background and text colour) come from the site's starter page.
  // Its `resources` deliberately do not: the faces are the rich page's, and a
  // run on this one is painted by the reader's own font.
  const home = JSON.parse(readFileSync(pageJsonPath(cwd, slug, 'home'), 'utf8'))
  const { widths, background, textColor } = home.l1 as Record<string, unknown>

  const file = pageJsonPath(cwd, slug, 'bare')
  const page = JSON.parse(readFileSync(file, 'utf8'))
  page.l1 = {
    widths,
    background,
    textColor,
    root: {
      kind: 'container',
      id: 'bare-root',
      layout: 'stack',
      children: [{ kind: 'text', id: 'unbacked', text: BARE_PAGE_COPY, axes: { fontSizePx: 18 } }],
    },
  }
  writeFileSync(file, JSON.stringify(page, null, 2))
}

/**
 * A second SITE, declaring no palette — the common first state of a folded site,
 * not an edge case. Its page holds no palette reference anywhere, because a
 * reference on a site with no palette is precisely what this surface refuses.
 */
function seedPlainSite(cwd: string, slug: string): void {
  writePageL1(cwd, slug, 'home', {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    axes: { surfaceFill: ROOT_FILL },
    children: [
      { kind: 'text', id: 'lede', text: LEDE_COPY, axes: { fontSizePx: 32, color: LEDE_COLOR } },
      { kind: 'box', id: 'panel', axes: { surfaceFill: PANEL_FILL } },
    ],
  } as L1Node)
}

interface Field {
  name: string
  label: string
  type: string
  enum?: string[]
  required?: boolean
  locked?: boolean
  reason?: string
}

interface CliResult {
  ok: boolean
  data?: Record<string, unknown>
  error?: { code: string; message: string; path?: string; hint?: string }
  exitCode: number
  /** Everything the command printed, in order — the human report when not `--json`. */
  output: string
}

/**
 * Drive the real `1c` entry point. `run` reads the working directory from the
 * process, so the test supplies one the way a shell would, and restores it —
 * along with the exit code the command set — before returning.
 */
async function invoke(cwd: string, argv: string[], json: boolean): Promise<CliResult> {
  const prevCwd = process.cwd()
  const prevLog = console.log
  const prevErr = console.error
  const out: string[] = []
  process.chdir(cwd)
  process.exitCode = 0
  console.log = (...a: unknown[]) => void out.push(a.map(String).join(' '))
  console.error = (...a: unknown[]) => void out.push(a.map(String).join(' '))
  try {
    await run(json ? [...argv, '--json'] : argv)
  } finally {
    console.log = prevLog
    console.error = prevErr
    process.chdir(prevCwd)
  }
  const exitCode = typeof process.exitCode === 'number' ? process.exitCode : 0
  process.exitCode = 0
  const output = out.join('\n')
  if (!json) return { ok: exitCode === 0, exitCode, output }
  const envelope = JSON.parse(out[out.length - 1]) as Omit<CliResult, 'exitCode' | 'output'>
  return { ...envelope, exitCode, output }
}

/** The machine-readable invocation — the shape an AI or an editor host drives. */
const cli = (cwd: string, ...argv: string[]): Promise<CliResult> => invoke(cwd, argv, true)
/** The same command in its human report mode. */
const cliHuman = (cwd: string, ...argv: string[]): Promise<CliResult> => invoke(cwd, argv, false)

interface Scope {
  slug?: string
  page?: string
  module?: string
  slot?: string
}

const scopeArgs = (scope: Scope = {}): string[] => [
  ...(scope.module ? ['--module', scope.module] : []),
  ...(scope.slot ? ['--slot', scope.slot] : []),
]

const readFields = (cwd: string, addr: string, scope: Scope = {}): Promise<CliResult> =>
  cli(cwd, 'copy', 'get', scope.slug ?? 'acme', scope.page ?? 'home', addr, ...scopeArgs(scope))

const setFields = (
  cwd: string,
  addr: string,
  values: unknown,
  scope: Scope = {},
): Promise<CliResult> =>
  cli(
    cwd,
    'copy',
    'set',
    scope.slug ?? 'acme',
    scope.page ?? 'home',
    addr,
    ...scopeArgs(scope),
    '--values',
    JSON.stringify(values),
  )

/**
 * Assert a command succeeded, surfacing the refusal message when it did not —
 * a bare `ok` assertion reports `false` and throws away the only thing that says
 * why.
 */
function expectOk(result: CliResult, what?: string): CliResult {
  expect(result.error?.message ?? null, what).toBeNull()
  expect(result.ok, what).toBe(true)
  return result
}

/** The field descriptors of a read, by name. */
const fieldNamed = (result: CliResult, name: string): Field | undefined =>
  (result.data!.fields as Field[]).find((f) => f.name === name)

const fieldNames = (result: CliResult): string[] =>
  (result.data!.fields as Field[]).map((f) => f.name)

/** The draft page document, byte for byte — the thing a refused edit must not touch. */
const draftBytes = (cwd: string, slug = 'acme', pageId = 'home'): string =>
  readFileSync(pageJsonPath(cwd, slug, pageId), 'utf8')

/** The node at a dotted page-rooted address, out of the draft on disk. */
function draftNode(
  cwd: string,
  addr: string,
  slug = 'acme',
  pageId = 'home',
): Record<string, unknown> {
  let node = JSON.parse(draftBytes(cwd, slug, pageId)).l1.root as Record<string, unknown>
  for (const i of addr.split('.').slice(1)) {
    node = (node.children as Record<string, unknown>[])[Number(i)]
  }
  return node
}

const axesOf = (cwd: string, addr: string): Record<string, unknown> =>
  draftNode(cwd, addr).axes as Record<string, unknown>

/** The page as the command line's own render wrote it. */
async function renderedHtml(cwd: string, edit = false): Promise<string> {
  const { outDir } = await cmdRender('acme', { cwd, ...(edit ? { edit: true } : {}) })
  return readFileSync(path.join(outDir, 'index.html'), 'utf8')
}

/** Run `fn` against a live builder origin over the sites already seeded in `cwd`. */
async function withOrigin(
  cwd: string,
  fn: (builder: BuilderHandle) => Promise<void>,
): Promise<void> {
  const builder = await startBuilder({ cwd })
  try {
    await fn(builder)
  } finally {
    await builder.close()
  }
}

/** One addressable place in the store, in the vocabulary every operation takes. */
interface Region {
  slug: string
  page: string
  path: string
  module?: string
  slot?: string
}

/**
 * Every addressable place on one page — the page's own L1 tree, then each
 * behavior module instance's slots. Both spaces are walked because both are
 * addressable, and a sweep shown only the first would never reach the copy
 * inside a carousel slide.
 */
function regionsOfPage(page: Record<string, unknown>, slug: string, pageId: string): Region[] {
  const out: Region[] = []
  const walk = (nodes: unknown[], prefix: number[], scope: { module?: string; slot?: string }) => {
    nodes.forEach((raw, index) => {
      const node = raw as Record<string, unknown>
      const at = [...prefix, index]
      out.push({ slug, page: pageId, path: at.join('.'), ...scope })
      const children = node.children
      if (Array.isArray(children) && children.length) walk(children, at, scope)
    })
  }
  const root = (page.l1 as { root?: unknown } | undefined)?.root
  if (root) walk([root], [], {})
  const modules = Array.isArray(page.modules) ? (page.modules as Record<string, unknown>[]) : []
  for (const instance of modules) {
    const id = typeof instance.id === 'string' ? instance.id : undefined
    if (!id) continue
    for (const [slot, raw] of Object.entries((instance.slots ?? {}) as Record<string, unknown>)) {
      walk(Array.isArray(raw) ? raw : [raw], [], { module: id, slot })
    }
  }
  return out
}

/** Every region of every page of every site in the store. */
function everyRegion(cwd: string): Region[] {
  const sitesDir = path.join(cwd, 'storage', 'sites')
  const out: Region[] = []
  for (const slug of readdirSync(sitesDir).sort()) {
    const pagesDir = draftPath(cwd, slug, 'pages')
    for (const file of readdirSync(pagesDir).sort()) {
      if (!file.endsWith('.json')) continue
      const pageId = file.slice(0, -'.json'.length)
      const page = JSON.parse(readFileSync(path.join(pagesDir, file), 'utf8'))
      out.push(...regionsOfPage(page, slug, pageId))
    }
  }
  return out
}

describe('story-37a3921b — a region’s colour, and the controls it cannot honour', () => {
  let cwd: string

  beforeEach(async () => {
    cwd = mkdtempSync(path.join(tmpdir(), 'story-37a3921b-colour-'))
    cmdNew('acme', { cwd })
    seedRichSite(cwd, 'acme')
    await addBarePage(cwd, 'acme')
    cmdNew('plain', { cwd })
    seedPlainSite(cwd, 'plain')
  })
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  // ── what a region says about its colour ────────────────────────────────────

  it('test_UAT_AC1269_a_run_exposes_its_colour_and_writes_only_a_palette_reference', async () => {
    // AC-1269 — asking a run what it exposes returns, beside its words, what
    // colour those words are painted in: a field whose value is a colour, after
    // the words and before the controls for how the run is set.
    const lede = await readFields(cwd, A_LEDE)
    expect(lede.ok).toBe(true)
    expect(lede.exitCode).toBe(0)
    const colour = fieldNamed(lede, 'color')!
    expect(colour).toMatchObject({ name: 'color', label: 'Text colour', type: 'color' })

    const names = fieldNames(lede)
    expect(names[0]).toBe('text')
    expect(names[1]).toBe('color')
    // Before every control for how the run is SET — the position is the claim,
    // not merely the presence.
    for (const typography of ['fontSizePx', 'fontWeight', 'italic', 'textTransform']) {
      expect(names.indexOf(typography), typography).toBeGreaterThan(names.indexOf('color'))
    }

    // The value reported is whatever the run actually HOLDS — on a folded site a
    // free colour literal …
    expect(lede.data!.values).toMatchObject({ color: LEDE_COLOR })
    // … and a run declaring no colour of its own reports NO value rather than
    // the colour it inherits, which a save would otherwise write back as a claim
    // the region never made.
    const inherits = await readFields(cwd, A_PANEL_COPY)
    expect(fieldNamed(inherits, 'color')).toBeTruthy()
    expect(inherits.data!.values).not.toHaveProperty('color')

    // The entries that may be named travel with the SAME answer, so a caller
    // cannot draw a swatch against one palette and post a reference against
    // another.
    expect(lede.data!.palette).toEqual(PALETTE)

    // What it WRITES is a reference into the site's own palette — the entry
    // name, not the colour that entry currently resolves to.
    const picked = expectOk(await setFields(cwd, A_LEDE, { color: { ref: 'brand' } }))
    expect(picked.data!.changed).toEqual(['color'])
    expect(axesOf(cwd, A_LEDE).color).toEqual({ ref: 'brand' })
    // … and the re-rendered page paints what that entry resolves to, so a later
    // change to the entry moves this run with it.
    expect(await renderedHtml(cwd)).toContain(PALETTE.brand.value)

    // Where a position on the entry's light↔dark range was chosen, the reference
    // carries it — the position is stored, never flattened into a colour.
    expectOk(await setFields(cwd, A_PANEL_COPY, { color: { ref: 'ink', shade: -0.25 } }))
    expect(axesOf(cwd, A_PANEL_COPY).color).toEqual({ ref: 'ink', shade: -0.25 })

    // The field is offered WHETHER OR NOT the site has a palette yet — most
    // folded sites hold literals and no palette at all, and withdrawing the field
    // would make the palette unreachable from the only surface that wants one.
    const plain = await readFields(cwd, A_PLAIN_COPY, { slug: 'plain' })
    expect(plain.ok).toBe(true)
    expect(fieldNamed(plain, 'color')).toMatchObject({ type: 'color' })
    expect(plain.data!.values).toMatchObject({ color: LEDE_COLOR })
    // With no entries accompanying it, because there are none.
    expect(plain.data!.palette).toBeUndefined()
  })

  it('test_UAT_AC1270_every_painted_panel_exposes_its_fill_and_a_region_that_paints_nothing_does_not', async () => {
    // AC-1270 — the fill is offered on EVERY painted panel, written by the same
    // rule and in the same shape as a run's own colour.
    const filled = await readFields(cwd, A_PANEL)
    expect(filled.ok).toBe(true)
    expect(fieldNamed(filled, 'surfaceFill')).toMatchObject({
      label: 'Background colour',
      type: 'color',
    })
    expect(filled.data!.values).toMatchObject({ surfaceFill: PANEL_FILL })

    // Including a panel whose only paint today is a rounded corner. It had
    // nothing to edit before and could be clicked, outlined and opened only to be
    // told so — so it reports the field with NO current value rather than none.
    const bare = await readFields(cwd, A_BARE_BOX)
    expect(fieldNames(bare)).toEqual(['surfaceFill'])
    expect(bare.data!.values).not.toHaveProperty('surfaceFill')

    // NOT on a run of copy that happens to carry one: a folded run's box is
    // glyph-tight, so filling it paints a tight rectangle behind the words rather
    // than the background anybody means by "behind this text".
    const run = await readFields(cwd, A_PAINTED_COPY)
    expect(fieldNames(run)).toContain('text')
    expect(fieldNames(run)).not.toContain('surfaceFill')
    expect(axesOf(cwd, A_PAINTED_COPY).surfaceFill).toBe(PAINTED_COPY_FILL)

    // A region that paints NOTHING is not a region at all. The seam answers with
    // an empty field list …
    const seam = await readFields(cwd, A_SEAM)
    expect(seam.ok).toBe(true)
    expect(seam.data!.fields).toEqual([])
    // … and the unpainted container is not addressable: the edit render stamps it
    // with no address, so there is nothing to click and no control to put on it.
    const wrapper = await readFields(cwd, A_WRAPPER)
    expect(wrapper.data!.fields).toEqual([])
    const editHtml = await renderedHtml(cwd, true)
    expect(editHtml).toContain(`${L1_EDIT_PATH_ATTR}="${A_PANEL}"`)
    expect(editHtml).not.toContain(`${L1_EDIT_PATH_ATTR}="${A_WRAPPER}"`)

    // A reference written into each of the two panels' fills lands, is painted,
    // and leaves every other parameter those panels held byte-identical.
    expectOk(await setFields(cwd, A_PANEL, { surfaceFill: { ref: 'ink' } }), A_PANEL)
    expectOk(await setFields(cwd, A_BARE_BOX, { surfaceFill: { ref: 'moss' } }), A_BARE_BOX)
    expect(axesOf(cwd, A_PANEL)).toEqual({
      surfaceFill: { ref: 'ink' },
      borderRadiusPx: 12,
      opacity: 0.95,
    })
    expect(axesOf(cwd, A_BARE_BOX)).toEqual({ borderRadiusPx: 8, surfaceFill: { ref: 'moss' } })
    const html = await renderedHtml(cwd)
    expect(html).toContain(PALETTE.ink.value)
    expect(html).toContain(PALETTE.moss.value)
  })

  it('test_UAT_AC1278_a_run_also_answers_with_the_nearest_painted_panel_behind_it_and_its_fill', async () => {
    // AC-1278 — asking a run what it exposes also answers with the panel behind
    // it: that panel's own address and the colour it is filled with, read-only.
    // NEAREST, not outermost — the panel a person means by "behind this text" is
    // the one immediately behind the words, not the page section three levels up.
    const nested = (await readFields(cwd, A_PANEL_COPY)).data!.panel as {
      path: string
      fill: string
    }
    expect(nested.path).toBe(A_PANEL)
    expect(nested.fill).toBe(PANEL_FILL)
    expect(nested.fill).not.toBe(ROOT_FILL)

    // A run sitting directly in the root names the root — which is also its
    // outermost, so the nested case above is the one that distinguishes them.
    const top = (await readFields(cwd, A_LEDE)).data!.panel as { path: string; fill: string }
    expect(top).toEqual({ path: '0', fill: ROOT_FILL })

    // ABSENT when the run sits on nothing painted, which is honest: there is no
    // panel behind this text to edit.
    const unbacked = await readFields(cwd, A_BARE_PAGE_COPY, { page: 'bare' })
    expect(unbacked.ok).toBe(true)
    expect(unbacked.data!.values).toMatchObject({ text: BARE_PAGE_COPY })
    expect(unbacked.data!.panel).toBeUndefined()

    // And a painted panel carries no such answer of its own, because a panel is
    // what a run escalates TO.
    expect((await readFields(cwd, A_PANEL)).data!.panel).toBeUndefined()

    // "Painted" is asked by the same test that decides whether a region is
    // addressable at all, so the address handed back always resolves to a region
    // that really does expose a fill — an escalation opening an empty form would
    // be the symptom of answering that question twice.
    const escalated = await readFields(cwd, nested.path)
    expect(escalated.ok).toBe(true)
    expect(fieldNames(escalated)).toContain('surfaceFill')
  })

  // ── what a control says when it cannot honour a pick ───────────────────────

  it('test_UAT_AC1274_a_gradient_painted_run_offers_its_colour_unavailable_while_its_neighbour_is_untouched', async () => {
    // AC-1274 — a run whose glyphs are painted by a gradient has its colour
    // offered UNAVAILABLE, because the control would be inert: painting glyphs
    // with a gradient requires the flat colour to be transparent, so the picker
    // would write a parameter that paints nothing. The operator would pick a
    // colour, save, and the words would not move.
    const wordmark = await readFields(cwd, A_WORDMARK)
    const locked = fieldNamed(wordmark, 'color')!
    expect(locked.locked).toBe(true)

    // The reason names the gradient and the way round it, in plain English —
    // never the internal name of a parameter, because the reader it is written
    // for is the person editing the site.
    expect(locked.reason).toMatch(/gradient/i)
    expect(locked.reason).toMatch(/chat/i)
    expect(locked.reason).not.toMatch(/gradientFill|transparent/)

    // STILL OFFERED, still in the SAME POSITION, still reporting what the run
    // holds — a measured example carries a real, editable, meaningless colour
    // underneath its gradient, and that is exactly the row worth marking rather
    // than hiding. Withdrawing it would say the editor has no colour control at
    // all, which is a different and wrong claim.
    const lede = await readFields(cwd, A_LEDE)
    expect(fieldNames(wordmark).indexOf('color')).toBe(fieldNames(lede).indexOf('color'))
    expect(wordmark.data!.values).toMatchObject({ color: { ref: 'neutral' } })

    // The identical control on the ordinary run beside it is UNTOUCHED:
    // unavailability is a statement about one element, not about the build.
    const live = fieldNamed(lede, 'color')!
    expect(live.locked).toBeUndefined()
    expect(live.reason).toBeUndefined()

    // And it is freely settable — the row is not merely unmarked.
    expectOk(await setFields(cwd, A_LEDE, { color: { ref: 'plum' } }))
    expect(axesOf(cwd, A_LEDE).color).toEqual({ ref: 'plum' })
    expect(await renderedHtml(cwd)).toContain(PALETTE.plum.value)
  })

  it('test_UAT_AC1273_a_field_is_marked_unavailable_if_and_only_if_it_carries_a_reason_across_the_whole_store', async () => {
    // AC-1273 — wherever this surface marks a field unavailable it also says WHY.
    // The two are one answer, not two, and the pairing is a property of the
    // DERIVATION rather than of one reader — so the sweep runs the whole store
    // and then re-reads it through the builder origin.
    const regions = everyRegion(cwd)
    expect(regions.length).toBeGreaterThan(0)
    // More than one site, and more than one page on a site — the walk is a store
    // walk rather than one page dressed up as one.
    expect(new Set(regions.map((r) => r.slug))).toEqual(new Set(['acme', 'plain']))
    expect(new Set(regions.filter((r) => r.slug === 'acme').map((r) => r.page))).toEqual(
      new Set(['home', 'bare']),
    )

    let unavailable = 0
    for (const region of regions) {
      const got = await readFields(cwd, region.path, region)
      const where = `${region.slug}/${region.page}#${region.path}`
      expect(got.ok, where).toBe(true)
      for (const field of got.data!.fields as Field[]) {
        const at = `${where}:${field.name}`
        // Marked unavailable IF AND ONLY IF it carries a reason …
        expect(field.locked === true, at).toBe(field.reason !== undefined)
        // … and no reason is an empty string.
        if (field.reason !== undefined) {
          expect(field.reason.length, at).toBeGreaterThan(0)
          unavailable += 1
        }
      }
    }
    // THE SWEEP MUST BE ABLE TO FAIL. A store with nothing unavailable anywhere
    // would satisfy the biconditional vacuously.
    expect(unavailable).toBeGreaterThan(0)

    // Included in the walk: a run whose family declares NO faces at all. Such a
    // run is painted by the reader's own system font, which has real italics, so
    // its italic control is neither unavailable nor carrying a reason.
    const system = fieldNamed(await readFields(cwd, A_SYSTEM), 'italic')!
    expect(system.locked).toBeUndefined()
    expect(system.reason).toBeUndefined()

    // The same answer through the builder origin — one derivation, two ways in.
    await withOrigin(cwd, async (builder) => {
      for (const region of regions.filter((r) => r.slug === 'acme' && r.page === 'home')) {
        const query = new URLSearchParams({ slug: region.slug, page: region.page, path: region.path })
        if (region.module) query.set('module', region.module)
        if (region.slot) query.set('slot', region.slot)
        const body = (await (
          await fetch(new URL(`/api/copy?${query.toString()}`, builder.url))
        ).json()) as Record<string, unknown>
        const fields = body.fields as Field[]
        expect(fields, region.path).toEqual((await readFields(cwd, region.path, region)).data!.fields)
        for (const field of fields) {
          expect(field.locked === true, `origin ${region.path}:${field.name}`).toBe(
            field.reason !== undefined,
          )
        }
      }
    })
  }, 120000)

  it('test_UAT_AC1275_a_sibling_parameter_is_not_occlusion_so_both_controls_stay_live', async () => {
    // AC-1275 — a region is marked unavailable on the test "is the write
    // observable and complete?", never on the mere presence of another parameter
    // beside the one the control writes. A scrim tints the photograph rather than
    // hiding it, and a translucent layer over a fill shows the fill through it.
    const band = await readFields(cwd, A_BACKDROP)
    expect(band.ok).toBe(true)
    for (const name of ['backgroundImageUrl', 'surfaceFill']) {
      const field = fieldNamed(band, name)!
      expect(field, name).toBeTruthy()
      expect(field.locked, name).toBeUndefined()
      expect(field.reason, name).toBeUndefined()
    }
    expect(band.data!.values).toMatchObject({
      backgroundImageUrl: HERO,
      surfaceFill: BACKDROP_FILL,
    })

    // A new value written into EACH lands in the draft and is painted by the
    // re-render — the rows are not merely unmarked.
    const saved = expectOk(
      await setFields(cwd, A_BACKDROP, {
        backgroundImageUrl: BETA,
        surfaceFill: { ref: 'teal' },
      }),
    )
    expect([...(saved.data!.changed as string[])].sort()).toEqual([
      'backgroundImageUrl',
      'surfaceFill',
    ])
    expect(axesOf(cwd, A_BACKDROP)).toEqual({
      backgroundImageUrl: BETA,
      surfaceFill: { ref: 'teal' },
      overlay: { color: '#000000', opacity: 0.35 },
    })
    const html = await renderedHtml(cwd)
    expect(html).toMatch(/assets\/beta\.png/)
    expect(html).toContain(PALETTE.teal.value)

    // The same holds of a panel carrying a GRADIENT over its fill. Locking on the
    // presence of a sibling would withdraw controls that work, across regions
    // that are common on real pages.
    const gradient = await readFields(cwd, A_GRADIENT_PANEL)
    const fill = fieldNamed(gradient, 'surfaceFill')!
    expect(fill.locked).toBeUndefined()
    expect(fill.reason).toBeUndefined()
    expect(gradient.data!.values).toMatchObject({ surfaceFill: GRADIENT_PANEL_FILL })
    expectOk(await setFields(cwd, A_GRADIENT_PANEL, { surfaceFill: { ref: 'moss' } }))
    expect(axesOf(cwd, A_GRADIENT_PANEL).surfaceFill).toEqual({ ref: 'moss' })
    expect(axesOf(cwd, A_GRADIENT_PANEL).surfaceGradient).toBeTruthy()
    expect(await renderedHtml(cwd)).toContain(PALETTE.moss.value)
  })

  it('test_UAT_AC1276_a_change_to_an_unavailable_colour_is_refused_while_reposting_it_saves_the_rest', async () => {
    // AC-1276 — a CHANGE to an unavailable colour is refused with a message
    // IDENTICAL to the reason that field carried, at the field, leaving the draft
    // byte-for-byte unchanged. The sentence the caller was shown when the control
    // was drawn and the sentence it is refused with are one string with one
    // definition, so the two can never tell different stories.
    const before = draftBytes(cwd)
    const colour = fieldNamed(await readFields(cwd, A_WORDMARK), 'color')!
    expect(colour.locked).toBe(true)

    const refused = await setFields(cwd, A_WORDMARK, { color: { ref: 'brand' } })
    expect(refused.ok).toBe(false)
    expect(refused.exitCode).not.toBe(0)
    expect(refused.error!.path).toBe(`${A_WORDMARK}/color`)
    expect(refused.error!.message).toBe(colour.reason)
    expect(draftBytes(cwd)).toBe(before)

    // RE-POSTING THE UNCHANGED VALUE PASSES, and the rest of the region saves. A
    // form posts every field it was given, not only the ones that were touched,
    // so an unavailable colour rides along on every save — including one that
    // only rewrote the words. Refusing it would make an unavailable control
    // freeze the whole region, and this run is a headline: its words would have
    // become uneditable the moment its colour did.
    const saved = expectOk(
      await setFields(cwd, A_WORDMARK, {
        text: 'Gigabyte Alchemy Labs',
        color: { ref: 'neutral' },
      }),
    )
    expect(saved.data!.changed).toEqual(['text'])
    expect(draftNode(cwd, A_WORDMARK).text).toBe('Gigabyte Alchemy Labs')
    // Its colour untouched — and so is the gradient that made it unavailable.
    expect(axesOf(cwd, A_WORDMARK).color).toEqual({ ref: 'neutral' })
    expect(axesOf(cwd, A_WORDMARK).gradientFill).toBeTruthy()
  })

  it('test_UAT_AC1277_the_command_lines_field_listing_marks_an_unavailable_field_with_its_reason', async () => {
    // AC-1277 — the human-readable listing marks an unavailable field and prints
    // its reason beside the field's name and current value. That listing is what
    // a reader at the terminal and the AI both work from, and a field printed
    // exactly like every other one is a field they will try to set and be refused
    // for, with no way to have known.
    const listing = (await cliHuman(cwd, 'copy', 'get', 'acme', 'home', A_WORDMARK)).output
    const lines = listing.split('\n')
    const colourLine = lines.find((l) => l.startsWith('color\t'))!
    expect(colourLine, 'no colour line in the listing').toBeTruthy()

    const json = await readFields(cwd, A_WORDMARK)
    const colour = fieldNamed(json, 'color')!
    // The field's name, the value it holds, and its reason marked as such.
    expect(colourLine).toContain(JSON.stringify((json.data!.values as Record<string, unknown>).color))
    expect(colourLine).toContain('(locked:')
    // Character-for-character the reason the machine-readable answer carries —
    // the same sentence the field carries and the same sentence the refusal
    // returns.
    expect(colourLine).toContain(`(locked: ${colour.reason})`)
    expect(colour.reason).toBe(
      (await setFields(cwd, A_WORDMARK, { color: { ref: 'brand' } })).error!.message,
    )

    // An ordinary field is printed UNMARKED, with nothing added — there is
    // nothing to explain about a control that works.
    for (const field of json.data!.fields as Field[]) {
      if (field.locked) continue
      const line = lines.find((l) => l.startsWith(`${field.name}\t`))!
      expect(line, field.name).toBeTruthy()
      expect(line, field.name).not.toContain('locked')
    }
    // The neighbouring row on the same region, named outright.
    expect(lines.find((l) => l.startsWith('text\t'))).not.toContain('locked')
  })

  // ── what a colour submission may say ───────────────────────────────────────

  it('test_UAT_AC1271_a_colour_outside_the_sites_palette_or_malformed_is_refused_at_the_field', async () => {
    // AC-1271 — a colour submitted for a colour field is checked server-side, at
    // the field, before the shared whole-definition validator runs, and refused
    // naming the field with the draft left byte-for-byte unchanged.
    const before = draftBytes(cwd)

    const cases: Array<{ what: string; value: unknown; says: RegExp }> = [
      // An entry the site's palette does not hold. The message names the entry
      // asked for AND the entries that exist, because the realistic cause is an
      // entry renamed or removed while a form was open.
      { what: 'unknown entry', value: { ref: 'not-an-entry' }, says: /not-an-entry/ },
      // A free colour VALUE, even though it is a perfectly valid colour: the
      // picker offers entries, so a free value arriving on the wire came from
      // something other than the picker.
      { what: 'free colour', value: '#ff0000', says: /palette/i },
      // An unrecognised part — refused rather than quietly dropped, so anything
      // this check admits is something the shared validator will admit too.
      { what: 'unknown part', value: { ref: 'brand', step: '900' }, says: /step/ },
      // A part outside its stated range: the position on the light↔dark range …
      { what: 'shade out of range', value: { ref: 'brand', shade: 2 }, says: /-1/ },
      // … and the opacity.
      { what: 'alpha out of range', value: { ref: 'brand', alpha: 4 }, says: /opacity/i },
    ]

    for (const { what, value, says } of cases) {
      const refused = await setFields(cwd, A_LEDE, { color: value })
      expect(refused.ok, what).toBe(false)
      expect(refused.exitCode, what).not.toBe(0)
      expect(refused.error!.path, what).toBe(`${A_LEDE}/color`)
      expect(refused.error!.message, what).toMatch(says)
    }
    // The unknown-entry message names what IS available, so it says what to do
    // next rather than only what went wrong.
    const unknown = await setFields(cwd, A_LEDE, { color: { ref: 'not-an-entry' } })
    for (const name of PALETTE_NAMES) {
      expect(unknown.error!.message, name).toContain(name)
    }

    // After ALL of them the stored draft is byte-identical to what it was before
    // the first — nothing partial landed.
    expect(draftBytes(cwd)).toBe(before)
    expect(axesOf(cwd, A_LEDE).color).toBe(LEDE_COLOR)

    // On a site with NO palette at all the message says so instead, since that is
    // the fact that actually explains it.
    const plainBefore = draftBytes(cwd, 'plain')
    const noPalette = await setFields(cwd, A_PLAIN_COPY, { color: { ref: 'brand' } }, { slug: 'plain' })
    expect(noPalette.ok).toBe(false)
    expect(noPalette.error!.path).toBe(`${A_PLAIN_COPY}/color`)
    expect(noPalette.error!.message).toMatch(/no palette yet/)
    expect(draftBytes(cwd, 'plain')).toBe(plainBefore)
  })

  it('test_UAT_AC1272_an_unchanged_colour_is_not_a_change_is_not_converted_and_a_reference_is_stored_canonically', async () => {
    // AC-1272 — a colour equal to the one the region just reported is NOT A
    // CHANGE. This is what makes the rest of colour usable at all: a saved form
    // carries every field the region exposed, and every region of every folded
    // site holds a free colour literal — which a new value would be refused for.
    // Without the carve-out, colour's arrival would have made the WORDS of every
    // run on every folded site uneditable.
    const reported = (await readFields(cwd, A_LEDE)).data!.values as Record<string, unknown>
    expect(reported.color).toBe(LEDE_COLOR)

    const saved = expectOk(
      await setFields(cwd, A_LEDE, { text: 'Rewritten words.', color: reported.color }),
    )
    expect(saved.data!.changed).toEqual(['text'])
    // Nor is the unchanged literal quietly "helped" into a reference: a
    // conversion nobody asked for is still an edit nobody asked for.
    expect(axesOf(cwd, A_LEDE).color).toBe(LEDE_COLOR)
    expect(draftNode(cwd, A_LEDE).text).toBe('Rewritten words.')

    // The same rule read from the other side: a reference is stored in its
    // CANONICAL form. The position and the opacity a resolver treats as absent
    // are pruned before the write, so a picker that always sends its slider
    // position writes the reference the document means rather than a fatter one
    // that resolves identically.
    expectOk(await setFields(cwd, A_LEDE, { color: { ref: 'brand', shade: 0, alpha: 1 } }))
    expect(axesOf(cwd, A_LEDE).color).toEqual({ ref: 'brand' })

    // And a colour that did not move can never appear as a diff: re-posting the
    // stored reference reports nothing changed and leaves the draft byte-identical.
    const canonical = draftBytes(cwd)
    const again = expectOk(await setFields(cwd, A_LEDE, { color: { ref: 'brand' } }))
    expect(again.data!.changed).toEqual([])
    expect(draftBytes(cwd)).toBe(canonical)

    // Including the fatter form the picker would send for the same colour.
    const fatter = expectOk(
      await setFields(cwd, A_LEDE, { color: { ref: 'brand', shade: 0, alpha: 1 } }),
    )
    expect(fatter.data!.changed).toEqual([])
    expect(draftBytes(cwd)).toBe(canonical)
  })
})
