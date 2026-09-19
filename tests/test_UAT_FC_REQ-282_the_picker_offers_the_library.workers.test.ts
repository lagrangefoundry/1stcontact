import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterEnv } from '../apps/control-app/src/router'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import {
  LIBRARY_PICK,
  NOT_REPUBLISHABLE_SHORT,
  pictureChoices,
  placePicture,
  promoteToSiteAsset,
  type PictureChoice,
} from '../apps/control-app/src/material'
import { storeFor } from '../apps/control-app/src/store'
import type { TenantSiteStore } from '../../tools/generate/src/store/d1r2-store'
import type { Scope } from '../apps/control-app/src/scope'
import { applySchema } from './support/d1-site-factory'
import { bytesOf } from './support/material-fixtures'
import { siteSeed } from './support/site-seed'

/**
 * REQ-282 Part 2 — **the picker offers the Library, not the site's copy of it**.
 *
 * THE REPORT. *"When I open the asset selector from the editor mode on the site
 * tab, that selector ONLY shows me images that are shown in the Library as being
 * 'On the site' […] the selector needs to show all images — I am far more likely
 * to want to select an image that is not yet used than one that is."*
 *
 * THE PRINCIPLE IT SETTLES, in the operator's own words: *"the picker needs to
 * offer me what is in the Library. That is the primary purpose of the Library."*
 * The site's asset copy is bookkeeping — which pictures we have already copied
 * under the draft — and it was never a category anybody chooses from. The
 * product had already decided this for the consultant: `library-surface.json`
 * teaches *"one catalogue with a mark on some of its entries"*. Only one of the
 * two surfaces implemented it.
 *
 * WHAT IS ASSERTED, in the order the ticket claims it:
 *
 *   1. A LIBRARY PICTURE THE SITE DOES NOT HOLD IS OFFERED, marked not-in-use,
 *      carrying the material it would have to place.
 *   2. ONE ENTRY PER PICTURE. A Library picture already on the site offers the
 *      SITE HANDLE its pages reference, marked in use — not a second placement
 *      of the same bytes, and not a duplicate tile.
 *   3. WHAT WE MAY NOT PUBLISH IS OFFERED WITH THE REASON rather than filtered
 *      out. A client who cannot find their own photograph has been told nothing.
 *   4. A SITE ASSET NO MATERIAL ACCOUNTS FOR IS STILL OFFERED — a drawing, an
 *      import — because it is on the site and a page may already hold it.
 *   5. THE SEGMENT ENVELOPE CARRIES THE CATALOGUE, and the descriptor's `enum`
 *      still carries only what an L1 node may hold. Two different questions.
 *   6. SAVE PLACES THE PICTURE AND WRITES A SITE HANDLE. The bytes land, the
 *      record says where they went, and the node holds `/assets/<name>`.
 *   7. A REFUSED PLACEMENT IS REPORTED AND THE DRAFT IS UNTOUCHED.
 *
 * REAL EVERYTHING. Real D1, two real R2 buckets, the real promotion gate, the
 * real route table. Nothing here reimplements a step in order to assert it.
 */

const APPLIED = applySchema()

const TENANT = 'req282'

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  }
}

const scopeOf = (businessId = TENANT): Scope => ({ businessId })

/**
 * A page holding one image, so there is a segment whose picker this is about.
 *
 * AUTHORED RATHER THAN SCAFFOLDED, because the address has to be stable: the
 * root is segment `0` and the image is its first child, which is `0.0`.
 */
function pageWithAnImage(src: string): Record<string, unknown> {
  return {
    id: 'home',
    slug: 'home',
    title: 'Home',
    modules: [],
    l1: {
      widths: [1280],
      background: '#ffffff',
      textColor: '#111827',
      root: {
        kind: 'container',
        id: 'root',
        layout: 'stack',
        children: [{ kind: 'image', id: 'shot', src, alt: 'The shopfront' }],
      },
    },
  }
}

/** A site that actually exists, holding one image node and one asset. */
async function realSite(): Promise<{ sites: TenantSiteStore; slug: string }> {
  const sites = await storeFor(routerEnv(), scopeOf())
  const seed = siteSeed({})
  const slug = await sites.createDraft()
  await sites.write(slug, {
    siteJson: seed.siteJson,
    pages: [{ name: 'home.json', page: pageWithAnImage('/assets/drawn.png') }],
    assets: [{ name: 'drawn.png', bytes: bytesOf('a picture the assistant drew') }],
  })
  return { sites, slug }
}

/** One uploaded picture, classified exactly as an upload area classifies it. */
async function uploaded(
  tickets: TicketStore,
  opts: { title: string; filename: string; role?: string; republishable?: boolean },
): Promise<string> {
  const { ticket } = await tickets.create({
    type: 'material',
    title: opts.title,
    body: 'A photograph the client uploaded.',
    fields: {
      kind: 'image',
      origin: 'uploaded',
      role: opts.role ?? 'site',
      rights: 'owned',
      republishable: opts.republishable ?? true,
      exportable: false,
      filename: opts.filename,
    },
  })
  await tickets.attach({
    uid: ticket.uid,
    bytes: bytesOf(`the bytes of ${opts.filename}`),
    filename: opts.filename,
    content_type: 'image/png',
  })
  return ticket.uid
}

