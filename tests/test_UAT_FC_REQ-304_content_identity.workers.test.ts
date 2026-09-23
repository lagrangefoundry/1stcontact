import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import publicSite, { type Env as PublicEnv } from '../apps/public-site/src/index'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import { contentDigest } from '../tools/generate/src/store/digest'
import {
  checkoutRevision,
  pendingChanges,
  publishSite,
  verifyRevisions,
} from '../tools/generate/src/publish/publish'
import {
  blobKey,
  publishedAssetManifestKey,
  publishedSourcePrefix,
  snapshotSha,
  type StoredAssetManifest,
} from '../tools/generate/src/store/revision-model'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'

/**
 * REQ-304 — publish compares and freezes assets by content IDENTITY, in the
 * cloud tier, against real D1 and a real R2 bucket.
 *
 * WHY THIS TIER IS THE ONE THAT MATTERS. The fault was observed here and only
 * here: `publishSite` held the live revision, the draft and a latin-1 string of
 * every picture on the site live at once, against a 128 MB isolate, which put
 * the ceiling at roughly a dozen photographs. A real client (50 MB of assets)
 * could not publish at all. Everything below is asked of the store the product
 * actually runs on, with the reads and writes COUNTED — because "it does not
 * read the pictures" is a claim about work performed, and an assertion on the
 * answer would pass whether the work happened or not.
 *
 * THE COUNTING BUCKET IS A WRAPPER AND NOT A FAKE. It delegates every call to
 * the real `env.SITES` and records the key; what is under test is the number of
 * object operations a publish makes, so substituting a fake bucket would be
 * substituting the thing being measured.
 */

let TENANT = 'req304'
let seq = 0

/** Every key the store reached for, in order, with the real bucket underneath. */
interface Counting {
  bucket: R2Bucket
  gets: string[]
  puts: string[]
  heads: string[]
  reset(): void
}

function countingBucket(): Counting {
  const real = env.SITES
  const gets: string[] = []
  const puts: string[] = []
  const heads: string[] = []
  const bucket = {
    get: (key: string, ...rest: unknown[]) => {
      gets.push(key)
      return (real.get as (...a: unknown[]) => unknown)(key, ...rest)
    },
    put: (key: string, ...rest: unknown[]) => {
      puts.push(key)
      return (real.put as (...a: unknown[]) => unknown)(key, ...rest)
    },
    head: (key: string, ...rest: unknown[]) => {
      heads.push(key)
      return (real.head as (...a: unknown[]) => unknown)(key, ...rest)
    },
    delete: (...a: unknown[]) => (real.delete as (...x: unknown[]) => unknown)(...a),
    list: (...a: unknown[]) => (real.list as (...x: unknown[]) => unknown)(...a),
  } as unknown as R2Bucket
  return {
    bucket,
    gets,
    puts,
    heads,
    reset: () => {
      gets.length = 0
      puts.length = 0
      heads.length = 0
    },
  }
}

/** A picture, big enough that reading one is visibly different from not. */
function picture(seedByte: number, size = 64_000): Uint8Array {
  const bytes = new Uint8Array(size)
  for (let i = 0; i < size; i += 1) bytes[i] = (i * 31 + seedByte) % 256
  return bytes
}

/** A tenant-scoped store over a counting bucket, and a site with two pictures. */
async function siteWithPictures(counting: Counting) {
  const platform = d1r2SiteStore({ DB: env.DB, SITES: counting.bucket })
  await platform.createTenant({ id: TENANT, name: TENANT, status: 'active' })
  const store = await platform.forTenant(TENANT)
  const seed = siteSeed({ slug: nextSlug('req304') })
  const site = await store.createDraft()
  await store.write(site, {
    siteJson: seed.siteJson,
    pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page })),
    assets: [
      { name: 'hero.png', bytes: picture(1) },
      { name: 'mark.png', bytes: picture(2) },
    ],
  })
  return { store, site }
}

