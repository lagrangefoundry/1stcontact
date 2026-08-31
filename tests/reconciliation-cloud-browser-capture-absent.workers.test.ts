import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import {
  BrowserNotConfiguredError,
  shotUrl,
  type ShotEnv,
} from '../apps/control-app/src/shot'
import { BrowserSessionTimeoutError } from '../tools/generate/src/cli/capture/cf-driver'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'

/**
 * AC-1461 — a deployment with no browser capability configured (story-080c6036).
 *
 * WHY THIS IS ITS OWN FILE. Absence of a browser capability has to be shown to
 * be an ORDINARY deployment state, which means driving the Worker's own `fetch`
 * — a draft edit, a preview render and a publish, all against real D1 and R2 —
 * and only then asking for a picture. Its siblings in
 * `reconciliation-cloud-browser-capture.workers.test.ts` reach the screenshot
 * capability directly and never touch the Worker's entry point, so keeping the
 * entry-point import out of that file keeps those ACs independent of the
 * builder's whole module graph.
 */

/** The bindings the Worker declares — deliberately WITHOUT `BROWSER`, which is
 *  the whole subject of this criterion. */
function workerEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    TENANT_ID: 'ac1461',
    // The loopback dev server: Access is unconfigured, so the gate would
    // otherwise refuse every request.
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

const call = (path: string, init?: RequestInit): Promise<Response> =>
  worker.fetch(new Request(`https://app.example/${path.replace(/^\//, '')}`, init), workerEnv())

/** A site made only of L1, from the scaffolder's own starter rather than a
 *  fixture written here (which would prove the fixture's schema). */
function pureL1Site(slug = nextSlug()) {
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

/** A deployment with no browser capability configured. */
const NO_BROWSER: ShotEnv = {}

beforeAll(async () => {
  await applySchema()
})

describe('AC-1461 — a deployment with no browser capability still edits, renders and publishes', () => {
  it('test_UAT_AC1461_no_browser_binding_leaves_edit_render_publish_working_and_names_the_gap', async () => {
    // The deployment STARTS: this env declares no BROWSER binding at all, and
    // the Worker answers requests rather than refusing to boot.
    const site = pureL1Site()
    const slug = site.slug

    const imported = await call('/api/import', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(site),
    })
    expect(imported.status).toBe(200)

    // EDITING is unaffected — and the READ-BACK is what proves it landed,
    // because the write response could be composed without storing anything.
    const wrote = await call('/api/palette', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug, op: 'add', name: 'accent', value: '#123456' }),
    })
    expect(wrote.status).toBe(200)
    const palette = (await (await call(`/api/palette?slug=${slug}`)).json()) as {
      entries: { name: string; value: string }[]
    }
    expect(palette.entries).toContainEqual(
      expect.objectContaining({ name: 'accent', value: '#123456' }),
    )

    // RENDERING is unaffected.
    const preview = await call(`/preview/${slug}/draft/`)
    expect(preview.status).toBe(200)
    expect(preview.headers.get('content-type')).toContain('text/html')
    expect((await preview.text()).length).toBeGreaterThan(0)

    // PUBLISHING is unaffected.
    const published = await call('/api/publish', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug, message: 'ac1461' }),
    })
    expect(published.status).toBe(200)
    expect((await published.json()) as { published: boolean }).toMatchObject({ published: true })

    // ONLY the screenshot fails, and it fails by name rather than by
    // dereferencing nothing — so a caller can report "this deployment cannot
    // take pictures" instead of "undefined is not an object".
    const shot = shotUrl(NO_BROWSER, 'https://example.com/')
    await expect(shot).rejects.toBeInstanceOf(BrowserNotConfiguredError)
    const err = await shot.then(
      () => null,
      (e: unknown) => e as Error,
    )
    // A named, catchable kind — distinguishable by a caller from a page error
    // and from a time-limit exit.
    expect(err?.name).toBe('BrowserNotConfiguredError')
    expect(err).not.toBeInstanceOf(BrowserSessionTimeoutError)
    // The message states that no browser capability is configured, and names
    // the configuration entry that is absent — which is what an operator has to
    // go and add.
    expect(err?.message).toContain('BROWSER')
    expect(err?.message).toMatch(/Browser Rendering/i)
  })
})
