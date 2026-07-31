/**
 * BUG-31 — `1c deploy --sandbox` wrote to a real site's R2 keyspace.
 *
 * `--sandbox` is honoured everywhere locally: `ctxOf` resolves the store root and
 * every path — draft, revisions, history, rendered output — is namespaced by it
 * (DOC-12 §3.1). It then stopped mattering at the bucket, where every key was
 * built as `sites/<slug>/…` with no root component. Two sites sharing a slug
 * therefore shared a manifest, shared revision prefixes, and shared what
 * `--prune` enumerated: a sandbox deploy could overwrite a real site's published
 * bytes and move its live pointer, and any sandbox draft became world-readable.
 *
 * These UATs pin the restored invariant through the real command and the
 * Worker's real entry point: **sandbox content is never publicly servable, and
 * sandbox keys never collide with real ones.** R2 is faked at the upload
 * boundary and at the Worker's binding — the two boundaries we do not own; every
 * layer between them is real.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import worker from '../apps/public-site/src/index'
import { cmdNew, cmdPublish } from '../tools/generate/src/cli/commands'
import { draftDir, readJson, writeJson, type Root } from '../tools/generate/src/store'
import {
  cmdDeploy,
  formatDeployReport,
  MemoryR2Client,
  manifestKey,
  type SiteManifest,
} from '../tools/generate/src/deploy'

/** The collision that makes the bug reachable: one slug, both roots. */
const SLUG = 'acme'
const ORIGIN = 'https://1stcontact.io'

let cwd: string
let client: MemoryR2Client

const ctxFor = (root: Root) => ({
  get cwd() {
    return cwd
  },
  root,
})

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'bug31-'))
  client = new MemoryR2Client()
  cmdNew(SLUG, { cwd })
  cmdNew(SLUG, { cwd, sandbox: true })
})

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

/** Set a root's home-page text — the marker that identifies whose bytes served. */
function setPageText(root: Root, marker: string): void {
  const file = path.join(draftDir(ctxFor(root), SLUG), 'pages', 'home.json')
  const page = readJson<Record<string, unknown>>(file)
  const l1 = page.l1 as { root: { children: Array<{ text: string }> } }
  l1.root.children[0].text = marker
  writeJson(file, page)
}

function deploy(opts: Parameters<typeof cmdDeploy>[1] = {}) {
  return cmdDeploy(SLUG, { cwd, client, now: '2026-07-30T12:00:00.000Z', ...opts })
}

async function manifestUnder(root: Root): Promise<SiteManifest | null> {
  const raw = await client.get(manifestKey(root, SLUG))
  return raw === null ? null : (JSON.parse(raw) as SiteManifest)
}

// ── the Worker's R2 binding, faked over the bytes real deploys wrote ──────────

class FakeBucket {
  constructor(private readonly objects: Map<string, Buffer>) {}

  async get(key: string) {
    const buf = this.objects.get(key)
    if (buf === undefined) return null
    return {
      key,
      size: buf.byteLength,
      httpEtag: `"${key.length}-${buf.byteLength}"`,
      body: new Blob([new Uint8Array(buf)]).stream(),
      text: async () => buf.toString('utf8'),
    }
  }

  async head(key: string) {
    const buf = this.objects.get(key)
    if (buf === undefined) return null
    return { key, size: buf.byteLength, httpEtag: `"${key.length}-${buf.byteLength}"` }
  }
}

/** Drive the Worker's real entry point for one request against the real bucket bytes. */
async function get(pathAndQuery: string): Promise<Response> {
  const waits: Promise<unknown>[] = []
  const executionCtx = {
    waitUntil: (p: Promise<unknown>) => void waits.push(p),
    passThroughOnException: () => {},
    props: {},
  }
  const res = await worker.fetch(
    new Request(`${ORIGIN}${pathAndQuery}`),
    { SITES: new FakeBucket(client.objects) as unknown as R2Bucket },
    executionCtx as unknown as ExecutionContext,
  )
  await Promise.all(waits)
  return res
}

