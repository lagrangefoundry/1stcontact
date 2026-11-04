import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import controlApp from '../apps/control-app/src/index'
import type { Env as ControlEnv } from '../apps/control-app/src/index'
import publicSite from '../apps/public-site/src/index'
import type { Env as PublicEnv } from '../apps/public-site/src/index'
import {
  STARTER_HEADING,
  STARTER_NAME,
  STARTER_SLUG,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import { checkoutRevision, publishSite } from '../tools/generate/src/publish/publish'
import { publishedPrefix } from '../tools/generate/src/store/revision-model'
import { applySchema } from './support/d1-site-factory'
import { inviteAccount } from './support/invite-account'
import { nextSlug, siteSeed } from './support/site-seed'

/**
 * Reconciliation UATs for story-5349d01f — **publishing a site to shared
 * storage**, the criteria that can only be proved where the code actually runs:
 * inside workerd, against a real D1 database and a real R2 bucket.
 *
 *   AC-1418 — a publish mints a revision, renders it and stores it with NO
 *             FILESYSTEM anywhere on the path, and the builder's front door and
 *             the command line's front door produce the same store state from
 *             the same draft.
 *   AC-2245 — two businesses can each publish a site called `home`; publishing
 *             records no claim and consults none.
 *   AC-2246 — a new account's starter site is slug `unnamed`, named `Unnamed`,
 *             and every account publishes it without colliding.
 *
 * AC-1422 (a second account refused over a claimed slug) is SUPERSEDED by
 * [[REQ-190]]: the published address is the site's opaque key, so there is no
 * name to claim and no refusal to prove. AC-2245 is its replacement.
 *
 * WHY workerd AND NOT NODE. "No filesystem on the path" passes trivially in Node
 * whether it is true or not — the filesystem is *there*. Here there is no
 * filesystem to fall back on: if publish reached for one the test would fail to
 * run. And "two businesses each publish `home`" is a property of the real
 * schema's keys and unique indexes, which only a real SQLite can enforce.
 *
 * NOTHING BELOW IS A DOUBLE except `ASSETS`, which is the static-asset binding
 * for build artifacts and has nothing to do with a publish.
 */

const TENANT = 'story5349-publish'
const OTHER_TENANT = 'story5349-other'
const PLATFORM = 'story5349-platform'
const PUBLIC_ORIGIN = 'https://1stcontact.io'

function controlEnv(overrides: Partial<ControlEnv> = {}): ControlEnv {
  return {
    DB: env.DB,
    SITES: env.SITES,
    TENANT_ID: TENANT,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ASSETS: {
      fetch: async (request: Request | string) =>
        new Response(
          `asset:${new URL(typeof request === 'string' ? request : request.url).pathname}`,
          { status: 200 },
        ),
    } as unknown as Fetcher,
    ...overrides,
  }
}

/** Drive the builder's own entry point — its `fetch`, its router, its bindings. */
const call = (
  path: string,
  init?: RequestInit,
  overrides?: Partial<ControlEnv>,
): Promise<Response> =>
  controlApp.fetch(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, init),
    controlEnv(overrides),
  )

/** Drive `public-site`'s own entry point, with its own bindings. */
async function serve(path: string): Promise<Response> {
  const waits: Promise<unknown>[] = []
  const ctx = {
    waitUntil: (p: Promise<unknown>) => void waits.push(p),
    passThroughOnException: () => {},
    props: {},
  }
  const res = await publicSite.fetch(
    new Request(`${PUBLIC_ORIGIN}${path}`),
    { SITES: env.SITES, DB: env.DB } as PublicEnv,
    ctx as unknown as ExecutionContext,
  )
  await Promise.all(waits)
  return res
}

/**
 * A site made only of L1, from the real scaffolder rather than a fixture written
 * here — a hand-rolled definition restates the schema, and one that drifts from
 * the validator fails as "this draft does not validate", which is a test
 * asserting its own mistake. `marker` replaces the home page's first text leaf
 * so two sites' served bytes can be told apart.
 */
function pureL1Site(slug = nextSlug('story5349'), marker?: string) {
  const seed = siteSeed({ slug })
  return {
    slug: seed.slug,
    siteJson: seed.siteJson as Record<string, unknown>,
    pages: Object.entries(seed.pages).map(([name, page]) => {
      const copy = page as Record<string, unknown>
      if (marker !== undefined) {
        ;(copy.l1 as { root: { children: Array<{ text: string }> } }).root.children[0].text = marker
      }
      return { name, page: copy }
    }),
    assets: [] as { name: string; base64: string }[],
  }
}

