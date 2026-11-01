import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { pushSite } from '../tools/generate/src/cli/push'
import { d1r2SiteStore, type TenantSiteStore } from '../tools/generate/src/store/d1r2-store'
import { applySchema, ensureTenant, tenantStore } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'

/**
 * AC-2227 — an import into a site with builder-recorded changes is refused 409
 * naming the slug and the change count, and the stored site is byte-identical
 * afterwards; the same import with `force: true` lands.
 *
 * Everything runs inside workerd, through the Worker's own `fetch`, against the
 * real D1 and R2 bindings with the schema applied from `db/migrations`. The
 * client half — what `1c push` puts on the wire — is the real `pushSite`, with
 * only its `fetch` pointed at that same Worker in-process and recorded.
 */

const TENANT = 'ac2227-import-guard'
const LOCAL = 'ac2227-local'
const ORIGIN = 'https://app.example'

function workerEnv(): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    TENANT_ID: TENANT,
    // Loopback dev-open: Access is unconfigured in the test runtime.
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ASSETS: {
      fetch: async () => new Response('asset', { status: 200 }),
    } as unknown as Fetcher,
  }
}

const importSite = (payload: Record<string, unknown>): Promise<Response> =>
  worker.fetch(
    new Request(`${ORIGIN}/api/import`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    }),
    workerEnv(),
  )

/** A payload in exactly the shape `1c push` sends. */
function payloadFor(slug: string, title: string) {
  const seed = siteSeed({ slug })
  return {
    slug: seed.slug,
    siteJson: seed.siteJson as Record<string, unknown>,
    pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page: { ...page, title } })),
    assets: [] as { name: string; base64: string }[],
  }
}

/** One builder-recorded change: what an edit, an AI turn or a structured edit appends. */
async function recordBuilderChange(slug: string): Promise<void> {
  const store = await tenantStore(TENANT)
  await store.appendChange(slug, {
    op: 'copy.set',
    label: 'headline',
    actor: 'ai',
    summary: 'Wrote the headline.',
  })
}

/** The stored definition and every page, serialised — what "byte-identical" compares. */
async function storedBytes(slug: string): Promise<{ siteJson: string; pages: string[] }> {
  const store = await tenantStore(TENANT)
  const siteJson = JSON.stringify(await store.readSiteJson(slug))
  const pages = (await store.readPages(slug))
    .map((p) => `${p.name}:${JSON.stringify(p.page)}`)
    .sort()
  return { siteJson, pages }
}

beforeAll(async () => {
  await applySchema()
  await ensureTenant(TENANT)
})

describe('AC-2227 — the import guard', () => {
  it('test_UAT_AC2227_a_builder_changed_site_refuses_409_and_is_byte_identical_force_lands', async () => {
    const slug = nextSlug()
    expect((await importSite(payloadFor(slug, 'Built here'))).status).toBe(200)
    await recordBuilderChange(slug)

    const before = await storedBytes(slug)
    expect(before.pages.length).toBeGreaterThan(0)
    expect(before.pages.join('\n')).toContain('Built here')

    const refused = await importSite(payloadFor(slug, 'A different payload'))
    expect(refused.status).toBe(409)
    const body = (await refused.json()) as {
      error: string
      slug: string
      changes: number
      force: string
    }
    expect(body.slug).toBe(slug)
    expect(body.changes).toBe(1)
    // The message names both, so a person reading only the sentence knows what
    // was protected and how much of it.
    expect(body.error).toContain(`'${slug}'`)
    expect(body.error).toContain('1 change(s)')
    expect(body.error).toContain('Nothing was written')
    // A separate field tells a program how to mean it.
    expect(body.force).toContain('"force": true')

    // Nothing written: the definition and every page are exactly as before.
    expect(await storedBytes(slug)).toEqual(before)

    // Any value of force other than `true` is not an override.
    for (const notForce of [false, 'true', 1]) {
      const res = await importSite({ ...payloadFor(slug, 'Not forced'), force: notForce })
      expect(res.status, String(notForce)).toBe(409)
    }
    expect(await storedBytes(slug)).toEqual(before)

    // `force: true` lands, and the stored page now matches the payload.
    const forced = await importSite({ ...payloadFor(slug, 'Forced'), force: true })
    expect(forced.status).toBe(200)
    const after = await storedBytes(slug)
    expect(after.pages.join('\n')).toContain('"title":"Forced"')
    expect(after.pages.join('\n')).not.toContain('Built here')
  })

  it('test_UAT_AC2227_a_fresh_slug_and_an_import_only_slug_both_land', async () => {
    // A slug that does not exist.
    const fresh = nextSlug()
    const first = await importSite(payloadFor(fresh, 'First'))
    expect(first.status).toBe(200)

    // The same slug again, having only ever been imported to: its write version
    // is already raised, its change count is zero, and it lands.
    const store = await tenantStore(TENANT)
    expect(await store.counter(fresh)).toBe(0)
    const second = await importSite(payloadFor(fresh, 'Second'))
    expect(second.status).toBe(200)
    expect((await storedBytes(fresh)).pages.join('\n')).toContain('"title":"Second"')
  })

  it('test_UAT_AC2227_1c_push_omits_force_unless_asked_and_force_sends_true', async () => {
    // The operator's local store, holding one site.
    const root = d1r2SiteStore({ DB: env.DB, SITES: env.SITES })
    await root.createTenant({ id: LOCAL, name: LOCAL })
    const local: TenantSiteStore = await root.forTenant(LOCAL)
    const seed = siteSeed({ slug: nextSlug('push') })
    await local.createDraft(seed.slug)
    await local.write(seed.slug, {
      siteJson: seed.siteJson,
      pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page })),
    })

    const sent: Record<string, unknown>[] = []
    const recording = (async (input: RequestInfo | URL, init?: RequestInit) => {
      sent.push(JSON.parse(String(init?.body)) as Record<string, unknown>)
      return worker.fetch(new Request(String(input), init), workerEnv())
    }) as typeof fetch

    // An ordinary push: no `force` key on the wire at all.
    await pushSite(local, seed.slug, { origin: ORIGIN, fetch: recording })
    expect(sent[0]).not.toHaveProperty('force')

    // Once the builder has recorded a change, the ordinary push is refused and
    // the refusal reaches the operator naming the flag that means it.
    await recordBuilderChange(seed.slug)
    await expect(pushSite(local, seed.slug, { origin: ORIGIN, fetch: recording })).rejects.toThrow(
      /refused with 409[\s\S]*Pass --force/,
    )
    expect(sent[1]).not.toHaveProperty('force')

    // `--force` sends `force: true`, and the import lands.
    const forced = await pushSite(local, seed.slug, { origin: ORIGIN, fetch: recording, force: true })
    expect(sent[2].force).toBe(true)
    expect(forced.landed.siteJson).toBe(true)
  })
})
