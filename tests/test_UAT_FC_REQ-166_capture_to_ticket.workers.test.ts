import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import type { RouterEnv } from '../apps/control-app/src/router'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import { NotACaptureError, adoptCapture, captureRights } from '../apps/control-app/src/capture-material'
import { listMaterial, readMaterial } from '../apps/control-app/src/material'
import { r2ReferenceStore } from '../tools/generate/src/store/r2-reference-store'
import {
  CAPTURE_MEMBER,
  RENDERED_MEMBER,
  SCREENSHOT_MEMBER,
  bundleNameFor,
  type ReferenceStore,
} from '../tools/generate/src/store/reference-store'
import { writeBundle } from '../tools/generate/src/cli/capture/bundle'
import type { Capture, CaptureResult } from '../tools/generate/src/cli/capture/types'
import { syntheticCapture } from './support/reference-fixtures'
import { applySchema } from './support/d1-site-factory'

/**
 * REQ-166 — **a capture bundle becomes a corpus member.**
 *
 * WHAT MAKES THIS EVIDENCE. The ticket store is the real
 * `MultiTenantTicketStore` over the D1 and R2 bindings
 * `@cloudflare/vitest-pool-workers` supplies, so every record below is written
 * by the component's own validator against the product type pack, and every blob
 * lands in real R2. The reference store is the real R2 adapter, so the bundles
 * these read are stored exactly the way a cloud capture stores one. Member
 * addressing is proved through `route()` — the Worker's own route table — rather
 * than by calling the reader beneath it.
 *
 * ONE DOUBLE: the describer, which is a model boundary. The argument
 * `tests/support/stub-embedder.ts` makes covers it exactly — no claim here is
 * about the QUALITY of a description, and miniflare has no Workers AI to reach.
 *
 * THE CLAIMS, in the order the ticket makes them:
 *
 *  1. A COMPLETED CAPTURE YIELDS ONE `reference` TICKET with one attachment
 *     record per member, each addressable WITHOUT reading the others.
 *  2. THE BODY OPENS WITH A LINK to the site captured, and describes it.
 *  3. THE TITLE IS THE PAGE'S OWN TITLE, falling back to the host.
 *  4. RIGHTS INVERT ON WHOSE SITE IT IS — DOC-38 §10.1's table, both rows.
 *  5. RECAPTURING LEAVES ONE TICKET, updated in place, and writes no blob for a
 *     member whose bytes did not change.
 *  6. THE CAPTURE APPEARS IN THE LIBRARY, through the surface REQ-161 built.
 */

const APPLIED = applySchema()
const TENANT = 'req166'

function routerEnv(tenantId = TENANT): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  }
}

/**
 * The business a case operates on ([[REQ-168]]).
 *
 * It used to ride on the env as `TENANT_ID`; the business comes from the
 * caller's identity now, so it is an argument the way a request supplies it.
 */
const scopeOf = (businessId = TENANT): Scope => ({ businessId })

/** The stubbed describer, plus a count of how often it was reached. */
function vision(text = 'Gigabyte Alchemy\n\nDark consultancy site with gold accents.') {
  const state = { calls: 0 }
  return {
    state,
    describeImage: async () => {
      state.calls++
      return { text, model: 'stub/vision-1' }
    },
  }
}

/** A PNG-shaped screenshot. Nothing decodes it here; only its bytes are compared. */
function screenshotBytes(seed = 1): Uint8Array {
  const png = new Uint8Array(64)
  png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0)
  png[8] = seed
  return png
}

/** A capture result shaped exactly as the pipeline hands one to `writeBundle`. */
function captureResult(over: Partial<Capture> = {}, seed = 1): CaptureResult {
  const capture: Capture = {
    ...syntheticCapture(),
    url: 'https://gigabytealchemy.ai/',
    host: 'gigabytealchemy.ai',
    path: '/',
    title: 'Gigabyte Alchemy — AI consulting',
    theme: {
      ...syntheticCapture().theme,
      colors: [
        { hex: '#101014', usage: 'background', freq: 40 },
        { hex: '#d4af37', usage: 'text', freq: 12 },
      ],
      fonts: [{ family: 'Cinzel', role: 'heading', weights: [700], files: [] }],
    },
    ...over,
  }
  return {
    capture,
    screenshot: screenshotBytes(seed),
    renderedHtml: '<html><body><h1>Gigabyte Alchemy</h1></body></html>',
    rawHtml: '<html><body></body></html>',
    assetBytes: new Map([['assets/hero.jpg', new Uint8Array([1, 2, 3, 4])]]),
  }
}

