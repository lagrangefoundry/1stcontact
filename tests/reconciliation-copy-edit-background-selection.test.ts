import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, cmdPublish, cmdRender, run, startBuilder } from '../tools/generate/src/cli'
import type { BuilderHandle } from '../tools/generate/src/cli'
import type { L1Node } from '@1stcontact/site-schema'

/**
 * story-37a3921b — **a painted panel's background image**, arriving as one more
 * answer the field derivation can give rather than as a second mechanism.
 *
 * Choosing what sits *behind* a region is the same closed pick, over the same
 * listing of the site's images, as choosing what sits *in front* of it. So there
 * is no background command and no background route to drive here: everything
 * below goes through `1c copy get|set` and `POST /api/copy`, which is the claim.
 * What a background adds lives entirely in *what a region answers when asked
 * which fields it exposes*, and in the rules that answer has to keep — the
 * current handle is always among its own options, a handle the site never
 * offered is refused at the field, and a swap disturbs no other parameter and no
 * asset byte.
 *
 * Real entry points only: the **command line** through `run(argv)` (argv in, an
 * `{ok,data}` / `{ok,error}` envelope and an exit code out), the **builder
 * origin** over HTTP through `startBuilder`, and the **bytes on disk** — the
 * draft page document, the rendered channel and the asset files — for every
 * claim about what an edit did or did not change.
 */

/** The handles the seeded site's images are referenced by. */
const HERO = '/assets/hero.png'
const BETA = '/assets/beta.png'
const LOGO = '/assets/logo.svg'
/** Every image the site can offer — sorted, deduplicated, images only. */
const SITE_IMAGES = [BETA, HERO, LOGO]
/** A handle the capture fold could not mirror: a real value, on no disk. */
const REMOTE = 'https://cdn.example.com/offsite.jpg'
/** A handle that is safe and well-formed but names nothing the site has. */
const ABSENT = '/assets/nowhere.png'

const SHORT_COPY = 'Over the backdrop.'
/** A second run, so a violation can be planted where no edit under test touches. */
const DECOY_COPY = 'A second line, never edited here.'
const PAINTED_COPY = 'A run that paints its own backdrop.'
const IMAGE_ALT = 'Our mark'

/**
 * What a real site's `draft/assets/` holds: images beside the fonts and
 * stylesheets a capture mirrors. The non-images are the fixture's point — both
 * are real assets, and neither is anything a background can point at.
 */
const ASSET_FILES: Record<string, string> = {
  'hero.png': 'bytes:hero',
  'beta.png': 'bytes:beta',
  'logo.svg': '<svg xmlns="http://www.w3.org/2000/svg"/>',
  'body.woff2': 'bytes:font',
  'site.css': 'body{}',
}

// Addresses, as the edit render stamps them (`data-l1-path`).
/** A painted panel carrying a background image, beside a stack of other paint. */
const A_BACKDROP = '0.0'
const A_COPY = '0.0.0'
const A_DECOY = '0.0.1'
/** A painted panel carrying paint but NO background image. */
const A_FILL_ONLY = '0.1'
/** A painted panel whose background handle no file mirrors. */
const A_OFFSITE = '0.2'
/** An image region that also carries a background of its own. */
const A_IMAGE = '0.3'
/** A run of copy that also carries a background of its own. */
const A_PAINTED_COPY = '0.4'
/** Appended by the one test that needs it — an empty handle fails the envelope. */
const A_EMPTY_HANDLE = '0.5'

/** Every paint parameter the backdrop carries alongside its background image. */
const BACKDROP_PAINT = {
  surfaceFill: '#101822',
  borderRadiusPx: 12,
  opacity: 0.9,
  overlay: { color: '#000000', opacity: 0.35 },
} as const

const draftPath = (cwd: string, slug: string, ...rest: string[]): string =>
  path.join(cwd, 'storage', 'sites', slug, 'draft', ...rest)

const homeJsonPath = (cwd: string): string => draftPath(cwd, 'acme', 'pages', 'home.json')

/**
 * One page carrying every case a background picker has to answer for: a painted
 * panel with a background and a full stack of other paint, a panel painted with
 * a fill and nothing else, a panel pointing at a handle the asset store never
 * mirrored, and — as the contrast that keeps the axis on the panel — an image
 * region and a run of copy that each carry a background of their own.
 *
 * The registry declares `beta` by its BARE filename while the directory holds
 * the same byte — two sources naming one handle, so a duplicated option would
 * show up in the picker if the listing ever stopped merging them.
 */
