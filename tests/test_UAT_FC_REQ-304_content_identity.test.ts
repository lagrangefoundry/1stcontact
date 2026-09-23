import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import {
  ASSET_MANIFEST_NAME,
  blobsDir,
  contentDigest,
  MissingContentError,
  revisionDir,
  snapshotSha,
  type AssetRef,
  type SiteStore,
} from '../tools/generate/src/store'
import {
  checkoutRevision,
  pendingChanges,
  publishSite,
} from '../tools/generate/src/publish/publish'
import {
  buildImageLadder,
  LADDER_CONCURRENCY,
  type ImageSizer,
  type LadderSource,
} from '../tools/generate/src/publish/ladder'
import { makeFsSite, SITE_BACKENDS } from './support/site-factory'

/**
 * REQ-304 — a site's assets are compared and frozen by content IDENTITY.
 *
 * WHAT THIS FILE IS FOR, BESIDE ITS WORKERS TWIN. The cloud tier is where the
 * fault was observed and where the counting evidence lives
 * (`test_UAT_FC_REQ-304_content_identity.workers.test.ts`). This one covers the
 * parts that are the SAME on every adapter — the revision arithmetic, the shape
 * of a snapshot, what a checkout is allowed to do — plus the two things only a
 * real filesystem can show: that a revision directory is still the directory
 * DOC-12 §4 specifies, and that the bytes reaching it come out of a per-site
 * content-addressed space rather than through this process.
 *
 * ASKED OF BOTH ADAPTERS WHERE IT CAN BE. `SITE_BACKENDS` is the existing shape
 * for "no caller depends on the filesystem"; content identity is exactly the
 * kind of property that would otherwise be true of one store and quietly false
 * of the other.
 */

/** A picture, distinguishable by its seed and of a length under this test's control. */
function picture(seedByte: number, size = 4096): Uint8Array {
  const bytes = new Uint8Array(size)
  for (let i = 0; i < size; i += 1) bytes[i] = (i * 31 + seedByte) % 256
  return bytes
}

/** How many asset bytes a store was asked for, through either reading verb. */
function watchAssetReads(store: SiteStore): { reads: string[]; store: SiteStore } {
  const reads: string[] = []
  const watched = Object.create(store) as SiteStore
  watched.readAsset = (site, name) => {
    reads.push(`asset:${name}`)
    return store.readAsset(site, name)
  }
  watched.readBlob = (site, digest) => {
    reads.push(`blob:${digest}`)
    return store.readBlob(site, digest)
  }
  return { reads, store: watched }
}

