import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  AI_STATUS_PATH,
  resetChatHost,
  route,
  type RouterDeps,
  type RouterEnv,
} from '../apps/control-app/src/router'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import type { Scope } from '../apps/control-app/src/scope'
import {
  GENERATED_ORIGIN,
  IMAGE_BUDGET,
  IMAGE_SECRET,
  generatedMaterialStore,
} from '../apps/control-app/src/imagegen'
import { promoteToSiteAsset } from '../apps/control-app/src/material'
import { projectKnowledgeFor } from '../apps/control-app/src/knowledge'
import { REDACTED } from '../apps/control-app/src/redact'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { applySchema, ensureTenant, tenantStore } from './support/d1-site-factory'
import { siteSeed } from './support/site-seed'
import { stubEmbedder } from './support/stub-embedder'
import { calls, says, scriptedClient, systemText } from './support/scripted-model-client'
import type { ModelStep, ScriptedClient } from './support/scripted-model-client'

/**
 * story-39c992d3 — the consultant can generate a raster picture that lands as an
 * ordinary, legibly-generated piece of the client's material ([[REQ-208]]).
 *
 * Every claim is driven through `route()` — the Worker's own route table — over
 * real D1 and R2 inside workerd. Two doubles only, both at genuinely external
 * boundaries: the Anthropic client and the image provider's HTTP endpoint (the
 * `imageFetch` seam). The knowledge-search claim adds the stub embedder, which is
 * the KB's model seam (miniflare has no Workers AI).
 */

const APPLIED = applySchema()
const ORIGIN = 'https://app.test'
const IMAGE_TOOL = 'CreateImage'

/** A real 3×2 PNG, so the component measures real dimensions off real bytes. */
const PNG_3x2 = 'iVBORw0KGgoAAAANSUhEUgAAAAMAAAACCAYAAAAAAAAA'

