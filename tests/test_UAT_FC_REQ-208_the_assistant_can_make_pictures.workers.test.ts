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
import { listMaterial, readMaterial } from '../apps/control-app/src/material'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { applySchema, ensureTenant } from './support/d1-site-factory'
import { siteSeed } from './support/site-seed'
import { calls, says, scriptedClient, systemText } from './support/scripted-model-client'
import type { ModelStep, ScriptedClient } from './support/scripted-model-client'

/**
 * [[REQ-208]] — **the assistant can make a picture**, and the product holds its
 * first credential for a vendor that is not Anthropic.
 *
 * WHAT MAKES THIS EVIDENCE. Every claim goes through `route()` — the Worker's own
 * route table — over a real D1 database and real R2 buckets inside workerd. The
 * session, the role, the tool loop, the manual projection, the plugin
 * resolution, the declared surface, the refusal taxonomy, the per-session budget,
 * the ticket write and this product's normalisation of it are all the shipped
 * code.
 *
 * TWO DOUBLES, both at boundaries that are genuinely external and neither
 * between them and the behaviour under test. The Anthropic client, which is the
 * network and the seam the library's own backend is written to have injected;
 * and the image provider's HTTP endpoint, which is a second vendor's REST API
 * that miniflare has none of — and which the imagegen component opens a `fetch`
 * seam for precisely so a plugin can be demonstrated with no key and no spend.
 *
 * THE CLAIMS, in the order the ticket makes them:
 *
 *   1. THE ASSISTANT CAN MAKE A PICTURE — the tool is offered and the manual
 *      says so.
 *   2. THE MODEL NEVER LEARNS WHICH VENDOR DREW IT — not in the schemas, not in
 *      the manual, not in an error sentence.
 *   3. A DEPLOYMENT WITH NO IMAGE KEY HAS NO IMAGE TOOL, and the session still
 *      opens with everything else working.
 *   4. AND IS NOT UNCONFIGURED. `aiConfigured` does not start speaking for two
 *      vendors.
 *   5. A GENERATED IMAGE IS AN ORDINARY `material`, carrying this product's
 *      whole vocabulary and not the plugin's half of it.
 *   6. IT IS LEGIBLE AS GENERATED, in a field a predicate can select on.
 *   7. IT IS FINDABLE THE MOMENT IT EXISTS, with no describing call.
 *   8. GENERATION IS BOUNDED PER SESSION, and a spent budget refuses one
 *      operation while every other tool keeps working.
 *   9. A REFUSAL IS AN ERROR THE MODEL CAN ACT ON.
 *  10. A SHAPE THE PROVIDER CANNOT MAKE IS NAMED AS A SHAPE.
 *  11. NOTHING IS PLACED ON A SITE BY GENERATING IT.
 *  12. THE PLUGIN CANNOT WRITE AN ARBITRARY TICKET.
 */

const APPLIED = applySchema()

const ORIGIN = 'https://app.test'

/** A real 3×2 PNG, so the component measures real dimensions off real bytes. */
const PNG_3x2 = 'iVBORw0KGgoAAAANSUhEUgAAAAMAAAACCAYAAAAAAAAA'

/** An OpenAI image response carrying one image, in the provider's own shape. */
const providerImage = (image = PNG_3x2) => ({ data: [{ b64_json: image }] })

/** An OpenAI content-policy refusal, in the provider's own shape. */
const providerRefusal = () => ({
  error: {
    code: 'moderation_blocked',
    message: 'Your request was rejected as a result of our safety system.',
  },
})

/** A recording `fetch` that answers `body` under `status`. */
function fakeProvider(body: unknown, status = 200): typeof fetch & { calls: unknown[] } {
  const impl = async (_url: unknown, init: { body: string }) => {
    impl.calls.push(JSON.parse(init.body))
    return {
      status,
      ok: status >= 200 && status < 300,
      json: async () => body,
    }
  }
  impl.calls = [] as unknown[]
  return impl as unknown as typeof fetch & { calls: unknown[] }
}

function routerEnv(over: Partial<RouterEnv> = {}): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    // THE SECOND VENDOR'S CREDENTIAL, spelled by the plugin rather than by this
    // test — a suite that wrote the name itself could pass while production
    // supplied a key under a name the plugin never asks for.
    [IMAGE_SECRET]: 'test-image-key-not-a-real-one',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...over,
  } as RouterEnv
}

