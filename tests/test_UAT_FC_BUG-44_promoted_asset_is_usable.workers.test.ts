import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import type { RouterEnv } from '../apps/control-app/src/router'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { NotRepublishableError, promoteToSiteAsset } from '../apps/control-app/src/material'
import { storeFor } from '../apps/control-app/src/store'
import { editAssetGet, editAssetList } from '../tools/generate/src/cli/edit'
import type { SiteAsset } from '../tools/generate/src/cli/edit'
import type { Scope } from '../apps/control-app/src/scope'
import { applySchema } from './support/d1-site-factory'
import { bytesOf } from './support/material-fixtures'
import { siteSeed } from './support/site-seed'

/**
 * BUG-44 — **a file dropped on "Put it on the site" is an ordinary asset**.
 *
 * WHAT WENT WRONG. A client dropped an image on the chat and asked for it in the
 * hero. The assistant drew a simplified substitute instead and, challenged,
 * explained that the file was "stored as an unregistered asset" and that only
 * registered assets can be referenced — so the client should go and register it
 * through the builder's asset manager.
 *
 * Every load-bearing claim in that was something we had told it, and the thing we
 * had told it about did not need to exist. `site.json` carried an `assets` array
 * that promotion wrote past, `get_asset` read alone, and NOTHING ELSE READ AT ALL:
 * not the renderer, not publish, not import, not the picker. BUG-45 set out to
 * keep it in step; BUG-44 removed it instead, so there is no second source to fall
 * out of step with and no state a present file can be in but "usable".
 *
 * These cover the mechanical half — that a promoted file is listed, readable and
 * journalled, and that the gates around promotion survive the deletion. The
 * declaration's own half is `test_UAT_FC_BUG-44_surface_tells_the_truth`.
 */

const APPLIED = applySchema()

const TENANT = 'bug44'

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

/** A site that actually exists — draft plus the scaffolder's own definition. */
async function realSite(slug: string) {
  const sites = await storeFor(routerEnv(), scopeOf())
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
  const tickets = await ticketStoreFor(routerEnv(), scopeOf())
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

describe('BUG-44 — a promoted upload is an ordinary, usable asset', () => {
  beforeAll(async () => {
    await APPLIED
  })

  it('test_UAT_FC_BUG-44_a_promoted_file_is_listed_and_readable_like_any_other', async () => {
    // THE WHOLE BUG IN ONE ASSERTION. `registered` was false for every file a
    // client had ever dropped, and the assistant read that in the listing and
    // concluded — reasonably, given what the manual said — that the file was
    // unusable. There is no such flag now: a file the store holds is an asset,
    // and the only question anyone can ask about it is answerable.
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

    expect(asset.onDisk).toBe(true)
    // The handle a picture element holds — the thing that actually goes on a page.
    expect(asset.src).toBe('/assets/logo.png')
    // Nothing on the entry can be read as permission to use it.
    expect(asset).not.toHaveProperty('registered')
    // `get_asset` agrees with the listing, which is the contradiction that
    // taught the assistant something false.
    expect((await editAssetGet(slug, 'logo.png', opts)).data.asset).toEqual(asset)

    // The bytes are really there, and are the client's own.
    const read = await sites.readAsset(slug, 'logo.png')
    expect(new TextDecoder().decode(read as Uint8Array)).toBe('the client’s own logo')
  })

  it('test_UAT_FC_BUG-44_the_promotion_is_recorded_as_a_draft_change', async () => {
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

  it('test_UAT_FC_BUG-44_a_colliding_name_is_renamed_and_never_replaces', async () => {
    // PROMOTION ADDS; IT NEVER REPLACES. A second `logo.png` must not overwrite a
    // picture already live on the client's site. The rename predates BUG-44 and
    // has to survive it: removing the registry removed the whole-definition
    // validation that used to run before a byte was stored, so this is now the
    // only thing standing between a second upload and the first one's bytes.
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
    expect(found(assets, 'logo.png').src).toBe('/assets/logo.png')
    expect(found(assets, 'logo-2.png').src).toBe('/assets/logo-2.png')

    // The first picture is untouched — that is what "only adds" has to mean.
    const original = await sites.readAsset(slug, 'logo.png')
    expect(new TextDecoder().decode(original as Uint8Array)).toBe('first bytes')
  })

  it('test_UAT_FC_BUG-44_a_refused_promotion_stores_nothing', async () => {
    // [[DOC-38]] §5's invariant has to survive a change to what promotion writes.
    // A refusal that left bytes behind would be worse than the original bug: the
    // site would hold a third-party picture it has no right to publish.
    const { sites, slug } = await realSite('refused')
    const tickets = await ticketStoreFor(routerEnv(), scopeOf())
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

  it('test_UAT_FC_BUG-44_get_asset_answers_for_a_file_nothing_declared', async () => {
    // THE CONTRADICTION THAT TAUGHT THE ASSISTANT SOMETHING FALSE. `list_assets`
    // used to report the union of the registry and the store, so a file with
    // bytes and no `site.json` entry was listed — and `get_asset` on that same
    // name raised NOT_FOUND. This is the capture-fold case: `1c repro` mirrors
    // bytes into `draft/assets/` and never declared any of them, so every
    // captured site's images were in exactly that state and perfectly usable.
    // With the registry gone it is simply the ordinary case.
    const { sites, slug } = await realSite('unregistered')
    await sites.write(slug, { assets: [{ name: 'mirrored.png', bytes: bytesOf('captured') }] })

    const opts = { store: sites, actor: 'client' as const }
    const listed = found((await editAssetList(slug, opts)).data.assets as SiteAsset[], 'mirrored.png')

    // It answers, and in the listing's own vocabulary rather than a second one.
    const got = (await editAssetGet(slug, 'mirrored.png', opts)).data.asset as SiteAsset
    expect(got).toEqual(listed)
    expect(got.src).toBe('/assets/mirrored.png')
    expect(got.kind).toBe('image')

    // And by the handle a PAGE holds, which is what a caller reading a picture
    // element actually has in hand.
    const byHandle = (await editAssetGet(slug, '/assets/mirrored.png', opts)).data.asset
    expect(byHandle).toEqual(listed)
  })

  it('test_UAT_FC_BUG-44_get_asset_still_refuses_a_name_the_site_does_not_have', async () => {
    // The fallback widens what can be found; it must not make NOT_FOUND
    // unreachable, or a mistyped name would come back as a usable answer.
    const { sites, slug } = await realSite('missing')
    const opts = { store: sites, actor: 'client' as const }
    await expect(editAssetGet(slug, 'nope.png', opts)).rejects.toThrow(/not found/i)
  })
})
