import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { L1Node } from '@1stcontact/site-schema'
import { aiCore } from '../tools/generate/src/cli/ai/toolbox'
import {
  createL1Toolbox,
  L1_DECLARATION,
  L1_INSTANCES,
} from '../tools/generate/src/cli/ai/toolbox-core'
import {
  FIDELITY_DECLARATION,
  fidelitySurfaceFor,
  MAX_IMAGE_BYTES,
} from '../tools/generate/src/cli/ai/fidelity-core'
import type { ContentBlock } from '../tools/generate/src/cli/ai/fidelity-core'
import { nodeDeps, resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host'
import { openSession, streamPrompt } from '../tools/generate/src/cli/ai/host-core'
import type { HostDeps } from '../tools/generate/src/cli/ai/host-core'
import { cmdNew } from '../tools/generate/src/cli/commands'
import { fidelityDeps } from '../apps/control-app/src/shot'
import { PreviewRenderer } from '../tools/generate/src/cli/preview'
import { VIEWPORTS } from '../tools/generate/src/cli/capture/screenshot'
import type { PuppeteerBrowser } from '../tools/generate/src/cli/capture/cf-driver'
import { decodePng, encodePng } from '../tools/generate/src/cli/png'
import type { Raster } from '../tools/generate/src/cli/perceptual-core'
import { memorySiteStore } from '../tools/generate/src/store'
import type { SiteStore } from '../tools/generate/src/store'
import { publishSite } from '../tools/generate/src/publish/publish'
import { memoryReferenceStore } from '../tools/generate/src/store/memory-reference-store'
import { ASSETS_PREFIX, bundleNameFor } from '../tools/generate/src/store/reference-store'
import {
  writeBundle,
  writeForms,
  writeHints,
  writeL1,
  writeMultiState,
} from '../tools/generate/src/cli/capture/bundle'
import { syntheticCapture, syntheticL1, syntheticMultiState } from './support/reference-fixtures'
import { siteSeed } from './support/site-seed'
import { fakeBrowser } from './support/fake-puppeteer'
import { calls, says, scriptedClient } from './support/scripted-model-client'
import type { ModelRequest } from './support/scripted-model-client'

/**
 * **The assistant can see** (story-58b2cec4) — the read-only looking surface and
 * its one picture vocabulary.
 *
 * WHAT IS REAL. The declaration, the real Toolbox (validation, grant narrowing,
 * error mapping, the manual projection, the audit record), the real operations,
 * the real picture resolution, the real image reduction, the real
 * `PreviewRenderer` over a real in-memory `SiteStore`, the Worker's own
 * `fidelityDeps` from `shot.ts`, and — for the turn-shaped criteria — the real
 * host (`openSession` / `streamPrompt`, the generators the builder's
 * `/api/ai/session` and `/api/ai/prompt` routes frame as SSE).
 *
 * TWO DOUBLES, both genuine external boundaries:
 *   - the BROWSER — the puppeteer-shaped fake from `support/fake-puppeteer`,
 *     which drives the production driver's interception handler exactly as a
 *     browser would (so which URLs were asked for and what bytes answered them
 *     are observed, not assumed). Its one change here is that a shot is a real,
 *     decodable PNG chosen by the page's URL, because half of what is under test
 *     happens to pixels.
 *   - the MODEL — the shared scripted client (BUG-39).
 */

// ── pictures with real pixels ────────────────────────────────────────────────

function solid(width: number, height: number, grey: number): Raster {
  return { data: new Uint8Array(width * height * 3).fill(grey), width, height, channels: 3 }
}

/** One-pixel vertical stripes, alternating black and white. */
function stripes(width: number, height: number): Raster {
  const data = new Uint8Array(width * height * 3)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = x % 2 === 0 ? 0 : 255
      const i = (y * width + x) * 3
      data[i] = v
      data[i + 1] = v
      data[i + 2] = v
    }
  }
  return { data, width, height, channels: 3 }
}

/** Deterministic noise, which PNG cannot compress. */
function noise(width: number, height: number): Raster {
  const data = new Uint8Array(width * height * 3)
  let s = 0x2545f491
  for (let i = 0; i < data.length; i++) {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    data[i] = s & 0xff
  }
  return { data, width, height, channels: 3 }
}

const png = (raster: Raster): Promise<Uint8Array> => encodePng(raster)

const base64ToBytes = (b64: string): Uint8Array => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))

/** The PNG signature, base64-encoded — what any PNG payload in a string begins with. */
const PNG_BASE64_HEAD = 'iVBORw0KGgo'

// ── the browser boundary ─────────────────────────────────────────────────────

const ORIGIN = 'https://app.example.test'

