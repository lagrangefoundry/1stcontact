import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { MAX_PRIMING_CHARS, resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'
import { says, scriptedClient, systemText } from './support/scripted-model-client'

/**
 * BUG-129 — **the deployment's own grant primes inside the ceiling**.
 *
 * WHAT WENT WRONG. `MAX_PRIMING_CHARS` was 60,000, chosen against a stated
 * input — *"the projected manual summary is about 11,000, so a session with a
 * corpus primes at roughly 16,000 today"* — and the surfaces this deployment
 * grants have since grown past it. Assembly reached 65,925 at `km-mechanism`
 * and EVERY builder session refused to open. Not a degradation: a total outage
 * of the consultant, on every site, with no partial mode.
 *
 * WHY THIS TEST IS IN THE WORKERS SUITE AND NOT BESIDE THE OTHER ONE. The cap
 * already had an assertion —
 * `test_UAT_FC_REQ-182_the_assembled_priming_fits_the_declared_cap_with_headroom`
 * — and it stayed green through the outage, because it opens a session through
 * the CLI host, whose grant is the L1 surface plus knowledge. `router.ts` grants
 * more: fidelity, images, the library, the ledger, settings and dns. The manual
 * is projected FROM THE GRANT, so the CLI figure is a fraction of the deployed
 * one and the constant could go under water in production with the whole suite
 * green. **The grant is the thing under test here, not the arithmetic.**
 *
 * So this fails when a surface is added to the deployment and the ceiling is not
 * revisited — which is precisely the event that produced the outage — and it
 * fails by the route the operator saw it: the session does not open.
 *
 * AND THE HEADROOM FACTOR IS WHAT CARRIES IT, stated plainly rather than left to
 * be discovered. This runtime primes at about 42,000 characters; production
 * reached 65,925, because the knowledge landscape here is a seeded tenant's and
 * not a working client's. A test asserting only `< MAX_PRIMING_CHARS` would
 * therefore have gone green against the very constant that shut the builder
 * down. Doubling is the margin that makes the assertion bite at this runtime's
 * scale — and it is the same margin the CLI-side test uses, for the same reason:
 * the landscape grows without anyone editing this repository.
 */

const TENANT = 'bug129'

function workerEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: TENANT,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    // THE BINDINGS ARE HERE TO BE GRANTED, NOT TO BE USED. A surface is
    // composed only where its binding exists — no `BROWSER` is a deployment
    // with no eyes, no `OPENAI_API_KEY` is one that cannot draw — and a manual
    // is projected from what was GRANTED. A test that left them out would
    // measure a smaller deployment than the one that broke. Nothing in this
    // case calls either, so neither has to work.
    BROWSER: { fetch: async () => new Response('', { status: 200 }) } as unknown as Fetcher,
    OPENAI_API_KEY: 'test-key-not-a-real-one',
    ASSETS: {
      fetch: async () => new Response('asset', { status: 200 }),
    } as unknown as Fetcher,
    ...overrides,
  }
}

const post = (path: string, body: unknown): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    workerEnv(),
  )

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('BUG-129 — a session granted what the deployment grants still opens', () => {
  it('test_UAT_FC_BUG-129_a_deployment_grant_primes_inside_the_ceiling', async () => {
    const { site } = await seedTenantSite(TENANT, { slug: nextSlug('prime') })
    const client = scriptedClient([says('What would you like to change?')])
    setModelClient(client)

    // 1. IT OPENS. The failure under repair is a refusal to open — the priming
    //    budget is enforced during assembly, so an overflow is not a smaller
    //    priming, it is no session — and this is the operator's own symptom.
    const opened = await post('/api/ai/session', { site })
    expect(opened.status).toBe(200)
    const session = (await opened.json()) as { sessionId: string; ready: boolean }
    expect(session.ready).toBe(true)

    // One turn, because the priming is assembled for a REQUEST: a session that
    // opened has resolved its role, and what reaches the model is what this is
    // about.
    const turn = await post('/api/ai/prompt', { sessionId: session.sessionId, text: 'Hello' })
    expect(turn.status).toBe(200)
    await turn.text()

    // The priming as the backend actually built it, not as the host holds it.
    const priming = systemText(client.seen[0])

    // 2. THE GRANT IS REALLY IN IT. Without this the ceiling assertions below
    //    pass on an empty manual, which is the exact way the CLI-side test
    //    stayed green while production could not start. Four surfaces, from
    //    four different plugins, all of them reached only through the Worker's
    //    wiring.
    for (const op of ['add_page', 'capture_site', 'write_image', 'list_assets']) {
      expect(priming, `the manual does not project ${op}`).toContain(op)
    }

    // 3. IT FITS, WITH HEADROOM. The landscape tracks the client's knowledge
    //    base and grows without anyone editing this repository, so a cap with no
    //    room is a cap that fires on a working configuration.
    expect(priming.length).toBeLessThan(MAX_PRIMING_CHARS)
    expect(priming.length * 2).toBeLessThan(MAX_PRIMING_CHARS)
  })
})
