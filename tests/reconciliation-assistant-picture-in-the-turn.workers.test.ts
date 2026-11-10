import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  resetChatHost,
  route,
  type RouterDeps,
  type RouterEnv,
} from '../apps/control-app/src/router'
import { splitBusinessPrefix, type Scope } from '../apps/control-app/src/scope'
import { IMAGE_SECRET } from '../apps/control-app/src/imagegen'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { applySchema, ensureTenant } from './support/d1-site-factory'
import { siteSeed } from './support/site-seed'
import { calls, says, scriptedClient } from './support/scripted-model-client'
import type { ModelStep, ScriptedClient } from './support/scripted-model-client'

/**
 * story-b3de4571 (STORY-107), AC-2569 — **a drawing a turn made appears in that
 * turn**, proved end to end (REQ-217, `write_image`'s half).
 *
 * WHAT MAKES THIS EVIDENCE. The claim is not *"a tool returns a string"* — it is
 * *"the client sees the picture"*, and the only honest form of that is: take a
 * real turn through the Worker's own route table, over a real D1 database and
 * real R2 buckets, read the line the model was actually handed, and then FETCH
 * IT. If those bytes come back, the picture is in the conversation.
 *
 * THE ADDRESS IS READ BACK BY THE PRODUCTION READER. The line is scoped
 * (`/b/<businessId>/…`) because an unscoped one resolves against the first
 * admissible business, so the round trip goes through `splitBusinessPrefix` —
 * the same function `index.ts` uses.
 *
 * ONE DOUBLE, at a boundary that is genuinely external: the Anthropic client.
 *
 * `create_image`'s line (story-39c992d3) is proved in
 * `reconciliation-consultant-image-generation-display.workers.test.ts`
 * (AC-2567, AC-2568).
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

describe('story-b3de4571 — the drawing is in the conversation that made it', () => {
  beforeAll(async () => {
    await APPLIED
  })

  it('test_UAT_AC2569_a_drawing_the_turn_made_is_fetchable_from_the_turn', async () => {
    resetAiHost()
    resetChatHost()
    const { scope, slug } = await business('ac2569-draw')

    const client = await turn(scope, slug, [
      calls('write_image', { name: 'wordmark', svg: MARK }),
      says('Here it is — tell me if it is close.'),
    ])

    const [alt, url] = pictureIn(toolResults(client))
    expect(alt).toBe('wordmark')
    expect(url).toBe(`/b/${scope.businessId}/preview/${slug}/draft/assets/wordmark.svg`)

    // THE ADDRESS NAMES THIS BUSINESS. Unscoped resolves against the first
    // admissible business, which is the crossing `scope.ts` exists to prevent.
    const { businessId, res } = await fetchScoped(url)
    expect(businessId).toBe(scope.businessId)

    // AND IT IS THE DRAWING. A line that parses and 404s is a broken picture in
    // the client's conversation.
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('#1a3a6b')

    // A REDRAW WITH `replace: true` HANDS BACK THE IDENTICAL LINE, and that line
    // now serves the new drawing — the accepted consequence of naming a live
    // asset.
    const redraw = await turn(scope, slug, [
      calls('write_image', { name: 'wordmark', svg: MARK.replace('#1a3a6b', '#e76f51'), replace: true }),
      says('Redrawn.'),
    ])
    const [, again] = pictureIn(toolResults(redraw))
    expect(again).toBe(url)
    const refetched = await fetchScoped(again)
    expect(refetched.res.status).toBe(200)
    expect(await refetched.res.text()).toContain('#e76f51')
  })
})