/**
 * The fake browser, with real pictures: each shot is chosen by the URL the page
 * actually settled on, so a resolver that shot the wrong thing gets the wrong
 * pixels.
 */
function eyes(shotFor: (url: string) => Uint8Array) {
  const fb = fakeBrowser()
  const launch = async (): Promise<PuppeteerBrowser> => {
    const browser = await fb.launch()
    return {
      createBrowserContext: async () => {
        const context = await browser.createBrowserContext()
        return {
          newPage: async () => {
            const page = await context.newPage()
            const settled = page as unknown as { url(): string; screenshot(): Promise<Uint8Array> }
            settled.screenshot = async () => shotFor(settled.url())
            return page
          },
          close: () => context.close(),
        }
      },
      close: () => browser.close(),
    }
  }
  return { launch, log: fb.log, launches: fb.launches }
}

/** The Worker's own surface dependencies for one site, with the browser faked. */
function looking(
  store: SiteStore,
  slug: string,
  references: ReturnType<typeof memoryReferenceStore>,
  shotFor: (url: string) => Uint8Array,
) {
  const browser = eyes(shotFor)
  const deps = fidelityDeps({}, new PreviewRenderer(store), references, ORIGIN, slug, {
    launch: browser.launch,
  })
  return { deps, browser }
}

// ── stores ───────────────────────────────────────────────────────────────────

const BUNDLE = bundleNameFor({ host: 'example.test', path: '/pricing' })

/** A reference store holding one complete bundle whose screenshot is `shot`. */
async function seededReferences(shot: Uint8Array) {
  const store = memoryReferenceStore()
  const bundle = store.bundle(BUNDLE)
  await writeBundle(bundle, {
    capture: syntheticCapture(),
    screenshot: shot,
    renderedHtml: '<html><body><h1>Pricing</h1></body></html>',
    rawHtml: '<html><body>raw</body></html>',
    assetBytes: new Map([[`${ASSETS_PREFIX}hero.jpg`, new Uint8Array([9, 9, 9])]]),
  })
  await writeMultiState(bundle, syntheticMultiState())
  await writeL1(bundle, syntheticL1())
  await writeForms(bundle, [])
  await writeHints(bundle, { viewport: VIEWPORTS.mobile, mediaBreakpoints: [], nodes: [] })
  return store
}

/** A home page whose L1 holds one headline and, optionally, one image. */
function homeWith(slug: string, opts: { image?: string } = {}): Record<string, unknown> {
  const home = structuredClone(siteSeed({ slug }).pages['home.json']) as Record<string, unknown> & {
    l1: { root: L1Node }
  }
  const children: L1Node[] = [{ kind: 'text', text: 'Hello.', axes: { fontSizePx: 32 } } as L1Node]
  if (opts.image) children.push({ kind: 'image', src: opts.image, alt: 'Logo' } as L1Node)
  home.l1.root = { kind: 'container', id: 'root', layout: 'stack', children } as L1Node
  home.modules = []
  return home
}

/** An in-memory store with the given sites seeded. */
function storeWith(sites: { slug: string; assets?: Record<string, Uint8Array>; image?: string }[]) {
  const store = memorySiteStore()
  for (const site of sites) {
    const seed = siteSeed({ slug: site.slug })
    store.seed(site.slug, {
      siteJson: seed.siteJson,
      pages: { 'home.json': homeWith(site.slug, { image: site.image }) },
      assets: site.assets ?? {},
    })
  }
  return store
}

/** A Toolbox for one site with the looking surface composed, as the consultant. */
async function consultantBox(
  store: SiteStore,
  slug: string,
  deps: ReturnType<typeof looking>['deps'],
  opts: { config?: Record<string, unknown> | null; audit?: (r: { asObject(): unknown }) => void } = {},
) {
  const lib = await aiCore()
  return createL1Toolbox(
    slug,
    {},
    {
      lib,
      store,
      config: opts.config ?? null,
      audit: (opts.audit as never) ?? null,
      extraSurfaces: [{ surface: await fidelitySurfaceFor(lib, deps) }],
    },
  )
}

/**
 * The content blocks a `screenshot` produced, read off whatever the Toolbox hands
 * back — the block array itself, or that array inside the untrusted-content
 * frame. Criteria about WHAT was pictured read it this way; the criterion about
 * HOW it reaches the model (AC-2031) asserts the shape on the wire directly.
 */
function blocksOf(result: unknown): ContentBlock[] {
  if (Array.isArray(result)) return result as ContentBlock[]
  const text = String(result)
  const start = text.indexOf('[')
  const end = text.lastIndexOf(']')
  if (start < 0 || end < start) throw new Error(`not a picture: ${text.slice(0, 300)}`)
  return JSON.parse(text.slice(start, end + 1)) as ContentBlock[]
}

