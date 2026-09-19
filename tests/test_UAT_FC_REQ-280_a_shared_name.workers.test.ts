import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import { storeFor } from '../apps/control-app/src/store'
import { chatLibrary } from '../apps/control-app/src/library'
import { generatedMaterialStore } from '../apps/control-app/src/imagegen'
import { labelOrder, listMaterial, materialImageLibrary } from '../apps/control-app/src/material'
import { libraryOperations } from '../tools/generate/src/cli/ai/library-core'
import { resolveStoredImage } from '../tools/generate/src/cli/image-library'
import { adoptCapture } from '../apps/control-app/src/capture-material'
import { r2ReferenceStore } from '../tools/generate/src/store/r2-reference-store'
import { bundleNameFor } from '../tools/generate/src/store/reference-store'
import { writeBundle } from '../tools/generate/src/cli/capture/bundle'
import type { Capture, CaptureResult } from '../tools/generate/src/cli/capture/types'
import { applySchema, ensureTenant, makeD1Site } from './support/d1-site-factory'
import { bytesOf } from './support/material-fixtures'
import { syntheticCapture } from './support/reference-fixtures'

/**
 * [[REQ-280]] — **one name the client and the consultant can both say**.
 *
 * WHAT WAS WRONG. The two halves of an engagement were labelled by different
 * things and neither could see the other's. The assistant held the uid
 * (`material-bd70d8d9`); the Library showed the title. So three generated
 * variants of one prompt — which arrive titled identically, because the title is
 * the prompt — gave the operator three rows that read the same and the
 * consultant three opaque handles, and neither could say *"that one"*.
 *
 * WHAT THIS PROVES, over real D1 and the real counters table: that a label is
 * allocated from the client's own per-kind sequence, that it cannot carry a fact
 * about any other client's Library, that it is the SAME string on both sides,
 * that it is accepted back as a name, and that material which predates it is
 * given one rather than left out of the shared frame for ever.
 *
 * ONE DOUBLE, AND IT IS A MODEL BOUNDARY: the describers, which miniflare cannot
 * reach and about which nothing here claims anything. Every fact below is read
 * back off the ticket store's own record, the catalogue the assistant is handed,
 * or the Library listing the client's own tab draws — never off the reply that
 * claims it.
 */

const APPLIED = applySchema()

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  }
}

const scopeOf = (businessId: string): Scope => ({ businessId })

/** The describers, doubled — see the header. */
function deps(): RouterDeps {
  return {
    index: async () => async () => {},
    describeText: async () => ({ text: 'A document, digested.', model: 'stub/digest-1' }),
    describeImage: async () => ({
      text: 'A crucible of molten metal leaning forward to pour.',
      model: 'stub/vision-1',
    }),
  }
}

/**
 * One dropped file, through the real route.
 *
 * NO SITE KEY, so the upload is stored and placed nowhere — every claim here is
 * about naming and none about placement, and a promotion firing on the way past
 * would only add a second thing that could fail.
 */
async function upload(
  tenant: string,
  file: { bytes: Uint8Array; name: string; type: string; role?: string },
): Promise<Record<string, unknown>> {
  const form = new FormData()
  form.append('file', new File([file.bytes as unknown as BlobPart], file.name, { type: file.type }))
  form.append('role', file.role ?? 'site')
  const response = await route(
    new Request('https://app.test/api/material', { method: 'POST', body: form }),
    routerEnv(),
    scopeOf(tenant),
    deps(),
  )
  return (await response.json()) as Record<string, unknown>
}

/** The catalogue surface, over this tenant's real stores. */
async function catalogue(tenant: string, slug: string) {
  const tickets = await ticketStoreFor(routerEnv(), scopeOf(tenant))
  const sites = await storeFor(routerEnv(), scopeOf(tenant))
  return { tickets, ops: libraryOperations(chatLibrary(tickets, sites, slug)) }
}

type Row = Record<string, unknown>
const rowsOf = (page: unknown): Row[] => (page as { items: Row[] }).items

/** One row's label, off the Library listing the client's own tab draws. */
async function labelInLibrary(tickets: TicketStore, uid: string): Promise<string | null> {
  return (await listMaterial(tickets)).find((row) => row.uid === uid)?.label ?? null
}

