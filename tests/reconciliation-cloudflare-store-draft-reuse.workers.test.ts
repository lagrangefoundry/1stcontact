import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { d1r2SiteStore, resetAssembledCache } from '../tools/generate/src/store/d1r2-store'
import type { TenantSiteStore } from '../tools/generate/src/store/d1r2-store'
import type { LoadedSite } from '../tools/generate/src/store/assemble'
import { applySchema, ensureTenant, storeEnv, tenantStore } from './support/d1-site-factory'
import type { SiteSeed } from './support/site-seed'
import { nextSlug, siteSeed } from './support/site-seed'

/**
 * Reconciliation UATs for story-fde7370b — the two criteria about what a read of
 * an unchanged draft costs, and about what the store may retain between reads.
 *
 * AC-1447 — reading an unchanged draft repeatedly assembles it once, with
 *           currency proven by a live version read on every read.
 * AC-1448 — a retained assembled draft never outlives, nor is misattributed to,
 *           its site, and never crosses the account barrier.
 *
 * The other fourteen criteria of this story live in
 * `reconciliation-cloudflare-site-store.workers.test.ts` (the cloud-store ones)
 * and `reconciliation-cloudflare-site-store.test.ts` (the host-runtime ones).
 * These two are filed separately because they are the story's newest, not
 * because they are a different kind of claim: they run in the same runtime,
 * against the same real D1 and R2 bindings, with nothing stubbed.
 *
 * WHY EVERY ASSERTION HERE IS ABOUT OBJECT IDENTITY RATHER THAN TIMING. Both
 * criteria are, underneath, about whether `assembleSite` — `validateSite` over
 * the whole definition — ran. A timing assertion for that is flaky by
 * construction. `assembleSite` builds a fresh object per call, so a second read
 * handing back the SAME object can only mean the assemble was skipped, and a
 * different object can only mean it ran again. The AC says so in as many words:
 * equality would also hold if the definition had been re-validated from scratch,
 * which is precisely the behaviour being ruled out.
 */

/** The account both criteria use, except where AC-1448 needs a second one. */
const TENANT = 'story-fde7370b-reuse'

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"></svg>'
const utf8 = (text: string): Uint8Array => new TextEncoder().encode(text)

function workerEnv(): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    TENANT_ID: TENANT,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ASSETS: {
      fetch: async () => new Response('asset', { status: 200 }),
    } as unknown as Fetcher,
  } as Env
}

/** The editing surface's own entry point — the Worker's `fetch`, not a helper. */
const call = (path: string): Promise<Response> =>
  worker.fetch(new Request(`https://app.example${path}`), workerEnv())

/** One site in D1 + R2, written exactly as an import would write it. */
async function seedSite(
  tenantId = TENANT,
  slug = nextSlug('reuse'),
): Promise<{ seed: SiteSeed; store: TenantSiteStore }> {
  const seed = siteSeed({ slug })
  const store = await tenantStore(tenantId)
  await store.createDraft(seed.slug)
  await store.write(seed.slug, {
    siteJson: seed.siteJson,
    pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page })),
  })
  return { seed, store }
}

/**
 * The seed's pages with their visible copy replaced by `marker`.
 *
 * The mutation has to be a field the VALIDATOR KEEPS and the RENDERER PAINTS.
 * An unknown key on `site.json` satisfies neither — `validateSite` strips it, so
 * the version would move while the assembled value did not, and a test written
 * that way asserts nothing about invalidation.
 */
function pagesMarked(seed: SiteSeed, marker: string): { name: string; page: Record<string, unknown> }[] {
  return Object.entries(seed.pages).map(([name, page]) => {
    const copy = JSON.parse(JSON.stringify(page)) as {
      l1: { root: { children: { text?: string }[] } }
    }
    copy.l1.root.children[0].text = marker
    return { name, page: copy as unknown as Record<string, unknown> }
  })
}

/** The whole assembled value as text, so a marker can be looked for anywhere in it. */
const dumpOf = (result: unknown): string => JSON.stringify(result)

function unwrap(result: unknown, label: string): LoadedSite {
  const outcome = result as { ok: boolean; value?: LoadedSite; errors?: { message: string }[] }
  if (!outcome.ok) {
    throw new Error(`${label} failed to assemble: ${outcome.errors!.map((e) => e.message).join('; ')}`)
  }
  return outcome.value!
}