const textOf = (blocks: ContentBlock[]): string =>
  (blocks.find((b) => b.type === 'text') as { text: string } | undefined)?.text ?? ''

async function imageOf(blocks: ContentBlock[]): Promise<{ bytes: Uint8Array; raster: Raster }> {
  const image = blocks.find((b) => b.type === 'image') as
    | { source: { data: string; media_type: string } }
    | undefined
  if (!image) throw new Error('no image block')
  const bytes = base64ToBytes(image.source.data)
  return { bytes, raster: await decodePng(bytes, 'returned') }
}

const LOOKING_OPS = [
  'capture_site',
  'check_fidelity',
  'compare',
  'describe_reference',
  'list_references',
  'screenshot',
]

// ── the host, for the criteria that are about a turn ─────────────────────────

const workspaces: string[] = []

/** A workspace with one site whose home page has one addressable headline. */
function workspace(slug: string): string {
  const cwd = mkdtempSync(path.join(tmpdir(), 'looking-'))
  workspaces.push(cwd)
  cmdNew(slug, { cwd })
  const file = path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')
  const home = JSON.parse(readFileSync(file, 'utf8'))
  home.l1.root = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [{ kind: 'text', text: 'The old headline.', axes: { fontSizePx: 32 } }],
  }
  home.modules = []
  writeFileSync(file, JSON.stringify(home, null, 2))
  return cwd
}

function headline(cwd: string, slug: string): string {
  const file = path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')
  return JSON.parse(readFileSync(file, 'utf8')).l1.root.children[0].text
}

/**
 * Node's own host runtime for the workspace, with the live junction held in
 * memory as the Worker's is. The transcript tier is not what any criterion here
 * is about, and the in-memory junction is a production pairing (`ai.ts`).
 */
async function hostFor(
  cwd: string,
  fidelity: HostDeps['fidelity'] | 'node-default',
): Promise<HostDeps> {
  const base = await nodeDeps({ cwd })
  return {
    ...base,
    logDir: undefined,
    junctions: base.lib.memoryJunctions(),
    ...(fidelity === 'node-default' ? {} : { fidelity }),
  }
}

async function turnIn(cwd: string, slug: string, deps: HostDeps, text: string) {
  const opened = await openSession(slug, { cwd }, deps)
  expect(opened.error).toBeUndefined()
  expect(opened.ready).toBe(true)
  const events: { kind: string; content: string; meta?: Record<string, unknown> }[] = []
  for await (const event of streamPrompt(opened.sessionId, text, { cwd }, deps)) events.push(event)
  return events
}

/** The `tool_result` the model was handed on a request, if any. */
function toolResultIn(req: ModelRequest | undefined): { content: unknown } | undefined {
  return (req?.messages ?? [])
    .filter((m) => m.role === 'user')
    .flatMap((m) => (Array.isArray(m.content) ? m.content : []))
    .find((b) => (b as { type?: string }).type === 'tool_result') as { content: unknown } | undefined
}

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  while (workspaces.length > 0) rmSync(workspaces.pop()!, { recursive: true, force: true })
})

// ── composition and grant ────────────────────────────────────────────────────

