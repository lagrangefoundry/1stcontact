import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  BlobsNotConfiguredError,
  TenantNotConfiguredError,
  productTypePack,
  ticketStoreFor,
  type TicketStore,
  type TicketStoreEnv,
} from '../apps/control-app/src/tickets'
import { applySchema } from './support/d1-site-factory'

/**
 * REQ-162 — **the product ticket store, in workerd**.
 *
 * WHAT MAKES THIS EVIDENCE. Every assertion runs inside workerd against a real
 * D1 database and two real R2 buckets, through the same `ticketStoreFor` the
 * Worker itself would call — no fake accessor, no in-memory blob map, no
 * hand-written schema. The tables come from `db/migrations`, applied in order by
 * the same helper the site-store suites use, so what is proved here is the
 * schema that will actually be deployed rather than a fixture's approximation of
 * it.
 *
 * THE ISOLATION ASSERTIONS ARE THE POINT OF THE FILE. [[DOC-10]] §4.1 makes the
 * tenant a hard information barrier, and a barrier nobody tested is a comment.
 * Two of them are checked below and they fail differently: a scoped handle
 * cannot see across tenants in D1 (rows), and cannot see across tenants in R2
 * (bytes). Both have to hold, because material has a record AND a blob, and an
 * isolation guarantee that covered only the record would leak the document.
 */

const TENANT_A = 'req162-a'
const TENANT_B = 'req162-b'

/** The Worker's own bindings, as a ticket-store env. */
function storeEnv(overrides: Partial<TicketStoreEnv> = {}): TicketStoreEnv {
  return {
    DB: env.DB as D1Database,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: TENANT_A,
    ...overrides,
  }
}

/** A `material` that satisfies [[DOC-38]] §9 — the happy shape, stated once. */
function material(over: Record<string, unknown> = {}) {
  return {
    rights: 'owned',
    republishable: true,
    exportable: false,
    origin: 'uploaded',
    kind: 'document',
    ...over,
  }
}

beforeAll(async () => {
  await applySchema()
})

describe('REQ-162 — the schema and the wiring', () => {
  it('UAT_FC_REQ-162 a ticket created through the Worker is readable back through it', async () => {
    // The acceptance in its plainest form: the migration applied, the tenant
    // registered itself, the pack validated, D1 took the row, and a SECOND
    // independently-constructed handle reads it back. Two handles rather than
    // one, because a store that only round-tripped through its own instance
    // would pass with an in-memory cache and no working schema at all.
    const store = await ticketStoreFor(storeEnv())
    const { ticket } = await store.create({
      type: 'material',
      title: 'Brand guidelines',
      fields: material(),
      body: 'The palette is oxblood and bone.',
    })
    expect(ticket.uid).toBeTruthy()

    const fresh = await ticketStoreFor(storeEnv())
    const { ticket: read } = await fresh.get({ uid: ticket.uid })
    expect(read.title).toBe('Brand guidelines')
    expect(read.type).toBe('material')
    expect(read.fields.rights).toBe('owned')
    expect(read.body).toBe('The palette is oxblood and bone.')
  })

  it('UAT_FC_REQ-162 it registers the configured tenant rather than dying on an empty registry', async () => {
    // BUG-36, pre-empted on this store. `forTenant` refuses an unregistered
    // tenant as it must, and a freshly migrated database has an empty registry —
    // which is exactly how the builder came to be dead on arrival last time.
    // A tenant nothing has ever registered must still yield a working handle.
    const store = await ticketStoreFor(storeEnv({ TENANT_ID: 'req162-never-seen' }))
    const { ticket } = await store.create({
      type: 'brief',
      title: 'Decisions',
      fields: { site_slug: 'home' },
      body: 'Ship the one-pager first.',
    })
    expect(ticket.uid).toBeTruthy()
  })

  it('UAT_FC_REQ-162 a missing binding refuses at construction, not at first use', async () => {
    // The store is NOT fully built without a place for bytes. Upstream treats
    // attachments as an optional capability — right for a general component,
    // wrong for this host, where a deployment whose material has nowhere to go
    // is simply misconfigured. Both refusals are awaited before any op is
    // called, which is the claim: the failure is construction-time.
    await expect(ticketStoreFor(storeEnv({ BLOBS: undefined }))).rejects.toBeInstanceOf(
      BlobsNotConfiguredError,
    )
    await expect(ticketStoreFor(storeEnv({ TENANT_ID: '' }))).rejects.toBeInstanceOf(
      TenantNotConfiguredError,
    )
  })
})

