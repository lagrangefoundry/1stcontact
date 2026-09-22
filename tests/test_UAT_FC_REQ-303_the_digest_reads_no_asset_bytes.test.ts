import { describe, expect, it } from 'vitest'
import {
  editAssetAdd,
  editAssetRm,
  editConfigSet,
  editCopySet,
  editPageAdd,
  editPageRm,
  editStatus,
} from '../tools/generate/src/cli/edit'
import type { EditOptions } from '../tools/generate/src/cli/edit'
import { publishSite } from '../tools/generate/src/publish/publish'
import { collectSiteDigest, siteDigestSource } from '../tools/generate/src/cli/ai/digest-core'
import type { SiteStore } from '../tools/generate/src/store/site-store'
import { SITE_BACKENDS } from './support/site-factory'
import type { SiteFixture, SiteSeedOptions } from './support/site-factory'

/**
 * [[REQ-303]] — **the per-turn site digest must not read asset bytes.**
 *
 * WHAT WENT WRONG. Chat died outright for a business with seventeen assets and
 * fifty megabytes of them: `outcome=exceededMemory` on every turn, and a client
 * told only *"the connection to this reply was lost"*. The digest — derived
 * before every model call — called `pendingChanges`, which read a BYTE-EXACT
 * snapshot of the whole draft and of the whole live revision and flattened both
 * through a string built one character per byte. Against a 128 MB Workers
 * isolate that is fatal, and it is fatal before the site is large.
 *
 * AND THE DIGEST NEVER LOOKED AT THE BYTES IT PAID FOR. It takes exactly two
 * values off the result: which revision is live, and how many paths differ from
 * it. A whole site was read to produce a revision id and a count.
 *
 * THE CLAIMS, in the order the requirement states them:
 *
 *   1. Deriving a digest opens no asset — over every adapter, whatever the site
 *      holds. The store is instrumented, so this is a claim about what was
 *      ASKED of storage and not about a number that happened to come out right.
 *   2. The cost does not vary with what the assets weigh. Megabytes of pictures
 *      and eight bytes of one cost the store the same: nothing.
 *   3. The two facts still mean what they meant — the live revision, and the
 *      count of unpublished changes. None still says none; something still says
 *      something.
 *   4. The count still covers added, modified and removed across `site.json`,
 *      `pages/<name>` and `assets/<name>`, and still agrees path for path with
 *      the status surface `describe_site` reports.
 *   5. An asset whose CONTENT changed under an unchanged name is still counted.
 *   6. A store that cannot answer is silence, not a failed turn — the existing
 *      `siteDigestSource` contract, which an OOM had made meaningless because a
 *      killed isolate never reaches a `catch`.
 */

/** A picture's worth of bytes, distinguishable from any other picture's. */
function picture(size: number, fill: number): Uint8Array {
  const bytes = new Uint8Array(size)
  bytes.fill(fill)
  // A varying head, so two pictures of one size are never the same bytes.
  bytes[0] = fill
  bytes[1] = size & 0xff
  return bytes
}

/** One asset opened, as {@link watched} saw it. */
interface Opened {
  what: string
  bytes: number
}

/**
 * A store that records every request for CONTENT it was given.
 *
 * THE OBSERVATION HAS TO BE ON THE CALL, not on the result. "The digest is
 * cheap" is a claim about what storage was asked for, and every value the digest
 * reports could be produced correctly by a derivation that read the whole site
 * first — which is precisely the derivation this replaces.
 *
 * `readRevision` COUNTS TOO, and it is the half that is easy to forget. The old
 * path read the draft's bytes AND the live revision's, and a fix that removed
 * only the first would have halved a fatal cost.
 */
