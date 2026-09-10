/**
 * story-e674c60a AC-964 — **the admitted/unadmitted split, across every class of
 * thing the workspace host serves.**
 *
 * The criterion has two halves. For an ADMITTED caller the workspace document,
 * its components, its browser source, the rendered channels and the workspace's
 * operations are all reachable from one host. The qualification is load-bearing
 * rather than decorative: the same host, asked by a caller the access gate has
 * NOT admitted, serves none of it — a refusal arrives instead, carrying none of
 * the bytes the route would have produced, for an operation, for a rendered
 * channel and for a build artifact alike.
 *
 * WHY THE SWEEP LIVES HERE. Three of the four classes are store-backed — the
 * listing reads it, the rendered channel is produced from it — and only workerd
 * has a real D1 and R2 to read. The node pool can mint real Access tokens but
 * cannot give the Worker a store; this pool has the store but cannot run a
 * loopback Access team (`node:http` is unavailable inside workerd, and the
 * gate's JWKS fetch has nowhere to go). So the sweep across ALL FOUR classes is
 * made here, over real data, and the sibling leg in
 * `reconciliation-builder-workspace-origin.test.ts` re-makes the same split for
 * the two store-free classes against a real Access team minting real RS256
 * tokens. Neither is a duplicate of the other: one has the breadth, the other
 * has the token fidelity, and the criterion needs both.
 *
 * WHAT "UNADMITTED" IS HERE. Not a flag this test invents — the Worker's own
 * gate, configured and fed no token, which fails closed (`access.ts`). The
 * admitted caller is the loopback dev server's own bypass, the same one
 * `reconciliation-workspace-edge-origin.workers.test.ts` uses. Both run the same
 * Worker `fetch`, the same route table and the same store; the only difference
 * between them is whether the caller was admitted, which is the criterion's
 * entire subject.
 *
 * ORDERING IS NOT ASSERTED HERE. That the artifacts sit behind the gate because
 * the fall-through stays last is AC-1400's claim in full. This file asserts only
 * the observable split.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'

const TENANT = 'story-e674c60a-admission'
const ORIGIN = 'https://app.example'

/** An artifact body that says which layer answered, so a leak is legible. */
const ASSET_MARKER = (pathname: string) => `asset:${pathname}`

function assetsBinding(): Fetcher {
  return {
    fetch: async (request: Request | string) =>
      new Response(
        ASSET_MARKER(new URL(typeof request === 'string' ? request : request.url).pathname),
        { status: 200, headers: { 'content-type': 'text/plain; charset=utf-8' } },
      ),
  } as unknown as Fetcher
}

/**
 * The bindings the Worker declares, in one of its two admission states.
 *
 * `admitted: true` is the loopback dev server, where Access is unconfigured and
 * the Worker says so explicitly. `admitted: false` is a CONFIGURED gate with no
 * token presented — the deployed shape, refusing exactly as it fails closed.
 */
function workerEnv(admitted: boolean): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    TENANT_ID: TENANT,
    ACCESS_DEV_OPEN: admitted ? '1' : '',
    ACCESS_TEAM_DOMAIN: admitted ? '' : 'story-e674c60a.cloudflareaccess.com',
    ACCESS_AUD: admitted ? '' : 'story-e674c60a-aud-tag',
    ASSETS: assetsBinding(),
  }
}

const call = (path: string, admitted: boolean, init?: RequestInit): Promise<Response> =>
  worker.fetch(new Request(`${ORIGIN}/${path.replace(/^\//, '')}`, init), workerEnv(admitted))