/** Everything one tenant's attachment blobs, so residency is counted not assumed. */
async function blobKeys(tenantId = TENANT): Promise<string[]> {
  const out: string[] = []
  let cursor: string | undefined
  for (;;) {
    const page = await (env.BLOBS as R2Bucket).list({ prefix: `t/${tenantId}/blob/`, cursor })
    for (const object of page.objects) out.push(object.key)
    if (!page.truncated) break
    cursor = page.cursor
  }
  return out.sort()
}

/** The two stores a capture crosses, both real, both bound to one tenant. */
async function stores(tenantId = TENANT): Promise<{
  tickets: TicketStore
  references: ReferenceStore
}> {
  // The ticket store FIRST: it registers the tenant, and the reference store's
  // `forTenant` refuses an unregistered one. That ordering is production's too.
  const tickets = await ticketStoreFor(
    { DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket },
    { businessId: tenantId },
  )
  const references = await r2ReferenceStore({
    DB: env.DB as D1Database,
    BLOBS: env.BLOBS as R2Bucket,
  }).forTenant(tenantId)
  return { tickets, references }
}

/** Write a bundle the way `cmdCapturePage` writes one, and hand back its handle. */
async function captured(
  references: ReferenceStore,
  over: Partial<Capture> = {},
  seed = 1,
): Promise<{ name: string; result: CaptureResult }> {
  const result = captureResult(over, seed)
  const name = bundleNameFor(result.capture)
  await writeBundle(references.bundle(name), result)
  return { name, result }
}

beforeAll(async () => {
  await APPLIED
})

