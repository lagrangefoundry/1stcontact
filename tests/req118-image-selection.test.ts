/**
 * REQ-118 — **image selection** (DOC-28 §9.2, §12 T4): click an image on the
 * page, pick a different one.
 *
 * The ticket's whole claim is that this is the *second half of phase 1*, not a
 * second mechanism — so the tests are shaped to fail if it ever becomes one.
 * There is no `image set` command and no `/api/image` route to exercise here,
 * because the edit lands through T3's surface: the same `copy` command, the same
 * `/api/copy` transport, the same whole-definition validator, the same
 * write-then-re-render order. What REQ-118 adds is entirely in the *derivation* —
 * an image segment now exposes which image goes here — and that is what these
 * measure.
 *
 * Two real entry points, nothing between them stubbed: the client half runs
 * against the bytes `1c render --edit` actually wrote, parsed by a real DOM; the
 * write half runs through `1c` itself, argv in and `{ok,data}` envelope out.
 */

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { cmdNew, cmdPublish, cmdRender } from '../tools/generate/src/cli/commands'
import { run } from '../tools/generate/src/cli'
import { startBuilder, type BuilderHandle } from '../tools/generate/src/cli'
import { resolveEditTarget } from '../packages/framework/src/l1/edit-client'
import type { L1Node } from '@1stcontact/site-schema'

const REPO = path.resolve(__dirname, '..')

const HERO = '/assets/hero.png'
const BETA = '/assets/beta.png'
const LOGO = '/assets/logo.svg'
/** A handle the fold could not mirror — on no disk, but still the node's value. */
const REMOTE = 'https://cdn.example.com/offsite.jpg'
const HEADLINE = 'A painted band.'

/** Every image the site can offer, in the handle form an L1 node holds. */
const SITE_IMAGES = [BETA, HERO, LOGO]

/**
 * The files a real site's `draft/assets/` actually holds: images alongside the
 * fonts and stylesheets a capture mirrors. The non-images are the fixture's
 * point — a picker that offers a `.woff2` is offering something no `image.src`
 * can use.
 */
const ASSET_FILES: Record<string, string> = {
  'hero.png': 'bytes:hero',
  'beta.png': 'bytes:beta',
  'logo.svg': '<svg xmlns="http://www.w3.org/2000/svg"/>',
  'body.woff2': 'bytes:font',
  'site.css': 'body{}',
}

function draftPath(cwd: string, slug: string, ...rest: string[]): string {
  return path.join(cwd, 'storage', 'sites', slug, 'draft', ...rest)
}

/**
 * A page with two image segments and a copy segment.
 *
 * The second image points OFF-DISK on purpose. A folded reproduction can carry a
 * handle the mirror never got, and a picker whose options omit the node's own
 * value would render with the first option selected — so saving an alt-text
 * change would silently swap the image.
 */
function seedSite(cwd: string, slug: string): void {
  mkdirSync(draftPath(cwd, slug, 'assets'), { recursive: true })
  for (const [name, bytes] of Object.entries(ASSET_FILES)) {
    writeFileSync(draftPath(cwd, slug, 'assets', name), bytes)
  }

  // One registered entry; the rest are on disk and undeclared — which is the
  // state EVERY real site in `storage/` is in (`"assets": []` beside a full
  // directory), and the state a registry-only picker shows nothing for.
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
      // [0.0] the image under test, with axes so "nothing else changed" is measurable.
      { kind: 'image', id: 'hero-img', src: HERO, alt: 'The hero', axes: { objectFit: 'cover' } },
      { kind: 'text', text: HEADLINE }, // [0.1]
      { kind: 'image', src: REMOTE, alt: 'Offsite' }, // [0.2]
    ],
  }
  home.l1.root = root
  writeFileSync(homePath, JSON.stringify(home, null, 2))
}

interface CliResult {
  ok: boolean
  data?: Record<string, unknown>
  error?: { code: string; message: string; path?: string; hint?: string }
  exitCode: number
}

