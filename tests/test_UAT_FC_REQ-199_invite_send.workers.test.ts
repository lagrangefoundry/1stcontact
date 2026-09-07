import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { addContact, markInvited, peopleOf, personOf } from '../apps/control-app/src/people'
import { inviteDraft, invitePeople, UnknownInviteeError } from '../apps/control-app/src/invites'
import { messagesFor } from '../apps/control-app/src/messages'
import { templateFor } from '../apps/control-app/src/templates'
import { eventsOf } from '../apps/control-app/src/events'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import { userEmailInsert, type IdentityEnv } from '../apps/control-app/src/identity'
import type { Message, SendEmail } from '../apps/control-app/src/mail'
import type { Scope } from '../apps/control-app/src/scope'
import { applySchema } from './support/d1-site-factory'

/**
 * REQ-199 — **the invite composes: render, send one message each, record, move.**
 *
 * WHAT THIS FILE PROVES. That pressing Invite over a checked selection produces
 * N messages with exactly one recipient each, addressed to each contact's
 * PRIMARY address; that a contact with no primary address is refused BY NAME and
 * the rest still send; that the copy an operator edited in the modal is what
 * goes out and the template ticket is untouched by it; and that the pipeline
 * moves Lead → Invited and never touches the access axis.
 *
 * WHY IT DRIVES THE SHIPPED FUNCTIONS AGAINST REAL D1 AND A REAL TICKET STORE.
 * Every claim here is a claim about a composition — four modules, each already
 * proved in isolation by its own ticket — so the only thing worth asserting is
 * that they meet correctly. A suite that re-implemented the sequence would prove
 * the sequence it wrote.
 *
 * THE SENDER IS A DOUBLE AND THAT IS THE DESIGN, not a concession ([[REQ-196]]).
 * `invitePeople` takes the port as an argument and imports no adapter, so there
 * is no code path here that could reach a provider — and the double is what lets
 * "one recipient per message" be asserted as a fact about what was HANDED to the
 * port rather than as a reading of the source.
 *
 * THE FALSIFIER THIS FILE EXISTS FOR is the ticket's own: *more than one
 * recipient on a single outgoing message*. Contacts must not be given each
 * other's addresses, and one message with several recipients discloses the whole
 * list to every one of them.
 */

const BUSINESS = 'req199-business'
const OTHER = 'req199-other'

const identityEnv = (): IdentityEnv => ({
  DB: env.DB as D1Database,
  SITES: env.SITES as R2Bucket,
  TENANT_ID: BUSINESS,
})

const scope = (businessId = BUSINESS): Scope => ({ businessId })

const storeFor = (businessId = BUSINESS): Promise<TicketStore> =>
  ticketStoreFor({ DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket }, scope(businessId))

let seq = 0
const anEmail = (): string => `req199-${(seq += 1)}@example.test`

const FROM = 'no-reply@example.test'
/**
 * The link an invite carries.
 *
 * A FUNCTION IN THE DEPS SINCE [[REQ-202]], and a constant here. That ticket made
 * `{{cta_url}}` a REDEEMABLE token minted per contact rather than one origin
 * shared by the whole send; what this file is about is unchanged — one message
 * per contact, one recipient each, the operator's edit, the pipeline move — so it
 * pins the link to a known value and lets [[REQ-202]]'s own suite prove that the
 * value a real issuer returns is a link that redeems.
 */
const CTA = 'https://app.example/sign-in/req199-token'

/** A sender that records and accepts, so what was handed to the port is readable. */
function recording(): { send: SendEmail; sent: Message[] } {
  const sent: Message[] = []
  return {
    sent,
    send: async (message) => {
      sent.push(message)
      return { providerId: `prov_${sent.length}` }
    },
  }
}

/** A sender that refuses, so the failure path is the one under test. */
const refusing = (why: string): SendEmail => async () => {
  throw new Error(why)
}

async function deps(overrides: Record<string, unknown> = {}) {
  return {
    env: identityEnv(),
    scope: scope(),
    store: await storeFor(),
    send: recording().send,
    from: FROM,
    inviteUrl: async () => CTA,
    ...overrides,
  }
}