describe.each(SITE_BACKENDS)('REQ-304 over the $name store', ({ make }) => {
  it('test_UAT_FC_REQ-304_a_frozen_revision_names_its_assets_and_carries_no_bytes', async () => {
    // REQUIREMENT 4. A revision is a MANIFEST of digests over immutable blobs.
    // The snapshot a store hands back therefore has an identity per asset and
    // no content at all — which is what makes a whole site's definition cost a
    // listing rather than a site.
    const site = make({ assets: { 'hero.png': picture(1), 'mark.svg': picture(2, 64) } })
    try {
      const result = await publishSite(site.store, site.slug, {})
      const snapshot = await site.store.readRevision(site.slug, result.id)

      expect(snapshot!.assets.map((a) => a.name)).toEqual(['hero.png', 'mark.svg'])
      for (const ref of snapshot!.assets as AssetRef[]) {
        // A full SHA-256, because the digest is an ADDRESS: two assets that
        // collided would be one asset, and one client's photograph would be
        // served where another's belongs.
        expect(ref.digest).toMatch(/^[0-9a-f]{64}$/)
        expect(Object.keys(ref).sort()).toEqual(['digest', 'name', 'size'])
      }
      expect(snapshot!.assets[0].digest).toBe(await contentDigest(picture(1)))
      expect(snapshot!.assets[0].size).toBe(4096)

      // AND THE CONTENT IS REACHABLE BY THAT IDENTITY, which is what makes the
      // listing a definition rather than a description.
      expect(await site.store.readBlob(site.slug, snapshot!.assets[0].digest)).toEqual(picture(1))
      // A digest nothing was stored under is `null` — the same answer an unknown
      // name gets, and the only one that discloses nothing.
      expect(await site.store.readBlob(site.slug, 'f'.repeat(64))).toBeNull()
    } finally {
      await site.dispose()
    }
  })

  it('test_UAT_FC_REQ-304_a_picture_replaced_in_place_is_reported_modified', async () => {
    // REQUIREMENT 2's CRUX, on every adapter. A name and a length are not an
    // identity. Two different photographs of the same length under one name must
    // not read as unchanged — the store would otherwise freeze a revision
    // describing a picture nobody uploaded.
    const site = make({ assets: { 'hero.png': picture(1) } })
    try {
      await publishSite(site.store, site.slug, {})
      expect((await pendingChanges(site.store, site.slug)).modified).toEqual([])

      const replacement = picture(200)
      expect(replacement.byteLength).toBe(4096) // same name, same size…
      await site.store.write(site.slug, { assets: [{ name: 'hero.png', bytes: replacement }] })

      expect((await pendingChanges(site.store, site.slug)).modified).toEqual(['assets/hero.png'])
    } finally {
      await site.dispose()
    }
  })

  it('test_UAT_FC_REQ-304_a_revision_digest_is_a_listing_of_identities', async () => {
    // REQUIREMENT 3. The `sha` keeps every property it had — a rename is a
    // change, iteration order cannot perturb the result, identical content is
    // stable — and it is now taken over `path → digest`, so it costs the number
    // of files a site has rather than their size. It used to be the
    // concatenation of every picture on the site as text.
    const site = make({ assets: { 'hero.png': picture(1), 'mark.png': picture(2) } })
    try {
      const result = await publishSite(site.store, site.slug, {})
      const snapshot = (await site.store.readRevision(site.slug, result.id))!
      const sha = await snapshotSha(snapshot)

      // Recomputable from the listing alone — nothing here holds a byte.
      expect(await snapshotSha(snapshot)).toBe(sha)
      // ORDER CANNOT PERTURB IT.
      expect(await snapshotSha({ ...snapshot, assets: [...snapshot.assets].reverse() })).toBe(sha)
      // A RENAME IS A CHANGE, as it must be — it moves a URL — even though every
      // digest is identical.
      expect(
        await snapshotSha({
          ...snapshot,
          assets: snapshot.assets.map((a) =>
            a.name === 'hero.png' ? { ...a, name: 'banner.png' } : a,
          ),
        }),
      ).not.toBe(sha)
      // AND DIFFERENT CONTENT IS A DIFFERENT DIGEST.
      const other = await contentDigest(picture(9))
      expect(
        await snapshotSha({
          ...snapshot,
          assets: snapshot.assets.map((a) =>
            a.name === 'hero.png' ? { ...a, digest: other } : a,
          ),
        }),
      ).not.toBe(sha)
    } finally {
      await site.dispose()
    }
  })

  it('test_UAT_FC_REQ-304_a_checkout_restores_the_pictures_without_reading_them', async () => {
    // REQUIREMENT 4 / 7. A revision names its assets by content and the store
    // already holds that content, so restoring is a pointer move: checking out a
    // year-old revision of a picture-heavy site reads none of it into this
    // process.
    const site = make({ assets: { 'hero.png': picture(1), 'gone.png': picture(3) } })
    try {
      const first = await publishSite(site.store, site.slug, {})
      await site.store.write(site.slug, {
        assets: [{ name: 'hero.png', bytes: picture(200) }],
        removeAssets: ['gone.png'],
      })
      await publishSite(site.store, site.slug, {})

      const watched = watchAssetReads(site.store)
      await checkoutRevision(watched.store, site.slug, first.id)
      expect(watched.reads).toEqual([])

      // AND THE RESTORE IS REAL — a pointer move that restored the wrong bytes
      // would be worse than one that cost something.
      expect(await site.store.readAsset(site.slug, 'hero.png')).toEqual(picture(1))
      expect(await site.store.readAsset(site.slug, 'gone.png')).toEqual(picture(3))
    } finally {
      await site.dispose()
    }
  })

  it('test_UAT_FC_REQ-304_a_reference_to_content_the_store_lacks_is_refused', async () => {
    // A ref naming a digest nothing was stored under is a caller holding a
    // revision from somewhere else, and the honest answer is a refusal rather
    // than an asset row that lists and then 404s — the same rule an unsafe asset
    // name already follows. The refusal names both the asset and the digest,
    // because neither alone is actionable.
    const site = make()
    try {
      const invented = 'a'.repeat(64)
      const err = await site.store
        .write(site.slug, { assetRefs: [{ name: 'hero.png', digest: invented, size: 1 }] })
        .then(() => null, (e: unknown) => e)
      expect(err).toBeInstanceOf(MissingContentError)
      expect((err as MissingContentError).assetName).toBe('hero.png')
      expect((err as MissingContentError).digest).toBe(invented)
      expect(await site.store.listAssets(site.slug)).toEqual([])
    } finally {
      await site.dispose()
    }
  })
})