const scopeOf = (businessId: string): Scope => ({ businessId })

/** A business with the schema applied, its tenant registered, and one site. */
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

/** Open a session and take one scripted turn, through the Worker's own routes. */
async function turn(
  scope: Scope,
  slug: string,
  script: ModelStep[],
  deps: RouterDeps,
  envOver: Partial<RouterEnv> = {},
): Promise<{ client: ScriptedClient; frames: { kind: string; content?: string }[] }> {
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
  const text = await streamed.text()
  const frames = text
    .split('\n\n')
    .map((f) => f.trim())
    .filter((f) => f.startsWith('data:'))
    .map((f) => JSON.parse(f.slice(5).trim()) as { kind: string; content?: string })
  return { client, frames }
}

/** This business's real ticket store, for reading back what the tool wrote. */
async function ticketsFor(id: string): Promise<TicketStore> {
  return ticketStoreFor(
    { DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket },
    { businessId: id },
  )
}

/**
 * The name the model actually sees.
 *
 * THE DECLARATION'S `tool`, NOT ITS `op`. A surface declares both and they are
 * different vocabularies on purpose: `create_image` is the operation a grant and
 * an audit record name, `CreateImage` is the tool a model is offered. `schemas()`
 * keys on the latter, so a suite asserting the former would be asserting that
 * the projection does something it has never done.
 */
const IMAGE_TOOL = 'CreateImage'

/** One image call, then prose — the ordinary shape of a turn. */
const generates = (input: Record<string, unknown>): ModelStep[] => [
  calls(IMAGE_TOOL, input),
  says('I have made one — tell me if it is close.'),
]

/**
 * Every tool result the model was handed back, as text, in order.
 *
 * READ OFF THE LAST REQUEST ALONE, and that is not a shortcut. Each turn of the
 * tool loop re-sends the whole conversation, so the transcript grows by one
 * exchange per call and every earlier result appears again — summing across
 * `seen` counts the first result once per subsequent round and turns eleven
 * results into a hundred and thirty-two. The last request carries the complete
 * history exactly once, which is the thing being asked for.
 */
function toolResults(client: ScriptedClient): string[] {
  const out: string[] = []
  const last = client.seen[client.seen.length - 1]
  {
    for (const message of last.messages) {
      const content = message.content
      if (!Array.isArray(content)) continue
      for (const block of content as Record<string, unknown>[]) {
        if (block.type === 'tool_result') out.push(JSON.stringify(block.content))
      }
    }
  }
  return out
}

