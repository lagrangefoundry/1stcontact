/**
 * REQ-128 — **background image selection**: click a painted container, pick
 * which image sits behind it.
 *
 * This is REQ-118's question ("which image goes here") asked of the
 * `backgroundImageUrl` axis, and the tests are shaped to fail if it ever becomes
 * a second mechanism. There is no `background set` command and no `/api/background`
 * route to exercise, because the edit lands through T3's surface: the same `copy`
 * command, the same `/api/copy` transport, the same whole-definition validator,
 * the same write-then-re-render order. What REQ-128 adds is entirely in the
 * *derivation* — a container segment now exposes which image sits behind it —
 * and that is what these measure.
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

/** Every image the site can offer, in the handle form an L1 node holds. */
const SITE_IMAGES = [BETA, HERO, LOGO]

/** The band under test: a container whose paint includes a background image. */
const A_BACKDROP = '0.0'
/** A container painted with a fill and NOTHING else — AC-7's contrast. */
const A_FILL_ONLY = '0.1'
/** A container whose background handle is off-disk — AC-4's contrast. */
const A_OFFSITE = '0.2'

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
 * A page of painted bands: one with a background image, one with only a fill,
 * one pointing off-disk.
 *
 * `[0.0]` carries a full stack of other surface axes on purpose. AC-6's claim is
 * that a background swap disturbs nothing else on the node — including whatever
 * framing parameters eventually land there (DOC-28 §13 Q5) — and a node with one
 * axis could not tell the difference between "preserved" and "there was nothing
 * to lose".
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
      {
        kind: 'container',
        id: 'backdrop',
        layout: 'stack',
        axes: {
          backgroundImageUrl: HERO,
          surfaceFill: '#101822',
          borderRadiusPx: 12,
          opacity: 0.9,
          overlay: { color: '#000000', opacity: 0.35 },
        },
        children: [{ kind: 'text', text: 'Over the backdrop.' }],
      },
      // Paint, but no background image: a container segment with nothing to edit.
      { kind: 'box', id: 'fill-only', axes: { surfaceFill: '#f4f0e8' } },
      // A handle the mirror never got — still the node's own value.
      { kind: 'box', id: 'offsite', axes: { backgroundImageUrl: REMOTE } },
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

const setBackground = (cwd: string, addr: string, values: Record<string, unknown>) =>
  cli(cwd, 'copy', 'set', 'acme', 'home', addr, '--values', JSON.stringify(values))

async function editHtml(cwd: string, slug: string): Promise<string> {
  const { outDir } = await cmdRender(slug, { cwd, edit: true })
  return readFileSync(path.join(outDir, 'index.html'), 'utf8')
}

/** The draft page file, byte for byte — the thing a failed edit must not touch. */
function draftBytes(cwd: string, slug: string): string {
  return readFileSync(draftPath(cwd, slug, 'pages', 'home.json')!, 'utf8')
}

