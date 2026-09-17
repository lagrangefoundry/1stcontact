import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import type { SiteStoreEnv, TenantSiteStore } from '../tools/generate/src/store/d1r2-store'
import {
  checkoutRevision,
  publishSite,
  verifyRevisions,
} from '../tools/generate/src/publish/publish'
import {
  publishedPrefix,
  publishedSourcePrefix,
  RevisionExistsError,
  RevisionIntegrityError,
} from '../tools/generate/src/store/revision-model'
import { applySchema, tenantStore } from './support/d1-site-factory'
import { siteSeed } from './support/site-seed'

/**
 * [[REQ-266]] — **a published revision is immutable by ENFORCEMENT, not by
 * convention.**
 *
 * THE CLAIM, AND WHY IT NEEDED A TICKET. Nothing here was broken: the publish
 * path is the only writer of a revision and it behaves. What it was not, was
 * guaranteed. Four properties everyone relied on were properties of careful
 * code rather than of the substrate — no trigger forbade rewriting a revision
 * row, the bytes landed before the primary key that would have refused them, the
 * digest was computed and stored and never once compared, and two publishes
 * could mint the same id and interleave into one prefix. [[DOC-2]]'s line is
 * that security and reliability posture belongs to the substrate; this suite is
 * where that line is drawn for revisions.
 *
 * WHY IT RUNS IN WORKERD AGAINST REAL BINDINGS. Three of the four properties are
 * enforced by things a fake cannot have: a SQLite trigger, a primary key on a
 * claims table, and objects in a bucket that can be altered behind the store's
 * back. A node-side test of the same functions would pass while proving nothing
 * — which is the exact shape of the gap this ticket closes.
 *
 * THE FALSIFIER FOR THE WHOLE TICKET, and every case below is one reading of it:
 * *alter a published revision's bytes in the bucket and have anything in the
 * product serve, check out, or report them as sound.*
 */

const TENANT = 'req266'
const SITES = (): R2Bucket => env.SITES as R2Bucket
const DB = (): D1Database => env.DB as D1Database

beforeAll(async () => {
  await applySchema()
})

/** A fresh site with one revision published, through the real publish service. */
async function publishedSite(): Promise<{ store: TenantSiteStore; site: string }> {
  const store = await tenantStore(TENANT)
  const seed = siteSeed()
  const site = await store.createDraft()
  await store.write(site, {
    siteJson: seed.siteJson,
    pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page })),
  })
  const result = await publishSite(store, site, { message: 'first' })
  expect(result.published).toBe(true)
  return { store, site }
}

/** Move the draft, so the next publish has something to mint for. */
async function editDraft(store: TenantSiteStore, site: string, title: string): Promise<void> {
  const pages = await store.readPages(site)
  const edited = structuredClone(pages[0].page) as Record<string, unknown>
  edited.title = title
  await store.write(site, { pages: [{ name: pages[0].name, page: edited }] })
}

/**
 * Every object under a prefix, as `key -> bytes`.
 *
 * READ BACK RATHER THAN LISTED. A listing proves a key exists; the assertion
 * that matters in the refusal case is that the CONTENT is the content the first
 * publish wrote, because `put` overwrites in place and a second write into one
 * revision's prefix leaves the key count exactly as it found it.
 */
async function objectsUnder(prefix: string): Promise<Map<string, string>> {
  const held = new Map<string, string>()
  const listed = await SITES().list({ prefix, limit: 1000 })
  for (const object of listed.objects) {
    const body = await SITES().get(object.key)
    held.set(object.key, body === null ? '' : await body.text())
  }
  return held
}

