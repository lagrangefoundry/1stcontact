/**
 * STORY-d34eccd8 — "Serve a deployed snapshot", root confinement.
 *
 *   AC-927  the server addresses exactly one store tree, fixed in the server and
 *           never derived from a request
 *
 * The rest of the story's ACs (AC-902 … AC-914) are covered by
 * `reconciliation-serve-deployed-snapshot.test.ts`; this file carries the one
 * criterion BUG-31 added.
 *
 * The operator ships from two separate store trees — real sites
 * (`storage/sites/` → `sites/` in shared storage) and throwaway scratch
 * (`storage/sandbox/` → `sandbox/`). Exactly one of them is servable, and which
 * one is a property of the server rather than of a request: `SERVABLE_ROOT` is a
 * constant the request path never reads from a URL. So the guarantee under test
 * is *confinement of the addressable key space*, not rejection of malformed
 * input — the sandbox content here is entirely well-formed, really deployed,
 * really indexed, and demonstrably readable at its key by anything that
 * addresses that tree directly.
 *
 * Observed at the HTTP boundary through the Worker's real entry point, with the
 * bucket seeded by real `1c deploy` runs. R2 is faked at the binding — the one
 * boundary we do not own; the route grammar, the deploy index and the store seam
 * above it are all real.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import worker from '../apps/public-site/src/index'
import { SERVABLE_ROOT } from '../apps/public-site/src/site-store'
import { cmdNew, cmdPublish } from '../tools/generate/src/cli/commands'
import { STARTER_WIDTHS } from '../tools/generate/src/cli/scaffold'
import { draftDir, readJson, writeJson, type Root, type StoreContext } from '../tools/generate/src/store'
import {
  cmdDeploy,
  MemoryR2Client,
  manifestKey,
  type SiteManifest,
} from '../tools/generate/src/deploy'

const SLUG = 'acme'
const ORIGIN = 'https://1stcontact.io'
/** The tree the server will not address. Not a value any request can supply. */
const NON_SERVABLE_ROOT: Root = 'sandbox'

let cwd: string
let client: MemoryR2Client

function ctxFor(root: Root): StoreContext {
  return { cwd, root }
}

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'story-root-confinement-'))
  client = new MemoryR2Client()
})

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

/** Author the home page in `root`'s tree with a text leaf carrying `marker`. */
function setHomePage(root: Root, marker: string): void {
  const file = path.join(draftDir(ctxFor(root), SLUG), 'pages', 'home.json')
  const page = readJson<Record<string, unknown>>(file)
  page.l1 = {
    widths: [...STARTER_WIDTHS],
    background: '#ffffff',
    root: {
      kind: 'container',
      id: 'root',
      layout: 'stack',
      align: 'center',
      distribution: 'center',
      padding: { topPx: 96, rightPx: 24, bottomPx: 96, leftPx: 24 },
      children: [
        {
          kind: 'text',
          id: 'placeholder',
          text: marker,
          axes: {
            color: '#111111',
            fontSizePx: 48,
            fontWeight: 700,
            lineHeightPx: 56,
            textAlign: 'center',
          },
        },
      ],
    },
  }
  writeJson(file, page)
}

/** Scaffold, author and deploy a site into `root`'s tree through the real commands. */
async function deployInto(
  root: Root,
  marker: string,
): Promise<{ preview: string; publishedKeyPrefix: string }> {
  const sandbox = root === NON_SERVABLE_ROOT
  cmdNew(SLUG, { cwd, sandbox })
  setHomePage(root, marker)
  const preview = await cmdDeploy(SLUG, {
    cwd,
    sandbox,
    client,
    now: '2026-07-30T12:00:00.000Z',
  })
  expect(preview.root).toBe(root)

  await cmdPublish(SLUG, { cwd, sandbox, message: 'first' })
  const published = await cmdDeploy(SLUG, {
    cwd,
    sandbox,
    channel: 'published',
    client,
    now: '2026-07-30T12:00:00.000Z',
  })
  expect(published.root).toBe(root)

  return { preview: preview.sha, publishedKeyPrefix: published.prefix }
}

// ── the R2 binding, faked over the bytes the real deploys wrote ───────────────

/** Records every key it was asked for, so a test can prove where reads went. */
class FakeBucket {
  readonly readKeys: string[] = []

