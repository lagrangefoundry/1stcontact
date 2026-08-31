import { afterEach, describe, expect, it } from 'vitest'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { run } from '../tools/generate/src/cli'
import { startBuilder, type BuilderHandle } from '../tools/generate/src/cli/builder'
import { cmdPublish, cmdRevisions } from '../tools/generate/src/cli/commands'
import { checkoutRevision, publishSite } from '../tools/generate/src/publish/publish'
import { distDir, revisionDir } from '../tools/generate/src/store'
import { liveRevisionOf } from '../tools/generate/src/store/revision-model'
import type { RevisionEntry } from '../tools/generate/src/store/revision-model'
import { makeFsSite, type SiteFixture } from './support/site-factory'

/**
 * Reconciliation UATs for story-5349d01f — **publishing a site to shared
 * storage**, the criteria that are about the OPERATOR's half of delivery and
 * are observable against the store on their own machine.
 *
 *   AC-1419 — an unchanged draft mints nothing, and the publish command says so
 *             in its own words rather than printing a revision number.
 *   AC-1420 — an invalid draft publishes nothing, and fails before any write.
 *   AC-1421 — history is readable, and a checkout re-parents the draft while
 *             staying forward-only.
 *   AC-894  — a publish always renders from the current draft, so previously
 *             rendered output can never be published.
 *   AC-892  — a revision stores BOTH halves of the artifact.
 *
 * (AC-1418 and AC-1422 are in the sibling `.workers` file: both are claims about
 * the edge runtime and a database's own uniqueness, and neither can be proved
 * where a filesystem exists to fall back on.)
 *
 * WHAT MAKES THESE WORTH ANYTHING. Every case drives a real entry point — the
 * `1c` command through `run(argv)`, or the builder's own routing table over real
 * HTTP through `startBuilder` — against a real site tree in a temp directory.
 * Nothing here mocks the store, the renderer, the validator or the publish; the
 * only thing constructed by hand is the site, and that is the real scaffolder's
 * output rather than a fixture that can drift from the schema.
 */

const SITES: SiteFixture[] = []
const BUILDERS: BuilderHandle[] = []

// Sockets first, then trees: a listening builder holds the directory it serves.
afterEach(async () => {
  for (const builder of BUILDERS.splice(0)) await builder.close()
  for (const site of SITES.splice(0)) await site.dispose()
})

/** A scaffolded site on disk, torn down after the test. */
function freshSite(options: Parameters<typeof makeFsSite>[0] = {}): SiteFixture {
  const site = makeFsSite(options)
  SITES.push(site)
  return site
}

/** The builder's own routing table, over real HTTP, against this site's tree. */
async function builderFor(site: SiteFixture): Promise<BuilderHandle> {
  const builder = await startBuilder({ cwd: site.cwd! })
  BUILDERS.push(builder)
  return builder
}

interface CliRun {
  /** Everything the command printed, as an operator reads it. */
  out: string
  /** What it threw, when it refused. */
  error?: Error
}

/**
 * Drive the real `1c` entry point, exactly as `reconciliation-draft-change-journal`
 * does: `run` reads the working directory from the process, so the test supplies
 * one the way a shell would and restores it afterwards. Refusals are captured
 * rather than rethrown, because for these criteria *what the operator is told*
 * is the observation.
 */
async function cli(cwd: string, ...argv: string[]): Promise<CliRun> {
  const prevCwd = process.cwd()
  const prevLog = console.log
  const prevErr = console.error
  const lines: string[] = []
  process.chdir(cwd)
  console.log = (...a: unknown[]) => void lines.push(a.map(String).join(' '))
  console.error = (...a: unknown[]) => void lines.push(a.map(String).join(' '))
  let error: Error | undefined
  try {
    await run(argv)
  } catch (err) {
    error = err instanceof Error ? err : new Error(String(err))
  } finally {
    console.log = prevLog
    console.error = prevErr
    process.chdir(prevCwd)
  }
  return { out: lines.join('\n'), error }
}

const ctxOf = (site: SiteFixture) => ({ cwd: site.cwd!, root: 'sites' as const })

/** Where the local serve, screenshot and fidelity loops read published bytes. */
const publishedOut = (site: SiteFixture): string =>
  distDir(ctxOf(site), site.slug, 'published')

