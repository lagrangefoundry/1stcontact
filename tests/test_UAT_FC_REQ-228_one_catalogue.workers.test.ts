import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { storeFor } from '../apps/control-app/src/store'
import { chatLibrary } from '../apps/control-app/src/library'
import { listMaterial, materialImageLibrary } from '../apps/control-app/src/material'
import {
  LibraryRefusedError,
  libraryOperations,
} from '../tools/generate/src/cli/ai/library-core'
import { resolveStoredImage } from '../tools/generate/src/cli/image-library'
import { applySchema, makeD1Site } from './support/d1-site-factory'
import { bytesOf } from './support/material-fixtures'

/**
 * REQ-228 — **the catalogue over the real stores**, and the mark that placing
 * leaves on it.
 *
 * WHAT THIS FILE IS FOR. The node suite beside it proves what the SURFACE
 * decides — the bound, the filters, the one naming rule, the shape of a
 * placement — against a doubled host. This is the contract half: what the
 * catalogue actually reads out of D1 and R2, and what a placement actually does
 * to both stores. Every fact is read back off the ticket store's own record or
 * out of the site's own asset list, never off the reply that claims it.
 *
 * ONE DOUBLE, NAMED WHERE IT IS USED: the describers, which are model boundaries
 * miniflare cannot reach and about which nothing here claims anything. Ingestion
 * requires one ([[REQ-173]]), so every case uploads against a configured
 * deployment.
 *
 * THE CLAIMS:
 *
 *  1. THE CATALOGUE IS THE LIBRARY, not a second view of it. It reads the same
 *     `listMaterial` the client's own Library tab draws — *"the client's Library
 *     tab is already one catalogue of items with metadata … only the assistant
 *     sees something else"*.
 *  2. BEING ON THE SITE IS A MARK ON THE ITEM, and placing sets it — in the
 *     record AND in the site's assets, which is what makes the mark true rather
 *     than merely written.
 *  3. THE NAME THE CATALOGUE GIVES IS THE NAME `screenshot` TAKES. Asserted as an
 *     equivalence against the merged image library's own listing, so the two
 *     cannot come to disagree.
 *  4. THE GATE HOLDS FROM HERE. A capture-sourced picture is refused by the same
 *     `promoteToSiteAsset` refusal that has always guarded the client's UI —
 *     [[DOC-38]] §5's *"most damaging single action available in the system"* is
 *     not reachable through this surface either.
 *  5. PLACING TWICE NEVER REPLACES A LIVE PICTURE. The collision is renamed and
 *     the new name is reported, so the model writes a handle to what is there.
 *  6. THE CATALOGUE HOLDS DOCUMENTS AND FONTS, which is what makes it the
 *     client's material rather than only their pictures.
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

/** The describers, doubled — see the header. Nothing here claims anything of them. */
function deps(): RouterDeps {
  return {
    index: async () => async () => {},
    describeText: async () => ({ text: 'A document, digested.', model: 'stub/digest-1' }),
    describeImage: async () => ({
      text: 'A warm photograph of a corner bakery at golden hour.',
      model: 'stub/vision-1',
    }),
  }
}

/**
 * One dropped file, through the real route.
 *
 * **THE SLUG IS WHAT DECIDES WHETHER THE UPLOAD ALREADY PLACED IT**, and getting
 * that lever right is what these cases turn on. The overlay sends the open
 * site's slug, and the route promotes a `site`-role file immediately when it has
 * one ([[BUG-47]]); with no slug there is nowhere to put it, so the material is
 * stored and left unplaced. A case about placing FROM THE CATALOGUE has to start
 * from the second state, or it asserts the route's promotion rather than this
 * surface's.
 *
 * **THE ROLE IS NOT THAT LEVER, AND MUST NOT BE USED AS ONE.** `classify` writes
 * `republishable: role !== 'reference'` — a client who says *"just for you to
 * read"* has told us not to publish it whatever the law says — so a
 * `reference`-role upload is not merely unplaced, it is permanently
 * UNPLACEABLE. Reaching for it to get an unplaced fixture would produce cases
 * that pass by hitting the gate, which is the opposite of what most of them are
 * about.
 */
async function upload(
  tenant: string,
  file: { bytes: Uint8Array; name: string; type: string; role?: string; slug?: string },
): Promise<Record<string, unknown>> {
  const form = new FormData()
  form.append('file', new File([file.bytes as unknown as BlobPart], file.name, { type: file.type }))
  form.append('role', file.role ?? 'site')
  if (file.slug) form.append('slug', file.slug)
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
  return {
    tickets,
    sites,
    ops: libraryOperations(chatLibrary(tickets, sites, slug)),
  }
}

