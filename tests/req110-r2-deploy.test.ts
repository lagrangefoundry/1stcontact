/**
 * REQ-110 — the R2 artifact store and `1c deploy`.
 *
 * Sites existed only on the laptop: `1c render` wrote to `storage/dist/…` and
 * `1c publish` froze `draft/` into `revisions/NNNN/`, but nothing put either
 * where anyone else could see it. `1c deploy` ships the DOC-12 artifact — the
 * rendered `out/` plus the `source/` it was rendered from, so what lands in R2
 * is a *complete* revision rather than only its render.
 *
 * These UATs pin the ticket's acceptance through the real command: a draft
 * deploy writes both halves under a content-addressed preview prefix and indexes
 * it in the manifest; the id is a pure function of the bytes, so redeploying is
 * a no-op and changed content lands beside — never on top of — what came before;
 * rendering happens on every run so a stale `dist/` can never be shipped;
 * `--channel published` refuses a site with no revision, by name; the report
 * labels every stage and terminates in the shareable URL; `--dry-run` writes
 * nothing; and `--prune` collects the orphans an interrupted deploy leaves,
 * touching nothing the manifest references.
 *
 * R2 is faked at the upload boundary (`MemoryR2Client`) — the suite never
 * touches the network.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, cmdPublish } from '../tools/generate/src/cli/commands'
import { distDir, draftDir, readJson, writeJson } from '../tools/generate/src/store'
import {
  cmdDeploy,
  formatDeployReport,
  MemoryR2Client,
  manifestKey,
  type SiteManifest,
} from '../tools/generate/src/deploy'

const SLUG = 'acme'

let cwd: string
let client: MemoryR2Client

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'req110-'))
  client = new MemoryR2Client()
  cmdNew(SLUG, { cwd })
})
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

const ctx = { get cwd() { return cwd }, root: 'sites' as const }

/** Deploy through the real command with R2 faked at the upload boundary. */
function deploy(opts: Parameters<typeof cmdDeploy>[1] = {}) {
  return cmdDeploy(SLUG, { cwd, client, now: '2026-07-30T12:00:00.000Z', ...opts })
}

/** Set the home page's single L1 text leaf — the marker rendered into the HTML. */
function setPageText(marker: string): void {
  const file = path.join(draftDir(ctx, SLUG), 'pages', 'home.json')
  const page = readJson<Record<string, unknown>>(file)
  const l1 = page.l1 as { root: { children: Array<{ text: string }> } }
  l1.root.children[0].text = marker
  writeJson(file, page)
}

async function manifest(): Promise<SiteManifest> {
  const raw = await client.get(manifestKey(SLUG))
  if (raw === null) throw new Error('no manifest in R2')
  return JSON.parse(raw) as SiteManifest
}

