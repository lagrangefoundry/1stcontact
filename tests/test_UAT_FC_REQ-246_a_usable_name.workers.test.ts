import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import type { RouterEnv } from '../apps/control-app/src/router'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { promoteToSiteAsset } from '../apps/control-app/src/material'
import { storeFor } from '../apps/control-app/src/store'
import { editAssetList, editAssetReplace } from '../tools/generate/src/cli/edit'
import type { SiteAsset } from '../tools/generate/src/cli/edit'
import { UnsafeAssetNameError } from '../tools/generate/src/store/asset-name'
import { contentTypeOf } from '../tools/generate/src/store/content-type'
import type { Scope } from '../apps/control-app/src/scope'
import { applySchema } from './support/d1-site-factory'
import { bytesOf } from './support/material-fixtures'
import { siteSeed } from './support/site-seed'

/**
 * REQ-246 §3, §5 AC6–AC11 — **a file keeps a usable name.**
 *
 * THE FAILURE THIS SUITE IS ABOUT. Nothing sanitised a filename anywhere on the
 * path from a file dropped on the conversation to an object in R2. The client's
 * own name became the site asset name and the asset name became the key suffix,
 * so `How_Can_You_Trust_the_Code_Your_AI_Writes?.pdf` is a real key with a
 * literal `?` in it — a name equal to the one a page references only if every
 * reader between them encodes and decodes identically. The only rule applied
 * anywhere was a separator check that skipped the write with `continue`, so the
 * bytes vanished and the caller was told the write had succeeded.
 *
 * WHAT IS REAL HERE. All of it, against genuine bindings. `promoteToSiteAsset` is
 * the shipped function the "Put it on the site" button calls, over a real ticket
 * store in real D1 with real R2 blobs, writing through the real `editAssetAdd`
 * into the real `d1r2SiteStore`. Nothing between the client's filename and the
 * R2 key is doubled, which is the only way to prove a property about a key.
 *
 * THE PURE RULE — every shape `sanitizeAssetName` has to answer for — is
 * `test_UAT_FC_REQ-246_one_content_type_table`'s sibling on the node side,
 * `test_UAT_FC_REQ-246_safe_names.test.ts`. These cases are about the path.
 */

const APPLIED = applySchema()

const TENANT = 'req246'

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  }
}

const scopeOf = (businessId = TENANT): Scope => ({ businessId })

/** A site that actually exists — draft plus the scaffolder's own definition. */
async function realSite(slug: string) {
  const sites = await storeFor(routerEnv(), scopeOf())
  const seed = siteSeed({ slug })
  const site = await sites.createDraft()
  await sites.write(site, {
    siteJson: seed.siteJson,
    pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page })),
  })
  return { sites, slug: site }
}

