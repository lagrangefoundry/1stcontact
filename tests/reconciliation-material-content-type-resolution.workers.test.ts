import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { applySchema } from './support/d1-site-factory'

/**
 * Reconciliation UATs for story-6ccaedd5 — **the content type is settled once, at
 * the head of the ingestion, and every later step reads that one value**.
 *
 * WHY THESE TWO CRITERIA ARE OBSERVED HERE AND NOT ON THE DESCRIBER. The claim is
 * an ORDERING claim — one resolution, three consumers — and it is only observable
 * where all three meet, which is the ingestion boundary. A test of the resolution
 * function alone was green before the repair and after it: what the bug was about
 * is what the ROUTE handed the describer, and only a request carries that.
 *
 * SO EVERY ASSERTION GOES THROUGH `route()` — the Worker's own route table, at the
 * platform's own upload entry point — against a real D1 database and two real R2
 * buckets from `@cloudflare/vitest-pool-workers`. The file parts are built with an
 * EMPTY `type`, which is literally what a browser sends for a `.md`: it has no
 * registered MIME type for one, and the route's fallback to
 * `application/octet-stream` happens downstream of that silence.
 *
 * NO DESCRIBER IS WIRED FOR THE TEXTUAL CASES, deliberately. If reading a client's
 * markdown needed a model, these would pass against a stub while the product
 * stayed broken for every deployment without a key. Reading text is code, so it
 * must pass with nothing configured. The one double is the vision seam, which is a
 * model boundary miniflare has no local Workers AI to reach — and no criterion
 * here is about the quality of a description, only about which type reached it.
 *
 * READ BACK THROUGH A SECOND HANDLE. The durable record is what a later
 * re-describe pass reads and what the Library shows, so the assertions that matter
 * re-open the store with `ticketStoreFor` rather than trusting the envelope.
 */

const APPLIED = applySchema()

const TENANT = 'story6ccaedd5ct'

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: TENANT,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  }
}

/**
 * The index seam wired to a no-op, and the vision seam stubbed.
 *
 * Neither is under test here: the announcement is AC-1685's claim and the quality
 * of an image description is the description story's. What matters is only that
 * the pipeline runs to completion so the recorded type can be read back.
 */
const deps: RouterDeps = {
  index: async () => async () => {},
  describeImage: async () => ({ text: 'A mark\n\nA wordmark on a pale ground.', model: 'stub/vision-1' }),
}

/** An upload through the entry point, exactly as a dropped file arrives. */
async function upload(text: string, filename: string, contentType: string): Promise<Response> {
  const form = new FormData()
  form.append('file', new File([text], filename, { type: contentType }))
  return route(
    new Request('https://app.test/api/material', { method: 'POST', body: form }),
    routerEnv(),
    deps,
  )
}

const SUMMARY = `---
title: Gigabyte Alchemy — positioning summary
---

They sell managed data pipelines to mid-market finance teams.
The differentiator they name is the audit trail, not the speed.
`

/** The wording the degraded branch writes when nothing could read the bytes. */
const UNREADABLE = 'nothing here can read'

beforeAll(async () => {
  await APPLIED
})

