import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  ticketStoreFor,
  type TicketStore,
  type TicketStoreEnv,
} from '../apps/control-app/src/tickets'
import { applySchema } from './support/d1-site-factory'

/**
 * story-a7a12d81 — **where a client's attached bytes actually land**.
 *
 * Every assertion below runs inside workerd, through the same `ticketStoreFor`
 * the deployed Worker calls, against a real D1 database and **two** real object
 * stores — the material store and the one the public site is served from. Both
 * are declared to the harness deliberately: the claim this story leads with is
 * that bytes go to one and never the other, and a suite with only one store
 * bound could not tell a correct placement from a store that simply was not
 * there to check.
 *
 * THE CONFIGURATION HALF IS PROVED SEPARATELY (`…-material-blob-storage.test.ts`,
 * AC-1489 / AC-1490). What is proved here is where the bytes WENT, which is a
 * different question from what the configuration says about it — the mutation
 * that gives AC-1487 its teeth is re-pointing the store's byte layer at the
 * public site's store, and only a runtime check against real stores can see it.
 */

const ACCOUNT_A = 'story-a7a12d81-a'
const ACCOUNT_B = 'story-a7a12d81-b'

/** The Worker's own bindings, as a ticket-store env. */
function storeEnv(overrides: Partial<TicketStoreEnv> = {}): TicketStoreEnv {
  return {
    DB: env.DB as D1Database,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: ACCOUNT_A,
    ...overrides,
  }
}

/** The `material` shape [[DOC-38]] §9 requires, stated once. */
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