/** One uploaded file, classified exactly as the "Put it on the site" area does. */
async function uploaded(opts: {
  title: string
  filename: string
  bytes: string
  contentType?: string
}) {
  const tickets = await ticketStoreFor(routerEnv(), scopeOf())
  const { ticket } = await tickets.create({
    type: 'material',
    title: opts.title,
    body: 'A file the client uploaded.',
    fields: {
      kind: opts.contentType === 'application/pdf' ? 'document' : 'image',
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
    content_type: opts.contentType ?? 'image/png',
  })
  return { tickets, ticket }
}

/**
 * Put a client's file on a site under its own filename — the whole path, exactly
 * as the Library's "Use on site" button drives it.
 */
async function place(
  sites: Awaited<ReturnType<typeof realSite>>['sites'],
  slug: string,
  file: { title: string; filename: string; bytes: string; contentType?: string },
): Promise<string> {
  const { tickets, ticket } = await uploaded(file)
  const placed = await promoteToSiteAsset(tickets, sites, {
    uid: ticket.uid,
    slug,
    name: file.filename,
  })
  return placed.name
}

const opts = (sites: Awaited<ReturnType<typeof realSite>>['sites']) =>
  ({ store: sites, actor: 'client' as const })

const listed = async (
  sites: Awaited<ReturnType<typeof realSite>>['sites'],
  slug: string,
): Promise<SiteAsset[]> => (await editAssetList(slug, opts(sites))).data.assets as SiteAsset[]

describe('REQ-246 — a file arriving from a client keeps a usable name', () => {
  beforeAll(async () => {
    await APPLIED
  })

  // ── AC6 ────────────────────────────────────────────────────────────────────

  it('test_UAT_FC_REQ_246_an_awkward_filename_is_stored_under_a_safe_one', async () => {
    const { sites, slug } = await realSite('awkward')

    // THE REAL FILENAME FROM THE REAL INCIDENT, plus one of each shape §5 AC6
    // enumerates: a space, a `#`, a `%`, and a path a directory upload hands over.
    const cases: Array<{ filename: string; expected: string }> = [
      {
        filename: 'How_Can_You_Trust_the_Code_Your_AI_Writes?.pdf',
        expected: 'How_Can_You_Trust_the_Code_Your_AI_Writes.pdf',
      },
      { filename: 'my holiday photo.jpg', expected: 'my-holiday-photo.jpg' },
      { filename: 'price list #2.pdf', expected: 'price-list-2.pdf' },
      { filename: '100% organic.png', expected: '100-organic.png' },
      { filename: 'Pictures/2026/logo.svg', expected: 'logo.svg' },
      { filename: 'C:\\Users\\alice\\mark.png', expected: 'mark.png' },
    ]

    for (const { filename, expected } of cases) {
      const name = await place(sites, slug, {
        title: `The file called ${filename}`,
        filename,
        bytes: `bytes of ${filename}`,
        contentType: filename.endsWith('.pdf') ? 'application/pdf' : 'image/png',
      })

      expect(name, filename).toBe(expected)
      // NOT ONE OF THEM SURVIVES. This is the assertion the R2 key with a
      // literal `?` in it would have failed.
      expect(name).not.toMatch(/[?#%\s/\\]/)
      // AND THE EXTENSION IS PRESERVED, because it is what every consumer reads
      // the type from — which is the other half of the ticket meeting this one.
      expect(name.slice(name.lastIndexOf('.')), filename).toBe(
        filename.slice(filename.lastIndexOf('.')),
      )
      // The bytes really are at that name.
      const read = await sites.readAsset(slug, name)
      expect(new TextDecoder().decode(read as Uint8Array), filename).toBe(`bytes of ${filename}`)
    }

    // AC1's storage half, on the path this ticket is actually about: a PDF the
    // client dropped is stored as a PDF, not as bytes.
    expect(contentTypeOf('How_Can_You_Trust_the_Code_Your_AI_Writes.pdf')).toBe('application/pdf')
  })

  // ── AC7 ────────────────────────────────────────────────────────────────────

  it('test_UAT_FC_REQ_246_a_name_that_sanitises_to_nothing_is_still_usable', async () => {
    const { sites, slug } = await realSite('nothing')

    // A NAME MADE ENTIRELY OF CHARACTERS THAT CANNOT SURVIVE. Refusing the
    // client's file over its filename is not a thing this product should do, so
    // the rule is total: every input yields a name somebody can type.
    const first = await place(sites, slug, {
      title: 'A file whose name is only punctuation',
      filename: '???',
      bytes: 'first',
    })
    expect(first).not.toBe('')
    expect(first).toMatch(/^[A-Za-z0-9._-]+$/)

    // AND UNIQUE. A second one cannot silently land on the first.
    const second = await place(sites, slug, {
      title: 'Another file whose name is only punctuation',
      filename: '***',
      bytes: 'second',
    })
    expect(second).not.toBe(first)

    expect(new TextDecoder().decode((await sites.readAsset(slug, first)) as Uint8Array)).toBe(
      'first',
    )
    expect(new TextDecoder().decode((await sites.readAsset(slug, second)) as Uint8Array)).toBe(
      'second',
    )
  })

  // ── AC8 ────────────────────────────────────────────────────────────────────

  it('test_UAT_FC_REQ_246_two_files_that_sanitise_alike_are_two_assets', async () => {
    const { sites, slug } = await realSite('collide')

    // SANITISING IS NOT DEDUPLICATING. These are two different papers with two
    // different names, and they sanitise to the same string. Before the
    // sanitiser ran ahead of `freeAssetName`, the collision check asked about
    // names that would never exist, judged both free, and let the second land on
    // top of the first.
    const first = await place(sites, slug, {
      title: 'The first whitepaper',
      filename: 'whitepaper (1).pdf',
      bytes: 'the first paper',
      contentType: 'application/pdf',
    })
    const second = await place(sites, slug, {
      title: 'The second whitepaper',
      filename: 'whitepaper #1.pdf',
      bytes: 'the second paper',
      contentType: 'application/pdf',
    })

    expect(first).toBe('whitepaper-1.pdf')
    expect(second).toBe('whitepaper-1-2.pdf')

    const assets = await listed(sites, slug)
    expect(assets.map((a) => a.id).sort()).toEqual([first, second].sort())

    // THE PAGE REFERENCING THE FIRST STILL RESOLVES IT — which is the half that
    // matters, because the failure is not "two rows" but "the client's live
    // picture silently became somebody else's".
    const handle = assets.find((a) => a.id === first)!.src
    expect(handle).toBe(`/assets/${first}`)
    const referenced = handle.slice('/assets/'.length)
    expect(new TextDecoder().decode((await sites.readAsset(slug, referenced)) as Uint8Array)).toBe(
      'the first paper',
    )
  })

  // ── AC9 ────────────────────────────────────────────────────────────────────

  it('test_UAT_FC_REQ_246_the_referenced_name_and_the_stored_name_are_byte_identical', async () => {
    const { sites, slug } = await realSite('identical')

    for (const filename of [
      'Café Menu (Spring 2026).pdf',
      'hero image@2x.png',
      'terms & conditions.pdf',
      'a  b   c.svg',
    ]) {
      const name = await place(sites, slug, {
        title: filename,
        filename,
        bytes: `bytes of ${filename}`,
        contentType: filename.endsWith('.pdf') ? 'application/pdf' : 'image/png',
      })

      // NOTHING IN THE NAME NEEDS ENCODING. The stored name, the handle a page
      // node carries and the URL path segment a visitor requests are one string —
      // so "equal" stops depending on every reader encoding identically, which is
      // what a name should never have been asked to depend on.
      expect(encodeURIComponent(name), filename).toBe(name)

      const asset = (await listed(sites, slug)).find((a) => a.id === name)!
      expect(asset.src).toBe(`/assets/${name}`)
      expect(new URL(asset.src, 'https://example.test').pathname).toBe(`/assets/${name}`)
    }
  })

  // ── AC10 ───────────────────────────────────────────────────────────────────

  it('test_UAT_FC_REQ_246_a_name_that_cannot_be_made_safe_is_refused_out_loud', async () => {
    const { sites, slug } = await realSite('refused')

    // THE STORE'S OWN FLOOR, reached directly because no surface above it can
    // produce one of these any more — which is exactly why the refusal has to be
    // here rather than at the surface. It used to `continue`: no object, no row,
    // and a `write` that returned as though it had done what it was asked.
    for (const name of ['nested/logo.png', 'back\\slash.png', '..', '']) {
      await expect(
        sites.write(slug, { assets: [{ name, bytes: new TextEncoder().encode('x') }] }),
        name,
      ).rejects.toThrow(UnsafeAssetNameError)
      // THE ERROR NAMES THE FILE, because the operator reading it is looking for
      // which upload went missing, not for a category.
      await expect(
        sites.write(slug, { assets: [{ name, bytes: new TextEncoder().encode('x') }] }),
      ).rejects.toThrow(name === '' ? /is not a name/ : new RegExp(name.replace(/[\\.]/g, '\\$&')))
    }

    // AND THE BYTES ARE REALLY NOT THERE — the write refused rather than half
    // landing, so nothing in the listing claims an asset the bucket does not hold.
    expect((await listed(sites, slug)).map((a) => a.id)).toEqual([])

    // A CHANGE SET IS ONE ACT. One bad name in a batch takes the whole batch with
    // it rather than writing the good ones and complaining afterwards.
    await expect(
      sites.write(slug, {
        assets: [
          { name: 'good.png', bytes: new TextEncoder().encode('good') },
          { name: 'bad/name.png', bytes: new TextEncoder().encode('bad') },
        ],
      }),
    ).rejects.toThrow(UnsafeAssetNameError)
    expect(await sites.readAsset(slug, 'good.png')).toBeNull()
  })

  // ── AC11 ───────────────────────────────────────────────────────────────────

  it('test_UAT_FC_REQ_246_an_asset_already_stored_awkwardly_goes_on_resolving', async () => {
    const { sites, slug } = await realSite('legacy')

    // A SITE AS IT STANDS TODAY: an asset written before the rule existed, under
    // a name the rule would not mint. Deploying the rule must not make it
    // unreachable — the bytes are live on a client's published site and a page
    // references them by that exact name.
    const LEGACY = 'How_Can_You_Trust_the_Code_Your_AI_Writes?.pdf'
    await sites.write(slug, {
      assets: [{ name: LEGACY, bytes: new TextEncoder().encode('the original paper') }],
    })

    // It lists, and it reads.
    expect((await listed(sites, slug)).map((a) => a.id)).toContain(LEGACY)
    expect(new TextDecoder().decode((await sites.readAsset(slug, LEGACY)) as Uint8Array)).toBe(
      'the original paper',
    )

    // AND IT IS STILL REPLACEABLE UNDER ITS OWN NAME. `editAssetReplace`
    // deliberately does not sanitise: it ADDRESSES a name rather than minting
    // one, and sanitising here would turn every re-placement of a legacy asset
    // into a `NOT_FOUND` for bytes that are plainly there.
    await editAssetReplace(
      slug,
      LEGACY,
      new TextEncoder().encode('the corrected paper'),
      opts(sites),
    )
    expect(new TextDecoder().decode((await sites.readAsset(slug, LEGACY)) as Uint8Array)).toBe(
      'the corrected paper',
    )

    // Renaming it is a deliberate act somebody takes, not something a deploy did
    // to them — so the awkward name is still what is there until then.
    expect((await listed(sites, slug)).map((a) => a.id)).toContain(LEGACY)
  })
})