describe('REQ-110 — R2 artifact store + 1c deploy', () => {
  it('test_UAT_FC_REQ-110_deploy_draft_uploads_snapshot', async () => {
    const result = await deploy()

    // Both halves of the DOC-12 artifact land under the preview prefix.
    const keys = await client.list(`sites/${SLUG}/`)
    const out = keys.filter((k) => k.startsWith(`sites/${SLUG}/preview/${result.sha}/out/`))
    const source = keys.filter((k) => k.startsWith(`sites/${SLUG}/preview/${result.sha}/source/`))
    expect(out).toContain(`sites/${SLUG}/preview/${result.sha}/out/index.html`)
    expect(out).toContain(`sites/${SLUG}/preview/${result.sha}/out/theme.css`)
    expect(source).toContain(`sites/${SLUG}/preview/${result.sha}/source/site.json`)
    expect(source).toContain(`sites/${SLUG}/preview/${result.sha}/source/pages/home.json`)

    // The rendered bytes are really there, not just the key.
    const html = await client.get(`sites/${SLUG}/preview/${result.sha}/out/index.html`)
    expect(html).toContain('<title>')

    // …and the manifest indexes it as a PREVIEW — never a revision.
    const m = await manifest()
    expect(m.slug).toBe(SLUG)
    expect(m.previews).toEqual([
      { sha: result.sha, createdAt: '2026-07-30T12:00:00.000Z', basedOn: null },
    ])
    expect(m.revisions).toEqual([])
    expect(m.live).toBeNull()
    expect(result.url).toBe(`https://1stcontact.io/site/${SLUG}/draft/${result.sha}/`)
  })

  it('test_UAT_FC_REQ-110_deploy_is_content_addressed', async () => {
    const first = await deploy()
    const afterFirst = (await client.list('')).length
    expect(first.alreadyDeployed).toBe(false)
    expect(first.uploadedKeys.length).toBeGreaterThan(0)

    // Identical content: one upload, same URL, nothing added to the bucket.
    const again = await deploy()
    expect(again.sha).toBe(first.sha)
    expect(again.url).toBe(first.url)
    expect(again.alreadyDeployed).toBe(true)
    expect(again.uploadedKeys).toEqual([])
    expect((await client.list('')).length).toBe(afterFirst)
    expect((await manifest()).previews).toHaveLength(1)

    // Changed content: a new id, and the prior snapshot survives intact.
    setPageText('SECOND-PASS')
    const second = await deploy()
    expect(second.sha).not.toBe(first.sha)
    const stillThere = await client.get(`sites/${SLUG}/preview/${first.sha}/out/index.html`)
    expect(stillThere).toBeTruthy()
    expect(stillThere).not.toContain('SECOND-PASS')
    expect(
      await client.get(`sites/${SLUG}/preview/${second.sha}/out/index.html`),
    ).toContain('SECOND-PASS')
    expect((await manifest()).previews.map((p) => p.sha)).toEqual([first.sha, second.sha])
  })

  it('test_UAT_FC_REQ-110_deploy_renders_before_upload', async () => {
    setPageText('MARKER-ONE')
    await deploy()

    // The definition moves on, and `dist/` is left holding the OLD render — the
    // exact state that would let a deploy ship stale bytes if it trusted dist.
    setPageText('MARKER-TWO')
    const stale = path.join(distDir(ctx, SLUG, 'draft'), 'index.html')
    writeFileSync(stale, '<!doctype html><title>MARKER-ONE</title>', 'utf8')

    const result = await deploy()
    const html = await client.get(`sites/${SLUG}/preview/${result.sha}/out/index.html`)
    expect(html).toContain('MARKER-TWO')
    expect(html).not.toContain('MARKER-ONE')
    // The uploaded source half agrees with the uploaded render.
    const source = await client.get(`sites/${SLUG}/preview/${result.sha}/source/pages/home.json`)
    expect(source).toContain('MARKER-TWO')
    // dist/ was rewritten by the deploy's own render, not read as-is.
    expect(readFileSync(stale, 'utf8')).toContain('MARKER-TWO')
  })

  it('test_UAT_FC_REQ-110_deploy_published_requires_revision', async () => {
    await expect(deploy({ channel: 'published' })).rejects.toThrow(/1c publish/)
    // Nothing was written on the refusal.
    expect(await client.list('')).toEqual([])

    // publish mints the revision; deploy then ships it and moves `live`.
    await cmdPublish(SLUG, { cwd, message: 'launch', now: '2026-07-30T11:00:00.000Z' })
    const result = await deploy({ channel: 'published' })
    expect(result.revision).toBe(1)
    expect(result.prefix).toBe(`sites/${SLUG}/rev/0001`)
    expect(result.url).toBe(`https://1stcontact.io/site/${SLUG}/`)
    const m = await manifest()
    expect(m.live).toBe(1)
    expect(m.revisions).toEqual([
      { id: 1, publishedAt: '2026-07-30T11:00:00.000Z', message: 'launch', sha: result.sha },
    ])
    expect(await client.get(`sites/${SLUG}/rev/0001/out/index.html`)).toBeTruthy()
    expect(await client.get(`sites/${SLUG}/rev/0001/source/site.json`)).toBeTruthy()
  })

  it('test_UAT_FC_REQ-110_deploy_output_names_each_stage', async () => {
    const report = formatDeployReport(await deploy())
    for (const label of ['render', 'hash', 'upload', 'manifest']) {
      expect(report.split('\n').some((l) => l.trim().startsWith(label))).toBe(true)
    }
    // Both halves of the artifact are named, and the report ends in the URL.
    expect(report).toMatch(/upload\s+preview\/[0-9a-f]{12}\/out/)
    expect(report).toMatch(/upload\s+preview\/[0-9a-f]{12}\/source/)
    expect(report.trimEnd().split('\n').at(-1)).toMatch(
      new RegExp(`→\\s+https://1stcontact\\.io/site/${SLUG}/draft/[0-9a-f]{12}/$`),
    )
  })

  it('test_UAT_FC_REQ-110_dry_run_uploads_nothing', async () => {
    const result = await deploy({ dryRun: true })

    expect(result.dryRun).toBe(true)
    expect(result.uploadedKeys).toEqual([])
    expect(client.objects.size).toBe(0)
    expect(await client.list('')).toEqual([])
    expect(await client.get(manifestKey(SLUG))).toBeNull()

    // …but the plan is fully printed, URL included.
    const report = formatDeployReport(result)
    expect(report).toContain('dry-run')
    expect(report).toMatch(/upload\s+preview\//)
    expect(report).toContain(result.url)

    // And the real deploy that follows is unaffected by the rehearsal.
    const real = await deploy()
    expect(real.sha).toBe(result.sha)
    expect(real.alreadyDeployed).toBe(false)
    expect(client.objects.size).toBeGreaterThan(0)
  })

  it('test_UAT_FC_REQ-110_prune_removes_unreferenced', async () => {
    const live = await deploy()

    // An orphan: keys recorded and written, but no manifest entry ever landed —
    // what an interrupted deploy leaves behind.
    const orphan = `sites/${SLUG}/preview/deadbeef0000`
    await client.record([`${orphan}/out/index.html`])
    await client.putText(`${orphan}/out/index.html`, '<!doctype html>orphan')
    await client.putText(`${orphan}/source/site.json`, '{}')

    const result = await deploy({ prune: true })

    expect(result.prunedKeys.sort()).toEqual(
      [`${orphan}/out/index.html`, `${orphan}/source/site.json`].sort(),
    )
    expect(await client.get(`${orphan}/out/index.html`)).toBeNull()
    expect(await client.get(`${orphan}/source/site.json`)).toBeNull()
    expect(await client.list(orphan)).toEqual([])

    // Everything the manifest references is untouched.
    expect(await client.get(`sites/${SLUG}/preview/${live.sha}/out/index.html`)).toBeTruthy()
    expect(await client.get(manifestKey(SLUG))).toBeTruthy()
    expect((await manifest()).previews.map((p) => p.sha)).toEqual([live.sha])

    // A second prune has nothing left to collect.
    expect((await deploy({ prune: true })).prunedKeys).toEqual([])
  })
})