/** A Lead: added, never invited — the state the tab's `+` control produces. */
async function aLead(email = anEmail(), businessId = BUSINESS) {
  const made = await addContact(identityEnv(), scope(businessId), { email })
  return made.person
}

beforeAll(async () => {
  await applySchema()
})

describe('REQ-199 — add is the fundamental act', () => {
  it('test_UAT_FC_REQ-199_adding_a_contact_leaves_them_a_lead_and_sends_nothing', async () => {
    // THE CLAIM THE TICKET OPENS WITH. The tab could invite and could not add,
    // so creating a contact necessarily also asked them to sign up — and most
    // contacts are never invited at all. `addContact` records somebody and does
    // nothing else.
    const email = anEmail()
    const made = await addContact(identityEnv(), scope(), { email, displayName: 'A Lead' })

    expect(made.created).toBe(true)
    expect(made.person.pipelineStage, 'a new contact is a Lead').toBe('lead')
    // NO MAIL AND NO STAMP. `invited_at` is what says we asked, and nobody has.
    expect(made.person.invitedAt, 'adding a contact asked them something').toBeNull()
    // AND NOT A MEMBER EITHER: that is the person's own act, on the other axis.
    expect(made.person.termsAcceptedAt).toBeNull()
    expect(made.person.email).toBe(email)
    expect(made.person.name?.displayName).toBe('A Lead')

    // NOTHING WAS RECORDED AS SENT, which is the half a stage assertion cannot
    // make: an add that quietly mailed somebody would still leave them a Lead.
    expect(await messagesFor(await storeFor(), made.person.id)).toEqual([])
  })

  it('test_UAT_FC_REQ-199_adding_an_address_already_here_finds_them_rather_than_duplicating', async () => {
    // [[DOC-42]] §9's shape, from the add side: a second row for one address is
    // how the CRM and the tab come to disagree about a person who is both.
    const email = anEmail()
    const first = await addContact(identityEnv(), scope(), { email })
    const again = await addContact(identityEnv(), scope(), { email: `  ${email.toUpperCase()} ` })

    expect(again.created, 'the second add reported a creation').toBe(false)
    expect(again.person.id).toBe(first.person.id)
    const { results } = await env.DB.prepare(
      'SELECT u.id AS id FROM users u JOIN user_emails e ON e.user_id = u.id ' +
        'WHERE u.tenant_id = ? AND e.email = ?',
    )
      .bind(BUSINESS, email)
      .all<{ id: string }>()
    expect(results ?? [], 'the add inserted a second row for one address').toHaveLength(1)
  })
})

