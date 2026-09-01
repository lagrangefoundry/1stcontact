import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
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
 * NO DESCRIBER IS WIRED, deliberately. If reading a text file needed a model
 * this test would pass with a stub and the product would still be broken for any
 * deployment without a key. It must pass with nothing configured.
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
    TENANT_ID: TENANT,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  }
}

const deps: RouterDeps = { index: async () => async () => {} }

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

    // And the ticket the Library shows carries the file's own words and the
    // title its front matter declared, read back through a second store.
    const store = await ticketStoreFor(routerEnv())
    const { ticket } = await store.get({ uid: String(body.uid) })
    expect(ticket.body).toContain('audit trail')
    expect(ticket.body).not.toContain('nothing here can read')
    expect(ticket.title).toBe('Gigabyte Alchemy — positioning summary')
    expect(ticket.fields.description_model).toBe('text-decode')
  })
})