describe('the consultant is offered a separate, read-only looking surface', () => {
  it('test_UAT_AC2022_the_six_looking_operations_are_offered_beside_the_site_editing_ones', async () => {
    const store = storeWith([{ slug: 'studio' }])
    const references = await seededReferences(await png(solid(8, 8, 0)))
    const { deps } = looking(store, 'studio', references, () => new Uint8Array())
    const lib = await aiCore()

    const editingOnly = Object.keys(
      (await createL1Toolbox('studio', {}, { lib, store })).schemas(),
    )
    const offered = Object.keys((await consultantBox(store, 'studio', deps)).schemas())

    // Exactly the union: every site-editing tool still offered, plus the six.
    expect(offered.sort()).toEqual([...new Set([...editingOnly, ...LOOKING_OPS])].sort())
    for (const op of LOOKING_OPS) expect(offered).toContain(op)
    expect(editingOnly.length).toBeGreaterThan(0)

    // The site-editing declaration contains none of the six…
    const l1Ops = (L1_DECLARATION.operations as { op: string; tool?: string }[]).flatMap((o) => [
      o.op,
      o.tool ?? o.op,
    ])
    for (const op of LOOKING_OPS) expect(l1Ops).not.toContain(op)
    // …and the looking surface is its own declaration, under its own name.
    expect(FIDELITY_DECLARATION.surface).toBe('fidelity')
    expect(L1_DECLARATION.surface).not.toBe(FIDELITY_DECLARATION.surface)
    expect((FIDELITY_DECLARATION.operations as { op: string }[]).map((o) => o.op).sort()).toEqual(
      LOOKING_OPS,
    )

    // Author-time validation over the instance config and both declarations.
    const report = lib.validateData([L1_DECLARATION, FIDELITY_DECLARATION], L1_INSTANCES)
    expect(report.problems).toEqual([])
    expect(report.ok).toBe(true)
  })

  it('test_UAT_AC2023_the_consultant_grant_covers_the_looking_group_and_its_manual_says_so', async () => {
    // The local grant file holds both grants, side by side.
    const grantFile = JSON.parse(
      readFileSync(path.resolve('tools/generate/src/cli/ai/instances.json'), 'utf8'),
    ) as Record<string, Record<string, { groups: string[] }>>
    expect(grantFile.consultant.fidelity).toEqual({ groups: ['SeeSite'] })
    expect(grantFile.consultant.l1.groups.length).toBeGreaterThan(0)
    // SeeSite is the surface's single group and it covers every operation.
    const groups = FIDELITY_DECLARATION.groups as { group: string; operations: string[] }[]
    expect(groups.map((g) => g.group)).toEqual(['SeeSite'])
    expect([...groups[0].operations].sort()).toEqual(LOOKING_OPS)

    const store = storeWith([{ slug: 'studio' }])
    const references = await seededReferences(await png(solid(8, 8, 0)))
    const { deps } = looking(store, 'studio', references, () => new Uint8Array())
    const manual = (await consultantBox(store, 'studio', deps)).manual() as string

    for (const op of ['screenshot', 'compare', 'check_fidelity', 'capture_site']) {
      expect(manual).toContain(op)
    }
    expect(manual).toMatch(/Looking and judging|how you \*\*see\*\*/)
    expect(manual.toLowerCase()).toContain('untrusted')
  })

  it('test_UAT_AC2024_a_deployment_without_a_browser_still_opens_an_editing_assistant', async () => {
    // A Node host with no known outside origin: the runtime it assembles has no
    // looking surface — and the consultant's grant still names one.
    const slug = 'studio'
    const cwd = workspace(slug)
    const deps = await hostFor(cwd, 'node-default')
    expect(deps.fidelity ?? null).toBeNull()
    expect((L1_INSTANCES.consultant as Record<string, unknown>).fidelity).toBeDefined()

    const client = scriptedClient([
      calls('set_l1', {
        page: 'home',
        path: '0.0',
        node: { kind: 'text', text: 'A new headline.', axes: { fontSizePx: 32 } },
      }),
      says('Changed it.'),
    ])
    setModelClient(client)

    await turnIn(cwd, slug, deps, 'Change the headline.')

    // The session constructed and an editing tool changed the site…
    expect(headline(cwd, slug)).toBe('A new headline.')
    // …and no looking operation was offered.
    const offered = client.seen[0].tools.map((t) => t.name)
    expect(offered).toContain('set_l1')
    for (const op of LOOKING_OPS) expect(offered).not.toContain(op)

    // The narrowing never widens: a grant that omits a composed surface does not
    // get that surface's operations.
    const store = storeWith([{ slug }])
    const references = await seededReferences(await png(solid(8, 8, 0)))
    const { deps: eyesDeps } = looking(store, slug, references, () => new Uint8Array())
    const consultant = L1_INSTANCES.consultant as Record<string, unknown>
    const narrowed = Object.keys(
      (await consultantBox(store, slug, eyesDeps, { config: { l1: consultant.l1 } })).schemas(),
    )
    expect(narrowed).toContain('set_l1')
    for (const op of LOOKING_OPS) expect(narrowed).not.toContain(op)
  }, 120000)
})

// ── the picture vocabulary ───────────────────────────────────────────────────

