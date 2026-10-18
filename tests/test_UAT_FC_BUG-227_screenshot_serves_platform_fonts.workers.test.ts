import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { platformFontKey } from '../packages/site-schema/src/index'
import { route, sessionFidelity, type RouterEnv } from '../apps/control-app/src/router'
import { storeFor } from '../apps/control-app/src/store'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import type { Scope } from '../apps/control-app/src/scope'
import { fidelityOperations } from '../tools/generate/src/cli/ai/fidelity-core'
import { encodePng } from '../tools/generate/src/cli/png'
import { applySchema, ensureTenant } from './support/d1-site-factory'
import { siteSeed } from './support/site-seed'
import { fakeBrowser } from './support/fake-puppeteer'

/**
 * [[BUG-227]] — a picture of our own page is taken in the faces the page names.
 *
 * WHAT WAS TRUE BEFORE. The assistant's `screenshot` drives a browser whose
 * requests to our own host are answered in-process (REQ-154), and that origin
 * asked the renderer for everything — including `_fonts/…`, which the renderer
 * has never held. So every platform face 404'd and every picture was in a
 * fallback, while the `/preview` route beside it served the same path fine.
 *
 * WHAT MAKES THIS EVIDENCE. The production assembly — `sessionFidelity`, which is
 * what `router.ts` hands a consultant session — over a real D1 store, a real R2
 * bucket holding the font at the key `1c fonts publish` writes, and the real
 * `screenshot` operation. The browser on the far side of the seam is the one
 * fake, and it asks for the face exactly as a page's `@font-face` would.
 */

const ORIGIN = 'https://app.test'
const FONT = 'bebasneue/BebasNeue-Regular.woff2'
const APPLIED = applySchema()

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  }
}

async function realPng(): Promise<Uint8Array> {
  const data = new Uint8Array(8 * 8 * 3).fill(0x40)
  return encodePng({ data, width: 8, height: 8, channels: 3 })
}

/** A business with one site imported through the real route. */
async function business(id: string): Promise<{ scope: Scope; slug: string }> {
  await APPLIED
  await ensureTenant(id)
  const seed = siteSeed({ slug: `site-${id}` })
  const scope = { businessId: id }
  const imported = await route(
    new Request(`${ORIGIN}/api/import`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        slug: seed.slug,
        siteJson: seed.siteJson as Record<string, unknown>,
        pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page: page as Record<string, unknown> })),
        assets: [] as { name: string; base64: string }[],
      }),
    }),
    routerEnv(),
    scope,
    {},
  )
  expect(imported.status).toBe(200)
  return { scope, slug: ((await imported.json()) as { site: string }).site }
}

beforeAll(async () => {
  await APPLIED
})

describe('BUG-227 — screenshots load platform fonts', () => {
  it('test_UAT_FC_BUG-227_a_screenshot_of_the_draft_is_served_the_platform_font_it_asks_for', async () => {
    const id = 'bug227-screenshot-fonts'
    const { scope, slug } = await business(id)
    const face = new Uint8Array([0x77, 0x4f, 0x46, 0x32, 1, 2, 3, 4])
    await (env.SITES as R2Bucket).put(platformFontKey(FONT), face)

    // The page's `@font-face` src is `_fonts/…` against the page's own
    // directory, so this is the URL its browser asks for.
    const fontUrl = `${ORIGIN}/preview/${slug}/draft/_fonts/${FONT}`
    const missingUrl = `${ORIGIN}/preview/${slug}/draft/_fonts/nosuchfamily/Nope-Regular.woff2`
    const browser = fakeBrowser({ png: await realPng(), extraRequests: [fontUrl, missingUrl] })

    const factory = await sessionFidelity(
      routerEnv(),
      scope,
      { launch: browser.launch },
      await storeFor(routerEnv(), scope),
      await ticketStoreFor({ DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket }, scope),
      ORIGIN,
    )
    expect(factory).not.toBeNull()
    const picture = await fidelityOperations(factory!(slug)).screenshot({ of: { kind: 'draft' } })
    expect(Array.isArray(picture)).toBe(true)

    // Answered in-process, from the mirror, as a font — never sent to the network
    // where an unauthenticated browser would meet an Access challenge.
    const served = browser.log.fulfilled.find((f) => f.url === fontUrl)
    expect(served?.status).toBe(200)
    expect(served?.contentType).toBe('font/woff2')
    expect(browser.log.continued).not.toContain(fontUrl)

    // A face the mirror does not hold is still ours to refuse, not the network's.
    const missing = browser.log.fulfilled.find((f) => f.url === missingUrl)
    expect(missing?.status).toBe(404)
  })
})