type Row = Record<string, unknown>
const rowsOf = (page: unknown): Row[] => (page as { items: Row[] }).items

beforeAll(async () => {
  await APPLIED
})

// ── AC1 — the catalogue is the Library ───────────────────────────────────────

describe('REQ-228 AC1 — the assistant reads the catalogue the client sees', () => {
  it('test_UAT_FC_REQ-228_the_catalogue_is_the_same_set_the_library_tab_draws', async () => {
    // THE WHOLE POINT OF THE TICKET, asserted as an EQUIVALENCE rather than by
    // checking that the catalogue returns something. `listMaterial` is what
    // REQ-161 built for the client's own tab; a catalogue that queried for
    // itself could agree today and drift the moment either changed. The one
    // failure worth designing against is that they stop describing the same set.
    const tenant = 'req228-parity'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req228a' })

    await upload(tenant, { bytes: bytesOf('the wordmark'), name: 'wordmark.svg', type: 'image/svg+xml' })
    await upload(tenant, {
      bytes: bytesOf('# Positioning\n\nThe only late-night bakery in town.'),
      name: 'positioning.md',
      type: 'text/markdown',
      role: 'reference',
    })

    const { tickets, ops } = await catalogue(tenant, site.slug)
    const library = await listMaterial(tickets)
    const rows = rowsOf(await ops.list_library({ limit: 100 }))

    expect(rows.map((r) => r.item)).toEqual(library.map((m) => m.uid))
    expect(rows).toHaveLength(2)
  })

  it('test_UAT_FC_REQ-228_the_catalogue_holds_documents_as_well_as_pictures', async () => {
    // *"The catalogue is the complete account of the client's material."* A
    // Library listing that silently omitted the brand note would be the same
    // shape of bug this ticket is fixing, one kind along.
    const tenant = 'req228-kinds'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req228b' })

    await upload(tenant, { bytes: bytesOf('the wordmark'), name: 'wordmark.svg', type: 'image/svg+xml' })
    await upload(tenant, {
      bytes: bytesOf('# Brand\n\nGold on cream.'),
      name: 'brand.md',
      type: 'text/markdown',
      role: 'reference',
    })

    const { ops } = await catalogue(tenant, site.slug)
    const kinds = rowsOf(await ops.list_library({ limit: 100 })).map((r) => r.kind)
    expect(kinds.sort()).toEqual(['document', 'image'])
    // AND `kind` NARROWS RATHER THAN GATING — the document is reachable, and so
    // is the picture on its own.
    expect(rowsOf(await ops.list_library({ kind: 'document' }))).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-228_reading_an_item_gives_the_description_the_client_was_given', async () => {
    // The description is what alt text gets written from, and it is the same
    // digest the Library's detail pane shows — `readMaterial`'s body, not a
    // second account of the file composed for the model.
    const tenant = 'req228-describe'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req228c' })
    const uploaded = await upload(tenant, {
      bytes: bytesOf('photo bytes'),
      name: 'bakery.png',
      type: 'image/png',
    })

    const { ops } = await catalogue(tenant, site.slug)
    const one = (await ops.get_library_item({ item: String(uploaded.uid) })) as Row
    expect(one.description).toBe('A warm photograph of a corner bakery at golden hour.')
    expect(one.item).toBe(uploaded.uid)
  })
})

// ── AC2 — placing sets the mark, in both stores ──────────────────────────────