describe('every picture is named one way, and resolves to what it names', () => {
  it('test_UAT_AC2026_every_picture_parameter_offers_the_one_declared_shape', async () => {
    const store = storeWith([{ slug: 'studio' }])
    const references = await seededReferences(await png(solid(8, 8, 0)))
    const { deps, browser } = looking(store, 'studio', references, () => new Uint8Array())
    const box = await consultantBox(store, 'studio', deps)
    const schemas = box.schemas() as Record<
      string,
      { properties: Record<string, Record<string, unknown>> }
    >

    const pictureParams: [string, string][] = [
      ['screenshot', 'of'],
      ['compare', 'a'],
      ['compare', 'b'],
      ['check_fidelity', 'actual'],
    ]
    for (const [tool, param] of pictureParams) {
      const shape = schemas[tool].properties[param] as {
        type: string
        properties: Record<string, { type: string; enum?: string[] }>
        additionalProperties: boolean
        required: string[]
      }
      expect(shape.type, `${tool}.${param}`).toBe('object')
      expect(Object.keys(shape.properties).sort()).toEqual([
        'bundle',
        'kind',
        'page',
        'revision',
        'url',
        'viewport',
      ])
      expect(shape.properties.kind.enum).toEqual(['reference', 'draft', 'edit', 'revision', 'url'])
      expect(shape.properties.viewport.enum).toEqual(['mobile', 'tablet', 'desktop'])
      expect(shape.properties.revision.type).toBe('integer')
      expect(shape.required).toEqual(['kind'])
      expect(shape.additionalProperties).toBe(false)
    }

    // No operation carries its own way of naming a picture: every parameter is
    // the picture type, bar the three scalars that are not pictures at all.
    const banned = ['ref', 'source', 'size', 'port', 'refPng', 'bundleDir', 'actual_image']
    for (const op of FIDELITY_DECLARATION.operations as {
      op: string
      params?: Record<string, { type: string }>
    }[]) {
      for (const [name, spec] of Object.entries(op.params ?? {})) {
        expect(banned, `${op.op}.${name}`).not.toContain(name)
        if (!['url', 'bundle', 'reference'].includes(name)) expect(spec.type).toBe('picture')
      }
    }

    // An unknown key, and an out-of-enum kind, are refused before the operation
    // runs — no browser is leased and the operation never reports a failure of
    // its own.
    const extra = String(await box.run('screenshot', { of: { kind: 'draft', colour: 'red' } }))
    expect(extra).toContain('colour')
    expect(extra).not.toContain('screenshot failed')
    const page = String(await box.run('screenshot', { of: { kind: 'page' } }))
    expect(page).toContain("'page'")
    expect(page).toMatch(/kind/)
    expect(page).not.toContain('screenshot failed')
    const badViewport = String(
      await box.run('screenshot', { of: { kind: 'draft', viewport: 'watch' } }),
    )
    expect(badViewport).toContain("'watch'")
    expect(browser.launches()).toBe(0)
  })

  it('test_UAT_AC2027_all_five_kinds_resolve_to_what_they_name_with_the_defaults', async () => {
    const slug = 'studio'
    const store = storeWith([{ slug }])
    await publishSite(store, slug, { message: 'first' })
    const references = await seededReferences(await png(solid(40, 40, 1)))
    const shots: [string, number][] = [
      [`/preview/${slug}/draft/`, 10],
      [`/preview/${slug}/edit/`, 20],
      [`/preview/${slug}/rev-1/`, 30],
      ['other.test', 40],
    ]
    const encoded = new Map<string, Uint8Array>()
    for (const [fragment, grey] of shots) encoded.set(fragment, await png(solid(40, 40, grey)))
    const { deps, browser } = looking(store, slug, references, (url) => {
      for (const [fragment, bytes] of encoded) if (url.includes(fragment)) return bytes
      throw new Error(`unexpected shot of ${url}`)
    })
    const box = await consultantBox(store, slug, deps)

    const take = async (of: Record<string, unknown>) => {
      const blocks = blocksOf(await box.run('screenshot', { of }))
      return { label: textOf(blocks), grey: (await imageOf(blocks)).raster.data[0] }
    }

    const reference = await take({ kind: 'reference', bundle: BUNDLE, viewport: 'desktop' })
    expect(reference.grey).toBe(1)
    expect(reference.label).toContain('reference')
    expect(reference.label).toContain(BUNDLE)

    // `draft` with neither page nor viewport: `/` at desktop.
    const before = browser.log.requested.length
    const draft = await take({ kind: 'draft' })
    expect(draft.grey).toBe(10)
    expect(browser.log.requested[before]).toBe(`${ORIGIN}/preview/${slug}/draft/`)
    expect(browser.log.viewports.at(-1)).toMatchObject({
      width: VIEWPORTS.desktop.width,
    })
    expect(draft.label).toContain('draft')
    expect(draft.label).toContain('desktop')

    const edit = await take({ kind: 'edit', page: '/about', viewport: 'mobile' })
    expect(edit.grey).toBe(20)
    expect(browser.log.requested).toContain(`${ORIGIN}/preview/${slug}/edit/about`)
    expect(browser.log.viewports.at(-1)).toMatchObject({ width: VIEWPORTS.mobile.width })
    expect(edit.label).toContain('edit')
    expect(edit.label).toContain('/about')

    const revision = await take({ kind: 'revision', revision: 1 })
    expect(revision.grey).toBe(30)
    expect(browser.log.requested).toContain(`${ORIGIN}/preview/${slug}/rev-1/`)
    expect(revision.label).toContain('revision 1')

    const url = await take({ kind: 'url', url: 'https://other.test/x' })
    expect(url.grey).toBe(40)
    expect(browser.log.requested).toContain('https://other.test/x')
    expect(url.label).toContain('https://other.test/x')
  })

  it('test_UAT_AC2028_an_incomplete_picture_is_refused_by_field_and_an_unknown_one_is_not_found', async () => {
    const slug = 'studio'
    const store = storeWith([{ slug }])
    await publishSite(store, slug, { message: 'first' })
    const references = await seededReferences(await png(solid(8, 8, 0)))
    const shot = await png(solid(8, 8, 200))
    const { deps, browser } = looking(store, slug, references, () => shot)
    const box = await consultantBox(store, slug, deps)

    for (const [kind, field] of [
      ['reference', 'bundle'],
      ['revision', 'revision'],
      ['url', 'url'],
    ]) {
      const refusal = String(await box.run('screenshot', { of: { kind } }))
      expect(refusal, kind).toContain('PICTURE_INVALID')
      expect(refusal).toContain(`'${kind}'`)
      expect(refusal).toContain(`'${field}'`)
      expect(refusal).not.toContain(PNG_BASE64_HEAD)
    }
    // None of the three reached a browser.
    expect(browser.launches()).toBe(0)

    const noBundle = String(
      await box.run('screenshot', { of: { kind: 'reference', bundle: 'never-captured' } }),
    )
    expect(noBundle).toContain('NOT_FOUND')
    expect(noBundle).not.toContain(PNG_BASE64_HEAD)

    const noRevision = String(
      await box.run('screenshot', { of: { kind: 'revision', revision: 99 } }),
    )
    expect(noRevision).toContain('NOT_FOUND')
    expect(noRevision).not.toContain(PNG_BASE64_HEAD)
  })

  it('test_UAT_AC2029_a_revision_is_pictured_with_its_own_assets_not_todays', async () => {
    const slug = 'studio'
    const BYTES_A = new TextEncoder().encode('LOGO-BYTES-A')
    const BYTES_B = new TextEncoder().encode('LOGO-BYTES-B')
    const store = storeWith([{ slug, image: '/assets/logo.png', assets: { 'logo.png': BYTES_A } }])
    const published = await publishSite(store, slug, { message: 'with logo A' })
    // The draft's logo is replaced after the revision froze.
    await store.write(slug, { assets: [{ name: 'logo.png', bytes: BYTES_B }] })

    const references = await seededReferences(await png(solid(8, 8, 0)))
    const shot = await png(solid(8, 8, 128))
    const { deps, browser } = looking(store, slug, references, () => shot)
    const box = await consultantBox(store, slug, deps)

    blocksOf(await box.run('screenshot', { of: { kind: 'revision', revision: published.id } }))
    blocksOf(await box.run('screenshot', { of: { kind: 'draft' } }))

    const answered = (channel: string) =>
      browser.log.fulfilled.filter(
        (f) => f.url.includes(`/preview/${slug}/${channel}/`) && f.url.endsWith('logo.png'),
      )
    const fromRevision = answered(`rev-${published.id}`)
    const fromDraft = answered('draft')
    expect(fromRevision.length).toBeGreaterThan(0)
    expect(fromDraft.length).toBeGreaterThan(0)
    for (const f of fromRevision) {
      expect(f.status).toBe(200)
      expect(f.body).toBe('LOGO-BYTES-A')
    }
    for (const f of fromDraft) {
      expect(f.status).toBe(200)
      expect(f.body).toBe('LOGO-BYTES-B')
    }
  })

  it('test_UAT_AC2030_the_surface_is_bound_to_one_site_and_no_picture_names_a_site', async () => {
    const siteish = /^(slug|site|siteSlug|site_slug|tenant)$/i
    for (const op of FIDELITY_DECLARATION.operations as { op: string; params?: object }[]) {
      for (const name of Object.keys(op.params ?? {})) expect(name, op.op).not.toMatch(siteish)
    }
    const picture = (FIDELITY_DECLARATION.param_types as Record<string, { keys: object }>).picture
    for (const key of Object.keys(picture.keys)) expect(key).not.toMatch(siteish)

    // Two sites in one store; the surface is built for A.
    const store = storeWith([{ slug: 'alpha' }, { slug: 'bravo' }])
    const references = await seededReferences(await png(solid(8, 8, 0)))
    const shot = await png(solid(8, 8, 50))
    const { deps, browser } = looking(store, 'alpha', references, () => shot)
    const box = await consultantBox(store, 'alpha', deps)

    blocksOf(await box.run('screenshot', { of: { kind: 'draft' } }))
    // Even a model that tries to name the other site has no field to do it with.
    const smuggled = String(
      await box.run('screenshot', { of: { kind: 'draft', slug: 'bravo' } as never }),
    )
    expect(smuggled).not.toContain(PNG_BASE64_HEAD)

    expect(browser.log.requested.length).toBeGreaterThan(0)
    for (const url of browser.log.requested) {
      expect(url).toContain('/preview/alpha/')
      expect(url).not.toContain('bravo')
    }
  })
})

