/**
 * story-1500b111 — **the row says what the bytes are** — the origin half of the
 * Library's reader.
 *
 * WHAT THIS FILE PROVES, and what its jsdom sibling proves instead.
 * `reconciliation-library-reader.test.ts` is the reader window: markdown
 * rendered, plain text as itself, a PDF in the browser's own viewer. This is the
 * half that makes any of it possible — that `/api/material` tells the pane the
 * CONTENT TYPE of every row, because DOC-38 §9's `kind` cannot: it files a
 * markdown note, a plain-text export and a brand PDF as one `document`, and those
 * are three different renderings.
 *
 * ONE VALUE PER ROW, NOT A READ PER ROW. The type travels on the listed row
 * itself, so drawing a list of documents costs no extra call — which is also what
 * makes the three things that could disagree about a file (the row, the record of
 * its stored bytes, and the address that serves them) provably one value here.
 *
 * THE FIELD IS A CACHE, NOT A MIGRATION, and that is the claim that matters most
 * for a system with material already in it: a row whose ticket predates the field
 * resolves the type from its own filename by the same mapping that would have
 * been recorded. Nothing has to be backfilled for the pane to work on a client's
 * existing corpus.
 *
 * EVERY ASSERTION GOES THROUGH `route()` against real D1 and two real R2 buckets,
 * on the pattern `reconciliation-library-surface.workers.test.ts` establishes:
 * the blob is stored by the ticketing component's own `attach` and the row is
 * written by its own validator. Nothing here reimplements a step of the pipeline
 * in order to assert it.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import type { Scope } from '../apps/control-app/src/scope'
import { applySchema } from './support/d1-site-factory'
import { bytesOf } from './support/material-fixtures'

const APPLIED = applySchema()

function routerEnv(over: Partial<RouterEnv> = {}): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...over,
  }
}

/**
 * The business a case operates on ([[REQ-168]]): it used to ride on the env as
 * `TENANT_ID`, and is now an argument the way a request's identity supplies it.
 */
const scopeOf = (businessId: string): Scope => ({ businessId })

/**
 * A stub document describer, and an indexer that only counts — nothing here is
 * about either. The describer is required because ingestion refuses a deployment
 * that can reach no model with a 503 ([[REQ-173]]).
 */
function deps(over: Partial<RouterDeps> = {}): RouterDeps {
  return {
    index: async () => async () => {},
    describeText: async () => ({ text: 'A document.', model: 'stub/digest-1' }),
    ...over,
  }
}

/** Put a file in through the platform's own material surface. */
async function upload(
  tenant: string,
  file: { bytes: Uint8Array; name: string; type: string },
): Promise<Record<string, unknown>> {
  const form = new FormData()
  form.append('file', new File([file.bytes as unknown as BlobPart], file.name, { type: file.type }))
  form.append('role', 'reference')
  const response = await route(
    new Request('https://app.test/api/material', { method: 'POST', body: form }),
    routerEnv(),
    scopeOf(tenant),
    deps(),
  )
  return (await response.json()) as Record<string, unknown>
}

/** Read the list route as the Library's list pane does. */
async function listed(tenant: string): Promise<Array<Record<string, unknown>>> {
  const response = await route(
    new Request('https://app.test/api/material'),
    routerEnv(),
    scopeOf(tenant),
    deps(),
  )
  const payload = (await response.json()) as { material: Array<Record<string, unknown>> }
  return payload.material
}

beforeAll(async () => {
  await APPLIED
})