/** The content address, derived here rather than taken from the record. */
async function digestOf(bytes: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', bytes as unknown as BufferSource)
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Attach bytes to a fresh piece of material, and hand back the record. */
async function attach(store: TicketStore, bytes: Uint8Array, title = 'Material') {
  const { ticket } = await store.create({ type: 'material', title, fields: material() })
  const { attachment } = await store.attach({ uid: ticket.uid, bytes })
  return { ticket, attachment }
}

/** Every key an object store holds under a prefix. */
async function keysUnder(bucket: R2Bucket, prefix: string): Promise<string[]> {
  const listed = await bucket.list({ prefix, limit: 1000 })
  return listed.objects.map((o) => o.key).sort()
}

/** The account's own namespace in the material store. */
const namespaceOf = (account: string): string => `t/${account}/`

/** The address AC-1487 names: the account, and the content address on the record. */
const addressOf = (account: string, sha256: unknown): string =>
  `${namespaceOf(account)}blob/${String(sha256)}`

const bytesOf = (text: string): Uint8Array => new TextEncoder().encode(text)

beforeAll(async () => {
  await applySchema()
})

// ── AC-1486: the record the bytes come back as ───────────────────────────────

describe('story-a7a12d81 — attaching bytes, and reading back what was attached', () => {
  it('test_UAT_AC1486_attached_bytes_come_back_as_a_record_naming_their_content_address_and_size', async () => {
    const store = await ticketStoreFor(storeEnv())
    const { ticket } = await store.create({
      type: 'material',
      title: 'Brand guidelines',
      fields: material(),
    })

    const bytes = bytesOf('%PDF-1.7 brand guidelines, in confidence\n')
    const { attachment } = await store.attach({
      uid: ticket.uid,
      bytes,
      filename: 'brand.pdf',
      content_type: 'application/pdf',
    })

    // ── a content address, derived from the bytes themselves ────────────────
    // Compared against a digest computed HERE, not merely shape-matched: a
    // 64-hex field that was a random identifier would satisfy the pattern and
    // nothing else in this story — dedup, isolation, and the disclosure check
    // itself — would be observable.
    expect(attachment.fields.sha256).toMatch(/^[0-9a-f]{64}$/)
    expect(attachment.fields.sha256).toBe(await digestOf(bytes))

    // Identical for identical bytes, different for any other bytes.
    const { attachment: again } = await store.attach({ uid: ticket.uid, bytes })
    expect(again.fields.sha256).toBe(attachment.fields.sha256)
    const { attachment: other } = await store.attach({
      uid: ticket.uid,
      bytes: bytesOf('%PDF-1.7 brand guidelines, in confidence'),
    })
    expect(other.fields.sha256).not.toBe(attachment.fields.sha256)

    // ── a size equal, exactly, to the number of bytes attached ──────────────
    expect(attachment.fields.size).toBe(bytes.byteLength)
    expect(attachment.fields.size).toBe(41)

    // ── and the filename and content type supplied with it ──────────────────
    expect(attachment.fields.filename).toBe('brand.pdf')
    expect(attachment.fields.content_type).toBe('application/pdf')

    // ── listed under the material it belongs to ─────────────────────────────
    // No separate step associated it: the listing above is the first read of
    // the parent since the attach, and the record is already on it.
    const { attachments } = await store.attachments({ uid: ticket.uid })
    expect(attachments.map((a) => a.uid)).toContain(attachment.uid)
    expect(attachments.map((a) => a.uid)).toEqual(
      expect.arrayContaining([attachment.uid, again.uid, other.uid]),
    )

    // It is reached FROM the parent rather than standing free — the record
    // names the ticket it hangs off, exactly as a comment does, so there is no
    // second lifecycle to keep in step.
    expect(attachment.fields.subject_uid).toBe(ticket.uid)
    const { ticket: sibling } = await store.create({
      type: 'material',
      title: 'A different piece of material',
      fields: material(),
    })
    const { attachments: none } = await store.attachments({ uid: sibling.uid })
    expect(none.map((a) => a.uid), 'an attachment belongs to one ticket').not.toContain(
      attachment.uid,
    )

    // ── nothing beyond an existing ticket and the bytes ─────────────────────
    // No account argument, no location, and no prior registration of a place to
    // put them: the store handle already carries all three.
    const { attachment: bareCall } = await store.attach({
      uid: sibling.uid,
      bytes: bytesOf('just the bytes'),
    })
    expect(bareCall.fields.sha256).toBe(await digestOf(bytesOf('just the bytes')))
    expect(bareCall.fields.size).toBe(14)
    const { attachments: listed } = await store.attachments({ uid: sibling.uid })
    expect(listed.map((a) => a.uid)).toEqual([bareCall.uid])
  })
})

// ── AC-1487: the material store, and never the public site's ─────────────────

describe('story-a7a12d81 — the bytes are in the material store and nowhere the public site reaches', () => {
  it('test_UAT_AC1487_attached_bytes_are_in_the_material_store_under_the_accounts_address_and_absent_from_the_public_sites', async () => {
    const store = await ticketStoreFor(storeEnv({ TENANT_ID: ACCOUNT_A }))
    const bytes = bytesOf('Positioning paper — commercial in confidence')

    const { ticket } = await store.create({
      type: 'material',
      title: 'Confidential',
      fields: material({ rights: 'third_party', republishable: false, exportable: false }),
    })
    const { attachment } = await store.attach({ uid: ticket.uid, bytes })

    // ── present in the material store, at the account's own address ─────────
    // Composed of the account the handle is scoped to and the content address
    // carried on the record — the account's own namespace, not a shared one.
    const address = addressOf(ACCOUNT_A, attachment.fields.sha256)
    expect(
      await env.BLOBS.head(address),
      `the material store holds the bytes at ${address}; it holds ${JSON.stringify(
        await keysUnder(env.BLOBS as R2Bucket, ''),
      )}`,
    ).not.toBeNull()
    const stored = await env.BLOBS.get(address)
    expect(new Uint8Array(await stored!.arrayBuffer())).toEqual(bytes)

    // ── and the public site's store holds nothing for it ────────────────────
    // Not at that address, and not under whatever account-scoped address the
    // material store actually used: the two stores are distinct destinations,
    // not one destination reached two ways.
    expect(await env.SITES.head(address), 'the public site store has nothing at that address')
      .toBeNull()
    const materialKeys = await keysUnder(env.BLOBS as R2Bucket, namespaceOf(ACCOUNT_A))
    expect(materialKeys.length, 'the material store did put the bytes somewhere').toBeGreaterThan(0)
    for (const key of materialKeys) {
      expect(await env.SITES.head(key), `the public site store has nothing at ${key}`).toBeNull()
    }
    expect(await keysUnder(env.SITES as R2Bucket, ''), 'the public site store is untouched').toEqual(
      [],
    )

    // ── and this holds however the material is classified ───────────────────
    // Nothing on the rights or provenance record changes which store the bytes
    // go to: confidential and freely republishable material alike are stored
    // where the public-facing half of the platform has no access.
    const open = bytesOf('A press release, free to republish')
    const { ticket: openTicket } = await store.create({
      type: 'material',
      title: 'Freely republishable',
      fields: material({ rights: 'owned', republishable: true, exportable: true }),
    })
    const { attachment: openAttachment } = await store.attach({ uid: openTicket.uid, bytes: open })
    const openAddress = addressOf(ACCOUNT_A, openAttachment.fields.sha256)
    expect(await env.BLOBS.head(openAddress)).not.toBeNull()
    expect(await env.SITES.head(openAddress)).toBeNull()
    expect(await keysUnder(env.SITES as R2Bucket, '')).toEqual([])
  })
})

// ── AC-1488: one object within an account, two across two ────────────────────

describe('story-a7a12d81 — content-derived addressing, scoped to the account', () => {
  it('test_UAT_AC1488_the_same_file_is_one_object_within_an_account_and_two_across_two_accounts', async () => {
    const a = await ticketStoreFor(storeEnv({ TENANT_ID: ACCOUNT_A }))
    const b = await ticketStoreFor(storeEnv({ TENANT_ID: ACCOUNT_B }))
    const shared = bytesOf('the same file, handed to two platforms')

    // ── isolation across accounts ───────────────────────────────────────────
    // Byte-for-byte identical content through two handles: the SAME content
    // address on both records, and two DIFFERENT absolute locations. A global
    // address would be both an existence oracle across the barrier and an
    // obstacle to erasing one account's material without touching another's.
    const inA = (await attach(a, shared, 'Same bytes, account A')).attachment
    const inB = (await attach(b, shared, 'Same bytes, account B')).attachment
    expect(inA.fields.sha256).toBe(await digestOf(shared))
    expect(inB.fields.sha256).toBe(inA.fields.sha256)

    const keyA = addressOf(ACCOUNT_A, inA.fields.sha256)
    const keyB = addressOf(ACCOUNT_B, inB.fields.sha256)
    expect(keyA).not.toBe(keyB)
    expect(await env.BLOBS.head(keyA), `account A's object exists at ${keyA}`).not.toBeNull()
    expect(await env.BLOBS.head(keyB), `account B's object exists at ${keyB}`).not.toBeNull()

    // Neither account's bytes are reached at the other's location…
    expect(await keysUnder(env.BLOBS as R2Bucket, namespaceOf(ACCOUNT_A))).not.toContain(keyB)
    expect(await keysUnder(env.BLOBS as R2Bucket, namespaceOf(ACCOUNT_B))).not.toContain(keyA)
    // …and removing one leaves the other untouched, which is what makes erasing
    // one account's material possible at all.
    await (env.BLOBS as R2Bucket).delete(keyA)
    expect(await env.BLOBS.head(keyA)).toBeNull()
    expect(await env.BLOBS.head(keyB), "account B's object survives account A's erasure")
      .not.toBeNull()

    // ── dedup within an account ─────────────────────────────────────────────
    // The same file attached twice under one account is ONE stored object, not
    // two copies — the property content-derived addressing exists for. Counted
    // as objects in the account's namespace, so it is a claim about the store
    // rather than about the two records.
    const twice = bytesOf('one file, attached to two pieces of material')
    const first = (await attach(b, twice, 'First attach')).attachment
    const before = await keysUnder(env.BLOBS as R2Bucket, namespaceOf(ACCOUNT_B))
    const second = (await attach(b, twice, 'Second attach')).attachment
    const after = await keysUnder(env.BLOBS as R2Bucket, namespaceOf(ACCOUNT_B))

    expect(second.fields.sha256).toBe(first.fields.sha256)
    expect(after, 'the second attach of identical bytes stored no second copy').toEqual(before)
    expect(await env.BLOBS.head(addressOf(ACCOUNT_B, first.fields.sha256))).not.toBeNull()

    // ── the account is never supplied to an attach operation ────────────────
    // The location's account component comes from the handle, so no caller can
    // place bytes into another account's namespace — not by mistake, and not by
    // choosing the address.
    const intruder = bytesOf('bytes aimed at somebody else')
    const { ticket } = await a.create({ type: 'material', title: 'Aimed', fields: material() })
    const beforeInB = await keysUnder(env.BLOBS as R2Bucket, namespaceOf(ACCOUNT_B))
    await (
      a.attach as (arg: Record<string, unknown>) => Promise<unknown>
    )({
      uid: ticket.uid,
      bytes: intruder,
      tenant_id: ACCOUNT_B,
      key: addressOf(ACCOUNT_B, await digestOf(intruder)),
    }).catch(() => null)
    expect(
      await keysUnder(env.BLOBS as R2Bucket, namespaceOf(ACCOUNT_B)),
      "naming another account on the call places nothing in that account's namespace",
    ).toEqual(beforeInB)
    expect(await env.BLOBS.head(addressOf(ACCOUNT_B, await digestOf(intruder)))).toBeNull()
  })
})
