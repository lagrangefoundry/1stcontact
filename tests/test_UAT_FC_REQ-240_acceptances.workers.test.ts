import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  ACCEPTANCE_TYPE,
  AcceptanceRefusedError,
  UnknownAcceptanceError,
  acceptanceOf,
  acceptancesOf,
  contactsWith,
  documentFor,
  documentOutstanding,
  recordAcceptance,
} from '../apps/control-app/src/acceptances'
import {
  BETA_REQUESTED,
  NEWSLETTER,
  PRIVACY_POLICY_ACCEPTED,
  T_AND_C_ACCEPTED,
  WHITEPAPERS,
} from '../apps/control-app/src/builder/acceptances.js'
import {
  ACCEPTANCE_GRANTED,
  ACCEPTANCE_REQUESTED,
  ACCEPTANCE_WITHDRAWN,
} from '../apps/control-app/src/builder/contact-events.js'
import { eventsOf } from '../apps/control-app/src/events'
import type { IdentityEnv } from '../apps/control-app/src/identity'
import { personDetail } from '../apps/control-app/src/people'
import type { Scope } from '../apps/control-app/src/scope'
import { productTypePack, ticketStoreFor, type TicketStoreEnv } from '../apps/control-app/src/tickets'
import { applySchema, ensureTenant } from './support/d1-site-factory'
import { seedContact } from './support/contact'

/**
 * REQ-240 — **user acceptances**: the registry, the state, and the events.
 *
 * WHAT THIS FILE PROVES. That what a contact has agreed to is three things that
 * cannot be collapsed: a definition in the BUSINESS'S OWN ticket store, a state
 * row that can be queried through an index, and an append-only history carrying
 * the wording they were shown. And that the three types behave differently — a
 * document is versioned by which ticket it was, a preference goes both ways, and
 * a request has no state at all.
 *
 * WHAT MAKES IT EVIDENCE. Every assertion runs inside workerd against a real D1
 * whose tables come from `db/migrations`, through the shipped functions rather
 * than a second copy of their SQL. Immutability is proved by the DATABASE
 * REFUSING an `UPDATE`, and "indexed rather than scanned" by SQLite's own query
 * plan — neither is a claim a hand-written fake could say anything about.
 *
 * THE WRITE IS CALLED WITH A DATABASE AND NOTHING ELSE, everywhere in this file.
 * There is no request, no session, no scope resolved from a hostname and no
 * route — which is the property [[REQ-240]] §6 asks for, because a public
 * self-serve sign-up will have none of those either.
 */

const A = 'req240-business-a'
const B = 'req240-business-b'

function identityEnv(tenantId = A): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: tenantId }
}

/** The whole environment the write path takes: a database. No session, no route. */
const dbOnly = () => ({ DB: env.DB as D1Database })

function storeEnv(): TicketStoreEnv {
  return { DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket }
}

const scope = (businessId = A): Scope => ({ businessId })

let seq = 0
const anEmail = (): string => `req240-${(seq += 1)}@example.test`
const aContact = (tenantId = A) => seedContact(identityEnv(tenantId), { tenantId, email: anEmail() })

/** D1 stamps `created_at` to the millisecond, so "newest" needs a real gap. */
const tick = () => new Promise((r) => setTimeout(r, 5))

const kinds = (events: Array<{ kind: string }>): string[] => events.map((e) => e.kind)

beforeAll(async () => {
  await applySchema()
  await ensureTenant(A)
  await ensureTenant(B)
})