function seedSite(cwd: string, slug: string): void {
  mkdirSync(draftPath(cwd, slug, 'assets'), { recursive: true })
  for (const [name, bytes] of Object.entries(ASSET_FILES)) {
    writeFileSync(draftPath(cwd, slug, 'assets', name), bytes)
  }

  const siteJson = draftPath(cwd, slug, 'site.json')
  const base = JSON.parse(readFileSync(siteJson, 'utf8'))
  base.assets = [{ id: 'beta', src: 'beta.png', alt: 'The beta image' }]
  writeFileSync(siteJson, JSON.stringify(base, null, 2))

  const homePath = draftPath(cwd, slug, 'pages', 'home.json')
  const home = JSON.parse(readFileSync(homePath, 'utf8'))
  const root: L1Node = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [
      // [0.0] the panel under test. The other paint is what "nothing else moved"
      // is measured against — a framing parameter would land in exactly there.
      {
        kind: 'container',
        id: 'backdrop',
        layout: 'stack',
        axes: { backgroundImageUrl: HERO, ...BACKDROP_PAINT },
        children: [
          { kind: 'text', text: SHORT_COPY, axes: { fontSizePx: 32 } }, // [0.0.0]
          { kind: 'text', text: DECOY_COPY, axes: { fontSizePx: 18 } }, // [0.0.1]
        ],
      },
      // [0.1] paint, but no background image: a panel with nothing to edit.
      { kind: 'box', id: 'fill-only', axes: { surfaceFill: '#f4f0e8', borderRadiusPx: 8 } },
      // [0.2] a handle the mirror never got — still the panel's own value.
      { kind: 'box', id: 'offsite', axes: { backgroundImageUrl: REMOTE, surfaceFill: '#222222' } },
      // [0.3] / [0.4] regions of another kind that happen to carry a background.
      {
        kind: 'image',
        id: 'mark',
        src: LOGO,
        alt: IMAGE_ALT,
        axes: { objectFit: 'cover', backgroundImageUrl: LOGO },
      },
      { kind: 'text', text: PAINTED_COPY, axes: { fontSizePx: 20, backgroundImageUrl: LOGO } },
    ],
  }
  home.l1.root = root
  writeFileSync(homePath, JSON.stringify(home, null, 2))
}