describe('REQ-228 AC2 — placing a picture sets the mark on the item', () => {
  it('test_UAT_FC_REQ-228_placing_puts_the_bytes_on_the_site_and_records_the_placement', async () => {
    // BOTH HALVES, because either alone is a lie. A record claiming a placement
    // with no bytes on the site is what BUG-47's soft-failure case is about;
    // bytes on the site with no record is a catalogue that has stopped being an
    // account of where the client's material is.
    const tenant = 'req228-place'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req228d' })
    // DROPPED ON THE CHAT WITH NO SITE OPEN, so the route stored it and placed
    // nothing — see `upload`'s header. This is the state the ticket's own
    // acceptance test starts from: the client has given us something and it is
    // not on the site yet.
    const uploaded = await upload(tenant, {
      bytes: bytesOf('the wordmark'),
      name: 'wordmark.svg',
      type: 'image/svg+xml',
    })

    const { tickets, sites, ops } = await catalogue(tenant, site.slug)
    // ASSERTED RATHER THAN ASSUMED, so a route that began promoting without a
    // slug would fail this case instead of silently making the next assertion
    // about its placement rather than ours.
    const before = (await ops.get_library_item({ item: String(uploaded.uid) })) as Row
    expect(before.placed_on).toEqual([])

    const placed = (await ops.place_on_site({ item: String(uploaded.uid) })) as Row
    expect(placed.asset).toBe('wordmark.svg')
    expect(placed.src).toBe('/assets/wordmark.svg')

    // THE BYTES ARE REALLY THERE, asked of the site store rather than of the
    // reply. This is what makes the mark true rather than merely written.
    expect(await sites.listAssets(site.slug)).toContain('wordmark.svg')

    // AND THE MARK IS ON THE RECORD, read back off the store.
    const { ticket } = await tickets.get({ uid: String(uploaded.uid) })
    expect(ticket.fields.placed_on).toEqual([site.slug])
    // Reported back on the placement too, so the assistant needs no second read
    // to know its own placement happened.
    expect(placed.placed_on).toEqual([site.slug])
  })

  it('test_UAT_FC_REQ-228_the_description_comes_back_with_the_placement_for_the_alt_text', async () => {
    // *"It should carry forward what `promoteToSiteAsset` already says about alt
    // text: the description lives on the material ticket, and the assistant is
    // the one that writes it onto the picture element that places the image."*
    // `site.json`'s asset registry is gone, so the site side has nowhere to hold
    // this — which is exactly why it travels on the placement.
    const tenant = 'req228-alt'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req228e' })
    const uploaded = await upload(tenant, {
      bytes: bytesOf('photo bytes'),
      name: 'bakery.png',
      type: 'image/png',
    })

    const { ops } = await catalogue(tenant, site.slug)
    const placed = (await ops.place_on_site({ item: String(uploaded.uid) })) as Row
    expect(placed.description).toBe('A warm photograph of a corner bakery at golden hour.')
  })

  it('test_UAT_FC_REQ-228_placing_a_second_picture_under_a_taken_name_renames_rather_than_replaces', async () => {
    // A surface whose whole promise is that it only ADDS must not be able to
    // silently change a picture that is live on the client's site. The rename is
    // `promoteToSiteAsset`'s and this asserts it survives the route from here —
    // and, more importantly, that the handle the model is handed names what
    // actually landed rather than what it asked for.
    const tenant = 'req228-collide'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req228f' })

    const first = await upload(tenant, {
      bytes: bytesOf('first logo'),
      name: 'logo.png',
      type: 'image/png',
    })
    const second = await upload(tenant, {
      bytes: bytesOf('second logo'),
      name: 'logo.png',
      type: 'image/png',
    })

    const { sites, ops } = await catalogue(tenant, site.slug)
    const a = (await ops.place_on_site({ item: String(first.uid) })) as Row
    const b = (await ops.place_on_site({ item: String(second.uid) })) as Row

    expect(a.asset).toBe('logo.png')
    expect(b.asset).toBe('logo-2.png')
    expect(b.src).toBe('/assets/logo-2.png')
    // BOTH ARE ON THE SITE. The first was not overwritten.
    const assets = await sites.listAssets(site.slug)
    expect(assets).toContain('logo.png')
    expect(assets).toContain('logo-2.png')
  })

  it('test_UAT_FC_REQ-228_placed_filters_against_this_sites_mark_over_the_real_records', async () => {
    // The filter the ticket asks for — *"by whether it is placed on this site"* —
    // over records the store actually holds, so the predicate is proved against
    // the same `placed_on` shape `promoteToSiteAsset` writes rather than against
    // a fixture's idea of it.
    const tenant = 'req228-filter'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req228g' })

    // ONE PLACED BY THE OVERLAY (it sent the open site's slug) and one dropped
    // for reading. Two real states a Library genuinely holds, not two settings of
    // one flag.
    const placedUpload = await upload(tenant, {
      bytes: bytesOf('the wordmark'),
      name: 'wordmark.svg',
      type: 'image/svg+xml',
      role: 'site',
      slug: site.slug,
    })
    const keptUpload = await upload(tenant, {
      bytes: bytesOf('# Notes'),
      name: 'notes.md',
      type: 'text/markdown',
      role: 'reference',
    })

    const { ops } = await catalogue(tenant, site.slug)
    expect(rowsOf(await ops.list_library({ placed: true, limit: 100 })).map((r) => r.item)).toEqual([
      placedUpload.uid,
    ])
    expect(rowsOf(await ops.list_library({ placed: false, limit: 100 })).map((r) => r.item)).toEqual(
      [keptUpload.uid],
    )
  })
})