describe('story-e674c60a — one host, and only for a caller it admitted', () => {
  let slug: string

  beforeAll(async () => {
    await applySchema()
    const seed = siteSeed({ slug: nextSlug('admission') })
    const imported = await call('/api/import', true, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        slug: seed.slug,
        siteJson: seed.siteJson,
        pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page })),
        assets: [],
      }),
    })
    expect(imported.status, 'the fixture site was not accepted').toBe(200)
    slug = seed.slug
  })

  it('test_UAT_AC964_every_class_this_host_serves_is_refused_to_an_unadmitted_caller', async () => {
    // ONE ROUTE OF EACH CLASS the criterion names. The build artifact is listed
    // explicitly because the AC singles it out: it is the member of the sweep
    // whose refusal would otherwise go unprobed, and an artifact that came back
    // to an unadmitted caller would be an artifact served to anyone.
    const classes = [
      { klass: 'the workspace document', path: '/', contentType: 'text/html' },
      { klass: 'a build artifact', path: '/builder/main.js', contentType: 'text/plain' },
      { klass: 'an operation', path: '/api/sites', contentType: 'application/json' },
      { klass: 'a rendered channel', path: `/preview/${slug}/draft/`, contentType: 'text/html' },
    ]

    for (const { klass, path, contentType } of classes) {
      // ── admitted: the route produces what it is defined to produce ────────
      const admitted = await call(path, true)
      expect(admitted.status, `${klass} admitted`).toBe(200)
      expect(admitted.headers.get('content-type'), `${klass} admitted`).toContain(contentType)
      const admittedBody = await admitted.text()
      expect(admittedBody.length, `${klass} admitted body is empty`).toBeGreaterThan(0)

      // ── unadmitted: refused, and carrying none of those bytes ─────────────
      const refused = await call(path, false)
      expect(refused.ok, `${klass} was served to an unadmitted caller`).toBe(false)
      // PINNED TO THE GATE'S OWN REFUSAL, not merely "an error". A 503 from an
      // unconfigured gate, or from a store that could not be opened, is also a
      // non-success — and either would let this sweep look green while proving
      // nothing about admission.
      expect(refused.status, `${klass} was not refused BY THE GATE`).toBe(401)

      const refusedBody = await refused.text()
      // THE BODY COMPARISON IS THE POINT, not the status. A refusal that still
      // carried the route's bytes would be a refusal in name only, and a status
      // check alone cannot tell the two apart.
      const fingerprint = admittedBody.slice(0, 64)
      expect(fingerprint.length, `${klass}: nothing to fingerprint`).toBeGreaterThan(0)
      expect(refusedBody, `${klass}: the refusal carried the route's own bytes`).not.toContain(
        fingerprint,
      )
      expect(refusedBody, `${klass}: the refusal carried an artifact`).not.toContain('asset:')
    }

    // The seeded site's own slug never leaks either — the listing and the
    // rendered channel both name it, so a refusal mentioning it would be a
    // refusal that had already read the store.
    for (const path of ['/api/sites', `/preview/${slug}/draft/`]) {
      expect(await (await call(path, false)).text(), path).not.toContain(slug)
    }

    // NON-VACUITY. The admitted answers must genuinely differ from each other,
    // or "carries none of those bytes" could hold because every route returns
    // the same uninformative body.
    const bodies = await Promise.all(
      classes.map(async (c) => (await call(c.path, true)).text()),
    )
    expect(new Set(bodies).size, 'the four classes do not answer distinguishably').toBe(
      classes.length,
    )
  })

  it('test_UAT_AC964_the_refusal_names_the_gate_rather_than_failing_blank', async () => {
    // A refusal an operator cannot act on is a blank page with a status code.
    // The gate fails closed, and it says which gate refused — this is what makes
    // "not admitted" distinguishable from "this route does not exist".
    const refused = await call('/api/sites', false)
    const body = await refused.text()
    expect(body.trim().length).toBeGreaterThan(0)
    expect(body).toMatch(/Cloudflare Access/i)

    // AND IT IS THE RIGHT REFUSAL. `access.ts` has two fail-closed paths: an
    // UNCONFIGURED gate answers 503 naming the empty variable, and a configured
    // gate presented with no usable token answers 401. Only the second is "a
    // caller this host did not admit" — the first is a deployment that cannot
    // check anyone, and a sweep that landed on it would prove nothing about
    // admission while looking exactly as green. Both vars are set above
    // precisely so this is the path taken, and this pins it.
    expect(refused.status, 'the sweep is exercising the unconfigured-gate path').toBe(401)
    expect(body, 'the gate refused because it is unconfigured, not because the caller was not admitted')
      .not.toMatch(/is not configured|are empty|is empty/i)

    // …and a route that genuinely does not exist is answered differently, so the
    // two failures are not one indistinguishable wall.
    const missing = await call('/no-such-route', true)
    expect(missing.status).not.toBe(refused.status)
  })
})