/**
 * A capture bundle, written the way `cmdCapturePage` writes one.
 *
 * COMPACT BUT REAL — the store is the R2 adapter and the bundle is what
 * `adoptCapture` actually reads. `seed` changes the screenshot's bytes, which is
 * how a RECAPTURE of the same address is expressed: same bundle name, different
 * content.
 */
async function captureOf(tenant: string, seed: number): Promise<{ adopt: () => Promise<{ ticket: { uid: string; fields: Record<string, unknown> } }> }> {
  const references = await r2ReferenceStore({
    DB: env.DB as D1Database,
    BLOBS: env.BLOBS as R2Bucket,
  }).forTenant(tenant)
  const capture: Capture = {
    ...syntheticCapture(),
    url: 'https://gigabytealchemy.ai/',
    host: 'gigabytealchemy.ai',
    path: '/',
    title: 'Gigabyte Alchemy — AI consulting',
  }
  const screenshot = new Uint8Array(64)
  screenshot.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0)
  screenshot[8] = seed
  const result: CaptureResult = {
    capture,
    screenshot,
    renderedHtml: `<html><body><h1>Gigabyte Alchemy ${seed}</h1></body></html>`,
    rawHtml: '<html><body></body></html>',
    assetBytes: new Map([['assets/hero.jpg', new Uint8Array([1, 2, 3, seed])]]),
  }
  const name = bundleNameFor(capture)
  await writeBundle(references.bundle(name), result)
  return {
    adopt: async () => {
      const tickets = await ticketStoreFor(routerEnv(), scopeOf(tenant))
      const adopted = await adoptCapture(
        tickets,
        references.bundle(name),
        {},
        { describeImage: async () => ({ text: 'A dark consultancy site.', model: 'stub/vision-1' }) },
      )
      return adopted as unknown as { ticket: { uid: string; fields: Record<string, unknown> } }
    },
  }
}

beforeAll(async () => {
  await APPLIED
})

// ── the number comes from the client's own per-kind sequence ─────────────────

describe('REQ-280 — the label is the kind, over that kind`s own number', () => {
  it('test_UAT_FC_REQ-280_each_kind_is_numbered_densely_from_one_within_a_business', async () => {
    // THE OPERATOR'S OWN ASK — *"I would like to say IMAGE-5, DOC-7"* — and the
    // density decision behind it: each kind draws on its own sequence, so a
    // client's first picture is IMAGE-1 and their first document is DOC-1 even
    // though the two share a ticket type and that type's own `human_id` run.
    const tenant = 'req280-sequence'
    await ensureTenant(tenant)

    const first = await upload(tenant, {
      bytes: bytesOf('crucible one'),
      name: 'crucible-a.png',
      type: 'image/png',
    })
    const second = await upload(tenant, {
      bytes: bytesOf('crucible two'),
      name: 'crucible-b.png',
      type: 'image/png',
    })
    const note = await upload(tenant, {
      bytes: bytesOf('# Positioning\n\nMolten metal, poured with care.'),
      name: 'positioning.md',
      type: 'text/markdown',
      role: 'reference',
    })

    const tickets = await ticketStoreFor(routerEnv(), scopeOf(tenant))
    expect(await labelInLibrary(tickets, String(first.uid))).toBe('IMAGE-1')
    expect(await labelInLibrary(tickets, String(second.uid))).toBe('IMAGE-2')

    // `DOC` AND NOT `DOCUMENT`, and from 1 rather than from 3. The prefix is the
    // word a person would say; the number is this kind's own.
    expect(await labelInLibrary(tickets, String(note.uid))).toBe('DOC-1')
  })

  it('test_UAT_FC_REQ-280_a_label_cannot_say_how_much_material_another_business_holds', async () => {
    // THE PART THAT IS LOAD-BEARING RATHER THAN COSMETIC. The consultant is now
    // cleared to say this string out loud to a client, so a globally sequenced
    // number would tell that client how much every other client has uploaded.
    // Two businesses, one after the other, both start at IMAGE-1.
    const alpha = 'req280-tenant-alpha'
    const beta = 'req280-tenant-beta'
    await ensureTenant(alpha)
    await ensureTenant(beta)

    const theirs = await upload(alpha, {
      bytes: bytesOf('alpha logo'),
      name: 'logo.png',
      type: 'image/png',
    })
    await upload(alpha, { bytes: bytesOf('alpha hero'), name: 'hero.png', type: 'image/png' })
    const ours = await upload(beta, {
      bytes: bytesOf('beta logo'),
      name: 'logo.png',
      type: 'image/png',
    })

    const alphaTickets = await ticketStoreFor(routerEnv(), scopeOf(alpha))
    const betaTickets = await ticketStoreFor(routerEnv(), scopeOf(beta))
    expect(await labelInLibrary(alphaTickets, String(theirs.uid))).toBe('IMAGE-1')
    expect(await labelInLibrary(betaTickets, String(ours.uid))).toBe('IMAGE-1')
  })

  it('test_UAT_FC_REQ-280_a_generated_picture_is_labelled_where_three_of_them_read_alike', async () => {
    // THE CASE THE TICKET OPENS WITH. Three generated variants of one prompt are
    // titled identically because the title IS the prompt, so before the label
    // the operator had three rows that read the same. The labels are what makes
    // them three things anyone can point at.
    const tenant = 'req280-generated'
    await ensureTenant(tenant)
    const store = await ticketStoreFor(routerEnv(), scopeOf(tenant))
    const handle = generatedMaterialStore(store, () => 'stub/image-1', null)

    const made = []
    for (const nth of ['a', 'b', 'c']) {
      const { ticket } = await handle.create({
        type: 'material',
        title: 'A crucible of molten metal leaning forward to pour',
        body: 'A crucible of molten metal leaning forward to pour',
      })
      await handle.attach({
        uid: ticket.uid,
        bytes: bytesOf(`crucible ${nth}`),
        filename: `crucible-${nth}.png`,
        content_type: 'image/png',
      })
      made.push(ticket.uid)
    }

    const rows = await listMaterial(store)
    const titles = new Set(rows.map((row) => row.title))
    // THE PREMISE OF THE CASE, asserted so it cannot pass vacuously: the three
    // really do read the same before you get to the label.
    expect(titles.size).toBe(1)

    const labels = made.map((uid) => rows.find((row) => row.uid === uid)?.label)
    expect(labels).toEqual(['IMAGE-1', 'IMAGE-2', 'IMAGE-3'])
  })
})

