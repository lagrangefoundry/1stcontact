import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { resetChatHost, route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import type { Scope } from '../apps/control-app/src/scope'
import { adoptCapture } from '../apps/control-app/src/capture-material'
import { r2ReferenceStore } from '../tools/generate/src/store/r2-reference-store'
import { SCREENSHOT_MEMBER, bundleNameFor } from '../tools/generate/src/store/reference-store'
import { writeBundle } from '../tools/generate/src/cli/capture/bundle'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { decodePng, encodePng } from '../tools/generate/src/cli/png'
import type { Raster } from '../tools/generate/src/cli/perceptual-core'
import { applySchema, ensureTenant } from './support/d1-site-factory'
import { siteSeed } from './support/site-seed'
import { syntheticCapture } from './support/reference-fixtures'
import { calls, says, scriptedClient, systemText } from './support/scripted-model-client'
import type { ModelStep, ScriptedClient } from './support/scripted-model-client'

/**
 * story-ed976856 — **an edit is a revisable recipe over a kept original, applied
 * by one renderer, and editable by the assistant** ([[REQ-219]]).
 *
 * WHERE THESE ARE DRIVEN FROM. Every claim enters through a boundary the product
 * actually exposes: the Worker's own route table (`route()`), and the assistant's
 * session — `POST /api/ai/session` then `POST /api/ai/prompt` — with the model
 * scripted to call `edit_image`, `list_image_edits` or `screenshot`. D1, R2 and
 * the Images binding are the real local ones inside workerd.
 *
 * THE DOUBLES, and why each is at an external boundary:
 *  - the Anthropic client (the network);
 *  - a RECORDING WRAPPER around the real Images binding. It forwards every call
 *    to the real binding and writes down the transform steps it was handed. This
 *    is how the story's evidence limit is honoured: Miniflare's binding honours
 *    `rotate`, `width` and `height` and silently drops trim and colour, so a crop
 *    is asserted as the chain the renderer received, never as pixels.
 *  - a throwing binding and a conversion-only binding, which are deployments the
 *    story names and Miniflare cannot be made to be.
 *  - a browser launcher that is never launched: a stored PNG is looked at without
 *    a browser, but the looking surface is only composed where one exists.
 */

const APPLIED = applySchema()
const ORIGIN = 'https://app.test'
const scopeOf = (businessId: string): Scope => ({ businessId })

// ── fixtures ────────────────────────────────────────────────────────────────

/** A solid picture with one bright corner, so a turn is not only a change of size. */
function raster(width: number, height: number): Raster {
  const data = new Uint8Array(width * height * 3)
  for (let i = 0; i < width * height; i++) {
    data[i * 3] = 40
    data[i * 3 + 1] = 90
    data[i * 3 + 2] = 160
  }
  data[0] = 250
  data[1] = 250
  data[2] = 250
  return { data, width, height, channels: 3 }
}

async function png(width: number, height: number): Promise<Uint8Array> {
  return encodePng(raster(width, height))
}

/** A real JPEG, encoded by the real binding from a real PNG. */
async function jpeg(width: number, height: number): Promise<Uint8Array> {
  const images = env.IMAGES as ImagesBinding
  const source = new Blob([(await png(width, height)) as unknown as ArrayBuffer]).stream()
  const out = await images.input(source).output({ format: 'image/jpeg' })
  return new Uint8Array(await new Response(out.image()).arrayBuffer())
}

const SVG = new TextEncoder().encode(
  '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>',
)
/** A one-pixel GIF89a. */
const GIF = Uint8Array.from(
  atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'),
  (c) => c.charCodeAt(0),
)

function base64(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}

// ── the Images binding, real and doubled ────────────────────────────────────

interface Recorded {
  binding: ImagesBinding
  /** One entry per transform chain the renderer ran, holding its steps in order. */
  chains: unknown[][]
}

/** The REAL binding, with every chain it is asked to run written down. */
function recording(): Recorded {
  const real = env.IMAGES as ImagesBinding
  const chains: unknown[][] = []
  const binding = {
    info: (stream: ReadableStream<Uint8Array>) => real.info(stream),
    input(stream: ReadableStream<Uint8Array>) {
      const steps: unknown[] = []
      chains.push(steps)
      let inner = real.input(stream)
      const chain = {
        transform(t: ImageTransform) {
          steps.push(t)
          inner = inner.transform(t)
          return chain
        },
        output(o: ImageOutputOptions) {
          return inner.output(o)
        },
      }
      return chain
    },
  }
  return { binding: binding as unknown as ImagesBinding, chains }
}

/** A binding that can measure but whose every transform fails. */
function throwing(): Recorded {
  const real = env.IMAGES as ImagesBinding
  const chains: unknown[][] = []
  const binding = {
    info: (stream: ReadableStream<Uint8Array>) => real.info(stream),
    input() {
      const steps: unknown[] = []
      chains.push(steps)
      const chain = {
        transform(t: ImageTransform) {
          steps.push(t)
          return chain
        },
        async output() {
          throw new Error('the renderer fell over')
        },
      }
      return chain
    },
  }
  return { binding: binding as unknown as ImagesBinding, chains }
}

/** A binding that converts (the HEIC path's half) and cannot measure or transform. */
function conversionOnly(): ImagesBinding {
  const real = env.IMAGES as ImagesBinding
  return { input: (stream: ReadableStream<Uint8Array>) => real.input(stream) } as unknown as ImagesBinding
}

function routerEnv(over: Partial<RouterEnv> = {}): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    IMAGES: env.IMAGES as ImagesBinding,
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...over,
  } as RouterEnv
}

