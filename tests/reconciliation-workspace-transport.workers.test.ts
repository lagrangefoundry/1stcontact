/**
 * story-e674c60a AC-1401 — **the deployed leg of the two-door comparison.**
 *
 * The criterion asks that a representative set of routes be driven through the
 * local front door AND through the deployed runtime, and that the same request
 * produce the same status, content type and shape of answer from both. This file
 * is the second half of that; `reconciliation-workspace-transport.test.ts` is the
 * first, and it also owns the criterion's other claim — that the local door
 * stands up no route table of its own, and which store it targets by default.
 *
 * WHY THE HALVES ARE IN TWO FILES. `vitest.config.mts` routes `*.workers.test.ts`
 * into workerd and everything else into node, and neither pool can host both
 * doors: a workerd test has no `node:http` to stand up `startBuilder`, and the
 * node pool has no D1 or R2 binding to give the deployed Worker a store. So the
 * two doors are compared through one shared statement rather than one shared
 * process — `TRANSPORT_CONTRACT` declares status, content type and body shape
 * per route, and each leg asserts its own door against that same declaration.
 * The declaration is the only place the expectation exists, so a leg cannot
 * quietly agree with itself.
 *
 * NOTHING HERE IS A DOUBLE. `env.DB` and `env.SITES` are a real D1 database and
 * a real R2 bucket supplied by `@cloudflare/vitest-pool-workers` inside workerd
 * — the runtime the deployed Worker will actually use — and the entry point is
 * the Worker's own `fetch`, not the router beneath it. The assets binding IS a
 * marker, deliberately: no contract route reads an artifact's bytes (AC-1400
 * owns those), and a marker keeps an accidental fall-through visible instead of
 * silent.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'
import {
  answerOf,
  declaredAnswer,
  TRANSPORT_CONTRACT,
} from './support/transport-contract'

const TENANT = 'story-e674c60a-transport'
const ORIGIN = 'https://app.example'

/** The bindings the Worker declares, as `wrangler.toml` declares them. */
function workerEnv(): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    TENANT_ID: TENANT,
    // The loopback dev server: Access is unconfigured here, so the gate would
    // refuse every request. Admission is not this criterion's subject — AC-964
    // owns the admitted/unadmitted split — and a gate refusing everything would
    // make the comparison below a comparison of two 401s.
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
  }
}

const call = (path: string, init?: RequestInit): Promise<Response> =>
  worker.fetch(new Request(`${ORIGIN}/${path.replace(/^\//, '')}`, init), workerEnv())

describe('story-e674c60a — the deployed runtime answers the one route table', () => {
  beforeAll(async () => {
    await applySchema()
  })

  it('test_UAT_AC1401_the_deployed_runtime_answers_the_contract_the_local_door_answers', async () => {
    // A site to read, write and render — built from the scaffolder's own starter
    // rather than a fixture written here, so a definition that drifted out of
    // schema fails as a build problem instead of as this test's own mistake.
    const seed = siteSeed({ slug: nextSlug('transport') })
    const imported = await call('/api/import', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        slug: seed.slug,
        siteJson: seed.siteJson,
        pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page })),
        assets: [],
      }),
    })
    expect(imported.status, 'the fixture site was not accepted by the deployed runtime').toBe(200)

    // THE SAME DECLARATION THE LOCAL DOOR IS HELD TO. Same routes, same order,
    // same expected status / content type / body shape — over a completely
    // different store.
    const swept = new Set<string>()
    for (const route of TRANSPORT_CONTRACT) {
      const res = await call(route.path(seed.slug), route.init?.(seed.slug))
      expect(
        await answerOf(res, route, seed.slug),
        `the deployed runtime on ${route.name}`,
      ).toEqual(declaredAnswer(route))
      swept.add(route.klass)
    }
    // Guards the comparison against a contract quietly reduced to one class:
    // both legs read this same list, so a shrunken sweep would otherwise pass
    // twice rather than fail once.
    expect([...swept].sort()).toEqual(['document', 'read', 'render', 'write'])

    // The store really is this runtime's own, not something the contract could
    // have been satisfied without: the write above is visible to a fresh request
    // that resolves the definition out of D1 again, and the render is produced
    // from that same definition rather than from an artifact — there is no
    // filesystem here for one to have been read from.
    const listing = (await (await call('/api/sites')).json()) as { slug: string }[]
    expect(listing.map((s) => s.slug)).toContain(seed.slug)
    const rendered = await (await call(`/preview/${seed.slug}/draft/`)).text()
    expect(rendered.length).toBeGreaterThan(0)
  })
})