describe('REQ-280 — a capture is numbered once and keeps that number', () => {
  it('test_UAT_FC_REQ-280_recapturing_a_page_does_not_renumber_it', async () => {
    // A RECAPTURE IS THE SAME CAPTURE AS IT NOW STANDS, and the title and the
    // body deliberately move with it ([[REQ-166]]). The label may not: it is
    // what somebody has already said out loud about that row, and a reference
    // that was renumbered every time a page was re-read would be no reference.
    const tenant = 'req280-capture'
    await ensureTenant(tenant)
    const store = await ticketStoreFor(routerEnv(), scopeOf(tenant))

    const first = await (await captureOf(tenant, 1)).adopt()
    expect(first.ticket.fields.label).toBe('CAPTURE-1')

    const again = await (await captureOf(tenant, 2)).adopt()
    // ONE TICKET, which is what makes this a recapture rather than a second row.
    expect(again.ticket.uid).toBe(first.ticket.uid)
    expect(again.ticket.fields.label).toBe('CAPTURE-1')

    // AND THE CAPTURE'S SEQUENCE IS ITS OWN. A picture uploaded beside it takes
    // IMAGE-1, not IMAGE-2 — the counter a capture spends is not the pictures'.
    const uploaded = await upload(tenant, {
      bytes: bytesOf('a wordmark'),
      name: 'wordmark.png',
      type: 'image/png',
    })
    expect(await labelInLibrary(store, String(uploaded.uid))).toBe('IMAGE-1')
  })
})

// ── the same string on both sides, and accepted back as a name ───────────────

