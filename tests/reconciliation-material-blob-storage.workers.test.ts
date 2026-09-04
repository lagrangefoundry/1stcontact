import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { Accessor, MultiTenantTicketStore } from '../apps/control-app/src/generated/ticketing'
import {
  productTypePack,
  ticketStoreFor,
  type Ticket,
  type TicketStore,
  type TicketStoreEnv,
} from '../apps/control-app/src/tickets'
import { MaterialRejectedError, materialFile } from '../apps/control-app/src/material'
import { applySchema } from './support/d1-site-factory'

/**
 * story-a7a12d81 — **where a client's attached bytes land, and how they come back**.
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
 *
 * THE ADDRESS IS THE RECORD, NOT THE DIGEST, and that is the correction REQ-161
 * records. The component this store is built on gave content-addressing up
 * deliberately: a stored object shared between two records cannot be moved to the
 * trash without breaking whichever sibling still names it, and moving it is what
 * makes deleting a client's material actually revoke reach. So `sha256` stays on
 * the record as an INTEGRITY field, the location is the attachment record's own
 * uid under the account's prefix, and one record owns exactly one stored object.
 * A location composed from the digest is asserted NOWHERE below — re-pinning it
 * is what left AC-1486 passing while reading the bytes back was impossible, for
 * two whole intents, because nothing had ever read a blob back (AC-1590 is now
 * the criterion that would have caught it).
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

/** The content digest, derived here rather than taken from the record. */
async function digestOf(bytes: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', bytes as unknown as BufferSource)
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Attach bytes to a fresh piece of material, and hand back both records. */
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

/**
 * The absolute location of an attachment's bytes: the account the handle is
 * scoped to, and **the attachment record's own identifier**.
 *
 * Composed here from the two things the criteria name, so that a change of
 * addressing shows up as a failure rather than as a test that quietly follows
 * the code wherever it goes.
 */
const addressOf = (account: string, attachment: Ticket): string =>
  `${namespaceOf(account)}blob/${attachment.uid}`

const bytesOf = (text: string): Uint8Array => new TextEncoder().encode(text)

/**
 * The real store with its byte layer removed, and nothing else substituted.
 *
 * A DELEGATING WRAPPER RATHER THAN A FAKE, following the pattern the ingestion
 * suite already establishes: every operation is the real store's, so the ticket
 * and its attachment record below are read out of real D1 by the component's own
 * code. The absent byte layer is the only thing changed, which is what makes the
 * refusal attributable to it.
 */
function withoutTheByteLayer(inner: TicketStore): TicketStore {
  return {
    create: (a) => inner.create(a),
    get: (a) => inner.get(a),
    resolve_id: (a) => inner.resolve_id(a),
    list: (a) => inner.list(a),
    query: (a) => inner.query(a),
    update: (a) => inner.update(a),
    comment: (a) => inner.comment(a),
    comments: (a) => inner.comments(a),
    attach: (a) => inner.attach(a),
    attachments: (a) => inner.attachments(a),
    blobs: null,
  }
}

beforeAll(async () => {
  await applySchema()
})

// ── AC-1486: the record the bytes come back as ───────────────────────────────

describe('story-a7a12d81 — attaching bytes yields a record naming their digest and size', () => {
  it('test_UAT_AC1486_attached_bytes_come_back_as_a_record_naming_their_content_digest_and_size', async () => {
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

    // ── a content digest, derived from the bytes themselves ─────────────────
    // Compared against a digest computed HERE, not merely shape-matched: a
    // 64-hex field that was a random identifier would satisfy the pattern while
    // proving nothing about the bytes it claims to stand for.
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

    // ── and it is an INTEGRITY field, not where the bytes are ────────────────
    // The two records above carry one digest between them and are nonetheless
    // two independent stored objects, at two locations neither of which is the
    // digest. Stated here because AC-1486 is the criterion that used to assert
    // the opposite, and the assertion was what hid the unreadable-bytes defect.
    expect(again.uid).not.toBe(attachment.uid)
    const first = addressOf(ACCOUNT_A, attachment)
    const duplicate = addressOf(ACCOUNT_A, again)
    expect(first).not.toBe(duplicate)
    expect(await env.BLOBS.head(first)).not.toBeNull()
    expect(await env.BLOBS.head(duplicate)).not.toBeNull()
    expect(
      await env.BLOBS.head(`${namespaceOf(ACCOUNT_A)}blob/${String(attachment.fields.sha256)}`),
      'the digest is not an address: nothing is stored under it',
    ).toBeNull()

    // ── a size equal, exactly, to the number of bytes attached ──────────────
    expect(attachment.fields.size).toBe(bytes.byteLength)
    expect(attachment.fields.size).toBe(41)

    // ── and the filename and content type supplied with it ──────────────────
    expect(attachment.fields.filename).toBe('brand.pdf')
    expect(attachment.fields.content_type).toBe('application/pdf')

    // ── listed under the material it belongs to ─────────────────────────────
    // No separate step associated it: the listing below is the first read of the
    // parent since the attach, and every record is already on it.
    const { attachments } = await store.attachments({ uid: ticket.uid })
    expect(attachments.map((a) => a.uid)).toContain(attachment.uid)
    expect(attachments.map((a) => a.uid)).toEqual(
      expect.arrayContaining([attachment.uid, again.uid, other.uid]),
    )

    // It is reached FROM the parent rather than standing free — the record names
    // the ticket it hangs off, exactly as a comment does, so there is no second
    // lifecycle to keep in step.
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
    // Composed of the account the handle is scoped to and the attachment record
    // that owns the bytes — the account's own namespace, not a shared one.
    const address = addressOf(ACCOUNT_A, attachment)
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
    expect(
      await env.SITES.head(address),
      'the public site store has nothing at that address',
    ).toBeNull()
    const materialKeys = await keysUnder(env.BLOBS as R2Bucket, namespaceOf(ACCOUNT_A))
    expect(materialKeys.length, 'the material store did put the bytes somewhere').toBeGreaterThan(0)
    for (const key of materialKeys) {
      expect(await env.SITES.head(key), `the public site store has nothing at ${key}`).toBeNull()
    }
    expect(
      await keysUnder(env.SITES as R2Bucket, ''),
      'the public site store is untouched',
    ).toEqual([])

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
    const openAddress = addressOf(ACCOUNT_A, openAttachment)
    expect(await env.BLOBS.head(openAddress)).not.toBeNull()
    expect(await env.SITES.head(openAddress)).toBeNull()
    expect(await keysUnder(env.SITES as R2Bucket, '')).toEqual([])

    // ── the mutation that gives this criterion its teeth ────────────────────
    // Re-point the store's byte layer at the public site's store and the claim
    // above must stop holding — otherwise it is a comment that happens to be
    // true. The mutation is a BINDING swap and not a code edit, which is the
    // whole reason the separation is a second store rather than a prefix: the
    // one thing between a confidential document and a public URL is which store
    // the wiring names, so that is exactly what is perturbed here. Kept last,
    // because it is the one operation in this file that writes to `SITES`.
    const mutant = await ticketStoreFor(storeEnv({ BLOBS: env.SITES as R2Bucket }))
    const { ticket: leaked } = await mutant.create({
      type: 'material',
      title: 'What the mutation would disclose',
      fields: material({ rights: 'third_party', republishable: false, exportable: false }),
    })
    const { attachment: leakedBytes } = await mutant.attach({
      uid: leaked.uid,
      bytes: bytesOf('the document the mutation would publish'),
    })
    const leakedAddress = addressOf(ACCOUNT_A, leakedBytes)
    expect(
      await env.SITES.head(leakedAddress),
      'the mutation is detectable: bytes land in the public site store',
    ).not.toBeNull()
    expect(
      await env.BLOBS.head(leakedAddress),
      'and not in the material store, which is the assertion above inverted',
    ).toBeNull()
  })
})

// ── AC-1488: one record, one object — within an account and across two ───────

describe('story-a7a12d81 — record-derived addressing, scoped to the account', () => {
  it('test_UAT_AC1488_one_record_owns_one_stored_object_and_one_accounts_bytes_are_unreachable_from_anothers', async () => {
    const a = await ticketStoreFor(storeEnv({ TENANT_ID: ACCOUNT_A }))
    const b = await ticketStoreFor(storeEnv({ TENANT_ID: ACCOUNT_B }))
    const shared = bytesOf('the same file, handed to two platforms')

    // ── isolation across accounts ───────────────────────────────────────────
    // Byte-for-byte identical content through two handles: the SAME digest on
    // both records, and two DIFFERENT absolute locations. A global address would
    // be both an existence oracle across the barrier and an obstacle to erasing
    // one account's material without touching another's.
    const inA = (await attach(a, shared, 'Same bytes, account A')).attachment
    const inB = (await attach(b, shared, 'Same bytes, account B')).attachment
    expect(inA.fields.sha256).toBe(await digestOf(shared))
    expect(inB.fields.sha256).toBe(inA.fields.sha256)

    const keyA = addressOf(ACCOUNT_A, inA)
    const keyB = addressOf(ACCOUNT_B, inB)
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

    // ── one record owns one stored object, WITHIN an account ─────────────────
    // The same file attached twice under one account is TWO stored objects, not
    // one shared between two records — which is what lets the bytes belonging to
    // one record be taken away without breaking the sibling that still names the
    // identical content. Counted as objects in the account's namespace, so it is
    // a claim about the store rather than about the two records.
    const twice = bytesOf('one file, attached to two pieces of material')
    const before = await keysUnder(env.BLOBS as R2Bucket, namespaceOf(ACCOUNT_B))
    const first = (await attach(b, twice, 'First attach')).attachment
    const second = (await attach(b, twice, 'Second attach')).attachment
    const after = await keysUnder(env.BLOBS as R2Bucket, namespaceOf(ACCOUNT_B))

    expect(second.fields.sha256, 'identical bytes still produce an identical digest').toBe(
      first.fields.sha256,
    )
    expect(second.uid).not.toBe(first.uid)
    const firstKey = addressOf(ACCOUNT_B, first)
    const secondKey = addressOf(ACCOUNT_B, second)
    expect(firstKey).not.toBe(secondKey)
    expect(after.length, 'two attaches of identical bytes stored two objects').toBe(
      before.length + 2,
    )
    expect(after).toEqual(expect.arrayContaining([firstKey, secondKey]))

    // Deleting one record's bytes leaves the other record's bytes reachable —
    // the property a shared, content-addressed object could not have had.
    await (env.BLOBS as R2Bucket).delete(firstKey)
    expect(await env.BLOBS.head(firstKey)).toBeNull()
    expect(
      await env.BLOBS.head(secondKey),
      "removing one record's bytes leaves the sibling's bytes in place",
    ).not.toBeNull()

    // ── the account is never supplied to an attach operation ────────────────
    // The location's account component comes from the handle, so no caller can
    // place bytes into another account's namespace — not by mistake, and not by
    // choosing the address.
    const intruder = bytesOf('bytes aimed at somebody else')
    const { ticket } = await a.create({ type: 'material', title: 'Aimed', fields: material() })
    const beforeInB = await keysUnder(env.BLOBS as R2Bucket, namespaceOf(ACCOUNT_B))
    const aimed = await (
      a.attach as (arg: Record<string, unknown>) => Promise<{ attachment: Ticket }>
    )({
      uid: ticket.uid,
      bytes: intruder,
      tenant_id: ACCOUNT_B,
      key: `${namespaceOf(ACCOUNT_B)}blob/chosen-by-the-caller`,
    }).catch(() => null)
    expect(
      await keysUnder(env.BLOBS as R2Bucket, namespaceOf(ACCOUNT_B)),
      "naming another account on the call places nothing in that account's namespace",
    ).toEqual(beforeInB)
    expect(
      await env.BLOBS.head(`${namespaceOf(ACCOUNT_B)}blob/chosen-by-the-caller`),
      'nor at an address the caller chose',
    ).toBeNull()
    // Where the call succeeded at all, the bytes went to A's own namespace, at
    // the record's own identifier — the handle's account, never the argument's.
    if (aimed) {
      expect(await env.BLOBS.head(addressOf(ACCOUNT_A, aimed.attachment))).not.toBeNull()
    }

    // ── and a digest reaches nothing, in either account ─────────────────────
    // The digest never determines the location, so presenting one cannot fetch
    // another record's bytes — in the caller's own account or anyone else's.
    for (const account of [ACCOUNT_A, ACCOUNT_B]) {
      expect(
        await env.BLOBS.head(`${namespaceOf(account)}blob/${String(inA.fields.sha256)}`),
        `${account}: a digest is not an address`,
      ).toBeNull()
    }
  })
})

// ── AC-1590: reading the bytes back through the record that owns them ────────

describe('story-a7a12d81 — attached bytes are read back through the owning record', () => {
  it('test_UAT_AC1590_attached_bytes_are_read_back_through_the_owning_record_and_absent_bytes_say_so', async () => {
    const store = await ticketStoreFor(storeEnv({ TENANT_ID: ACCOUNT_A }))
    const bytes = bytesOf('%PDF-1.7 the client’s own file, handed back to them\n')

    const { ticket } = await store.create({
      type: 'material',
      title: 'Brand guidelines',
      fields: material({ filename: 'brand.pdf' }),
    })
    const { attachment } = await store.attach({
      uid: ticket.uid,
      bytes,
      filename: 'brand.pdf',
      content_type: 'application/pdf',
    })

    // ── presenting the record is sufficient, and it is all that is needed ────
    // No account, no location and no digest is supplied: the material's own
    // identifier and the deployment's scoped store are the whole input, which is
    // exactly what the surface that shows a client their own file has to hand.
    const read = await materialFile(store, ticket.uid)
    expect(new Uint8Array(read.bytes), 'byte-for-byte what was attached').toEqual(bytes)
    expect(read.contentType).toBe('application/pdf')
    expect(read.filename).toBe('brand.pdf')

    // ── and presenting the record is the ONLY thing that works ──────────────
    // The digest is an integrity field. Asking the scoped byte handle for it
    // returns nothing, while asking for the record's own identifier returns the
    // bytes — the distinction that was invisible while nothing read a blob back.
    expect(
      await store.blobs!.get(String(attachment.fields.sha256)),
      'the content digest does not resolve to bytes',
    ).toBeNull()
    const throughRecord = await store.blobs!.get(attachment.uid)
    expect(throughRecord).not.toBeNull()
    expect(new Uint8Array(throughRecord!)).toEqual(bytes)

    // ── the read is bound to the account the same way the write is ──────────
    // A correctly-formed address belonging to another account is not readable
    // through this handle, even though the object plainly exists in the store.
    const other = await ticketStoreFor(storeEnv({ TENANT_ID: ACCOUNT_B }))
    const foreign = (await attach(other, bytesOf('account B’s own paper'))).attachment
    expect(await env.BLOBS.head(addressOf(ACCOUNT_B, foreign)), "B's object exists").not.toBeNull()
    expect(
      await store.blobs!.get(foreign.uid),
      "another account's blob is not reachable through this handle",
    ).toBeNull()

    // ── failure one: a record whose bytes are gone names the material ───────
    // A sweep collected an object something still named. That is a real fault,
    // and it is reported as one — not as the material not existing, and not as
    // an empty response.
    await (env.BLOBS as R2Bucket).delete(addressOf(ACCOUNT_A, attachment))
    const lost = await materialFile(store, ticket.uid).catch((error: Error) => error)
    expect(lost, 'a missing object is an error, never empty bytes').toBeInstanceOf(
      MaterialRejectedError,
    )
    expect((lost as Error).message).toMatch(/no longer in storage/i)
    expect(
      (lost as Error).message,
      'the failure names the material whose file is gone',
    ).toContain(ticket.uid)
    expect(
      (lost as Error).message,
      'and does not report the material itself as absent',
    ).not.toMatch(/not a piece of material|no file attached/i)

    // ── failure two: a store with no byte layer at all ──────────────────────
    // Reported as attached files being unreadable in this deployment, rather
    // than as this particular file being missing. `ticketStoreFor` refuses to
    // build such a store, so it is built the component's own way — which is the
    // contract the component actually ships.
    const base = new MultiTenantTicketStore(new Accessor(env.DB), productTypePack())
    const blobless = (await base.forTenant(ACCOUNT_A)) as unknown as TicketStore
    expect(blobless.blobs, 'a store built without a byte layer has none').toBeFalsy()
    const unreadable = await materialFile(blobless, ticket.uid).catch((error: Error) => error)
    expect(unreadable, 'the read fails rather than returning empty bytes').toBeInstanceOf(Error)
    expect(
      (unreadable as Error).message,
      'the deployment has no byte layer, so attached files cannot be read at all',
    ).toMatch(/blob\s?store/i)
    expect(
      (unreadable as Error).message,
      'the two failures are distinguished: this is not a file that went missing',
    ).not.toMatch(/no longer in storage/i)
    expect(
      (unreadable as Error).message,
      'nor is the material reported as not existing',
    ).not.toMatch(/not a piece of material/i)

    // The same condition reaching the product's own guard — the component
    // refuses at `attachments`, one call earlier, so `materialFile`'s guard is
    // driven with the attachment listing left real and the byte layer removed.
    // A DELEGATING WRAPPER, following the pattern the ingestion suite already
    // establishes: every operation below is the real store's except the one the
    // criterion is about.
    const guarded = await materialFile(withoutTheByteLayer(store), ticket.uid).catch(
      (error: Error) => error,
    )
    expect(guarded).toBeInstanceOf(MaterialRejectedError)
    expect((guarded as Error).message).toMatch(/no blob handle/i)
    expect((guarded as Error).message).toMatch(/cannot be read/i)
    expect((guarded as Error).message).not.toMatch(/no longer in storage/i)
  })
})