interface Field {
  name: string
  label: string
  type: string
  enum?: string[]
  required?: boolean
  widget?: string
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

/** The argv for a `copy set` with a JSON change map. */
const setArgs = (addr: string, values: unknown): string[] => [
  'copy',
  'set',
  'acme',
  'home',
  addr,
  '--values',
  JSON.stringify(values),
]

const readFields = (cwd: string, addr: string): Promise<CliResult> =>
  cli(cwd, 'copy', 'get', 'acme', 'home', addr)

/** The draft page document, byte for byte — the thing a failed edit must not touch. */
const draftBytes = (cwd: string): string => readFileSync(homeJsonPath(cwd), 'utf8')

/** The already-rendered page, byte for byte, from the command line's own render. */
async function renderedBytes(cwd: string): Promise<string> {
  const { outDir } = await cmdRender('acme', { cwd, edit: true })
  return readFileSync(path.join(outDir, 'index.html'), 'utf8')
}

/** A rendered channel's document, as the builder's iframe would receive it. */
const servedBytes = async (builder: BuilderHandle, channel: 'edit' | 'draft'): Promise<string> =>
  (await fetch(new URL(`/preview/acme/${channel}/`, builder.url))).text()

/** The addressed node, read out of the draft definition by page-rooted address. */
function draftNode(cwd: string, addr: string): Record<string, unknown> {
  const page = JSON.parse(draftBytes(cwd))
  let node = page.l1.root as Record<string, unknown>
  for (const i of addr.split('.').slice(1)) {
    node = (node.children as Record<string, unknown>[])[Number(i)]
  }
  return node
}

/** Every asset file's bytes, size and mtime — the "nothing is baked" witness. */
function assetFingerprint(cwd: string): Record<string, string> {
  const dir = draftPath(cwd, 'acme', 'assets')
  const out: Record<string, string> = {}
  for (const name of readdirSync(dir).sort()) {
    const st = statSync(path.join(dir, name))
    out[name] = `${readFileSync(path.join(dir, name), 'utf8')}|${st.size}|${st.mtimeMs}`
  }
  return out
}

/** The field descriptors of a read, by name. */
const fieldNamed = (result: CliResult, name: string): Field | undefined =>
  (result.data!.fields as Field[]).find((f) => f.name === name)

/**
 * Run `fn` against a live builder origin over the site already seeded in `cwd`.
 *
 * No pre-render: since REQ-119 the origin renders each draft-side channel from
 * the definition when it is asked for one, so "both views are current" is
 * measured against whatever the definition says at that moment rather than
 * against an artifact someone had to remember to refresh.
 */
async function withOrigin(cwd: string, fn: (builder: BuilderHandle) => Promise<void>): Promise<void> {
  const builder = await startBuilder({ cwd })
  try {
    await fn(builder)
  } finally {
    await builder.close()
  }
}

describe('story-37a3921b — a painted panel’s background image, through the same write path', () => {
  let cwd: string

  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'story-37a3921b-bg-'))
    cmdNew('acme', { cwd })
    seedSite(cwd, 'acme')
  })
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  // ── what a painted panel exposes ───────────────────────────────────────────

  it('test_UAT_AC1045_a_painted_panel_exposes_one_closed_picker_for_the_background_it_carries', async () => {
    // AC-1045 — through the SAME "what does this region expose" operation that
    // answers for a run of copy and for an image, a painted panel carrying a
    // background answers with exactly one field: which image sits behind it.
    const got = await readFields(cwd, A_BACKDROP)
    expect(got.ok).toBe(true)
    expect(got.exitCode).toBe(0)
    expect(got.data!.kind).toBe('container')
    const fields = got.data!.fields as Field[]
    expect(fields.map((f) => f.name)).toEqual(['backgroundImageUrl'])

    // A closed list, carried with the field itself, that must hold a value.
    const bg = fieldNamed(got, 'backgroundImageUrl')!
    expect(bg).toMatchObject({ label: 'Background image', type: 'enum', required: true })
    expect(Array.isArray(bg.enum)).toBe(true)

    // Its options are the handles the site's images can be referenced by — the
    // SAME list an image region's picker offers, so what a region can sit in
    // front of and what a panel can sit behind never disagree about what the
    // site has. A font file and a stylesheet are real assets and neither is
    // anything a background can point at.
    expect(bg.enum).toEqual(SITE_IMAGES)
    expect(fieldNamed(await readFields(cwd, A_IMAGE), 'src')!.enum).toEqual(SITE_IMAGES)
    expect(bg.enum).not.toContain('/assets/body.woff2')
    expect(bg.enum).not.toContain('/assets/site.css')
    // Each handle once, in a stable order across reads.
    expect(new Set(bg.enum).size).toBe(bg.enum!.length)
    expect(bg.enum).toEqual([...bg.enum!].sort())
    expect((await readFields(cwd, A_BACKDROP)).data!.fields).toEqual(fields)

    // The current value is the handle the panel paints today.
    expect(got.data!.values).toEqual({ backgroundImageUrl: HERO })
    expect((draftNode(cwd, A_BACKDROP).axes as Record<string, unknown>).backgroundImageUrl).toBe(HERO)

    // Nothing else of the panel's paint is offered. The panel demonstrably
    // CARRIES all of it — so this is a boundary the derivation draws, not an
    // absence in the fixture.
    expect(draftNode(cwd, A_BACKDROP).axes).toMatchObject(BACKDROP_PAINT)
    for (const axis of ['surfaceFill', 'borderRadiusPx', 'opacity', 'overlay', 'pattern', 'surfaceGradient']) {
      expect(fieldNamed(got, axis), axis).toBeUndefined()
    }

    // Nor is the handle offered on a region of another kind that happens to
    // carry one: an image region and a run of copy each carrying a background of
    // their own still expose only their own fields.
    const image = await readFields(cwd, A_IMAGE)
    expect((image.data!.fields as Field[]).map((f) => f.name)).toEqual(['src', 'alt'])
    expect(image.data!.values).toEqual({ src: LOGO, alt: IMAGE_ALT })
    const copy = await readFields(cwd, A_PAINTED_COPY)
    expect((copy.data!.fields as Field[]).map((f) => f.name)).toEqual(['text'])
    expect(copy.data!.values).toEqual({ text: PAINTED_COPY })
    for (const addr of [A_IMAGE, A_PAINTED_COPY]) {
      expect(
        (draftNode(cwd, addr).axes as Record<string, unknown>).backgroundImageUrl,
        addr,
      ).toBe(LOGO)
    }

    // And the origin answers the identical thing — one derivation, two ways in.
    await withOrigin(cwd, async (builder) => {
      const body = (await (
        await fetch(new URL(`/api/copy?slug=acme&page=home&path=${A_BACKDROP}`, builder.url))
      ).json()) as Record<string, unknown>
      expect(body.kind).toBe('container')
      expect(body.fields).toEqual(fields)
      expect(body.values).toEqual(got.data!.values)
    })
  })

  it('test_UAT_AC1049_a_painted_panel_with_no_background_still_answers_with_an_empty_field_list', async () => {
    // AC-1049 — a panel that paints but carries no background image exposes
    // nothing, and a panel carrying an EMPTY handle is treated the same way,
    // because an empty handle paints nothing. Appended here rather than seeded,
    // since an empty handle fails the envelope's URL allowlist and would refuse
    // every write in this file.
    const page = JSON.parse(draftBytes(cwd))
    page.l1.root.children.push({
      kind: 'box',
      id: 'empty-handle',
      axes: { surfaceFill: '#0a0a0a', backgroundImageUrl: '' },
    })
    writeFileSync(homeJsonPath(cwd), JSON.stringify(page, null, 2))

    for (const addr of [A_FILL_ONLY, A_EMPTY_HANDLE]) {
      const got = await readFields(cwd, addr)
      expect(got.ok, addr).toBe(true)
      expect(got.exitCode, addr).toBe(0)
      expect(got.error, addr).toBeUndefined()
      expect(got.data!.fields, addr).toEqual([])
      expect(got.data!.values, addr).toEqual({})

      // And it SAYS so, rather than reporting an absence the host must interpret.
      const human = await cliHuman(cwd, 'copy', 'get', 'acme', 'home', addr)
      expect(human.exitCode, addr).toBe(0)
      expect(human.output, addr).toContain('no editable copy')
    }

    // The picker offers no way to introduce a background where none exists: the
    // field a panel that DOES carry one exposes has no empty choice, and is
    // marked as one that must hold a value.
    const carrying = fieldNamed(await readFields(cwd, A_BACKDROP), 'backgroundImageUrl')!
    expect(carrying.required).toBe(true)
    expect(carrying.enum).not.toContain('')
    expect(carrying.enum!.every((option) => option.trim() !== '')).toBe(true)

    // Nor by the back door: a write against the panel with no background is
    // refused rather than silently creating the axis, and the panel is untouched.
    const added = await cli(cwd, ...setArgs(A_FILL_ONLY, { backgroundImageUrl: HERO }))
    expect(added.ok).toBe(false)
    expect(added.error!.code).toBe('SCHEMA_INVALID')
    expect(draftNode(cwd, A_FILL_ONLY).axes).toEqual({ surfaceFill: '#f4f0e8', borderRadiusPx: 8 })

    // The contrasts that make the empty list meaningful, on the same page and
    // through the same operation.
    expect((await readFields(cwd, A_COPY)).data!.fields).toHaveLength(1)
    expect((await readFields(cwd, A_IMAGE)).data!.fields).toHaveLength(2)
  })

  it('test_UAT_AC1047_a_panels_current_background_handle_is_always_among_its_own_options', async () => {
    // AC-1047 — a folded reproduction can hold a handle the site's asset store
    // never mirrored. It must still be a legitimate choice: a chooser whose
    // options omit its own value presents the FIRST option as selected, so an
    // operator who opened the form and saved would silently swap the panel's
    // backdrop for an unrelated image without ever choosing one.
    expect(readdirSync(draftPath(cwd, 'acme', 'assets'))).not.toContain('offsite.jpg')

    const offsite = await readFields(cwd, A_OFFSITE)
    expect(offsite.ok).toBe(true)
    const bg = fieldNamed(offsite, 'backgroundImageUrl')!
    // Present exactly once, alongside the site's own handles, in a stable order.
    expect(bg.enum!.filter((o) => o === REMOTE)).toHaveLength(1)
    expect(bg.enum).toEqual([...SITE_IMAGES, REMOTE].sort())
    expect(new Set(bg.enum).size).toBe(bg.enum!.length)
    expect(offsite.data!.values).toEqual({ backgroundImageUrl: REMOTE })

    // The same holds for a panel whose handle IS in the store — it appears once,
    // not twice, and the option list is exactly the site's images.
    const held = fieldNamed(await readFields(cwd, A_BACKDROP), 'backgroundImageUrl')!
    expect(held.enum!.filter((o) => o === HERO)).toHaveLength(1)
    expect(held.enum).toEqual(SITE_IMAGES)

    // The consequence the rule exists for: re-saving the value the picker shows
    // as selected is a no-op, not a swap to the alphabetically-first image.
    const again = await cli(cwd, ...setArgs(A_OFFSITE, { backgroundImageUrl: REMOTE }))
    expect(again.ok).toBe(true)
    expect(again.data!.changed).toEqual([])
    expect(draftNode(cwd, A_OFFSITE).axes).toEqual({
      backgroundImageUrl: REMOTE,
      surfaceFill: '#222222',
    })
  })

  // ── writing ────────────────────────────────────────────────────────────────

  it('test_UAT_AC1046_choosing_a_background_repaints_the_panel_and_disturbs_nothing_else', async () => {
    // AC-1046 — applying a chosen handle updates the background the panel carries
    // in the draft, and the re-rendered page paints that image behind that panel.
    // A published base gives `status` something to diff against, so "what did
    // this edit change?" has a countable answer.
    await cmdPublish('acme', { cwd, message: 'base' })
    const filesBefore = readdirSync(draftPath(cwd, 'acme', 'assets')).sort()
    const printBefore = assetFingerprint(cwd)
    const nodeBefore = draftNode(cwd, A_BACKDROP)
    expect(await renderedBytes(cwd)).toMatch(/background-image:[^;}]*assets\/hero\.png/)

    const saved = await cli(cwd, ...setArgs(A_BACKDROP, { backgroundImageUrl: BETA }))
    expect(saved.ok).toBe(true)
    expect(saved.exitCode).toBe(0)
    // It reports the ONE parameter that changed, and where the re-render landed.
    expect(saved.data!.changed).toEqual(['backgroundImageUrl'])
    expect(typeof saved.data!.rendered).toBe('string')

    // The draft now carries the new handle …
    expect((draftNode(cwd, A_BACKDROP).axes as Record<string, unknown>).backgroundImageUrl).toBe(BETA)
    // … and the page the same operation rendered paints it behind that panel.
    const html = readFileSync(path.join(String(saved.data!.rendered), 'index.html'), 'utf8')
    expect(html).toMatch(/background-image:[^;}]*assets\/beta\.png/)
    expect(html).not.toContain('assets/hero.png')

    // Every other parameter the panel carries is byte-identical: the named
    // parameter was written into the set the panel already holds, not over it.
    const nodeAfter = draftNode(cwd, A_BACKDROP)
    expect(nodeAfter).toEqual({
      ...nodeBefore,
      axes: { ...(nodeBefore.axes as object), backgroundImageUrl: BETA },
    })
    expect(nodeAfter.axes).toEqual({ backgroundImageUrl: BETA, ...BACKDROP_PAINT })
    expect(nodeAfter.id).toBe('backdrop')
    expect((nodeAfter.children as unknown[]).length).toBe(2)

    // No byte of the site's assets changed: nothing written, copied, resized or
    // processed, and no new file appeared.
    expect(readdirSync(draftPath(cwd, 'acme', 'assets')).sort()).toEqual(filesBefore)
    expect(assetFingerprint(cwd)).toEqual(printBefore)
    const status = await cli(cwd, 'status', 'acme')
    expect(status.data!.added).toEqual([])
    expect(status.data!.removed).toEqual([])
    expect(status.data!.modified).toEqual(['pages/home.json'])

    // And it travelled the shared whole-definition validator, asserted by
    // CONSEQUENCE: break a part of the page this edit does not touch, past what
    // only whole-definition validation sees, and the background edit refuses for
    // exactly the reason an unrelated structured-edit command does — which it
    // could not do if it validated only its own field, or ran a validator of its
    // own. 9999px clears the schema's shape check and fails the L1 envelope's
    // range.
    const page = JSON.parse(draftBytes(cwd))
    page.l1.root.children[0].children[1].axes.fontSizePx = 9999
    writeFileSync(homeJsonPath(cwd), JSON.stringify(page, null, 2))
    const before = draftBytes(cwd)
    expect(A_DECOY).not.toBe(A_BACKDROP)

    const background = await cli(cwd, ...setArgs(A_BACKDROP, { backgroundImageUrl: LOGO }))
    const other = await cli(cwd, 'config', 'set', 'acme', 'displayName', 'Acme')
    expect(background.ok).toBe(false)
    expect(other.ok).toBe(false)
    expect(background.error!.code).toBe(other.error!.code)
    expect(background.error!.message).toBe(other.error!.message)
    expect(background.error!.path).toBe(other.error!.path)
    expect(background.error!.message).toContain('fontSizePx')
    expect(draftBytes(cwd)).toBe(before)
  })

  // ── refusing ───────────────────────────────────────────────────────────────

  it('test_UAT_AC1048_a_background_handle_the_site_never_offered_is_refused_at_the_field', async () => {
    // AC-1048 — a handle that was not among the options the region itself offered
    // is refused at the FIELD, before the whole-definition validator runs, and
    // nothing at all is written. That refusal is one the shared validator
    // structurally cannot make: `/assets/nowhere.png` is a perfectly well-formed,
    // SAFE handle, so validation would accept it and the panel would paint
    // nothing with no error anywhere. A caller holding a stale listing of the
    // site's images is the realistic source.
    const before = draftBytes(cwd)
    const renderedBefore = await renderedBytes(cwd)
    const offered = fieldNamed(await readFields(cwd, A_BACKDROP), 'backgroundImageUrl')!.enum!
    for (const value of [ABSENT, '/assets/body.woff2', '', 'javascript:alert(1)']) {
      expect(offered, value).not.toContain(value)
    }

    for (const value of [ABSENT, '/assets/body.woff2', '', 'javascript:alert(1)']) {
      const refused = await cli(cwd, ...setArgs(A_BACKDROP, { backgroundImageUrl: value }))
      expect(refused.ok, value).toBe(false)
      expect(refused.exitCode, value).not.toBe(0)
      expect(refused.error!.code, value).toBe('SCHEMA_INVALID')
      // The fault is scoped to the background field and names what was refused.
      expect(refused.error!.path, value).toBe(`${A_BACKDROP}/backgroundImageUrl`)
      expect(refused.error!.message, value).toContain('backgroundImageUrl')
      // Nothing partial landed: the draft and the already-rendered page are
      // byte-for-byte unchanged, which is what makes "show the error and carry
      // on" safe.
      expect(draftBytes(cwd), value).toBe(before)
      expect(await renderedBytes(cwd), value).toBe(renderedBefore)
    }
    // The panel still paints exactly what it did.
    expect((await readFields(cwd, A_BACKDROP)).data!.values).toEqual({ backgroundImageUrl: HERO })

    // And the refusal is reported identically through the builder origin — a
    // CLIENT fault carrying the very same code, path, hint and message, never a
    // generic server failure that throws away the field's name.
    await withOrigin(cwd, async (builder) => {
      for (const value of [ABSENT, '', 'javascript:alert(1)']) {
        const res = await fetch(new URL('/api/copy', builder.url), {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            slug: 'acme',
            page: 'home',
            path: A_BACKDROP,
            values: { backgroundImageUrl: value },
          }),
        })
        expect(res.status, value).toBeGreaterThanOrEqual(400)
        expect(res.status, value).toBeLessThan(500)
        const body = (await res.json()) as Record<string, unknown>
        const refusal = await cli(cwd, ...setArgs(A_BACKDROP, { backgroundImageUrl: value }))
        expect(body.code, value).toBe(refusal.error!.code)
        expect(body.path, value).toBe(refusal.error!.path)
        expect(body.hint, value).toBe(refusal.error!.hint)
        expect(body.message, value).toBe(refusal.error!.message)
        expect(String(body.path), value).toContain('backgroundImageUrl')
        expect(draftBytes(cwd), value).toBe(before)
      }

      // Both renderings still show the original backdrop at the origin too.
      for (const channel of ['edit', 'draft'] as const) {
        expect(await servedBytes(builder, channel), channel).toMatch(
          /background-image:[^;}]*assets\/hero\.png/,
        )
      }
    })
  })
})
