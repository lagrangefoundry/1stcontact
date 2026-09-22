import {
  publishedOutPrefix,
  publishedSourcePrefix,
  type RevisionContent,
  type RevisionEntry,
} from '../../tools/generate/src/store/revision-model'
import { memorySiteStore, type MemorySiteSeed } from '../../tools/generate/src/store/memory-store'
import { publishSite } from '../../tools/generate/src/publish/publish'
import type { ImageLadder } from '../../tools/generate/src/publish/ladder'
import type { SiteDatabase } from '../../apps/public-site/src/site-store'

/**
 * A published site, as `public-site` finds it (REQ-149).
 *
 * WHY IT EXISTS. Until REQ-149 these suites seeded the bucket by running a real
 * `1c deploy` — which was the right instinct, because a hand-built fixture that
 * agrees with the implementation proves only that someone copied the layout
 * correctly once. `1c deploy` is gone, and faking D1's SQL well enough to run the
 * real adapter in a Node suite would be a bigger fake than the thing under test.
 *
 * SO THE LAYOUT IS NOT RESTATED HERE. Every key below is built by
 * {@link publishedOutPrefix} / {@link publishedSourcePrefix} — the same functions
 * `d1r2-store.ts` writes with and `site-store.ts` reads with. The fixture cannot
 * drift from the implementation because there is nothing in it to drift.
 *
 * WHAT IS STILL PROVEN END TO END, and where: the real publish → real R2 → real
 * `public-site` path runs against genuine bindings in
 * `test_UAT_FC_REQ-149_publish_in_the_cloud.workers.test.ts`. These node suites
 * are about the URL grammar and the header policy above it, which need bytes at
 * known keys and nothing more.
 */

/** An R2 bucket, faked at the binding — the one boundary the repo does not own. */
export class FakeBucket {
  /** Counts reads, so a test can prove a warm request never reached the store. */
  reads = 0

  constructor(readonly objects: Map<string, Buffer> = new Map()) {}

  async get(key: string) {
    this.reads++
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
    this.reads++
    const buf = this.objects.get(key)
    if (buf === undefined) return null
    return { key, size: buf.byteLength, httpEtag: `"${key.length}-${buf.byteLength}"` }
  }
}

/**
 * A D1 handle answering the one query {@link D1SiteStore} makes.
 *
 * Keyed by the SITE'S KEY, holding the live revision id — which is the whole of
 * what the real query computes, `MAX(id)` over that site's revision log. There
 * is no join to fake any more ([[REQ-190]]): the query used to reach
 * `site_revisions` THROUGH `published_sites`, because the URL carried a slug
 * with no business in it and something had to say whose revisions to serve. The
 * URL carries the site's key now, so the claim table is gone and one indexed
 * read answers it. A key with no entry answers `null`, which is how both "no
 * such site" and "never published" reach the Worker.
 */
export class FakeDatabase implements SiteDatabase {
  /** Counts queries, so a test can prove the store was memoised or cached past. */
  queries = 0

  constructor(
    readonly live: Map<string, number> = new Map(),
    /**
     * The host→site mapping, as `site_domains` holds it ([[REQ-258]]).
     *
     * EMPTY BY DEFAULT, WHICH IS THE PLATFORM'S OWN FRONT DOOR — a host with no
     * row is one where the root site is deployment configuration and every other
     * site is addressable under `/site/<key>/`. That is the behaviour every
     * suite written before this ticket asserts, so the default keeps them
     * asserting it rather than quietly putting them on a bound host.
     */
    readonly hosts: Map<string, { siteKey: string; canonicalHost?: string }> = new Map(),
  ) {}

  /**
   * TWO QUERIES NOW, AND THEY ARE TOLD APART BY THE TABLE THEY NAME.
   *
   * This used to ignore the SQL entirely and answer every call with a live
   * revision id, which was honest while there was one query. There are two, and
   * a fake that answered the host lookup with `{ live: … }` would hand the
   * resolver a row with no `site_id` — a host that resolves to a site whose key
   * is `undefined`, which is a shape the real database cannot produce and a
   * whole suite of confusing failures.
   */
  prepare(query: string) {
    const host = query.includes('site_domains')
    return {
      bind: (...values: unknown[]) => ({
        first: async <T,>(): Promise<T | null> => {
          this.queries++
          const arg = String(values[0])
          if (host) {
            const found = this.hosts.get(arg)
            if (!found) return null
            return { site_id: found.siteKey, canonical_host: found.canonicalHost ?? arg } as T
          }
          const found = this.live.get(arg)
          return { live: found ?? null } as T
        },
      }),
    }
  }
}

/** A published site: its rendered bytes in `bucket`, its live id in `db`. */
export interface PublishedFixture {
  bucket: FakeBucket
  db: FakeDatabase
  /**
   * The draft store behind each slug, kept across calls.
   *
   * Publishing twice must mint r1 then r2, which it only does if the second
   * publish sees the first one's log — a fresh store per call would mint r1
   * twice and quietly make "live is the highest revision" untestable.
   */
  drafts: Map<string, ReturnType<typeof memorySiteStore>>
}

/**
 * Seed `content` as revision `id` of `siteKey`, exactly where a publish would
 * put it.
 *
 * `content` is what `publishSite` hands the store, so a caller passes the output
 * of a real render rather than invented HTML — the bytes are the product's, and
 * only their destination is the fixture's business.
 */
