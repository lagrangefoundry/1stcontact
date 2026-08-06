/**
 * STORY-5349d01f — "Ship a site off the laptop": a content-addressed snapshot
 * deploy that returns a shareable URL.
 *
 * Before this capability a site existed only on the operator's machine. `1c
 * deploy` is the *operator half* of delivery — the act of shipping — and these
 * UATs pin its acceptance through the real command:
 *
 *   AC-892  a draft deploy ships both artifact halves under a content-addressed
 *           preview prefix and returns the shareable URL
 *   AC-893  the snapshot id is a pure function of the bytes: identical is a
 *           no-op, changed lands *beside* the previous snapshot
 *   AC-894  every deploy renders first, so stale `dist/` can never be shipped
 *   AC-895  a draft deploy never mints a revision or enters publish history
 *   AC-896  `--channel published` ships the latest revision and moves `live`
 *   AC-897  …and refuses, by name, a site with no revisions
 *   AC-898  `--dry-run` prints the whole plan and writes nothing
 *   AC-899  `--prune` collects only unreferenced snapshot objects
 *   AC-900  the report labels every stage and terminates in the URL
 *   AC-901  a deploy whose index moved underneath it fails loudly, unclobbered
 *
 * Shared storage is faked at the upload boundary (`MemoryR2Client`) — the whole
 * pipeline runs end-to-end with no network.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, cmdPublish } from '../tools/generate/src/cli/commands'
import { distDir, draftDir, readHistory, readJson, writeJson } from '../tools/generate/src/store'
import {
  cmdDeploy,
  formatDeployReport,
  MemoryR2Client,
  manifestKey,
  serializeManifest,
  type R2Client,
  type SiteManifest,
} from '../tools/generate/src/deploy'

const SLUG = 'acme'
const NOW = '2026-07-30T12:00:00.000Z'

let cwd: string
let client: MemoryR2Client

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'story-deploy-'))
  client = new MemoryR2Client()
  cmdNew(SLUG, { cwd })
})
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

const ctx = {
  get cwd() {
    return cwd
  },
  root: 'sites' as const,
}

/** Deploy through the real command, with shared storage faked at the boundary. */
function deploy(opts: Parameters<typeof cmdDeploy>[1] = {}) {
  return cmdDeploy(SLUG, { cwd, client, now: NOW, ...opts })
}

/** Set the home page's single L1 text leaf — the marker rendered into the HTML. */
function setPageText(marker: string): void {
  const file = path.join(draftDir(ctx, SLUG), 'pages', 'home.json')
  const page = readJson<Record<string, unknown>>(file)
  const l1 = page.l1 as { root: { children: Array<{ text: string }> } }
  l1.root.children[0].text = marker
  writeJson(file, page)
}

/** The site's deploy index, read back out of shared storage. */
async function deployIndex(): Promise<SiteManifest> {
  const raw = await client.get(manifestKey(SLUG))
  if (raw === null) throw new Error('no deploy index in shared storage')
  return JSON.parse(raw) as SiteManifest
}

/** Report lines whose label column starts with `label`. */
function stageLines(report: string, label: string): string[] {
  return report.split('\n').filter((l) => l.trim().startsWith(label))
}