beforeAll(async () => {
  await APPLIED
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('REQ-208 — the assistant can make pictures', () => {
  it('test_UAT_FC_REQ-208_a_consultant_session_can_make_a_picture', async () => {
    // AC1. "The assistant can make a picture." The tool surface is a PROJECTION
    // of this session's actual grant, so the schemas the model is handed are the
    // proof that the plugin resolved and the surface was composed — and the
    // manual is the proof it was told.
    const { scope, slug } = await business('req208-offered')
    const provider = fakeProvider(providerImage())

    const { client } = await turn(scope, slug, [says('Right.')], { imageFetch: provider })

    expect(client.seen[0].tools.map((t) => t.name)).toContain(IMAGE_TOOL)
    const manual = systemText(client.seen[0])
    expect(manual).toContain(IMAGE_TOOL)
    // The role text enumerates no tools, so the only route from the declaration
    // to the model is the projection — and the prose is the surface document's,
    // never written here.
    expect(manual).toContain('Generate an image from a written description')
  })

  it('test_UAT_FC_REQ-208_the_model_never_learns_which_vendor_drew_the_image', async () => {
    // AC2. "The provider is a construction option in the framework plugin, not a
    // parameter, and no error sentence or line of the manual names one." So this
    // asserts over EVERYTHING the model can read: the manual, every tool schema,
    // and the sentence it gets back when the provider refuses — which is the one
    // place a vendor name would most plausibly leak.
    const { scope, slug } = await business('req208-vendorless')
    const provider = fakeProvider(providerRefusal(), 400)

    const { client } = await turn(scope, slug, generates({ prompt: 'a bakery at dawn' }), {
      imageFetch: provider,
    })

    const readable = [
      systemText(client.seen[0]),
      JSON.stringify(client.seen[0].tools),
      ...toolResults(client),
    ].join('\n')
    for (const vendor of ['openai', 'OpenAI', 'google', 'Google', 'gpt-image', 'imagen']) {
      expect(readable).not.toContain(vendor)
    }
    // And there is no parameter through which it could ask: a construction
    // option is stricter than a scope axis, because an axis admitting two
    // providers still lets a model name one.
    const schema = client.seen[0].tools.find((t) => t.name === IMAGE_TOOL)
    expect(Object.keys(schema?.input_schema.properties ?? {}).sort()).toEqual([
      'aspect_ratio',
      'prompt',
      'tier',
      'transparency',
    ])
  })

  it('test_UAT_FC_REQ-208_a_deployment_with_no_image_key_has_no_image_tool', async () => {
    // AC3. "The plugin declares the credential it needs and drops out of the
    // surface and the manual when nothing supplies it... The session still opens
    // and every other tool keeps working." Absent, not present-and-throwing: a
    // model is never told about a capability it has not got, so it cannot
    // propose it, apologise for it, or probe for it.
    const { scope, slug } = await business('req208-keyless')

    const { client, frames } = await turn(scope, slug, [says('Right.')], {}, {
      [IMAGE_SECRET]: undefined,
    } as Partial<RouterEnv>)

    const offered = client.seen[0].tools.map((t) => t.name)
    expect(offered).not.toContain(IMAGE_TOOL)
    expect(systemText(client.seen[0])).not.toContain(IMAGE_TOOL)
    // THE SESSION STILL OPENS AND EVERY OTHER TOOL KEEPS WORKING — the same
    // shape a missing describer already has. A surface that was granted and not
    // composed would have refused to construct the Toolbox and killed the whole
    // assistant, which is what the grant narrowing prevents.
    expect(offered.length).toBeGreaterThan(0)
    expect(frames.some((f) => f.kind === 'text')).toBe(true)
  })

  it('test_UAT_FC_REQ-208_no_image_key_does_not_make_the_product_unconfigured', async () => {
    // AC4. "`aiConfigured` should not start speaking for two vendors. Its
    // question is *can this deployment reach a model at all*, and the answer
    // still turns on the Anthropic key. Image generation being absent is an
    // ordinary state, not a deployment fault."
    await business('req208-status')
    const answered = await route(
      new Request(`${ORIGIN}${AI_STATUS_PATH}`),
      routerEnv({ [IMAGE_SECRET]: undefined } as Partial<RouterEnv>),
      scopeOf('req208-status'),
      {},
    )
    expect(answered.status).toBe(200)
    // `ai: true` with no image key at all — the one question this endpoint asks
    // is still answered by the Anthropic key alone.
    expect((await answered.json()) as { ai: boolean; message: string | null }).toEqual({
      ai: true,
      message: null,
    })
  })

  it('test_UAT_FC_REQ-208_a_generated_image_is_an_ordinary_material', async () => {
    // AC5. "It lands as `material`, and this product fills what the plugin
    // cannot know." Every field in the ticket's own list is asserted here,
    // because each one is read by something downstream that would otherwise see
    // a row unlike every other row: the Library's list, its detail pane, and the
    // re-describe predicate.
    const id = 'req208-material'
    const { scope, slug } = await business(id)
    const provider = fakeProvider(providerImage())

    await turn(scope, slug, generates({ prompt: 'A warm bakery at dawn' }), {
      imageFetch: provider,
    })

    const tickets = await ticketsFor(id)
    const rows = await listMaterial(tickets)
    expect(rows).toHaveLength(1)
    const row = rows[0]

    // `kind` is `image` — the vocabulary DOC-38 §9 already declares, so it files
    // beside an uploaded one rather than beside nothing.
    expect(row.kind).toBe('image')
    // `description_status` is `ok`, and honestly so: the body IS the prompt,
    // which is a description written for retrieval. A later re-describe pass
    // selects on this field and must not pick this material up.
    expect(row.description_status).toBe('ok')
    // `description_model` names WHAT GENERATED IT, not what described it —
    // for this one kind of material those are the same act.
    expect(row.description_model).toBeTruthy()
    expect(row.description_model).not.toBe('client')
    // `content_type` and `filename` come from the generated bytes, measured off
    // them rather than asked for: a 3×2 PNG is what the provider returned.
    expect(row.content_type).toBe('image/png')
    expect(row.filename).toBe('a-warm-bakery-at-dawn.png')
    // And it is republishable, because an image this deployment commissioned on
    // the client's behalf is the one case where that right is not in doubt —
    // without it the picture could never reach a site at all.
    expect(row.republishable).toBe(true)

    // THE BODY IS THE PROMPT, which is what makes the description free. The
    // vision describer never ran and never needed to.
    const full = await readMaterial(tickets, row.uid)
    expect(full.body).toContain('A warm bakery at dawn')

    // AND THE BYTES ARE REALLY THERE, on an attachment of this material.
    const { attachments } = await tickets.attachments({ uid: row.uid })
    expect(attachments).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-208_a_generated_image_is_legible_as_generated', async () => {
    // AC6. "A generated image must be legible as generated... The record says
    // what made it, in a field a predicate can select on, and the Library shows
    // it where it shows the other things it knows about a file." The predicate
    // is the assertion that matters: an inspection would not survive a client
    // with two hundred files.
    const id = 'req208-legible'
    const { scope, slug } = await business(id)

    await turn(scope, slug, generates({ prompt: 'a shopfront' }), {
      imageFetch: fakeProvider(providerImage()),
    })

    const tickets = await ticketsFor(id)
    const [row] = await listMaterial(tickets)
    expect(row.origin).toBe(GENERATED_ORIGIN)
    // *"Which of these did we make"* is a QUERY.
    const { tickets: found } = await tickets.query({
      predicate: `fields.origin = ${GENERATED_ORIGIN}`,
    })
    expect(found.map((t) => t.uid)).toEqual([row.uid])
  })

  it('test_UAT_FC_REQ-208_a_generated_image_is_findable_the_moment_it_exists', async () => {
    // AC7. "A generated image is therefore findable the moment it exists, with
    // no describing call and no cost." Indexed through the SAME seam an upload
    // goes through, so this is the identical claim REQ-163 makes about a file.
    const id = 'req208-indexed'
    const { scope, slug } = await business(id)
    const indexed: string[] = []

    await turn(scope, slug, generates({ prompt: 'a quiet street' }), {
      imageFetch: fakeProvider(providerImage()),
      index: async () => async (uid: string) => {
        indexed.push(uid)
      },
    })

    const tickets = await ticketsFor(id)
    const [row] = await listMaterial(tickets)
    // EXACTLY ONCE, and for this material — the same assertion the upload
    // pipeline makes, because it is the same obligation.
    expect(indexed).toEqual([row.uid])
  })

  it('test_UAT_FC_REQ-208_generation_is_bounded_per_session', async () => {
    // AC8. "Generation is bounded per session... exhausting the cap refuses that
    // operation in words the model can act on while every other tool keeps
    // working." Driven at the real configured cap through the real tool loop,
    // because a bound asserted against a number this test chose would prove
    // nothing about the number that ships.
    const { scope, slug } = await business('req208-budget')
    const provider = fakeProvider(providerImage())

    const script: ModelStep[] = [
      ...Array.from({ length: IMAGE_BUDGET + 1 }, (_, i) =>
        calls(IMAGE_TOOL, { prompt: `attempt number ${i + 1}` }),
      ),
      says('That is as many as I may make.'),
    ]
    const { client } = await turn(scope, slug, script, { imageFetch: provider })

    // The provider was reached exactly the budget's worth of times: the refusal
    // happens BEFORE the network, which is the only thing that makes a cap a
    // cost control rather than a message.
    expect(provider.calls).toHaveLength(IMAGE_BUDGET)
    const results = toolResults(client)
    expect(results).toHaveLength(IMAGE_BUDGET + 1)
    // IN WORDS THE MODEL CAN ACT ON — the sentence is the surface document's,
    // and it tells the model that retrying is not the answer.
    expect(results[IMAGE_BUDGET]).toContain('as many images as it is allowed')
    // EVERY OTHER TOOL KEEPS WORKING: the budget refuses one operation, not the
    // session, so the turn still completes with prose.
    expect(client.seen[client.seen.length - 1].tools.length).toBeGreaterThan(1)
  })

  it('test_UAT_FC_REQ-208_a_refusal_is_an_error_the_model_can_act_on', async () => {
    // AC9. "The framework component classifies refusals into named categories
    // with their own prose, so a model told the prompt was declined can rewrite
    // it rather than retry it unchanged." A provider refusal is a JUDGEMENT
    // about the request; a transport failure is a deployment fault. Collapsing
    // them would have the model retry the one thing that cannot work.
    const { scope, slug } = await business('req208-refused')

    const { client } = await turn(scope, slug, generates({ prompt: 'something declined' }), {
      imageFetch: fakeProvider(providerRefusal(), 400),
    })

    const [result] = toolResults(client)
    expect(result).toContain('declined')
    expect(result).toContain('rewrite the prompt')
    // AND NOTHING WAS STORED. A refusal is not a picture, so the Library does
    // not acquire a material with no bytes.
    const tickets = await ticketsFor('req208-refused')
    expect(await listMaterial(tickets)).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-208_a_shape_the_provider_cannot_make_is_named_as_a_shape', async () => {
    // AC10. "A shape the provider cannot make is named as a shape, separately
    // from every other missing capability, because the aspect ratio is the one
    // thing the model can fix by itself." Every other unsupported capability
    // means *this deployment cannot do that at all*, and a model retrying a
    // different shape is sensible where retrying transparency is not.
    const { scope, slug } = await business('req208-shape')
    const provider = fakeProvider(providerImage())

    const { client } = await turn(
      scope,
      slug,
      generates({ prompt: 'a very wide banner', aspect_ratio: '21:9' }),
      { imageFetch: provider },
    )

    const [result] = toolResults(client)
    expect(result).toContain('not a shape this generator offers')
    // REFUSED BEFORE THE NETWORK: negotiation happens against the declared
    // capabilities, so an impossible shape costs nothing.
    expect(provider.calls).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-208_nothing_is_placed_on_a_site_by_generating_it', async () => {
    // AC11. "Nothing is placed on a site by generating it. `promoteToSiteAsset`
    // remains the only way an image reaches a site, unchanged and still a
    // separate, deliberate step."
    const id = 'req208-unplaced'
    const { scope, slug } = await business(id)

    await turn(scope, slug, generates({ prompt: 'a hero image' }), {
      imageFetch: fakeProvider(providerImage()),
    })

    const tickets = await ticketsFor(id)
    const [row] = await listMaterial(tickets)
    // `placed_on` is written by the promotion and by nothing else — generating
    // an image is not placing it, and the record says so.
    expect(row.placed_on).toEqual([])
  })

  it('test_UAT_FC_REQ-208_the_plugin_cannot_write_an_arbitrary_ticket', async () => {
    // AC12. "It does not give the assistant a way to write arbitrary tickets.
    // The plugin holds its own scoped store handle and the only record it can
    // cause is one holding a picture it was allowed to make." A property of the
    // HANDLE rather than of the plugin's good behaviour, which is what makes it
    // survive an upstream change nobody here reviewed.
    const id = 'req208-scoped'
    await business(id)
    const tickets = await ticketsFor(id)
    const scoped = generatedMaterialStore(tickets, () => 'a-model', null)

    await expect(
      scoped.create({ type: 'brief', title: 'not a picture', body: 'x' }),
    ).rejects.toThrow(/may only create 'material' tickets/)

    // And it cannot hang an attachment off a ticket somebody else made — so it
    // cannot reach an existing record by guessing at a uid either.
    const { ticket } = await tickets.create({
      type: 'brief',
      title: 'someone else’s',
      body: 'the brief',
      fields: { site_slug: `site-${id}` },
    })
    await expect(
      scoped.attach({ uid: ticket.uid, bytes: new Uint8Array([1, 2, 3]), filename: 'x.png' }),
    ).rejects.toThrow(/may only attach to a ticket it created/)
  })
})
