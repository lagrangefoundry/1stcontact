import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import type { RouterEnv } from '../apps/control-app/src/router'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { NotRepublishableError, promoteToSiteAsset } from '../apps/control-app/src/material'
import { storeFor } from '../apps/control-app/src/store'
import { editAssetGet, editAssetList } from '../tools/generate/src/cli/edit'
import type { SiteAsset } from '../tools/generate/src/cli/edit'
import { applySchema } from './support/d1-site-factory'
import { bytesOf } from './support/material-fixtures'
import { siteSeed } from './support/site-seed'

/**
 * BUG-45 — **a file dropped on "Put it on the site" is a first-class asset**.
 *
 * WHAT WENT WRONG. A client dropped an image on the chat and asked for it in the
 * hero. The assistant drew a simplified substitute instead and, challenged,
 * explained that the file was "stored as an unregistered asset" and that only
 * registered assets can be referenced — so the client should go and register it
 * through the builder's asset manager.
 *
 * Every load-bearing claim in that was something we had told it. `promoteToSiteAsset`
 * wrote the bytes with `siteJson` omitted, so `site.json`'s `assets` array never
 * learned about the file and the listing reported it `(unregistered)`. `get_asset`
 * read the registry alone, so the same asset the listing had just shown raised
 * NOT_FOUND. And the declared surface still carried an absence saying a file could
 * not arrive through a conversation at all.
 *
 * These cover the mechanical half — the registry entry, its alt text, the gates
 * that must survive it, and the two operations agreeing on what an asset is. The
 * declaration's own half is `test_UAT_FC_BUG-45_surface_tells_the_truth`.
 */

const APPLIED = applySchema()

const TENANT = 'bug45'

function routerEnv(tenantId = TENANT): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: tenantId,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  }
}

/** A site that actually exists — draft plus the scaffolder's own definition. */
async function realSite(slug: string) {
  const sites = await storeFor(routerEnv())
  const seed = siteSeed({ slug })
  await sites.createDraft(seed.slug)
  await sites.write(seed.slug, {
    siteJson: seed.siteJson,
    pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page })),
  })
  return { sites, slug: seed.slug }
}

/** One uploaded image, classified exactly as the "Put it on the site" area does. */
async function uploadedImage(opts: { title: string; filename: string; bytes: string }) {
  const tickets = await ticketStoreFor(routerEnv())
  const { ticket } = await tickets.create({
    type: 'material',
    title: opts.title,
    body: 'A photograph the client uploaded.',
    fields: {
      kind: 'image',
      origin: 'uploaded',
      role: 'site',
      rights: 'owned',
      republishable: true,
      exportable: false,
      filename: opts.filename,
    },
  })
  await tickets.attach({
    uid: ticket.uid,
    bytes: bytesOf(opts.bytes),
    filename: opts.filename,
    content_type: 'image/png',
  })
  return { tickets, ticket }
}

function found(assets: SiteAsset[], name: string): SiteAsset {
  const asset = assets.find((a) => a.id === name)
  if (!asset) throw new Error(`'${name}' is not in the listing: ${assets.map((a) => a.id)}`)
  return asset
}