/** Drive `public-site`'s own entry point, over the real bucket. */
async function serve(path: string): Promise<Response> {
  const waits: Promise<unknown>[] = []
  const ctx = {
    waitUntil: (p: Promise<unknown>) => void waits.push(p),
    passThroughOnException: () => {},
    props: {},
  }
  const res = await publicSite.fetch(
    new Request(`https://1stcontact.io${path}`, { method: 'GET' }),
    { SITES: env.SITES, DB: env.DB } as PublicEnv,
    ctx as unknown as ExecutionContext,
  )
  await Promise.all(waits)
  return res
}

/** Whether a key names asset CONTENT rather than a record about it. */
const isAssetContent = (key: string): boolean =>
  key.includes('/blob/') || /\/assets\/(?!d\/)/.test(key)

describe('REQ-304 — an asset is identified by its content', () => {
  beforeAll(async () => {
    await applySchema()
  })
  beforeEach(() => {
    TENANT = `req304-${(seq += 1)}`
  })

  it('test_UAT_FC_REQ-304_a_write_records_the_digest_and_addresses_the_object_by_it', async () => {
    // REQUIREMENT 1. The digest is established when the asset is WRITTEN and
    // sits beside `name`, `r2_key` and `size` — so asking what a site holds is
    // an indexed query rather than a bucket's worth of reads.
    const counting = countingBucket()
    const { store, site } = await siteWithPictures(counting)

    const refs = await store.assetManifest(site)
    expect(refs.map((r) => r.name)).toEqual(['hero.png', 'mark.png'])
    // The recorded identity is the real SHA-256 of the real bytes — not a
    // truncation, not a length, not something only this store could reproduce.
    expect(refs[0].digest).toBe(await contentDigest(picture(1)))
    expect(refs[0].size).toBe(64_000)

    // AND THE BYTES LIVE AT THAT IDENTITY. One immutable object per content,
    // under the site's own root, which is what lets the draft, every revision
    // that freezes it and the served site all name the same object.
    const row = await env.DB.prepare(
      'SELECT r2_key, digest FROM site_assets WHERE site_id = ? AND name = ?',
    )
      .bind(site, 'hero.png')
      .first<{ r2_key: string; digest: string }>()
    expect(row?.digest).toBe(refs[0].digest)
    expect(row?.r2_key).toBe(blobKey(site, refs[0].digest))
    expect(await env.SITES.head(blobKey(site, refs[0].digest))).not.toBeNull()

    // REQUIREMENT 1, THE HALF THAT IS ABOUT COST: reading the listing back
    // touches the bucket not at all.
    counting.reset()
    await store.assetManifest(site)
    expect(counting.gets).toEqual([])
    expect(counting.heads).toEqual([])
  })

  it('test_UAT_FC_REQ-304_asking_what_changed_reads_no_asset_bytes', async () => {
    // REQUIREMENT 2 and the consequence for REQ-303: `pendingChanges` is what
    // the per-turn site digest calls, so this runs before every model turn. It
    // used to read the live revision whole AND the draft whole, asset bytes
    // included, to compare two strings.
    const counting = countingBucket()
    const { store, site } = await siteWithPictures(counting)
    await publishSite(store, site, {})

    counting.reset()
    const clean = await pendingChanges(store, site)
    expect(clean.modified).toEqual([])
    expect(clean.added).toEqual([])
    expect(counting.gets.filter(isAssetContent)).toEqual([])

    // AND WHEN SOMETHING DID CHANGE, still no asset bytes — the diff is over
    // identities, so it costs the same whether the answer is yes or no.
    await store.write(site, {
      pages: [{ name: 'home.json', page: { ...(await store.readPages(site))[0].page, title: 'X' } }],
    })
    counting.reset()
    expect((await pendingChanges(store, site)).modified).toEqual(['pages/home.json'])
    expect(counting.gets.filter(isAssetContent)).toEqual([])
  })

  it('test_UAT_FC_REQ-304_an_asset_changed_in_place_is_still_reported_modified', async () => {
    // REQUIREMENT 2's CRUX, and the property that makes the comparison worth
    // doing at all. A name and a length are not an identity: two different
    // photographs of the same length under one name must not read as unchanged,
    // or a publish would freeze a revision describing a picture nobody uploaded.
    const counting = countingBucket()
    const { store, site } = await siteWithPictures(counting)
    await publishSite(store, site, {})

    const replacement = picture(99)
    expect(replacement.byteLength).toBe(64_000) // same name, same size…
    await store.write(site, { assets: [{ name: 'hero.png', bytes: replacement }] })

    counting.reset()
    const pending = await pendingChanges(store, site)
    expect(pending.modified).toEqual(['assets/hero.png'])
    // …and still decided without reading either version.
    expect(counting.gets.filter(isAssetContent)).toEqual([])
  })

  it('test_UAT_FC_REQ-304_freezing_a_revision_moves_no_asset_bytes', async () => {
    // REQUIREMENTS 3, 4 and 5, and the acceptance bullet "publishing a site
    // with no asset changes reads and writes no asset bytes".
    const counting = countingBucket()
    const { store, site } = await siteWithPictures(counting)

    counting.reset()
    const first = await publishSite(store, site, {})
    expect(first.published).toBe(true)
    // THE FIRST PUBLISH ALREADY MOVES NONE OF THEM. The bytes were placed when
    // the asset was written; freezing records WHICH content each name was.
    expect(counting.puts.filter(isAssetContent)).toEqual([])
    expect(counting.gets.filter(isAssetContent)).toEqual([])

    // What it wrote instead is one small manifest, and no copy under the
    // revision's own prefix.
    const manifestObject = await env.SITES.get(publishedAssetManifestKey(site, first.id))
    expect(manifestObject).not.toBeNull()
    const manifest = JSON.parse(await manifestObject!.text()) as StoredAssetManifest
    expect(Object.keys(manifest.assets).sort()).toEqual(['hero.png', 'mark.png'])
    expect(manifest.assets['hero.png'].digest).toBe(await contentDigest(picture(1)))
    const frozen = await env.SITES.list({
      prefix: `${publishedSourcePrefix(site, first.id)}/assets/`,
      limit: 100,
    })
    expect(frozen.objects.map((o) => o.key)).toEqual([])

    // REQUIREMENT 5 — a republish costs what CHANGED. One page edited, two
    // pictures untouched: not one asset byte moves.
    await store.write(site, {
      pages: [{ name: 'home.json', page: { ...(await store.readPages(site))[0].page, title: 'Y' } }],
    })
    counting.reset()
    const second = await publishSite(store, site, {})
    expect(second.published).toBe(true)
    expect(counting.puts.filter(isAssetContent)).toEqual([])
    expect(counting.gets.filter(isAssetContent)).toEqual([])

    // And both revisions name the same one object for the same content, which
    // is what makes a site's storage grow with its content rather than with its
    // publish count.
    const later = JSON.parse(
      await (await env.SITES.get(publishedAssetManifestKey(site, second.id)))!.text(),
    ) as StoredAssetManifest
    expect(later.assets['hero.png'].digest).toBe(manifest.assets['hero.png'].digest)
  })

  it('test_UAT_FC_REQ-304_a_checkout_restores_the_pictures_by_reference', async () => {
    // REQUIREMENT 4's other half. A revision is a manifest of digests over
    // immutable blobs, so restoring a year-old revision of a picture-heavy site
    // is a pointer move — the bytes it names are already in the bucket.
    const counting = countingBucket()
    const { store, site } = await siteWithPictures(counting)
    const first = await publishSite(store, site, {})

    // Replace one picture and publish again, so r1 and the draft genuinely
    // disagree about what `hero.png` is.
    await store.write(site, { assets: [{ name: 'hero.png', bytes: picture(99) }] })
    await publishSite(store, site, {})
    expect(await store.readAsset(site, 'hero.png')).toEqual(picture(99))

    counting.reset()
    await checkoutRevision(store, site, first.id)
    expect(counting.puts.filter(isAssetContent)).toEqual([])
    expect(counting.gets.filter(isAssetContent)).toEqual([])

    // AND THE RESTORE IS REAL. The draft holds r1's picture again, byte for
    // byte — a pointer move that restored the wrong bytes would be worse than
    // one that cost something.
    expect(await store.readAsset(site, 'hero.png')).toEqual(picture(1))
  })

  it('test_UAT_FC_REQ-304_an_asset_stored_before_this_change_acquires_its_digest', async () => {
    // REQUIREMENT 8. A row written before content addressing has a NULL digest
    // and its bytes at the old `draft/<siteId>/assets/<name>` key, because a
    // SQL migration cannot reach into R2. The first question about what that
    // asset IS establishes its identity — without an operator re-uploading
    // anything, and exactly once.
    const counting = countingBucket()
    const { store, site } = await siteWithPictures(counting)

    const legacyBytes = picture(7)
    const legacyKey = `draft/${site}/assets/old.png`
    await env.SITES.put(legacyKey, legacyBytes as unknown as ArrayBuffer)
    await env.DB.prepare(
      'INSERT INTO site_assets (site_id, name, r2_key, content_type, size, digest) ' +
        'VALUES (?, ?, ?, ?, ?, NULL)',
    )
      .bind(site, 'old.png', legacyKey, 'image/png', legacyBytes.byteLength)
      .run()

    // It reads exactly as it did — nothing reconstructs a key for a row.
    expect(await store.readAsset(site, 'old.png')).toEqual(legacyBytes)

    const refs = await store.assetManifest(site)
    const filled = refs.find((r) => r.name === 'old.png')
    expect(filled?.digest).toBe(await contentDigest(legacyBytes))
    // The identity is RECORDED, and the row repointed at the content-addressed
    // key, so the asset is indistinguishable from one written today…
    const row = await env.DB.prepare(
      'SELECT r2_key, digest FROM site_assets WHERE site_id = ? AND name = ?',
    )
      .bind(site, 'old.png')
      .first<{ r2_key: string; digest: string }>()
    expect(row?.digest).toBe(filled!.digest)
    expect(row?.r2_key).toBe(blobKey(site, filled!.digest))
    expect(await env.SITES.head(blobKey(site, filled!.digest))).not.toBeNull()
    // …and the old object is left alone, because a revision frozen before this
    // change still names it.
    expect(await env.SITES.head(legacyKey)).not.toBeNull()

    // ONCE IN ITS LIFE. The second ask costs no read at all.
    counting.reset()
    await store.assetManifest(site)
    expect(counting.gets).toEqual([])

    // And the site publishes, which is the point of establishing it.
    expect((await publishSite(store, site, {})).published).toBe(true)
  })

  it('test_UAT_FC_REQ-304_a_revision_frozen_before_this_change_is_read_and_checked_out', async () => {
    // REQUIREMENT 8's other half. A revision frozen before content addressing
    // has a copy of every picture under its own prefix, no manifest, and a `sha`
    // taken over the OLD listing — in which an asset contributed its whole
    // content as a latin-1 string. Only `byteKey` could reproduce that, and
    // `byteKey` is what this ticket retires, so such a revision is read back
    // UNVERIFIED rather than refused: failing a restore on data that is in fact
    // intact is the worse of the two errors by a long way.
    const counting = countingBucket()
    const { store, site } = await siteWithPictures(counting)
    const first = await publishSite(store, site, {})

    /*
     * r2, BUILT BY HAND IN EXACTLY THE SHAPE A PRE-REQ-304 PUBLISH LEFT BEHIND:
     * the definition under `source/`, a copy of every picture under
     * `source/assets/`, no `assets.json`, and a `sha` over the old byte listing
     * — written here as a string nothing can recompute, which is precisely what
     * such a revision's recorded digest now is.
     *
     * INSERTED RATHER THAN EDITED, because `site_revisions` is append-only by
     * trigger — a constraint this fixture has to respect like any other writer,
     * and the reason r1 above is left exactly as the publish wrote it.
     */
    const legacyId = first.id + 1
    const source = publishedSourcePrefix(site, legacyId)
    const frozenSite = await env.SITES.get(`${publishedSourcePrefix(site, first.id)}/site.json`)
    await env.SITES.put(`${source}/site.json`, await frozenSite!.text())
    const frozenPage = await env.SITES.get(
      `${publishedSourcePrefix(site, first.id)}/pages/home.json`,
    )
    await env.SITES.put(`${source}/pages/home.json`, await frozenPage!.text())
    for (const [name, bytes] of [
      ['hero.png', picture(1)],
      ['mark.png', picture(2)],
    ] as const) {
      await env.SITES.put(`${source}/assets/${name}`, bytes as unknown as ArrayBuffer)
    }
    await env.DB.prepare(
      'INSERT INTO site_revisions (site_id, id, published_at, published_by, message, ' +
        'based_on, changes, sha) VALUES (?, ?, ?, NULL, ?, NULL, ?, ?)',
    )
      .bind(
        site,
        legacyId,
        '2026-01-01T00:00:00.000Z',
        'frozen before content addressing',
        JSON.stringify({ added: [], modified: [], removed: [] }),
        'a-digest-only-bytekey-could-reproduce',
      )
      .run()

    // IT IS STILL READABLE. The shape in the bucket decides; there is no mode to
    // detect and no flag anyone had to remember to set. Under the old reading
    // this would have thrown `RevisionIntegrityError` on data that is intact.
    const snapshot = await store.readRevision(site, legacyId)
    expect(snapshot!.assets.map((a) => a.name)).toEqual(['hero.png', 'mark.png'])
    expect(snapshot!.assets[0].digest).toBe(await contentDigest(picture(1)))

    // AND STILL CHECKED OUT, which is what the absence of a digest record must
    // not cost anyone: the legacy copies join the blob space as they are read,
    // so the restore's references resolve.
    await store.write(site, { assets: [{ name: 'hero.png', bytes: picture(99) }] })
    await checkoutRevision(store, site, legacyId, { force: true })
    expect(await store.readAsset(site, 'hero.png')).toEqual(picture(1))

    // AND THE UNVERIFIED READING IS NARROW. `verifyRevisions` reports the whole
    // history as intact — r1, frozen under content addressing, is genuinely
    // verified, and a digest nothing can recompute is not evidence of tampering.
    expect((await verifyRevisions(store, site)).mismatches).toEqual([])
  })

  it('test_UAT_FC_REQ-304_an_asset_less_legacy_revision_still_verifies', async () => {
    // REQUIREMENT 9, and the reason the carve-out above is narrower than it
    // first reads. With no assets the two listings are identical character for
    // character, so every such revision — however old — is still verified, and
    // the integrity guarantee REQ-266 §4 established holds for all of them.
    const counting = countingBucket()
    const platform = d1r2SiteStore({ DB: env.DB, SITES: counting.bucket })
    await platform.createTenant({ id: TENANT, name: TENANT, status: 'active' })
    const store = await platform.forTenant(TENANT)
    const seed = siteSeed({ slug: nextSlug('req304') })
    const site = await store.createDraft()
    await store.write(site, {
      siteJson: seed.siteJson,
      pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page })),
    })
    const first = await publishSite(store, site, {})

    // The one thing that makes it "legacy": no manifest object.
    await env.SITES.delete(publishedAssetManifestKey(site, first.id))
    expect((await verifyRevisions(store, site)).mismatches).toEqual([])

    // AND A CORRUPTED ONE IS STILL REFUSED. The verification is real, not a
    // reading that lets everything through.
    await env.SITES.put(
      `${publishedSourcePrefix(site, first.id)}/site.json`,
      JSON.stringify({ tampered: true }),
    )
    const report = await verifyRevisions(store, site)
    expect(report.mismatches.map((m) => m.id)).toEqual([first.id])
  })

  it('test_UAT_FC_REQ-304_the_published_site_serves_an_asset_through_the_manifest', async () => {
    // REQUIREMENT 4 AS A VISITOR EXPERIENCES IT. No copy of the picture is
    // written under the revision's `out/` any more, so a page that only resolved
    // while such a copy existed would be a published site that decays. What
    // makes it durable is that the bytes it names cannot change — one
    // content-addressed object, resolved through the revision's own manifest.
    const counting = countingBucket()
    const { store, site } = await siteWithPictures(counting)
    await publishSite(store, site, {})

    const res = await serve(`/site/${site}/assets/hero.png`)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/png')
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(picture(1))

    // A name the live revision never had is still a 404 — resolving through a
    // manifest must not become a way to reach content by guessing.
    expect((await serve(`/site/${site}/assets/nothing.png`)).status).toBe(404)
  })

  it('test_UAT_FC_REQ-304_a_dozen_pages_of_ten_pictures_publishes', async () => {
    // THE ACCEPTANCE BULLET, in the operator's own framing: *"a real site could
    // have a dozen pages with twice that number of images on each — and I would
    // not call that big."* A hundred and twenty pictures at 64 kB is 7.7 MB of
    // source assets; under the old arithmetic a publish would have held roughly
    // four copies of it and turned every byte into a JavaScript character
    // besides. Here the whole publish touches no asset content at all, which is
    // what makes the ceiling a property of the largest single picture rather
    // than of the site.
    const counting = countingBucket()
    const platform = d1r2SiteStore({ DB: env.DB, SITES: counting.bucket })
    await platform.createTenant({ id: TENANT, name: TENANT, status: 'active' })
    const store = await platform.forTenant(TENANT)
    const slug = nextSlug('req304')
    const seed = siteSeed({ slug })
    const site = await store.createDraft()
    const pages = Object.entries(seed.pages).map(([name, page]) => ({ name, page }))
    for (let p = 1; p < 12; p += 1) {
      pages.push({
        name: `page${p}.json`,
        page: { ...seed.pages['home.json'], id: `page${p}`, slug: `page${p}` },
      })
    }
    await store.write(site, { siteJson: seed.siteJson, pages })
    // Written in batches, as an operator uploads them — one `write` per page's
    // worth, which is also what keeps this fixture inside one isolate.
    for (let p = 0; p < 12; p += 1) {
      await store.write(site, {
        assets: Array.from({ length: 10 }, (_, i) => ({
          name: `p${p}-${i}.png`,
          bytes: picture(p * 10 + i),
        })),
      })
    }
    expect(await store.listAssets(site)).toHaveLength(120)

    counting.reset()
    const result = await publishSite(store, site, {})
    expect(result.published).toBe(true)
    expect(result.changes.added).toContain('assets/p0-0.png')
    expect(result.changes.added).toHaveLength(120 + 12 + 1)
    // NOT ONE PICTURE READ AND NOT ONE WRITTEN, however many there are.
    expect(counting.gets.filter(isAssetContent)).toEqual([])
    expect(counting.puts.filter(isAssetContent)).toEqual([])

    // And the frozen definition really describes all of them — a publish that
    // skipped assets would satisfy every count above.
    const manifest = JSON.parse(
      await (await env.SITES.get(publishedAssetManifestKey(site, result.id)))!.text(),
    ) as StoredAssetManifest
    expect(Object.keys(manifest.assets)).toHaveLength(120)
  })

  it('test_UAT_FC_REQ-304_a_revision_digest_is_taken_over_identities', async () => {
    // REQUIREMENT 3, asked of the value the store actually records. The `sha` a
    // publish writes is reproducible from the LISTING of `path → digest` alone,
    // which is what makes it cost the number of files a site has rather than
    // their size.
    const counting = countingBucket()
    const { store, site } = await siteWithPictures(counting)
    const result = await publishSite(store, site, {})

    const snapshot = await store.readRevision(site, result.id)
    const row = await env.DB.prepare(
      'SELECT sha FROM site_revisions WHERE site_id = ? AND id = ?',
    )
      .bind(site, result.id)
      .first<{ sha: string }>()
    expect(await snapshotSha(snapshot!)).toBe(row!.sha)

    // A RENAME IS A CHANGE, as it must be — it moves a URL — even though the
    // content, and therefore every digest, is identical.
    const renamed = {
      ...snapshot!,
      assets: snapshot!.assets.map((a) =>
        a.name === 'hero.png' ? { ...a, name: 'banner.png' } : a,
      ),
    }
    expect(await snapshotSha(renamed)).not.toBe(row!.sha)

    // AND ITERATION ORDER CANNOT PERTURB IT.
    expect(await snapshotSha({ ...snapshot!, assets: [...snapshot!.assets].reverse() })).toBe(
      row!.sha,
    )
  })
})