// ── AC3 — one name, across the catalogue and the picture vocabulary ──────────

describe('REQ-228 AC3 — the catalogue name is the name screenshot takes', () => {
  it('test_UAT_FC_REQ-228_every_catalogue_picture_resolves_through_the_image_vocabulary', async () => {
    // THE CONSTRAINT THE TICKET PUTS ON THIS WORK: `resolveStoredImage` *"must
    // stay the one rule; a second naming vocabulary is the failure this whole
    // module was written to avoid"*. So every name the catalogue hands out is fed
    // to the merged library's OWN listing through that function, and must reach
    // exactly one picture. A catalogue that invented its own names would fail
    // here rather than in a conversation where the assistant was told it could
    // look at something and could not.
    const tenant = 'req228-naming'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req228h' })
    await upload(tenant, {
      bytes: bytesOf('photo bytes'),
      name: 'DSC_0912.jpg',
      type: 'image/jpeg',
    })

    const { tickets, ops } = await catalogue(tenant, site.slug)
    const pictures = await materialImageLibrary(tickets).list()
    const rows = rowsOf(await ops.list_library({ kind: 'image', limit: 100 }))
    expect(rows).toHaveLength(1)

    for (const row of rows) {
      const resolved = resolveStoredImage(String(row.item), pictures)
      expect(resolved.match?.name).toBe(row.item)
    }

    // AND THE CLIENT'S OWN FILENAME REACHES IT TOO, through the same rule —
    // which is what `storedImageOf` putting the filename in `aliases` buys.
    expect(resolveStoredImage('DSC_0912.jpg', pictures).match?.name).toBe(rows[0].item)
    expect(((await ops.get_library_item({ item: 'DSC_0912.jpg' })) as Row).item).toBe(rows[0].item)
  })
})

// ── AC4 — the gate holds from here ───────────────────────────────────────────

describe('REQ-228 AC4 — the refusal that was already there still fires', () => {
  it('test_UAT_FC_REQ-228_a_fetched_picture_cannot_be_published_through_this_surface', async () => {
    // [[DOC-38]] §5 calls promoting a capture-sourced asset *"the most damaging
    // single action available in the system"* — it publishes third-party
    // copyright under the client's own domain — and notes it is *"one plausible
    // tool call away"*. This is the case that proves the tool call is not.
    //
    // THE ROW IS MADE NOT-REPUBLISHABLE THE WAY INGESTION WOULD, by patching the
    // record rather than by asking the surface to pretend: the gate reads the
    // RECORD, so a case that faked the gate would prove nothing about it.
    const tenant = 'req228-gate'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req228i' })
    const uploaded = await upload(tenant, {
      bytes: bytesOf('somebody elses hero image'),
      name: 'their-hero.png',
      type: 'image/png',
    })

    const { tickets, sites, ops } = await catalogue(tenant, site.slug)
    // THE WHOLE FIELD BLOCK `classify` WRITES FOR A FETCH, not only the bit the
    // gate reads. `source_url` is not decoration here — the type pack REFUSES a
    // fetched material without one, so a patch that set `origin` alone would not
    // be a state this system can hold, and a case built on one would be proving
    // the gate against a record that could never exist.
    await tickets.update({
      uid: String(uploaded.uid),
      patch: {
        fields: {
          republishable: false,
          rights: 'third_party',
          origin: 'fetched',
          source_url: 'https://a-competitor.example/hero.png',
        },
      },
    })

    const refusal = await ops
      .place_on_site({ item: String(uploaded.uid) })
      .catch((e: unknown) => e)
    expect(refusal).toBeInstanceOf(LibraryRefusedError)
    expect((refusal as LibraryRefusedError).code).toBe('NOT_REPUBLISHABLE')

    // AND NOTHING REACHED THE SITE. A refusal that had already written the bytes
    // would be a refusal in name only.
    expect(await sites.listAssets(site.slug)).not.toContain('their-hero.png')
    // NOR IS THE RECORD MARKED. The mark means the bytes are on the site.
    const { ticket } = await tickets.get({ uid: String(uploaded.uid) })
    expect(ticket.fields.placed_on ?? []).toEqual([])
  })
})
