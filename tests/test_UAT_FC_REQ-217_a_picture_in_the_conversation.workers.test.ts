import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  resetChatHost,
  route,
  type RouterDeps,
  type RouterEnv,
} from '../apps/control-app/src/router'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { splitBusinessPrefix, type Scope } from '../apps/control-app/src/scope'
import { IMAGE_SECRET, imageSurface } from '../apps/control-app/src/imagegen'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { applySchema, ensureTenant } from './support/d1-site-factory'
import { siteSeed } from './support/site-seed'
import { calls, says, scriptedClient } from './support/scripted-model-client'
import type { ModelStep, ScriptedClient } from './support/scripted-model-client'

/**
 * [[REQ-217]] — **an image a turn produced appears in the conversation**, proved
 * end to end.
 *
 * WHAT MAKES THIS EVIDENCE, AND WHY IT IS HERE RATHER THAN BESIDE THE UNIT FILE.
 * The claim is not *"a tool returns a string"* — it is *"the client sees the
 * picture"*, and the only honest form of that is: take a real turn through the
 * Worker's own route table, over a real D1 database and real R2 buckets, read
 * the line the model was actually handed, and then FETCH IT. If those bytes come
 * back, the picture is in the conversation; if they do not, no amount of string
 * assertion would have said so.
 *
 * THE ADDRESS IS READ BACK BY THE PRODUCTION READER. The line is scoped
 * (`/b/<businessId>/…`) because an unscoped one resolves against the first
 * admissible business, so the round trip goes through `splitBusinessPrefix` —
 * the same function `index.ts` uses — rather than through a regular expression
 * written here. A suite that stripped the prefix its own way could pass against
 * a prefix the origin cannot read.
 *
 * ONE DOUBLE, at a boundary that is genuinely external: the Anthropic client,
 * which is the network and the seam the library's backend exists to have
 * injected. Nothing between it and the behaviour under test is faked — no image
 * provider is needed, because both halves' addresses are asserted against what
 * this deployment actually serves.
 *
 * THE CLAIMS:
 *
 *   1. A DRAWING APPEARS IN THE TURN THAT DREW IT. `write_image` hands the model
 *      a markdown line, and the line fetches the drawing.
 *   2. A GENERATED PICTURE DOES TOO. `create_image`'s host display sentence
 *      carries a markdown line, and the line fetches the material's bytes.
 *   3. THE ADDRESS NAMES THIS BUSINESS AND NOT WHICHEVER ONE IS FIRST.
 *   4. NOWHERE TO SHOW IT MEANS NO LINE, which is the plugin's own account of
 *      what absence means.
 */

const APPLIED = applySchema()
const ORIGIN = 'https://app.test'

/** A drawing that passes the SVG envelope — shapes only, nothing executable. */
const MARK =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">' +
  '<rect x="1" y="1" width="8" height="8" fill="#1a3a6b"/></svg>'

function routerEnv(over: Partial<RouterEnv> = {}): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    [IMAGE_SECRET]: 'test-image-key-not-a-real-one',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...over,
  } as RouterEnv
}

/** A business with the schema applied, its tenant registered, and one site. */
async function business(id: string): Promise<{ scope: Scope; slug: string }> {
  await APPLIED
  await ensureTenant(id)
  const scope: Scope = { businessId: id }
  const seed = siteSeed({ slug: `site-${id}` })
  const imported = await route(
    new Request(`${ORIGIN}/api/import`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        slug: seed.slug,
        siteJson: seed.siteJson as Record<string, unknown>,
        pages: Object.entries(seed.pages).map(([name, page]) => ({
          name,
          page: page as Record<string, unknown>,
        })),
        assets: [] as { name: string; base64: string }[],
      }),
    }),
    routerEnv(),
    scope,
    {},
  )
  expect(imported.status).toBe(200)
  return { scope, slug: seed.slug }
}