describe('REQ-166 — a completed capture becomes a reference ticket', () => {
  it('test_UAT_FC_REQ-166_a_bundle_becomes_one_reference_with_a_record_per_member', async () => {
    const { tickets, references } = await stores()
    const { name, result } = await captured(references)
    const seen = vision()

    const adopted = await adoptCapture(
      tickets,
      references.bundle(name),
      {},
      { describeImage: seen.describeImage },
    )

    expect(adopted.created).toBe(true)
    expect(adopted.ticket.type).toBe('reference')
    // ONE RECORD PER MEMBER — DOC-38 §9's shape, not one record over an archive.
    const { attachments } = await tickets.attachments({ uid: adopted.ticket.uid })
    const members = attachments
      .map((a) => (a.fields.meta as Record<string, unknown>).member)
      .sort()
    expect(members).toEqual([...adopted.members].sort())
    expect(members).toContain(CAPTURE_MEMBER)
    expect(members).toContain(SCREENSHOT_MEMBER)
    expect(members).toContain('assets/hero.jpg')

    // EACH ADDRESSABLE WITHOUT READING THE OTHERS. Through the Worker's own
    // route, naming one member of a bundle that holds five.
    const shot = await route(
      new Request(
        `https://app.test/api/material/file?uid=${adopted.ticket.uid}&member=${SCREENSHOT_MEMBER}`,
      ),
      routerEnv(),
      scopeOf(),
      {},
    )
    expect(shot.status).toBe(200)
    expect(new Uint8Array(await shot.arrayBuffer())).toEqual(result.screenshot)

    // A DIFFERENT member comes back different — the route is addressing, not
    // serving whichever record happens to sort first.
    const html = await route(
      new Request(
        `https://app.test/api/material/file?uid=${adopted.ticket.uid}&member=${RENDERED_MEMBER}`,
      ),
      routerEnv(),
      scopeOf(),
      {},
    )
    expect(await html.text()).toBe(result.renderedHtml)
  })

  it('test_UAT_FC_REQ-166_the_body_opens_with_a_link_to_the_site_captured', async () => {
    const { tickets, references } = await stores()
    const { name } = await captured(references, { path: '/link' })

    const adopted = await adoptCapture(
      tickets,
      references.bundle(name),
      {},
      { describeImage: vision().describeImage },
    )

    // THE FIRST LINE, not merely somewhere in the body: the client must be able
    // to get from our prose about a site back to the site.
    const first = adopted.ticket.body!.split('\n')[0]
    expect(first).toBe('[Gigabyte Alchemy — AI consulting](https://gigabytealchemy.ai/)')

    // And the prose the describer wrote is there too, with the facts the capture
    // measured — the palette a vision call must not be asked to guess.
    expect(adopted.ticket.body).toContain('Dark consultancy site with gold accents.')
    expect(adopted.ticket.body).toContain('#d4af37')
    expect(adopted.ticket.body).toContain('Cinzel')
    expect(adopted.description.status).toBe('ok')
  })

  it('test_UAT_FC_REQ-166_the_title_is_the_pages_own_title_and_falls_back_to_the_host', async () => {
    const { tickets, references } = await stores()

    const titled = await captured(references, { path: '/titled' })
    const withTitle = await adoptCapture(tickets, references.bundle(titled.name), {}, {
      describeImage: vision().describeImage,
    })
    expect(withTitle.ticket.title).toBe('Gigabyte Alchemy — AI consulting')

    // A page that declares no title still has an address, so the host is the
    // only fallback needed and 'Untitled' never appears.
    const bare = await captured(references, { path: '/bare', title: undefined })
    const withoutTitle = await adoptCapture(tickets, references.bundle(bare.name), {}, {
      describeImage: vision().describeImage,
    })
    expect(withoutTitle.ticket.title).toBe('gigabytealchemy.ai')
  })

  it('test_UAT_FC_REQ-166_rights_invert_on_whose_site_was_captured', async () => {
    // DOC-38 §10.1's table, as a function of provenance alone — nobody is asked.
    expect(captureRights('gigabytealchemy.ai', 'gigabytealchemy.ai')).toEqual({
      rights: 'owned',
      republishable: true,
      exportable: false,
    })
    expect(captureRights('www.gigabytealchemy.ai', 'gigabytealchemy.ai')).toEqual({
      rights: 'owned',
      republishable: true,
      exportable: false,
    })
    // A competitor: never republishable, and exportable into DOC-15's corpus.
    expect(captureRights('acme-rivals.test', 'gigabytealchemy.ai')).toEqual({
      rights: 'third_party',
      republishable: false,
      exportable: true,
    })
    // A near-miss must not read as the client's own domain.
    expect(captureRights('notgigabytealchemy.ai', 'gigabytealchemy.ai').republishable).toBe(false)

    // And the bits reach the record, which is where they actually gate anything.
    const { tickets, references } = await stores()
    const { name } = await captured(references, { path: '/rights' })
    const adopted = await adoptCapture(tickets, references.bundle(name), {}, {
      describeImage: vision().describeImage,
    })
    expect(adopted.ticket.fields.republishable).toBe(false)
    expect(adopted.ticket.fields.exportable).toBe(true)
    expect(adopted.ticket.fields.origin).toBe('captured')
    expect(adopted.ticket.fields.kind).toBe('capture')
    expect(adopted.ticket.fields.source_url).toBe('https://gigabytealchemy.ai/')
  })

  it('test_UAT_FC_REQ-166_recapturing_updates_one_ticket_and_writes_no_blob_for_unchanged_bytes', async () => {
    const { tickets, references } = await stores()
    const { name } = await captured(references, { path: '/recapture' })

    const first = await adoptCapture(tickets, references.bundle(name), {}, {
      describeImage: vision('First look\n\nAs it was.').describeImage,
    })
    const afterFirst = await blobKeys()

    // The SAME bundle, adopted again — every member's bytes unchanged.
    const second = await adoptCapture(tickets, references.bundle(name), {}, {
      describeImage: vision('Second look\n\nAs it now is.').describeImage,
    })

    // ONE TICKET, UPDATED IN PLACE. Not a second row in the client's Library.
    expect(second.created).toBe(false)
    expect(second.ticket.uid).toBe(first.ticket.uid)
    const references_ = (await tickets.list({ type: 'reference', limit: 'all' })).tickets.filter(
      (t) => t.fields.bundle === name,
    )
    expect(references_).toHaveLength(1)

    // NO NEW BLOB for a member whose bytes did not change — the dedup the ticket
    // asks for, done against the `sha256` the component records.
    expect(second.unchanged.sort()).toEqual([...second.members].sort())
    expect(await blobKeys()).toEqual(afterFirst)

    // THE DESCRIPTION IS REPLACED, deliberately: a recapture is the site as it
    // now is, and stale prose about a page that has changed is what this
    // overwrites. The first look must not survive the second.
    expect(second.ticket.body).toContain('As it now is.')
    expect(second.ticket.body).not.toContain('As it was.')
  })

  it('test_UAT_FC_REQ-166_a_changed_member_is_replaced_and_the_superseded_record_detached', async () => {
    const { tickets, references } = await stores()
    const { name } = await captured(references, { path: '/changed' }, 1)
    const first = await adoptCapture(tickets, references.bundle(name), {}, {
      describeImage: vision().describeImage,
    })

    // The site changed: one member's bytes differ, the rest do not.
    await references.bundle(name).write(SCREENSHOT_MEMBER, screenshotBytes(9))
    const second = await adoptCapture(tickets, references.bundle(name), {}, {
      describeImage: vision().describeImage,
    })

    expect(second.unchanged).not.toContain(SCREENSHOT_MEMBER)
    expect(second.unchanged).toContain(CAPTURE_MEMBER)

    // ONE LIVE RECORD for the member, not the old one beside the new — otherwise
    // there is no way to ask which screenshot is current.
    const { attachments } = await tickets.attachments({ uid: second.ticket.uid })
    const shots = attachments.filter(
      (a) => (a.fields.meta as Record<string, unknown>).member === SCREENSHOT_MEMBER,
    )
    expect(shots).toHaveLength(1)

    // And the route now serves the NEW bytes.
    const shot = await route(
      new Request(
        `https://app.test/api/material/file?uid=${first.ticket.uid}&member=${SCREENSHOT_MEMBER}`,
      ),
      routerEnv(),
      scopeOf(),
      {},
    )
    expect(new Uint8Array(await shot.arrayBuffer())).toEqual(screenshotBytes(9))
  })

  it('test_UAT_FC_REQ-166_the_capture_appears_in_the_library_with_its_members', async () => {
    const { tickets, references } = await stores()
    const { name } = await captured(references, { path: '/library' })
    const adopted = await adoptCapture(tickets, references.bundle(name), {}, {
      describeImage: vision().describeImage,
    })

    // REQ-161's own listing, unchanged — `MATERIAL_TYPES` already spans both.
    const rows = await listMaterial(tickets)
    const row = rows.find((r) => r.uid === adopted.ticket.uid)
    expect(row).toBeDefined()
    expect(row!.kind).toBe('capture')
    expect(row!.type).toBe('reference')

    // The detail carries the member list the pane counts and previews from.
    const item = await readMaterial(tickets, adopted.ticket.uid)
    expect(item.members).toContain(SCREENSHOT_MEMBER)
    expect(item.members.length).toBe(adopted.members.length)

    // AND THE SAME READ ON ORDINARY MATERIAL IS EMPTY, not absent: a `material`
    // is one file and has no member vocabulary at all.
    const { ticket } = await tickets.create({
      type: 'material',
      title: 'A note',
      body: 'Something.',
      fields: {
        rights: 'owned',
        republishable: true,
        exportable: false,
        origin: 'uploaded',
        kind: 'document',
      },
    })
    expect((await readMaterial(tickets, ticket.uid)).members).toEqual([])
  })

  it('test_UAT_FC_REQ-166_a_bundle_that_is_not_a_capture_is_refused_by_name', async () => {
    const { tickets, references } = await stores()
    const empty = references.bundle('nothing.test/_')
    await empty.write('readme.txt', new TextEncoder().encode('not a capture'))

    await expect(adoptCapture(tickets, empty, {}, {})).rejects.toBeInstanceOf(NotACaptureError)
  })
})