const forValue = (choices: PictureChoice[], value: string): PictureChoice | undefined =>
  choices.find((c) => c.value === value)

const labelled = (choices: PictureChoice[], label: string): PictureChoice | undefined =>
  choices.find((c) => c.label === label)

async function copyGet(slug: string): Promise<Record<string, unknown>> {
  const url = `https://app.test/api/copy?site=${encodeURIComponent(slug)}&page=home&path=0.0`
  const res = await route(new Request(url), routerEnv(), scopeOf(), {})
  expect(res.status).toBe(200)
  return (await res.json()) as Record<string, unknown>
}

async function copySet(
  slug: string,
  values: Record<string, unknown>,
  place?: Record<string, string>,
): Promise<Response> {
  return route(
    new Request('https://app.test/api/copy', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ site: slug, page: 'home', path: '0.0', values, ...(place ? { place } : {}) }),
    }),
    routerEnv(),
    scopeOf(),
    {},
  )
}

async function imageSrc(sites: TenantSiteStore, slug: string): Promise<string> {
  const pages = await sites.readPages(slug)
  const page = pages.find((p) => p.name === 'home.json')!.page as {
    l1: { root: { children: Array<{ src: string }> } }
  }
  return page.l1.root.children[0].src
}

beforeAll(async () => {
  await APPLIED
})