describe('REQ-304 — the filesystem tier keeps its directory and moves no bytes', () => {
  it('test_UAT_FC_REQ-304_a_revision_directory_carries_a_manifest_and_cloned_files', async () => {
    // REQUIREMENT 4 ON A REAL FILESYSTEM. `revisions/NNNN/` is what
    // `loadSite(ctx, slug, <id>)` reads and what the reproduction loop walks, so
    // the DOC-12 §4 shape is kept — and an `assets.json` sits beside it recording
    // which CONTENT each name was. That manifest is what the revision's `sha` is
    // taken over, and what makes the copy verifiable.
    const site = makeFsSite({ assets: { 'hero.png': picture(1), 'mark.png': picture(2) } })
    try {
      const ctx = { cwd: site.cwd!, root: 'sites' as const }
      const first = await publishSite(site.store, site.slug, {})
      const dir = revisionDir(ctx, site.slug, first.id)

      expect(existsSync(path.join(dir, ASSET_MANIFEST_NAME))).toBe(true)
      const manifest = JSON.parse(readFileSync(path.join(dir, ASSET_MANIFEST_NAME), 'utf8')) as {
        assets: Record<string, { digest: string; size: number }>
      }
      expect(Object.keys(manifest.assets)).toEqual(['hero.png', 'mark.png'])
      expect(manifest.assets['hero.png'].digest).toBe(await contentDigest(picture(1)))
      // The directory is still a readable one, byte for byte.
      expect(new Uint8Array(readFileSync(path.join(dir, 'assets', 'hero.png')))).toEqual(picture(1))

      // THE BYTES CAME OUT OF A PER-SITE CONTENT SPACE, one object per content —
      // beside `draft/` and `revisions/`, never inside either, so a capture of
      // the draft cannot pick it up.
      const blobs = blobsDir(ctx, site.slug)
      expect(readdirSync(blobs).sort()).toEqual(
        [await contentDigest(picture(1)), await contentDigest(picture(2))].sort(),
      )

      // REQUIREMENT 5 — A REPUBLISH COSTS WHAT CHANGED. One page edited, two
      // pictures untouched: the content space does not grow, because the digests
      // are the same digests.
      const home = (await site.store.readPages(site.slug))[0]
      await site.store.write(site.slug, {
        pages: [{ name: home.name, page: { ...home.page, title: 'Edited' } }],
      })
      const second = await publishSite(site.store, site.slug, {})
      expect(second.published).toBe(true)
      expect(readdirSync(blobs)).toHaveLength(2)

      // AND REPLACING ONE PICTURE ADDS EXACTLY ONE CONTENT, leaving the old one
      // addressing exactly the bytes revision 1 was frozen with.
      await site.store.write(site.slug, { assets: [{ name: 'hero.png', bytes: picture(200) }] })
      await publishSite(site.store, site.slug, {})
      expect(readdirSync(blobs)).toHaveLength(3)
      expect(
        new Uint8Array(readFileSync(path.join(revisionDir(ctx, site.slug, first.id), 'assets', 'hero.png'))),
      ).toEqual(picture(1))
    } finally {
      await site.dispose()
    }
  })

  it('test_UAT_FC_REQ-304_a_publish_holds_no_more_than_one_picture_at_a_time', async () => {
    // REQUIREMENT 7, and the acceptance bullet "peak publish memory does not
    // grow with the number of assets". Publish reads NO asset bytes at all when
    // there is no ladder to build; when there is one, the ladder is handed a
    // listing and a reader rather than the site's bytes, and holds at most
    // LADDER_CONCURRENCY sources however many pictures there are.
    const site = makeFsSite({
      assets: Object.fromEntries(
        Array.from({ length: 40 }, (_, i) => [`p${i}.png`, picture(i)]),
      ),
    })
    try {
      const watched = watchAssetReads(site.store)
      await publishSite(watched.store, site.slug, {})
      expect(watched.reads).toEqual([])
    } finally {
      await site.dispose()
    }
  })

  it('test_UAT_FC_REQ-304_a_dozen_pages_of_ten_pictures_publishes', async () => {
    // THE ACCEPTANCE BULLET, in the operator's own framing: *"a real site could
    // have a dozen pages with twice that number of images on each — and I would
    // not call that big."* Under the old arithmetic this held the live revision,
    // the draft, and a latin-1 string of every picture, all at once.
    const pages: Record<string, Record<string, unknown>> = {}
    const site = makeFsSite({
      assets: Object.fromEntries(
        Array.from({ length: 120 }, (_, i) => [`p${i}.png`, picture(i, 16_384)]),
      ),
    })
    try {
      const home = (await site.store.readPages(site.slug))[0]
      for (let p = 1; p < 12; p += 1) {
        pages[`page${p}.json`] = { ...home.page, id: `page${p}`, slug: `page${p}` }
      }
      await site.store.write(site.slug, {
        pages: Object.entries(pages).map(([name, page]) => ({ name, page })),
      })

      const watched = watchAssetReads(site.store)
      const result = await publishSite(watched.store, site.slug, {})
      expect(result.published).toBe(true)
      expect(result.changes.added).toHaveLength(120 + 12 + 1)
      expect(watched.reads).toEqual([])

      // The frozen definition really describes all of them — a publish that
      // skipped assets would satisfy the count above.
      const snapshot = (await site.store.readRevision(site.slug, result.id))!
      expect(snapshot.assets).toHaveLength(120)
    } finally {
      await site.dispose()
    }
  })
})