describe('REQ-266 §1 — a revision row cannot be rewritten', () => {
  it('test_UAT_FC_REQ-266_an_update_to_a_published_revision_row_is_refused', async () => {
    const { site } = await publishedSite()
    const before = await DB()
      .prepare('SELECT published_at, published_by, message, based_on, changes, sha ' +
        'FROM site_revisions WHERE site_id = ? AND id = 1')
      .bind(site)
      .first<Record<string, unknown>>()
    expect(before).not.toBeNull()

    // EVERY COLUMN, NOT ONE. A trigger that fired on `sha` alone would leave the
    // message, the author and the change list rewritable — and a revision whose
    // `changes` had been edited reads perfectly and is untrue, which is the
    // silent failure `contact_events` already refuses one table over.
    for (const statement of [
      'UPDATE site_revisions SET sha = ? WHERE site_id = ? AND id = 1',
      'UPDATE site_revisions SET message = ? WHERE site_id = ? AND id = 1',
      'UPDATE site_revisions SET published_by = ? WHERE site_id = ? AND id = 1',
      'UPDATE site_revisions SET changes = ? WHERE site_id = ? AND id = 1',
      'UPDATE site_revisions SET published_at = ? WHERE site_id = ? AND id = 1',
    ]) {
      await expect(DB().prepare(statement).bind('tampered', site).run()).rejects.toThrow()
    }

    // AND THE ROW IS UNTOUCHED, which is the half a refusal alone would not
    // prove: a statement that threw AFTER writing would fail the same assertion
    // above and leave the history quietly rewritten.
    const after = await DB()
      .prepare('SELECT published_at, published_by, message, based_on, changes, sha ' +
        'FROM site_revisions WHERE site_id = ? AND id = 1')
      .bind(site)
      .first<Record<string, unknown>>()
    expect(after).toEqual(before)
  })
})

describe('REQ-266 §2, §3 — the id is claimed before a byte is written', () => {
  it('test_UAT_FC_REQ-266_writing_a_published_revision_id_refuses_and_writes_no_object', async () => {
    const { store, site } = await publishedSite()
    const prefix = publishedPrefix(site, 1)
    const before = await objectsUnder(prefix)
    expect(before.size).toBeGreaterThan(0)

    // A caller arriving with an id it did not mint, carrying DIFFERENT content.
    // Before this ticket every `put` below landed — overwriting revision 1's
    // objects one at a time — and only then did the primary key refuse the row,
    // leaving the log naming a revision whose bytes were somebody else's.
    await expect(
      store.writeRevision(
        site,
        {
          id: 1,
          publishedAt: '2026-09-17T00:00:00.000Z',
          message: 'second attempt at r1',
          by: null,
          basedOn: null,
          changes: { added: [], modified: [], removed: [] },
          sha: 'deadbeefcafe',
        },
        {
          source: { siteJson: { id: 'intruder' }, pages: [], assets: [] },
          out: new Map([['index.html', '<!doctype html><title>Intruder</title>']]),
        },
      ),
    ).rejects.toBeInstanceOf(RevisionExistsError)

    // THE ASSERTION IS ON THE BUCKET, not on the return value. "It threw" is
    // exactly what the primary key already gave us; what was missing was that
    // nothing had been written by the time it did.
    expect(await objectsUnder(prefix)).toEqual(before)
  })

  it('test_UAT_FC_REQ-266_two_concurrent_publishes_never_share_one_revision', async () => {
    const { store, site } = await publishedSite()
    await editDraft(store, site, 'Second')

    // BOTH READ BEFORE EITHER WRITES, which is the race exactly. `publishSite`
    // awaits several times between reading the log and writing the revision, so
    // two of them started together both see live = r1, both compute a non-empty
    // change set, and both go on to mint. Before the claim table they both
    // `put` into `rev/0002/` and one `INSERT` won, leaving a revision holding a
    // mixture with a digest describing neither half.
    const outcomes = await Promise.allSettled([
      publishSite(store, site, { message: 'a' }),
      publishSite(store, site, { message: 'b' }),
    ])

    const minted = outcomes
      .filter((o) => o.status === 'fulfilled')
      .map((o) => (o as PromiseFulfilledResult<{ id: number }>).value.id)
    const refused = outcomes.filter((o) => o.status === 'rejected')

    // EITHER OUTCOME IS CORRECT AND A MIXTURE IS NOT. Two distinct revisions is
    // the serialised case; one publish and one refusal is the raced case. What
    // must never happen is two publishes agreeing on one id.
    expect(new Set(minted).size).toBe(minted.length)
    for (const outcome of refused) {
      expect((outcome as PromiseRejectedResult).reason).toBeInstanceOf(RevisionExistsError)
    }

    // AND EVERY REVISION THAT EXISTS VERIFIES. This is the "never one revision
    // holding a mix" half, asserted where a mix would actually show: a prefix
    // written by two publishes cannot match either one's digest.
    const report = await verifyRevisions(store, site)
    expect(report.mismatches).toEqual([])
    expect(report.checked).toBe(1 + minted.length)
  })
})