describe('REQ-199 — one message per contact, one recipient each', () => {
  it('test_UAT_FC_REQ-199_inviting_n_contacts_produces_n_messages_with_one_recipient_each', async () => {
    // THE TICKET'S OWN FALSIFIER: *more than one recipient on a single outgoing
    // message*. The reason is not technical — contacts must not be given each
    // other's addresses, and one message with several recipients discloses the
    // whole list to every one of them.
    const port = recording()
    const people = [await aLead(), await aLead(), await aLead()]

    const results = await invitePeople(
      await deps({ send: port.send }),
      people.map((person) => person.id),
    )

    expect(results).toHaveLength(3)
    expect(results.every((r) => r.status === 'sent')).toBe(true)
    expect(port.sent, 'one message per contact').toHaveLength(3)
    // ONE RECIPIENT EACH, asserted as a fact about what reached the port. Every
    // `to` is a single address and the three are the three people's own.
    expect(port.sent.map((m) => m.to)).toEqual(people.map((p) => p.email))
    for (const message of port.sent) {
      expect(message.to.includes(','), 'a message carried more than one recipient').toBe(false)
      expect(message.to.includes(';')).toBe(false)
      expect(message.from).toBe(FROM)
    }
  })

  it('test_UAT_FC_REQ-199_each_message_goes_to_that_contacts_primary_address', async () => {
    // [[REQ-191]] enforces exactly one primary by partial unique index, so "the
    // default address" is a fact the schema guarantees. A contact holding two is
    // written to at the primary one and never at the other.
    const port = recording()
    const person = await aLead()
    const second = `second-${anEmail()}`
    await env.DB.batch([
      userEmailInsert(identityEnv(), {
        userId: person.id,
        tenantId: BUSINESS,
        email: second,
        primary: false,
      }),
    ])

    const [result] = await invitePeople(await deps({ send: port.send }), [person.id])

    expect(result.to).toBe(person.email)
    expect(port.sent.map((m) => m.to)).toEqual([person.email])
    expect(port.sent.some((m) => m.to === second), 'it wrote to a non-primary address').toBe(false)
  })

  it('test_UAT_FC_REQ-199_a_contact_with_no_primary_address_is_refused_by_name_and_the_rest_still_send', async () => {
    // IT MUST NOT FALL BACK TO "THE FIRST ONE" OR "THE OLDEST": picking silently
    // is how a message goes to somebody's decommissioned work address and nobody
    // finds out. And one refusal may not stop the rest — otherwise a ten-person
    // invite is all-or-nothing and the operator's remedy is invisible.
    const port = recording()
    const fine = await aLead()
    const mute = await aLead()
    // The address goes; the contact stays. This is the phone-only contact
    // [[DOC-42]] §4.1 names, reached by the one route the schema allows.
    await env.DB.prepare('DELETE FROM user_emails WHERE user_id = ?').bind(mute.id).run()

    const results = await invitePeople(await deps({ send: port.send }), [mute.id, fine.id])

    const refused = results.find((r) => r.contactId === mute.id)
    expect(refused?.status).toBe('refused')
    expect(refused?.to, 'a refusal named an address it does not have').toBeNull()
    // BY NAME. "One contact has no address" against a list of ten cannot be
    // acted on; the whole value of refusing is that the operator is told which
    // row to go and fix.
    expect(refused?.who).toBe(mute.id)
    expect(refused?.reason).toMatch(/no primary address/i)

    // THE OTHERS STILL SEND.
    expect(results.find((r) => r.contactId === fine.id)?.status).toBe('sent')
    expect(port.sent.map((m) => m.to)).toEqual([fine.email])

    // AND THE REFUSED CONTACT IS NOT MOVED, because nothing was attempted for
    // them: a Lead we could not write to has not been invited.
    const after = await personOf(identityEnv(), scope(), mute.id)
    expect(after?.pipelineStage).toBe('lead')
    expect(after?.invitedAt).toBeNull()
    expect(await messagesFor(await storeFor(), mute.id), 'a refusal left a record').toEqual([])
  })
})

