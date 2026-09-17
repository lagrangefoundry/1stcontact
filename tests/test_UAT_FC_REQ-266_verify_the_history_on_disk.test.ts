import fs from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { cmdVerify } from '../tools/generate/src/cli/commands'
import { publishSite, verifyRevisions } from '../tools/generate/src/publish/publish'
import { RevisionIntegrityError } from '../tools/generate/src/store/revision-model'
import { makeFsSite } from './support/site-factory'
import type { SiteFixture } from './support/site-seed'

/**
 * [[REQ-266]] §4, §5 — **the same refusal and the same walk on the operator's
 * own disk.**
 *
 * WHY THIS TIER GETS ITS OWN CASES RATHER THAN RIDING ON THE WORKERS SUITE. §4
 * names `readRevision`, and three adapters answer that verb. Wiring the
 * comparison into the cloud one alone would have left §5's walk reporting
 * "sound" for every revision on the file-backed tier — where `history.json` and
 * `revisions/NNNN/` are two files anybody with the checkout can edit, and where
 * `1c checkout` is the command that would restore them. So the comparison is one
 * shared helper and every adapter calls it, and this is where that is asserted
 * for the tier the workers suite cannot reach.
 *
 * IT ALSO PROVES THE OPERATION HAS A CALLER. `1c verify <slug>` is what makes
 * "is our published history intact?" answerable without checking every revision
 * out by hand, and a walk only a test can reach is not an answer to that.
 */

let fixture: SiteFixture | null = null

afterEach(async () => {
  await fixture?.dispose()
  fixture = null
})

/** The revision's frozen `site.json` on disk — what a checkout would restore. */
function revisionSiteJson(site: SiteFixture, id: number): string {
  return path.join(
    site.cwd as string,
    'storage',
    'sites',
    site.slug,
    'revisions',
    String(id).padStart(4, '0'),
    'site.json',
  )
}

describe('REQ-266 — a revision on disk is verified against the log', () => {
  it('test_UAT_FC_REQ-266_an_altered_revision_directory_fails_to_read', async () => {
    fixture = makeFsSite()
    expect((await publishSite(fixture.store, fixture.slug, { message: 'first' })).id).toBe(1)

    // A sound revision reads, first — otherwise the refusal below is
    // indistinguishable from a check that refuses everything.
    expect(await fixture.store.readRevision(fixture.slug, 1)).not.toBeNull()

    // THE TAMPER IS IN THE FROZEN DEFINITION AND NOWHERE ELSE. `history.json`
    // still records the digest of what was published, so the log goes on saying
    // this revision is sound — which is the gap the comparison closes.
    fs.writeFileSync(revisionSiteJson(fixture, 1), JSON.stringify({ id: 'tampered' }), 'utf8')

    await expect(fixture.store.readRevision(fixture.slug, 1)).rejects.toBeInstanceOf(
      RevisionIntegrityError,
    )
  })

  it('test_UAT_FC_REQ-266_1c_verify_names_the_altered_revision_and_only_it', async () => {
    fixture = makeFsSite()
    await publishSite(fixture.store, fixture.slug, { message: 'first' })

    const pages = await fixture.store.readPages(fixture.slug)
    const edited = structuredClone(pages[0].page) as Record<string, unknown>
    edited.title = 'Second'
    await fixture.store.write(fixture.slug, { pages: [{ name: pages[0].name, page: edited }] })
    expect((await publishSite(fixture.store, fixture.slug, { message: 'second' })).id).toBe(2)

    const opts = { cwd: fixture.cwd as string }
    expect(await cmdVerify(fixture.slug, opts)).toEqual({ checked: 2, mismatches: [] })

    fs.writeFileSync(revisionSiteJson(fixture, 1), JSON.stringify({ id: 'tampered' }), 'utf8')

    // EXACTLY THE ALTERED ONE, AND THROUGH THE COMMAND. `cmdVerify` is a thin
    // client of `verifyRevisions` over the filesystem store, exactly as
    // `cmdPublish` is of `publishSite` — so asserting on it proves the operator
    // has a way to ask the question, not merely that the function exists.
    const report = await cmdVerify(fixture.slug, opts)
    expect(report.checked).toBe(2)
    expect(report.mismatches.map((m) => m.id)).toEqual([1])
    expect(report.mismatches[0].expected).not.toBe(report.mismatches[0].actual)

    // The walk does not stop at the first mismatch, and the second revision is
    // still readable — a tampered r1 must not take r2 down with it.
    expect(await fixture.store.readRevision(fixture.slug, 2)).not.toBeNull()
    expect(await verifyRevisions(fixture.store, fixture.slug)).toEqual(report)
  })
})