describe('REQ-304 — the ladder reads one picture at a time', () => {
  /** A sizer that measures everything and renders a stand-in for every rung. */
  function sizer(): ImageSizer {
    return {
      measure: async () => ({ width: 1000, height: 500 }),
      resize: async () => new TextEncoder().encode('rendition'),
    }
  }

  it('test_UAT_FC_REQ-304_the_ladder_takes_a_listing_and_a_reader', async () => {
    // REQUIREMENT 7. The ladder used to be handed every asset on the site with
    // its bytes attached, which meant the caller had already materialised the
    // whole site before the first pixel was measured — the largest of the four
    // copies a publish held live. It plans and renders in two bounded passes
    // now, and what is in hand at any moment is at most LADDER_CONCURRENCY
    // sources whatever the site's size.
    const count = 40
    const bytes = new Map(
      Array.from({ length: count }, (_, i) => [`p${i}.png`, picture(i)] as const),
    )
    let live = 0
    let peak = 0
    const source: LadderSource = {
      assets: await Promise.all(
        [...bytes].map(async ([name, b]) => ({
          name,
          digest: await contentDigest(b),
          size: b.byteLength,
        })),
      ),
      read: async (name) => {
        live += 1
        peak = Math.max(peak, live)
        await Promise.resolve()
        live -= 1
        return bytes.get(name) ?? null
      },
    }

    const built = await buildImageLadder(source, sizer())
    expect(Object.keys(built.manifest)).toHaveLength(count)
    // BOUNDED, and by the pool rather than by the site.
    expect(peak).toBeLessThanOrEqual(LADDER_CONCURRENCY)
    expect(peak).toBeGreaterThan(1)
  })

  it('test_UAT_FC_REQ-304_a_rendition_keeps_the_exact_name_it_had', async () => {
    // A rendition's name is the recorded content digest truncated to 16 hex,
    // which is byte-identical to what the ladder's own private SHA produced. No
    // published `srcset` moves, which is the difference between this being a
    // storage change and a migration.
    const bytes = picture(1)
    const digest = await contentDigest(bytes)
    const built = await buildImageLadder(
      {
        assets: [{ name: 'hero.png', digest, size: bytes.byteLength }],
        read: async () => bytes,
      },
      sizer(),
    )
    for (const key of built.derived.keys()) {
      expect(key.startsWith(`assets/d/${digest.slice(0, 16)}-`)).toBe(true)
    }
    expect(built.manifest['hero.png'].renditions.length).toBeGreaterThan(0)
  })

  it('test_UAT_FC_REQ-304_a_picture_whose_bytes_have_gone_gets_no_ladder', async () => {
    // A picture that will not READ is dropped exactly as one that will not
    // DECODE is. Both mean the same thing to a visitor — this photograph is
    // served at its own width — and neither is a reason to refuse a publish.
    const bytes = picture(1)
    const built = await buildImageLadder(
      {
        assets: [
          { name: 'here.png', digest: await contentDigest(bytes), size: bytes.byteLength },
          { name: 'gone.png', digest: 'b'.repeat(64), size: 10 },
        ],
        read: async (name) => (name === 'here.png' ? bytes : null),
      },
      sizer(),
    )
    expect(Object.keys(built.manifest)).toEqual(['here.png'])
  })
})

