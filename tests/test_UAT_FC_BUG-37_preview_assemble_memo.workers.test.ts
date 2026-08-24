import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { d1r2SiteStore, resetAssembledCache } from '../tools/generate/src/store/d1r2-store'
import { applySchema, ensureTenant, storeEnv, tenantStore } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'

/**
 * BUG-37 — a preview request must not re-validate the whole definition.
 *
 * WHAT THE BUG WAS. `PreviewRenderer.file()` calls `loadDraft` on every request
 * before consulting its own render cache, deliberately, so the stamp check stays
 * a store read. `assembleSite` ran inside `loadDraft`, so `validateSite` over the
 * entire site ran once per preview BYTE — 72-89ms of a ~78ms request, against
 * 2-3ms of D1 I/O and 1-4ms of rendering. On the Workers Free plan's 10ms CPU
 * ceiling that was an unconditional 1102.
 *
 * WHY THESE ASSERT OBJECT IDENTITY. A timing assertion for a performance fix is
 * flaky by construction. Identity is the *deterministic* form of the same claim:
 * `assembleSite` builds a fresh object every call, so a second `loadDraft`
 * returning the SAME object can only mean the assemble was skipped. A different
 * object means it ran again.
 *
 * The invalidation cases matter more than the hit case. A cache that never
 * serves a stale definition but saves nothing is merely slow; one that saves
 * time and serves yesterday's page is a data bug wearing a performance fix.
 */

const TENANT = 'bug37'

function workerEnv(overrides: Partial<Env> = {}): Env {
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
    ...overrides,
  } as Env
}

const call = (path: string, init?: RequestInit): Promise<Response> =>
  worker.fetch(new Request(`https://app.example${path}`, init), workerEnv())

/** Seed one site through the store, exactly as an import would write it. */
async function seedSite(tenantId = TENANT) {
  const seed = siteSeed({ slug: nextSlug('bug37') })
  const store = await tenantStore(tenantId)
  await store.createDraft(seed.slug)
  await store.write(seed.slug, {
    siteJson: seed.siteJson,
    pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page })),
    assets: Object.entries(seed.assets).map(([name, bytes]) => ({ name, bytes })),
  })
  return { seed, store }
}

/**
 * The seed's pages with their visible copy replaced by `marker`.
 *
 * The mutation has to be a field the VALIDATOR KEEPS and the RENDERER PAINTS.
 * An unknown key on `site.json` satisfies neither — `validateSite` strips it, so
 * the version moves while the assembled value does not, and a test written that
 * way asserts nothing about invalidation.
 */
function pagesMarked(seed: { pages: Record<string, unknown> }, marker: string) {
  return Object.entries(seed.pages).map(([name, page]) => {
    const copy = JSON.parse(JSON.stringify(page)) as {
      l1: { root: { children: { text?: string }[] } }
    }
    copy.l1.root.children[0].text = marker
    return { name, page: copy as unknown as Record<string, unknown> }
  })
}

/** The whole assembled value as text, so a marker can be looked for anywhere in it. */
function dumpOf(result: unknown): string {
  return JSON.stringify(result)
}

