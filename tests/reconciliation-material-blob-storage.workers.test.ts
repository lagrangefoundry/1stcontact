import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  ticketStoreFor,
  type Ticket,
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
 * ADDRESSING IS DERIVED FROM THE RECORD, NOT FROM THE CONTENT. The store gave
 * up content-derived addressing deliberately: a stored object shared between two
 * records cannot be moved to the trash without breaking whichever sibling still
 * names it, and moving it is what makes deletion actually revoke reach. So the
 * location is composed of the account the handle is scoped to and the attachment
 * record's own identity, identical bytes attached twice are two stored objects
 * even inside one account, and `sha256` stays on the record as an **integrity**
 * field rather than as the address. Every location below is composed that way —
 * from the record — which is why a read that resolved to nothing would be a
 * failure here rather than an invisible one.
 *
 * THE CONFIGURATION HALF IS PROVED SEPARATELY (`…-material-blob-storage.test.ts`,
 * AC-1489 / AC-1490). What is proved here is where the bytes WENT, which is a
 * different question from what the configuration says about it — the mutation
 * that gives AC-1487 its teeth is re-pointing the store's byte layer at the
 * public site's store, and only a runtime check against real stores can see it.
 */

/**
 * One account per criterion.
 *
 * The material store is shared across this file, and every claim below is about
 * what an account's own namespace holds — counted, in places, rather than merely
 * probed. Separate accounts keep those counts about the test that made them.
 */
const ACCOUNT = {
  record: 'story-a7a12d81-record',
  placement: 'story-a7a12d81-placement',
  derivedA: 'story-a7a12d81-derived-a',
  derivedB: 'story-a7a12d81-derived-b',
  sibling: 'story-a7a12d81-sibling',
} as const