  constructor(private readonly objects: Map<string, Buffer>) {}

  async get(key: string) {
    this.readKeys.push(key)
    const buf = this.objects.get(key)
    if (buf === undefined) return null
    return {
      key,
      size: buf.byteLength,
      httpEtag: `"${key.length}-${buf.byteLength}"`,
      httpMetadata: {},
      body: new Blob([new Uint8Array(buf)]).stream(),
      text: async () => buf.toString('utf8'),
    }
  }

  async head(key: string) {
    this.readKeys.push(key)
    const buf = this.objects.get(key)
    if (buf === undefined) return null
    return { key, size: buf.byteLength, httpEtag: `"${key.length}-${buf.byteLength}"`, httpMetadata: {} }
  }
}

interface Fetched {
  res: Response
  bucket: FakeBucket
}

/** Drive the Worker's real entry point, following the trailing-slash redirect. */
async function call(pathAndQuery: string): Promise<Fetched> {
  const b = new FakeBucket(client.objects)
  let target = pathAndQuery
  let res!: Response
  for (let hop = 0; hop < 4; hop++) {
    const waits: Promise<unknown>[] = []
    const executionCtx = {
      waitUntil: (p: Promise<unknown>) => void waits.push(p),
      passThroughOnException: () => {},
      props: {},
    }
    res = await worker.fetch(
      new Request(`${ORIGIN}${target}`),
      // The fake stands in for the R2 binding only; the store above it is real.
      { SITES: b as unknown as R2Bucket },
      executionCtx as unknown as ExecutionContext,
    )
    await Promise.all(waits)
    if (res.status !== 301) break
    target = res.headers.get('location') as string
  }
  return { res, bucket: b }
}

/** Status / type / body of a response, for byte-comparing two of them. */
async function shapeOf(res: Response) {
  return { status: res.status, type: res.headers.get('content-type'), body: await res.text() }
}

// ── UAT ──────────────────────────────────────────────────────────────────────