describe('STORY — ship a site off the laptop (1c deploy)', () => {
  it('test_UAT_AC892_draft_deploy_ships_complete_artifact_to_content_addressed_preview', async () => {
    const result = await deploy()

    const prefix = `sites/${SLUG}/preview/${result.sha}`
    const keys = await client.list(`sites/${SLUG}/`)

    // Both halves of the artifact land under the content-addressed location:
    // the rendered output…
    expect(keys).toContain(`${prefix}/out/index.html`)
    expect(keys).toContain(`${prefix}/out/theme.css`)
    // …and the definition it was rendered from.
    expect(keys).toContain(`${prefix}/source/site.json`)
    expect(keys).toContain(`${prefix}/source/pages/home.json`)

    // The stored bytes are the real rendered document, not a placeholder.
    const html = await client.get(`${prefix}/out/index.html`)
    expect(html).toMatch(/^<!DOCTYPE html>/i)
    expect(html).toContain(`<title>${SLUG}`)
    expect(html).toContain('</html>')
    const siteJson = await client.get(`${prefix}/source/site.json`)
    expect(JSON.parse(siteJson as string).id).toBe(SLUG)
    const homeJson = await client.get(`${prefix}/source/pages/home.json`)
    expect(JSON.parse(homeJson as string).slug).toBe('home')

    // The deploy index records it as a PREVIEW — content id, deploy time, and
    // which published revision the draft descended from (explicitly "none").
    const index = await deployIndex()
    expect(index.slug).toBe(SLUG)
    expect(index.previews).toEqual([{ sha: result.sha, createdAt: NOW, basedOn: null }])

    // One shareable URL, addressing the preview by its content id.
    expect(result.url).toContain(SLUG)
    expect(result.url).toContain(result.sha)
    expect(result.url).toBe(`https://1stcontact.io/site/${SLUG}/draft/${result.sha}/`)
  })

  it('test_UAT_AC893_identical_bytes_are_a_noop_and_changed_bytes_land_beside', async () => {
    const first = await deploy()
    expect(first.alreadyDeployed).toBe(false)
    expect(first.uploadedKeys.length).toBeGreaterThan(0)
    const objectsAfterFirst = (await client.list('')).length

    // Identical content: same id, same URL, nothing uploaded, nothing added to
    // shared storage, no second index entry, and it says so.
    const second = await deploy()
    expect(second.sha).toBe(first.sha)
    expect(second.url).toBe(first.url)
    expect(second.alreadyDeployed).toBe(true)
    expect(second.uploadedKeys).toEqual([])
    expect((await client.list('')).length).toBe(objectsAfterFirst)
    expect((await deployIndex()).previews).toHaveLength(1)

    // Changed content: a different id — and the previous snapshot survives at
    // its own location with its own (old) contents intact.
    setPageText('THIRD-PASS')
    const third = await deploy()
    expect(third.sha).not.toBe(first.sha)

    const oldPage = await client.get(`sites/${SLUG}/preview/${first.sha}/out/index.html`)
    expect(oldPage).toBeTruthy()
    expect(oldPage).not.toContain('THIRD-PASS')
    expect(await client.get(`sites/${SLUG}/preview/${third.sha}/out/index.html`)).toContain(
      'THIRD-PASS',
    )

    // The index lists both snapshots, oldest first.
    expect((await deployIndex()).previews.map((p) => p.sha)).toEqual([first.sha, third.sha])
  })

  it('test_UAT_AC894_deploy_always_renders_so_stale_local_output_cannot_ship', async () => {
    setPageText('MARKER-ONE')
    await deploy()

    // The definition moves on, and the local rendered output is left holding
    // the OLD render — exactly the state that would ship stale bytes if `dist/`
    // were trusted as an input.
    setPageText('MARKER-TWO')
    const stale = path.join(distDir(ctx, SLUG, 'draft'), 'index.html')
    writeFileSync(stale, '<!doctype html><title>MARKER-ONE</title>', 'utf8')

    const result = await deploy()

    // The uploaded bytes reflect the *current* definition.
    const html = await client.get(`sites/${SLUG}/preview/${result.sha}/out/index.html`)
    expect(html).toContain('MARKER-TWO')
    expect(html).not.toContain('MARKER-ONE')

    // The uploaded render and the uploaded definition agree with each other.
    const source = await client.get(`sites/${SLUG}/preview/${result.sha}/source/pages/home.json`)
    expect(source).toContain('MARKER-TWO')
    expect(source).not.toContain('MARKER-ONE')

    // …and the local output on disk was refreshed by the deploy's own render.
    expect(readFileSync(stale, 'utf8')).toContain('MARKER-TWO')
  })

  it('test_UAT_AC895_draft_deploy_never_mints_a_revision_or_enters_publish_history', async () => {
    const first = await deploy()
    setPageText('BETWEEN-DEPLOYS')
    const second = await deploy()

    // The site's publish history is untouched by either deploy.
    expect(readHistory(ctx, SLUG).revisions).toEqual([])

    // The deploy index lists no revisions and its live pointer stays unset.
    const index = await deployIndex()
    expect(index.revisions).toEqual([])
    expect(index.live).toBeNull()
    expect(index.previews).toHaveLength(2)

    // Neither result carries a revision number — a preview is addressed by
    // content id only — yet each still returns a working preview URL.
    for (const result of [first, second]) {
      expect(result.revision).toBeNull()
      expect(result.url).toBe(`https://1stcontact.io/site/${SLUG}/draft/${result.sha}/`)
      expect(await client.get(`sites/${SLUG}/preview/${result.sha}/out/index.html`)).toBeTruthy()
    }
  })

  it('test_UAT_AC896_published_deploy_ships_latest_revision_and_moves_live_pointer', async () => {
    await cmdPublish(SLUG, { cwd, message: 'launch', now: '2026-07-30T11:00:00.000Z' })

    const result = await deploy({ channel: 'published' })

    // Both artifact halves are readable under the revision's own location.
    expect(result.prefix).toBe(`sites/${SLUG}/rev/0001`)
    expect(await client.get(`sites/${SLUG}/rev/0001/out/index.html`)).toContain('<title>')
    expect(await client.get(`sites/${SLUG}/rev/0001/source/site.json`)).toBeTruthy()
    expect(await client.get(`sites/${SLUG}/rev/0001/source/pages/home.json`)).toBeTruthy()

    // The index lists the revision with its own id, its *publish* timestamp,
    // its publish message and the content id of the bytes shipped…
    const index = await deployIndex()
    expect(index.revisions).toEqual([
      { id: 1, publishedAt: '2026-07-30T11:00:00.000Z', message: 'launch', sha: result.sha },
    ])
    // …and the live pointer names that revision.
    expect(index.live).toBe(1)

    // The result carries the revision number, and the URL is the site's plain
    // published URL — no snapshot id segment.
    expect(result.revision).toBe(1)
    expect(result.url).toBe(`https://1stcontact.io/site/${SLUG}/`)
    expect(result.url).not.toContain(result.sha)
  })

  it('test_UAT_AC897_published_deploy_without_revisions_is_refused_by_name_and_writes_nothing', async () => {
    // A freshly created, never-published site.
    expect(readHistory(ctx, SLUG).revisions).toEqual([])

    await expect(deploy({ channel: 'published' })).rejects.toThrow(
      /no revisions to deploy[\s\S]*1c publish acme/,
    )

    // The refusal happens before any work: shared storage is completely empty
    // and no deploy index was created.
    expect(await client.list('')).toEqual([])
    expect(client.objects.size).toBe(0)
    expect(await client.get(manifestKey(SLUG))).toBeNull()
  })

  it('test_UAT_AC898_dry_run_prints_the_plan_writes_nothing_and_leaves_the_real_deploy_intact', async () => {
    const rehearsal = await deploy({ dryRun: true })

    // No change to shared storage: no snapshot objects, no index, no keys.
    expect(rehearsal.dryRun).toBe(true)
    expect(rehearsal.uploadedKeys).toEqual([])
    expect(client.objects.size).toBe(0)
    expect(await client.list('')).toEqual([])
    expect(await client.get(manifestKey(SLUG))).toBeNull()

    // …but the whole plan is reported, upload groups and URL included, and it
    // states plainly that it was a rehearsal.
    const report = formatDeployReport(rehearsal)
    expect(report).toContain('dry-run')
    expect(report).toMatch(/upload\s+preview\/[0-9a-f]{12}\/out/)
    expect(report).toMatch(/upload\s+preview\/[0-9a-f]{12}\/source/)
    expect(report).toContain(rehearsal.url)

    // The real deploy that follows is unaffected by the rehearsal: same content
    // id, NOT reported as already deployed, and this time it really writes.
    const real = await deploy()
    expect(real.sha).toBe(rehearsal.sha)
    expect(real.alreadyDeployed).toBe(false)
    expect(real.uploadedKeys.length).toBeGreaterThan(0)
    expect(client.objects.size).toBeGreaterThan(0)
  })

  it('test_UAT_AC899_prune_deletes_only_snapshot_objects_the_index_does_not_reference', async () => {
    const kept = await deploy()

    // An orphan: objects written and recorded under a snapshot location that no
    // index entry names — what an interrupted deploy leaves behind.
    const orphan = `sites/${SLUG}/preview/deadbeef0000`
    await client.record([`${orphan}/out/index.html`])
    await client.putText(`${orphan}/out/index.html`, '<!doctype html>orphan')
    await client.putText(`${orphan}/source/site.json`, '{}')

    // A non-snapshot object under the site, which prune must leave alone rather
    // than sweep up.
    const bystander = `sites/${SLUG}/notes.txt`
    await client.putText(bystander, 'operator notes')

    const result = await deploy({ prune: true })

    // Exactly the orphan's objects are deleted, and each deletion is reported.
    expect(result.prunedKeys.sort()).toEqual(
      [`${orphan}/out/index.html`, `${orphan}/source/site.json`].sort(),
    )
    const report = formatDeployReport(result)
    expect(stageLines(report, 'prune')).toHaveLength(2)
    expect(await client.get(`${orphan}/out/index.html`)).toBeNull()
    expect(await client.get(`${orphan}/source/site.json`)).toBeNull()
    expect(await client.list(orphan)).toEqual([])

    // Everything the index references is untouched — as are the index itself
    // and the object that is not a snapshot object.
    expect(await client.get(`sites/${SLUG}/preview/${kept.sha}/out/index.html`)).toBeTruthy()
    expect(await client.get(manifestKey(SLUG))).toBeTruthy()
    expect((await deployIndex()).previews.map((p) => p.sha)).toEqual([kept.sha])
    expect(await client.get(bystander)).toBe('operator notes')

    // A second prune has nothing orphaned, deletes nothing, and says so.
    const again = await deploy({ prune: true })
    expect(again.prunedKeys).toEqual([])
    expect(stageLines(formatDeployReport(again), 'prune')).toEqual([
      expect.stringContaining('nothing unreferenced'),
    ])
  })

  it('test_UAT_AC900_report_labels_every_stage_and_terminates_in_the_shareable_url', async () => {
    const report = formatDeployReport(await deploy())
    const lines = report.split('\n')

    // A line begins with each stage label that ran.
    for (const label of ['render', 'hash', 'upload', 'manifest']) {
      expect(stageLines(report, label).length).toBeGreaterThan(0)
    }

    // The file-moving stages carry a trailing file-count + size detail…
    expect(stageLines(report, 'render')[0]).toMatch(/\d+ files\s+[\d.]+ (B|KB|MB)/)
    // …and both upload halves are named distinctly.
    expect(report).toMatch(/upload\s+preview\/[0-9a-f]{12}\/out\s+\d+ files/)
    expect(report).toMatch(/upload\s+preview\/[0-9a-f]{12}\/source\s+\d+ files/)

    // The final non-empty line is the shareable URL.
    const lastNonEmpty = lines.filter((l) => l.trim() !== '').at(-1)
    expect(lastNonEmpty).toMatch(
      new RegExp(`→\\s+https://1stcontact\\.io/site/${SLUG}/draft/[0-9a-f]{12}/$`),
    )

    // Deploy again unchanged: the hash line carries the already-deployed note.
    const unchanged = formatDeployReport(await deploy())
    expect(stageLines(unchanged, 'hash')[0]).toContain('already deployed')
  })

  it('test_UAT_AC901_index_changed_underneath_the_deploy_fails_loudly_and_leaves_it_unclobbered', async () => {
    // What the *other* deploy leaves in shared storage while this one uploads.
    const otherDeploy: SiteManifest = {
      slug: SLUG,
      live: null,
      revisions: [],
      previews: [{ sha: 'aaaaaaaaaaaa', createdAt: '2026-07-30T09:00:00.000Z', basedOn: null }],
    }

    // Mutate the stored index out of band, after this deploy has read it and
    // before it writes: on the first object upload.
    let raced = false
    const inner: R2Client = client
    const racing: R2Client = {
      put: async (key, localPath, contentType) => {
        await inner.put(key, localPath, contentType)
        if (!raced) {
          raced = true
          await inner.putText(manifestKey(SLUG), serializeManifest(otherDeploy))
        }
      },
      putText: (key, body, contentType) => inner.putText(key, body, contentType),
      get: (key) => inner.get(key),
      delete: (key) => inner.delete(key),
      record: (keys) => inner.record(keys),
      list: (prefix) => inner.list(prefix),
    }

    const attempt = cmdDeploy(SLUG, { cwd, client: racing, now: NOW })

    // The deploy fails, naming the site, saying another deploy is in flight and
    // that nothing was written, and directing the operator to re-run.
    await expect(attempt).rejects.toThrow(/another deploy is in flight/)
    await expect(attempt).rejects.toThrow(/acme/)
    await expect(attempt).rejects.toThrow(/Nothing was written/)
    await expect(attempt).rejects.toThrow(/re-run `1c deploy acme`/)
    expect(raced).toBe(true)

    // The previously stored index is exactly what the other deploy left — this
    // deploy's version never overwrote it.
    const stored = await deployIndex()
    expect(stored).toEqual(otherDeploy)
    expect(stored.previews.map((p) => p.sha)).toEqual(['aaaaaaaaaaaa'])
  })
})
