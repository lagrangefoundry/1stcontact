import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { listMaterial } from '../apps/control-app/src/material'
import { applySchema, makeD1Site } from './support/d1-site-factory'
import { bytesOf } from './support/material-fixtures'

/**
 * [[REQ-287]] — **the ingestion envelope carries the name the client can say**.
 *
 * WHAT WAS WRONG. `materialEnvelope` predates [[REQ-280]] and was never revisited
 * when labels arrived, so the one answer a client actually reads — the reply to
 * the file they just dropped — described the material by its uid and its
 * filename and by no name they could repeat. The neighbouring route
 * (`POST /api/material/role`, through `readMaterial`) already projected `label`,
 * so the same material was described with its label on one path and without it
 * on the other.
 *
 * WHAT THIS FILE PROVES, over real D1 and a real site store: that the label is in
 * the envelope, that it is the SAME string the Library lists for that row rather
 * than a second name composed here, that it reaches both ingestion entry points
 * because both compose the same envelope, and that nothing about the asset's
 * address on the site moved — `site_asset` is still the filename the bytes are
 * served under. Its jsdom sibling proves the sentence that spends it.
 *
 * ONE DOUBLE, AND IT IS THE DESCRIBERS, which miniflare cannot reach and about
 * which nothing here claims anything. Every label below is read back off the
 * ticket store's own listing, never off the reply that claims it.
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
function deps(over: Partial<RouterDeps> = {}): RouterDeps {
  return {
    index: async () => async () => {},
    describeText: async () => ({ text: 'A note, digested.', model: 'stub/digest-1' }),
    describeImage: async () => ({ text: 'A logo on a pale field.', model: 'stub/vision-1' }),
    ...over,
  }
}

async function upload(
  tenant: string,
  file: { bytes: Uint8Array; name: string; type: string; role?: string; slug?: string },
): Promise<Record<string, unknown>> {
  const form = new FormData()
  form.append('file', new File([file.bytes as unknown as BlobPart], file.name, { type: file.type }))
  form.append('role', file.role ?? 'site')
  // `site`, NOT `slug` ([[REQ-236]]) — the overlay sends the open site's KEY.
  if (file.slug) form.append('site', file.slug)
  const response = await route(
    new Request('https://app.test/api/material', { method: 'POST', body: form }),
    routerEnv(),
    scopeOf(tenant),
    deps(),
  )
  return (await response.json()) as Record<string, unknown>
}

/** One row's label, off the same listing the client's own Library tab draws. */
async function labelInLibrary(tenant: string, uid: string): Promise<string | null> {
  const tickets = await ticketStoreFor(routerEnv(), scopeOf(tenant))
  return (await listMaterial(tickets)).find((row) => row.uid === uid)?.label ?? null
}

beforeAll(async () => {
  await APPLIED
})

describe('REQ-287 — what an ingestion answers with', () => {
  it('test_UAT_FC_REQ-287_a_placed_upload_answers_with_its_label_and_still_with_its_address', async () => {
    // THE WHOLE TICKET, AT THE ORIGIN. The client cannot be told a name the
    // origin did not send, so the envelope is the half that has to change before
    // the sentence can. And the label is ALLOCATED DURING INGEST, in the same
    // `create` as the classification it is derived from — so by the time this
    // reply is composed the value is in hand and nothing is read back.
    const tenant = 'req287-placed'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req287' })

    const placed = await upload(tenant, {
      bytes: bytesOf('the logo'),
      name: 'logo.png',
      type: 'image/png',
      role: 'site',
      slug: site.slug,
    })

    // THE NAME THE CLIENT AND THE CONSULTANT SHARE, and the client's first
    // picture, so their own sequence's first number.
    expect(placed.label).toBe('IMAGE-1')

    // THE SAME STRING THE LIBRARY SHOWS, and not a second name composed in the
    // envelope. A label that read one way in the conversation and another way in
    // the tab would be worse than no label: [[REQ-280]] bought ONE name, and two
    // would spend it.
    expect(await labelInLibrary(tenant, String(placed.uid))).toBe('IMAGE-1')

    // AND THE ADDRESS DID NOT MOVE. `site_asset` is the filename the bytes are
    // served under — it is how the published page reaches them — and this ticket
    // changes a sentence of prose, not an address.
    expect(placed.site_asset).toBe('logo.png')
    expect(await site.store.listAssets(site.slug)).toContain('logo.png')
  })

  it('test_UAT_FC_REQ-287_a_uuid_named_drop_is_answered_with_a_name_the_client_could_repeat', async () => {
    // THE CASE THE TICKET IS BUILT ON. A browser upload arrives named by whatever
    // produced it, and off a phone or a design tool that is a uuid: a storage key
    // that is correct under `site_assets` and unusable in the next sentence the
    // client types, because nobody transcribes 36 hex digits to ask for a change.
    const tenant = 'req287-uuid'
    const site = await makeD1Site({ tenantId: tenant, slug: 'req287b' })

    const dropped = await upload(tenant, {
      bytes: bytesOf('a photograph off a phone'),
      name: '3d727c09-fe22-4b7e-8035-ff2ac6878fb9.png',
      type: 'image/png',
      role: 'site',
      slug: site.slug,
    })

    // The filename is still what the bytes are called…
    expect(dropped.site_asset).toBe('3d727c09-fe22-4b7e-8035-ff2ac6878fb9.png')
    // …and the envelope now also carries something sayable, which is the point.
    expect(dropped.label).toBe('IMAGE-1')
  })

  it('test_UAT_FC_REQ-287_material_that_is_stored_but_placed_nowhere_is_labelled_just_the_same', async () => {
    // THE LABEL IS NOT A PROPERTY OF PLACEMENT. It is allocated at ingest for
    // every material, so a reference document the client marked "just for you to
    // read" is catalogued under a name the consultant can say back even though
    // nothing of it will ever reach a site. The gate on the placement SENTENCE is
    // untouched by this ticket; only the name inside it changed.
    const tenant = 'req287-unplaced'

    const toRead = await upload(tenant, {
      bytes: bytesOf('# Positioning\n\nMolten metal, poured with care.'),
      name: 'positioning.md',
      type: 'text/markdown',
      role: 'reference',
    })

    expect(toRead.site_asset).toBeNull()
    // `DOC` AND NOT `DOCUMENT`, from this kind's own sequence — [[REQ-280]]'s
    // rule, reached through this envelope rather than restated by it.
    expect(toRead.label).toBe('DOC-1')
    expect(await labelInLibrary(tenant, String(toRead.uid))).toBe('DOC-1')
  })

  it('test_UAT_FC_REQ-287_the_label_is_on_every_envelope_because_there_is_only_one_envelope', async () => {
    // BOTH ENTRY POINTS, ONE ANSWER. The upload route and the fetch route
    // converge on `ingest` and compose the same `materialEnvelope`, so material
    // pulled on the client's behalf is named the same way as material they
    // dropped. That is a consequence of the shape rather than a second decision,
    // and it is asserted here so it stays one.
    const tenant = 'req287-fetch'
    const stub: typeof fetch = async () =>
      new Response('An industry report about bakeries.', {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      })
    const fetched = await route(
      new Request('https://app.test/api/material/fetch', {
        method: 'POST',
        body: JSON.stringify({ url: 'https://example.com/report.txt' }),
      }),
      routerEnv(),
      scopeOf(tenant),
      deps({ fetch: stub }),
    )
    const envelope = (await fetched.json()) as Record<string, unknown>

    expect(envelope.label).toBe('DOC-1')
    expect(await labelInLibrary(tenant, String(envelope.uid))).toBe('DOC-1')
  })
})