/** Drive the real `1c` entry point — argv in, envelope and exit code out. */
async function cli(cwd: string, ...argv: string[]): Promise<CliResult> {
  const prevCwd = process.cwd()
  const prevLog = console.log
  const prevErr = console.error
  const out: string[] = []
  process.chdir(cwd)
  process.exitCode = 0
  console.log = (...a: unknown[]) => void out.push(a.map(String).join(' '))
  console.error = (...a: unknown[]) => void out.push(a.map(String).join(' '))
  try {
    await run([...argv, '--json'])
  } finally {
    console.log = prevLog
    console.error = prevErr
    process.chdir(prevCwd)
  }
  const exitCode = typeof process.exitCode === 'number' ? process.exitCode : 0
  process.exitCode = 0
  return { ...(JSON.parse(out[out.length - 1]) as CliResult), exitCode }
}

const setImage = (cwd: string, addr: string, values: Record<string, unknown>) =>
  cli(cwd, 'copy', 'set', 'acme', 'home', addr, '--values', JSON.stringify(values))

async function editHtml(cwd: string, slug: string): Promise<string> {
  const { outDir } = await cmdRender(slug, { cwd, edit: true })
  return readFileSync(path.join(outDir, 'index.html'), 'utf8')
}

/** The draft page file, byte for byte — the thing a failed edit must not touch. */
function draftBytes(cwd: string, slug: string): string {
  return readFileSync(draftPath(cwd, slug, 'pages', 'home.json'), 'utf8')
}

/** Every asset file's bytes, size and mtime — the "nothing is baked" witness. */
function assetFingerprint(cwd: string, slug: string): Record<string, string> {
  const dir = draftPath(cwd, slug, 'assets')
  const out: Record<string, string> = {}
  for (const name of Object.keys(ASSET_FILES)) {
    const abs = path.join(dir, name)
    const st = statSync(abs)
    out[name] = `${readFileSync(abs, 'utf8')}|${st.size}|${st.mtimeMs}`
  }
  return out
}

interface Field {
  name: string
  label: string
  type: string
  enum?: string[]
  required?: boolean
  widget?: string
}