export function seedPublished(
  fixture: PublishedFixture,
  siteKey: string,
  id: number,
  content: RevisionContent,
  /**
   * [[REQ-305]] — the delivery renditions, which no longer travel with `content`.
   *
   * A SEPARATE ARGUMENT BECAUSE THEY ARE A SEPARATE ACT NOW. A real publish
   * writes each rendition through the sink `beginRevision` opened, as it is
   * rendered, and `RevisionContent` carries only what the final act freezes. A
   * fixture relocating a publish's output therefore has two things to relocate,
   * and saying so is more honest than keeping a field on the content type that
   * the product never populates.
   */
  derived?: ReadonlyMap<string, Uint8Array>,
): void {
  const out = publishedOutPrefix(siteKey, id)
  for (const [rel, text] of content.out) {
    fixture.bucket.objects.set(`${out}/${rel}`, Buffer.from(text, 'utf8'))
  }
  // [[REQ-222]] — the delivery renditions, beside the pages that name them and
  // under `out/` only. They are NOT copied into `source/` below: a checkout
  // restores what the site is, and a rendition is not part of that.
  for (const [rel, bytes] of derived ?? []) {
    fixture.bucket.objects.set(`${out}/${rel}`, Buffer.from(bytes))
  }
  for (const { name, bytes } of content.source.assets) {
    fixture.bucket.objects.set(`${out}/assets/${name}`, Buffer.from(bytes))
  }

  const source = publishedSourcePrefix(siteKey, id)
  if (content.source.siteJson !== null) {
    fixture.bucket.objects.set(
      `${source}/site.json`,
      Buffer.from(JSON.stringify(content.source.siteJson, null, 2), 'utf8'),
    )
  }
  for (const { name, page } of content.source.pages) {
    fixture.bucket.objects.set(
      `${source}/pages/${name}`,
      Buffer.from(JSON.stringify(page, null, 2), 'utf8'),
    )
  }
  for (const { name, bytes } of content.source.assets) {
    fixture.bucket.objects.set(`${source}/assets/${name}`, Buffer.from(bytes))
  }

  // Live is the HIGHEST id, derived exactly as the real query derives it — a
  // fixture that let an older publish win would be testing a rule the product
  // does not have.
  const current = fixture.db.live.get(siteKey)
  if (current === undefined || id > current) fixture.db.live.set(siteKey, id)
}

export function emptyPublished(): PublishedFixture {
  return { bucket: new FakeBucket(), db: new FakeDatabase(), drafts: new Map() }
}

/**
 * Run a REAL publish and put its output where `public-site` will look for it.
 *
 * This is the part that keeps these suites honest. The bytes are produced by
 * `publishSite` — the same function the Worker's `/api/publish` calls — rendering
 * the same definition through the same renderer; the fixture's only contribution
 * is to relocate them into a fake bucket, at keys the shared key builders decide.
 * So a test asserting "the served page contains X" is asserting something about
 * the product's render, not about a string this file wrote.
 *
 * The in-memory adapter is the store because it is the one with no filesystem
 * and no database to stand up — and, since REQ-149, a full revision store.
 */
export async function publishInto(
  fixture: PublishedFixture,
  slug: string,
  seed: MemorySiteSeed,
  /**
   * [[REQ-222]] — the delivery ladder this publish builds, if any.
   *
   * OPTIONAL, because the overwhelming majority of these suites are about the
   * URL grammar and the header policy and want the publish they have always had.
   * A caller that passes one is asserting something about renditions, and gets
   * them at the keys the real publish chose rather than at keys it invented.
   */
  ladder?: ImageLadder,
): Promise<{
  id: number
  content: RevisionContent
  /** [[REQ-305]] — the renditions this publish streamed, beside the content it froze. */
  derived: ReadonlyMap<string, Uint8Array>
}> {
  let store = fixture.drafts.get(slug)
  if (!store) {
    store = memorySiteStore()
    fixture.drafts.set(slug, store)
    store.seed(slug, seed)
  } else {
    // A SECOND publish moves the draft rather than re-seeding it. `seed` creates
    // a site outright — empty log included — so seeding again would discard r1
    // and mint r1 a second time, quietly making "live is the highest revision"
    // untestable. Moving the draft through `write` is also what an edit does,
    // which is how a second revision comes about in real use.
    await store.write(slug, {
      siteJson: seed.siteJson,
      pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page })),
      assets: Object.entries(seed.assets ?? {}).map(([name, bytes]) => ({ name, bytes })),
    })
  }
  const result = await publishSite(store, slug, { ladder })
  const source = await store.readRevision(slug, result.id)
  const out = store.renderedRevision(slug, result.id)
  if (source === null || out === null) {
    throw new Error(`publish produced no revision for '${slug}'`)
  }
  const content: RevisionContent = { source, out }
  const derived = store.derivedRevision(slug, result.id) ?? new Map<string, Uint8Array>()
  seedPublished(fixture, slug, result.id, content, derived)
  return { id: result.id, content, derived }
}

/** A revision entry with the boring fields filled in, for a fixture's convenience. */
export function fixtureRevision(id: number, overrides: Partial<RevisionEntry> = {}): RevisionEntry {
  return {
    id,
    publishedAt: '2026-07-30T12:00:00.000Z',
    message: '',
    by: null,
    basedOn: null,
    changes: { added: [], modified: [], removed: [] },
    sha: '0'.repeat(12),
    ...overrides,
  }
}
