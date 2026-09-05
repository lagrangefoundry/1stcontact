import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { applySchema, ensureTenant, tenantStore } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'

/**
 * BUG-51 — **the local store is preserved unless the operator says otherwise.**
 *
 * WHAT WAS LOST AND HOW. A demo site built through the builder came back as a
 * blank starter page. It had not been deleted: its change journal, its uploaded
 * asset, its audit trail and its chat transcript were all still there, and only
 * `site.json` and `home.json` had been replaced — by the scaffold `1c new`
 * emits. `sites.version` was 26 and `sites.counter` 16, so the row had never
 * been recreated; something had written over it. The path that can do that is
 * `POST /api/import`, which replaces rather than merges, and whose own docstring
 * called re-running it "the ordinary way to use it".
 *
 * WHY THESE ASSERTIONS ARE EVIDENCE. They run inside workerd, through the
 * Worker's own `fetch`, against the real D1 and R2 the deployed Worker uses, with
 * the schema applied from `db/migrations`. The refusal is proved the only way a
 * refusal about data loss can be: by reading the stored page back and comparing
 * it byte for byte with what was there before the attempt.
 *
 * THE COUNTER, NOT THE VERSION, is what the guard reads, and one case here exists
 * solely to hold that line: an ordinary publish-edit-publish loop must keep
 * working. `write` bumps `version` on every call including the import's own, so a
 * version guard would refuse the second `bin/publish` of a site nobody had
 * touched in the builder. `counter` moves only through `appendChange`.
 */

const TENANT = 'bug51'

function workerEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    TENANT_ID: TENANT,
    // Loopback dev-open, as every other workerd suite here does it: Access is
    // unconfigured in the test runtime and would otherwise refuse every request
    // before the route under test ran.
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ASSETS: {
      fetch: async () => new Response('asset', { status: 200 }),
    } as unknown as Fetcher,
    ...overrides,
  }
}

const call = (path: string, init?: RequestInit): Promise<Response> =>
  worker.fetch(new Request(`https://app.example/${path.replace(/^\//, '')}`, init), workerEnv())

/** A payload in exactly the shape `1c push` sends. */
function payloadFor(slug: string, heading?: string) {
  const seed = siteSeed({ slug })
  const pages = Object.entries(seed.pages).map(([name, page]) => ({
    name,
    page: heading === undefined ? page : { ...page, title: heading },
  }))
  return {
    slug: seed.slug,
    siteJson: seed.siteJson as Record<string, unknown>,
    pages,
    assets: [] as { name: string; base64: string }[],
  }
}

