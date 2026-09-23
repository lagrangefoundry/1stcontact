import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { platformFontKey } from '../packages/site-schema/src/fonts'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'

/**
 * [[REQ-312]] — the **preview's** snapshot root answers for `_fonts/…`
 * (`COMMENT-3711`).
 *
 * WHAT THE SAME-ORIGIN DECISION COSTS, AND THIS IS THE WHOLE OF IT. A page's font
 * `src` names no host: it is root-relative, and the renderer reduces it to a
 * reference against the page's own directory so a snapshot is relocatable
 * (`relativizeUrl`, REQ-109). That is what makes a published site self-contained
 * — and it means the rendered bytes ask for the face at whatever root they are
 * being served at. `public-site` has two such roots; this Worker has two more,
 * `/preview/<key>/<channel>/` and `/portal/`.
 *
 * THE FALSIFIER THIS FILE EXISTS FOR. Before, the `src` was an absolute URL on the
 * platform's own host, so a preview loaded the face from production and nobody had
 * to think about this. With the host gone, a preview that does not answer for
 * `_fonts/…` shows the operator a FALLBACK FACE while the builder tells them they
 * chose Heading Font — the single thing a preview must not do, and one that is
 * invisible to every other check in the system: the manifest is right, the page
 * validates, and `1c fonts check` passes.
 *
 * WHAT MAKES THIS EVIDENCE. It drives `worker.fetch` — the real `control-app`
 * handler with its real route table — inside workerd, against the real R2 bucket
 * at the real key prefix `1c fonts publish` writes under (`platformFontKey`, the
 * publisher's own key function). The site is imported through the real
 * `/api/import` route, so the preview root under test is the one an operator's
 * builder iframe actually points at.
 */

const SLUG = 'headingfont'
const FILE = 'HeadingFont-Regular.woff2'
const FONT_BYTES = new Uint8Array([0x77, 0x4f, 0x46, 0x32, 9, 8, 7, 6])
const LICENCE_TEXT = 'Copyright 2026 The Heading Font Project Authors\n\nSIL OPEN FONT LICENSE Version 1.1\n'

let businessSeq = 0
const nextBusiness = (): string => `req312-${(businessSeq += 1)}`

function workerEnv(tenant: string): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    TENANT_ID: tenant,
    // The loopback dev server: Access is unconfigured, so the gate would refuse
    // every request. See `index.ts` on why this cannot open a deployed Worker.
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ASSETS: {
      fetch: async (request: Request | string) =>
        new Response(`asset:${new URL(typeof request === 'string' ? request : request.url).pathname}`, {
          status: 404,
        }),
    } as unknown as Fetcher,
  } as unknown as Env
}

const call = (tenant: string, path: string, init?: RequestInit): Promise<Response> =>
  worker.fetch(new Request(`https://app.example/${path.replace(/^\//, '')}`, init), workerEnv(tenant))

/** Push the scaffolder's own starter site in and hand back the key it landed on. */
async function importAndKey(tenant: string): Promise<string> {
  const seed = siteSeed({ slug: nextSlug() })
  const response = await call(tenant, '/api/import', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      slug: seed.slug,
      siteJson: seed.siteJson,
      pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page })),
      assets: [],
    }),
  })
  expect(response.status).toBe(200)
  return ((await response.json()) as { site: string }).site
}

beforeAll(async () => {
  await applySchema()
  // Exactly what `1c fonts publish` writes — the face and the family's own licence
  // notice beside it, at the key the publisher composes.
  await env.SITES.put(platformFontKey(`${SLUG}/${FILE}`), FONT_BYTES)
  await env.SITES.put(platformFontKey(`${SLUG}/OFL.txt`), LICENCE_TEXT)
})

describe('REQ-312 — a preview serves platform fonts at its own root', () => {
  it('test_UAT_FC_REQ-312_the_preview_root_serves_the_face_the_page_asks_for', async () => {
    const tenant = nextBusiness()
    const site = await importAndKey(tenant)

    // THE PATH THE RENDERED PAGE ACTUALLY REQUESTS. `/_fonts/<slug>/<file>` in the
    // definition becomes `_fonts/<slug>/<file>` in the emitted CSS, resolved
    // against the document's directory — which for a preview is this root.
    for (const channel of ['draft', 'edit']) {
      const face = await call(tenant, `/preview/${site}/${channel}/_fonts/${SLUG}/${FILE}`)
      expect(face.status, `${channel} serves the face`).toBe(200)
      expect(new Uint8Array(await face.arrayBuffer())).toEqual(FONT_BYTES)
      expect(face.headers.get('content-type')).toBe('font/woff2')
    }

    // AND THE LICENCE TRAVELS WITH THE BYTES HERE TOO. OFL requires the notice to
    // accompany the distribution, and a preview is a distribution to the operator.
    const licence = await call(tenant, `/preview/${site}/draft/_fonts/${SLUG}/OFL.txt`)
    expect(licence.status).toBe(200)
    expect(await licence.text()).toContain('SIL OPEN FONT LICENSE')
  })

  it('test_UAT_FC_REQ-312_a_font_the_mirror_does_not_hold_is_a_404_and_not_a_render', async () => {
    const tenant = nextBusiness()
    const site = await importAndKey(tenant)

    // A 404 here means the mirror does not hold it — the same absence
    // `1c fonts check` reports as NOT POPULATED, seen from the preview. What it
    // must never be is a path that fell through to the renderer and resolved to a
    // page: `_fonts` is a reserved first segment of a snapshot precisely so that
    // nothing of the site's can be reached under it.
    const missing = await call(tenant, `/preview/${site}/draft/_fonts/absentface/Absent-Regular.woff2`)
    expect(missing.status).toBe(404)
    expect(missing.headers.get('content-type') ?? '').not.toContain('text/html')

    // Traversal is refused rather than reasoned about, because the R2 key is built
    // by concatenation.
    const traversal = await call(tenant, `/preview/${site}/draft/_fonts/../../../index.html`)
    expect(traversal.status).not.toBe(200)

    // AND THE SITE'S OWN BYTES ARE UNAFFECTED — the interception is scoped to the
    // reserved segment, not a hole in front of the renderer.
    const page = await call(tenant, `/preview/${site}/draft/`)
    expect(page.status).toBe(200)
    expect(page.headers.get('content-type')).toContain('text/html')
  })
})