// ── a business, its site and its Library ────────────────────────────────────

/** A business with an imported site, optionally carrying site assets. */
async function business(
  id: string,
  assets: { name: string; bytes: Uint8Array }[] = [],
): Promise<{ scope: Scope; slug: string; tickets: TicketStore }> {
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
        assets: assets.map((a) => ({ name: a.name, base64: base64(a.bytes) })),
      }),
    }),
    routerEnv(),
    scope,
    {},
  )
  expect(imported.status).toBe(200)
  const tickets = await ticketStoreFor(
    { DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket },
    scope,
  )
  return { scope, slug: seed.slug, tickets }
}

/** One picture in the client's Library, recorded the way ingestion records one. */
async function libraryPicture(
  tickets: TicketStore,
  bytes: Uint8Array,
  opts: { filename?: string; contentType?: string; title?: string } = {},
): Promise<string> {
  const filename = opts.filename ?? 'shopfront.png'
  const contentType = opts.contentType ?? 'image/png'
  const { ticket } = await tickets.create({
    type: 'material',
    title: opts.title ?? 'A wide shopfront at dusk',
    body: 'A photograph of a shopfront.',
    fields: {
      kind: 'image',
      rights: 'owned',
      republishable: true,
      exportable: false,
      origin: 'uploaded',
      role: 'site',
      filename,
      content_type: contentType,
    },
  })
  await tickets.attach({ uid: ticket.uid, bytes, filename, content_type: contentType })
  return ticket.uid
}

/** `GET /api/material/file` through the route table. */
async function materialFile(
  scope: Scope,
  query: string,
  envOver: Partial<RouterEnv> = {},
): Promise<{ status: number; bytes: Uint8Array; type: string; disposition: string }> {
  const res = await route(
    new Request(`${ORIGIN}/api/material/file?${query}`),
    routerEnv(envOver),
    scope,
    {},
  )
  return {
    status: res.status,
    type: res.headers.get('content-type') ?? '',
    disposition: res.headers.get('content-disposition') ?? '',
    bytes: new Uint8Array(await res.arrayBuffer()),
  }
}

async function widthOf(bytes: Uint8Array): Promise<{ width: number; height: number }> {
  const decoded = await decodePng(bytes, 'served')
  return { width: decoded.width, height: decoded.height }
}

// ── the assistant ───────────────────────────────────────────────────────────

/** A tool call with a call id of its own, so several can share one turn. */
function call(n: number, name: string, input: Record<string, unknown>): ModelStep {
  return (req) =>
    (calls(name, input)(req) as Record<string, unknown>[]).map((event) =>
      event.content_block && (event.content_block as Record<string, unknown>).type === 'tool_use'
        ? { ...event, content_block: { ...(event.content_block as object), id: `call-${n}-${name}` } }
        : event,
    )
}

/** Open a session and take one turn in which the model makes `tools` in order. */
async function assistant(
  scope: Scope,
  slug: string,
  tools: [string, Record<string, unknown>][],
  envOver: Partial<RouterEnv> = {},
  deps: RouterDeps = {},
): Promise<{ client: ScriptedClient; results: string[] }> {
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
  const { sessionId } = (await opened.json()) as { sessionId: string }
  const client = scriptedClient([...tools.map(([name, input], i) => call(i, name, input)), says('Done.')])
  setModelClient(client)
  const streamed = await route(
    new Request(`${ORIGIN}/api/ai/prompt`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId, text: 'Please sort out that photograph.' }),
    }),
    workerEnv,
    scope,
    deps,
  )
  expect(streamed.status).toBe(200)
  await streamed.text()
  const results: string[] = []
  const last = client.seen[client.seen.length - 1]
  for (const message of last.messages) {
    if (!Array.isArray(message.content)) continue
    for (const block of message.content as Record<string, unknown>[]) {
      if (block.type !== 'tool_result') continue
      const content = block.content
      results.push(
        typeof content === 'string'
          ? content
          : Array.isArray(content)
            ? (content as Record<string, unknown>[])
                .map((b) => (typeof b.text === 'string' ? b.text : JSON.stringify(b)))
                .join('\n')
            : JSON.stringify(content),
      )
    }
  }
  expect(results).toHaveLength(tools.length)
  return { client, results }
}

/** The object a successful image operation answered with. */
function answer(result: string): Record<string, unknown> {
  const start = result.indexOf('{')
  const end = result.lastIndexOf('}')
  if (start < 0 || end < start) throw new Error(`not an answer: ${result.slice(0, 400)}`)
  return JSON.parse(result.slice(start, end + 1)) as Record<string, unknown>
}