describe('BUG-31 — sandbox deploys are namespaced away from real sites', () => {
  it('test_UAT_FC_BUG-31_sandbox_keys_are_namespaced', async () => {
    const result = await deploy({ sandbox: true })

    // Every key the sandbox deploy wrote is under `sandbox/`, and the real
    // site's root is untouched — the bucket has nothing under `sites/` at all.
    expect(result.root).toBe('sandbox')
    expect(result.prefix).toBe(`sandbox/${SLUG}/preview/${result.sha}`)
    expect(await client.list(`sites/`)).toEqual([])
    expect(result.uploadedKeys.length).toBeGreaterThan(0)
    for (const key of result.uploadedKeys) expect(key.startsWith('sandbox/')).toBe(true)

    // The bytes really landed, so this is namespacing rather than a no-op.
    const html = await client.get(`sandbox/${SLUG}/preview/${result.sha}/out/index.html`)
    expect(html).toContain('<title>')

    // A sandbox snapshot has no public address, and the report says so instead
    // of printing a URL that resolves to nothing.
    expect(result.url).toBeNull()
    expect(formatDeployReport(result)).toContain('sandbox — not publicly reachable')
  })

  it('test_UAT_FC_BUG-31_sandbox_cannot_overwrite_real_published', async () => {
    // The real site publishes and deploys its revision — this is what must survive.
    setPageText('sites', 'REAL-SITE-CONTENT')
    cmdPublish(SLUG, { cwd, message: 'real' })
    const real = await deploy({ channel: 'published' })
    const realBytes = await client.get(`sites/${SLUG}/rev/0001/out/index.html`)
    expect(realBytes).toContain('REAL-SITE-CONTENT')
    expect(await get(`/site/${SLUG}/`).then((r) => r.text())).toContain('REAL-SITE-CONTENT')

    // The sandbox site mints revision 1 too, and deploys it as published: the
    // exact collision — same slug, same revision number, same channel.
    setPageText('sandbox', 'SANDBOX-SCRATCH')
    cmdPublish(SLUG, { cwd, sandbox: true, message: 'scratch' })
    const scratch = await deploy({ sandbox: true, channel: 'published' })
    expect(scratch.sha).not.toBe(real.sha)

    // The real site is entirely unchanged: its live pointer, its revision bytes,
    // and what the Worker serves at its published URL.
    const realManifest = await manifestUnder('sites')
    expect(realManifest?.live).toBe(1)
    expect(realManifest?.revisions).toEqual([
      { id: 1, publishedAt: expect.any(String), message: 'real', sha: real.sha },
    ])
    expect(await client.get(`sites/${SLUG}/rev/0001/out/index.html`)).toBe(realBytes)

    const served = await get(`/site/${SLUG}/`)
    expect(served.status).toBe(200)
    const body = await served.text()
    expect(body).toContain('REAL-SITE-CONTENT')
    expect(body).not.toContain('SANDBOX-SCRATCH')
  })

  it('test_UAT_FC_BUG-31_sandbox_manifest_is_separate', async () => {
    const real = await deploy()
    const before = await client.get(manifestKey('sites', SLUG))

    // Deploying the sandbox site must neither read nor write the real manifest;
    // a read that fed the write would append the sandbox preview to it.
    const scratch = await deploy({ sandbox: true })
    expect(await client.get(manifestKey('sites', SLUG))).toBe(before)

    const realManifest = await manifestUnder('sites')
    expect(realManifest?.previews.map((p) => p.sha)).toEqual([real.sha])

    const sandboxManifest = await manifestUnder('sandbox')
    expect(sandboxManifest?.previews.map((p) => p.sha)).toEqual([scratch.sha])
  })

  it('test_UAT_FC_BUG-31_worker_never_serves_sandbox', async () => {
    // A slug that exists ONLY in sandbox: deployed, in the bucket, addressable
    // by key — and unreachable through every route the grammar admits.
    const scratch = await deploy({ sandbox: true })
    expect(await client.get(`sandbox/${SLUG}/preview/${scratch.sha}/out/index.html`)).toContain(
      '<title>',
    )

    for (const url of [
      `/site/${SLUG}/`,
      `/site/${SLUG}/draft/${scratch.sha}/`,
      `/site/${SLUG}/index.html`,
      // The root is never taken from the request, so naming it cannot reach it.
      `/site/sandbox/${SLUG}/preview/${scratch.sha}/out/index.html`,
    ]) {
      expect((await get(url)).status, url).toBe(404)
    }
  })

  it('test_UAT_FC_BUG-31_prune_scoped_to_root', async () => {
    // An orphan in each root: the shape `--prune` exists to collect (a snapshot
    // whose upload or manifest write was interrupted).
    await deploy()
    await deploy({ sandbox: true })
    await client.record([`sites/${SLUG}/preview/deadbeefcafe/out/index.html`])
    await client.record([`sandbox/${SLUG}/preview/feedfacebeef/out/index.html`])

    const pruned = await deploy({ sandbox: true, prune: true })

    // Only the sandbox orphan goes; the real root is neither listed nor touched.
    expect(pruned.prunedKeys).toEqual([`sandbox/${SLUG}/preview/feedfacebeef/out/index.html`])
    expect(await client.list(`sites/`)).toContain(
      `sites/${SLUG}/preview/deadbeefcafe/out/index.html`,
    )
  })
})