describe('REQ-240 — the document is a ticket', () => {
  it('test_UAT_FC_REQ-240_a_document_acceptance_names_the_ticket_it_accepted', async () => {
    // The type is registered, which is not a claim about a literal in a file: an
    // unregistered type is REFUSED by the store, so a document that lands is the
    // registration.
    expect(productTypePack().has(ACCEPTANCE_TYPE)).toBe(true)

    const store = await ticketStoreFor(storeEnv(), scope())
    const inForce = await documentFor(store, T_AND_C_ACCEPTED)
    expect(inForce.type).toBe(ACCEPTANCE_TYPE)
    expect(inForce.fields.acceptance_key).toBe(T_AND_C_ACCEPTED)
    expect((inForce.body ?? '').trim()).not.toBe('')

    const contact = await aContact()
    const record = await recordAcceptance(dbOnly(), {
      contactId: contact,
      key: T_AND_C_ACCEPTED,
      granted: true,
      wording: 'I agree to the terms and conditions',
      documentUid: inForce.uid,
    })

    // THE UID AND NOT A VERSION STRING. "What did they agree to" resolves to
    // stored, immutable text rather than to a number somebody has to map back.
    expect(record?.documentUid).toBe(inForce.uid)
    expect(documentOutstanding(inForce, record)).toBe(false)
  })

  it('test_UAT_FC_REQ-240_bumping_the_document_leaves_prior_acceptances_outstanding', async () => {
    const store = await ticketStoreFor(storeEnv(), scope())
    const first = await documentFor(store, PRIVACY_POLICY_ACCEPTED)
    const contact = await aContact()
    await recordAcceptance(dbOnly(), {
      contactId: contact,
      key: PRIVACY_POLICY_ACCEPTED,
      granted: true,
      wording: 'I have read the privacy policy',
      documentUid: first.uid,
    })
    const before = await acceptanceOf(dbOnly(), scope(), contact, PRIVACY_POLICY_ACCEPTED)
    expect(documentOutstanding(first, before)).toBe(false)

    // BUMPING IS WRITING A NEWER TICKET UNDER THE SAME KEY. Nothing edits the
    // live one, so the record above still points at what was actually shown.
    await tick()
    const { ticket: second } = await store.create({
      type: ACCEPTANCE_TYPE,
      title: 'Privacy policy',
      fields: { acceptance_key: PRIVACY_POLICY_ACCEPTED },
      body: 'A second version of the policy, with a new paragraph about cookies.',
    })
    const inForce = await documentFor(store, PRIVACY_POLICY_ACCEPTED)
    expect(inForce.uid).toBe(second.uid)

    // THE FALSIFIER: every prior acceptance reads as outstanding, and NO ROW WAS
    // REWRITTEN to make that true — nothing swept the table, and the record still
    // says which document they actually agreed to.
    const after = await acceptanceOf(dbOnly(), scope(), contact, PRIVACY_POLICY_ACCEPTED)
    expect(after).toEqual(before)
    expect(after?.documentUid).toBe(first.uid)
    expect(documentOutstanding(inForce, after)).toBe(true)
  })

  it('test_UAT_FC_REQ-240_two_businesses_resolve_to_their_own_documents', async () => {
    // THE TENANCY CASE IS THE POINT OF THE DESIGN. A customer's terms are a
    // ticket in the customer's store, reached by this same code with no second
    // path and no platform-only branch — so the claim is worth exactly as much
    // as the test that two businesses get their own.
    const storeA = await ticketStoreFor(storeEnv(), scope(A))
    const storeB = await ticketStoreFor(storeEnv(), scope(B))

    const ours = await documentFor(storeA, T_AND_C_ACCEPTED)
    await storeB.create({
      type: ACCEPTANCE_TYPE,
      title: 'Terms and conditions',
      fields: { acceptance_key: T_AND_C_ACCEPTED },
      body: "Alice's Plumbing: work is guaranteed for twelve months.",
    })
    const theirs = await documentFor(storeB, T_AND_C_ACCEPTED)

    expect(theirs.uid).not.toBe(ours.uid)
    expect(theirs.body).toContain("Alice's Plumbing")
    expect(ours.body).not.toContain("Alice's Plumbing")

    // And a contact of B accepting B's document is outstanding against A's, which
    // is what "their own document" has to mean to be worth anything.
    const contact = await aContact(B)
    const record = await recordAcceptance(dbOnly(), {
      contactId: contact,
      key: T_AND_C_ACCEPTED,
      granted: true,
      wording: 'I agree to the terms',
      documentUid: theirs.uid,
    })
    expect(record?.businessId).toBe(B)
    expect(documentOutstanding(theirs, record)).toBe(false)
    expect(documentOutstanding(ours, record)).toBe(true)
  })
})

describe('REQ-240 — a preference goes both ways', () => {
  it('test_UAT_FC_REQ-240_granted_withdrawn_and_granted_again_all_survive', async () => {
    const contact = await aContact()
    const wording = 'Send me occasional news and offers'
    for (const granted of [true, false, true]) {
      await recordAcceptance(dbOnly(), { contactId: contact, key: NEWSLETTER, granted, wording })
    }

    // THE STATE READS THE LATEST, and is one row rather than a fold over the log.
    const state = await acceptanceOf(dbOnly(), scope(), contact, NEWSLETTER)
    expect(state?.granted).toBe(true)

    // AND ALL THREE TRANSITIONS SURVIVE AS DISTINCT ROWS. An untouched box today
    // is not the same fact as a withdrawal last week, and only the log tells them
    // apart — so a single kind with a payload, or a rewritten row, would lose it.
    const history = await eventsOf(identityEnv(), scope(), contact)
    expect(kinds(history).sort()).toEqual(
      [ACCEPTANCE_GRANTED, ACCEPTANCE_GRANTED, ACCEPTANCE_WITHDRAWN].sort(),
    )
    expect(new Set(history.map((e) => e.id)).size).toBe(3)
  })

  it('test_UAT_FC_REQ-240_a_preference_is_versioned_by_nothing', async () => {
    const contact = await aContact()
    const store = await ticketStoreFor(storeEnv(), scope())
    const document = await documentFor(store, T_AND_C_ACCEPTED)
    // A stored uid would imply a preference had a version. It does not — its
    // wording belongs to the surface that asked, and that is on the event.
    await expect(
      recordAcceptance(dbOnly(), {
        contactId: contact,
        key: BETA_REQUESTED,
        granted: true,
        wording: 'I would like to try the beta',
        documentUid: document.uid,
      }),
    ).rejects.toThrow(AcceptanceRefusedError)
  })
})