/** The Worker's own bindings, as a ticket-store env. */
function storeEnv(tenant: string): TicketStoreEnv {
  return {
    DB: env.DB as D1Database,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: tenant,
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

/** The integrity digest, derived here rather than taken from the record. */
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

/**
 * The address the story names: the account the handle is scoped to, and the
 * attachment **record** that names the bytes.
 *
 * Composed from `attachment.uid` — the record's own identity — and never from
 * `fields.sha256`. That is the whole correction this story carries: a location
 * composed from the digest resolved to nothing, every time, and survived two
 * intents because no surface read a blob back until one did.
 */
const addressOf = (account: string, attachment: Ticket): string =>
  `${namespaceOf(account)}blob/${attachment.uid}`

const bytesOf = (text: string): Uint8Array => new TextEncoder().encode(text)

/** The bytes an object store actually holds at a key, or null if it holds none. */
async function bytesAt(bucket: R2Bucket, key: string): Promise<Uint8Array | null> {
  const object = await bucket.get(key)
  return object ? new Uint8Array(await object.arrayBuffer()) : null
}

beforeAll(async () => {
  await applySchema()
})

// ── AC-1486: the record the bytes come back as ───────────────────────────────

describe('story-a7a12d81 — attaching bytes, and reading back what was attached', () => {
  it('test_UAT_AC1486_attached_bytes_come_back_as_a_record_naming_their_integrity_digest_and_size', async () => {
    const store = await ticketStoreFor(storeEnv(ACCOUNT.record))
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

    // ── an integrity digest, derived from the bytes themselves ──────────────
    // Compared against a digest computed HERE, not merely shape-matched: a
    // 64-hex field that was a random identifier would satisfy the pattern while
    // saying nothing about the content, and checking a stored object against the
    // bytes that were attached is the one thing this field is for.
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

    // ── it describes the content; it is NOT where the bytes are stored ──────
    // The two records above carry one digest and are nonetheless two different
    // stored objects, so the digest cannot be the address. Stated as an
    // assertion because it is exactly the belief that produced reads resolving
    // to nothing: composing a location from the digest finds no object, and
    // composing it from the record finds one.
    expect(again.fields.sha256).toBe(attachment.fields.sha256)
    expect(again.uid).not.toBe(attachment.uid)
    expect(await env.BLOBS.head(addressOf(ACCOUNT.record, attachment))).not.toBeNull()
    expect(await env.BLOBS.head(addressOf(ACCOUNT.record, again))).not.toBeNull()
    expect(
      await env.BLOBS.head(
        `${namespaceOf(ACCOUNT.record)}blob/${String(attachment.fields.sha256)}`,
      ),
      'the digest is an integrity field, not a location',
    ).toBeNull()

    // ── a size equal, exactly, to the number of bytes attached ──────────────
    expect(attachment.fields.size).toBe(bytes.byteLength)
    expect(attachment.fields.size).toBe(41)

    // ── and the filename and content type supplied with it ──────────────────
    expect(attachment.fields.filename).toBe('brand.pdf')
    expect(attachment.fields.content_type).toBe('application/pdf')

    // ── listed under the material it belongs to ─────────────────────────────
    // No separate step associated it: the listing below is the first read of
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
    const store = await ticketStoreFor(storeEnv(ACCOUNT.placement))
    const bytes = bytesOf('Positioning paper — commercial in confidence')

    const { ticket } = await store.create({
      type: 'material',
      title: 'Confidential',
      fields: material({ rights: 'third_party', republishable: false, exportable: false }),
    })
    const { attachment } = await store.attach({ uid: ticket.uid, bytes })

    // ── present in the material store, at the account's own address ─────────
    // Composed of the account the handle is scoped to and the attachment record
    // that names the bytes — the account's own namespace, not a shared one.
    const address = addressOf(ACCOUNT.placement, attachment)
    expect(
      await env.BLOBS.head(address),
      `the material store holds the bytes at ${address}; under this account it holds ${JSON.stringify(
        await keysUnder(env.BLOBS as R2Bucket, namespaceOf(ACCOUNT.placement)),
      )}`,
    ).not.toBeNull()
    expect(await bytesAt(env.BLOBS as R2Bucket, address)).toEqual(bytes)

    // ── and the public site's store holds nothing for it ────────────────────
    // Not at that address, and not under whatever account-scoped address the
    // material store actually used: the two stores are distinct destinations,
    // not one destination reached two ways.
    expect(await env.SITES.head(address), 'the public site store has nothing at that address')
      .toBeNull()
    const materialKeys = await keysUnder(env.BLOBS as R2Bucket, namespaceOf(ACCOUNT.placement))
    expect(materialKeys.length, 'the material store did put the bytes somewhere').toBeGreaterThan(0)
    for (const key of materialKeys) {
      expect(await env.SITES.head(key), `the public site store has nothing at ${key}`).toBeNull()
    }
    expect(
      await keysUnder(env.SITES as R2Bucket, namespaceOf(ACCOUNT.placement)),
      "the public site store holds nothing in this account's namespace",
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
    const openAddress = addressOf(ACCOUNT.placement, openAttachment)
    expect(await bytesAt(env.BLOBS as R2Bucket, openAddress)).toEqual(open)
    expect(await env.SITES.head(openAddress)).toBeNull()
    expect(await keysUnder(env.SITES as R2Bucket, namespaceOf(ACCOUNT.placement))).toEqual([])
  })
})

// ── AC-1488: one record one object, and two accounts two unreachable objects ─

describe('story-a7a12d81 — record-derived addressing, scoped to the account', () => {
  it('test_UAT_AC1488_identical_bytes_are_two_objects_in_one_account_and_two_unreachable_objects_across_two', async () => {
    const a = await ticketStoreFor(storeEnv(ACCOUNT.derivedA))
    const b = await ticketStoreFor(storeEnv(ACCOUNT.derivedB))
    const shared = bytesOf('the same file, handed to two platforms')

    // ── isolation across accounts ───────────────────────────────────────────
    // Byte-for-byte identical content through two handles: the SAME integrity
    // digest on both records, and two DIFFERENT absolute locations, both holding
    // an object. A global address would be both an existence oracle across the
    // barrier and an obstacle to erasing one account's material without touching
    // another's.
    const inA = (await attach(a, shared, 'Same bytes, account A')).attachment
    const inB = (await attach(b, shared, 'Same bytes, account B')).attachment
    expect(inA.fields.sha256).toBe(await digestOf(shared))
    expect(inB.fields.sha256).toBe(inA.fields.sha256)

    const keyA = addressOf(ACCOUNT.derivedA, inA)
    const keyB = addressOf(ACCOUNT.derivedB, inB)
    expect(keyA).not.toBe(keyB)
    expect(await bytesAt(env.BLOBS as R2Bucket, keyA), `account A's object exists at ${keyA}`)
      .toEqual(shared)
    expect(await bytesAt(env.BLOBS as R2Bucket, keyB), `account B's object exists at ${keyB}`)
      .toEqual(shared)

    // Neither account's bytes are reached at the other's location…
    expect(await keysUnder(env.BLOBS as R2Bucket, namespaceOf(ACCOUNT.derivedA))).not.toContain(keyB)
    expect(await keysUnder(env.BLOBS as R2Bucket, namespaceOf(ACCOUNT.derivedB))).not.toContain(keyA)
    // …and removing one leaves the other untouched, which is what makes erasing
    // one account's material possible at all.
    await (env.BLOBS as R2Bucket).delete(keyA)
    expect(await env.BLOBS.head(keyA)).toBeNull()
    expect(await bytesAt(env.BLOBS as R2Bucket, keyB), "account B's object survives account A's erasure")
      .toEqual(shared)

    // ── one record, one stored object — no dedup within an account ──────────
    // The same file attached twice under ONE account is TWO stored objects, each
    // at the location derived from its own record. Counted as objects in the
    // account's namespace, so it is a claim about the store rather than about
    // the two records: the namespace grows by exactly one object per attach.
    const twice = bytesOf('one file, attached to two pieces of material')
    const first = (await attach(b, twice, 'First attach')).attachment
    const before = await keysUnder(env.BLOBS as R2Bucket, namespaceOf(ACCOUNT.derivedB))
    const second = (await attach(b, twice, 'Second attach')).attachment
    const after = await keysUnder(env.BLOBS as R2Bucket, namespaceOf(ACCOUNT.derivedB))

    expect(second.fields.sha256, 'one digest — the bytes are identical').toBe(first.fields.sha256)
    const keyFirst = addressOf(ACCOUNT.derivedB, first)
    const keySecond = addressOf(ACCOUNT.derivedB, second)
    expect(keyFirst, 'two records, two distinct locations').not.toBe(keySecond)
    expect(await bytesAt(env.BLOBS as R2Bucket, keyFirst)).toEqual(twice)
    expect(await bytesAt(env.BLOBS as R2Bucket, keySecond)).toEqual(twice)
    expect(
      after,
      'the second attach of identical bytes stored a second object, not a shared one',
    ).toEqual([...before, keySecond].sort())

    // ── the account is never supplied to an attach operation ────────────────
    // The location's account component comes from the handle, so no caller can
    // place bytes into another account's namespace — not by mistake, and not by
    // choosing the address.
    const intruder = bytesOf('bytes aimed at somebody else')
    const { ticket } = await a.create({ type: 'material', title: 'Aimed', fields: material() })
    const beforeInB = await keysUnder(env.BLOBS as R2Bucket, namespaceOf(ACCOUNT.derivedB))
    const aimed = await (
      a.attach as (arg: Record<string, unknown>) => Promise<{ attachment: Ticket }>
    )({
      uid: ticket.uid,
      bytes: intruder,
      tenant_id: ACCOUNT.derivedB,
      key: `${namespaceOf(ACCOUNT.derivedB)}blob/chosen-by-the-caller`,
    }).catch(() => null)
    expect(
      await keysUnder(env.BLOBS as R2Bucket, namespaceOf(ACCOUNT.derivedB)),
      "naming another account on the call places nothing in that account's namespace",
    ).toEqual(beforeInB)
    expect(await env.BLOBS.head(`${namespaceOf(ACCOUNT.derivedB)}blob/chosen-by-the-caller`))
      .toBeNull()
    // Where the bytes DID go, if the call succeeded: account A's namespace, at
    // the address derived from the record the call produced.
    if (aimed) {
      expect(await bytesAt(env.BLOBS as R2Bucket, addressOf(ACCOUNT.derivedA, aimed.attachment)))
        .toEqual(intruder)
    }
  })
})

// ── AC-1739: one record's bytes are never a sibling's bytes ──────────────────

describe('story-a7a12d81 — removing one record’s bytes cannot break a sibling record', () => {
  it('test_UAT_AC1739_one_record_owns_one_object_so_removing_it_leaves_a_sibling_holding_the_same_content_intact', async () => {
    const store = await ticketStoreFor(storeEnv(ACCOUNT.sibling))
    const content = bytesOf('One brand guideline, attached to two pieces of material')
    const digest = await digestOf(content)

    // ── two tickets, one account, byte-for-byte identical content ───────────
    const { ticket: doomed } = await store.create({
      type: 'material',
      title: 'The material whose bytes are removed',
      fields: material(),
    })
    const { ticket: survivor } = await store.create({
      type: 'material',
      title: 'The sibling that holds the same content',
      fields: material(),
    })
    const { attachment: doomedRecord } = await store.attach({ uid: doomed.uid, bytes: content })
    const { attachment: survivorRecord } = await store.attach({ uid: survivor.uid, bytes: content })

    // ── two stored objects, each at its own record's location ──────────────
    // Not one object named twice: that is the arrangement whose deletion breaks
    // a sibling, and it is the arrangement this criterion exists to rule out.
    const doomedKey = addressOf(ACCOUNT.sibling, doomedRecord)
    const survivorKey = addressOf(ACCOUNT.sibling, survivorRecord)
    expect(doomedKey).not.toBe(survivorKey)
    expect(await bytesAt(env.BLOBS as R2Bucket, doomedKey)).toEqual(content)
    expect(await bytesAt(env.BLOBS as R2Bucket, survivorKey)).toEqual(content)
    expect(
      await keysUnder(env.BLOBS as R2Bucket, namespaceOf(ACCOUNT.sibling)),
      'two records, two objects',
    ).toEqual([doomedKey, survivorKey].sort())

    // ── the same integrity digest on both records, before the removal ───────
    expect(doomedRecord.fields.sha256).toBe(digest)
    expect(survivorRecord.fields.sha256).toBe(digest)

    // ── remove the object one record names ─────────────────────────────────
    await (env.BLOBS as R2Bucket).delete(doomedKey)
    expect(await env.BLOBS.head(doomedKey), "the removed record's bytes are gone").toBeNull()

    // ── the sibling is present, unchanged, and still at its own location ────
    // A removal, not a removal for one holder and a break for the other.
    expect(
      await env.BLOBS.head(survivorKey),
      'the sibling record’s object is still reachable at its own location',
    ).not.toBeNull()
    const survived = await bytesAt(env.BLOBS as R2Bucket, survivorKey)
    expect(survived, 'byte-for-byte what was attached').toEqual(content)
    expect(await digestOf(survived!), 'and unchanged by the removal').toBe(digest)

    // ── both records still carry the same digest afterwards ─────────────────
    // The digest describes the content and says nothing about how many copies
    // are stored or which survive — so it is read back from the records rather
    // than from the objects, after one of the objects has ceased to exist.
    const { attachments: onDoomed } = await store.attachments({ uid: doomed.uid })
    const { attachments: onSurvivor } = await store.attachments({ uid: survivor.uid })
    expect(onDoomed.map((a) => a.uid)).toEqual([doomedRecord.uid])
    expect(onSurvivor.map((a) => a.uid)).toEqual([survivorRecord.uid])
    expect(onDoomed[0].fields.sha256).toBe(digest)
    expect(onSurvivor[0].fields.sha256).toBe(digest)
  })
})
