/**
 * REQ-172 — **the row says what the bytes are**.
 *
 * WHAT THIS FILE PROVES, and what its jsdom sibling proves instead. That one is
 * the reader window: markdown rendered, plain text as itself, a PDF in the
 * browser's own viewer. This is the half that makes any of it possible — that
 * `/api/material` tells the pane the CONTENT TYPE of every row, because DOC-38
 * §9's `kind` cannot: it files a markdown note, a text export and a brand PDF as
 * one `document`, and those are three different renderings.
 *
 * THE FIELD IS A CACHE, NOT A MIGRATION, and the last claim here is the one that
 * matters most for a system with material already in it. `content_type` is
 * written at ingest from the same resolved variable the attachment record gets,
 * so the two cannot drift; and a row whose ticket predates the field resolves the
 * type from its own filename instead — the same mapping, recomputed. Nothing has
 * to be backfilled for the pane to work on a client's existing corpus.
 *
 * EVERY ASSERTION GOES THROUGH `route()` against real D1 and two real R2 buckets,
 * on the REQ-161 surface suite's pattern: the blob is stored by the ticketing
 * component's own `attach` and the row is written by its own validator. The one
 * double is the embedder, for the reason that suite argues at length.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { applySchema } from './support/d1-site-factory'
import { bytesOf } from './support/material-fixtures'

const APPLIED = applySchema()

function routerEnv(tenantId: string, over: Partial<RouterEnv> = {}): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: tenantId,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...over,
  }
}

/**
 * A stubbed describer, and an indexer that only counts — nothing here is about
 * either.
 *
 * THE DESCRIBER IS NOT OPTIONAL AT INGEST ANY MORE ([[REQ-173]]). A body is a
 * digest now, so a deployment that cannot reach a model has nothing to write and
 * the route refuses the upload with a 503 rather than storing a described-by-
 * nobody row. Supplying a stub is this suite saying "assume a configured
 * deployment", which is what every claim below is about.
 */
function deps(over: Partial<RouterDeps> = {}): RouterDeps {
  return {
    index: async () => async () => {},
    describeText: async () => ({ text: 'A document.', model: 'stub/digest-1' }),
    ...over,
  }
}

async function upload(
  tenant: string,
  file: { bytes: Uint8Array; name: string; type: string; role?: string },
): Promise<Record<string, unknown>> {
  const form = new FormData()
  form.append('file', new File([file.bytes as unknown as BlobPart], file.name, { type: file.type }))
  form.append('role', file.role ?? 'reference')
  const response = await route(
    new Request('https://app.test/api/material', { method: 'POST', body: form }),
    routerEnv(tenant),
    deps(),
  )
  return (await response.json()) as Record<string, unknown>
}

async function listed(tenant: string): Promise<Array<Record<string, unknown>>> {
  const response = await route(
    new Request('https://app.test/api/material'),
    routerEnv(tenant),
    deps(),
  )
  const payload = (await response.json()) as { material: Array<Record<string, unknown>> }
  return payload.material
}

beforeAll(async () => {
  await APPLIED
})