describe('REQ-280 — the label is the shared frame of reference', () => {
  it('test_UAT_FC_REQ-280_the_catalogue_and_the_library_row_carry_the_same_label', async () => {
    // A SHARED reference means one string, not two that agree today. The
    // catalogue item the consultant reads and the Library row the client reads
    // are asserted as an EQUIVALENCE over the same set.
    const tenant = 'req280-both-halves'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req280a' })

    await upload(tenant, { bytes: bytesOf('a wordmark'), name: 'wordmark.svg', type: 'image/svg+xml' })
    await upload(tenant, {
      bytes: bytesOf('# Brand\n\nGold on cream.'),
      name: 'brand.md',
      type: 'text/markdown',
      role: 'reference',
    })

    const { tickets, ops } = await catalogue(tenant, site.slug)
    const library = await listMaterial(tickets)
    const items = rowsOf(await ops.list_library({ limit: 100 }))

    expect(items.map((item) => item.label)).toEqual(library.map((row) => row.label))
    expect(items.map((item) => item.label).sort()).toEqual(['DOC-1', 'IMAGE-1'])
    // AND THE HANDLE IS UNTOUCHED. The label is carried BESIDE the uid, which is
    // still what every other surface takes and what stored edit recipes name.
    expect(items.map((item) => item.item)).toEqual(library.map((row) => row.uid))
  })

  it('test_UAT_FC_REQ-280_the_consultant_can_be_asked_for_a_picture_by_its_label', async () => {
    // THE OTHER DIRECTION, which is what makes it a reference rather than a
    // decoration: the client says *"use IMAGE-2"* and the consultant reaches the
    // picture under that spelling, with no translation step in between.
    const tenant = 'req280-by-label'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req280b' })

    await upload(tenant, { bytes: bytesOf('crucible one'), name: 'crucible-a.png', type: 'image/png' })
    const second = await upload(tenant, {
      bytes: bytesOf('crucible two'),
      name: 'crucible-b.png',
      type: 'image/png',
    })

    const { tickets, ops } = await catalogue(tenant, site.slug)
    const named = (await ops.get_library_item({ item: 'IMAGE-2' })) as Row
    expect(named.item).toBe(second.uid)
    expect(named.label).toBe('IMAGE-2')

    // AND THE WAY A PERSON ACTUALLY TYPES IT. `resolveStoredImage` is
    // case-insensitive on its loose pass, so `image-2` is the same picture.
    expect(((await ops.get_library_item({ item: 'image-2' })) as Row).item).toBe(second.uid)

    // AND IT REACHES THE PICTURE EVERYWHERE A PICTURE IS NAMED, because the
    // label is an alias on the ONE projection from a record to a name — so
    // `screenshot` and `edit_image` spell it exactly as the catalogue does.
    const pictures = await materialImageLibrary(tickets).list()
    expect(resolveStoredImage('IMAGE-2', pictures).match?.name).toBe(second.uid)
  })

  it('test_UAT_FC_REQ-280_typing_the_label_into_the_catalogue_filter_finds_the_row', async () => {
    // The text filter is how a consultant narrows a catalogue it was given too
    // much of, so the label has to be in what that filter searches — otherwise
    // the number the client just said is the one thing that cannot find the row.
    const tenant = 'req280-filter'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req280c' })
    await upload(tenant, { bytes: bytesOf('crucible one'), name: 'crucible-a.png', type: 'image/png' })
    const second = await upload(tenant, {
      bytes: bytesOf('crucible two'),
      name: 'crucible-b.png',
      type: 'image/png',
    })

    const { ops } = await catalogue(tenant, site.slug)
    const found = rowsOf(await ops.list_library({ matching: 'IMAGE-2' }))
    expect(found).toHaveLength(1)
    expect(found[0].item).toBe(second.uid)
  })
})

// ── material that predates the label ─────────────────────────────────────────