/** The node at a dotted address, out of the draft on disk. */
function draftNode(cwd: string, addr: string): Record<string, unknown> {
  const indices = addr.split('.').map(Number)
  let node = JSON.parse(draftBytes(cwd, 'acme')).l1.root as Record<string, unknown>
  for (const i of indices.slice(1)) node = (node.children as Record<string, unknown>[])[i]
  return node
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

const fieldsOf = (r: CliResult) => r.data!.fields as Field[]

describe('REQ-128 — background image selection', () => {
  let cwd: string
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req128-'))
    cmdNew('acme', { cwd })
    seedSite(cwd, 'acme')
  })
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  // AC-1 — clicking a container segment whose node carries a background image
  // opens a picker of the site's images, exactly as an image segment does. The
  // click resolves through the SAME bridge, and the choices are the SAME closed
  // list: a select, never a URL the user types.
  it('test_UAT_FC_REQ-128_clicking_a_painted_container_offers_a_picker_of_the_sites_images', async () => {
    const dom = new JSDOM(await editHtml(cwd, 'acme'))
    // The band is a `container` segment, not an `image` one — the axis is
    // offered on the region the user clicks to mean "this panel".
    const band = dom.window.document.querySelector(`[data-l1-path="${A_BACKDROP}"]`)!
    expect(band.getAttribute('data-l1-segment')).toBe('container')
    const hit = resolveEditTarget(band)!
    expect(hit.kind).toBe('container')

    const got = await cli(cwd, 'copy', 'get', 'acme', 'home', hit.target.path.join('.'))
    expect(got.ok).toBe(true)
    expect(got.data!.kind).toBe('container')

    const bg = fieldsOf(got).find((f) => f.name === 'backgroundImageUrl')!
    expect(bg).toMatchObject({ label: 'Background image', type: 'enum', required: true })
    // Exactly the site's IMAGES — the same listing REQ-118's picker draws from,
    // so the two cannot disagree about what the site has. A `.woff2` or a
    // stylesheet is a real asset and nothing a background can point at.
    expect(bg.enum).toEqual(SITE_IMAGES)
    expect(bg.enum).not.toContain('/assets/body.woff2')
    expect(bg.enum).not.toContain('/assets/site.css')
    // Including images the page does not currently use — that is the point of a
    // picker — and one the registry never declared.
    expect(bg.enum).toContain(BETA)
    expect(bg.enum).toContain(LOGO)

    expect(got.data!.values).toEqual({ backgroundImageUrl: HERO })

    // Selection only: no empty option, so the one paint holding this box in the
    // editor cannot be removed and strand it.
    expect(bg.required).toBe(true)
    expect(bg.enum).not.toContain('')

    // And the container's OTHER paint stays off the surface. This is the phase
    // boundary, not an omission: colour waits on the site palette (REQ-114).
    expect(fieldsOf(got).map((f) => f.name)).toEqual(['backgroundImageUrl'])
  })

  // AC-2 — choosing an asset updates the axis, re-renders, and the page the
  // iframe reloads paints the new background.
  it('test_UAT_FC_REQ-128_choosing_an_asset_updates_the_axis_and_the_rerendered_background', async () => {
    const before = await editHtml(cwd, 'acme')
    expect(before).toContain('assets/hero.png')

    const saved = await setBackground(cwd, A_BACKDROP, { backgroundImageUrl: BETA })
    expect(saved.ok).toBe(true)
    expect(saved.data!.changed).toEqual(['backgroundImageUrl'])

    // The draft definition — the axis itself, not some parallel field.
    expect(draftNode(cwd, A_BACKDROP).axes).toMatchObject({ backgroundImageUrl: BETA })

    // And the rendered bytes, from the same command: the host only refreshes.
    // It is the `background-image` declaration that moved, which is what makes
    // this a background change rather than merely a JSON one.
    const html = readFileSync(path.join(String(saved.data!.rendered), 'index.html'), 'utf8')
    expect(html).toMatch(/background-image:[^;}]*assets\/beta\.png/)
    expect(html).not.toContain('assets/hero.png')
  })

  // AC-3 — the change travels T3's loop and validator, with no second write
  // path. Demonstrated by consequence: break an unrelated part of the page's L1
  // past the envelope, and a BACKGROUND edit refuses for exactly the reason
  // `config set` does — which it could not do if it validated only its own field.
  it('test_UAT_FC_REQ-128_background_edits_run_the_same_whole_definition_validator_as_the_ai_surface', async () => {
    const homePath = draftPath(cwd, 'acme', 'pages', 'home.json')
    const page = JSON.parse(readFileSync(homePath, 'utf8'))
    // 9999px clears the schema's shape check and fails the L1 envelope's range,
    // so only a caller running `validateL1` over the whole document sees it.
    page.l1.root.children[0].children[0].axes = { fontSizePx: 9999 }
    writeFileSync(homePath, JSON.stringify(page, null, 2))
    const before = draftBytes(cwd, 'acme')

    const background = await setBackground(cwd, A_BACKDROP, { backgroundImageUrl: BETA })
    const config = await cli(cwd, 'config', 'set', 'acme', 'displayName', 'Acme')

    for (const result of [background, config]) {
      expect(result.ok).toBe(false)
      expect(result.error!.code).toBe('SCHEMA_INVALID')
      expect(result.error!.message).toContain('fontSizePx')
      expect(result.error!.path).toContain('/pages/0/l1')
    }
    expect(draftBytes(cwd, 'acme')).toBe(before)
  })

  // AC-4 — the node's current handle is always among the options. A folded
  // reproduction can hold a handle the mirror never got, and a select whose
  // options omit its own value renders with the FIRST option selected — so
  // opening this band and saving would silently swap its backdrop.
  it('test_UAT_FC_REQ-128_an_offdisk_handle_is_still_among_its_own_options', async () => {
    const got = await cli(cwd, 'copy', 'get', 'acme', 'home', A_OFFSITE)
    expect(got.ok).toBe(true)
    const bg = fieldsOf(got).find((f) => f.name === 'backgroundImageUrl')!
    expect(bg.enum).toEqual([...SITE_IMAGES, REMOTE].sort())
    expect(bg.enum).toContain(REMOTE)
    expect(got.data!.values).toEqual({ backgroundImageUrl: REMOTE })

    // The consequence that makes it matter: re-saving the value the picker shows
    // as selected is a no-op, not a swap to the alphabetically-first asset.
    const saved = await setBackground(cwd, A_OFFSITE, { backgroundImageUrl: REMOTE })
    expect(saved.ok).toBe(true)
    expect(saved.data!.changed).toEqual([])
    expect(draftNode(cwd, A_OFFSITE).axes).toEqual({ backgroundImageUrl: REMOTE })
  })

  // AC-5 — a handle outside the offered options is refused at the FIELD, whole
  // or nothing. The site not having the file is the case the shared validator
  // cannot catch: `/assets/ghost.png` is a perfectly safe URL, so without the
  // membership check it would land and paint nothing, with no error.
  it('test_UAT_FC_REQ-128_a_handle_the_site_does_not_have_is_refused_and_nothing_is_applied', async () => {
    const before = draftBytes(cwd, 'acme')
    const beforeHtml = await editHtml(cwd, 'acme')

    const ghost = await setBackground(cwd, A_BACKDROP, { backgroundImageUrl: '/assets/ghost.png' })
    expect(ghost.ok).toBe(false)
    expect(ghost.error!.code).toBe('SCHEMA_INVALID')
    expect(ghost.error!.message).toContain('ghost.png')
    expect(ghost.error!.path).toBe(`${A_BACKDROP}/backgroundImageUrl`)
    expect(ghost.error!.hint).toContain('copy get')
    expect(ghost.exitCode).toBe(2)

    // A non-image asset is refused for the same reason: it was never an option.
    expect((await setBackground(cwd, A_BACKDROP, { backgroundImageUrl: '/assets/body.woff2' })).ok)
      .toBe(false)

    // A hostile scheme is refused at the field, before the envelope's URL
    // allowlist ever sees it.
    const hostile = await setBackground(cwd, A_BACKDROP, {
      backgroundImageUrl: 'javascript:alert(1)',
    })
    expect(hostile.ok).toBe(false)
    expect(hostile.error!.code).toBe('SCHEMA_INVALID')

    // And the empty string — the "remove it" a client might post from a widget
    // that grew an empty option — is refused too, so the box cannot be stranded.
    const cleared = await setBackground(cwd, A_BACKDROP, { backgroundImageUrl: '' })
    expect(cleared.ok).toBe(false)
    expect(cleared.error!.code).toBe('SCHEMA_INVALID')

    // Nothing landed, from any of them: the draft and the bytes the user is
    // looking at are byte-identical, which is what makes "surface the error and
    // keep the modal open" safe.
    expect(draftBytes(cwd, 'acme')).toBe(before)
    expect(await editHtml(cwd, 'acme')).toBe(beforeHtml)
  })

  // AC-6 — choosing a background bakes nothing. One structured field moves;
  // every other axis on the node and every byte in `draft/assets/` survives.
  it('test_UAT_FC_REQ-128_choosing_a_background_bakes_nothing_and_moves_one_structured_field', async () => {
    // A published base gives `status` something to diff against, so "what did
    // this edit add to the draft?" has a countable answer.
    await cmdPublish('acme', { cwd, message: 'base' })
    const beforeAssets = assetFingerprint(cwd, 'acme')
    const beforeNode = draftNode(cwd, A_BACKDROP)

    expect((await setBackground(cwd, A_BACKDROP, { backgroundImageUrl: LOGO })).ok).toBe(true)

    // The asset store is untouched — no new file, no rewritten byte, no restat.
    expect(assetFingerprint(cwd, 'acme')).toEqual(beforeAssets)
    const status = await cli(cwd, 'status', 'acme')
    expect(status.data!.added).toEqual([])
    expect(status.data!.modified).toEqual(['pages/home.json'])
    expect(status.data!.removed).toEqual([])

    // The node differs from its former self in exactly one string. Its id, its
    // children and every other surface axis survive — including the overlay,
    // which is precisely the neighbourhood a framing parameter will land in
    // (DOC-28 §13 Q5 keeps framing itself out for now).
    const afterNode = draftNode(cwd, A_BACKDROP)
    expect(afterNode).toEqual({
      ...beforeNode,
      axes: { ...(beforeNode.axes as object), backgroundImageUrl: LOGO },
    })
    expect(afterNode.axes).toEqual({
      backgroundImageUrl: LOGO,
      surfaceFill: '#101822',
      borderRadiusPx: 12,
      opacity: 0.9,
      overlay: { color: '#000000', opacity: 0.35 },
    })
  })

  // AC-7 — a container carrying paint but NO background image still reports
  // nothing to edit. Adding a background where there is none is out of scope:
  // an unpainted box is not a segment at all, so the picker can only ever
  // *change* a background, never add one.
  it('test_UAT_FC_REQ-128_a_painted_container_without_a_background_still_exposes_nothing', async () => {
    const dom = new JSDOM(await editHtml(cwd, 'acme'))
    // It IS a segment — it paints — so it is outlined and clickable.
    const fill = dom.window.document.querySelector(`[data-l1-path="${A_FILL_ONLY}"]`)!
    expect(fill.getAttribute('data-l1-segment')).toBe('container')

    const got = await cli(cwd, 'copy', 'get', 'acme', 'home', A_FILL_ONLY)
    expect(got.ok).toBe(true)
    expect(got.exitCode).toBe(0)
    expect(got.data!.fields).toEqual([])
    expect(got.data!.values).toEqual({})

    // And a write against it is refused rather than silently creating the axis —
    // which is what would turn "change" into "add" by the back door.
    const added = await setBackground(cwd, A_FILL_ONLY, { backgroundImageUrl: HERO })
    expect(added.ok).toBe(false)
    expect(added.error!.code).toBe('SCHEMA_INVALID')
    expect(draftNode(cwd, A_FILL_ONLY).axes).toEqual({ surfaceFill: '#f4f0e8' })
  })
})