describe('REQ-304 — byteKey is retired', () => {
  it('test_UAT_FC_REQ-304_nothing_decides_identity_by_rebuilding_bytes_as_a_string', async () => {
    // REQUIREMENT 6, pinned where it cannot quietly come back. `byteKey` turned
    // a picture into a JavaScript string one character per byte so that two of
    // them could be compared with `===`; at ~50 million iterations for one real
    // site that was 8.8 seconds of CPU and the larger half of the memory.
    //
    // THE SCAN IS OVER THE MODULES THAT DECIDE IDENTITY — the store and the
    // publish sequence — and not over the repository. Turning bytes into a
    // string is a legitimate and unavoidable act elsewhere: base64 for an
    // upload, a four-character PNG chunk tag. What must never come back is doing
    // it in order to answer *is this the same content*, which is what these two
    // directories are entirely about.
    const grep = (pattern: string, ...paths: string[]): string => {
      try {
        return execFileSync('git', ['grep', '-n', '-E', pattern, '--', ...paths], {
          cwd: process.cwd(),
          encoding: 'utf8',
        }).trim()
      } catch {
        // `git grep` exits non-zero when it matches nothing, which is the
        // outcome every assertion below wants.
        return ''
      }
    }

    expect(
      grep('String\\.fromCharCode', 'tools/generate/src/store', 'tools/generate/src/publish'),
    ).toBe('')

    // AND THE FUNCTION ITSELF IS GONE, not merely unused. What remains of the
    // name is prose explaining why — a comment cannot be called.
    expect(grep('(function|const)\\s+byteKey', 'tools', 'apps', 'packages')).toBe('')
  })
})
