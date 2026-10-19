import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import { resetChatHost, route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import type { Scope } from '../apps/control-app/src/scope'
import type { JunctionNamespace } from '../apps/control-app/src/junctions'
import type { JunctionSlice } from '../apps/control-app/src/junction-do'
import { ROW_MAX_BYTES } from '../apps/control-app/src/junction-do'
import { encodePng } from '../tools/generate/src/cli/png'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { applySchema, ensureTenant } from './support/d1-site-factory'
import { siteSeed } from './support/site-seed'
import { fakeBrowser } from './support/fake-puppeteer'
import { calls, says, scriptedClient, type ScriptedClient } from './support/scripted-model-client'

/**
 * [[BUG-229]] — **the junction keeps no image bytes, so its two copies cannot
 * disagree about where anything is.**
 *
 * WHAT WAS WRONG. A `screenshot` of a Library picture put a 2.4 MB record on the
 * junction. The Durable Object refused it (`SQLITE_TOOBIG`) and accepted every
 * record after it, so the object's stream had a hole the isolate's mirror did
 * not. The archive watermark was counted in the mirror and stored in the object,
 * 2.46 MB past the object's real archived boundary: two turns then "saved" by
 * reading nothing, and every turn after that failed parsing half an image.
 *
 * WHAT IS PROVED, through the Worker's own routes over a real D1, real R2, the
 * real Durable Object and the real `IMAGES` renderer (miniflare's `sharp`). The
 * model and the browser are the two doubles, both genuinely external:
 *
 *  1. A Library picture over 2 MB is stored as its Library reference, a record
 *     of a few hundred bytes, and the turn and the next one are archived.
 *  2. A picture of a draft page is stored as its placeholder only.
 *  3. The object accepts a record over its row ceiling whole, with no hole.
 *  4. A watermark poisoned the way Bob's salon 2's was is put back where the
 *     archive stopped, and the turns since are folded.
 *  5. Where that point cannot be found, a turn that was not saved is logged and
 *     the client is told, never silent.
 *  6. Low detail is genuinely low: JPEG, 768 px longest edge at most.
 */

const APPLIED = applySchema()
const ORIGIN = 'https://app.test'
const DECODER = new TextDecoder()

/** The library is untyped at this boundary, and the boundary is named here. */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

const objects = (): JunctionNamespace => (env as Untyped).SESSION_JUNCTION as JunctionNamespace

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    IMAGES: (env as Untyped).IMAGES,
    SESSION_JUNCTION: objects(),
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as RouterEnv
}

/**
 * A PNG of incompressible noise, so its size is its pixel count: 900×900 RGB is
 * about 2.4 MB, the size of the picture that broke Bob's salon 2. Seeded, so
 * every run is the same picture.
 */
async function noisePng(width: number, height: number): Promise<Uint8Array> {
  const data = new Uint8Array(width * height * 3)
  let state = 0x2290229
  for (let i = 0; i < data.length; i++) {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0
    data[i] = state >>> 24
  }
  return encodePng({ data, width, height, channels: 3 })
}

const base64Of = (bytes: Uint8Array): string => {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

/** A business with one site, carrying `assets` as its site images. */
async function business(
  id: string,
  assets: { name: string; base64: string }[] = [],
): Promise<{ scope: Scope; slug: string }> {
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
        assets,
      }),
    }),
    routerEnv(),
    scope,
    {},
  )
  expect(imported.status).toBe(200)
  return { scope, slug: ((await imported.json()) as { site: string }).site }
}