describe('story-6ccaedd5 — the content type is settled once, at the head', () => {
  it('test_UAT_AC1809_a_silent_type_is_settled_from_the_filename_and_every_consumer_reads_that_value', async () => {
    // A `.md` POSTED WITH AN EMPTY DECLARED TYPE — the browser's own answer, and
    // the input the repair exists for. The route substitutes
    // `application/octet-stream`, which is the second way of saying nothing; the
    // ingestion resolves both from the name before anything else runs.
    const response = await upload(SUMMARY, 'gigabyte_alchemy_summary.md', '')
    expect(response.status).toBe(200)
    const body = (await response.json()) as Record<string, unknown>

    // DESCRIBED, not merely stored. `unsupported` is what this said before the
    // repair, and it is what the client saw in the detail pane.
    expect(body.description_status).toBe('ok')
    expect(body.kind).toBe('document')

    // THE RECORD OF THE STORED BYTES NAMES MARKDOWN, not the generic type. This is
    // the durable form of the repair: a later pass that re-reads the file reads
    // the settled type, not the sender's silence.
    const attachment = body.attachment as Record<string, unknown>
    expect(attachment.content_type).toBe('text/markdown')

    // …and the three consumers agree, read back through a SECOND handle on the
    // account's material store rather than off the envelope.
    const store = await ticketStoreFor(routerEnv())
    const { ticket } = await store.get({ uid: String(body.uid) })
    expect(ticket.fields.kind).toBe('document')
    expect(ticket.fields.content_type).toBe('text/markdown')
    // The file's OWN WORDS as its body — the whole point of a body — rather than
    // an account of what could not be read.
    expect(ticket.body).toContain('audit trail')
    expect(ticket.body).toContain('mid-market finance teams')
    expect(ticket.body).not.toContain(UNREADABLE)
    expect(ticket.fields.description_model).toBe('text-decode')

    // AN EXTENSION NAMING AN IMAGE AND ONE NAMING A FONT, delivered just as
    // silently. The recorded kind and the recorded type must agree in each case:
    // `kindOf` alone would file these correctly while leaving the attachment
    // record saying `application/octet-stream`, which is the half-repair the
    // criterion exists to exclude.
    const repaired: Array<{ filename: string; kind: string; contentType: string }> = [
      { filename: 'wordmark.png', kind: 'image', contentType: 'image/png' },
      { filename: 'display.woff2', kind: 'font', contentType: 'font/woff2' },
    ]
    for (const scenario of repaired) {
      const answer = await upload('the same bytes, named differently', scenario.filename, '')
      expect(answer.status, scenario.filename).toBe(200)
      const envelope = (await answer.json()) as Record<string, unknown>
      expect(envelope.kind, scenario.filename).toBe(scenario.kind)
      expect(
        (envelope.attachment as Record<string, unknown>).content_type,
        scenario.filename,
      ).toBe(scenario.contentType)

      const stored = (await store.get({ uid: String(envelope.uid) })).ticket
      expect(stored.fields.kind, scenario.filename).toBe(scenario.kind)
      expect(stored.fields.content_type, scenario.filename).toBe(scenario.contentType)
    }
  })

  it('test_UAT_AC1810_a_stated_type_is_never_second_guessed_and_an_unreadable_extension_degrades_honestly', async () => {
    const store = await ticketStoreFor(routerEnv())

    // A STATED TYPE THAT CONTRADICTS THE EXTENSION. The sender observed the bytes
    // and the platform did not, so overriding it would make a mislabelled file
    // unreadable in a NEW way in order to fix an old one. Both the material and
    // the record of its bytes must hold what the sender said.
    const stated: Array<{ filename: string; contentType: string }> = [
      // `.md` would have mapped to `text/markdown`; served as plain text it stays
      // plain text.
      { filename: 'notes.md', contentType: 'text/plain' },
      // `.txt` would have mapped to `text/plain`; deliberately served as HTML it
      // stays HTML.
      { filename: 'notes.txt', contentType: 'text/html' },
    ]
    for (const scenario of stated) {
      const answer = await upload('Stated plainly, and taken at its word.', scenario.filename, scenario.contentType)
      expect(answer.status, scenario.filename).toBe(200)
      const envelope = (await answer.json()) as Record<string, unknown>
      expect(
        (envelope.attachment as Record<string, unknown>).content_type,
        scenario.filename,
      ).toBe(scenario.contentType)

      const ticket = (await store.get({ uid: String(envelope.uid) })).ticket
      expect(ticket.fields.content_type, scenario.filename).toBe(scenario.contentType)
    }

    // AN ABSENT TYPE AND AN EXTENSION THE PLATFORM HAS NO READER FOR. The existing
    // trade is PRESERVED, not widened: the file is kept, filed as a document,
    // recorded with the generic type, and described with the honest account of
    // what could not be read — not refused, and not failed.
    const degraded = await upload('opaque bytes nothing here can open', 'archive.xyz', '')
    expect(degraded.status).toBe(200)
    const body = (await degraded.json()) as Record<string, unknown>
    expect(body.kind).toBe('document')
    expect(body.description_status).toBe('unsupported')
    expect((body.attachment as Record<string, unknown>).content_type).toBe('application/octet-stream')

    const kept = (await store.get({ uid: String(body.uid) })).ticket
    expect(kept.type).toBe('material')
    expect(kept.fields.kind).toBe('document')
    expect(kept.fields.content_type).toBe('application/octet-stream')
    expect(kept.body).toContain(`${UNREADABLE} application/octet-stream`)

    // STILL LISTED. A file the platform cannot read is still the client's file,
    // so it appears in their Library alongside everything else.
    const listing = await route(
      new Request('https://app.test/api/material', { method: 'GET' }),
      routerEnv(),
      deps,
    )
    expect(listing.status).toBe(200)
    const rows = ((await listing.json()) as { material: Array<Record<string, unknown>> }).material
    expect(rows.map((row) => row.uid)).toContain(String(body.uid))
  })
})