// ── what the model is handed ─────────────────────────────────────────────────

/**
 * One consultant turn in which the model calls `screenshot` on the draft and
 * then answers — through the real host, with the looking surface composed.
 */
async function screenshotTurn() {
  const slug = 'studio'
  const cwd = workspace(slug)
  const shot = await png(solid(60, 40, 77))
  const deps = await hostFor(cwd, null)
  const store = deps.store
  deps.fidelity = (s: string) =>
    looking(store, s, memoryReferenceStore(), () => shot).deps
  const client = scriptedClient([calls('screenshot', { of: { kind: 'draft' } }), says('I see it.')])
  setModelClient(client)
  const events = await turnIn(cwd, slug, deps, 'Look at the draft.')
  return { client, events, shot }
}

describe('a screenshot reaches the model as an image', () => {
  it('test_UAT_AC2031_the_backend_receives_the_image_block_in_the_same_turn', async () => {
    const { client } = await screenshotTurn()

    // The model's first request offered the tool; the SECOND request of the same
    // turn carries its result.
    expect(client.seen[0].tools.map((t) => t.name)).toContain('screenshot')
    expect(client.seen.length).toBeGreaterThanOrEqual(2)
    const result = toolResultIn(client.seen[1])
    expect(result).toBeDefined()

    // Content BLOCKS — not a string standing in for them.
    expect(Array.isArray(result!.content)).toBe(true)
    const blocks = result!.content as ContentBlock[]
    const text = textOf(blocks)
    expect(text).toContain('draft')
    expect(text).toContain('60×40')
    const image = blocks.find((b) => b.type === 'image') as {
      source: { type: string; media_type: string; data: string }
    }
    expect(image).toBeDefined()
    expect(image.source.type).toBe('base64')
    expect(image.source.media_type).toBe('image/png')
    expect(image.source.data.startsWith(PNG_BASE64_HEAD)).toBe(true)
    const decoded = await decodePng(base64ToBytes(image.source.data), 'sent')
    expect([decoded.width, decoded.height]).toEqual([60, 40])
  }, 120000)

  it('test_UAT_AC2032_large_pictures_are_reduced_to_1024_by_averaging_and_say_so', async () => {
    const run = async (picture: Uint8Array) => {
      const store = storeWith([{ slug: 'studio' }])
      const references = await seededReferences(picture)
      const { deps } = looking(store, 'studio', references, () => picture)
      const box = await consultantBox(store, 'studio', deps)
      return blocksOf(await box.run('screenshot', { of: { kind: 'reference', bundle: BUNDLE } }))
    }

    // Over the edge: reduced to exactly 1024 on the long side, aspect kept.
    const wide = await run(await png(solid(2048, 512, 90)))
    const reduced = await imageOf(wide)
    expect([reduced.raster.width, reduced.raster.height]).toEqual([1024, 256])
    expect(textOf(wide)).toContain('1024×256')
    expect(textOf(wide)).toContain('(reduced from 2048×512)')

    // Within the edge: the very same bytes, and no note.
    const smallPng = await png(solid(400, 300, 90))
    const small = await run(smallPng)
    const passed = await imageOf(small)
    expect(Array.from(passed.bytes)).toEqual(Array.from(smallPng))
    expect(textOf(small)).toContain('400×300')
    expect(textOf(small)).not.toContain('reduced from')

    // Averaging, not sampling: 1-pixel black/white stripes halve to mid-grey.
    const striped = await imageOf(await run(await png(stripes(2048, 4))))
    expect([striped.raster.width, striped.raster.height]).toEqual([1024, 2])
    for (let i = 0; i < striped.raster.data.length; i++) {
      expect(striped.raster.data[i]).toBeGreaterThanOrEqual(126)
      expect(striped.raster.data[i]).toBeLessThanOrEqual(129)
    }
  }, 60000)

  it('test_UAT_AC2033_a_picture_over_the_byte_ceiling_is_refused_with_what_to_do_instead', async () => {
    // 1024×1024 of noise is inside the edge (so not reduced) and incompressible,
    // so it lands just over 3 MiB.
    const heavy = await png(noise(1024, 1024))
    expect(MAX_IMAGE_BYTES).toBe(3 * 1024 * 1024)
    expect(heavy.length).toBeGreaterThan(MAX_IMAGE_BYTES)

    const store = storeWith([{ slug: 'studio' }])
    const references = await seededReferences(heavy)
    const { deps } = looking(store, 'studio', references, () => heavy)
    const box = await consultantBox(store, 'studio', deps)

    const result = await box.run('screenshot', { of: { kind: 'reference', bundle: BUNDLE } })
    const refusal = typeof result === 'string' ? result : JSON.stringify(result)
    expect(refusal).not.toContain(PNG_BASE64_HEAD)
    expect(refusal).toContain('PICTURE_INVALID')
    expect(refusal).toContain(String(heavy.length))
    expect(refusal).toContain(String(MAX_IMAGE_BYTES))
    expect(refusal).toMatch(/narrower viewport/)
    expect(refusal).toMatch(/compare/)
  }, 60000)

  it('test_UAT_AC2034_the_operator_stream_carries_the_text_but_not_the_image_bytes', async () => {
    const { client, events } = await screenshotTurn()

    const activity = events.find(
      (e) => e.kind === 'tool_activity' && (e.meta as { name?: string })?.name === 'screenshot' &&
        (e.meta as { output?: unknown })?.output !== undefined,
    )
    expect(activity).toBeDefined()
    const output = (activity!.meta as { output: unknown }).output
    expect(Array.isArray(output)).toBe(true)
    const blocks = output as ContentBlock[]
    expect(textOf(blocks)).toContain('60×40')
    const image = blocks.find((b) => b.type === 'image') as { source: { data: string } }
    expect(image.source.data).toMatch(/^<\d+ bytes of image\/png elided>$/)

    // No base64 PNG anywhere in what was streamed.
    expect(JSON.stringify(events)).not.toContain(PNG_BASE64_HEAD)

    // …while the model's own copy carried the full picture.
    const sent = toolResultIn(client.seen[1])
    expect(Array.isArray(sent?.content)).toBe(true)
    const sentImage = (sent!.content as ContentBlock[]).find((b) => b.type === 'image') as {
      source: { data: string }
    }
    expect(sentImage.source.data.startsWith(PNG_BASE64_HEAD)).toBe(true)
    // The streamed text block is the one the model got, unchanged.
    expect(textOf(blocks)).toBe(textOf(sent!.content as ContentBlock[]))
  }, 120000)
})