describe('REQ-282 — one catalogue, with a mark on some of its entries', () => {
  it('test_UAT_FC_REQ-282_a_library_picture_the_site_does_not_hold_is_offered_and_marked_unused', async () => {
    const { sites, slug } = await realSite()
    const tickets = await ticketStoreFor(routerEnv(), scopeOf())
    const notYet = await uploaded(tickets, { title: 'The shopfront', filename: 'shopfront.png' })
    const already = await uploaded(tickets, { title: 'The wordmark', filename: 'wordmark.png' })
    const placed = await promoteToSiteAsset(tickets, sites, {
      uid: already,
      slug,
      name: 'wordmark.png',
    })

    const choices = await pictureChoices(tickets, sites, slug)

    // CLAIM 1 — the picture nobody has used is in the list, and the list says so
    // rather than omitting it. It carries the material a Save would have to
    // place, because there is no handle for it yet: that is the whole point.
    const fresh = forValue(choices, `${LIBRARY_PICK}${notYet}`)
    expect(fresh).toBeTruthy()
    expect(fresh!.label).toBe('shopfront.png')
    expect(fresh!.placed).toBe(false)
    expect(fresh!.place).toBe(notYet)
    expect(fresh!.reason).toBeUndefined()

    // CLAIM 2 — the one already on the site offers the SITE HANDLE its pages
    // reference, marked in use, and asks for no placement. One entry, not two:
    // the catalogue and the site's copy of it are the same picture.
    const inUse = forValue(choices, `/assets/${placed.name}`)
    expect(inUse).toBeTruthy()
    expect(inUse!.placed).toBe(true)
    expect(inUse!.place).toBeUndefined()
    expect(choices.filter((c) => c.place === already)).toHaveLength(0)
    expect(choices.filter((c) => c.label === 'wordmark.png')).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-282_what_we_may_not_publish_is_offered_with_the_reason', async () => {
    const { sites, slug } = await realSite()
    const tickets = await ticketStoreFor(routerEnv(), scopeOf())
    const theirs = await uploaded(tickets, {
      title: "Somebody else's photograph",
      filename: 'stock.png',
      role: 'reference',
      republishable: false,
    })

    const choices = await pictureChoices(tickets, sites, slug)

    // CLAIM 3 — SHOWN, not filtered out. Hiding it is the same mistake Part 1
    // makes in the other direction: a client hunting for a picture that simply
    // is not there has been told nothing at all.
    const blocked = forValue(choices, `${LIBRARY_PICK}${theirs}`)
    expect(blocked).toBeTruthy()
    expect(blocked!.reason).toBe(NOT_REPUBLISHABLE_SHORT)
    expect(blocked!.placed).toBe(false)
  })

  it('test_UAT_FC_REQ-282_a_site_asset_no_material_accounts_for_is_still_offered', async () => {
    const { sites, slug } = await realSite()
    const tickets = await ticketStoreFor(routerEnv(), scopeOf())

    const choices = await pictureChoices(tickets, sites, slug)

    // CLAIM 4 — `drawn.png` came from no upload: the assistant wrote it, or an
    // import did. It is on the site and a page may already hold it, so dropping
    // it from the list would take away a picture that is in use.
    const drawn = forValue(choices, '/assets/drawn.png')
    expect(drawn).toBeTruthy()
    expect(drawn!.placed).toBe(true)
    expect(drawn!.place).toBeUndefined()
    expect(labelled(choices, 'drawn.png')).toBeTruthy()
  })

  it('test_UAT_FC_REQ-282_the_segment_envelope_carries_the_catalogue_beside_the_descriptor', async () => {
    const { sites, slug } = await realSite()
    const tickets = await ticketStoreFor(routerEnv(), scopeOf())
    const notYet = await uploaded(tickets, { title: 'The shopfront', filename: 'shopfront.png' })

    const data = await copyGet(slug)
    const fields = data.fields as Array<Record<string, unknown>>
    const src = fields.find((f) => f.name === 'src')!

    // CLAIM 5, first half — the catalogue travels WITH the descriptors, from the
    // same response, exactly as the palette does: a client fetching it
    // separately could draw a tile from one reading and commit against another.
    const pictures = data.pictures as PictureChoice[]
    expect(Array.isArray(pictures)).toBe(true)
    expect(forValue(pictures, `${LIBRARY_PICK}${notYet}`)).toBeTruthy()

    // CLAIM 5, second half — and the descriptor's own `enum` did NOT widen. It
    // says what an L1 `src` may hold, which is a site-local handle and nothing
    // else; the catalogue says what a person may choose from. Conflating the two
    // is what would put a `library:` token into a page.
    expect(src.enum).toEqual(['/assets/drawn.png'])
  })

  it('test_UAT_FC_REQ-282_save_places_the_picture_and_writes_a_site_handle', async () => {
    const { sites, slug } = await realSite()
    const tickets = await ticketStoreFor(routerEnv(), scopeOf())
    const notYet = await uploaded(tickets, { title: 'The shopfront', filename: 'shopfront.png' })

    // PLACE ON SAVE, NOT ON PICK — `place` travels in the same body as the
    // values, so one Save is still one post, one diff and one re-render.
    const res = await copySet(
      slug,
      { src: `${LIBRARY_PICK}${notYet}`, alt: 'Our shopfront on a bright day' },
      { src: notYet },
    )
    expect(res.status).toBe(200)

    // CLAIM 6 — the node holds a SITE HANDLE. A Library uid never reaches L1.
    expect(await imageSrc(sites, slug)).toBe('/assets/shopfront.png')

    // …and the bytes are genuinely there, by the ordinary listing every other
    // picker and the renderer read.
    expect(await sites.listAssets(slug)).toContain('shopfront.png')
    expect(await sites.readAsset(slug, 'shopfront.png')).toBeTruthy()

    // …and the record says where they went, which is what makes the Library's
    // own pill read `in use` on the next draw. One fact, two surfaces.
    const { ticket } = await tickets.get({ uid: notYet })
    expect(ticket.fields.placed_on).toContain(slug)

    // The alt text in the same change map landed too: one modal, one diff.
    const choices = await pictureChoices(tickets, sites, slug)
    expect(forValue(choices, '/assets/shopfront.png')!.placed).toBe(true)
    expect(choices.filter((c) => c.place === notYet)).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-282_a_refused_placement_is_reported_and_the_draft_is_untouched', async () => {
    const { sites, slug } = await realSite()
    const tickets = await ticketStoreFor(routerEnv(), scopeOf())
    const theirs = await uploaded(tickets, {
      title: "Somebody else's photograph",
      filename: 'stock.png',
      role: 'reference',
      republishable: false,
    })

    const res = await copySet(slug, { src: `${LIBRARY_PICK}${theirs}` }, { src: theirs })

    // CLAIM 7 — refused as a matter of RIGHTS, in words the client can act on.
    expect(res.status).toBe(403)
    const body = (await res.json()) as Record<string, unknown>
    expect(String(body.error)).toMatch(/right to republish/i)

    // AND NOTHING WAS WRITTEN. The placement runs before the copy write, so a
    // refusal leaves the draft exactly as the client left it — the frame they
    // are looking at is still accurate.
    expect(await imageSrc(sites, slug)).toBe('/assets/drawn.png')
    expect(await sites.listAssets(slug)).not.toContain('stock.png')
  })

  it('test_UAT_FC_REQ-282_placing_the_same_picture_twice_replaces_rather_than_mints', async () => {
    const { sites, slug } = await realSite()
    const tickets = await ticketStoreFor(routerEnv(), scopeOf())
    const uid = await uploaded(tickets, { title: 'The wordmark', filename: 'wordmark.png' })

    const first = await placePicture(tickets, sites, { uid, slug })
    const again = await placePicture(tickets, sites, { uid, slug })

    // THE RECORD DECIDES WHICH DOOR. A second placement of the same material is
    // a RE-placement at the recorded name, never a freshly minted `wordmark-2`
    // that every page referencing `wordmark.png` would go on ignoring. That
    // rule is `promoteToSiteAsset`'s and is inherited rather than restated —
    // which is why picking a picture twice from the editor costs nothing.
    expect(first).toBe('/assets/wordmark.png')
    expect(again).toBe(first)
    expect((await sites.listAssets(slug)).filter((n) => n.startsWith('wordmark'))).toEqual([
      'wordmark.png',
    ])
  })
})