describe('REQ-118 — image selection', () => {
  let cwd: string
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req118-'))
    cmdNew('acme', { cwd })
    seedSite(cwd, 'acme')
  })
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  // AC1 — clicking an image segment opens a picker of the site's available
  // assets. The click resolves through the SAME bridge a copy segment uses, and
  // the picker is a closed list of the site's images: a select the user chooses
  // from, never a URL they type.
  it('test_UAT_AC1028_clicking_an_image_segment_offers_a_picker_of_the_sites_assets', async () => {
    const dom = new JSDOM(await editHtml(cwd, 'acme'))
    const img = dom.window.document.querySelector('[data-l1-segment="image"]')!
    const hit = resolveEditTarget(img)!
    expect(hit.kind).toBe('image')

    const got = await cli(cwd, 'copy', 'get', 'acme', 'home', hit.target.path.join('.'))
    expect(got.ok).toBe(true)
    const fields = got.data!.fields as Field[]

    const src = fields.find((f) => f.name === 'src')!
    expect(src).toMatchObject({ label: 'Image', type: 'enum', required: true })
    // Exactly the site's IMAGES. A `.woff2` or a stylesheet is a real asset and a
    // real thing an asset browser should show, but nothing an `image.src` can
    // point at — offering one would be offering a broken image.
    expect(src.enum).toEqual(SITE_IMAGES)
    expect(src.enum).not.toContain('/assets/body.woff2')
    expect(src.enum).not.toContain('/assets/site.css')
    // The picker offers images the page does not currently use — that is the
    // whole point of a picker — including one the registry never declared.
    expect(src.enum).toContain(BETA)
    expect(src.enum).toContain(LOGO)

    expect(got.data!.values).toEqual({ src: HERO, alt: 'The hero' })

    // A handle the mirror never got is still in its own picker, so opening this
    // segment and saving cannot silently swap the image for the first option.
    const offsite = await cli(cwd, 'copy', 'get', 'acme', 'home', '0.2')
    const offsiteSrc = (offsite.data!.fields as Field[]).find((f) => f.name === 'src')!
    expect(offsiteSrc.enum).toEqual([...SITE_IMAGES, REMOTE].sort())
    expect(offsite.data!.values).toMatchObject({ src: REMOTE })
  })

  // AC2 — choosing an asset updates the L1 image node, re-renders, and the page
  // the iframe reloads shows the new image.
  it('test_UAT_FC_REQ-118_choosing_an_asset_updates_the_node_and_the_rerendered_page', async () => {
    expect(await editHtml(cwd, 'acme')).toContain('assets/hero.png')

    const saved = await setImage(cwd, '0.0', { src: BETA })
    expect(saved.ok).toBe(true)
    expect(saved.data!.changed).toEqual(['src'])

    // The draft definition — the working copy, not a builder-side draft of its own.
    const page = JSON.parse(draftBytes(cwd, 'acme'))
    expect(page.l1.root.children[0].src).toBe(BETA)

    // And the rendered bytes, from the same command: the host only refreshes.
    const html = readFileSync(path.join(String(saved.data!.rendered), 'index.html'), 'utf8')
    expect(html).toContain('assets/beta.png')
    expect(html).not.toContain('assets/hero.png')
  })

  // AC3 — the change is applied through T3's loop and validator, with no separate
  // write path. Demonstrated by consequence: break an unrelated part of the
  // page's L1 past the envelope, and an IMAGE edit refuses for exactly the reason
  // `config set` does — which it could not do if it validated only its own field,
  // or ran a validator of its own.
  it('test_UAT_FC_REQ-118_image_edits_run_the_same_whole_definition_validator_as_the_ai_surface', async () => {
    const homePath = draftPath(cwd, 'acme', 'pages', 'home.json')
    const page = JSON.parse(readFileSync(homePath, 'utf8'))
    // 9999px clears the schema's shape check and fails the L1 envelope's range,
    // so only a caller running `validateL1` over the whole document sees it.
    page.l1.root.children[1].axes = { fontSizePx: 9999 }
    writeFileSync(homePath, JSON.stringify(page, null, 2))
    const before = draftBytes(cwd, 'acme')

    const image = await setImage(cwd, '0.0', { src: BETA })
    const config = await cli(cwd, 'config', 'set', 'acme', 'displayName', 'Acme')

    for (const result of [image, config]) {
      expect(result.ok).toBe(false)
      expect(result.error!.code).toBe('SCHEMA_INVALID')
      expect(result.error!.message).toContain('fontSizePx')
      expect(result.error!.path).toContain('/pages/0/l1')
    }
    expect(draftBytes(cwd, 'acme')).toBe(before)
  })

  // AC4 — alt text is a copy field on the same segment, and one Save is one diff:
  // the picker and the words travel together rather than as two writes.
  it('test_UAT_FC_REQ-118_alt_text_is_editable_alongside_the_image_and_saved_in_the_same_diff', async () => {
    await cmdPublish('acme', { cwd, message: 'base' })
    expect((await cli(cwd, 'status', 'acme')).data!.modified).toEqual([])

    const alt = (await cli(cwd, 'copy', 'get', 'acme', 'home', '0.0')).data!.fields as Field[]
    expect(alt.find((f) => f.name === 'alt')).toMatchObject({ label: 'Alt text', type: 'string' })

    const saved = await setImage(cwd, '0.0', { src: LOGO, alt: 'Our mark' })
    expect(saved.ok).toBe(true)
    expect(saved.data!.changed).toEqual(['src', 'alt'])

    const node = JSON.parse(draftBytes(cwd, 'acme')).l1.root.children[0]
    expect(node).toMatchObject({ src: LOGO, alt: 'Our mark' })

    // The whole Save moved exactly one file — one diff, not one per field.
    const status = await cli(cwd, 'status', 'acme')
    expect(status.data!.modified).toEqual(['pages/home.json'])
    expect(status.data!.added).toEqual([])
    expect(status.data!.removed).toEqual([])
  })

  // AC5 — an asset reference that fails validation is not applied and the draft
  // is unchanged. The site not having the file is the case the shared validator
  // CANNOT catch: `/assets/ghost.png` is a perfectly safe URL, so without the
  // membership check it would land and render a broken image with no error.
  it('test_UAT_FC_REQ-118_an_asset_the_site_does_not_have_is_refused_and_nothing_is_applied', async () => {
    const before = draftBytes(cwd, 'acme')
    const beforeHtml = await editHtml(cwd, 'acme')

    const ghost = await setImage(cwd, '0.0', { src: '/assets/ghost.png' })
    expect(ghost.ok).toBe(false)
    expect(ghost.error!.code).toBe('SCHEMA_INVALID')
    expect(ghost.error!.message).toContain('ghost.png')
    expect(ghost.error!.path).toBe('0.0/src')
    expect(ghost.error!.hint).toContain('copy get')
    expect(ghost.exitCode).toBe(2)

    // A non-image asset is refused for the same reason: it was never an option.
    const font = await setImage(cwd, '0.0', { src: '/assets/body.woff2' })
    expect(font.ok).toBe(false)

    // And so is a hostile scheme — refused at the field, before it ever reaches
    // the envelope's URL allowlist.
    const hostile = await setImage(cwd, '0.0', { src: 'javascript:alert(1)' })
    expect(hostile.ok).toBe(false)
    expect(hostile.error!.code).toBe('SCHEMA_INVALID')

    // Nothing landed, from any of them: the draft and the bytes the user is
    // looking at are byte-identical, which is what makes "surface the error and
    // keep the modal open" safe.
    expect(draftBytes(cwd, 'acme')).toBe(before)
    expect(await editHtml(cwd, 'acme')).toBe(beforeHtml)
  })

  // AC6 — nothing is baked. Choosing an asset writes one structured field and
  // touches no file: one uploaded asset, many uses, and the edit stays as
  // round-trippable and undoable as every other structured edit.
  it('test_UAT_FC_REQ-118_choosing_an_asset_bakes_nothing_and_changes_only_a_structured_field', async () => {
    // A published base gives `status` something to diff against, so "what did
    // this edit add to the draft?" has a countable answer.
    await cmdPublish('acme', { cwd, message: 'base' })
    const before = assetFingerprint(cwd, 'acme')
    const beforeNode = JSON.parse(draftBytes(cwd, 'acme')).l1.root.children[0]

    expect((await setImage(cwd, '0.0', { src: BETA })).ok).toBe(true)

    // The asset store is untouched — no new file, no rewritten byte, no restat.
    expect(assetFingerprint(cwd, 'acme')).toEqual(before)
    // Nothing was baked into the store either: the edit added no file at all.
    expect((await cli(cwd, 'status', 'acme')).data!.added).toEqual([])
    expect((await cli(cwd, 'status', 'acme')).data!.modified).toEqual(['pages/home.json'])

    // And the node differs from its former self in exactly one string. Its id and
    // its axes survive, because a framing/crop parameter would live there and
    // this surface must not disturb one (DOC-28 §13 Q5 keeps framing out for now).
    const afterNode = JSON.parse(draftBytes(cwd, 'acme')).l1.root.children[0]
    expect(afterNode).toEqual({ ...beforeNode, src: BETA })
    expect(afterNode.axes).toEqual({ objectFit: 'cover' })
  })

  // AC7 — the asset listing is callable independently of the modal, so DOC-28
  // §9.2's asset browser mode reuses it rather than growing a second idea of what
  // a site's assets are. It is the UNION of the registry and the directory: a
  // registry-only listing shows nothing on any real site in `storage/`.
  it('test_UAT_FC_REQ-118_the_asset_listing_is_callable_independently_of_the_modal', async () => {
    const listed = await cli(cwd, 'asset', 'list', 'acme')
    expect(listed.ok).toBe(true)
    const assets = listed.data!.assets as Array<Record<string, unknown>>

    // Every file, whatever its kind — the picker narrows this, the listing does not.
    expect(assets.map((a) => a.src)).toEqual([
      '/assets/beta.png',
      '/assets/body.woff2',
      '/assets/hero.png',
      '/assets/logo.svg',
      '/assets/site.css',
    ])
    expect(assets.map((a) => a.kind)).toEqual(['image', 'font', 'image', 'image', 'other'])

    // Provenance, so a browser mode can tell a declared asset from a stray file.
    const beta = assets.find((a) => a.src === BETA)!
    expect(beta).toMatchObject({ id: 'beta', alt: 'The beta image', registered: true, onDisk: true })
    const hero = assets.find((a) => a.src === HERO)!
    expect(hero).toMatchObject({ id: 'hero.png', registered: false, onDisk: true })
  })
})