async function importSite(
  payload: ReturnType<typeof pureL1Site>,
  overrides?: Partial<ControlEnv>,
): Promise<void> {
  const res = await call(
    '/api/import',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    },
    overrides,
  )
  expect(res.status).toBe(200)
}

const publish = (
  slug: string,
  message?: string,
  overrides?: Partial<ControlEnv>,
): Promise<Response> =>
  call(
    '/api/publish',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug, message }),
    },
    overrides,
  )

/** The site's opaque key, asked of the business's own handle ([[REQ-190]]). */
async function siteKeyOf(slug: string, tenant = TENANT): Promise<string> {
  const store = await d1r2SiteStore({ DB: env.DB, SITES: env.SITES }).forTenant(tenant)
  const key = await store.siteKey(slug)
  expect(key, `${tenant} holds no site '${slug}'`).not.toBeNull()
  return key as string
}

/**
 * Everything R2 holds under one revision, keyed by its path WITHIN the revision.
 *
 * Addressed by the site's KEY — revisions live under `sites/<siteId>/rev/…`, and
 * the slug appears in no object key ([[REQ-190]]). Relative rather than absolute
 * so two revisions can be compared at all: the revision number is part of every
 * absolute key, and "the same store state" is a claim about the contents.
 */
async function revisionTree(siteKey: string, id: number): Promise<Map<string, string>> {
  const prefix = `${publishedPrefix(siteKey, id)}/`
  const tree = new Map<string, string>()
  let cursor: string | undefined
  do {
    const page = await env.SITES.list({ prefix, cursor })
    for (const object of page.objects) {
      const body = await env.SITES.get(object.key)
      tree.set(object.key.slice(prefix.length), body === null ? '' : await body.text())
    }
    cursor = page.truncated ? page.cursor : undefined
  } while (cursor !== undefined)
  return tree
}

