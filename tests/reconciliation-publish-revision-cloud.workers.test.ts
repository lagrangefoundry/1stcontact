import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import controlApp from '../apps/control-app/src/index'
import type { Env as ControlEnv } from '../apps/control-app/src/index'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import { checkoutRevision, publishSite } from '../tools/generate/src/publish/publish'
import { publishedPrefix } from '../tools/generate/src/store/revision-model'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'

/**
 * Reconciliation UATs for story-5349d01f — **publishing a site to shared
 * storage**, the two acceptance criteria that can only be proved where the code
 * actually runs: inside workerd, against a real D1 database and a real R2
 * bucket.
 *
 *   AC-1418 — a publish mints a revision, renders it and stores it with NO
 *             FILESYSTEM anywhere on the path, and the builder's front door and
 *             the command line's front door produce the same store state from
 *             the same draft.
 *   AC-1422 — a published address belongs to whoever claimed it first, and the
 *             refusal costs the claiming account nothing.
 *
 * WHY workerd AND NOT NODE. Both criteria are claims about a runtime, not about
 * a function. "No filesystem on the path" passes trivially in Node whether it is
 * true or not — the filesystem is *there*, so a stray `node:fs` import proves
 * nothing by its absence from an assertion. Here there is no filesystem to fall
 * back on: if publish reached for one the test would not fail an expectation, it
 * would fail to run. And the claim is enforced by a PRIMARY KEY on a table, so
 * only a real SQLite can refuse the second claim; a hand-written double would be
 * asserting the double.
 *
 * NOTHING BELOW IS A DOUBLE except `ASSETS`, which is the static-asset binding
 * for build artifacts and has nothing to do with a publish.
 */

const TENANT = 'story5349-publish'
const OTHER_TENANT = 'story5349-other'

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

/**
 * A site made only of L1, from the real scaffolder rather than a fixture written
 * here — a hand-rolled definition restates the schema, and one that drifts from
 * the validator fails as "this draft does not validate", which is a test
 * asserting its own mistake.
 */
function pureL1Site(slug = nextSlug('story5349')) {
  const seed = siteSeed({ slug })
  return {
    slug: seed.slug,
    siteJson: seed.siteJson as Record<string, unknown>,
    pages: Object.entries(seed.pages).map(([name, page]) => ({
      name,
      page: page as Record<string, unknown>,
    })),
    assets: [] as { name: string; base64: string }[],
  }
}

async function importSite(payload: ReturnType<typeof pureL1Site>): Promise<void> {
  const res = await call('/api/import', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
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

/**
 * Everything R2 holds under one revision, keyed by its path WITHIN the revision.
 *
 * Relative rather than absolute so two revisions can be compared at all: the
 * revision number is part of every absolute key, and "the same store state" is a
 * claim about the contents, not about the number they are filed under.
 */
async function revisionTree(slug: string, id: number): Promise<Map<string, string>> {
  const prefix = `${publishedPrefix(slug, id)}/`
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
      changes: { added: string[]; modified: string[]; removed: string[] }
    }
    expect(body.id).toBe(1)
    expect(body.published).toBe(true)

    // The change list names the STORE's own keys — the site record and the page
    // record — not a filesystem's paths, and every path is `added` on a first
    // publish because there is no previous revision for anything to differ from.
    expect(body.changes.added).toContain('site.json')
    expect(body.changes.added).toContain('pages/home.json')
    expect(body.changes.modified).toEqual([])
    expect(body.changes.removed).toEqual([])

    // The bytes really are in the bucket, under the revision's own location:
    // the rendered entry document, and the frozen definition beside it.
    const r1 = await revisionTree(site.slug, 1)
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
    const r3 = await revisionTree(site.slug, 3)
    expect([...r3.keys()].sort()).toEqual([...r1.keys()].sort())
    for (const [rel, text] of r1) expect(r3.get(rel), rel).toBe(text)

    // And the audit digest agrees, which is the question a change list cannot
    // answer: are these the same bytes?
    const log = await store.revisions(site.slug)
    expect(log.find((r) => r.id === 3)!.sha).toBe(log.find((r) => r.id === 1)!.sha)

    // ── ASSERT — there is exactly ONE publish implementation. The local
    // transport used to intercept `/api/publish` on the way past and answer it
    // from a filesystem revision store; that was the one route where the two
    // front doors disagreed about what a route does, and it is deleted rather
    // than kept as a local fast path.
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

  it('test_UAT_AC1422_a_second_account_cannot_publish_over_a_claimed_slug', async () => {
    // ── ARRANGE — one account publishes a site, and we record the exact bytes
    // its published revision serves.
    const site = pureL1Site()
    await importSite(site)
    expect((await publish(site.slug, 'first')).status).toBe(200)
    const before = await revisionTree(site.slug, 1)
    expect(before.get('out/index.html')).toBeTruthy()

    // A SECOND account, with a draft site of the same slug — which is legal, and
    // is the whole reason the claim has to exist: the draft side carries the
    // account in every key, so two accounts may each own a site called this.
    const root = d1r2SiteStore({ DB: env.DB, SITES: env.SITES })
    await root.createTenant({ id: OTHER_TENANT, name: OTHER_TENANT })
    const intruder = await root.forTenant(OTHER_TENANT)
    await intruder.createDraft(site.slug)
    const seed = siteSeed({ slug: site.slug })
    await intruder.write(site.slug, {
      siteJson: seed.siteJson as Record<string, unknown>,
      pages: Object.entries(seed.pages).map(([name, page]) => ({
        name,
        page: page as Record<string, unknown>,
      })),
    })

    // ── ACT — the second account publishes over the claimed address, through
    // the builder's own publish route under its own account.
    const refused = await publish(site.slug, 'mine now', { TENANT_ID: OTHER_TENANT })

    // ── ASSERT — refused, and the refusal NAMES the address as taken by another
    // account and says what to do about it. A generic "publish failed" would
    // leave the author with no move.
    expect(refused.status).toBe(409)
    const error = (await refused.json()) as { error: string }
    expect(error.error).toContain(site.slug)
    expect(error.error).toContain('already in use by another account')
    expect(error.error).toContain('Rename the site and publish again')

    // The refusal cost the CLAIMING account nothing: the live site serves the
    // same bytes it served before — byte for byte, key for key, not merely
    // "still there" — because the claim is taken before a single byte is written.
    const after = await revisionTree(site.slug, 1)
    expect([...after.keys()].sort()).toEqual([...before.keys()].sort())
    for (const [rel, text] of before) expect(after.get(rel), rel).toBe(text)

    // And the refused account's own revision log holds nothing — the publish did
    // not half-happen and leave a revision behind that serves someone else's site.
    expect(await intruder.revisions(site.slug)).toHaveLength(0)
  })
})