describe('REQ-162 — the tenant barrier', () => {
  it('UAT_FC_REQ-162 a handle for tenant A cannot read tenant B rows', async () => {
    const a = await ticketStoreFor(storeEnv({ TENANT_ID: TENANT_A }))
    const b = await ticketStoreFor(storeEnv({ TENANT_ID: TENANT_B }))

    const { ticket } = await a.create({
      type: 'material',
      title: 'A private paper',
      fields: material(),
    })

    // NOT_FOUND, never a leak of existence — a cross-tenant uid reads exactly as
    // a uid that was never minted.
    await expect(b.get({ uid: ticket.uid })).rejects.toMatchObject({ code: 'not_found' })

    // And it is absent from the listing too, which is the failure a `get` guard
    // alone would miss: `get` takes a uid a caller had to obtain somehow, while
    // `query` is handed out freely and would enumerate the barrier away.
    const { tickets } = await b.query({ predicate: 'type=material', limit: 'all' })
    expect(tickets.map((t) => t.uid)).not.toContain(ticket.uid)
  })

  it('UAT_FC_REQ-162 a handle for tenant A cannot write over tenant B rows', async () => {
    const a = await ticketStoreFor(storeEnv({ TENANT_ID: TENANT_A }))
    const b = await ticketStoreFor(storeEnv({ TENANT_ID: TENANT_B }))

    const { ticket } = await a.create({
      type: 'material',
      title: 'Untouched',
      fields: material(),
    })
    await expect(
      b.update({ uid: ticket.uid, patch: { title: 'Overwritten' } }),
    ).rejects.toMatchObject({ code: 'not_found' })

    // Asserted, not assumed: the row is re-read to prove the refusal was a
    // refusal and not a write that landed somewhere else.
    const { ticket: after } = await a.get({ uid: ticket.uid })
    expect(after.title).toBe('Untouched')
  })
})

describe('REQ-162 — attachments', () => {
  const bytes = new TextEncoder().encode('%PDF-1.7 brand guidelines')

  it('UAT_FC_REQ-162 attachment ops work through the wired store', async () => {
    const store = await ticketStoreFor(storeEnv())
    const { ticket } = await store.create({
      type: 'material',
      title: 'Guidelines with bytes',
      fields: material(),
    })
    const { attachment } = await store.attach({
      uid: ticket.uid,
      bytes,
      filename: 'brand.pdf',
      content_type: 'application/pdf',
    })
    expect(attachment.fields.sha256).toMatch(/^[0-9a-f]{64}$/)
    expect(attachment.fields.size).toBe(bytes.byteLength)

    const { attachments } = await store.attachments({ uid: ticket.uid })
    expect(attachments.map((a) => a.uid)).toContain(attachment.uid)
  })

  it('UAT_FC_REQ-162 the bytes land in BLOBS and never in the public site bucket', async () => {
    // THE DISCLOSURE ASSERTION. Everything else about this store could be right
    // and this still wrong, and the consequence of it being wrong is a client's
    // confidential document reachable from a public URL — which is why it is
    // checked against the real buckets rather than argued from the config.
    const store = await ticketStoreFor(storeEnv())
    const { ticket } = await store.create({
      type: 'material',
      title: 'Confidential',
      fields: material({ rights: 'third_party', republishable: false }),
    })
    const { attachment } = await store.attach({ uid: ticket.uid, bytes })

    const key = `t/${TENANT_A}/blob/${attachment.fields.sha256}`
    expect(await env.BLOBS.head(key), 'the blob is in BLOBS').not.toBeNull()
    expect(await env.SITES.head(key), 'the blob is NOT in the public site bucket').toBeNull()
  })

  it('UAT_FC_REQ-162 one tenant cannot address another tenant blob', async () => {
    // The port half of the barrier. Keys on a scoped handle are relative and the
    // handle composes the prefix itself, so B's store writing the same bytes
    // produces a DIFFERENT absolute key — the content address dedups within a
    // tenant and isolates across, rather than silently sharing one object
    // between two accounts that uploaded the same file.
    const a = await ticketStoreFor(storeEnv({ TENANT_ID: TENANT_A }))
    const b = await ticketStoreFor(storeEnv({ TENANT_ID: TENANT_B }))
    const shared = new TextEncoder().encode('the same file, uploaded twice')

    const mk = async (store: TicketStore) => {
      const { ticket } = await store.create({
        type: 'material',
        title: 'Same bytes',
        fields: material(),
      })
      return (await store.attach({ uid: ticket.uid, bytes: shared })).attachment
    }
    const inA = await mk(a)
    const inB = await mk(b)

    expect(inA.fields.sha256).toBe(inB.fields.sha256)
    const keyA = `t/${TENANT_A}/blob/${inA.fields.sha256}`
    const keyB = `t/${TENANT_B}/blob/${inB.fields.sha256}`
    expect(keyA).not.toBe(keyB)
    expect(await env.BLOBS.head(keyA)).not.toBeNull()
    expect(await env.BLOBS.head(keyB)).not.toBeNull()
  })
})

