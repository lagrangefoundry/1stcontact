import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import type { Scope } from '../apps/control-app/src/scope'
import { applySchema } from './support/d1-site-factory'

/**
 * BUG-41 — **the markdown upload, through the Worker the client used**.
 *
 * WHY THE UNIT TEST IS NOT ENOUGH. The sibling file proves the resolution
 * function and the describer in isolation, and both were correct in isolation
 * before this change too — nothing there could have caught the bug, because the
 * bug was in what the ROUTE handed them. `File.type` being empty for a `.md`
 * file is a browser behaviour, the substitution of `application/octet-stream` is
 * the route's, and the three consumers disagreeing about the result is
 * `ingest`'s. Only a request carries all three.
 *
 * SO THE FILE IS POSTED WITH AN EMPTY TYPE, which is exactly what a browser
 * sends, against the real router, real D1 and a real R2 bucket. The assertions
 * are read back through an independently constructed store rather than off the
 * response envelope, because the durable record is the thing the Library shows.
 *
 * A DESCRIBER IS WIRED, AND THE CLAIM IT USED TO CARRY MOVED ([[REQ-173]]).
 * This suite ran with nothing configured on purpose: if reading a text file
 * needed a model it would pass with a stub and the product would still be broken
 * for a deployment with no key. Since REQ-173 a body is a DIGEST, so the upload
 * ROUTE refuses a deployment that cannot describe — which makes "nothing
 * configured" untestable through a request, and would have quietly turned this
 * file into an assertion about a 503.
 *
 * So the claim was not dropped, it was moved to where it can still be made
 * honestly: the node sibling calls `describe` directly with no describer and
 * asserts the file is still READ — its own words carried, its declared title
 * taken, no *"nothing here can read"*. What is left here is the half that needs a
 * request: the type resolved from the name, and the resolution reaching all three
 * consumers of it.
 */

const APPLIED = applySchema()

const TENANT = 'bug41'

const SUMMARY = `---
title: Gigabyte Alchemy — positioning summary
---

They sell managed data pipelines to mid-market finance teams.
The differentiator they name is the audit trail, not the speed.
`

function routerEnv(): RouterEnv {
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

/** A configured deployment — see the module note for why that is now required. */
const deps: RouterDeps = {
  index: async () => async () => {},
  describeText: async () => ({ text: 'A summary of a data pipelines vendor.', model: 'stub/digest-1' }),
}

beforeAll(async () => {
  await APPLIED
})

describe('BUG-41 — a .md dropped on the Library', () => {
  it('UAT_FC_BUG-41 is READ, not merely stored, when the browser states no type', async () => {
    const form = new FormData()
    // THE EMPTY TYPE IS THE POINT. A browser has no MIME type registered for
    // `.md`, so this is literally what arrives; the route's fallback to
    // `application/octet-stream` happens downstream of it.
    form.append('file', new File([SUMMARY], 'gigabyte_alchemy_summary.md', { type: '' }))
    const response = await route(
      new Request('https://app.test/api/material', { method: 'POST', body: form }),
      routerEnv(),
      scopeOf(),
      deps,
    )
    expect(response.status).toBe(200)
    const body = (await response.json()) as Record<string, unknown>

    expect(body.kind).toBe('document')
    // `unsupported` is what this said before, and it is what the client saw.
    expect(body.description_status).toBe('ok')

    // THE ATTACHMENT RECORDS THE RESOLVED TYPE. It is the durable copy — a later
    // re-describe pass reads it — so leaving `application/octet-stream` here
    // would fix the body once and break every pass that came after.
    const attachment = body.attachment as Record<string, unknown>
    expect(attachment.content_type).toBe('text/markdown')

    // And the ticket the Library shows carries the title its front matter
    // declared, read back through a second store.
    const store = await ticketStoreFor(routerEnv(), scopeOf())
    const { ticket } = await store.get({ uid: String(body.uid) })
    expect(ticket.body).not.toContain('nothing here can read')
    expect(ticket.title).toBe('Gigabyte Alchemy — positioning summary')
    // The EXTRACTOR is still named, beside the model that wrote the digest: which
    // reader produced the text is what a later re-extract pass selects on, and
    // that is the fact this bug was about ([[REQ-173]]).
    expect(String(ticket.fields.description_model)).toContain('text-decode')

    // THE FILE'S OWN WORDS, in the `material_text` comment ([[REQ-173]]). This is
    // the assertion that actually proves the file was read rather than
    // apologised for — it is the same claim it always was, in the place the text
    // now lives.
    const { comments } = await store.comments({ uid: String(body.uid) })
    const text = comments.find((c) => c.fields.kind === 'material_text')
    expect(text?.body).toContain('audit trail')
  })
})