/** What `list_image_edits` currently says, for a picture, through the assistant. */
async function recipeOf(scope: Scope, slug: string, image: string): Promise<unknown> {
  const { results } = await assistant(scope, slug, [['list_image_edits', { image }]])
  return answer(results[0]).edits
}

beforeAll(async () => {
  await APPLIED
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

// ── AC-2540 ─────────────────────────────────────────────────────────────────

describe('story-ed976856 — edit_image stores a recipe and keeps the original', () => {
  it('test_UAT_AC2540_edit_image_stores_the_recipe_reports_image_edits_original_size_and_leaves_the_bytes', async () => {
    const { scope, slug, tickets } = await business('ac2540')
    const source = await png(1000, 500)
    const uid = await libraryPicture(tickets, source)
    const edits = [
      { op: 'crop', left: 0.1, top: 0, right: 0.1, bottom: 0 },
      { op: 'rotate', degrees: 90 },
    ]

    const { results } = await assistant(scope, slug, [
      ['edit_image', { image: uid, edits }],
      ['list_image_edits', { image: uid }],
    ])

    const edited = answer(results[0])
    expect(edited.image).toBe(uid)
    expect(edited.edits).toEqual(edits)
    expect(edited.original).toEqual({ width: 1000, height: 500 })
    // 800×500 after the crop, turned a quarter.
    expect(edited.size).toEqual({ width: 500, height: 800 })

    expect(answer(results[1]).edits).toEqual(edits)

    const original = await materialFile(scope, `uid=${uid}&original=1`)
    expect(original.status).toBe(200)
    expect(original.bytes).toEqual(source)
  })
})

// ── AC-2541 ─────────────────────────────────────────────────────────────────

describe('story-ed976856 — list_image_edits answers in the edit_image shape', () => {
  it('test_UAT_AC2541_an_unedited_picture_lists_no_edits_and_its_size_is_its_original', async () => {
    const { scope, slug, tickets } = await business('ac2541')
    const uid = await libraryPicture(tickets, await png(1000, 500))
    const edits = [{ op: 'resize', width: 250 }]

    const { results } = await assistant(scope, slug, [
      ['list_image_edits', { image: uid }],
      ['edit_image', { image: uid, edits }],
      ['list_image_edits', { image: uid }],
    ])

    const fresh = answer(results[0])
    expect(Object.keys(fresh)).toEqual(expect.arrayContaining(['image', 'edits', 'original', 'size']))
    expect(fresh.image).toBe(uid)
    expect(fresh.edits).toEqual([])
    expect(fresh.original).toEqual({ width: 1000, height: 500 })
    expect(fresh.size).toEqual(fresh.original)

    const after = answer(results[2])
    expect(after.edits).toEqual(edits)
    expect(after.size).toEqual({ width: 250, height: 125 })
  })
})

// ── AC-2542 ─────────────────────────────────────────────────────────────────

describe('story-ed976856 — a call replaces the recipe whole', () => {
  it('test_UAT_AC2542_omitted_operations_are_removed_an_empty_list_restores_and_no_list_is_refused', async () => {
    const { scope, slug, tickets } = await business('ac2542')
    const source = await png(400, 200)
    const uid = await libraryPicture(tickets, source)
    const crop = { op: 'crop', left: 0.25, top: 0, right: 0, bottom: 0 }
    const rotate = { op: 'rotate', degrees: 90 }

    const { results } = await assistant(scope, slug, [
      ['edit_image', { image: uid, edits: [crop, rotate] }],
      ['edit_image', { image: uid, edits: [rotate] }],
      ['list_image_edits', { image: uid }],
    ])
    expect(answer(results[0]).edits).toEqual([crop, rotate])
    // Only the rotate survives: what was left out is gone.
    expect(answer(results[2]).edits).toEqual([rotate])

    // An omitted list, and a null one, are refused and change nothing.
    const missing = await assistant(scope, slug, [
      ['edit_image', { image: uid }],
      ['edit_image', { image: uid, edits: null }],
    ])
    // AT THE ASSISTANT'S BOUNDARY the declaration's `required: true` is what
    // answers first: the call is refused before the operation runs, with a
    // reason that names the list that was not given. (The operation's own
    // "no list of edits was given" refusal sits behind it for any caller that
    // bypasses the declaration.)
    for (const refusal of missing.results) {
      expect(refusal).toMatch(/^Error: /)
      expect(refusal).toMatch(/edit_image requires parameter 'edits'/)
      expect(refusal).not.toContain('"size"')
    }
    expect(await recipeOf(scope, slug, uid)).toEqual([rotate])

    // `[]` is the picture exactly as it was stored.
    const cleared = await assistant(scope, slug, [['edit_image', { image: uid, edits: [] }]])
    expect(answer(cleared.results[0]).edits).toEqual([])
    expect(await recipeOf(scope, slug, uid)).toEqual([])
    const served = await materialFile(scope, `uid=${uid}`)
    expect(served.status).toBe(200)
    expect(served.bytes).toEqual(source)
  })
})

// ── AC-2543 ─────────────────────────────────────────────────────────────────

describe('story-ed976856 — operations apply in the order written', () => {
  it('test_UAT_AC2543_each_operation_is_one_renderer_step_in_order_measured_against_what_came_before', async () => {
    const { scope, slug, tickets } = await business('ac2543')
    const uid = await libraryPicture(tickets, await png(1000, 500))
    const rotateThenCrop = [
      { op: 'rotate', degrees: 90 },
      { op: 'crop', left: 0, top: 0.25, right: 0, bottom: 0.25 },
    ]
    const cropThenRotate = [rotateThenCrop[1], rotateThenCrop[0]]

    const { results } = await assistant(scope, slug, [
      ['edit_image', { image: uid, edits: rotateThenCrop }],
      ['edit_image', { image: uid, edits: cropThenRotate }],
      ['edit_image', { image: uid, edits: [{ op: 'resize', width: 250 }] }],
      ['edit_image', { image: uid, edits: [{ op: 'adjust', brightness: 1.2 }] }],
      ['edit_image', { image: uid, edits: rotateThenCrop }],
    ])
    // Rotate first: 500×1000, then a quarter off top and bottom of THAT.
    expect(answer(results[0]).size).toEqual({ width: 500, height: 500 })
    // The same two operations reordered give what the order dictates.
    expect(answer(results[1]).size).toEqual({ width: 250, height: 1000 })
    // A resize keeps the aspect ratio; an adjust keeps the dimensions.
    expect(answer(results[2]).size).toEqual({ width: 250, height: 125 })
    expect(answer(results[3]).size).toEqual({ width: 1000, height: 500 })

    // The renderer is handed one step per operation, in recipe order.
    const recorder = recording()
    const served = await materialFile(scope, `uid=${uid}`, { IMAGES: recorder.binding })
    expect(served.status).toBe(200)
    expect(recorder.chains).toHaveLength(1)
    expect(recorder.chains[0]).toEqual([
      { rotate: 90 },
      { trim: { left: 0, top: 250, width: 500, height: 500 } },
    ])
  })
})

// ── AC-2544 ─────────────────────────────────────────────────────────────────

describe('story-ed976856 — a malformed recipe is refused with its reason', () => {
  /**
   * Each malformed recipe, and the phrase its refusal must carry.
   *
   * TWO OF THEM NEVER REACH THE OPERATION. A recipe that is not a list, and an
   * entry that is not an object, are refused by the surface's declared
   * parameter type (`recipe`: an array of objects) before `edit_image` runs —
   * so at this boundary they are refused naming the mistake, but under the
   * framework's parameter error rather than the operation's REFUSED code. They
   * are marked `declared` here so that difference is asserted, not hidden.
   */
  const MALFORMED: [string, unknown, RegExp, 'declared'?][] = [
    ['an unknown operation', [{ op: 'sharpen', amount: 2 }], /'sharpen', which is not something a picture can be edited by/],
    ['flip', [{ op: 'flip', direction: 'h' }], /'flip'[\s\S]*The whole vocabulary is crop, rotate, resize, adjust/],
    ['an entry that is not an object', [5], /'edits' entry 0 must be an object/, 'declared'],
    ['a recipe that is not a list', 'crop the top', /'edits' must be an array/, 'declared'],
    ['a negative inset', [{ op: 'crop', left: -0.1 }], /cannot reach outside the picture/],
    ['an inset above 1', [{ op: 'crop', top: 120 }], /fractions of the picture and not in pixels/],
    ['left and right that leave nothing', [{ op: 'crop', left: 0.6, right: 0.5 }], /nothing left/],
    ['top and bottom that leave nothing', [{ op: 'crop', top: 0.5, bottom: 0.5 }], /nothing left/],
    ['a crop that trims nothing', [{ op: 'crop', left: 0 }], /no side trimmed/],
    ['a rotate off the quarters', [{ op: 'rotate', degrees: 45 }], /turns in quarters/],
    ['a resize naming no size', [{ op: 'resize' }], /names no size/],
    ['a resize of a fraction of a pixel', [{ op: 'resize', width: 10.5 }], /whole number of pixels/],
    ['a resize below one pixel', [{ op: 'resize', width: 0 }], /whole number of pixels/],
    ['an adjust naming nothing', [{ op: 'adjust' }], /adjusts nothing/],
    ['an adjust past 10', [{ op: 'adjust', brightness: 120 }], /1 is the picture unchanged/],
    ['an adjust below 0', [{ op: 'adjust', contrast: -1 }], /1 is the picture unchanged/],
    ['a parameter that is not a number', [{ op: 'rotate', degrees: '90' }], /must be a number/],
  ]

  it('test_UAT_AC2544_each_malformed_recipe_is_refused_naming_the_mistake_and_the_recipe_is_unchanged', async () => {
    const { scope, slug, tickets } = await business('ac2544')
    const uid = await libraryPicture(tickets, await png(400, 200))
    const known = [{ op: 'rotate', degrees: 180 }]
    await assistant(scope, slug, [['edit_image', { image: uid, edits: known }]])

    const { results } = await assistant(
      scope,
      slug,
      MALFORMED.map(([, edits]) => ['edit_image', { image: uid, edits }] as [string, Record<string, unknown>]),
    )
    results.forEach((result, i) => {
      const [label, , phrase, declared] = MALFORMED[i]
      expect(result, label).toMatch(/^Error: /)
      expect(result, label).toMatch(phrase)
      if (!declared) expect(result, label).toContain('edit_image failed (REFUSED)')
      else expect(result, label).not.toContain('(REFUSED)')
      expect(result, label).not.toContain('"size"')
    })
    expect(await recipeOf(scope, slug, uid)).toEqual(known)

    // Greyscale is a real wish and is accepted.
    const grey = await assistant(scope, slug, [
      ['edit_image', { image: uid, edits: [{ op: 'adjust', saturation: 0 }] }],
    ])
    expect(answer(grey.results[0]).edits).toEqual([{ op: 'adjust', saturation: 0 }])
  })
})

// ── AC-2545 ─────────────────────────────────────────────────────────────────

describe('story-ed976856 — a recipe impossible for these pixels is refused before any write', () => {
  it('test_UAT_AC2545_an_enlarging_resize_and_a_sub_pixel_crop_are_refused_and_nothing_is_written', async () => {
    const { scope, slug, tickets } = await business('ac2545')
    const wide = await libraryPicture(tickets, await png(1000, 500), { filename: 'wide.png', title: 'Wide' })
    const tiny = await libraryPicture(tickets, await png(3, 3), { filename: 'tiny.png', title: 'Tiny' })
    const prior = [{ op: 'rotate', degrees: 180 }]

    const { results } = await assistant(scope, slug, [
      ['edit_image', { image: wide, edits: prior }],
      ['edit_image', { image: tiny, edits: prior }],
      ['edit_image', { image: wide, edits: [{ op: 'resize', width: 1200 }] }],
      [
        'edit_image',
        { image: wide, edits: [{ op: 'crop', left: 0.5 }, { op: 'resize', width: 800 }] },
      ],
      ['edit_image', { image: tiny, edits: [{ op: 'crop', left: 0.2, right: 0.6 }] }],
    ])

    // The message gives both the size asked for and the size it is.
    expect(results[2]).toMatch(/1200/)
    expect(results[2]).toMatch(/1000 wide/)
    expect(results[2]).toMatch(/cannot be made larger/)
    // 500 wide once the crop has run, not the 1000 it started as.
    expect(results[3]).toMatch(/800/)
    expect(results[3]).toMatch(/500 wide/)
    // Legal fractions that leave less than a pixel of a 3×3 picture.
    expect(results[4]).toMatch(/which is nothing/)
    for (const refused of results.slice(2)) {
      expect(refused).toContain('edit_image failed (REFUSED)')
      expect(refused).not.toContain('"size"')
    }

    expect(await recipeOf(scope, slug, wide)).toEqual(prior)
    expect(await recipeOf(scope, slug, tiny)).toEqual(prior)

    const fits = await assistant(scope, slug, [
      [
        'edit_image',
        { image: wide, edits: [{ op: 'crop', left: 0.5 }, { op: 'resize', width: 400 }] },
      ],
    ])
    expect(answer(fits.results[0]).size).toEqual({ width: 400, height: 400 })
  })
})

// ── AC-2546 ─────────────────────────────────────────────────────────────────

describe('story-ed976856 — pictures are named in the one picture vocabulary', () => {
  it('test_UAT_AC2546_unknown_ambiguous_site_asset_and_non_raster_pictures_are_refused_with_distinct_codes', async () => {
    const logo = await png(20, 20)
    const { scope, slug, tickets } = await business('ac2546', [
      { name: 'logo.png', bytes: logo },
      { name: 'banner.png', bytes: await png(30, 10) },
    ])
    const uid = await libraryPicture(tickets, await png(400, 200), {
      filename: 'shopfront.png',
      title: 'A wide shopfront at dusk',
    })
    // A Library item uploaded under the same filename as a site asset.
    await libraryPicture(tickets, await png(20, 20), { filename: 'logo.png', title: 'Our old logo' })
    const svg = await libraryPicture(tickets, SVG, {
      filename: 'drawing.svg',
      contentType: 'image/svg+xml',
      title: 'A drawing',
    })
    const gif = await libraryPicture(tickets, GIF, {
      filename: 'spinner.gif',
      contentType: 'image/gif',
      title: 'A spinner',
    })
    const recipe = [{ op: 'rotate', degrees: 90 }]

    const { results } = await assistant(scope, slug, [
      ['edit_image', { image: 'the blue one', edits: recipe }],
      ['edit_image', { image: 'logo.png', edits: recipe }],
      ['edit_image', { image: 'banner.png', edits: recipe }],
      ['edit_image', { image: svg, edits: recipe }],
      ['edit_image', { image: gif, edits: recipe }],
    ])
    const [unknown, ambiguous, siteAsset, drawing, animation] = results

    expect(unknown).toContain('edit_image failed (NOT_FOUND)')
    expect(unknown).toMatch(/no stored picture called 'the blue one'/)
    expect(unknown).toContain(uid)
    expect(ambiguous).toContain('edit_image failed (AMBIGUOUS)')
    expect(ambiguous).toMatch(/is the name of 2 pictures/)
    expect(ambiguous).toContain("'logo.png'")
    expect(siteAsset).toContain('edit_image failed (NOT_EDITABLE)')
    expect(siteAsset).toMatch(/nowhere to keep a list of edits/)
    expect(drawing).toContain('edit_image failed (UNREADABLE)')
    expect(drawing).toMatch(/image\/svg\+xml is stored as itself rather than edited/)
    expect(animation).toContain('edit_image failed (UNREADABLE)')
    expect(animation).toMatch(/image\/gif is stored as itself rather than edited/)
    for (const refusal of results) expect(refusal).not.toContain('"size"')

    // Nothing was written on any of the refused pictures.
    for (const name of [svg, gif]) {
      const { ticket } = await tickets.get({ uid: name })
      expect(ticket.fields.edits).toBeUndefined()
    }

    // A real Library picture accepts an edit under every name it answers to.
    const spellings = await assistant(scope, slug, [
      ['edit_image', { image: uid, edits: recipe }],
      ['edit_image', { image: 'shopfront.png', edits: recipe }],
      ['edit_image', { image: 'A wide shopfront at dusk', edits: recipe }],
    ])
    for (const accepted of spellings.results) {
      expect(answer(accepted).image).toBe(uid)
      expect(answer(accepted).edits).toEqual(recipe)
    }
  })
})

// ── AC-2547 ─────────────────────────────────────────────────────────────────

describe('story-ed976856 — the image surface is offered only where pictures can be rendered', () => {
  it('test_UAT_AC2547_a_rendering_deployment_offers_both_groups_and_says_sizes_are_automatic_and_descriptions_describe_the_original', async () => {
    const withRenderer = await business('ac2547-renders')
    const { client } = await assistant(withRenderer.scope, withRenderer.slug, [])
    const offered = client.seen[0].tools.map((t) => t.name)
    expect(offered).toContain('edit_image')
    expect(offered).toContain('list_image_edits')
    const manual = systemText(client.seen[0])
    // Both groups, under the titles the manual gives them: the read group
    // (SeeImageEdits) holds only list_image_edits and says it changes nothing;
    // the write group (EditImages) holds only edit_image.
    const read = manual.indexOf('### What has been done to a picture')
    const write = manual.indexOf('### Changing a picture')
    expect(read).toBeGreaterThan(-1)
    expect(write).toBeGreaterThan(read)
    const readGroup = manual.slice(read, write)
    const writeGroup = manual.slice(write, manual.indexOf('\n# ', write))
    expect(readGroup).toContain('Nothing here changes anything.')
    expect(readGroup).toContain('**list_image_edits**')
    expect(readGroup).not.toContain('edit_image**')
    expect(writeGroup).toContain('**edit_image**')
    expect(writeGroup).not.toContain('list_image_edits')
    // What the overview has to say.
    expect(manual).toMatch(/widths visitors actually need, without anyone being asked/)
    expect(manual).toMatch(/Do not use it to save bandwidth/)
    expect(manual).toMatch(/written description describes the original/)

    // No binding, and a binding that can only convert: no surface at all.
    for (const [id, images] of [
      ['ac2547-nobinding', undefined],
      ['ac2547-convertonly', conversionOnly()],
    ] as const) {
      resetChatHost()
      resetAiHost()
      const deployment = await business(id)
      const without = await assistant(deployment.scope, deployment.slug, [], {
        IMAGES: images,
      } as Partial<RouterEnv>)
      const tools = without.client.seen[0].tools.map((t) => t.name)
      expect(tools, id).not.toContain('edit_image')
      expect(tools, id).not.toContain('list_image_edits')
      const text = systemText(without.client.seen[0])
      expect(text, id).not.toContain('edit_image')
      expect(text, id).not.toContain('list_image_edits')
    }
  })
})

// ── AC-2548 ─────────────────────────────────────────────────────────────────

describe('story-ed976856 — the material file route serves the picture as it stands', () => {
  it('test_UAT_AC2548_edited_by_default_in_its_stored_format_original_on_request_and_unedited_untransformed', async () => {
    const { scope, slug, tickets } = await business('ac2548')
    const source = await png(40, 20)
    const uid = await libraryPicture(tickets, source, { filename: 'shopfront.png' })
    const photo = await jpeg(40, 20)
    const jpg = await libraryPicture(tickets, photo, {
      filename: 'porch.jpg',
      contentType: 'image/jpeg',
      title: 'The porch',
    })
    const untouched = await libraryPicture(tickets, await png(30, 10), {
      filename: 'sign.png',
      title: 'The sign',
    })
    await assistant(scope, slug, [
      ['edit_image', { image: uid, edits: [{ op: 'rotate', degrees: 90 }] }],
      ['edit_image', { image: jpg, edits: [{ op: 'rotate', degrees: 90 }] }],
    ])

    const current = await materialFile(scope, `uid=${uid}`)
    expect(current.status).toBe(200)
    expect(current.type).toBe('image/png')
    expect(current.disposition).toBe('inline; filename="shopfront.png"')
    expect(await widthOf(current.bytes)).toEqual({ width: 20, height: 40 })

    const asJpeg = await materialFile(scope, `uid=${jpg}`)
    expect(asJpeg.status).toBe(200)
    expect(asJpeg.type).toBe('image/jpeg')
    expect(asJpeg.bytes).not.toEqual(photo)

    const original = await materialFile(scope, `uid=${uid}&original=1`)
    expect(original.status).toBe(200)
    expect(original.bytes).toEqual(source)

    const recorder = recording()
    const plain = await materialFile(scope, `uid=${untouched}`, { IMAGES: recorder.binding })
    expect(plain.status).toBe(200)
    expect(plain.bytes).toEqual(await png(30, 10))
    expect(recorder.chains).toEqual([])
  })
})

// ── AC-2549 ─────────────────────────────────────────────────────────────────

describe('story-ed976856 — width= is a delivery size and never an edit', () => {
  it('test_UAT_AC2549_width_scales_down_without_touching_the_recipe_never_enlarges_and_never_renders_a_capture_member', async () => {
    const { scope, slug, tickets } = await business('ac2549')
    const source = await png(1000, 500)
    const uid = await libraryPicture(tickets, source)

    const smaller = await materialFile(scope, `uid=${uid}&width=400`)
    expect(smaller.status).toBe(200)
    expect(await widthOf(smaller.bytes)).toEqual({ width: 400, height: 200 })
    expect(await recipeOf(scope, slug, uid)).toEqual([])

    const larger = await materialFile(scope, `uid=${uid}&width=2000`)
    expect(await widthOf(larger.bytes)).toEqual({ width: 1000, height: 500 })
    for (const junk of ['0', '-5', '12.5', 'wide']) {
      const ignored = await materialFile(scope, `uid=${uid}&width=${junk}`)
      expect(ignored.status, junk).toBe(200)
      expect(ignored.bytes, junk).toEqual(source)
    }

    // A capture's member is served as stored, whatever width is asked for.
    const references = await r2ReferenceStore({
      DB: env.DB as D1Database,
      BLOBS: env.BLOBS as R2Bucket,
    }).forTenant(scope.businessId)
    const capture = { ...syntheticCapture(), url: 'https://example.com/', host: 'example.com', path: '/' }
    const screenshot = await png(800, 400)
    const name = bundleNameFor(capture)
    await writeBundle(references.bundle(name), {
      capture,
      screenshot,
      renderedHtml: '<html><body>hi</body></html>',
      rawHtml: '<html></html>',
      assetBytes: new Map(),
    })
    const adopted = await adoptCapture(tickets, references.bundle(name), {}, {
      describeImage: async () => ({ text: 'A site.\n\nA page.', model: 'stub/vision-1' }),
    })
    const recorder = recording()
    const member = await materialFile(
      scope,
      `uid=${adopted.ticket.uid}&member=${SCREENSHOT_MEMBER}&width=100`,
      { IMAGES: recorder.binding },
    )
    expect(member.status).toBe(200)
    expect(member.bytes).toEqual(screenshot)
    expect(recorder.chains).toEqual([])
  })
})

// ── AC-2550 ─────────────────────────────────────────────────────────────────

describe('story-ed976856 — the stored bytes are served whenever rendering cannot happen', () => {
  it('test_UAT_AC2550_no_usable_renderer_or_a_failed_render_serves_the_stored_bytes_with_200', async () => {
    const { scope, slug, tickets } = await business('ac2550')
    const source = await png(40, 20)
    const uid = await libraryPicture(tickets, source)
    await assistant(scope, slug, [['edit_image', { image: uid, edits: [{ op: 'rotate', degrees: 90 }] }]])

    for (const [label, images] of [
      ['no binding', undefined],
      ['a conversion-only binding', conversionOnly()],
    ] as const) {
      const served = await materialFile(scope, `uid=${uid}`, { IMAGES: images } as Partial<RouterEnv>)
      expect(served.status, label).toBe(200)
      expect(served.bytes, label).toEqual(source)
      expect(served.type, label).toBe('image/png')
    }

    const broken = throwing()
    const failed = await materialFile(scope, `uid=${uid}`, { IMAGES: broken.binding })
    expect(broken.chains.length).toBeGreaterThan(0)
    expect(failed.status).toBe(200)
    expect(failed.bytes).toEqual(source)
    expect(failed.type).toBe('image/png')
  })
})

// ── AC-2551 ─────────────────────────────────────────────────────────────────

describe('story-ed976856 — renditions are content-addressed, per tenant, out of the material keyspace', () => {
  it('test_UAT_AC2551_a_repeat_request_is_not_re_rendered_and_renditions_live_under_their_own_tenant_prefix', async () => {
    const tenant = 'ac2551'
    const { scope, slug, tickets } = await business(tenant)
    const uid = await libraryPicture(tickets, await png(40, 20))
    await assistant(scope, slug, [['edit_image', { image: uid, edits: [{ op: 'rotate', degrees: 90 }] }]])
    const bucket = env.BLOBS as R2Bucket
    const renditions = async () =>
      (await bucket.list({ prefix: `rendition/${tenant}/` })).objects.map((o) => o.key)
    const before = await renditions()

    const recorder = recording()
    const first = await materialFile(scope, `uid=${uid}`, { IMAGES: recorder.binding })
    const second = await materialFile(scope, `uid=${uid}`, { IMAGES: recorder.binding })
    expect(recorder.chains).toHaveLength(1)
    expect(second.bytes).toEqual(first.bytes)

    // A new width, and a new recipe, are new renders.
    await materialFile(scope, `uid=${uid}&width=10`, { IMAGES: recorder.binding })
    expect(recorder.chains).toHaveLength(2)
    await assistant(scope, slug, [['edit_image', { image: uid, edits: [{ op: 'rotate', degrees: 180 }] }]])
    await materialFile(scope, `uid=${uid}`, { IMAGES: recorder.binding })
    expect(recorder.chains).toHaveLength(3)

    const after = await renditions()
    expect(after.length - before.length).toBe(3)
    for (const key of after) {
      expect(key.startsWith(`rendition/${tenant}/`)).toBe(true)
      expect(key.startsWith(`t/${tenant}/`)).toBe(false)
    }
    // The material store's own keyspace — what its orphan sweep lists — holds
    // the picture's blob and no rendition.
    const swept = (await bucket.list({ prefix: `t/${tenant}/` })).objects.map((o) => o.key)
    expect(swept.length).toBeGreaterThan(0)
    for (const key of swept) expect(after).not.toContain(key)
    expect(swept.some((key) => key.includes('rendition'))).toBe(false)

    // Still there, and still answering without a transform.
    const later = await materialFile(scope, `uid=${uid}`, { IMAGES: recorder.binding })
    expect(later.status).toBe(200)
    expect(recorder.chains).toHaveLength(3)
  })
})

// ── AC-2552 ─────────────────────────────────────────────────────────────────

describe('story-ed976856 — the assistant sees a stored picture as it stands', () => {
  /** A browser that is never needed to look at a stored PNG. */
  const noBrowser: RouterDeps = {
    launch: (async () => {
      throw new Error('a stored picture is not photographed in a browser')
    }) as unknown as RouterDeps['launch'],
  }

  /** The image block the model was handed, decoded to bytes. */
  function pictureIn(result: string): Uint8Array {
    const line = result.split('\n').find((l) => l.startsWith('{') && l.includes('"type":"image"'))
    if (!line) throw new Error(`no picture in: ${result.slice(0, 400)}`)
    const image = JSON.parse(line) as { source: { data: string; media_type: string } }
    expect(image.source.media_type).toBe('image/png')
    return Uint8Array.from(atob(image.source.data), (c) => c.charCodeAt(0))
  }

  it('test_UAT_AC2552_the_default_look_is_the_edited_picture_original_true_is_the_stored_bytes_and_no_renderer_means_stored_bytes', async () => {
    const { scope, slug, tickets } = await business('ac2552')
    const source = await png(40, 20)
    const uid = await libraryPicture(tickets, source)
    await assistant(
      scope,
      slug,
      [['edit_image', { image: uid, edits: [{ op: 'rotate', degrees: 90 }] }]],
      {},
      noBrowser,
    )

    const looked = await assistant(
      scope,
      slug,
      [
        ['screenshot', { of: { kind: 'image', image: uid } }],
        ['screenshot', { of: { kind: 'image', image: uid, original: true } }],
      ],
      {},
      noBrowser,
    )
    expect(await widthOf(pictureIn(looked.results[0]))).toEqual({ width: 20, height: 40 })
    expect(looked.results[0]).not.toContain('as originally stored')
    expect(looked.results[1]).toContain('as originally stored')
    const original = pictureIn(looked.results[1])
    expect(await widthOf(original)).toEqual({ width: 40, height: 20 })
    expect(original).toEqual(source)

    // A deployment with no renderer shows the stored bytes either way.
    resetChatHost()
    resetAiHost()
    const blind = await assistant(
      scope,
      slug,
      [
        ['screenshot', { of: { kind: 'image', image: uid } }],
        ['screenshot', { of: { kind: 'image', image: uid, original: true } }],
      ],
      { IMAGES: undefined } as Partial<RouterEnv>,
      noBrowser,
    )
    expect(pictureIn(blind.results[0])).toEqual(source)
    expect(pictureIn(blind.results[1])).toEqual(source)
  })
})
