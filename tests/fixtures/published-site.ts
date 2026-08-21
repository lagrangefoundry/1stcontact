import {
  publishedOutPrefix,
  publishedSourcePrefix,
  type RevisionContent,
  type RevisionEntry,
} from '../../tools/generate/src/store/revision-model'
import { memorySiteStore, type MemorySiteSeed } from '../../tools/generate/src/store/memory-store'
import { publishSite } from '../../tools/generate/src/publish/publish'
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
 * Keyed by slug, holding the live revision id — which is the whole of what the
 * real query computes (`MAX(id)` over the revision log, joined through the
 * published-slug claim). A slug with no entry answers `null`, which is how both
 * "no such site" and "never published" reach the Worker.
 */
export class FakeDatabase implements SiteDatabase {
  /** Counts queries, so a test can prove the store was memoised or cached past. */
  queries = 0

  constructor(readonly live: Map<string, number> = new Map()) {}

  prepare(_query: string) {
    return {
      bind: (...values: unknown[]) => ({
        first: async <T,>(): Promise<T | null> => {
          this.queries++
          const slug = String(values[0])
          const found = this.live.get(slug)
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
 * Seed `content` as revision `id` of `slug`, exactly where a publish would put it.
 *
 * `content` is what `publishSite` hands the store, so a caller passes the output
 * of a real render rather than invented HTML — the bytes are the product's, and
 * only their destination is the fixture's business.
 */
export function seedPublished(
  fixture: PublishedFixture,
  slug: string,
  id: number,
  content: RevisionContent,
): void {
  const out = publishedOutPrefix(slug, id)
  for (const [rel, text] of content.out) {
    fixture.bucket.objects.set(`${out}/${rel}`, Buffer.from(text, 'utf8'))
  }
  for (const { name, bytes } of content.source.assets) {
    fixture.bucket.objects.set(`${out}/assets/${name}`, Buffer.from(bytes))
  }

  const source = publishedSourcePrefix(slug, id)
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
  const current = fixture.db.live.get(slug)
  if (current === undefined || id > current) fixture.db.live.set(slug, id)
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
): Promise<{ id: number; content: RevisionContent }> {
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
  const result = await publishSite(store, slug)
  const source = await store.readRevision(slug, result.id)
  const out = store.renderedRevision(slug, result.id)
  if (source === null || out === null) {
    throw new Error(`publish produced no revision for '${slug}'`)
  }
  const content: RevisionContent = { source, out }
  seedPublished(fixture, slug, result.id, content)
  return { id: result.id, content }
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