function importSite(payload: Record<string, unknown>): Promise<Response> {
  return call('/api/import', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

/** The stored page, as bytes-equivalent JSON — what "unchanged" has to mean. */
async function storedPage(slug: string, name = 'home.json'): Promise<unknown> {
  const store = await tenantStore(TENANT)
  const pages = await store.readPages(slug)
  return pages.find((p) => p.name === name)?.page ?? null
}

beforeAll(async () => {
  await applySchema()
  await ensureTenant(TENANT)
})

describe('BUG-51 — an import never silently replaces work done in the builder', () => {
  it('lands on a site that does not exist yet', async () => {
    const payload = payloadFor(nextSlug())
    const res = await importSite(payload)
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ pages: 1, siteJson: true })
  })

  it('lands again on a site only ever published from local — the ordinary loop', async () => {
    // THE CASE A VERSION GUARD WOULD HAVE BROKEN. This site's `version` is
    // already non-zero after the first import, because `write` bumps it. Its
    // `counter` is still zero, because nothing has been journalled. Publish,
    // edit locally, publish again is the loop `bin/publish` exists for and it
    // must not need a flag.
    const slug = nextSlug()
    expect((await importSite(payloadFor(slug))).status).toBe(200)

    const store = await tenantStore(TENANT)
    expect(await store.counter(slug)).toBe(0)

    const second = await importSite(payloadFor(slug, 'Second publish'))
    expect(second.status).toBe(200)
    expect(await storedPage(slug)).toMatchObject({ title: 'Second publish' })
  })

  it('is refused with 409, and the stored page is unchanged, once the builder has edited it', async () => {
    const slug = nextSlug()
    expect((await importSite(payloadFor(slug, 'Built here'))).status).toBe(200)

    // One journalled change is all it takes to make this site somebody's work.
    // `appendChange` is what a builder edit, an AI turn and a structured-edit
    // command all go through, which is why it is the signal being read.
    const store = await tenantStore(TENANT)
    await store.appendChange(slug, {
      op: 'copy.set',
      label: 'headline',
      actor: 'ai',
      summary: 'Wrote the headline.',
    })
    expect(await store.counter(slug)).toBe(1)

    const before = await storedPage(slug)

    const res = await importSite(payloadFor(slug, 'Scaffold from a worktree'))
    expect(res.status).toBe(409)
    const body = (await res.json()) as { error: string; slug: string; changes: number }
    expect(body.slug).toBe(slug)
    expect(body.changes).toBe(1)
    // The refusal has to name what it protected. "Conflict" alone would leave the
    // operator to guess whether anything landed — which is the state BUG-51 left
    // them in for a day.
    expect(body.error).toContain('Nothing was written')

    // THE ASSERTION THE WHOLE TICKET IS ABOUT.
    expect(await storedPage(slug)).toEqual(before)
    expect(before).toMatchObject({ title: 'Built here' })
  })

  it('lands when the caller says force, which is the operator meaning it', async () => {
    const slug = nextSlug()
    expect((await importSite(payloadFor(slug, 'Built here'))).status).toBe(200)
    const store = await tenantStore(TENANT)
    await store.appendChange(slug, {
      op: 'copy.set',
      label: 'headline',
      actor: 'ai',
      summary: 'Wrote the headline.',
    })

    expect((await importSite(payloadFor(slug, 'Scaffold from a worktree'))).status).toBe(409)

    const forced = await importSite({ ...payloadFor(slug, 'Forced'), force: true })
    expect(forced.status).toBe(200)
    expect(await storedPage(slug)).toMatchObject({ title: 'Forced' })
  })
})

describe('BUG-51 — createDraft reports whether it created the site', () => {
  /**
   * THE INFORMATION THAT WAS BEING THROWN AWAY. `INSERT OR IGNORE` has always
   * known whether it inserted; the port returned `void`, so every caller followed
   * it with an unconditional `write` and the "or ignore" protected nothing. This
   * is what lets a caller seed an empty site without being able to overwrite a
   * full one — the guarded form `identity.createStarterSite` now uses.
   */
  it('is true the first time and false the second, for the same slug', async () => {
    const store = await tenantStore(TENANT)
    const slug = nextSlug()
    expect(await store.createDraft(slug)).toBe(true)
    expect(await store.createDraft(slug)).toBe(false)
  })

  it('leaves an existing site untouched when the caller only seeds on creation', async () => {
    // The `createStarterSite` shape, exercised at the store level: create, and
    // write the scaffold ONLY if the create happened. Run twice over a site that
    // has since been authored, the second run must change nothing.
    const store = await tenantStore(TENANT)
    const slug = nextSlug()
    const seed = siteSeed({ slug })

    const seedIfNew = async (): Promise<void> => {
      if (await store.createDraft(slug)) {
        await store.write(slug, {
          siteJson: seed.siteJson as Record<string, unknown>,
          pages: [{ name: 'home.json', page: { id: 'home', title: 'Starter' } }],
        })
      }
    }

    await seedIfNew()
    await store.write(slug, { pages: [{ name: 'home.json', page: { id: 'home', title: 'Authored' } }] })

    await seedIfNew()
    expect(await storedPage(slug)).toMatchObject({ title: 'Authored' })
  })
})