function watched(inner: SiteStore): { store: SiteStore; opened: Opened[] } {
  const opened: Opened[] = []
  const store: SiteStore = {
    ...inner,
    async readAsset(site, name) {
      const bytes = await inner.readAsset(site, name)
      opened.push({ what: `assets/${name}`, bytes: bytes?.byteLength ?? 0 })
      return bytes
    },
    async readRevision(site, id) {
      const snapshot = await inner.readRevision(site, id)
      opened.push({
        what: `revision ${id}`,
        bytes: (snapshot?.assets ?? []).reduce((sum, a) => sum + a.bytes.byteLength, 0),
      })
      return snapshot
    },
  }
  return { store, opened }
}

/** The same fixture with the instrumented store in front of it. */
function watchedFixture(fixture: SiteFixture): {
  fixture: SiteFixture
  opened: Opened[]
} {
  const { store, opened } = watched(fixture.store)
  const opts: EditOptions = { ...fixture.opts, store }
  return { fixture: { ...fixture, store, opts }, opened }
}

for (const backend of SITE_BACKENDS) {
  describe(`REQ-303 — the digest over the ${backend.name} store`, () => {
    const sites: SiteFixture[] = []
    const make = (options?: SiteSeedOptions): SiteFixture => {
      const fixture = backend.make(options)
      sites.push(fixture)
      return fixture
    }
    const dispose = (): void => {
      while (sites.length) void sites.pop()!.dispose?.()
    }

    // ── 1–2: what the derivation costs ───────────────────────────────────────

    it('test_UAT_FC_REQ-303_deriving_a_digest_opens_no_asset', async () => {
      const seeded = make({
        assets: { 'hero.jpg': picture(512 * 1024, 7), 'wordmark.svg': picture(2048, 3) },
      })
      const { fixture, opened } = watchedFixture(seeded)
      try {
        // A published revision AND an unpublished change, so both sides of the
        // comparison are non-empty — the state the old path read twice.
        await publishSite(fixture.store, fixture.slug, { message: 'first' })
        await editCopySet(
          fixture.slug,
          'home',
          '0.0',
          { text: 'A new headline.' },
          fixture.opts,
        )
        opened.length = 0

        const digest = await collectSiteDigest(fixture.slug, fixture.opts)

        expect(digest.pending).toBeGreaterThan(0)
        expect(opened).toEqual([])
      } finally {
        dispose()
      }
    })

    it('test_UAT_FC_REQ-303_the_derivation_costs_the_same_whatever_the_assets_weigh', async () => {
      const heavy = watchedFixture(
        make({
          assets: Object.fromEntries(
            // The shape the report measured: a site whose assets are the site.
            Array.from({ length: 17 }, (_, i) => [`photo-${i}.jpg`, picture(256 * 1024, i + 1)]),
          ),
        }),
      )
      const light = watchedFixture(make({ assets: { 'tiny.svg': picture(8, 1) } }))
      try {
        for (const held of [heavy, light]) {
          await publishSite(held.fixture.store, held.fixture.slug, { message: 'first' })
          held.opened.length = 0
          await collectSiteDigest(held.fixture.slug, held.fixture.opts)
        }

        const weighed = (held: typeof heavy): number =>
          held.opened.reduce((sum, entry) => sum + entry.bytes, 0)
        // Four megabytes of pictures and eight bytes of one: the same nothing.
        expect(weighed(heavy)).toBe(0)
        expect(weighed(heavy)).toBe(weighed(light))
      } finally {
        dispose()
      }
    })

    // ── 3: the two facts still mean what they meant ──────────────────────────

    it('test_UAT_FC_REQ-303_the_digest_still_reports_the_live_revision_and_what_is_unpublished', async () => {
      const fixture = make({ assets: { 'hero.jpg': picture(64 * 1024, 5) } })
      try {
        const before = await collectSiteDigest(fixture.slug, fixture.opts)
        // Nothing published: no base revision, and every path is unpublished.
        expect(before.live).toBeNull()
        expect(before.pending).toBeGreaterThan(0)

        const published = await publishSite(fixture.store, fixture.slug, { message: 'first' })
        const clean = await collectSiteDigest(fixture.slug, fixture.opts)
        expect(clean.live).toBe(published.id)
        expect(clean.pending).toBe(0)

        await editCopySet(
          fixture.slug,
          'home',
          '0.0',
          { text: 'Something else.' },
          fixture.opts,
        )
        const dirty = await collectSiteDigest(fixture.slug, fixture.opts)
        expect(dirty.live).toBe(published.id)
        expect(dirty.pending).toBe(1)
      } finally {
        dispose()
      }
    })

    // ── 4: the same three kinds across the same three path families ──────────

    it('test_UAT_FC_REQ-303_the_count_covers_every_kind_of_change_across_every_path_family', async () => {
      const fixture = make({ assets: { 'old.svg': picture(1024, 2) } })
      try {
        await editPageAdd(fixture.slug, 'about', {
          ...fixture.opts,
          title: 'About us',
          path: 'about',
        })
        await publishSite(fixture.store, fixture.slug, { message: 'first' })

        // One of each kind, and one in each family.
        await editAssetAdd(fixture.slug, 'new.svg', picture(2048, 4), fixture.opts)
        await editConfigSet(fixture.slug, undefined, { businessName: 'Renamed' }, fixture.opts)
        await editPageRm(fixture.slug, 'about', { ...fixture.opts, force: true })
        await editAssetRm(fixture.slug, 'old.svg', { ...fixture.opts, force: true })

        const status = (await editStatus(fixture.slug, fixture.opts)).data as {
          added: string[]
          modified: string[]
          removed: string[]
        }
        expect(status.added).toEqual(['assets/new.svg'])
        expect(status.modified).toEqual(['site.json'])
        expect(status.removed).toEqual(['assets/old.svg', 'pages/about.json'])

        // THE DIGEST'S COUNT IS THAT LIST'S LENGTH, which is the agreement
        // [[REQ-285]] was protecting: `describe_site` reports this status data
        // verbatim, so a digest that counted differently would put two numbers
        // in front of one session.
        const digest = await collectSiteDigest(fixture.slug, fixture.opts)
        expect(digest.pending).toBe(
          status.added.length + status.modified.length + status.removed.length,
        )
        expect(digest.pending).toBe(4)
      } finally {
        dispose()
      }
    })

    // ── 5: content, not just names ───────────────────────────────────────────

    it('test_UAT_FC_REQ-303_an_asset_whose_content_changed_under_the_same_name_still_counts', async () => {
      const fixture = make({ assets: { 'hero.jpg': picture(4096, 1) } })
      try {
        await publishSite(fixture.store, fixture.slug, { message: 'first' })
        expect((await collectSiteDigest(fixture.slug, fixture.opts)).pending).toBe(0)

        // The NAME does not move. A count derived from names alone — the cheap
        // fix this is not — would report nothing pending here.
        await fixture.store.write(fixture.slug, {
          assets: [{ name: 'hero.jpg', bytes: picture(8192, 9) }],
        })

        const status = (await editStatus(fixture.slug, fixture.opts)).data as {
          modified: string[]
        }
        expect(status.modified).toEqual(['assets/hero.jpg'])
        expect((await collectSiteDigest(fixture.slug, fixture.opts)).pending).toBe(1)
      } finally {
        dispose()
      }
    })

    // ── 6: silence, not a failed turn ────────────────────────────────────────

    it('test_UAT_FC_REQ-303_a_store_that_cannot_answer_is_silence_not_a_failed_turn', async () => {
      const fixture = make()
      try {
        const store: SiteStore = {
          ...fixture.store,
          draftOutline: () => Promise.reject(new Error('the store is unreachable')),
        }
        const source = siteDigestSource(fixture.slug, { ...fixture.opts, store })

        // THE GUARD IS MEANINGFUL AGAIN, and that is the point of it appearing
        // here: it never fired against the failure this ticket fixes, because an
        // OOM kills the isolate and a dead isolate runs no `catch`.
        await expect(source()).resolves.toBeNull()
      } finally {
        dispose()
      }
    })
  })
}