describe('REQ-199 — what the operator sees afterwards', () => {
  it('test_UAT_FC_REQ-199_inviting_moves_a_lead_to_invited_and_never_to_member', async () => {
    // THE TWO AXES ARE INDEPENDENT ([[DOC-44]] §3). The invite moves the
    // pipeline; membership is the person's own act and nothing here can
    // complete it.
    const person = await aLead()
    expect(person.pipelineStage).toBe('lead')

    await invitePeople(await deps(), [person.id])

    const after = await personOf(identityEnv(), scope(), person.id)
    expect(after?.pipelineStage).toBe('invited')
    expect(after?.invitedAt, 'the invite recorded no time for the act it performed').toBeTruthy()
    expect(after?.termsAcceptedAt, 'the invite made a member out of nobody').toBeNull()
  })

  it('test_UAT_FC_REQ-199_a_send_the_provider_refused_is_recorded_and_still_counts_as_asking', async () => {
    // THE FAILURE IS THE THING BEING RECORDED. An operator shown a success while
    // the provider refused the message is the silence [[REQ-196]] exists to
    // remove; the record carries `failed` and the reason, and the press is still
    // a press this business made.
    const person = await aLead()

    const [result] = await invitePeople(
      await deps({ send: refusing('domain is not verified') }),
      [person.id],
    )

    expect(result.status).toBe('failed')
    expect(result.reason).toContain('domain is not verified')
    const [record] = await messagesFor(await storeFor(), person.id)
    expect(record.status).toBe('failed')
    expect(record.failure).toContain('domain is not verified')
    // THE PIPELINE STILL MOVES. We asked; the delivery failed, and the failure
    // is on the record where it can be read. Leaving them a Lead would make a
    // failed send invisible on the row.
    expect((await personOf(identityEnv(), scope(), person.id))?.pipelineStage).toBe('invited')
  })

  it('test_UAT_FC_REQ-199_each_send_leaves_a_record_the_detail_pane_can_read', async () => {
    // [[REQ-198]]'s record, written by this path for the first time: subject,
    // the address it went to, and which template said it.
    const person = await aLead()

    await invitePeople(await deps(), [person.id])
    const [record] = await messagesFor(await storeFor(), person.id)

    expect(record.contactId).toBe(person.id)
    expect(record.to).toBe(person.email)
    expect(record.from).toBe(FROM)
    expect(record.templateKey).toBe('invite')
    expect(record.status).toBe('sent')
    // THE BODY IS THE RENDERED MESSAGE. The template changes; what we sent does
    // not — and the link the recipient was actually given is in it.
    expect(record.body).toContain(CTA)
    expect(record.body).not.toContain('{{cta_url}}')
  })

  it('test_UAT_FC_REQ-199_a_second_press_is_a_second_message_and_a_second_event', async () => {
    // NO RE-SEND CONTROL: re-inviting is selecting and pressing Invite again,
    // which [[REQ-198]] records as a second message. And `invited_at` is not
    // restamped, so without the event a second press would be invisible.
    const person = await aLead()

    await invitePeople(await deps(), [person.id])
    const first = await personOf(identityEnv(), scope(), person.id)
    await invitePeople(await deps(), [person.id])
    const again = await personOf(identityEnv(), scope(), person.id)

    expect(await messagesFor(await storeFor(), person.id)).toHaveLength(2)
    expect(again?.invitedAt).toBe(first?.invitedAt)
    const kinds = (await eventsOf(identityEnv(), scope(), person.id)).map((e) => e.kind)
    expect(kinds).toEqual(['contact.invited', 'contact.invited', 'contact.created'])
  })

  it('test_UAT_FC_REQ-199_the_record_lands_with_its_journal_row_so_a_worker_can_write_a_ticket', async () => {
    // THE INVITE IS THE FIRST PRODUCT PATH THAT WRITES A TICKET FROM INSIDE THE
    // WORKER, and that is a claim about the deployed migration rather than about
    // this file's own logic. `@lagrangefoundry/ticketing` writes one
    // `ticket_changes` row in the SAME batch as the ticket, so a database whose
    // transcription of `SCHEMA_STATEMENTS` has fallen behind the component
    // refuses `create` outright — `no such table: ticket_changes` — and every
    // invite fails for a reason that has nothing to do with mail.
    //
    // ASSERTED ON THE JOURNAL AND NOT ONLY ON THE RECORD, because the two fail
    // together and only one of them says why. A case that read the message back
    // would go red with the same "no such table" and leave whoever reads it
    // looking at the invite; naming the journal points at the migration instead.
    const person = await aLead()

    await invitePeople(await deps(), [person.id])
    const [record] = await messagesFor(await storeFor(), person.id)

    const journal = await (env.DB as D1Database)
      .prepare('SELECT uid, type, version FROM ticket_changes WHERE uid = ? ORDER BY seq ASC')
      .bind(record.uid)
      .all<{ uid: string; type: string; version: number }>()

    expect(journal.results.length).toBeGreaterThan(0)
    expect(journal.results[0].uid).toBe(record.uid)
  })
})