describe('AC-1813 — every listed row carries what its bytes are', () => {
  it('test_UAT_AC1813_the_row_carries_the_resolved_content_type_and_the_list_record_and_file_agree', async () => {
    const tenant = 'story1500b111-content-type'

    // THE CASE THE FIELD EXISTS FOR. All three of these are DOC-38 §9
    // `document`s, and the detail pane has to render them three different ways.
    const markdown = await upload(tenant, {
      bytes: bytesOf('Positioning, in **markdown**.'),
      name: 'positioning.md',
      // A browser has no registered MIME type for `.md`, so this is the empty
      // string it actually sends — silence, resolved at ingest.
      type: '',
    })
    await upload(tenant, {
      bytes: bytesOf('line one\nline two\n'),
      name: 'export.txt',
      type: 'text/plain',
    })
    await upload(tenant, {
      bytes: bytesOf('%PDF-1.4 brand book'),
      name: 'guidelines.pdf',
      type: 'application/pdf',
    })

    // A STATED TYPE THAT CONTRADICTS THE EXTENSION. The sender observed the
    // bytes and this surface did not, so second-guessing it here would make the
    // row disagree with the route serving the same file.
    await upload(tenant, {
      bytes: bytesOf('%PDF-1.4 misnamed'),
      name: 'misnamed.txt',
      type: 'application/pdf',
    })

    // AN UNRECOGNISED EXTENSION AND NO STATED TYPE. This widens what can be
    // shown; it does not change what happens to what cannot.
    await upload(tenant, { bytes: bytesOf('\u0000binary'), name: 'model.xyz', type: '' })

    // MATERIAL WRITTEN BEFORE THE ROW CARRIED THE VALUE — which is exactly what
    // a valid material ticket without the field IS, so it is written through the
    // store directly rather than faked at the route.
    const store = await ticketStoreFor(routerEnv(), scopeOf(tenant))
    await store.create({
      type: 'material',
      title: 'The old brief',
      body: 'What the client sells and to whom.',
      fields: {
        rights: 'owned',
        republishable: false,
        exportable: false,
        origin: 'uploaded',
        kind: 'document',
        role: 'reference',
        filename: 'brief.md',
      },
    })

    const rows = await listed(tenant)
    const of = (filename: string) => rows.find((row) => row.filename === filename)!
    expect(rows).toHaveLength(6)

    // ONE FILING KIND ACROSS ALL THREE — which is precisely why the pane cannot
    // render from it, and why this field is not redundant with it.
    expect([of('positioning.md').kind, of('export.txt').kind, of('guidelines.pdf').kind]).toEqual([
      'document',
      'document',
      'document',
    ])

    // AND THREE CONTENT TYPES, one per rendering.
    expect(of('positioning.md').content_type).toBe('text/markdown')
    expect(of('export.txt').content_type).toBe('text/plain')
    expect(of('guidelines.pdf').content_type).toBe('application/pdf')

    // THE LIST, THE STORED RECORD AND THE SERVED FILE CANNOT DISAGREE. `.md` is
    // the case that would show it, because it is the one the browser says
    // nothing about: the value is resolved once at ingest and handed to the
    // ticket, to the attachment and to the route that serves the bytes.
    const { attachments } = await store.attachments({ uid: String(markdown.uid) })
    expect(attachments[0].fields.content_type).toBe(of('positioning.md').content_type)
    const file = await route(
      new Request(`https://app.test/api/material/file?uid=${markdown.uid}`),
      routerEnv(),
      scopeOf(tenant),
      deps(),
    )
    expect(file.headers.get('content-type')).toBe(of('positioning.md').content_type)

    // THE STATED TYPE IS KEPT, even where the filename's extension would say
    // something else.
    expect(of('misnamed.txt').content_type).toBe('application/pdf')

    // MATERIAL PREDATING THE VALUE RESOLVES IT FROM ITS OWN FILENAME, by the
    // same mapping that would have been recorded — which is what makes the field
    // a cache rather than a migration, and what keeps a client's existing
    // documents readable immediately rather than becoming download links.
    expect(of('brief.md').content_type).toBe('text/markdown')

    // AND A NAME NOTHING RECOGNISES STILL YIELDS THE GENERIC BINARY TYPE, so it
    // still reaches the download-only pane rather than a window full of mojibake.
    expect(of('model.xyz').content_type).toBe('application/octet-stream')
    expect(of('model.xyz').kind).toBe('document')
  })
})
