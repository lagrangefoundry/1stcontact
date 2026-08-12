import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, run, startBuilder } from '../tools/generate/src/cli'
import type { BuilderHandle } from '../tools/generate/src/cli'
import type { L1Node } from '@1stcontact/site-schema'

/**
 * story-37a3921b — **what a closed list's options *are***, declared on the field
 * itself (REQ-132).
 *
 * Asking a region what it exposes already said a field's choices were a closed
 * list. It now also says *what those choices are* whenever knowing that changes
 * how they should be shown: a field whose options are the site's images is
 * declared as holding images, so a client can draw thumbnails instead of a
 * dropdown of paths.
 *
 * The two properties that make this a *hint* rather than a second constraint are
 * what this measures, and they pull in opposite directions:
 *
 * - it is attached by **kind of field, not kind of region** — an image region's
 *   `src` and a painted panel's `backgroundImageUrl` both carry it, the alt text
 *   beside the former does not, and nor does a run of copy's words;
 * - it **narrows nothing** — the same options, each once, in the same order,
 *   still including the handle the region holds now; membership is still enforced
 *   against that list and nothing else, so a caller that ignores the declaration
 *   is offered no wider set of values than one that honours it.
 *
 * Real entry points only, nothing internal stubbed: the **command line** through
 * `run(argv)` (argv in, an `{ok,data}` / `{ok,error}` envelope and an exit code
 * out), the **builder origin** over HTTP through `startBuilder` — because the
 * declaration must travel with the field to *every* client reading the same
 * derivation — and the **bytes on disk** for every claim about what an edit did
 * or did not change.
 */

/** The handles the seeded site's images are referenced by, in `enum` order. */
const HERO = '/assets/hero.png'
const BETA = '/assets/beta.png'
const LOGO = '/assets/logo.svg'
/** Every image the site can offer — sorted, deduplicated, images only. */
const SITE_IMAGES = [BETA, HERO, LOGO]
/** A handle the capture fold could not mirror: a real value, on no disk. */
const REMOTE = 'https://cdn.example.com/offsite.jpg'
/** A handle that is safe and well-formed but names nothing the site has. */
const ABSENT = '/assets/nowhere.png'

const HERO_ALT = 'The hero'
const OFFSITE_ALT = 'An offsite photograph the capture could not mirror.'
const SHORT_COPY = 'Over the backdrop.'

/**
 * What a real site's `draft/assets/` holds: images beside the fonts and
 * stylesheets a capture mirrors. The non-images are the fixture's point — both
 * are real assets, and neither is anything an image handle can point at.
 */
const ASSET_FILES: Record<string, string> = {
  'hero.png': 'bytes:hero',
  'beta.png': 'bytes:beta',
  'logo.svg': '<svg xmlns="http://www.w3.org/2000/svg"/>',
  'body.woff2': 'bytes:font',
  'site.css': 'body{}',
}

// Addresses, as the edit render stamps them (`data-l1-path`).
/** A painted panel carrying a background image. */
const A_BACKDROP = '0.0'
/** A run of copy — the contrast that carries no declaration. */
const A_COPY = '0.0.0'
/** The image region under test. */
const A_IMAGE = '0.1'
/** An image whose handle the asset store never mirrored. */
const A_OFFSITE = '0.2'
/** A painted panel whose background handle the asset store never mirrored. */
const A_OFFSITE_PANEL = '0.3'

const draftPath = (cwd: string, slug: string, ...rest: string[]): string =>
  path.join(cwd, 'storage', 'sites', slug, 'draft', ...rest)

const homeJsonPath = (cwd: string): string => draftPath(cwd, 'acme', 'pages', 'home.json')

/**
 * One page carrying every case the declaration has to answer for: a painted
 * panel with a background, a run of copy inside it, an image region with its alt
 * text, and — for the "still including the handle it holds now" rule — one image
 * and one panel each pointing at a handle no file mirrors.
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
      // [0.0] a painted panel carrying a background image, with copy inside it.
      {
        kind: 'container',
        id: 'backdrop',
        layout: 'stack',
        axes: { backgroundImageUrl: HERO, surfaceFill: '#101822', borderRadiusPx: 12 },
        children: [{ kind: 'text', text: SHORT_COPY, axes: { fontSizePx: 32 } }], // [0.0.0]
      },
      // [0.1] the image region under test.
      { kind: 'image', id: 'hero-img', src: HERO, alt: HERO_ALT, axes: { objectFit: 'cover' } },
      // [0.2] an image whose handle the asset store holds no file for.
      { kind: 'image', src: REMOTE, alt: OFFSITE_ALT },
      // [0.3] a panel whose background handle the asset store holds no file for.
      { kind: 'box', id: 'offsite-panel', axes: { backgroundImageUrl: REMOTE } },
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
  format?: string
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

/** The argv for a `copy set` with a JSON change map. */
function setArgs(addr: string, values: unknown): string[] {
  return ['copy', 'set', 'acme', 'home', addr, '--values', JSON.stringify(values)]
}

const readFields = async (cwd: string, ...rest: string[]): Promise<CliResult> =>
  cli(cwd, 'copy', 'get', 'acme', 'home', ...rest)

/** The draft page document, byte for byte — the thing a failed edit must not touch. */
const draftBytes = (cwd: string): string => readFileSync(homeJsonPath(cwd), 'utf8')

/** The field descriptors of a read, by name. */
const fieldNamed = (result: CliResult, name: string): Field =>
  (result.data!.fields as Field[]).find((f) => f.name === name)!

async function withOrigin(cwd: string, fn: (builder: BuilderHandle) => Promise<void>): Promise<void> {
  const builder = await startBuilder({ cwd })
  try {
    await fn(builder)
  } finally {
    await builder.close()
  }
}

