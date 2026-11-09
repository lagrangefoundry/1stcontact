import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { resetChatHost, route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import { splitBusinessPrefix, type Scope } from '../apps/control-app/src/scope'
import { IMAGE_SECRET, imageSurface } from '../apps/control-app/src/imagegen'
import * as aiLib from '../apps/control-app/src/generated/ai-workers.js'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { applySchema, ensureTenant } from './support/d1-site-factory'
import { siteSeed } from './support/site-seed'
import { calls, says, scriptedClient, systemText } from './support/scripted-model-client'
import type { ModelStep, ScriptedClient } from './support/scripted-model-client'

/**
 * story-39c992d3 — the display half of a generated picture ([[REQ-217]]).
 *
 * AC-2567: in a builder session, `create_image`'s result carries a sentence with
 * one markdown image line addressed to the new material under the business's own
 * path, and that line fetches the picture's bytes.
 * AC-2568: a host that supplies no material-URL factory gets no `display` field
 * at all, a manual that describes none, and a generation that still succeeds.
 *
 * Doubles only at external boundaries: the Anthropic client and the image
 * provider's HTTP endpoint. Everything else is the Worker's route table over
 * real D1 and R2 inside workerd.
 */

const APPLIED = applySchema()
const ORIGIN = 'https://app.test'
const IMAGE_TOOL = 'CreateImage'

/** A real 3×2 PNG. */
const PNG_3x2 = 'iVBORw0KGgoAAAANSUhEUgAAAAMAAAACCAYAAAAAAAAA'

function pngBytes(): Uint8Array {
  const raw = atob(PNG_3x2)
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

/** The provider's HTTP endpoint, answering every call with one image. */
function provider(): typeof fetch & { calls: number } {
  const impl = async () => {
    impl.calls += 1
    return { status: 200, ok: true, json: async () => ({ data: [{ b64_json: PNG_3x2 }] }) }
  }
  impl.calls = 0
  return impl as unknown as typeof fetch & { calls: number }
}

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
async function turn(scope: Scope, slug: string, script: ModelStep[], deps: RouterDeps): Promise<ScriptedClient> {
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
      body: JSON.stringify({ sessionId: session.sessionId, text: 'We have no photographs.' }),
    }),
    workerEnv,
    scope,
    deps,
  )
  expect(streamed.status).toBe(200)
  await streamed.text()
  return client
}

/** Every tool result the model was handed back, in order (from the last request). */
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

/** Undo the JSON-in-JSON escaping a tool result travels with. */
function unescaped(text: string): string {
  return text.replace(/\\"/g, '"').replace(/\\n/g, '\n')
}

const PICTURE = /!\[([^\]]*)\]\(([^)]+)\)/g

/**
 * The manual a model would read for this surface: the library's own Toolbox,
 * built from the surface and the grant it declares — the assembly the host does.
 */
function manualOf(built: { surface: unknown; granted: Record<string, unknown> }): string {
  const lib = aiLib as unknown as {
    Toolbox: new (s: unknown[], c: unknown) => { manual(): unknown; schemas(): unknown }
  }
  const box = new lib.Toolbox([built.surface], built.granted)
  return String(box.manual()) + JSON.stringify(box.schemas())
}

async function ticketsFor(id: string): Promise<TicketStore> {
  return ticketStoreFor({ DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket }, { businessId: id })
}

async function materialUids(tickets: TicketStore): Promise<string[]> {
  return (await tickets.query({ predicate: 'type = material' })).tickets.map((t) => t.uid)
}