describe('BUG-37 — the assembled draft is memoised per isolate', () => {
  beforeAll(async () => {
    await applySchema()
    await ensureTenant(TENANT)
  })

  beforeEach(() => {
    // Every case starts cold, so a hit asserted here was produced here.
    resetAssembledCache()
  })

  it('test_UAT_FC_BUG-37_an_unchanged_draft_is_assembled_once', async () => {
    // AC-1. The fix itself: two reads at the same version cost one assemble.
    const { seed, store } = await seedSite()

    const first = await store.loadDraft(seed.slug)
    const second = await store.loadDraft(seed.slug)

    expect(first?.result.ok).toBe(true)
    expect(second?.result.ok).toBe(true)
    // Identity, not equality — see the header. Equality would also hold if the
    // definition had been re-validated from scratch, which is the bug.
    expect(second!.result).toBe(first!.result)
    expect(second!.stamp).toBe(first!.stamp)
  })

  it('test_UAT_FC_BUG-37_a_write_invalidates_the_memo', async () => {
    // AC-2, and the one that matters most: the memo must never outlive the
    // definition it describes. Every draft mutation bumps `version`, which is
    // what the memo is checked against.
    const { seed, store } = await seedSite()

    const before = await store.loadDraft(seed.slug)
    expect(before?.result.ok).toBe(true)

    await store.write(seed.slug, { pages: pagesMarked(seed, 'renamed-by-uat') })

    const after = await store.loadDraft(seed.slug)
    expect(after!.result).not.toBe(before!.result)
    expect(after!.stamp).not.toBe(before!.stamp)
    expect(dumpOf(after!.result)).toContain('renamed-by-uat')
  })

  it('test_UAT_FC_BUG-37_a_write_through_another_handle_invalidates_the_memo', async () => {
    // AC-3. The memo lives for the ISOLATE while a store handle lives for one
    // request, so the two must not be tied together. A second handle stands in
    // for the next request — or for `bin/publish` writing from a laptop. The
    // version is re-read from D1 every time, so the writer's identity is
    // irrelevant, which is exactly the property being pinned.
    const { seed, store } = await seedSite()

    const before = await store.loadDraft(seed.slug)
    expect(before?.result.ok).toBe(true)

    const other = await d1r2SiteStore(storeEnv()).forTenant(TENANT)
    await other.write(seed.slug, { pages: pagesMarked(seed, 'written-elsewhere') })

    const after = await store.loadDraft(seed.slug)
    expect(after!.result).not.toBe(before!.result)
    expect(dumpOf(after!.result)).toContain('written-elsewhere')
  })

  it('test_UAT_FC_BUG-37_the_memo_does_not_leak_across_tenants', async () => {
    // AC-4. The key is `(tenantId, slug)`, and two accounts may hold the same
    // slug. Sharing an entry between them would be a cross-tenant read — the
    // one failure this cache could cause that is worse than being slow.
    const slug = nextSlug('bug37-shared')
    for (const [tenantId, marker] of [
      ['bug37-a', 'tenant-a-content'],
      ['bug37-b', 'tenant-b-content'],
    ]) {
      const store = await tenantStore(tenantId)
      const seed = siteSeed({ slug })
      await store.createDraft(slug)
      await store.write(slug, {
        siteJson: seed.siteJson,
        pages: pagesMarked(seed, marker),
      })
    }

    const a = await (await tenantStore('bug37-a')).loadDraft(slug)
    const b = await (await tenantStore('bug37-b')).loadDraft(slug)

    expect(dumpOf(a!.result)).toContain('tenant-a-content')
    expect(dumpOf(b!.result)).toContain('tenant-b-content')
    expect(b!.result).not.toBe(a!.result)
  })

  it('test_UAT_FC_BUG-37_forgetting_a_site_drops_its_memo', async () => {
    // AC-5. A recreated site starts at version 0 again, so an entry left behind
    // could be matched by a version comparison that is — correctly — only about
    // writes. `forget` drops it, and a `loadDraft` that finds no row drops it too.
    const { seed, store } = await seedSite()
    const before = await store.loadDraft(seed.slug)
    expect(before?.result.ok).toBe(true)

    await store.forget(seed.slug)
    expect(await store.loadDraft(seed.slug)).toBeNull()

    await store.createDraft(seed.slug)
    const recreated = siteSeed({ slug: seed.slug })
    await store.write(seed.slug, {
      siteJson: recreated.siteJson,
      pages: pagesMarked(recreated, 'recreated-site'),
    })

    const after = await store.loadDraft(seed.slug)
    expect(after!.result).not.toBe(before!.result)
    expect(dumpOf(after!.result)).toContain('recreated-site')
  })

  it('test_UAT_FC_BUG-37_the_edit_channel_serves_current_bytes_after_a_save', async () => {
    // AC-6 — end to end, through the Worker's own `fetch`, on the route the bug
    // was reported against. This is the assertion that would fail if the memo
    // were keyed on anything that a save does not move: the operator edits, the
    // iframe reloads, and the reload must show the edit rather than the render
    // that preceded it.
    const { seed, store } = await seedSite()

    const first = await call(`/preview/${seed.slug}/edit/`)
    expect(first.status).toBe(200)
    const beforeHtml = await first.text()

    // A second request at the same version: the memo's hit path, and it must
    // still be a byte-identical answer rather than a differently-assembled one.
    const second = await call(`/preview/${seed.slug}/edit/`)
    expect(second.status).toBe(200)
    expect(await second.text()).toBe(beforeHtml)

    await store.write(seed.slug, { pages: pagesMarked(seed, 'saved-by-uat') })

    const third = await call(`/preview/${seed.slug}/edit/`)
    expect(third.status).toBe(200)
    const afterHtml = await third.text()
    expect(afterHtml).not.toBe(beforeHtml)
    expect(afterHtml).toContain('saved-by-uat')
  })
})