describe('REQ-199 — the copy is the template’s, and the edit is for this send', () => {
  it('test_UAT_FC_REQ-199_the_modal_opens_with_the_sender_and_the_invite_templates_copy', async () => {
    const store = await storeFor()
    const draft = await inviteDraft(store, FROM)
    const template = await templateFor(store, 'invite')

    expect(draft.from).toBe(FROM)
    expect(draft.subject).toBe(template.fields.subject)
    expect(draft.body).toBe(template.body)
    expect(draft.templateUid).toBe(template.uid)
    // THE DECLARATION TRAVELS, which is what lets an edit be held to it.
    expect(draft.declared).toContain('cta_url')
  })

  it('test_UAT_FC_REQ-199_an_edited_subject_and_body_are_what_is_sent_and_the_template_is_untouched', async () => {
    // EDITING A TEMPLATE IS A DIFFERENT ACT WITH A DIFFERENT SURFACE
    // ([[REQ-197]]). A modal that quietly rewrote the template would let a
    // one-off change to one invite alter what every later invite says.
    const port = recording()
    const store = await storeFor()
    const before = await templateFor(store, 'invite')
    const person = await aLead()

    await invitePeople(
      await deps({
        send: port.send,
        store,
        copy: {
          subject: 'Come and see what we built',
          body: '<p>Hello — <a href="{{cta_url}}">have a look</a>.</p>',
          declared: ['cta_url'],
          templateKey: 'invite',
          templateUid: before.uid,
        },
      }),
      [person.id],
    )

    expect(port.sent[0].subject).toBe('Come and see what we built')
    expect(port.sent[0].body).toContain('have a look')
    expect(port.sent[0].body).toContain(CTA)

    const after = await templateFor(store, 'invite')
    expect(after.uid, 'the send replaced the template').toBe(before.uid)
    expect(after.fields.subject, 'the send rewrote the template subject').toBe(
      before.fields.subject,
    )
    expect(after.body, 'the send rewrote the template body').toBe(before.body)
  })

  it('test_UAT_FC_REQ-199_copy_that_lost_its_link_refuses_and_nothing_is_sent', async () => {
    // AN OPERATOR WHO DELETES `{{cta_url}}` HAS DELETED THE ONLY ROUTE IN, and
    // the message would go out looking perfectly ordinary with a dead button.
    // The declaration is the template's promise about its copy and it travels
    // with the edit precisely so this refuses.
    const port = recording()
    const person = await aLead()

    await expect(
      invitePeople(
        await deps({
          send: port.send,
          copy: {
            subject: 'Hello',
            body: '<p>No link at all.</p>',
            declared: ['cta_url'],
            templateKey: 'invite',
            templateUid: 'tpl_whatever',
          },
        }),
        [person.id],
      ),
    ).rejects.toThrow(/cta_url/)

    expect(port.sent, 'a refusal still reached the provider').toHaveLength(0)
    expect(await messagesFor(await storeFor(), person.id)).toEqual([])
    expect((await personOf(identityEnv(), scope(), person.id))?.pipelineStage).toBe('lead')
  })
})

describe('REQ-199 — the tenant barrier', () => {
  it('test_UAT_FC_REQ-199_a_contact_id_from_another_business_cannot_be_invited', async () => {
    // NOT FOUND AND NOT IN THIS BUSINESS ARE THE SAME ANSWER, which is what
    // stops this becoming an existence oracle — and here the stake is higher
    // than a read: guessing an id must not mail somebody else's customer.
    const port = recording()
    const theirs = await aLead(anEmail(), OTHER)

    await expect(invitePeople(await deps({ send: port.send }), [theirs.id])).rejects.toBeInstanceOf(
      UnknownInviteeError,
    )
    expect(port.sent).toHaveLength(0)
    const after = await personOf(identityEnv(), scope(OTHER), theirs.id)
    expect(after?.pipelineStage).toBe('lead')
  })

  it('test_UAT_FC_REQ-199_the_same_two_acts_from_two_businesses_differ_only_in_which_rows_move', async () => {
    // A LEVEL IS A POSITION AND NOT A PROPERTY ([[DOC-42]] §3). Add-then-invite
    // in 1st Contact makes Alice and the identical pair in Alice's business
    // makes Bob; nothing in either function branches on which one it is.
    const mine = await aLead()
    const theirs = await aLead(anEmail(), OTHER)
    await markInvited(identityEnv(), scope(), mine.id)
    await markInvited(identityEnv(), scope(OTHER), theirs.id)

    const here = await peopleOf(identityEnv(), scope())
    const there = await peopleOf(identityEnv(), scope(OTHER))
    expect(here.map((p) => p.id)).toContain(mine.id)
    expect(here.map((p) => p.id)).not.toContain(theirs.id)
    expect(there.map((p) => p.id)).toContain(theirs.id)
    expect(there.map((p) => p.id)).not.toContain(mine.id)
    expect(here.find((p) => p.id === mine.id)?.pipelineStage).toBe(
      there.find((p) => p.id === theirs.id)?.pipelineStage,
    )
  })
})
