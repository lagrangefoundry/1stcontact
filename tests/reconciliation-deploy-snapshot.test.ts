/**
 * STORY-5349d01f — "Ship a site off the laptop": a content-addressed snapshot
 * deploy that returns a shareable URL.
 *
 * Before this capability a site existed only on the operator's machine. `1c
 * deploy` is the *operator half* of delivery — the act of shipping — and these
 * UATs pin its acceptance through the real command:
 *
 *   AC-892  a draft deploy ships both artifact halves under a content-addressed
 *           preview prefix and returns the shareable URL — when the tree is servable
 *   AC-893  the snapshot id is a pure function of the bytes: identical is a
 *           no-op, changed lands *beside* the previous snapshot
 *   AC-894  every deploy renders first, so stale `dist/` can never be shipped
 *   AC-895  a draft deploy never mints a revision or enters publish history
 *   AC-896  `--channel published` ships the latest revision and moves `live`
 *   AC-897  …and refuses, by name, a site with no revisions
 *   AC-898  `--dry-run` prints the whole plan and writes nothing
 *   AC-899  `--prune` collects only unreferenced snapshot objects, per store tree
 *   AC-900  the report labels every stage and terminates in the URL
 *   AC-901  a deploy whose index moved underneath it fails loudly, unclobbered
 *   AC-924  every key a deploy writes is scoped to the store tree it came from
 *   AC-925  a deploy from the non-servable tree reports no URL, and says why
 *   AC-926  each store tree keeps its own deploy index
 *
 * The operator's machine keeps two store trees — the git-tracked `sites/` tree
 * and the gitignored `sandbox/` scratch tree — and that separation survives the
 * crossing into shared storage (BUG-31): the tree a definition was loaded from
 * is part of the address its snapshot ships to.
 *
 * Shared storage is faked at the upload boundary (`MemoryR2Client`) — the whole
 * pipeline runs end-to-end with no network.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { run } from '../tools/generate/src/cli'
import { cmdNew, cmdPublish } from '../tools/generate/src/cli/commands'
import {
  distDir,
  draftDir,
  readHistory,
  readJson,
  writeJson,
  type Root,
} from '../tools/generate/src/store'
import {
  cmdDeploy,
  formatDeployReport,
  MemoryR2Client,
  manifestKey,
  serializeManifest,
  type R2Client,
  type SiteManifest,
} from '../tools/generate/src/deploy'

/** One slug, deliberately shared across both store trees — the collision that
 * makes root-scoping observable rather than theoretical. */
const SLUG = 'acme'
const NOW = '2026-07-30T12:00:00.000Z'

/** The tree the public Worker serves, and the throwaway scratch tree it does not. */
const SERVABLE: Root = 'sites'
const SCRATCH: Root = 'sandbox'

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

const ctxFor = (root: Root) => ({
  get cwd() {
    return cwd
  },
  root,
})
const ctx = ctxFor(SERVABLE)

/** Deploy through the real command, with shared storage faked at the boundary. */
function deploy(opts: Parameters<typeof cmdDeploy>[1] = {}) {
  return cmdDeploy(SLUG, { cwd, client, now: NOW, ...opts })
}

/** Create the same slug in the scratch tree, so both trees hold a site called `acme`. */
function newScratchSite(): void {
  cmdNew(SLUG, { cwd, sandbox: true })
}

/** Set a tree's home-page single L1 text leaf — the marker rendered into the HTML. */
function setPageText(marker: string, root: Root = SERVABLE): void {
  const file = path.join(draftDir(ctxFor(root), SLUG), 'pages', 'home.json')
  const page = readJson<Record<string, unknown>>(file)
  const l1 = page.l1 as { root: { children: Array<{ text: string }> } }
  l1.root.children[0].text = marker
  writeJson(file, page)
}

/** The site's deploy index for one store tree, read back out of shared storage. */
async function deployIndex(root: Root = SERVABLE): Promise<SiteManifest> {
  const raw = await client.get(manifestKey(root, SLUG))
  if (raw === null) throw new Error(`no deploy index in shared storage under ${root}/`)
  return JSON.parse(raw) as SiteManifest
}

/** Report lines whose label column starts with `label`. */
function stageLines(report: string, label: string): string[] {
  return report.split('\n').filter((l) => l.trim().startsWith(label))
}

/** The last line of a report that carries anything — the deploy's destination. */
function lastNonEmptyLine(report: string): string {
  return report.split('\n').filter((l) => l.trim() !== '').at(-1) as string
}