/** Open a session and take one scripted turn, through the Worker's own routes. */
async function turn(
  scope: Scope,
  slug: string,
  script: ModelStep[],
  deps: RouterDeps = {},
): Promise<ScriptedClient> {
  const workerEnv = routerEnv()
  const opened = await route(
    new Request(`${ORIGIN}/api/ai/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug }),
    }),
    workerEnv,
    scope,
    deps,
  )
  expect(opened.status).toBe(200)
  const session = (await opened.json()) as { sessionId: string }

  const client = scriptedClient(script)
  setModelClient(client)
  const streamed = await route(
    new Request(`${ORIGIN}/api/ai/prompt`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId: session.sessionId, text: 'Draw us a mark.' }),
    }),
    workerEnv,
    scope,
    deps,
  )
  expect(streamed.status).toBe(200)
  await streamed.text()
  return client
}

/**
 * Every tool result the model was handed back, as text, in order.
 *
 * READ OFF THE LAST REQUEST ALONE: each round of the tool loop re-sends the
 * whole conversation, so summing across every recorded request counts each
 * result once per subsequent round.
 */
function toolResults(client: ScriptedClient): string[] {
  const out: string[] = []
  const last = client.seen[client.seen.length - 1]
  for (const message of last.messages) {
    const content = message.content
    if (!Array.isArray(content)) continue
    for (const block of content as Record<string, unknown>[]) {
      if (block.type === 'tool_result') out.push(JSON.stringify(block.content))
    }
  }
  return out
}

/** The one markdown image in a tool result, as `[alt, url]`. */
function pictureIn(results: string[]): [string, string] {
  const joined = results.join('\n')
  // The result travels as a JSON string inside a JSON string, so the brackets
  // survive but the escaping does not — parse the outer layer first.
  const text = joined.replace(/\\"/g, '"').replace(/\\n/g, '\n')
  const found = /!\[([^\]]*)\]\(([^)]+)\)/.exec(text)
  expect(found, `no markdown picture in: ${text.slice(0, 800)}`).toBeTruthy()
  return [found![1], found![2]]
}

/** Fetch a builder URL the way the origin would, splitting its scope off first. */
async function fetchScoped(url: string): Promise<{ businessId: string | null; res: Response }> {
  const parsed = new URL(url, ORIGIN)
  const { businessId, path } = splitBusinessPrefix(parsed.pathname)
  const res = await route(
    new Request(`${ORIGIN}${path}${parsed.search}`),
    routerEnv(),
    { businessId: businessId ?? '' },
    {},
  )
  return { businessId, res }
}

describe('REQ-217 — the picture is in the conversation that made it', () => {
  beforeAll(async () => {
    await APPLIED
  })

  it('test_UAT_FC_REQ-217_a_drawing_the_turn_made_is_fetchable_from_the_turn', async () => {
    resetAiHost()
    resetChatHost()
    const { scope, slug } = await business('req217-draw')

    const client = await turn(scope, slug, [
      calls('write_image', { name: 'wordmark', svg: MARK }),
      says('Here it is — tell me if it is close.'),
    ])

    const [alt, url] = pictureIn(toolResults(client))
    expect(alt).toBe('wordmark')

    // THE ADDRESS NAMES THIS BUSINESS. Unscoped is not a smaller version of
    // this — it resolves against the first admissible business, which is the
    // crossing `scope.ts` exists to prevent.
    const { businessId, res } = await fetchScoped(url)
    expect(businessId).toBe(scope.businessId)

    // AND IT IS THE DRAWING. Serving the bytes is the whole claim: a line that
    // parses and 404s is a broken picture in the client's conversation.
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('<rect')
  })

  it('test_UAT_FC_REQ-217_a_generated_picture_carries_a_line_that_fetches_its_bytes', async () => {
    await APPLIED
    await ensureTenant('req217-gen')
    const scope: Scope = { businessId: 'req217-gen' }
    const tickets = await ticketStoreFor(
      { DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket },
      scope,
    )

    // THE REAL PLUGIN, WIRED THE WAY `router.ts` WIRES IT, with this product's
    // own display sentence. Only the provider's HTTP endpoint is substituted —
    // a second vendor's REST API that miniflare has none of, and the seam the
    // imagegen component opens precisely so a plugin is demonstrable with no key
    // and no spend.
    const png = 'iVBORw0KGgoAAAANSUhEUgAAAAMAAAACCAYAAAAAAAAA'
    const provider = (async () => ({
      status: 200,
      ok: true,
      json: async () => ({ data: [{ b64_json: png }] }),
    })) as unknown as typeof fetch

    const built = imageSurface({ OPENAI_API_KEY: 'k' }, tickets, null, {
      fetch: provider,
      materialUrl: (uid: string) => `/b/${scope.businessId}/api/material/file?uid=${uid}`,
    })
    expect(built).toBeTruthy()

    const record = (await built!.surface.create_image({ prompt: 'a shopfront at dusk' })) as {
      ticket: string
      display?: string
    }

    // THE SENTENCE IS OURS AND THE SEAM IS THE PLUGIN'S. It has to TELL the
    // model what to do with the line, because the plugin wraps it in no prose of
    // its own.
    expect(record.display).toBeTruthy()
    expect(record.display!.toLowerCase()).toContain('exactly as written')

    const [, url] = pictureIn([record.display!])
    expect(url).toContain(record.ticket)

    const { businessId, res } = await fetchScoped(url)
    expect(businessId).toBe(scope.businessId)
    expect(res.status).toBe(200)
    expect((await res.arrayBuffer()).byteLength).toBeGreaterThan(0)
  })

  it('test_UAT_FC_REQ-217_nowhere_to_show_it_means_no_line', async () => {
    await APPLIED
    await ensureTenant('req217-none')
    const tickets = await ticketStoreFor(
      { DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket },
      { businessId: 'req217-none' },
    )
    const png = 'iVBORw0KGgoAAAANSUhEUgAAAAMAAAACCAYAAAAAAAAA'
    const provider = (async () => ({
      status: 200,
      ok: true,
      json: async () => ({ data: [{ b64_json: png }] }),
    })) as unknown as typeof fetch

    // NO `materialUrl`, which is the deployment that has nowhere to put a
    // picture. The plugin's own prose says what absence means — *"the id is the
    // whole of what you can pass on"* — so the field must be ABSENT rather than
    // empty, and the manual must not describe one that never arrives.
    const built = imageSurface({ OPENAI_API_KEY: 'k' }, tickets, null, { fetch: provider })
    const record = (await built!.surface.create_image({
      prompt: 'a shopfront at dusk',
    })) as Record<string, unknown>
    expect('display' in record).toBe(false)
    expect(record.ticket).toBeTruthy()
  })
})