describe('REQ-240 — a request has no state', () => {
  it('test_UAT_FC_REQ-240_a_request_key_cannot_be_given_a_state_row', async () => {
    const contact = await aContact()
    const record = await recordAcceptance(dbOnly(), {
      contactId: contact,
      key: WHITEPAPERS,
      granted: true,
      wording: 'Send me the whitepapers',
    })

    // ASSERTED BY ATTEMPTING IT, through the shipped write path — the only way a
    // row could ever appear. There is no record to return and no row to find.
    expect(record).toBeNull()
    const row = await env.DB.prepare(
      'SELECT count(*) AS n FROM user_acceptances WHERE contact_id = ? AND acceptance_key = ?',
    )
      .bind(contact, WHITEPAPERS)
      .first<{ n: number }>()
    expect(row?.n).toBe(0)
    expect(await acceptancesOf(dbOnly(), scope(), contact)).toEqual([])

    // What DID happen is a fact about something that happened, and it is in the
    // history where it belongs.
    const history = await eventsOf(identityEnv(), scope(), contact)
    expect(kinds(history)).toEqual([ACCEPTANCE_REQUESTED])

    // And there is nothing to take back, so the only other write is refused.
    await expect(
      recordAcceptance(dbOnly(), {
        contactId: contact,
        key: WHITEPAPERS,
        granted: false,
        wording: 'Send me the whitepapers',
      }),
    ).rejects.toThrow(AcceptanceRefusedError)
  })
})

describe('REQ-240 — the state is a table', () => {
  it('test_UAT_FC_REQ-240_who_is_on_the_newsletter_is_an_indexed_query', async () => {
    const [yes, alsoYes, no] = [await aContact(), await aContact(), await aContact()]
    const elsewhere = await aContact(B)
    const wording = 'Send me occasional news and offers'
    for (const contact of [yes, alsoYes]) {
      await recordAcceptance(dbOnly(), { contactId: contact, key: NEWSLETTER, granted: true, wording })
    }
    await recordAcceptance(dbOnly(), { contactId: no, key: NEWSLETTER, granted: true, wording })
    await recordAcceptance(dbOnly(), { contactId: no, key: NEWSLETTER, granted: false, wording })
    await recordAcceptance(dbOnly(), {
      contactId: elsewhere,
      key: NEWSLETTER,
      granted: true,
      wording,
    })

    const onTheList = await contactsWith(dbOnly(), scope(), NEWSLETTER)
    expect(onTheList).toContain(yes)
    expect(onTheList).toContain(alsoYes)
    // THE WITHDRAWAL IS THE CASE THAT MATTERS. Somebody who joined and left is
    // not on the list, and is a different fact from somebody never asked — which
    // is exactly what a bag holding only the ticked boxes could not express.
    expect(onTheList).not.toContain(no)
    // Scoped by business, so another business's subscribers are not ours.
    expect(onTheList).not.toContain(elsewhere)
    expect(await contactsWith(dbOnly(), scope(), NEWSLETTER, false)).toContain(no)

    // THE FALSIFIER FOR "INDEXED, NOT SCANNED", ASKED OF SQLITE ITSELF. A JSON
    // bag on `users` could answer the same question and would answer it by
    // reading every contact in the business; this reads the index.
    const { results } = await env.DB.prepare(
      'EXPLAIN QUERY PLAN SELECT contact_id FROM user_acceptances ' +
        'WHERE business_id = ? AND acceptance_key = ? AND granted = ?',
    )
      .bind(A, NEWSLETTER, 1)
      .all<{ detail: string }>()
    const plan = (results ?? []).map((r) => r.detail).join(' ')
    expect(plan).toContain('idx_user_acceptances_business_key')
    expect(plan).not.toContain('SCAN user_acceptances')
  })

  it('test_UAT_FC_REQ-240_the_contact_detail_carries_the_current_answer', async () => {
    const contact = await aContact()
    await recordAcceptance(dbOnly(), {
      contactId: contact,
      key: NEWSLETTER,
      granted: true,
      wording: 'Send me occasional news and offers',
    })
    const detail = await personDetail(identityEnv(), scope(), contact)
    expect(detail?.acceptances.map((a) => a.key)).toEqual([NEWSLETTER])
    expect(detail?.acceptances[0].granted).toBe(true)
  })
})