/**
 * Deliberately UNGATED on `WEBUI_INSTALLED`, for REQ-118's reason: every test
 * below is a plain fetch against the builder origin, and `startBuilder` binds a
 * port without touching a component. The only route needing `webui-*` is `GET /`,
 * which nothing here requests.
 */
describe('REQ-128 background image selection over the builder origin', () => {
  let cwd: string
  let builder: BuilderHandle
  let pageId: string

  beforeAll(async () => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req128-origin-'))
    cmdNew('acme', { cwd })
    seedSite(cwd, 'acme')
    const html = await editHtml(cwd, 'acme')
    pageId = /data-fc-page="([^"]+)"/.exec(html)![1]
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

  it('test_UAT_FC_REQ-128_the_modal_reads_its_background_picker_from_the_same_copy_transport', async () => {
    // AC-1/AC-3 at the origin: the descriptors for a painted band arrive over the
    // SAME `/api/copy` call a copy segment uses, carrying the picker's options —
    // so the picker costs no extra round trip and cannot show options that
    // disagree with what the write path will accept.
    const body = (await (
      await get(`/api/copy?slug=acme&page=${pageId}&path=${A_BACKDROP}`)
    ).json()) as { kind: string; fields: Field[]; values: Record<string, string> }
    expect(body.kind).toBe('container')
    expect(body.fields.map((f) => f.name)).toEqual(['backgroundImageUrl'])
    expect(body.fields[0].enum).toEqual(SITE_IMAGES)
    expect(body.values.backgroundImageUrl).toBe(HERO)
  })

  it('test_UAT_FC_REQ-128_saving_a_background_choice_rerenders_both_channels', async () => {
    // AC-2/AC-3 — the identical POST a copy Save makes. The edit lands and BOTH
    // channels are current when it answers, so switching to View does not show
    // the old backdrop.
    const res = await fetch(new URL('/api/copy', builder.url), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        slug: 'acme',
        page: pageId,
        path: A_BACKDROP,
        values: { backgroundImageUrl: BETA },
      }),
    })
    expect(res.status).toBe(200)
    expect((await res.json()).changed).toEqual(['backgroundImageUrl'])

    for (const channel of ['edit', 'draft']) {
      const html = await (await get(`/preview/acme/${channel}/`)).text()
      expect(html, channel).toMatch(/background-image:[^;}]*assets\/beta\.png/)
      expect(html, channel).not.toContain('assets/hero.png')
    }
  })

  it('test_UAT_FC_REQ-128_a_rejected_background_comes_back_as_a_field_scoped_400', async () => {
    // AC-5 at the origin — the refusal is the user's mistake, not a server
    // fault, so it is a 400 naming the field. A 500 would tell the modal "the
    // builder broke" and throw away the choice the user was making.
    const res = await fetch(new URL('/api/copy', builder.url), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        slug: 'acme',
        page: pageId,
        path: A_BACKDROP,
        values: { backgroundImageUrl: '/assets/ghost.png' },
      }),
    })
    expect(res.status).toBe(400)
    const err = (await res.json()) as { code: string; message: string; path?: string }
    expect(err.code).toBe('SCHEMA_INVALID')
    expect(err.path).toContain('/backgroundImageUrl')
  })
})