describe('story-37a3921b — declaring what a closed list of images holds', () => {
  let cwd: string

  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'story-37a3921b-format-'))
    cmdNew('acme', { cwd })
    seedSite(cwd, 'acme')
  })
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  it('test_UAT_AC1111_an_image_fields_options_are_declared_as_images_without_narrowing_them', async () => {
    // AC-1111 — the answer says not merely that the choices are a closed list but
    // WHAT they are, so a client can show a picture rather than an address.

    // ── attached by kind of FIELD, not kind of region ────────────────────────
    // An image region's "which image goes here" declares it...
    const image = await readFields(cwd, A_IMAGE)
    expect(image.ok).toBe(true)
    const src = fieldNamed(image, 'src')
    expect(src).toMatchObject({ label: 'Image', type: 'enum', format: 'image', required: true })

    // ...and the alt text sitting right beside it, on the same region, does not.
    // Same region, different kind of field — which is the discrimination the rule
    // makes, and the reason it cannot be read off the region alone.
    const alt = fieldNamed(image, 'alt')
    expect(alt.type).toBe('string')
    expect(alt.format).toBeUndefined()
    expect(Object.hasOwn(alt, 'format')).toBe(false)

    // A painted panel's "which image sits behind it" is a different region of a
    // different kind, and carries the identical declaration.
    const panel = await readFields(cwd, A_BACKDROP)
    expect(panel.ok).toBe(true)
    expect((panel.data!.fields as Field[]).map((f) => f.name)).toEqual(['backgroundImageUrl'])
    const background = fieldNamed(panel, 'backgroundImageUrl')
    expect(background).toMatchObject({ type: 'enum', format: 'image', required: true })

    // A run of copy declares nothing of the kind — it holds words, not a handle.
    const copy = await readFields(cwd, A_COPY)
    expect(copy.ok).toBe(true)
    const text = fieldNamed(copy, 'text')
    expect(text.type).toBe('string')
    expect(text.format).toBeUndefined()
    expect(Object.hasOwn(text, 'format')).toBe(false)

    // ── the declaration narrows NOTHING ──────────────────────────────────────
    // The same options, on both image-bearing fields: images only, so a font file
    // and a stylesheet — real assets of this site — are still not offered.
    expect(src.enum).toEqual(SITE_IMAGES)
    expect(background.enum).toEqual(SITE_IMAGES)
    for (const field of [src, background]) {
      expect(field.enum).not.toContain('/assets/body.woff2')
      expect(field.enum).not.toContain('/assets/site.css')
      // Each handle once, though `beta` is named by BOTH the registry and the
      // directory, and in the same stable order.
      expect(new Set(field.enum).size).toBe(field.enum!.length)
      expect(field.enum).toEqual([...field.enum!].sort())
    }
    // Stable across reads: the declaration did not make the answer vary.
    expect((await readFields(cwd, A_IMAGE)).data!.fields).toEqual(image.data!.fields)
    expect((await readFields(cwd, A_BACKDROP)).data!.fields).toEqual(panel.data!.fields)

    // And a region's current handle is still among its own options even when no
    // file mirrors it — the rule that keeps a chooser from opening on the wrong
    // value — with the declaration riding along on both kinds of region.
    const offsiteImage = fieldNamed(await readFields(cwd, A_OFFSITE), 'src')
    const offsitePanel = fieldNamed(await readFields(cwd, A_OFFSITE_PANEL), 'backgroundImageUrl')
    for (const field of [offsiteImage, offsitePanel]) {
      expect(field.format).toBe('image')
      expect(field.enum).toContain(REMOTE)
      expect(field.enum).toEqual([...SITE_IMAGES, REMOTE].sort())
    }

    // ── the declaration reaches every client, not just the command line ──────
    // It travels with the field itself, so the origin's answer is byte-identical
    // to the command line's rather than merely similar.
    await withOrigin(cwd, async (builder) => {
      for (const [addr, cliRead] of [
        [A_IMAGE, image],
        [A_BACKDROP, panel],
        [A_COPY, copy],
      ] as const) {
        const body = (await (
          await fetch(new URL(`/api/copy?slug=acme&page=home&path=${addr}`, builder.url))
        ).json()) as Record<string, unknown>
        expect(body.fields, addr).toEqual(cliRead.data!.fields)
      }
    })

    // ── membership is still enforced against the list ALONE ──────────────────
    // A well-formed, SAFE handle that is not among the options is still refused
    // at the field, whole-or-nothing. This is the refusal the shared validator
    // structurally cannot make, and the declaration did not soften it.
    const before = draftBytes(cwd)
    for (const [addr, name] of [
      [A_IMAGE, 'src'],
      [A_BACKDROP, 'backgroundImageUrl'],
    ] as const) {
      const refused = await cli(cwd, ...setArgs(addr, { [name]: ABSENT }))
      expect(refused.ok, addr).toBe(false)
      expect(refused.exitCode, addr).not.toBe(0)
      expect(refused.error!.code, addr).toBe('SCHEMA_INVALID')
      expect(refused.error!.path, addr).toBe(`${addr}/${name}`)
      expect(draftBytes(cwd), addr).toBe(before)
    }

    // And a handle that IS among them is still accepted — the declaration cost
    // the caller nothing.
    const accepted = await cli(cwd, ...setArgs(A_IMAGE, { src: BETA }))
    expect(accepted.ok).toBe(true)
    expect(accepted.data!.changed).toEqual(['src'])
    const panelAccepted = await cli(cwd, ...setArgs(A_BACKDROP, { backgroundImageUrl: LOGO }))
    expect(panelAccepted.ok).toBe(true)
    expect(panelAccepted.data!.changed).toEqual(['backgroundImageUrl'])
  })
})