describe('REQ-240 — the events', () => {
  it('test_UAT_FC_REQ-240_every_transition_carries_the_wording_and_none_is_rewritten', async () => {
    const contact = await aContact()
    const shown = 'Tick here to join our mailing list. You can unsubscribe at any time.'
    await recordAcceptance(dbOnly(), {
      contactId: contact,
      key: NEWSLETTER,
      granted: true,
      wording: shown,
    })
    await recordAcceptance(dbOnly(), {
      contactId: contact,
      key: NEWSLETTER,
      granted: false,
      wording: 'Untick to stop receiving our mailing list.',
    })

    const history = await eventsOf(identityEnv(), scope(), contact)
    expect(history).toHaveLength(2)
    for (const event of history) {
      expect(event.detail.key).toBe(NEWSLETTER)
      expect(String(event.detail.wording ?? '')).not.toBe('')
    }
    // THE WORDING IS WHAT WAS ON THE PAGE THAT DAY, not today's label: the two
    // rows carry different sentences and neither has been overwritten by the
    // other.
    const granted = history.find((e) => e.kind === ACCEPTANCE_GRANTED)
    expect(granted?.detail.wording).toBe(shown)

    // AND THE DATABASE REFUSES TO REWRITE ONE. The append-only trigger is the
    // witness: an invariant the code maintains is an invariant that eventually is
    // not maintained, and an edited consent record reads perfectly and is untrue.
    await expect(
      env.DB.prepare("UPDATE contact_events SET detail = '{}' WHERE id = ?")
        .bind(history[0].id)
        .run(),
    ).rejects.toThrow()
  })

  it('test_UAT_FC_REQ-240_a_transition_with_no_wording_is_refused', async () => {
    const contact = await aContact()
    // A transition nobody can evidence is not worth recording, and a default
    // would be this module inventing what somebody read.
    await expect(
      recordAcceptance(dbOnly(), {
        contactId: contact,
        key: NEWSLETTER,
        granted: true,
        wording: '   ',
      }),
    ).rejects.toThrow(AcceptanceRefusedError)
    expect(await acceptancesOf(dbOnly(), scope(), contact)).toEqual([])
  })
})

describe('REQ-240 — what it refuses', () => {
  it('test_UAT_FC_REQ-240_an_undeclared_key_and_an_unrevocable_one_are_refused', async () => {
    const contact = await aContact()
    const store = await ticketStoreFor(storeEnv(), scope())
    const document = await documentFor(store, T_AND_C_ACCEPTED)

    await expect(
      recordAcceptance(dbOnly(), {
        contactId: contact,
        key: 'news_letter',
        granted: true,
        wording: 'Send me things',
      }),
    ).rejects.toThrow(UnknownAcceptanceError)

    // A document acceptance is not revocable BY THE CONTACT: un-agreeing to terms
    // already acted under is not a state this system can represent honestly.
    await recordAcceptance(dbOnly(), {
      contactId: contact,
      key: T_AND_C_ACCEPTED,
      granted: true,
      wording: 'I agree to the terms and conditions',
      documentUid: document.uid,
    })
    await expect(
      recordAcceptance(dbOnly(), {
        contactId: contact,
        key: T_AND_C_ACCEPTED,
        granted: false,
        wording: 'I agree to the terms and conditions',
        documentUid: document.uid,
      }),
    ).rejects.toThrow(AcceptanceRefusedError)

    // And a document acceptance that names no document has no answer to "what
    // did they agree to", which is the only question this record exists for.
    await expect(
      recordAcceptance(dbOnly(), {
        contactId: await aContact(),
        key: T_AND_C_ACCEPTED,
        granted: true,
        wording: 'I agree to the terms and conditions',
      }),
    ).rejects.toThrow(AcceptanceRefusedError)
  })

  it('test_UAT_FC_REQ-240_a_contact_in_another_business_is_not_written_to', async () => {
    // The write derives the business from the contact's own row, and a caller
    // that names one gets a refusal as well — told the same thing it would be
    // told about an id that never existed.
    const theirs = await aContact(B)
    await expect(
      recordAcceptance(dbOnly(), {
        contactId: theirs,
        key: NEWSLETTER,
        granted: true,
        wording: 'Send me occasional news and offers',
        businessId: A,
      }),
    ).rejects.toThrow()
    expect(await acceptancesOf(dbOnly(), scope(B), theirs)).toEqual([])
  })
})
