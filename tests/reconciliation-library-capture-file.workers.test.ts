import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterEnv } from '../apps/control-app/src/router'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import type { Scope } from '../apps/control-app/src/scope'
import { adoptCapture } from '../apps/control-app/src/capture-material'
import { r2ReferenceStore } from '../tools/generate/src/store/r2-reference-store'
import {
  CAPTURE_MEMBER,
  SCREENSHOT_MEMBER,
  bundleNameFor,
} from '../tools/generate/src/store/reference-store'
import { writeBundle } from '../tools/generate/src/cli/capture/bundle'
import type { CaptureResult } from '../tools/generate/src/cli/capture/types'
import { syntheticCapture } from './support/reference-fixtures'
import { applySchema } from './support/d1-site-factory'

/**
 * story-1500b111 — **the file route, for a capture as well as a single file.**
 *
 * WHAT THIS FILE PROVES. AC-1723 was widened by BUNDLE-34 (REQ-166): the same
 * request that returns an ordinary material's one file may also NAME one member
 * of a capture, and is then answered with that member's own bytes, type and
 * name. The single-file half is proved by `reconciliation-library-surface`; this
 * file proves the member half, and that the single-file answer is unchanged by
 * the parameter's existence.
 *
 * EVERY ANSWER GOES THROUGH `route()` — the Worker's own route table — against
 * real D1 and R2 from `@cloudflare/vitest-pool-workers`. The capture is written
 * by the capture pipeline's own `writeBundle` into the real R2 reference store
 * and adopted by the product's own `adoptCapture`, so the members the route reads
 * are stored exactly as a cloud capture stores them.
 *
 * ONE DOUBLE: the vision describer, a model boundary no claim here is about.
 */

const APPLIED = applySchema()
const TENANT = 'story1500b111-capture-file'

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  }
}

/**
 * The business the case operates on ([[REQ-168]]): it used to ride on the env as
 * `TENANT_ID`, and is now an argument the way a request's identity supplies it.
 */
const scopeOf = (businessId = TENANT): Scope => ({ businessId })

function fileRequest(uid: string, member?: string): Request {
  const base = `https://app.test/api/material/file?uid=${encodeURIComponent(uid)}`
  return new Request(member ? `${base}&member=${encodeURIComponent(member)}` : base)
}

/** A PNG-shaped screenshot; only its bytes are compared. */
function screenshotBytes(): Uint8Array {
  const png = new Uint8Array(48)
  png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0)
  png[8] = 0x2a
  return png
}

function captureResult(): CaptureResult {
  return {
    capture: {
      ...syntheticCapture(),
      url: 'https://capture-file.test/',
      host: 'capture-file.test',
      path: '/',
      title: 'Capture file — a site we looked at',
    },
    screenshot: screenshotBytes(),
    renderedHtml: '<html><body><h1>Rendered</h1></body></html>',
    rawHtml: '<html><body></body></html>',
    assetBytes: new Map([['assets/hero.jpg', new Uint8Array([9, 8, 7, 6])]]),
  }
}

beforeAll(async () => {
  await APPLIED
})

describe('AC-1723 — a capture’s named member comes back as itself, and naming one is never required of a single file', () => {
  it('test_UAT_AC1723_a_named_member_returns_its_own_bytes_type_and_name_and_an_unheld_member_is_refused_by_name', async () => {
    // The ticket store FIRST: it registers the tenant the reference store needs.
    const tickets = await ticketStoreFor(
      { DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket },
      scopeOf(),
    )
    const references = await r2ReferenceStore({
      DB: env.DB as D1Database,
      BLOBS: env.BLOBS as R2Bucket,
    }).forTenant(TENANT)

    const result = captureResult()
    const name = bundleNameFor(result.capture)
    await writeBundle(references.bundle(name), result)
    // The capture.json member as the bundle actually holds it — read back, not
    // re-serialised here, so the comparison is against what was stored.
    const storedJson = await references.bundle(name).read(CAPTURE_MEMBER)
    expect(storedJson).toBeTruthy()

    const adopted = await adoptCapture(tickets, references.bundle(name), {}, {
      describeImage: async () => ({ text: 'A site\n\nWe looked at it.', model: 'stub/vision-1' }),
    })
    const uid = adopted.ticket.uid
    expect(adopted.members.length).toBeGreaterThan(2)

    // THE SCREENSHOT, BY NAME: its own bytes byte-for-byte, an image type, and
    // its own filename on an inline disposition.
    const shot = await route(fileRequest(uid, SCREENSHOT_MEMBER), routerEnv(), scopeOf(), {})
    expect(shot.status).toBe(200)
    expect(new Uint8Array(await shot.arrayBuffer())).toEqual(result.screenshot)
    expect(shot.headers.get('content-type')).toMatch(/^image\//)
    const shotDisposition = shot.headers.get('content-disposition') ?? ''
    expect(shotDisposition).toContain('inline')
    expect(shotDisposition).toContain(SCREENSHOT_MEMBER)

    // THE SAME REQUEST NAMING THE JSON MEMBER answers with the JSON instead —
    // never the screenshot, never whichever record sorts first.
    const json = await route(fileRequest(uid, CAPTURE_MEMBER), routerEnv(), scopeOf(), {})
    expect(json.status).toBe(200)
    const jsonBytes = new Uint8Array(await json.arrayBuffer())
    expect(jsonBytes).toEqual(new Uint8Array(storedJson as Uint8Array))
    expect(jsonBytes).not.toEqual(result.screenshot)
    expect(json.headers.get('content-type')).toMatch(/json/)
    expect(json.headers.get('content-disposition') ?? '').toContain(CAPTURE_MEMBER)

    // A MEMBER THE CAPTURE DOES NOT HOLD is refused with a statement naming the
    // member and the material — no bytes, and no other member in its place.
    const missing = await route(fileRequest(uid, 'screenshot.thumb.png'), routerEnv(), scopeOf(), {})
    expect(missing.status).toBe(400)
    expect(missing.headers.get('content-type') ?? '').toMatch(/json/)
    const refusal = String(((await missing.json()) as Record<string, unknown>).error)
    expect(refusal).toContain('screenshot.thumb.png')
    expect(refusal).toContain(uid)

    // ORDINARY SINGLE-FILE MATERIAL, ASKED WITH NO MEMBER, is answered exactly as
    // before: its one file, its type, its original name — naming a member is
    // never required of it. Stored by the ticket component's own `create` and
    // `attach` — the same two calls ingestion makes — so this claim about the
    // FILE route does not depend on the upload route's describer gate.
    const note = 'opening hours: seven till late'
    const { ticket: single_ } = await tickets.create({
      type: 'material',
      title: 'Opening hours',
      body: 'When the shop is open.',
      fields: {
        kind: 'document',
        rights: 'owned',
        republishable: true,
        exportable: false,
        origin: 'uploaded',
      },
    })
    await tickets.attach({
      uid: single_.uid,
      bytes: new TextEncoder().encode(note),
      filename: 'hours.txt',
      content_type: 'text/plain',
    })
    const single = await route(fileRequest(single_.uid), routerEnv(), scopeOf(), {})
    expect(single.status).toBe(200)
    expect(await single.text()).toBe(note)
    expect(single.headers.get('content-type') ?? '').toMatch(/^text\/plain/)
    const singleDisposition = single.headers.get('content-disposition') ?? ''
    expect(singleDisposition).toContain('inline')
    expect(singleDisposition).toContain('hours.txt')
  })
})