describe('REQ-280 — a Library filled before labels existed still gets them', () => {
  it('test_UAT_FC_REQ-280_older_material_is_labelled_on_the_next_listing_oldest_first', async () => {
    // EVERY LIBRARY IN EXISTENCE PREDATES THIS FIELD, including the one the
    // operator was looking at when they said the two halves had no common frame
    // of reference. A label that only ever arrived on new uploads would leave
    // exactly the rows the ticket is about outside the shared frame.
    const tenant = 'req280-legacy'
    await ensureTenant(tenant)
    const store = await ticketStoreFor(routerEnv(), scopeOf(tenant))

    // WRITTEN THROUGH THE REAL STORE WITH NO LABEL — which is what a record
    // created before the field looks like, exactly.
    const older = await store.create({
      type: 'material',
      title: 'A crucible of molten metal leaning forward to pour',
      body: 'described',
      fields: {
        kind: 'image',
        origin: 'uploaded',
        rights: 'owned',
        republishable: true,
        exportable: false,
        filename: 'crucible-old.png',
        content_type: 'image/png',
      },
    })
    // A REAL GAP, SO *OLDEST* IS A FACT AND NOT A COINCIDENCE. `created_at` is an
    // ISO timestamp at millisecond granularity, and two creates in immediate
    // succession routinely share one — which is the case the assertion below
    // this one is about. Here the claim is that a genuine difference in creation
    // time is honoured, so the fixture has to produce one.
    await new Promise((resolve) => setTimeout(resolve, 5))
    const newer = await store.create({
      type: 'material',
      title: 'A crucible of molten metal leaning forward to pour',
      body: 'described',
      fields: {
        kind: 'image',
        origin: 'uploaded',
        rights: 'owned',
        republishable: true,
        exportable: false,
        filename: 'crucible-new.png',
        content_type: 'image/png',
      },
    })
    expect(older.ticket.fields.label).toBeUndefined()
    // THE GAP IS ASSERTED, so this case cannot pass by landing in one
    // millisecond and agreeing with the tiebreak by luck.
    expect(newer.ticket.created_at > older.ticket.created_at).toBe(true)

    const first = await listMaterial(store)
    // OLDEST FIRST, so the sequence reads the way the client filled the Library
    // rather than the way this listing happened to be sorted.
    expect(first.find((row) => row.uid === older.ticket.uid)?.label).toBe('IMAGE-1')
    expect(first.find((row) => row.uid === newer.ticket.uid)?.label).toBe('IMAGE-2')

    // AND IT IS ON THE RECORD, not composed by the listing that reported it.
    expect((await store.get({ uid: older.ticket.uid })).ticket.fields.label).toBe('IMAGE-1')

    // AND IT DOES NOT MOVE. A shared reference that was renumbered on the next
    // read would be worse than no shared reference — a client who said IMAGE-1
    // out loud must still mean the picture they meant.
    const again = await listMaterial(store)
    expect(again.find((row) => row.uid === older.ticket.uid)?.label).toBe('IMAGE-1')
    expect(again.find((row) => row.uid === newer.ticket.uid)?.label).toBe('IMAGE-2')

    // AND THE NEXT UPLOAD CONTINUES THE SAME SEQUENCE rather than colliding with
    // what the catch-up just handed out.
    const uploaded = await upload(tenant, {
      bytes: bytesOf('crucible three'),
      name: 'crucible-c.png',
      type: 'image/png',
    })
    expect(await labelInLibrary(store, String(uploaded.uid))).toBe('IMAGE-3')
  })

  it('test_UAT_FC_REQ-280_a_folder_dropped_at_once_is_numbered_by_the_stated_rule', async () => {
    // A CLIENT DROPPING A FOLDER OF PHOTOGRAPHS, over the real store. The
    // ordering RULE is asserted exactly in the node suite beside this one,
    // because whether a batch of concurrent writes shares a millisecond is not
    // something a suite can make happen on demand — observed runs give these
    // three either one `created_at` between them or two. What is proved HERE is
    // that real records written together come out numbered by that same rule,
    // densely and reproducibly, whichever way the clock fell.
    const tenant = 'req280-same-instant'
    await ensureTenant(tenant)
    const store = await ticketStoreFor(routerEnv(), scopeOf(tenant))

    const material = (filename: string) => ({
      type: 'material',
      title: 'A crucible of molten metal leaning forward to pour',
      body: 'described',
      fields: {
        kind: 'image',
        origin: 'uploaded',
        rights: 'owned',
        republishable: true,
        exportable: false,
        filename,
        content_type: 'image/png',
      },
    })

    // CREATED TOGETHER, the way a dropped folder arrives. The expectation below
    // is computed through the SAME rule the catch-up sorts by, so it holds
    // whether or not the clock ticked between these three — the claim is the
    // rule, not one of the two ways the timing can fall.
    const [a, b, c] = await Promise.all([
      store.create(material('together-a.png')),
      store.create(material('together-b.png')),
      store.create(material('together-c.png')),
    ])

    const expected = [a, b, c]
      .sort((x, y) => labelOrder(x.ticket, y.ticket))
      .map((t) => t.ticket.uid)

    const rows = await listMaterial(store)
    const labelOf = (uid: string) => rows.find((row) => row.uid === uid)?.label
    expect(expected.map(labelOf)).toEqual(['IMAGE-1', 'IMAGE-2', 'IMAGE-3'])

    // AND THE SAME WAY TWICE. The labels are on the records now, so a second
    // listing must report the identical assignment rather than a fresh one.
    const again = await listMaterial(store)
    const againLabelOf = (uid: string) => again.find((row) => row.uid === uid)?.label
    expect(expected.map(againLabelOf)).toEqual(['IMAGE-1', 'IMAGE-2', 'IMAGE-3'])
  })
})