/**
 * A site that disappears WITHOUT the store being told — the "by any route"
 * case AC-1448 names, which `forget` cannot exercise because `forget` drops
 * what was retained itself. Deleting the rows leaves the store to discover the
 * absence on its next read, which is the branch under test.
 */
async function vanishSiteRows(tenantId: string, slug: string): Promise<void> {
  const { DB } = storeEnv()
  await DB.batch([
    DB.prepare('DELETE FROM site_changes WHERE tenant_id = ? AND slug = ?').bind(tenantId, slug),
    DB.prepare('DELETE FROM site_assets WHERE tenant_id = ? AND slug = ?').bind(tenantId, slug),
    DB.prepare('DELETE FROM site_pages WHERE tenant_id = ? AND slug = ?').bind(tenantId, slug),
    DB.prepare('DELETE FROM sites WHERE tenant_id = ? AND slug = ?').bind(tenantId, slug),
  ])
}

describe('story-fde7370b — what a read of an unchanged draft costs, and what may be retained', () => {
  beforeAll(async () => {
    await applySchema()
    await ensureTenant(TENANT)
  })

  beforeEach(() => {
    // Every case starts cold, so a reuse asserted here was produced here.
    resetAssembledCache()
  })

  // ── AC-1447 ────────────────────────────────────────────────────────────────

  it('test_UAT_AC1447_an_unchanged_draft_assembles_once_with_currency_read_live_on_every_read', async () => {
    const { seed, store } = await seedSite()

    // 1 — a draft that has not moved costs no re-validation. IDENTITY, not
    // equality: an equal-but-distinct value is exactly what a re-assemble
    // produces, so equality would pass against the cost this criterion removes.
    const first = await store.loadDraft(seed.slug)
    const second = await store.loadDraft(seed.slug)
    expect(first?.result.ok).toBe(true)
    expect(second!.result).toBe(first!.result)
    expect(second!.stamp).toBe(first!.stamp)

    // 2 — any write is seen on the next read. The version is what decides
    // reuse, and every draft mutation advances it.
    await store.write(seed.slug, { pages: pagesMarked(seed, 'AC1447-same-handle') })
    const afterOwnWrite = await store.loadDraft(seed.slug)
    expect(afterOwnWrite!.result).not.toBe(first!.result)
    expect(afterOwnWrite!.stamp).not.toBe(first!.stamp)
    expect(dumpOf(afterOwnWrite!.result)).toContain('AC1447-same-handle')

    // 3 — INCLUDING AN ASSET WRITE, whose names the assembled definition
    // consumes as `assetFiles`. An asset write that left the version still
    // would be a mutation invisible to every later read.
    await store.write(seed.slug, { assets: [{ name: 'logo.svg', bytes: utf8(SVG) }] })
    const afterAsset = await store.loadDraft(seed.slug)
    expect(afterAsset!.result).not.toBe(afterOwnWrite!.result)
    expect(afterAsset!.stamp).not.toBe(afterOwnWrite!.stamp)
    expect(unwrap(afterAsset!.result, 'after asset write').assetFiles).toContain('logo.svg')

    // 4 — a write through a SECOND, INDEPENDENTLY OBTAINED handle is seen too.
    // A second handle stands in for the next request, or for a publish run from
    // the operator's own machine: the version that decides reuse is read live
    // from D1 rather than remembered, so the writer's identity is irrelevant.
    const other = await d1r2SiteStore(storeEnv()).forTenant(TENANT)
    await other.write(seed.slug, { pages: pagesMarked(seed, 'AC1447-written-elsewhere') })
    const afterElsewhere = await store.loadDraft(seed.slug)
    expect(afterElsewhere!.result).not.toBe(afterAsset!.result)
    expect(dumpOf(afterElsewhere!.result)).toContain('AC1447-written-elsewhere')

    // 5 — and end to end, through the editing surface's own preview route, which
    // reads the draft on EVERY request before consulting any render cache of its
    // own. Two requests at an unchanged version answer byte-identically; a save
    // makes the next request differ and carry the saved change.
    const firstResponse = await call(`/preview/${seed.slug}/edit/`)
    expect(firstResponse.status).toBe(200)
    const firstHtml = await firstResponse.text()

    const secondResponse = await call(`/preview/${seed.slug}/edit/`)
    expect(secondResponse.status).toBe(200)
    expect(await secondResponse.text()).toBe(firstHtml)

    await store.write(seed.slug, { pages: pagesMarked(seed, 'AC1447-saved') })

    const thirdResponse = await call(`/preview/${seed.slug}/edit/`)
    expect(thirdResponse.status).toBe(200)
    const thirdHtml = await thirdResponse.text()
    expect(thirdHtml).not.toBe(firstHtml)
    expect(thirdHtml).toContain('AC1447-saved')
  })

  // ── AC-1448 ────────────────────────────────────────────────────────────────

  it('test_UAT_AC1448_a_retained_assembled_draft_never_outlives_or_crosses_the_site_it_describes', async () => {
    // ── Dropping a site drops what was retained for it ────────────────────────
    const dropped = await seedSite()
    const beforeDrop = await dropped.store.loadDraft(dropped.seed.slug)
    expect(beforeDrop?.result.ok).toBe(true)

    await dropped.store.forget(dropped.seed.slug)
    expect(await dropped.store.loadDraft(dropped.seed.slug)).toBeNull()

    await dropped.store.createDraft(dropped.seed.slug)
    const recreated = siteSeed({ slug: dropped.seed.slug })
    await dropped.store.write(dropped.seed.slug, {
      siteJson: recreated.siteJson,
      pages: pagesMarked(recreated, 'AC1448-recreated'),
    })

    const afterRecreate = await dropped.store.loadDraft(dropped.seed.slug)
    expect(afterRecreate!.result).not.toBe(beforeDrop!.result)
    expect(dumpOf(afterRecreate!.result)).toContain('AC1448-recreated')
    // AND THIS IS WHY THE DROP IS NOT INCIDENTAL: the recreated site is back at
    // the very version the dropped one held, so the stamps match. A value left
    // behind would have been matched by a version comparison that is —
    // correctly — only ever about writes, and the second read would have
    // returned the dropped site's content.
    expect(afterRecreate!.stamp).toBe(beforeDrop!.stamp)

    // ── A read that finds no site drops it too ────────────────────────────────
    // The site disappears by a route that never tells the store, so the absence
    // is discovered by the read itself rather than announced by `forget`.
    const vanished = await seedSite()
    const beforeVanish = await vanished.store.loadDraft(vanished.seed.slug)
    expect(beforeVanish?.result.ok).toBe(true)

    await vanishSiteRows(TENANT, vanished.seed.slug)
    expect(await vanished.store.loadDraft(vanished.seed.slug)).toBeNull()

    await vanished.store.createDraft(vanished.seed.slug)
    const reborn = siteSeed({ slug: vanished.seed.slug })
    await vanished.store.write(vanished.seed.slug, {
      siteJson: reborn.siteJson,
      pages: pagesMarked(reborn, 'AC1448-reappeared'),
    })

    const afterVanish = await vanished.store.loadDraft(vanished.seed.slug)
    expect(afterVanish!.result).not.toBe(beforeVanish!.result)
    expect(dumpOf(afterVanish!.result)).toContain('AC1448-reappeared')
    expect(afterVanish!.stamp).toBe(beforeVanish!.stamp)

    // ── Two accounts holding a site of the same name ──────────────────────────
    // What is retained is identified by account AND slug together, so the
    // account barrier the handle establishes is not quietly undone by reuse
    // between reads. This is the one failure this retention could cause that
    // would be worse than being slow.
    const shared = nextSlug('ac1448-shared')
    const accounts: TenantSiteStore[] = []
    for (const [tenantId, marker] of [
      ['ac1448-account-a', 'AC1448-content-a'],
      ['ac1448-account-b', 'AC1448-content-b'],
    ]) {
      const store = await tenantStore(tenantId)
      const seed = siteSeed({ slug: shared })
      await store.createDraft(shared)
      await store.write(shared, {
        siteJson: seed.siteJson,
        pages: pagesMarked(seed, marker),
      })
      accounts.push(store)
    }

    const a = await accounts[0].loadDraft(shared)
    const b = await accounts[1].loadDraft(shared)
    expect(dumpOf(a!.result)).toContain('AC1448-content-a')
    expect(dumpOf(b!.result)).toContain('AC1448-content-b')
    expect(b!.result).not.toBe(a!.result)

    // Reading A again AFTER B has read the same slug: still A's own value, by
    // identity. Were the two accounts sharing one slot, B's read would have
    // replaced it and this would be a fresh assemble at best — or B's content
    // at worst.
    const aAgain = await accounts[0].loadDraft(shared)
    expect(aAgain!.result).toBe(a!.result)
    expect(dumpOf(aAgain!.result)).toContain('AC1448-content-a')
  })
})