/** Every platform source file, as text — for asserting what NOTHING reads. */
const platformSource = import.meta.glob(
  [
    '../apps/*/src/**/*.ts',
    '../tools/generate/src/**/*.ts',
    '../packages/*/src/**/*.ts',
    '../db/migrations/*.sql',
  ],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>

describe('story-5349d01f — publishing in the cloud, where there is no filesystem', () => {
  beforeAll(async () => {
    await applySchema()
  })

  it('test_UAT_AC1418_publish_mints_renders_and_stores_identically_from_both_front_doors', async () => {
    // ── ARRANGE — a site in the CLOUD store. Nothing was written to a disk to
    // get it there: the payload went over the import route and landed in D1.
    const site = pureL1Site()
    await importSite(site)

    // ── ACT (front door 1) — the builder's publish request, driven through the
    // Worker's own `fetch`, inside workerd.
    const res = await publish(site.slug, 'launch')

    // ── ASSERT — the first publish of a site is revision 1, and it is NEW.
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      id: number
      published: boolean
      url: string | null
      changes: { added: string[]; modified: string[]; removed: string[] }
    }
    expect(body.id).toBe(1)
    expect(body.published).toBe(true)

    // The address it reports is the site's KEY, not its slug.
    const key = await siteKeyOf(site.slug)
    expect(body.url).toBe(`${PUBLIC_ORIGIN}/site/${key}/`)

    // The change list names the STORE's own keys — the site record and the page
    // record — not a filesystem's paths, and every path is `added` on a first
    // publish because there is no previous revision for anything to differ from.
    expect(body.changes.added).toContain('site.json')
    expect(body.changes.added).toContain('pages/home.json')
    expect(body.changes.modified).toEqual([])
    expect(body.changes.removed).toEqual([])

    // The bytes really are in the bucket, under the revision's own location:
    // the rendered entry document, and the frozen definition beside it.
    const r1 = await revisionTree(key, 1)
    expect(r1.get('out/index.html')).toContain('theme.css')
    expect(r1.has('source/site.json')).toBe(true)
    expect(r1.has('source/pages/home.json')).toBe(true)

    // The site listing now reports that revision as live, where it previously
    // reported that nothing was known.
    const listed = await call('/api/sites')
    expect(listed.status).toBe(200)
    const sites = (await listed.json()) as Array<{ slug: string; latest: number | null }>
    expect(sites.find((s) => s.slug === site.slug)?.latest).toBe(1)

    // ── ACT (front door 2) — the SAME draft, on the SAME store, published by
    // calling `publishSite` directly: this is what `1c publish` calls, with the
    // filesystem store in place of this one. Getting back to that same draft is
    // itself the forward-only path — edit, publish, then check r1 out again —
    // so what r3 freezes is byte-for-byte the definition r1 froze.
    const store = await d1r2SiteStore({ DB: env.DB, SITES: env.SITES }).forTenant(TENANT)
    const pages = await store.readPages(site.slug)
    const edited = structuredClone(pages[0].page) as Record<string, unknown>
    edited.title = 'Interlude'
    await store.write(site.slug, { pages: [{ name: pages[0].name, page: edited }] })
    expect((await publishSite(store, site.slug, { message: 'interlude' })).id).toBe(2)

    await checkoutRevision(store, site.slug, 1)
    const third = await publishSite(store, site.slug, { message: 'launch' })
    expect(third.id).toBe(3)
    expect(third.published).toBe(true)

    // ── ASSERT — the two front doors produced the same store state. Same key
    // set, same bytes, key for key. If the route had a publish of its own the
    // renders could agree and the frozen halves still differ; comparing the
    // whole tree is what makes that unavailable as an explanation.
    const r3 = await revisionTree(key, 3)
    expect([...r3.keys()].sort()).toEqual([...r1.keys()].sort())
    for (const [rel, text] of r1) expect(r3.get(rel), rel).toBe(text)

    // And the audit digest agrees, which is the question a change list cannot
    // answer: are these the same bytes?
    const log = await store.revisions(site.slug)
    expect(log.find((r) => r.id === 3)!.sha).toBe(log.find((r) => r.id === 1)!.sha)

    // ── ASSERT — there is exactly ONE publish implementation. The local
    // transport used to intercept `/api/publish` on the way past and answer it
    // from a filesystem revision store; that route is deleted rather than kept
    // as a local fast path.
    const builderSource = (
      (await import('../tools/generate/src/cli/builder.ts?raw')) as { default: string }
    ).default
    expect(builderSource).not.toContain("'/api/publish'")

    // …and the content-addressed deploy command it used to call is gone from the
    // tool entirely, rather than left beside publish as a second way to ship.
    const cliSource = (
      (await import('../tools/generate/src/cli/index.ts?raw')) as { default: string }
    ).default
    expect(cliSource).not.toMatch(/case 'deploy'/)
  })

  it('test_UAT_AC2245_two_businesses_each_publish_home_and_no_claim_is_recorded_or_consulted', async () => {
    // ── ARRANGE — two businesses, each holding a site whose slug is `home`.
    const root = d1r2SiteStore({ DB: env.DB, SITES: env.SITES })
    await root.createTenant({ id: OTHER_TENANT, name: OTHER_TENANT })
    const ours = { TENANT_ID: TENANT }
    const theirs = { TENANT_ID: OTHER_TENANT }
    await importSite(pureL1Site('home', 'OUR-HOME'), ours)
    await importSite(pureL1Site('home', 'THEIR-HOME'), theirs)

    // ── ACT — both publish through the builder's own route, one after the other.
    const first = await publish('home', 'ours', ours)
    const second = await publish('home', 'theirs', theirs)

    // ── ASSERT — neither is refused; each mints its own revision 1.
    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    const a = (await first.json()) as { id: number; published: boolean; url: string }
    const b = (await second.json()) as { id: number; published: boolean; url: string }
    expect(a).toMatchObject({ id: 1, published: true })
    expect(b).toMatchObject({ id: 1, published: true })

    // Two different addresses, each the site's own key, each serving its own page.
    const ourKey = await siteKeyOf('home', TENANT)
    const theirKey = await siteKeyOf('home', OTHER_TENANT)
    expect(ourKey).not.toBe(theirKey)
    expect(a.url).toBe(`${PUBLIC_ORIGIN}/site/${ourKey}/`)
    expect(b.url).toBe(`${PUBLIC_ORIGIN}/site/${theirKey}/`)
    const ourPage = await (await serve(`/site/${ourKey}/`)).text()
    const theirPage = await (await serve(`/site/${theirKey}/`)).text()
    expect(ourPage).toContain('OUR-HOME')
    expect(ourPage).not.toContain('THEIR-HOME')
    expect(theirPage).toContain('THEIR-HOME')
    expect(theirPage).not.toContain('OUR-HOME')

    // The second publish told nobody that the first exists: its response carries
    // no error and nothing naming another business.
    expect(JSON.stringify(b)).not.toContain('another account')
    expect(JSON.stringify(b)).not.toContain(TENANT)

    // NO CLAIM IS RECORDED. The schema holds no claim table, and the only
    // uniqueness on a slug is scoped to its business.
    const { results: tables } = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table'",
    ).all<{ name: string }>()
    const names = (tables ?? []).map((t) => t.name)
    expect(names).toContain('sites')
    expect(names).not.toContain('published_sites')
    const { results: indexes } = await env.DB.prepare(
      "SELECT sql FROM sqlite_master WHERE type = 'index' AND tbl_name = 'sites' AND sql IS NOT NULL",
    ).all<{ sql: string }>()
    const uniqueOnSlug = (indexes ?? []).filter(
      (i) => /UNIQUE/i.test(i.sql) && /\bslug\b/.test(i.sql),
    )
    expect(uniqueOnSlug.length).toBeGreaterThan(0)
    for (const index of uniqueOnSlug) expect(index.sql).toMatch(/tenant_id\s*,\s*slug/)

    // NO CLAIM IS CONSULTED. No platform source file — migration or code —
    // creates, reads or writes a claim table.
    const files = Object.entries(platformSource)
    expect(files.length).toBeGreaterThan(20)
    expect(files.some(([path]) => path.endsWith('.sql'))).toBe(true)
    expect(files.some(([path]) => path.includes('/apps/public-site/src/'))).toBe(true)
    for (const [path, text] of files) {
      expect(text, path).not.toMatch(
        /(FROM|INTO|JOIN|UPDATE|TABLE)\s+(IF\s+NOT\s+EXISTS\s+)?published_sites\b/i,
      )
    }
  })

  it('test_UAT_AC2246_every_new_accounts_starter_site_is_unnamed_and_publishes_without_colliding', async () => {
    // ── ARRANGE — two accounts, each provisioned through the shipped path.
    const identityEnv: IdentityEnv = {
      DB: env.DB as D1Database,
      SITES: env.SITES as R2Bucket,
      TENANT_ID: PLATFORM,
    }
    const alice = await inviteAccount(identityEnv, {
      email: 'story5349-alice@example.test',
      accountName: 'Alices Plumbing',
      endsAt: null,
    })
    const bob = await inviteAccount(identityEnv, {
      email: 'story5349-bob@example.test',
      accountName: 'Bobs Salon',
      endsAt: null,
    })
    expect(alice.businessId).not.toBe(bob.businessId)

    // ── ASSERT — each holds exactly one site, slug `unnamed`, named `Unnamed`.
    expect(STARTER_SLUG).toBe('unnamed')
    expect(STARTER_NAME).toBe('Unnamed')
    for (const account of [alice, bob]) {
      expect(account.siteSlug).toBe('unnamed')
      const store = await d1r2SiteStore({ DB: env.DB, SITES: env.SITES }).forTenant(
        account.businessId,
      )
      expect(await store.slugs()).toEqual(['unnamed'])
      const siteJson = (await store.readSiteJson('unnamed')) as {
        config?: { businessName?: string }
      } | null
      expect(siteJson?.config?.businessName).toBe('Unnamed')
      // Not the business's own name — the starter is visibly a default.
      expect(siteJson?.config?.businessName).not.toContain('Plumbing')
      expect(siteJson?.config?.businessName).not.toContain('Salon')
    }

    // ── ACT — both publish their starter, through the builder's own route.
    const first = await publish('unnamed', 'alice', { TENANT_ID: alice.businessId })
    const second = await publish('unnamed', 'bob', { TENANT_ID: bob.businessId })

    // ── ASSERT — both succeed, at two different key-addressed URLs, both served.
    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    const a = (await first.json()) as { id: number; published: boolean; url: string }
    const b = (await second.json()) as { id: number; published: boolean; url: string }
    expect(a).toMatchObject({ id: 1, published: true })
    expect(b).toMatchObject({ id: 1, published: true })
    expect(a.url).not.toBe(b.url)
    const aliceKey = await siteKeyOf('unnamed', alice.businessId)
    const bobKey = await siteKeyOf('unnamed', bob.businessId)
    expect(a.url).toBe(`${PUBLIC_ORIGIN}/site/${aliceKey}/`)
    expect(b.url).toBe(`${PUBLIC_ORIGIN}/site/${bobKey}/`)
    for (const key of [aliceKey, bobKey]) {
      const res = await serve(`/site/${key}/`)
      expect(res.status, key).toBe(200)
      // Each serves its own published starter page, byte for byte.
      const own = await env.SITES.get(`${publishedPrefix(key, 1)}/out/index.html`)
      expect(own, key).not.toBeNull()
      const html = await res.text()
      expect(html).toBe(await own!.text())
      expect(html).toContain(STARTER_HEADING)
    }

    // NOT RESERVED: renaming the starter is an ordinary slug change in its own
    // business, and the other account's starter is untouched by it.
    await env.DB.prepare('UPDATE sites SET slug = ? WHERE id = ?').bind('plumbing', aliceKey).run()
    expect(await siteKeyOf('plumbing', alice.businessId)).toBe(aliceKey)
    expect(await siteKeyOf('unnamed', bob.businessId)).toBe(bobKey)
  })
})