/** Replace the one text run a scaffolded page carries, through the store. */
async function retitle(site: SiteFixture, text: string): Promise<void> {
  const pages = await site.store.readPages(site.slug)
  const page = structuredClone(pages[0].page) as {
    l1: { root: { children: Array<{ text?: string }> } }
  }
  page.l1.root.children[0].text = text
  await site.store.write(site.slug, {
    pages: [{ name: pages[0].name, page: page as unknown as Record<string, unknown> }],
  })
}

describe('story-5349d01f — publishing from the command line and the builder', () => {
  it('test_UAT_AC1419_unchanged_draft_mints_nothing_and_the_command_says_so', async () => {
    // ── ARRANGE — a site published once.
    const site = freshSite()
    const first = await cmdPublish(site.slug, { cwd: site.cwd!, message: 'first' })
    expect(first.id).toBe(1)
    expect(first.published).toBe(true)

    // ── ACT — press the button again, with a DIFFERENT message. Publish is a
    // toolbar button and buttons get pressed twice.
    const again = await cmdPublish(site.slug, {
      cwd: site.cwd!,
      message: 'a different message entirely',
    })

    // ── ASSERT — the live revision comes back, and nothing was published.
    expect(again.id).toBe(1)
    expect(again.published).toBe(false)

    // The log is UNMOVED, not rewritten with an identical entry — and the
    // message did not change either, which is the part a "rewrite it in place"
    // implementation would get wrong while still holding one entry.
    const log = await cmdRevisions(site.slug, { cwd: site.cwd! })
    expect(log).toHaveLength(1)
    expect(log[0].message).toBe('first')

    // The command's own output names the EXISTING revision as already published
    // rather than announcing one an operator would reasonably read as new.
    const said = await cli(site.cwd!, 'publish', site.slug, '-m', 'and once more')
    expect(said.error).toBeUndefined()
    expect(said.out).toBe('Already published as r1 — the draft has no changes.')
    expect(said.out).not.toMatch(/Published revision/)

    // ── ASSERT — forward-only is unaffected by the no-op. A draft checked out
    // from an earlier revision DIFFERS from live, so its change list is
    // non-empty and publishing it mints a new highest revision as normal.
    await retitle(site, 'Second')
    expect((await cmdPublish(site.slug, { cwd: site.cwd!, message: 'second' })).id).toBe(2)
    await checkoutRevision(site.store, site.slug, 1)
    const afterCheckout = await cmdPublish(site.slug, { cwd: site.cwd!, message: 'back to one' })
    expect(afterCheckout.published).toBe(true)
    expect(afterCheckout.id).toBe(3)
  })

  it('test_UAT_AC1420_an_invalid_draft_publishes_nothing_and_fails_before_any_write', async () => {
    // ── ARRANGE — a published site, and a builder over its tree.
    const site = freshSite()
    const builder = await builderFor(site)
    const publish = (message: string): Promise<Response> =>
      fetch(new URL('/api/publish', builder.url), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug: site.slug, message }),
      })

    expect((await publish('first')).status).toBe(200)
    const before = await site.store.readRevision(site.slug, 1)
    expect(before).not.toBeNull()

    // A draft that cannot validate — `site.json` replaced with something that is
    // not a site definition at all.
    await site.store.write(site.slug, { siteJson: { nonsense: true } })

    // ── ACT
    const refused = await publish('this cannot work')

    // ── ASSERT — the AUTHOR's error, not the server's: a bad-request answer
    // carrying the list of path-pointed validation errors, so the caller can say
    // which field is wrong rather than "publish failed".
    expect(refused.status).toBe(400)
    const body = (await refused.json()) as {
      code: string
      errors: Array<{ path: string; message: string }>
    }
    expect(body.code).toBe('INVALID_DEFINITION')
    expect(body.errors.length).toBeGreaterThan(0)
    for (const e of body.errors) {
      expect(typeof e.path).toBe('string')
      expect(typeof e.message).toBe('string')
    }

    // ── ASSERT — NOTHING was written. Not a revision, not a log entry, not a
    // byte of output or frozen definition, and the lineage pointer is where it
    // was. Validation ran before any write, so there is no half-publish to undo.
    expect(await site.store.revisions(site.slug)).toHaveLength(1)
    expect(existsSync(revisionDir(ctxOf(site), site.slug, 2))).toBe(false)
    expect(await site.store.draftBase(site.slug)).toBe(1)

    // …and the currently live revision goes on serving exactly what it served
    // before — the frozen definition is untouched.
    expect(await site.store.readRevision(site.slug, 1)).toEqual(before)
  })

  it('test_UAT_AC1421_history_is_readable_and_a_checkout_re_parents_forward_only', async () => {
    // ── ARRANGE — two revisions with distinct messages, published normally.
    const site = freshSite()
    const builder = await builderFor(site)
    await cmdPublish(site.slug, { cwd: site.cwd!, message: 'first' })
    await retitle(site, 'Second')
    await cmdPublish(site.slug, { cwd: site.cwd!, message: 'second' })

    // ── ACT — read the history back through the builder.
    const listed = await fetch(new URL(`/api/revisions?slug=${site.slug}`, builder.url))

    // ── ASSERT — newest first, because that is the order the question is asked
    // in, and each entry carries what a history view needs.
    expect(listed.status).toBe(200)
    const history = (await listed.json()) as RevisionEntry[]
    expect(history.map((r) => r.id)).toEqual([2, 1])
    expect(history.map((r) => r.message)).toEqual(['second', 'first'])
    expect(history[0].basedOn).toBe(1)
    expect(history[1].basedOn).toBeNull()
    // The per-path change list, against the previous live revision: the page
    // changed and nothing else did, on the store's own keys.
    expect(history[0].changes.modified).toEqual(['pages/home.json'])
    expect(history[0].changes.added).toEqual([])
    expect(history[1].changes.added).toContain('site.json')
    // The audit digest is present and is NOT how a revision is addressed — the
    // two entries differ by it, and by nothing that resolves them.
    expect(history[0].sha).not.toBe(history[1].sha)
    for (const r of history) {
      expect(r.sha).toMatch(/^[0-9a-f]+$/)
      expect(typeof r.publishedAt).toBe('string')
      expect(r).toHaveProperty('by')
    }

    // ── ASSERT — a checkout of a DIRTY draft is refused BY NAME unless forced,
    // because the operation overwrites the draft wholesale.
    await retitle(site, 'Unpublished work')
    const dirty = await cli(site.cwd!, 'checkout', site.slug, '1')
    expect(dirty.error?.message).toMatch(/uncommitted changes/)
    expect(dirty.error?.message).toMatch(/--force/)
    expect(await site.store.draftBase(site.slug)).toBe(2)

    const forced = await cli(site.cwd!, 'checkout', site.slug, '1', '--force')
    expect(forced.error).toBeUndefined()
    expect(forced.out).toMatch(/Checked out revision r1/)

    // ── ACT/ASSERT — the checkout replaced the draft with r1's frozen
    // definition and RE-PARENTED it; it did not rewind the log.
    expect(await site.store.draftBase(site.slug)).toBe(1)
    expect((await site.store.readPages(site.slug))[0].page).toEqual(
      (await site.store.readRevision(site.slug, 1))!.pages[0].page,
    )

    const third = await publishSite(site.store, site.slug, { message: 'onwards' })
    expect(third.id).toBe(3)
    const after = await site.store.revisions(site.slug)
    expect(liveRevisionOf(after)).toBe(3)
    expect(after.find((r) => r.id === 3)!.basedOn).toBe(1)

    // Forward-only: r2 is still readable at its own location. A checkout adds a
    // revision, it never removes, renumbers or reuses one.
    expect(await site.store.readRevision(site.slug, 2)).not.toBeNull()
    expect(after.map((r) => r.id).sort()).toEqual([1, 2, 3])
  })

  it('test_UAT_AC894_publishing_always_renders_from_the_current_draft', async () => {
    // ── ARRANGE — a published site, whose rendered output is on disk.
    const STALE = 'STALE-BYTES-FROM-A-PREVIOUS-RENDER'
    const FRESH = 'The current draft says this.'
    const site = freshSite()
    await cmdPublish(site.slug, { cwd: site.cwd!, message: 'first' })

    // The draft moves on…
    await retitle(site, FRESH)
    // …and the previously rendered output is deliberately poisoned. If publish
    // ever treated existing output as an INPUT, this is the byte that would
    // survive into the next revision.
    const entry = path.join(publishedOut(site), 'index.html')
    writeFileSync(entry, `<!doctype html><html><body>${STALE}</body></html>`, 'utf8')
    expect(readFileSync(entry, 'utf8')).toContain(STALE)

    // ── ACT
    const second = await cmdPublish(site.slug, { cwd: site.cwd!, message: 'second' })
    expect(second.id).toBe(2)

    // ── ASSERT — the revision's stored entry page carries the CURRENT content
    // and does not carry the stale content. There is no way to publish stale
    // bytes: the render is from the definition just validated and frozen.
    const published = readFileSync(entry, 'utf8')
    expect(published).toContain(FRESH)
    expect(published).not.toContain(STALE)

    // The frozen definition stored beside it agrees — the two halves of a
    // revision cannot disagree with each other.
    const frozen = readFileSync(
      path.join(revisionDir(ctxOf(site), site.slug, 2), 'pages', 'home.json'),
      'utf8',
    )
    expect(frozen).toContain(FRESH)
    expect(frozen).not.toContain(STALE)
    expect((await site.store.readRevision(site.slug, 2))!.pages[0].page).toEqual(
      (await site.store.readPages(site.slug))[0].page,
    )

    // On the operator's own filesystem store, the local published output
    // directory was itself refreshed by the publish's own render — that is the
    // directory the local serve, screenshot and fidelity loops read, and the
    // publish reports it.
    expect(second.outDir).toBe(publishedOut(site))
    expect(readFileSync(path.join(second.outDir, 'home.html'), 'utf8')).toContain(FRESH)
  })

  it('test_UAT_AC892_a_revision_stores_both_halves_of_the_artifact', async () => {
    // ── ARRANGE — a freshly scaffolded site that holds an asset, so "the asset
    // bytes are present in both halves" is a question this site can answer.
    const LOGO = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>')
    const site = freshSite({ assets: { 'logo.svg': LOGO } })

    // ── ACT — the publish command, driven through the real `1c` entry point.
    const said = await cli(site.cwd!, 'publish', site.slug, '-m', 'launch')

    // ── ASSERT — and the report names the refreshed published output directory,
    // which is where the local serve, screenshot and fidelity loops read from.
    expect(said.error).toBeUndefined()
    expect(said.out).toMatch(/^Published revision r1 \(\d+ change\(s\)\) → /)
    expect(said.out).toContain(publishedOut(site))

    // ── ASSERT (half one) — the FROZEN DEFINITION: the site record and each
    // page record, under the revision's own location.
    const frozen = revisionDir(ctxOf(site), site.slug, 1)
    expect(existsSync(path.join(frozen, 'site.json'))).toBe(true)
    expect(existsSync(path.join(frozen, 'pages', 'home.json'))).toBe(true)
    expect(new Uint8Array(readFileSync(path.join(frozen, 'assets', 'logo.svg')))).toEqual(LOGO)

    // ── ASSERT (half two) — the RENDERED OUTPUT: the entry page document and
    // its stylesheet, as REAL rendered bytes rather than placeholders.
    const out = publishedOut(site)
    const html = readFileSync(path.join(out, 'index.html'), 'utf8')
    expect(html).toMatch(/^<!doctype html>/i)
    expect(html).toContain('theme.css')
    expect(html).toContain(site.slug)
    expect(readFileSync(path.join(out, 'theme.css'), 'utf8').length).toBeGreaterThan(0)
    // The asset travels into this half too, so a published page whose images
    // resolved only while the draft still held them cannot decay.
    expect(new Uint8Array(readFileSync(path.join(out, 'assets', 'logo.svg')))).toEqual(LOGO)

    // ── ASSERT — reading the revision back through the STORE yields the
    // definition it froze. This is the only copy of what the site looked like at
    // r1 — the mutable draft lives in the store — and it is what makes a
    // checkout of it possible at all.
    const read = await site.store.readRevision(site.slug, 1)
    expect(read!.siteJson).toEqual(await site.store.readSiteJson(site.slug))
    expect(read!.pages).toEqual(await site.store.readPages(site.slug))
    expect(read!.assets.map((a) => a.name)).toEqual(['logo.svg'])

    // ── ASSERT — a revision the record does not vouch for reads as ABSENT,
    // rather than as whatever bytes happen to be lying under its location.
    expect(await site.store.readRevision(site.slug, 7)).toBeNull()
  })
})