// ── read-only ────────────────────────────────────────────────────────────────

describe('no looking operation changes the site', () => {
  it('test_UAT_AC2035_every_operation_is_a_read_and_running_each_leaves_the_site_alone', async () => {
    for (const op of FIDELITY_DECLARATION.operations as { op: string; effect: string }[]) {
      expect(op.effect, op.op).toBe('read')
    }
    for (const group of FIDELITY_DECLARATION.groups as { group: string; effect: string }[]) {
      expect(group.effect, group.group).toBe('read')
    }

    const slug = 'studio'
    const store = storeWith([{ slug }])
    const shot = await png(solid(40, 40, 7))
    const references = await seededReferences(shot)
    const { deps } = looking(store, slug, references, () => shot)
    const audit: { operation: string; effect: string }[] = []
    const box = await consultantBox(store, slug, deps, {
      audit: (r) => audit.push(r.asObject() as never),
    })

    const counter = await store.counter(slug)
    const siteJson = await store.readSiteJson(slug)
    const pages = await store.readPages(slug)

    await box.run('list_references', {})
    await box.run('describe_reference', { bundle: BUNDLE })
    await box.run('screenshot', { of: { kind: 'reference', bundle: BUNDLE } })
    await box.run('compare', {
      a: { kind: 'reference', bundle: BUNDLE },
      b: { kind: 'draft' },
    })
    // Through its refusal path: no network, and still a call that ran.
    const refused = String(await box.run('capture_site', { url: 'http://127.0.0.1/' }))
    expect(refused).toMatch(/REFUSED/)

    expect(await store.counter(slug)).toBe(counter)
    expect(await store.readSiteJson(slug)).toEqual(siteJson)
    expect(await store.readPages(slug)).toEqual(pages)
    // Every call was journalled, and journalled as a read.
    expect(audit.map((a) => a.operation)).toEqual([
      'list_references',
      'describe_reference',
      'screenshot',
      'compare',
      'capture_site',
    ])
    for (const record of audit) expect(record.effect).toBe('read')
  })
})