/**
 * Deliberately UNGATED on `WEBUI_INSTALLED`.
 *
 * Every test below is a plain fetch against the builder origin — `/api/copy`,
 * `/api/assets`, `/preview/…` — and `startBuilder` binds a port without touching
 * a component. The only route in `handleBuilderRequest` that needs
 * `@gendevlabs/webui-*` is `GET /`, which builds the chrome document via
 * `chromeHtml()`; nothing here requests it. Gating the whole suite on the
 * components therefore withheld evidence this machine can produce for a reason
 * that does not apply to it — in particular AC-1028's transport clause ("the
 * modal obtains these choices over the same copy transport a copy edit uses"),
 * which is measured by a bare `GET /api/copy` and needs no mounted modal.
 *
 * If a test in here ever mounts a real component or fetches `/`, gate THAT test
 * with `it.skipIf(!WEBUI_INSTALLED)` — not the describe.
 */
describe('REQ-118 image selection over the builder origin', () => {
  let cwd: string
  let builder: BuilderHandle
  let pageId: string
  let addr: string

  beforeAll(async () => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req118-origin-'))
    cmdNew('acme', { cwd })
    seedSite(cwd, 'acme')
    const html = await editHtml(cwd, 'acme')
    pageId = /data-fc-page="([^"]+)"/.exec(html)![1]
    addr = /data-l1-path="([^"]+)"[^>]*data-l1-segment="image"/.exec(html)![1]
    builder = await startBuilder({
      cwd,
      clientDir: path.join(REPO, 'apps/control-app/src/builder'),
    })
  }, 180000)

  afterAll(async () => {
    await builder?.close()
    if (cwd) rmSync(cwd, { recursive: true, force: true })
  })

  const get = (p: string) => fetch(new URL(p, builder.url))

  it('test_UAT_AC1028_the_modal_reads_its_picker_from_the_same_copy_transport', async () => {
    // AC1/AC3 at the origin: the modal's descriptors for an image arrive over the
    // SAME `/api/copy` call a copy segment uses, carrying the picker's options —
    // so a picker costs no extra round trip and cannot show options that
    // disagree with what the write path will accept.
    const body = (await (await get(`/api/copy?slug=acme&page=${pageId}&path=${addr}`)).json()) as {
      kind: string
      fields: Field[]
      values: Record<string, string>
    }
    expect(body.kind).toBe('image')
    expect(body.fields.map((f) => f.name)).toEqual(['src', 'alt'])
    expect(body.fields.find((f) => f.name === 'src')!.enum).toEqual(SITE_IMAGES)
    expect(body.values.src).toBe(HERO)
  })

  it('test_UAT_FC_REQ-118_saving_an_image_choice_rerenders_both_channels', async () => {
    // AC2/AC3 — the identical POST a copy Save makes. The edit lands and BOTH
    // channels are current when it answers, so switching to View does not show
    // the old image.
    const res = await fetch(new URL('/api/copy', builder.url), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug: 'acme', page: pageId, path: addr, values: { src: BETA } }),
    })
    expect(res.status).toBe(200)
    expect((await res.json()).changed).toEqual(['src'])

    for (const channel of ['edit', 'draft']) {
      const html = await (await get(`/preview/acme/${channel}/`)).text()
      expect(html, channel).toContain('assets/beta.png')
      expect(html, channel).not.toContain('assets/hero.png')
    }
  })

  it('test_UAT_FC_REQ-118_a_rejected_choice_comes_back_as_a_field_scoped_400', async () => {
    // AC5 at the origin — the refusal is the user's mistake, not a server fault,
    // so it is a 400 naming the field. A 500 would tell the modal "the builder
    // broke" and throw away the choice the user was making.
    const res = await fetch(new URL('/api/copy', builder.url), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        slug: 'acme',
        page: pageId,
        path: addr,
        values: { src: '/assets/ghost.png' },
      }),
    })
    expect(res.status).toBe(400)
    const err = (await res.json()) as { code: string; message: string; path?: string }
    expect(err.code).toBe('SCHEMA_INVALID')
    expect(err.path).toContain('/src')
  })

  it('test_UAT_FC_REQ-118_the_asset_store_is_reachable_without_opening_a_modal', async () => {
    // AC7 at the origin — the listing is a route of its own, so the asset browser
    // mode (DOC-28 §9.2) reaches the same store the picker does without going
    // anywhere near a segment or a modal.
    const res = await get('/api/assets?slug=acme')
    expect(res.status).toBe(200)
    const { assets } = (await res.json()) as { assets: Array<Record<string, unknown>> }
    expect(assets.filter((a) => a.kind === 'image').map((a) => a.src)).toEqual(SITE_IMAGES)

    // A missing slug is the caller's mistake, and says so.
    expect((await get('/api/assets')).status).toBe(400)
  })
})