describe('STORY — serve a deployed snapshot to a visitor', () => {
  it('test_UAT_AC927_servable_store_tree_is_fixed_in_the_server_and_never_derived_from_a_request', async () => {
    // ── a site that exists ONLY in the non-servable tree ──────────────────────
    const sandboxed = await deployInto(NON_SERVABLE_ROOT, 'SANDBOX-ONLY-CONTENT')

    // The tree the server addresses is a constant, and it is not this one.
    expect(SERVABLE_ROOT).toBe('sites')
    expect(NON_SERVABLE_ROOT).not.toBe(SERVABLE_ROOT)

    // Out-of-band: the content is entirely well-formed — really deployed, really
    // indexed, and readable at its key by anything addressing that tree directly.
    // So a 404 below is confinement, not a rejection of a malformed fixture.
    const sandboxEntryKey = `${NON_SERVABLE_ROOT}/${SLUG}/preview/${sandboxed.preview}/out/index.html`
    const sandboxPublishedKey = `${sandboxed.publishedKeyPrefix}/out/index.html`
    const sandboxManifestKey = manifestKey(NON_SERVABLE_ROOT, SLUG)
    for (const key of [sandboxEntryKey, sandboxPublishedKey, sandboxManifestKey]) {
      expect(client.objects.has(key), key).toBe(true)
    }
    expect(client.objects.get(sandboxEntryKey)?.toString('utf8')).toContain('SANDBOX-ONLY-CONTENT')
    const sandboxIndex = JSON.parse(
      client.objects.get(sandboxManifestKey)?.toString('utf8') as string,
    ) as SiteManifest
    expect(sandboxIndex.previews.map((p) => p.sha)).toContain(sandboxed.preview)
    expect(sandboxIndex.live).toBe(1)
    // A binding that addresses that tree directly really does read the bytes.
    expect(await new FakeBucket(client.objects).get(sandboxEntryKey)).not.toBeNull()
    // …and nothing at all was written into the servable tree.
    expect([...client.objects.keys()].filter((k) => k.startsWith(`${SERVABLE_ROOT}/`))).toEqual([])

    // ── every route form the addressing grammar admits answers not-found ──────
    const addresses: Record<string, string> = {
      publishedRoot: `/site/${SLUG}/`,
      publishedRootBare: `/site/${SLUG}`,
      publishedFile: `/site/${SLUG}/index.html`,
      publishedAsset: `/site/${SLUG}/theme.css`,
      previewRoot: `/site/${SLUG}/draft/${sandboxed.preview}/`,
      previewRootBare: `/site/${SLUG}/draft/${sandboxed.preview}`,
      previewFile: `/site/${SLUG}/draft/${sandboxed.preview}/index.html`,
      previewAsset: `/site/${SLUG}/draft/${sandboxed.preview}/theme.css`,
      // Paths that spell out the non-servable tree and the stored key verbatim —
      // there is no address that carries a tree, because the URL never supplies one.
      treeFirstKey: `/${sandboxEntryKey}`,
      treeFirstManifest: `/${sandboxManifestKey}`,
      treeAsSlug: `/site/${NON_SERVABLE_ROOT}/${SLUG}/preview/${sandboxed.preview}/out/index.html`,
      treeInsideSite: `/site/${SLUG}/${NON_SERVABLE_ROOT}/${SLUG}/preview/${sandboxed.preview}/out/index.html`,
      treeAfterDraft: `/site/${SLUG}/draft/${sandboxed.preview}/../../../${NON_SERVABLE_ROOT}/${SLUG}/preview/${sandboxed.preview}/out/index.html`,
    }

    const shapes: Record<string, Awaited<ReturnType<typeof shapeOf>>> = {}
    for (const [name, address] of Object.entries(addresses)) {
      const { res, bucket } = await call(address)
      expect(res.status, name).toBe(404)
      const shape = await shapeOf(res.clone())
      expect(shape.body, name).toBe('Not Found')
      expect(shape.body, name).not.toContain('SANDBOX-ONLY-CONTENT')
      // Not one read ever named the non-servable tree: unreachable by
      // construction, not by a check applied at the end.
      expect(
        bucket.readKeys.filter((k) => k.startsWith(`${NON_SERVABLE_ROOT}/`)),
        name,
      ).toEqual([])
      shapes[name] = shape
    }

    // ── the not-found is the ordinary opaque one ──────────────────────────────
    // A site living only in the non-servable tree is answered exactly as one that
    // was never deployed at all: nothing reveals that content exists elsewhere.
    const neverDeployed = await shapeOf((await call('/site/nobody-here/')).res)
    const neverDeployedPreview = await shapeOf(
      (await call(`/site/nobody-here/draft/${sandboxed.preview}/`)).res,
    )
    expect(shapes.publishedRoot).toEqual(neverDeployed)
    expect(shapes.publishedFile).toEqual(neverDeployed)
    expect(shapes.previewRoot).toEqual(neverDeployedPreview)
    expect(shapes.previewAsset).toEqual(neverDeployedPreview)

    // ── the same slug in the servable tree serves normally ────────────────────
    // Attributes the 404s above to the tree rather than to the fixture.
    const served = await deployInto(SERVABLE_ROOT, 'SERVABLE-CONTENT')
    expect(served.preview).not.toBe(sandboxed.preview)

    const publishedPage = await call(`/site/${SLUG}/`)
    expect(publishedPage.res.status).toBe(200)
    expect(await publishedPage.res.text()).toContain('SERVABLE-CONTENT')

    const previewPage = await call(`/site/${SLUG}/draft/${served.preview}/`)
    expect(previewPage.res.status).toBe(200)
    const previewHtml = await previewPage.res.text()
    expect(previewHtml).toContain('SERVABLE-CONTENT')
    expect(previewHtml).not.toContain('SANDBOX-ONLY-CONTENT')
    expect((await call(`/site/${SLUG}/theme.css`)).res.status).toBe(200)

    // And with a real, live index now sitting in the servable tree for this very
    // slug, every non-servable address is still not-found — the sandbox snapshot
    // gains no reachability from its neighbour.
    for (const [name, address] of Object.entries(addresses)) {
      if (name.startsWith('published')) continue // now legitimately served
      const { res, bucket } = await call(address)
      expect(res.status, name).toBe(404)
      expect(await res.text(), name).toBe('Not Found')
      expect(
        bucket.readKeys.filter((k) => k.startsWith(`${NON_SERVABLE_ROOT}/`)),
        name,
      ).toEqual([])
    }
  })
})