describe('REQ-266 §4 — a revision is verified against its own digest', () => {
  it('test_UAT_FC_REQ-266_an_altered_revision_fails_read_and_fails_checkout', async () => {
    const { store, site } = await publishedSite()

    // THE TAMPER IS IN THE BUCKET AND NOWHERE ELSE — the row is untouched, so
    // the log still says revision 1 is sound. That gap is the whole subject: a
    // bucket is reachable by more than this store, and until now "the objects
    // under this prefix are the ones the publish wrote" was a property of nobody
    // having touched them.
    const key = `${publishedSourcePrefix(site, 1)}/site.json`
    const original = await SITES().get(key)
    expect(original).not.toBeNull()
    await SITES().put(key, JSON.stringify({ id: 'tampered' }, null, 2), {
      httpMetadata: { contentType: 'application/json' },
    })

    await expect(store.readRevision(site, 1)).rejects.toBeInstanceOf(RevisionIntegrityError)

    // THE PATH THAT MATTERS. A restore must not restore tampered bytes, and
    // `checkoutRevision` inherits the refusal by reading through `readRevision`
    // rather than by carrying a check of its own.
    await expect(checkoutRevision(store, site, 1, { force: true })).rejects.toBeInstanceOf(
      RevisionIntegrityError,
    )

    // THE REFUSAL NAMES BOTH DIGESTS, because that is the whole content of the
    // answer: what the log says this revision is, and what the store holds.
    const failure = await store.readRevision(site, 1).catch((err: unknown) => err)
    expect(failure).toBeInstanceOf(RevisionIntegrityError)
    const integrity = failure as RevisionIntegrityError
    expect(integrity.expected).not.toBe(integrity.actual)
    expect(integrity.id).toBe(1)
  })

  it('test_UAT_FC_REQ-266_an_unaltered_revision_reads_and_checks_out', async () => {
    // THE OTHER HALF OF THE SAME CLAIM, and it has to be asserted separately: a
    // check that refused everything would pass every case above and make the
    // product unusable.
    const { store, site } = await publishedSite()
    const snapshot = await store.readRevision(site, 1)
    expect(snapshot).not.toBeNull()
    expect(snapshot?.pages.length).toBeGreaterThan(0)
    await expect(checkoutRevision(store, site, 1, { force: true })).resolves.toEqual({ id: 1 })
  })
})

describe('REQ-266 §5 — integrity is checkable over a whole site', () => {
  it('test_UAT_FC_REQ-266_the_integrity_walk_names_exactly_the_altered_revision', async () => {
    const { store, site } = await publishedSite()
    await editDraft(store, site, 'Second')
    expect((await publishSite(store, site, { message: 'second' })).id).toBe(2)

    // A CLEAN HISTORY REPORTS NOTHING, first — otherwise "it named r1" would be
    // indistinguishable from "it names everything".
    expect(await verifyRevisions(store, site)).toEqual({ checked: 2, mismatches: [] })

    const key = `${publishedSourcePrefix(site, 1)}/site.json`
    await SITES().put(key, JSON.stringify({ id: 'tampered' }, null, 2), {
      httpMetadata: { contentType: 'application/json' },
    })

    // EXACTLY THE ALTERED ONE. The question an operator asks is "is our
    // published history intact?", and the answer has to distinguish the one
    // revision that is not from the one that is — a walk that refused on the
    // first mismatch would hide every later revision behind it, and one that
    // reported the whole site would not be an answer at all.
    const report = await verifyRevisions(store, site)
    expect(report.checked).toBe(2)
    expect(report.mismatches.map((m) => m.id)).toEqual([1])
    expect(report.mismatches[0].expected).not.toBe(report.mismatches[0].actual)
  })
})