async function open(scope: Scope, slug: string, deps: RouterDeps): Promise<Untyped> {
  const opened = await route(
    new Request(`${ORIGIN}/api/ai/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ site: slug }),
    }),
    routerEnv(),
    scope,
    deps,
  )
  expect(opened.status).toBe(200)
  return opened.json()
}

/** One scripted turn through the Worker's own route; the stream read to its end. */
async function turn(
  scope: Scope,
  sessionId: string,
  text: string,
  script: Parameters<typeof scriptedClient>[0],
  deps: RouterDeps,
): Promise<{ client: ScriptedClient; frames: { kind: string; content?: string }[] }> {
  const client = scriptedClient(script)
  setModelClient(client)
  const streamed = await route(
    new Request(`${ORIGIN}/api/ai/prompt`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId, text }),
    }),
    routerEnv(),
    scope,
    deps,
  )
  expect(streamed.status).toBe(200)
  const frames = (await streamed.text())
    .split('\n\n')
    .map((f) => f.trim())
    .filter((f) => f.startsWith('data:'))
    .map((f) => JSON.parse(f.slice(5).trim()) as { kind: string; content?: string })
  return { client, frames }
}

/** The object's state, read through the real binding. */
async function slice(sessionId: string): Promise<JunctionSlice> {
  const ns = objects()
  return ns.get(ns.idFromName(sessionId)).since(0, 0)
}

/** The object once `needle` is in it — the write-behind window, waited out. */
async function durableOnce(sessionId: string, needle: string): Promise<JunctionSlice> {
  for (let attempt = 0; attempt < 400; attempt++) {
    const s = await slice(sessionId)
    if (DECODER.decode(new Uint8Array(s.bytes)).includes(needle)) return s
    await new Promise((resolve) => setTimeout(resolve, 5))
  }
  throw new Error(`${needle} never reached the junction for ${sessionId}`)
}

const cursorOf = (s: JunctionSlice): number => Number(JSON.parse(s.meta ?? '{}').cursor ?? 0)

/** The two archive artifacts on the session's chat ticket. */
async function archived(scope: Scope, sessionId: string): Promise<{ chat: string; tools: string }> {
  const store = await ticketStoreFor(
    { DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket },
    { businessId: scope.businessId },
  )
  const { tickets } = await store.query({ predicate: 'type=chat', limit: 'all' })
  const chat = tickets.find((t) => (t.fields ?? {}).session_id === sessionId)
  if (!chat) return { chat: '', tools: '' }
  const { comments } = await store.comments({ uid: chat.uid })
  const of = (kind: string): string =>
    comments
      .filter((c) => (c.fields ?? {}).kind === kind)
      .map((c) => c.body ?? '')
      .join('\n')
  return { chat: of('chat_transcript'), tools: of('tool_transcript') }
}

/**
 * The Library item an imported picture became. An import files each site image
 * as material too, so the file name names two pictures and the uid names one.
 */
async function libraryItem(scope: Scope): Promise<string> {
  const store = await ticketStoreFor(
    { DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket },
    { businessId: scope.businessId },
  )
  const { tickets } = await store.query({ predicate: 'type=material', limit: 'all' })
  expect(tickets).toHaveLength(1)
  return tickets[0].uid
}

/** The tool record a call left in the object, as the bytes it is stored as. */
function toolRecord(s: JunctionSlice, name: string): string {
  const line = DECODER.decode(new Uint8Array(s.bytes))
    .split('\n')
    .find((l) => l.includes('"kind":"tool"') && l.includes(`"name":"${name}"`))
  expect(line).toBeDefined()
  return line!
}

/** The picture the model was handed in the request after the tool ran. */
function sentImage(client: ScriptedClient): { media_type: string; data: string } {
  const result = client.seen[1].messages
    .filter((m) => m.role === 'user')
    .flatMap((m) => (Array.isArray(m.content) ? (m.content as Untyped[]) : []))
    .find((b) => b.type === 'tool_result')
  expect(result.content, JSON.stringify(result.content).slice(0, 400)).toBeInstanceOf(Array)
  const image = (result.content as Untyped[]).find((b) => b.type === 'image')
  expect(image).toBeDefined()
  return image.source
}

/** The isolate going away: its mirror, its manager and its syncers with it. */
function isolateReplaced(): void {
  resetAiHost()
  resetChatHost()
}

/** A JPEG's pixel size, off its first start-of-frame marker. */
function jpegSize(bytes: Uint8Array): { width: number; height: number } {
  expect([bytes[0], bytes[1]]).toEqual([0xff, 0xd8])
  let at = 2
  while (at < bytes.length) {
    const marker = bytes[at + 1]
    const length = (bytes[at + 2] << 8) | bytes[at + 3]
    if (marker >= 0xc0 && marker <= 0xc2) {
      return { height: (bytes[at + 5] << 8) | bytes[at + 6], width: (bytes[at + 7] << 8) | bytes[at + 8] }
    }
    at += 2 + length
  }
  throw new Error('no start-of-frame marker')
}

const bytesOf = (b64: string): Uint8Array => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))

beforeAll(async () => {
  await APPLIED
})

afterEach(() => {
  setModelClient(null)
  isolateReplaced()
  vi.restoreAllMocks()
})

describe('BUG-229 — the junction keeps no image bytes', () => {
  it('test_UAT_FC_BUG-229_a_library_image_over_2mb_is_stored_as_its_library_reference', async () => {
    const big = await noisePng(900, 900)
    expect(big.length).toBeGreaterThan(2 * 1024 * 1024)
    const { scope, slug } = await business('bug229-library', [
      { name: 'big.png', base64: base64Of(big) },
    ])
    const deps: RouterDeps = { launch: fakeBrowser().launch }
    const item = await libraryItem(scope)
    const { sessionId } = await open(scope, slug, deps)

    const looked = await turn(
      scope,
      sessionId,
      'Look at the big picture.',
      [calls('screenshot', { of: { kind: 'image', image: item } }), says('A noisy one.')],
      deps,
    )
    expect(looked.frames.at(-1)?.kind).toBe('done')
    // THE LIVE TURN STILL SAW THE PICTURE: the rewrite is the stored copy only.
    expect(sentImage(looked.client).data.length).toBeGreaterThan(2 * 1024 * 1024)

    const stored = await durableOnce(sessionId, 'A noisy one.')
    const record = toolRecord(stored, 'screenshot')
    // A FEW HUNDRED BYTES, naming the Library item — not 3.2 MB of base64.
    expect(record.length).toBeLessThan(2000)
    expect(record).not.toContain('"base64"')
    expect(record).toContain(`[image: Library image ${item}, image/png,`)
    // THE WATERMARK IS A RECORD BOUNDARY OF THE OBJECT'S OWN STREAM: counted in
    // the mirror, stored in the object, and the same number in both.
    const text = DECODER.decode(new Uint8Array(stored.bytes))
    expect(cursorOf(stored)).toBe(stored.size)
    expect(text.endsWith('\n')).toBe(true)

    // AND THE NEXT TURN IS ARCHIVED TOO, from a fresh isolate, which is the turn
    // that went missing on Bob's salon 2.
    isolateReplaced()
    await turn(scope, sessionId, 'And then?', [says('Then this.')], deps)
    await durableOnce(sessionId, 'Then this.')
    const archive = await archived(scope, sessionId)
    expect(archive.chat).toContain('Look at the big picture.')
    expect(archive.chat).toContain('A noisy one.')
    expect(archive.chat).toContain('Then this.')
    expect(archive.tools).toContain(`Library image ${item}`)
  })

  it('test_UAT_FC_BUG-229_a_draft_page_screenshot_is_stored_as_its_placeholder_only', async () => {
    const { scope, slug } = await business('bug229-draft')
    const deps: RouterDeps = { launch: fakeBrowser({ png: await noisePng(1280, 800) }).launch }
    const { sessionId } = await open(scope, slug, deps)

    const looked = await turn(
      scope,
      sessionId,
      'How does the draft look?',
      [calls('screenshot', { of: { kind: 'draft' } }), says('Like a draft.')],
      deps,
    )
    expect(sentImage(looked.client).data.length).toBeGreaterThan(0)

    const record = toolRecord(await durableOnce(sessionId, 'Like a draft.'), 'screenshot')
    expect(record).not.toContain('"base64"')
    // The placeholder says what was looked at, from the surface's own note.
    expect(record).toMatch(/\[image: [^\]]*draft[^\]]*tile 1 of [^\]]*bytes, fp:[0-9a-f]+\]/)
  })

  it('test_UAT_FC_BUG-229_a_record_over_the_row_ceiling_is_stored_whole_with_no_hole', async () => {
    const ns = objects()
    const stub = ns.get(ns.idFromName('bug229-oversized'))
    // 2.5 MB: the size of the record that broke Bob's salon 2, over the ~2 MB
    // value ceiling a Durable Object's SQLite refuses.
    const big = `{"seq":1,"kind":"tool","pad":"${'x'.repeat(2_500_000)}"}\n`
    const next = '{"seq":2,"kind":"heartbeat"}\n'
    const end = await stub.append(big)
    await stub.append(next)

    const whole = await stub.since(0, 0)
    expect(whole.size).toBe(big.length + next.length)
    expect(DECODER.decode(new Uint8Array(whole.bytes))).toBe(big + next)
    // THE WRITE'S OWN START IS A BOUNDARY AND NOTHING INSIDE IT IS: a reader at
    // the end of the big record gets the delta; a reader at a row seam inside
    // it is told to take the whole stream.
    const delta = await stub.since(end, whole.epoch)
    expect(delta.at).toBe(end)
    expect(DECODER.decode(new Uint8Array(delta.bytes))).toBe(next)
    expect((await stub.since(ROW_MAX_BYTES, whole.epoch)).at).toBe(0)
  })

  it('test_UAT_FC_BUG-229_a_poisoned_watermark_is_put_back_where_the_archive_stopped', async () => {
    const errors: string[] = []
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args.map(String).join(' '))
    })
    const { scope, slug } = await business('bug229-poisoned')
    const deps: RouterDeps = {}
    const { sessionId } = await open(scope, slug, deps)
    await turn(scope, sessionId, 'First question.', [says('First answer.')], deps)
    const archivedAt = cursorOf(await durableOnce(sessionId, 'First answer.'))
    expect(archivedAt).toBeGreaterThan(0)

    // BOB'S SALON 2, AS IT WAS LEFT: a watermark past every byte the object
    // holds, so a sync reads nothing and returns success, and — once the stream
    // grows past it — reads from the middle of a record.
    const ns = objects()
    const stub = ns.get(ns.idFromName(sessionId))
    const size = (await slice(sessionId)).size
    await stub.writeMeta(JSON.stringify({ cursor: size + 4321 }))
    isolateReplaced()

    await turn(scope, sessionId, 'Second question.', [says('Second answer.')], deps)
    await durableOnce(sessionId, 'Second answer.')
    isolateReplaced()
    await turn(scope, sessionId, 'Third question.', [says('Third answer.')], deps)
    const after = await durableOnce(sessionId, 'Third answer.')

    expect(errors.some((l) => l.includes(`moved to ${archivedAt}`))).toBe(true)
    const archive = await archived(scope, sessionId)
    for (const said of ['First answer.', 'Second question.', 'Second answer.', 'Third answer.']) {
      expect(archive.chat).toContain(said)
    }
    // ONCE EACH: putting the mark back re-folded nothing already archived.
    expect(archive.chat.split('First answer.').length).toBe(2)
    expect(cursorOf(after)).toBe(after.size)
  })

  it('test_UAT_FC_BUG-229_a_turn_that_was_not_saved_is_logged_and_the_client_is_told', async () => {
    const errors: string[] = []
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args.map(String).join(' '))
    })
    // THE ARCHIVE'S STORE, with one outage switch: while it is on, the session's
    // chat ticket cannot be read — the D1 round trip failing, as a real one can,
    // at the moment the watermark is checked. Everything else is the real store.
    let outage = false
    const deps: RouterDeps = {
      tickets: async (e, scope, opts) => {
        const store = await ticketStoreFor(e as RouterEnv, scope, opts)
        return new Proxy(store, {
          get(target, key, receiver) {
            const value = Reflect.get(target, key, receiver)
            if (key !== 'comments' || typeof value !== 'function') return value
            return async (...args: unknown[]) => {
              if (outage) throw new Error('D1_ERROR: the store is unreachable')
              return value.apply(target, args)
            }
          },
        })
      },
    }
    const { scope, slug } = await business('bug229-unsaved')
    const { sessionId } = await open(scope, slug, deps)
    await turn(scope, sessionId, 'First question.', [says('First answer.')], deps)
    const size = (await durableOnce(sessionId, 'First answer.')).size

    // A POISONED MARK, and an archive that cannot say where it stopped. Far
    // past the end, as at 21:04 on Bob's salon 2: the sync reads nothing, folds
    // nothing and returns success — the failure that throws nothing.
    const ns = objects()
    await ns.get(ns.idFromName(sessionId)).writeMeta(JSON.stringify({ cursor: size + 10_000_000 }))
    isolateReplaced()
    outage = true
    const second = await turn(scope, sessionId, 'Second question.', [says('Second answer.')], deps)
    outage = false
    expect(second.frames.at(-1)?.kind).toBe('done')
    await durableOnce(sessionId, 'Second answer.')

    // NOTHING WAS MOVED BY GUESSWORK, and the turn that saved nothing said so —
    // where the old code returned success having read nothing at all.
    expect(errors.some((l) => l.includes('watermark could not be checked'))).toBe(true)
    expect(errors.some((l) => l.includes('did not reach the chat_transcript'))).toBe(true)
    expect((await archived(scope, sessionId)).chat).not.toContain('Second answer.')
    // AND THE CLIENT IS TOLD, through BUG-121's own channel: the next page load
    // reports the turn as one that did not finish.
    isolateReplaced()
    const painted = await open(scope, slug, deps)
    expect(painted.interrupted?.text).toBe('Second question.')
  })

  it('test_UAT_FC_BUG-229_low_detail_is_a_jpeg_at_most_768px_on_its_longest_edge', async () => {
    const { scope, slug } = await business('bug229-low', [
      { name: 'tall.png', base64: base64Of(await noisePng(600, 1000)) },
    ])
    const deps: RouterDeps = { launch: fakeBrowser({ png: await noisePng(1280, 800) }).launch }
    const item = await libraryItem(scope)
    const { sessionId } = await open(scope, slug, deps)

    // A LIBRARY PICTURE, which is the branch that used to ignore `detail`.
    const library = await turn(
      scope,
      sessionId,
      'A quick look at the tall one.',
      [calls('screenshot', { of: { kind: 'image', image: item }, detail: 'low' }), says('Seen.')],
      deps,
    )
    const stored = sentImage(library.client)
    expect(stored.media_type).toBe('image/jpeg')
    const size = jpegSize(bytesOf(stored.data))
    expect(Math.max(size.width, size.height)).toBeLessThanOrEqual(768)

    // AND A DRAFT TILE, the same codec.
    const draft = await turn(
      scope,
      sessionId,
      'A quick look at the draft.',
      [calls('screenshot', { of: { kind: 'draft' }, detail: 'low' }), says('Seen too.')],
      deps,
    )
    const tile = sentImage(draft.client)
    expect(tile.media_type).toBe('image/jpeg')
    expect(jpegSize(bytesOf(tile.data)).width).toBeLessThanOrEqual(768)
  })
})