describe('REQ-172 — the list carries what the bytes are, because `kind` cannot', () => {
  it('UAT_FC_REQ-172 three documents one `kind` cannot tell apart arrive with three content types', async () => {
    const tenant = 'req172-types'

    // THE CASE THE FIELD EXISTS FOR. All three are DOC-38 §9 `document`s, and the
    // pane has to render them three different ways.
    await upload(tenant, {
      bytes: bytesOf('Positioning, in **markdown**.'),
      name: 'positioning.md',
      // A browser has no registered MIME type for `.md`, so this is the empty
      // string it actually sends — the BUG-41 case, repaired at ingest.
      type: '',
    })
    await upload(tenant, {
      bytes: bytesOf('line one\nline two\n'),
      name: 'export.txt',
      type: 'text/plain',
    })
    await upload(tenant, {
      bytes: bytesOf('%PDF-1.4 not really'),
      name: 'guidelines.pdf',
      type: 'application/pdf',
    })

    const rows = await listed(tenant)
    const of = (filename: string) => rows.find((row) => row.filename === filename)!

    // ONE `kind` FOR ALL THREE — which is exactly why the pane cannot render from
    // it, and why this field is not redundant with it.
    expect([of('positioning.md').kind, of('export.txt').kind, of('guidelines.pdf').kind]).toEqual([
      'document',
      'document',
      'document',
    ])

    // AND THREE CONTENT TYPES, one per rendering.
    expect(of('positioning.md').content_type).toBe('text/markdown')
    expect(of('export.txt').content_type).toBe('text/plain')
    expect(of('guidelines.pdf').content_type).toBe('application/pdf')
  })

  it('UAT_FC_REQ-172 the row and the attachment cannot disagree about what the file is', async () => {
    // WRITTEN FROM ONE VARIABLE. `ingest` resolves the type once and hands the
    // same value to the ticket and to the attachment, so BUG-41's repair — made
    // durable on the attachment so a re-describe pass reads the right thing —
    // cannot come apart from the value the Library reads. A `.md` is the case
    // that would show it, because it is the one the browser says nothing about.
    const tenant = 'req172-agree'
    const created = await upload(tenant, {
      bytes: bytesOf('# Notes'),
      name: 'notes.md',
      type: '',
    })

    const [row] = await listed(tenant)
    const store = await ticketStoreFor(routerEnv(tenant))
    const { attachments } = await store.attachments({ uid: String(created.uid) })

    expect(row.content_type).toBe('text/markdown')
    expect(attachments[0].fields.content_type).toBe(row.content_type)

    // And the file route serves that same type, which is what makes the frame and
    // the `<img>` work at all.
    const file = await route(
      new Request(`https://app.test/api/material/file?uid=${created.uid}`),
      routerEnv(tenant),
      deps(),
    )
    expect(file.headers.get('content-type')).toBe('text/markdown')
  })

  it('UAT_FC_REQ-172 a stated type is kept even where the extension would say otherwise', async () => {
    // THE REPAIR REPAIRS SILENCE ONLY, and the row inherits that rule rather than
    // reimplementing a second one. The sender observed the bytes and we did not,
    // so a `.txt` they called a PDF stays a PDF — second-guessing it here would
    // make the pane disagree with the route serving the same file.
    const tenant = 'req172-stated'
    await upload(tenant, {
      bytes: bytesOf('%PDF-1.4 misnamed'),
      name: 'guidelines.txt',
      type: 'application/pdf',
    })

    const [row] = await listed(tenant)
    expect(row.content_type).toBe('application/pdf')
  })

  it('UAT_FC_REQ-172 material written before the field resolves its type from its own name', async () => {
    // NOTHING HAS TO BE BACKFILLED. A client's existing corpus has no
    // `content_type` on its tickets, and a pane that treated absence as a fourth
    // state would show every document they already had as a download link —
    // which is the bug, still there, for everyone who was already using this.
    //
    // Written through the store directly, because that is what "created before
    // the field existed" IS: a valid material ticket without it.
    const tenant = 'req172-legacy'
    const store = await ticketStoreFor(routerEnv(tenant))
    await store.create({
      type: 'material',
      title: 'Positioning notes',
      body: 'What the client sells and to whom.',
      fields: {
        rights: 'owned',
        republishable: false,
        exportable: false,
        origin: 'uploaded',
        kind: 'document',
        role: 'reference',
        filename: 'positioning.md',
      },
    })

    const [row] = await listed(tenant)
    expect(row.filename).toBe('positioning.md')
    // The same answer the field would have cached, recomputed — which is what
    // makes the field a cache rather than a migration.
    expect(row.content_type).toBe('text/markdown')
  })

  it('UAT_FC_REQ-172 a file nothing can name stays unnamed rather than being guessed at', async () => {
    // AN UNMAPPED EXTENSION STILL DEGRADES, exactly as BUG-41 left it. The pane
    // reads `application/octet-stream` as "no reader", offers the download alone,
    // and that is the honest answer rather than a window full of mojibake.
    const tenant = 'req172-unknown'
    await upload(tenant, { bytes: bytesOf(' binary'), name: 'model.xyz', type: '' })

    const [row] = await listed(tenant)
    expect(row.content_type).toBe('application/octet-stream')
    expect(row.kind).toBe('document')
  })
})