describe('BUG-45 — a promoted upload is a registered asset', () => {
  beforeAll(async () => {
    await APPLIED
  })

  it('test_UAT_FC_BUG-45_promotion_registers_the_asset_and_carries_its_description', async () => {
    // THE FIX, AND THE WHOLE BUG IN ONE ASSERTION. `registered` was false for
    // every file a client had ever dropped, because promotion wrote bytes past
    // the only two functions that touch `site.json`'s `assets` array. The
    // assistant read the resulting `(unregistered)` in the listing and concluded
    // — reasonably, given what the manual said — that the file was unusable.
    const { sites, slug } = await realSite('promoted')
    const { tickets, ticket } = await uploadedImage({
      title: 'Gigabyte Alchemy gold "A" logo on a navy background',
      filename: 'logo.png',
      bytes: 'the client’s own logo',
    })

    const promoted = await promoteToSiteAsset(tickets, sites, {
      uid: ticket.uid,
      slug,
      name: 'logo.png',
    })
    expect(promoted.name).toBe('logo.png')

    const opts = { store: sites, actor: 'client' as const }
    const asset = found((await editAssetList(slug, opts)).data.assets as SiteAsset[], 'logo.png')

    expect(asset.registered).toBe(true)
    expect(asset.onDisk).toBe(true)
    // The handle a picture element holds — the thing that actually goes on a page.
    expect(asset.src).toBe('/assets/logo.png')
    // AND THE DESCRIPTION WE ALREADY PAID FOR. Ingestion describes every uploaded
    // image; that description was computed, stored on the material ticket, and
    // then dropped at the one moment a site asset was created that wanted it.
    expect(asset.alt).toBe('Gigabyte Alchemy gold "A" logo on a navy background')

    // The bytes are really there, and are the client's own.
    const read = await sites.readAsset(slug, 'logo.png')
    expect(new TextDecoder().decode(read as Uint8Array)).toBe('the client’s own logo')
  })

  it('test_UAT_FC_BUG-45_the_promotion_is_recorded_as_a_draft_change', async () => {
    // SO THE ASSISTANT IS TOLD, rather than having to notice. Promotion used to
    // write bytes with no journal record at all, so a file could arrive on the
    // site between two turns and nothing in the conversation would say so — which
    // is half of why the assistant reached for a drawing instead of the picture
    // sitting in the site's own list.
    const { sites, slug } = await realSite('journalled')
    const { tickets, ticket } = await uploadedImage({
      title: 'The kitchen at dusk',
      filename: 'kitchen.png',
      bytes: 'a photograph',
    })

    const before = (await sites.changesSince(slug)).changes
    await promoteToSiteAsset(tickets, sites, { uid: ticket.uid, slug, name: 'kitchen.png' })
    const after = (await sites.changesSince(slug)).changes

    expect(after.length).toBeGreaterThan(before.length)
    const record = after[after.length - 1]
    expect(record.op).toBe('asset.add')
    expect(record.label).toBe('kitchen.png')
    // Attributed to the person who dropped it, not to an anonymous tool.
    expect(record.actor).toBe('client')
  })

  it('test_UAT_FC_BUG-45_an_uninformative_title_leaves_alt_empty', async () => {
    // A FILENAME IS NOT A DESCRIPTION. `describe` falls back to the bare filename
    // when there is no model in the loop, and `alt="ChatGPT Image Sep 9, 2025 at
    // 11_24_45 AM.png"` is not alt text — it is the filename read aloud. Empty
    // leaves the field visibly unfilled for someone to write; the filename looks
    // filled and is worse than nothing.
    const { sites, slug } = await realSite('nameless')
    const { tickets, ticket } = await uploadedImage({
      title: 'ChatGPT Image Sep 9, 2025 at 11_24_45 AM.png',
      filename: 'ChatGPT Image Sep 9, 2025 at 11_24_45 AM.png',
      bytes: 'unnamed bytes',
    })

    await promoteToSiteAsset(tickets, sites, {
      uid: ticket.uid,
      slug,
      name: 'ChatGPT Image Sep 9, 2025 at 11_24_45 AM.png',
    })

    const opts = { store: sites, actor: 'client' as const }
    const assets = (await editAssetList(slug, opts)).data.assets as SiteAsset[]
    const asset = found(assets, 'ChatGPT Image Sep 9, 2025 at 11_24_45 AM.png')
    expect(asset.registered).toBe(true)
    expect(asset.alt).toBe('')
  })

  it('test_UAT_FC_BUG-45_a_colliding_name_is_renamed_and_the_renamed_one_is_registered', async () => {
    // PROMOTION ADDS; IT NEVER REPLACES. A second `logo.png` must not overwrite a
    // picture already live on the client's site. The rename behaviour predates
    // this fix — what is new is that the registry entry has to follow the name
    // that was actually used, or the site would carry an entry naming a file that
    // does not exist beside a file nothing describes.
    const { sites, slug } = await realSite('collision')

    const first = await uploadedImage({
      title: 'The first logo',
      filename: 'logo.png',
      bytes: 'first bytes',
    })
    await promoteToSiteAsset(first.tickets, sites, {
      uid: first.ticket.uid,
      slug,
      name: 'logo.png',
    })

    const second = await uploadedImage({
      title: 'The second logo',
      filename: 'logo.png',
      bytes: 'second bytes',
    })
    const promoted = await promoteToSiteAsset(second.tickets, sites, {
      uid: second.ticket.uid,
      slug,
      name: 'logo.png',
    })

    expect(promoted.name).toBe('logo-2.png')

    const opts = { store: sites, actor: 'client' as const }
    const assets = (await editAssetList(slug, opts)).data.assets as SiteAsset[]
    expect(found(assets, 'logo.png').alt).toBe('The first logo')
    expect(found(assets, 'logo-2.png').alt).toBe('The second logo')

    // The first picture is untouched — that is what "only adds" has to mean.
    const original = await sites.readAsset(slug, 'logo.png')
    expect(new TextDecoder().decode(original as Uint8Array)).toBe('first bytes')
  })

  it('test_UAT_FC_BUG-45_a_refused_promotion_registers_nothing', async () => {
    // [[DOC-38]] §5's invariant has to survive the change that made promotion
    // write more, not less. A refusal that left a registry entry behind would be
    // worse than the original bug: the site would describe a third-party picture
    // it does not hold the right to publish.
    const { sites, slug } = await realSite('refused')
    const tickets = await ticketStoreFor(routerEnv())
    const { ticket } = await tickets.create({
      type: 'material',
      title: "A competitor's hero image",
      body: 'A photograph from someone else’s site.',
      fields: {
        kind: 'image',
        origin: 'fetched',
        role: 'reference',
        rights: 'third_party',
        republishable: false,
        exportable: true,
        filename: 'theirs.jpg',
        source_url: 'https://competitor.example/hero.jpg',
      },
    })
    await tickets.attach({
      uid: ticket.uid,
      bytes: bytesOf('their bytes'),
      filename: 'theirs.jpg',
      content_type: 'image/jpeg',
    })

    await expect(
      promoteToSiteAsset(tickets, sites, { uid: ticket.uid, slug, name: 'theirs.jpg' }),
    ).rejects.toBeInstanceOf(NotRepublishableError)

    expect(await sites.listAssets(slug)).toEqual([])
    const opts = { store: sites, actor: 'client' as const }
    expect((await editAssetList(slug, opts)).data.assets).toEqual([])
  })

  it('test_UAT_FC_BUG-45_get_asset_answers_for_an_unregistered_file', async () => {
    // THE CONTRADICTION THAT TAUGHT THE ASSISTANT SOMETHING FALSE. `list_assets`
    // reports the union of the registry and the store, so a file with bytes and
    // no `site.json` entry is listed — and `get_asset` on that same name used to
    // raise NOT_FOUND. This is the capture-fold case: `1c repro` mirrors bytes
    // into `draft/assets/` and writes no registry entries at all, so every
    // captured site's images are in exactly this state and are perfectly usable.
    const { sites, slug } = await realSite('unregistered')
    await sites.write(slug, { assets: [{ name: 'mirrored.png', bytes: bytesOf('captured') }] })

    const opts = { store: sites, actor: 'client' as const }
    const listed = found((await editAssetList(slug, opts)).data.assets as SiteAsset[], 'mirrored.png')
    expect(listed.registered).toBe(false)

    // It answers, and in the listing's own vocabulary rather than a second one.
    const got = (await editAssetGet(slug, 'mirrored.png', opts)).data.asset as SiteAsset
    expect(got).toEqual(listed)
    expect(got.src).toBe('/assets/mirrored.png')
    expect(got.kind).toBe('image')
    expect(got.registered).toBe(false)

    // And by the handle a PAGE holds, which is what a caller reading a picture
    // element actually has in hand.
    const byHandle = (await editAssetGet(slug, '/assets/mirrored.png', opts)).data.asset
    expect(byHandle).toEqual(listed)
  })

  it('test_UAT_FC_BUG-45_get_asset_still_refuses_a_name_the_site_does_not_have', async () => {
    // The fallback widens what can be found; it must not make NOT_FOUND
    // unreachable, or a mistyped name would come back as a usable answer.
    const { sites, slug } = await realSite('missing')
    const opts = { store: sites, actor: 'client' as const }
    await expect(editAssetGet(slug, 'nope.png', opts)).rejects.toThrow(/not found/i)
  })
})