beforeAll(async () => {
  await APPLIED
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('story-39c992d3 — a generated picture is shown in the turn that made it', () => {
  it('test_UAT_AC2567_a_generated_picture_result_carries_a_business_scoped_line_that_fetches_its_bytes', async () => {
    const id = 'ac2567-display'
    const { scope, slug } = await business(id)
    const tickets = await ticketsFor(id)
    const before = await materialUids(tickets)
    const fake = provider()

    const client = await turn(
      scope,
      slug,
      [calls(IMAGE_TOOL, { prompt: 'A warm bakery at dawn' }), says('Here it is.')],
      { imageFetch: fake },
    )
    expect(fake.calls).toBe(1)

    // Exactly one new material: the one this generation created.
    const after = await materialUids(tickets)
    const fresh = after.filter((uid) => !before.includes(uid))
    expect(fresh).toHaveLength(1)
    const uid = fresh[0]

    // The result's display sentence tells the model to include the line exactly
    // as written, and holds exactly one markdown image line.
    const results = toolResults(client).map(unescaped)
    expect(results).toHaveLength(1)
    const result = results[0]
    expect(result).toContain('"display"')
    expect(result.toLowerCase()).toContain('exactly as written')
    const pictures = [...result.matchAll(PICTURE)]
    expect(pictures).toHaveLength(1)
    const [, alt, url] = pictures[0]

    // Addressed under this business's own path, to the new material.
    expect(url).toBe(`/b/${id}/api/material/file?uid=${uid}`)

    // Alt text is the file's name without its extension and without brackets.
    const { attachments } = await tickets.attachments({ uid })
    expect(attachments).toHaveLength(1)
    const filename = String(attachments[0].fields.filename)
    expect(filename).toMatch(/\.[a-z0-9]+$/i)
    const stem = filename.replace(/\.[^.]+$/, '').replace(/[[\]]/g, '')
    expect(alt).toBe(stem)
    expect(alt).not.toMatch(/\.[a-z0-9]+$/i)
    expect(alt).not.toContain('bakery at dawn')

    // Split the prefix the way the production router does, and fetch the bytes.
    const parsed = new URL(url, ORIGIN)
    const split = splitBusinessPrefix(parsed.pathname)
    expect(split.businessId).toBe(id)
    const res = await route(
      new Request(`${ORIGIN}${split.path}${parsed.search}`),
      routerEnv(),
      { businessId: split.businessId! },
      {},
    )
    expect(res.status).toBe(200)
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(pngBytes())

    // The manual the model reads in this session describes the display field.
    const manual = systemText(client.seen[0]) + JSON.stringify(client.seen[0].tools)
    expect(manual).toContain('display')
  })

  it('test_UAT_AC2568_without_a_material_url_factory_the_result_has_no_display_and_generation_still_succeeds', async () => {
    const id = 'ac2568-no-display'
    await APPLIED
    await ensureTenant(id)
    const tickets = await ticketsFor(id)
    const before = await materialUids(tickets)

    // A host assembling the surface with no way to address material.
    const bare = imageSurface({ OPENAI_API_KEY: 'k' }, tickets, null, { fetch: provider() })
    expect(bare).toBeTruthy()

    const record = (await bare!.surface.create_image({ prompt: 'a shopfront at dusk' })) as Record<
      string,
      unknown
    >

    // Generation succeeded and stored exactly one material, the one named.
    expect(typeof record.ticket).toBe('string')
    const after = await materialUids(tickets)
    const fresh = after.filter((uid) => !before.includes(uid))
    expect(fresh).toEqual([record.ticket])
    const { attachments } = await tickets.attachments({ uid: String(record.ticket) })
    expect(attachments).toHaveLength(1)

    // No display field at all — absent, not empty.
    expect('display' in record).toBe(false)

    // The declared manual describes no display field…
    const bareManual = manualOf(bare!)
    expect(bareManual.length).toBeGreaterThan(0)
    expect(bareManual).not.toContain('display')

    // …whereas the same surface given a factory does, so the absence above is
    // the factory's absence and not a manual that never mentions it.
    const shown = imageSurface({ OPENAI_API_KEY: 'k' }, tickets, null, {
      fetch: provider(),
      materialUrl: (uid: string) => `/b/${id}/api/material/file?uid=${uid}`,
    })
    expect(manualOf(shown!)).toContain('display')
  })
})