describe('STORY — ship a site off the laptop (1c deploy)', () => {
  it('test_UAT_AC892_draft_deploy_ships_complete_artifact_to_content_addressed_preview', async () => {
    const result = await deploy()

    const prefix = `${SERVABLE}/${SLUG}/preview/${result.sha}`
    const keys = await client.list(`${SERVABLE}/${SLUG}/`)

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

    // The same site in the NON-servable tree ships and indexes identically —
    // same halves, same content addressing, same preview entry…
    newScratchSite()
    const scratch = await deploy({ sandbox: true })
    const scratchPrefix = `${SCRATCH}/${SLUG}/preview/${scratch.sha}`
    for (const rel of ['out/index.html', 'out/theme.css', 'source/site.json', 'source/pages/home.json']) {
      expect(await client.get(`${scratchPrefix}/${rel}`)).toBeTruthy()
    }
    expect(await client.get(`${scratchPrefix}/out/index.html`)).toMatch(/^<!DOCTYPE html>/i)
    expect((await deployIndex(SCRATCH)).previews).toEqual([
      { sha: scratch.sha, createdAt: NOW, basedOn: null },
    ])

    // …but returns no URL at all, because nothing can serve it.
    expect(scratch.url).toBeNull()
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

    const oldPage = await client.get(`${SERVABLE}/${SLUG}/preview/${first.sha}/out/index.html`)
    expect(oldPage).toBeTruthy()
    expect(oldPage).not.toContain('THIRD-PASS')
    expect(await client.get(`${SERVABLE}/${SLUG}/preview/${third.sha}/out/index.html`)).toContain(
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
    const html = await client.get(`${SERVABLE}/${SLUG}/preview/${result.sha}/out/index.html`)
    expect(html).toContain('MARKER-TWO')
    expect(html).not.toContain('MARKER-ONE')

    // The uploaded render and the uploaded definition agree with each other.
    const source = await client.get(
      `${SERVABLE}/${SLUG}/preview/${result.sha}/source/pages/home.json`,
    )
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
      expect(
        await client.get(`${SERVABLE}/${SLUG}/preview/${result.sha}/out/index.html`),
      ).toBeTruthy()
    }
  })

  it('test_UAT_AC896_published_deploy_ships_latest_revision_and_moves_live_pointer', async () => {
    await cmdPublish(SLUG, { cwd, message: 'launch', now: '2026-07-30T11:00:00.000Z' })

    const result = await deploy({ channel: 'published' })

    // Both artifact halves are readable under the revision's own location.
    expect(result.prefix).toBe(`${SERVABLE}/${SLUG}/rev/0001`)
    expect(await client.get(`${SERVABLE}/${SLUG}/rev/0001/out/index.html`)).toContain('<title>')
    expect(await client.get(`${SERVABLE}/${SLUG}/rev/0001/source/site.json`)).toBeTruthy()
    expect(await client.get(`${SERVABLE}/${SLUG}/rev/0001/source/pages/home.json`)).toBeTruthy()

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

    // A published deploy from the NON-servable tree ships and indexes the same
    // way in its own tree, and returns no URL.
    newScratchSite()
    await cmdPublish(SLUG, { cwd, sandbox: true, message: 'scratch', now: NOW })
    const scratch = await deploy({ sandbox: true, channel: 'published' })
    expect(scratch.prefix).toBe(`${SCRATCH}/${SLUG}/rev/0001`)
    expect(await client.get(`${SCRATCH}/${SLUG}/rev/0001/out/index.html`)).toContain('<title>')
    expect(await client.get(`${SCRATCH}/${SLUG}/rev/0001/source/site.json`)).toBeTruthy()
    const scratchIndex = await deployIndex(SCRATCH)
    expect(scratchIndex.live).toBe(1)
    expect(scratchIndex.revisions).toEqual([
      { id: 1, publishedAt: NOW, message: 'scratch', sha: scratch.sha },
    ])
    expect(scratch.revision).toBe(1)
    expect(scratch.url).toBeNull()
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
    expect(await client.get(manifestKey(SERVABLE, SLUG))).toBeNull()
  })

  it('test_UAT_AC898_dry_run_prints_the_plan_writes_nothing_and_leaves_the_real_deploy_intact', async () => {
    const rehearsal = await deploy({ dryRun: true })

    // No change to shared storage: no snapshot objects, no index, no keys.
    expect(rehearsal.dryRun).toBe(true)
    expect(rehearsal.uploadedKeys).toEqual([])
    expect(client.objects.size).toBe(0)
    expect(await client.list('')).toEqual([])
    expect(await client.get(manifestKey(SERVABLE, SLUG))).toBeNull()

    // …but the whole plan is reported, upload groups and URL included, and it
    // states plainly that it was a rehearsal.
    const report = formatDeployReport(rehearsal)
    expect(report).toContain('dry-run')
    expect(report).toMatch(/upload\s+preview\/[0-9a-f]{12}\/out/)
    expect(report).toMatch(/upload\s+preview\/[0-9a-f]{12}\/source/)
    expect(report).toContain(rehearsal.url as string)

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
    const orphan = `${SERVABLE}/${SLUG}/preview/deadbeef0000`
    await client.record([`${orphan}/out/index.html`])
    await client.putText(`${orphan}/out/index.html`, '<!doctype html>orphan')
    await client.putText(`${orphan}/source/site.json`, '{}')

    // A non-snapshot object under the site, which prune must leave alone rather
    // than sweep up.
    const bystander = `${SERVABLE}/${SLUG}/notes.txt`
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
    expect(await client.get(`${SERVABLE}/${SLUG}/preview/${kept.sha}/out/index.html`)).toBeTruthy()
    expect(await client.get(manifestKey(SERVABLE, SLUG))).toBeTruthy()
    expect((await deployIndex()).previews.map((p) => p.sha)).toEqual([kept.sha])
    expect(await client.get(bystander)).toBe('operator notes')

    // A second prune has nothing orphaned, deletes nothing, and says so.
    const again = await deploy({ prune: true })
    expect(again.prunedKeys).toEqual([])
    expect(stageLines(formatDeployReport(again), 'prune')).toEqual([
      expect.stringContaining('nothing unreferenced'),
    ])

    // The candidates a prune considers are scoped to the store tree being
    // pruned, not to the slug alone. With an orphan planted in each tree under
    // the shared slug, pruning one never enumerates — and so never deletes —
    // anything stored under the other.
    newScratchSite()
    await deploy({ sandbox: true })
    const servableOrphan = `${SERVABLE}/${SLUG}/preview/aaaaaaaaaaaa/out/index.html`
    const scratchOrphan = `${SCRATCH}/${SLUG}/preview/bbbbbbbbbbbb/out/index.html`
    await client.putText(servableOrphan, '<!doctype html>servable orphan')
    await client.putText(scratchOrphan, '<!doctype html>scratch orphan')

    const scratchPrune = await deploy({ sandbox: true, prune: true })
    expect(scratchPrune.prunedKeys).toEqual([scratchOrphan])
    expect(await client.get(scratchOrphan)).toBeNull()
    expect(await client.get(servableOrphan)).toBe('<!doctype html>servable orphan')
  })

  it('test_UAT_AC900_report_labels_every_stage_and_terminates_in_the_shareable_url', async () => {
    const report = formatDeployReport(await deploy())

    // A line begins with each stage label that ran.
    for (const label of ['render', 'hash', 'upload', 'manifest']) {
      expect(stageLines(report, label).length).toBeGreaterThan(0)
    }

    // The file-moving stages carry a trailing file-count + size detail — every
    // one of them, not just the render line.
    expect(stageLines(report, 'render')[0]).toMatch(/\d+ files\s+[\d.]+ (B|KB|MB)/)
    // …and both upload halves are named distinctly.
    expect(report).toMatch(/upload\s+preview\/[0-9a-f]{12}\/out\s+\d+ files\s+[\d.]+ (B|KB|MB)/)
    expect(report).toMatch(/upload\s+preview\/[0-9a-f]{12}\/source\s+\d+ files\s+[\d.]+ (B|KB|MB)/)

    // The final non-empty line is the shareable URL.
    expect(lastNonEmptyLine(report)).toMatch(
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
          await inner.putText(manifestKey(SERVABLE, SLUG), serializeManifest(otherDeploy))
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

  it('test_UAT_AC924_every_key_a_deploy_writes_is_scoped_to_its_store_tree', async () => {
    // Two sites, same slug, one per store tree, with distinguishable content.
    newScratchSite()
    setPageText('REAL-SITE-CONTENT', SERVABLE)
    setPageText('SCRATCH-CONTENT', SCRATCH)

    const scratch = await deploy({ sandbox: true })

    // Nothing whatsoever exists under the real-sites tree: no snapshot object,
    // no index write, and the deploy never read the other tree's index either
    // (a read that fed the write would have created one).
    expect(await client.list(`${SERVABLE}/`)).toEqual([])
    expect(await client.get(manifestKey(SERVABLE, SLUG))).toBeNull()

    // Every key the deploy reports having written is under the scratch tree…
    expect(scratch.root).toBe(SCRATCH)
    expect(scratch.uploadedKeys.length).toBeGreaterThan(0)
    for (const key of scratch.uploadedKeys) {
      expect(key.startsWith(`${SCRATCH}/${SLUG}/`), key).toBe(true)
    }
    // …including the deploy index itself.
    expect(await client.get(manifestKey(SCRATCH, SLUG))).toBeTruthy()

    // …and the snapshot prefix the result reports names that tree.
    expect(scratch.prefix).toBe(`${SCRATCH}/${SLUG}/preview/${scratch.sha}`)

    // This is namespacing, not a no-op: the scratch site's real rendered markup
    // reads back under the scratch prefix.
    const html = await client.get(`${scratch.prefix}/out/index.html`)
    expect(html).toMatch(/^<!DOCTYPE html>/i)
    expect(html).toContain('SCRATCH-CONTENT')
    expect(html).not.toContain('REAL-SITE-CONTENT')
  })

  it('test_UAT_AC925_non_servable_tree_deploy_reports_no_url_and_says_why', async () => {
    newScratchSite()
    const scratch = await deploy({ sandbox: true })

    // An explicit absence — not an empty string, not a URL that would 404.
    expect(scratch.url).toBeNull()
    expect(scratch.url).not.toBe('')

    // The upload, the content addressing and the index update are otherwise
    // exactly what a servable deploy does.
    expect(scratch.uploadedKeys.length).toBeGreaterThan(0)
    expect(scratch.sha).toMatch(/^[0-9a-f]{12}$/)
    expect((await deployIndex(SCRATCH)).previews.map((p) => p.sha)).toEqual([scratch.sha])

    // The report ends in the snapshot's storage prefix followed by a statement
    // that it is not publicly reachable — rather than in an origin.
    const last = lastNonEmptyLine(formatDeployReport(scratch))
    expect(last).toContain(`${SCRATCH}/${SLUG}/preview/${scratch.sha}/`)
    expect(last).toContain('not publicly reachable')
    expect(last).not.toContain('https://')

    // The corresponding servable-tree deploy of the same site still ends in a URL.
    const servable = await deploy()
    expect(servable.url).toBe(`https://1stcontact.io/site/${SLUG}/draft/${servable.sha}/`)
    expect(lastNonEmptyLine(formatDeployReport(servable))).toContain(servable.url as string)

    // The command's own help says the same thing, and points at the workaround
    // for exercising the serving path.
    const printed: string[] = []
    const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      printed.push(args.join(' '))
    })
    try {
      await run(['help'])
    } finally {
      spy.mockRestore()
    }
    const help = printed.join('\n')
    expect(help).toContain('--sandbox')
    expect(help).toMatch(/nothing serves|has no URL/)
    expect(help).toContain('throwaway slug in storage/sites/')
  })

  it('test_UAT_AC926_each_store_tree_keeps_its_own_deploy_index', async () => {
    // A real site, published and deployed, with distinguishable content.
    newScratchSite()
    setPageText('REAL-SITE-CONTENT', SERVABLE)
    await cmdPublish(SLUG, { cwd, message: 'real', now: '2026-07-30T11:00:00.000Z' })
    const real = await deploy({ channel: 'published' })
    const realIndexBytes = await client.get(manifestKey(SERVABLE, SLUG))
    const realRevisionBytes = await client.get(`${SERVABLE}/${SLUG}/rev/0001/out/index.html`)
    expect(realRevisionBytes).toContain('REAL-SITE-CONTENT')

    // The scratch site mints revision 1 too and deploys it on the published
    // channel: same slug, same revision number, same channel — the collision.
    setPageText('SCRATCH-CONTENT', SCRATCH)
    await cmdPublish(SLUG, { cwd, sandbox: true, message: 'scratch', now: NOW })
    const scratch = await deploy({ sandbox: true, channel: 'published' })
    expect(scratch.sha).not.toBe(real.sha)

    // The real site's index is byte-identical: same previews, same revisions,
    // same live pointer — no entry was appended and the pointer did not move.
    expect(await client.get(manifestKey(SERVABLE, SLUG))).toBe(realIndexBytes)
    const realIndex = await deployIndex(SERVABLE)
    expect(realIndex.live).toBe(1)
    expect(realIndex.revisions).toEqual([
      { id: 1, publishedAt: '2026-07-30T11:00:00.000Z', message: 'real', sha: real.sha },
    ])

    // The real site's published bytes were not overwritten by the scratch site's.
    const afterBytes = await client.get(`${SERVABLE}/${SLUG}/rev/0001/out/index.html`)
    expect(afterBytes).toBe(realRevisionBytes)
    expect(afterBytes).toContain('REAL-SITE-CONTENT')
    expect(afterBytes).not.toContain('SCRATCH-CONTENT')

    // Each index lists exactly the snapshot ids deployed from its own tree.
    const scratchIndex = await deployIndex(SCRATCH)
    expect(realIndex.revisions.map((r) => r.sha)).toEqual([real.sha])
    expect(scratchIndex.revisions.map((r) => r.sha)).toEqual([scratch.sha])
    expect(scratchIndex.live).toBe(1)
  })
})