describe('REQ-162 — the material types', () => {
  it('UAT_FC_REQ-162 the pack carries the three new types, chat, and attachments', async () => {
    // One store serves both halves of the platform's memory: the material types
    // this ticket defines and the chat schemas DOC-10 §8 has been blocked on.
    const types = productTypePack().types()
    expect(types).toEqual(
      expect.arrayContaining(['material', 'reference', 'brief', 'chat', 'comment', 'attachment']),
    )
  })

  it('UAT_FC_REQ-162 material and reference validate the DOC-38 §9 fields', async () => {
    const store = await ticketStoreFor(storeEnv())
    for (const type of ['material', 'reference']) {
      const { ticket } = await store.create({
        type,
        title: `A ${type}`,
        fields: material({ origin: 'captured', kind: 'capture', source_url: 'https://example.com' }),
      })
      expect(ticket.fields).toMatchObject({
        rights: 'owned',
        republishable: true,
        exportable: false,
        origin: 'captured',
        kind: 'capture',
        source_url: 'https://example.com',
      })
    }
  })

  it('UAT_FC_REQ-162 a bad rights or kind value is rejected', async () => {
    const store = await ticketStoreFor(storeEnv())
    await expect(
      store.create({ type: 'material', title: 'Bad rights', fields: material({ rights: 'borrowed' }) }),
    ).rejects.toMatchObject({ code: 'validation' })
    await expect(
      store.create({ type: 'material', title: 'Bad kind', fields: material({ kind: 'video' }) }),
    ).rejects.toMatchObject({ code: 'validation' })
    await expect(
      store.create({ type: 'reference', title: 'Bad rights', fields: material({ rights: '' }) }),
    ).rejects.toMatchObject({ code: 'validation' })
  })

  it('UAT_FC_REQ-162 republishable and exportable must be stated, never inferred', async () => {
    // DOC-38 §4.2: the two invert between a client's own site and a third-party
    // reference, so no rule derives either from `rights` — and a DEFAULT would be
    // such a rule. The refusal is the mechanism that makes "explicit" true.
    const store = await ticketStoreFor(storeEnv())
    for (const omitted of ['republishable', 'exportable']) {
      const fields = material()
      delete (fields as Record<string, unknown>)[omitted]
      await expect(
        store.create({ type: 'material', title: `No ${omitted}`, fields }),
        `omitting ${omitted} is refused`,
      ).rejects.toMatchObject({ code: 'validation' })
    }
    // A boolean field, not a truthy one: 'yes' is the shape a form would submit.
    await expect(
      store.create({
        type: 'material',
        title: 'Stringly typed',
        fields: material({ republishable: 'yes' }),
      }),
    ).rejects.toMatchObject({ code: 'validation' })
  })

  it('UAT_FC_REQ-162 captured and fetched material must say where it came from', async () => {
    const store = await ticketStoreFor(storeEnv())
    for (const origin of ['captured', 'fetched']) {
      await expect(
        store.create({
          type: 'material',
          title: `No source for ${origin}`,
          fields: material({ origin, kind: 'capture' }),
        }),
        `${origin} without source_url is refused`,
      ).rejects.toMatchObject({ code: 'validation' })
    }
    // And an upload is not asked for one, because it does not have one.
    const { ticket } = await store.create({
      type: 'material',
      title: 'Uploaded',
      fields: material({ origin: 'uploaded' }),
    })
    expect(ticket.fields.source_url).toBeUndefined()
  })

  it('UAT_FC_REQ-162 a brief names its site and carries its decisions', async () => {
    const store = await ticketStoreFor(storeEnv())
    await expect(
      store.create({ type: 'brief', title: 'Homeless', body: 'Decisions.' }),
    ).rejects.toMatchObject({ code: 'validation' })
    // An empty brief is not a brief — and unlike a material, no later extraction
    // fills the body in.
    await expect(
      store.create({ type: 'brief', title: 'Empty', fields: { site_slug: 'home' }, body: '   ' }),
    ).rejects.toMatchObject({ code: 'validation' })

    const { ticket } = await store.create({
      type: 'brief',
      title: 'Decisions for home',
      fields: { site_slug: 'home' },
      body: 'Oxblood, not crimson.',
    })
    expect(ticket.fields.site_slug).toBe('home')
  })

  it('UAT_FC_REQ-162 a chat session persists as a ticket with its transcript comment', async () => {
    // DOC-10 §8's mapping, end to end: the session is a `chat` ticket found by
    // `fields.session_id`, the transcript is a `chat_transcript` comment on it,
    // and the BODY is left alone because that is the summary's home — not the
    // transcript's. This is the merge REQ-162 exists to make possible.
    const store = await ticketStoreFor(storeEnv())
    const { ticket } = await store.create({
      type: 'chat',
      title: 'Building the landing page',
      fields: { session_id: 'sess-req162', backend: 'claude' },
    })
    expect(ticket.status).toBe('open')

    await store.comment({
      uid: ticket.uid,
      kind: 'chat_transcript',
      body: '# xgd-chat\n\nuser: make the hero taller',
    })
    const { comments } = await store.comments({ uid: ticket.uid })
    expect(comments).toHaveLength(1)
    expect(comments[0].fields.kind).toBe('chat_transcript')

    const { tickets } = await store.query({
      predicate: 'type=chat AND fields.session_id=sess-req162',
      limit: 'all',
    })
    expect(tickets.map((t) => t.uid)).toEqual([ticket.uid])
  })
})