/** The decoded bytes of {@link PNG_3x2}, for comparing what the Library serves. */
function pngBytes(): Uint8Array {
  const raw = atob(PNG_3x2)
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

/** Provider responses, in the provider's own wire shape. */
const providerImage = () => ({ data: [{ b64_json: PNG_3x2 }] })
const providerRefusal = () => ({
  error: {
    code: 'moderation_blocked',
    message: 'Your request was rejected as a result of our safety system.',
  },
})

interface Answer {
  status: number
  body: unknown
}

/**
 * A recording provider `fetch` that answers from a sequence (the last answer
 * repeats), so a single session can mix successes and refusals.
 */
function provider(...answers: Answer[]): typeof fetch & { calls: unknown[] } {
  const impl = async (_url: unknown, init: { body: string }) => {
    impl.calls.push(JSON.parse(init.body))
    const a = answers[Math.min(impl.calls.length - 1, answers.length - 1)]
    return { status: a.status, ok: a.status >= 200 && a.status < 300, json: async () => a.body }
  }
  impl.calls = [] as unknown[]
  return impl as unknown as typeof fetch & { calls: unknown[] }
}
const ok: Answer = { status: 200, body: providerImage() }
const refused: Answer = { status: 400, body: providerRefusal() }

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

const scopeOf = (businessId: string): Scope => ({ businessId })

async function business(id: string): Promise<{ scope: Scope; slug: string }> {
  await APPLIED
  await ensureTenant(id)
  const scope = scopeOf(id)
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

interface Turn {
  client: ScriptedClient
  frames: { kind: string; content?: string }[]
  raw: string
  opened: number
}

/** Open a session and take one scripted turn, through the Worker's own routes. */
async function turn(
  scope: Scope,
  slug: string,
  script: ModelStep[],
  deps: RouterDeps,
  envOver: Partial<RouterEnv> = {},
): Promise<Turn> {
  const workerEnv = routerEnv(envOver)
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
  const raw = await streamed.text()
  const frames = raw
    .split('\n\n')
    .map((f) => f.trim())
    .filter((f) => f.startsWith('data:'))
    .map((f) => JSON.parse(f.slice(5).trim()) as { kind: string; content?: string })
  return { client, frames, raw, opened: opened.status }
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

/** A GET through the route table, as JSON. */
async function getJson(scope: Scope, path: string, deps: RouterDeps = {}): Promise<unknown> {
  const res = await route(new Request(`${ORIGIN}${path}`), routerEnv(), scope, deps)
  expect(res.status).toBe(200)
  return res.json()
}

type Row = Record<string, unknown> & { uid: string }

async function library(scope: Scope): Promise<Row[]> {
  return ((await getJson(scope, '/api/material')) as { material: Row[] }).material
}

async function libraryItem(scope: Scope, uid: string): Promise<Row & { body: string }> {
  return (await getJson(scope, `/api/material/item?uid=${encodeURIComponent(uid)}`)) as Row & {
    body: string
  }
}

async function ticketsFor(id: string): Promise<TicketStore> {
  return ticketStoreFor({ DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket }, { businessId: id })
}

/** The business's material and brief tickets, as a stable fingerprint of the store's state. */
async function everyTicket(tickets: TicketStore): Promise<string> {
  const all = [
    ...(await tickets.query({ predicate: 'type = material' })).tickets,
    ...(await tickets.query({ predicate: 'type = brief' })).tickets,
  ]
  return JSON.stringify(
    all.map((t) => ({ uid: t.uid, type: t.type, fields: t.fields })).sort((a, b) =>
      a.uid.localeCompare(b.uid),
    ),
  )
}

/** The site's definition: site.json, pages and asset names. */
async function siteDefinition(id: string, slug: string): Promise<string> {
  const sites = await tenantStore(id)
  return JSON.stringify({
    site: await sites.readSiteJson(slug),
    pages: await sites.readPages(slug),
    assets: await sites.listAssets(slug),
  })
}

const generates = (input: Record<string, unknown>): ModelStep[] => [
  calls(IMAGE_TOOL, input),
  says('I have made one — tell me if it is close.'),
]

beforeAll(async () => {
  await APPLIED
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('story-39c992d3 — the consultant can generate a picture as ordinary material', () => {
  it('test_UAT_AC2379_a_session_with_an_image_credential_generates_a_picture_into_the_library', async () => {
    const id = 'ac2379-generates'
    const { scope, slug } = await business(id)
    const before = await library(scope)
    const fake = provider(ok)

    const { client } = await turn(scope, slug, generates({ prompt: 'A warm bakery at dawn' }), {
      imageFetch: fake,
    })

    // Offered with no instance-config entry: the grant is the plugin's own.
    expect(client.seen[0].tools.map((t) => t.name)).toContain(IMAGE_TOOL)
    expect(fake.calls).toHaveLength(1)
    const [result] = toolResults(client)
    expect(result).not.toMatch(/declined|error|not a shape|allowed/i)

    const after = await library(scope)
    expect(after).toHaveLength(before.length + 1)
    const row = after.find((r) => !before.some((b) => b.uid === r.uid))!
    expect(String(row.title).toLowerCase()).toContain('bakery')
    const item = await libraryItem(scope, row.uid)
    expect(item.body).toContain('A warm bakery at dawn')

    const tickets = await ticketsFor(id)
    const { attachments } = await tickets.attachments({ uid: row.uid })
    expect(attachments).toHaveLength(1)
    const file = await route(
      new Request(`${ORIGIN}/api/material/file?uid=${encodeURIComponent(row.uid)}`),
      routerEnv(),
      scope,
      {},
    )
    expect(file.status).toBe(200)
    expect(new Uint8Array(await file.arrayBuffer())).toEqual(pngBytes())
  })

  it('test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor', async () => {
    const { scope, slug } = await business('ac2380-vendorless')
    const readable: string[] = []

    // Success.
    const success = await turn(scope, slug, generates({ prompt: 'a shopfront' }), {
      imageFetch: provider(ok),
    })
    readable.push(systemText(success.client.seen[0]), JSON.stringify(success.client.seen[0].tools))
    readable.push(...toolResults(success.client))
    // Provider refusal.
    const refusal = await turn(scope, slug, generates({ prompt: 'something declined' }), {
      imageFetch: provider(refused),
    })
    readable.push(...toolResults(refusal.client))
    // Unsupported shape.
    const shape = await turn(scope, slug, generates({ prompt: 'wide', aspect_ratio: '21:9' }), {
      imageFetch: provider(ok),
    })
    readable.push(...toolResults(shape.client))
    // Budget exhausted.
    const budget = await turn(
      scope,
      slug,
      [
        ...Array.from({ length: IMAGE_BUDGET + 1 }, (_, i) => calls(IMAGE_TOOL, { prompt: `try ${i}` })),
        says('Enough.'),
      ],
      { imageFetch: provider(ok) },
    )
    const budgetResults = toolResults(budget.client)
    expect(budgetResults[IMAGE_BUDGET]).toContain('as many images as it is allowed')
    readable.push(...budgetResults)

    const text = readable.join('\n')
    for (const vendor of ['openai', 'OpenAI', 'gpt-image', 'Google', 'google', 'Gemini', 'gemini', 'imagen']) {
      expect(text).not.toContain(vendor)
    }
    const schema = success.client.seen[0].tools.find((t) => t.name === IMAGE_TOOL)!
    const params = Object.keys((schema.input_schema.properties ?? {}) as Record<string, unknown>)
    expect(params).not.toContain('provider')
    expect(params).not.toContain('model')
  })

  it('test_UAT_AC2381_without_an_image_credential_the_session_works_and_has_no_image_tool', async () => {
    const { scope, slug } = await business('ac2381-keyless')

    const { client, frames, opened } = await turn(
      scope,
      slug,
      [calls('list_pages', {}), says('You have one page.')],
      {},
      { [IMAGE_SECRET]: undefined } as Partial<RouterEnv>,
    )

    expect(opened).toBe(200)
    const offered = client.seen[0].tools.map((t) => t.name)
    expect(offered).not.toContain(IMAGE_TOOL)
    const manual = systemText(client.seen[0])
    expect(manual).not.toContain(IMAGE_TOOL)
    expect(manual).not.toContain('Generate an image')
    // Another tool ran and answered, and the turn finished without an error frame.
    expect(toolResults(client).join('\n')).toContain('home')
    expect(frames.some((f) => f.kind === 'error')).toBe(false)
    expect(frames.at(-1)?.kind).toBe('done')
  })

  it('test_UAT_AC2382_a_missing_image_credential_does_not_make_the_product_unconfigured', async () => {
    const { scope, slug } = await business('ac2382-configured')
    const noImage = { [IMAGE_SECRET]: undefined } as Partial<RouterEnv>

    const status = await route(new Request(`${ORIGIN}${AI_STATUS_PATH}`), routerEnv(noImage), scope, {})
    expect(status.status).toBe(200)
    expect(await status.json()).toEqual({ ai: true, message: null })

    // And the assistant is usable.
    const { frames } = await turn(scope, slug, [says('Right.')], {}, noImage)
    expect(frames.some((f) => f.kind === 'text')).toBe(true)
    expect(frames.some((f) => f.kind === 'error')).toBe(false)
  })

  it('test_UAT_AC2383_a_generated_picture_carries_the_full_material_vocabulary', async () => {
    const id = 'ac2383-fields'
    const { scope, slug } = await business(id)

    await turn(scope, slug, generates({ prompt: 'A warm bakery at dawn' }), {
      imageFetch: provider(ok),
    })

    const [row] = await library(scope)
    const item = await libraryItem(scope, row.uid)
    const tickets = await ticketsFor(id)
    const {
      attachments: [attachment],
    } = await tickets.attachments({ uid: row.uid })

    for (const seen of [row, item]) {
      expect(seen.kind).toBe('image')
      expect(seen.description_status).toBe('ok')
      expect(seen.description_model).toBeTruthy()
      expect(seen.description_model).not.toBe('client')
      // The backend's model id, not the provider-name fallback.
      expect(seen.description_model).not.toBe('openai')
      expect(seen.rights).toBe('owned')
      expect(seen.republishable).toBe(true)
      expect(seen.exportable).toBe(false)
      expect(seen.role).toBe('site')
      expect(seen.content_type).toBe(attachment.fields.content_type)
      expect(seen.filename).toBe(attachment.fields.filename)
    }
    // Stored on the material itself, not only derived for display.
    const { ticket } = await tickets.get({ uid: row.uid })
    expect(ticket.fields.content_type).toBe(attachment.fields.content_type)
    expect(ticket.fields.filename).toBe(attachment.fields.filename)

    // A re-describe pass selects degraded material; this one is not selected.
    const { tickets: redescribe } = await tickets.query({
      predicate: "type = material AND fields.description_status != 'ok'",
    })
    expect(redescribe.map((t) => t.uid)).not.toContain(row.uid)
    const { tickets: noDescriber } = await tickets.query({
      predicate: 'fields.description_status = no_describer',
    })
    expect(noDescriber.map((t) => t.uid)).not.toContain(row.uid)
  })

  it('test_UAT_AC2384_a_generated_picture_is_marked_generated_and_selectable_by_origin', async () => {
    const id = 'ac2384-origin'
    const { scope, slug } = await business(id)
    const tickets = await ticketsFor(id)
    const { ticket: uploaded } = await tickets.create({
      type: 'material',
      title: 'Our real shopfront',
      body: 'A photograph the client supplied.',
      fields: {
        rights: 'owned',
        republishable: true,
        exportable: false,
        origin: 'uploaded',
        kind: 'image',
      },
    })

    await turn(scope, slug, generates({ prompt: 'a shopfront' }), { imageFetch: provider(ok) })

    const rows = await library(scope)
    const generated = rows.find((r) => r.uid !== uploaded.uid)!
    // The field the Library's "Where it came from" row reads.
    expect(generated.origin).toBe(GENERATED_ORIGIN)
    expect((await libraryItem(scope, generated.uid)).origin).toBe('generated')
    expect(generated.origin).not.toBe(generated.description_model)

    const { tickets: found } = await tickets.query({ predicate: 'fields.origin = generated' })
    expect(found.map((t) => t.uid)).toEqual([generated.uid])
  })

  it('test_UAT_AC2385_a_generated_picture_is_findable_by_its_prompt_without_a_describe_call', async () => {
    const id = 'ac2385-findable'
    const { scope, slug } = await business(id)
    const embedder = stubEmbedder()
    const kb = await projectKnowledgeFor(
      { DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket } as never,
      scope,
      { embedder },
    )
    const described: unknown[] = []

    await turn(scope, slug, generates({ prompt: 'zebra striped awning over a lavender florist' }), {
      imageFetch: provider(ok),
      // The upload path's indexer, against a KB whose only double is the embedder.
      index: async () => async () => {
        const { rebuild } = await kb.onMaterialWritten()
        await rebuild.catch(() => {})
      },
      describeImage: (async (...args: unknown[]) => {
        described.push(args)
        throw new Error('the describer must not be called for a generated picture')
      }) as unknown as RouterDeps['describeImage'],
    })

    const [row] = await library(scope)
    expect((await libraryItem(scope, row.uid)).body).toContain('zebra striped awning')
    const hits = await kb.search('zebra striped awning lavender florist')
    expect(hits.map((h) => h.uid)).toContain(row.uid)
    expect(described).toHaveLength(0)
  })

  it('test_UAT_AC2386_image_generation_is_capped_at_ten_attempts_per_session', async () => {
    const { scope, slug } = await business('ac2386-budget')
    // Some attempts fail at the provider; they still count.
    const fake = provider(refused, refused, refused, ok)
    expect(IMAGE_BUDGET).toBe(10)

    const { client, frames } = await turn(
      scope,
      slug,
      [
        ...Array.from({ length: IMAGE_BUDGET + 1 }, (_, i) => calls(IMAGE_TOOL, { prompt: `attempt ${i + 1}` })),
        calls('list_pages', {}),
        says('That is as many as I may make.'),
      ],
      { imageFetch: fake },
    )

    expect(fake.calls).toHaveLength(10)
    const results = toolResults(client)
    expect(results).toHaveLength(IMAGE_BUDGET + 2)
    expect(results[IMAGE_BUDGET]).toContain('as many images as it is allowed')
    // A non-image tool afterwards still works in the same session.
    expect(results[IMAGE_BUDGET + 1]).toContain('home')
    expect(frames.at(-1)?.kind).toBe('done')
  })

  it('test_UAT_AC2387_a_provider_refusal_is_a_named_actionable_error_and_creates_nothing', async () => {
    const id = 'ac2387-refused'
    const { scope, slug } = await business(id)

    const { client } = await turn(scope, slug, generates({ prompt: 'something declined' }), {
      imageFetch: provider(refused),
    })

    const [result] = toolResults(client)
    expect(result).toContain('declined')
    expect(result).toContain('rewrite the prompt')
    expect(await library(scope)).toHaveLength(0)
  })

  it('test_UAT_AC2388_an_unsupported_aspect_ratio_is_named_as_a_shape_before_any_provider_call', async () => {
    const { scope, slug } = await business('ac2388-shape')
    const fake = provider(ok)

    const { client } = await turn(scope, slug, generates({ prompt: 'a very wide banner', aspect_ratio: '21:9' }), {
      imageFetch: fake,
    })

    const [result] = toolResults(client)
    expect(result).toContain('not a shape this generator offers')
    expect(result).not.toContain('declined')
    expect(fake.calls).toHaveLength(0)
    expect(await library(scope)).toHaveLength(0)
  })

  it('test_UAT_AC2389_generating_places_nothing_and_promote_is_the_separate_step_that_does', async () => {
    const id = 'ac2389-unplaced'
    const { scope, slug } = await business(id)
    const definitionBefore = await siteDefinition(id, slug)

    await turn(scope, slug, generates({ prompt: 'a hero image' }), { imageFetch: provider(ok) })

    const [row] = await library(scope)
    expect(row.placed_on).toEqual([])
    expect(await siteDefinition(id, slug)).toBe(definitionBefore)

    const tickets = await ticketsFor(id)
    const sites = await tenantStore(id)
    const placed = await promoteToSiteAsset(tickets, sites, {
      uid: row.uid,
      slug,
      name: String(row.filename),
    })
    expect(await sites.listAssets(slug)).toContain(placed.name)
    expect((await libraryItem(scope, row.uid)).placed_on).toEqual([slug])
  })

  it('test_UAT_AC2390_the_image_store_only_creates_material_and_only_attaches_to_its_own', async () => {
    const id = 'ac2390-scoped'
    await business(id)
    const tickets = await ticketsFor(id)
    const { ticket: existing } = await tickets.create({
      type: 'material',
      title: 'An uploaded photo',
      body: 'not ours',
      fields: { rights: 'owned', republishable: true, exportable: false, origin: 'uploaded', kind: 'image' },
    })
    const before = await everyTicket(tickets)
    const scoped = generatedMaterialStore(tickets, () => 'a-model', null)

    await expect(scoped.create({ type: 'brief', title: 'not a picture', body: 'x' })).rejects.toThrow(
      /may only create 'material' tickets/,
    )
    await expect(
      scoped.attach({ uid: existing.uid, bytes: new Uint8Array([1, 2, 3]), filename: 'x.png' }),
    ).rejects.toThrow(/may only attach to a ticket it created/)

    expect(await everyTicket(tickets)).toBe(before)
    expect((await tickets.attachments({ uid: existing.uid })).attachments).toHaveLength(0)
  })

  it('test_UAT_AC2391_the_image_credential_is_redacted_from_everything_a_person_is_shown', async () => {
    const key = 'sk-img-a+b.c*d[e]f$g|h(i)-0123456789'
    const { scope, slug } = await business('ac2391-redacted')
    const withKey = { [IMAGE_SECRET]: key } as Partial<RouterEnv>

    // A failure before any turn, echoing the image credential.
    const failing = await route(
      new Request(`${ORIGIN}/api/ai/session`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug }),
      }),
      routerEnv(withKey),
      scope,
      {
        store: async () => {
          throw new Error(`upstream refused: {"authorization":"Bearer ${key}"}`)
        },
      },
    )
    const envelope = await failing.text()
    expect(failing.status).toBe(500)
    expect(envelope).not.toContain(key)
    expect(envelope).toContain(REDACTED)
    resetChatHost()

    // A failing image provider whose error echoes the credential, then a failing
    // model call doing the same, inside the streamed turn a person reads.
    const echoing = (async () => {
      throw new Error(`image provider unreachable with Authorization: Bearer ${key}`)
    }) as unknown as typeof fetch
    const { raw } = await turn(
      scope,
      slug,
      [
        calls(IMAGE_TOOL, { prompt: 'a shopfront' }),
        () => {
          throw new Error(`upstream refused: sent key ${key}`)
        },
      ],
      { imageFetch: echoing },
      withKey,
    )
    expect(raw).not.toContain(key)
    expect(raw).toContain(REDACTED)
    expect(raw).toContain('upstream refused')
  })
})
