/**
 * The invite — the act, end to end ([[REQ-199]], design ref [[CHAT-39]]).
 *
 * FOUR MODULES MEET HERE AND NOWHERE ELSE. `templates.ts` owns the copy,
 * `mail.ts` owns the port, `messages.ts` owns the record, and `people.ts` owns
 * the pipeline transition. Each of those was written by its own ticket and each
 * of them deliberately stops short of the others; this file is the ticket that
 * composes them, and it exists as a file so that the composition has one home
 * rather than being smeared across the route table.
 *
 * IT ACTS ON A SELECTION, NOT ON AN ADDRESS. The tab checks rows and presses
 * Invite, so what arrives here is a list of contact ids that already exist. That
 * is the whole shape change [[REQ-199]] makes: adding somebody is
 * {@link addContact}, and inviting is this — two acts, two functions, and
 * neither takes a flag selecting the other's behaviour. A single function with
 * an `alsoInvite` boolean would make the difference between recording somebody
 * and emailing a stranger a parameter, and that parameter eventually defaults
 * wrong in the direction that mails people.
 *
 * ONE MESSAGE PER CONTACT, EACH WITH EXACTLY ONE RECIPIENT. This is the
 * ticket's stated falsifier — *more than one recipient on a single outgoing
 * message* — and the reason is not technical: contacts must not be given each
 * other's addresses, and one message with several recipients discloses the whole
 * list to every one of them. So {@link invitePeople} is a loop over
 * {@link invitePerson} rather than one send with a list, and there is no code
 * path here that can build a multi-recipient message.
 *
 * ONE REFUSAL DOES NOT STOP THE REST. A contact with no primary address is
 * refused BY NAME and the other selected contacts still send. Anything else
 * makes a ten-person invite an all-or-nothing act, and the operator's remedy —
 * find the one bad row — is exactly what the per-contact result tells them.
 *
 * THE PIPELINE MOVES WHEN THE ATTEMPT WAS MADE, not when the provider said yes.
 * A message the provider refused is still an invite that was sent as far as this
 * business is concerned: it happened, [[REQ-198]]'s record carries `failed` and
 * the reason, and the contact's history carries the press. Moving the stage only
 * on success would make a failed send invisible on the row and leave the
 * operator with a Lead they know they invited. A contact refused for having no
 * address is NOT moved, because nothing was attempted for them at all.
 *
 * THE SENDER IS PASSED IN, NEVER IMPORTED, on `messages.ts`'s precedent — which
 * is how [[REQ-196]]'s falsifier (*a code path where running the tests can send
 * mail*) stays closed from this side of the seam.
 */

import { markInvited, personOf, type Person } from './people'
import type { InviteUrlFor } from './sessions'
import type { IdentityEnv } from './identity'
import { emailsOf } from './identity'
import type { SendEmail } from './mail'
import { sendRecordedEmail, type MessageRecord } from './messages'
import type { Scope } from './scope'
import {
  copyOf,
  renderCopy,
  templateFor,
  type MessageCopy,
  type TemplateKey,
} from './templates'
import type { TicketStore } from './tickets'

/** The template every invite renders from. Spelled once. */
export const INVITE_TEMPLATE: TemplateKey = 'invite'

/**
 * What the modal opens with ([[REQ-199]]).
 *
 * `from` IS HERE AND IS DISPLAY ONLY. An arbitrary sender address fails DKIM and
 * lands the message in spam, so offering an editable field would offer a way to
 * break delivery silently. It travels because the operator is owed the answer to
 * *who will this appear to be from* — showing it and refusing to take an edit
 * are different things, and only the second is a restriction.
 *
 * THE SUBJECT AND BODY ARE THE TEMPLATE'S, AND THE OPERATOR MAY CHANGE THEM FOR
 * THIS SEND. What comes back on the POST is what gets rendered; the template
 * ticket is never written to. Editing a template is a different act with a
 * different surface ([[REQ-197]]), and a modal that quietly rewrote it would let
 * a one-off change to one invite alter what every later invite says.
 */
export interface InviteDraft {
  from: string
  subject: string
  body: string
  /**
   * The tokens the template promises its body carries ([[REQ-197]]).
   *
   * IT TRAVELS SO THE EDIT CAN BE HELD TO IT. The modal sends back a subject and
   * a body the operator may have rewritten, and the declaration is what refuses
   * one that no longer carries `{{cta_url}}` — the deletion that produces a mail
   * with a dead button and looks entirely normal to whoever receives it.
   */
  declared: string[]
  templateKey: string
  templateUid: string
}

/**
 * The `invite` template's copy, as the modal prefills from it.
 *
 * IT SEEDS THE TEMPLATE IF THE BUSINESS HAS NEVER HAD ONE, because
 * {@link templateFor} does — that is seed-if-absent, and it is what stops the
 * first invite in a fresh deployment failing for want of content nobody knew
 * they had to write.
 */
export async function inviteDraft(store: TicketStore, from: string): Promise<InviteDraft> {
  const template = await templateFor(store, INVITE_TEMPLATE)
  const copy = copyOf(template)
  return {
    from,
    subject: copy.subject,
    body: copy.body,
    declared: [...(copy.declared ?? [])],
    templateKey: copy.templateKey,
    templateUid: copy.templateUid,
  }
}

/** What one contact's invite did. */
export interface InviteResult {
  contactId: string
  /**
   * The name the refusal uses — the display name if they have one, else their
   * primary address, else the id.
   *
   * A REFUSAL HAS TO NAME SOMEBODY THE OPERATOR RECOGNISES. "One contact has no
   * address" against a checked list of ten is a refusal that cannot be acted on;
   * the whole value of refusing rather than guessing is that the operator is
   * told which row to go and fix.
   */
  who: string
  /** The address it went to, or null when there was none to go to. */
  to: string | null
  /**
   * `sent` and `failed` both mean an attempt was made and a record exists.
   * `refused` means nothing was attempted and nothing was recorded.
   */
  status: 'sent' | 'failed' | 'refused'
  /** Why, for anything that is not `sent`. */
  reason: string | null
  /** [[REQ-198]]'s record, for the two outcomes that produced one. */
  message: MessageRecord | null
  /** The row as it now stands, for the two outcomes that moved it. */
  person: Person | null
}

/** Everything one invite needs, gathered so the loop below can be a loop. */
export interface InviteDeps {
  env: IdentityEnv
  scope: Scope
  store: TicketStore
  send: SendEmail
  /** The sending address — {@link mailFrom}'s answer, resolved by the caller. */
  from: string
  /**
   * Where the invite's button points ([[REQ-197]]'s `{{cta_url}}`) — A LINK PER
   * CONTACT, MINTED FOR THEM ([[REQ-202]]).
   *
   * IT USED TO BE THE BARE ORIGIN, and that was not a design choice. There was no
   * token to build a link from, so every invite pointed at this deployment's
   * front door — where the invitee met Cloudflare Access, which challenged them
   * with its OWN one-time-PIN email. Two messages per invite, the first of them
   * Cloudflare-branded; and locally, where there is no Access to challenge
   * anybody, the same link was a flat refusal. Either way the invite did not
   * deliver the person it was sent to.
   *
   * A FUNCTION AND NOT A STRING, because a link that carries the person it was
   * sent to cannot be one value shared by ten contacts. It mints an invite token
   * ([[REQ-134]], thirty days — an invite may sit unread over a holiday) and
   * returns the URL that redeems it.
   *
   * NULL IS A REFUSAL AND NOT AN EMPTY LINK. It means the address resolves to
   * nobody who may sign in — a withdrawn contact — and sending them a dead button
   * would be worse than telling the operator by name.
   */
  inviteUrl: InviteUrlFor
  /**
   * The copy for THIS send, when the operator edited it. Absent means the
   * template's own, unchanged.
   */
  copy?: MessageCopy
}

/** How a refusal refers to somebody who cannot be sent to. */
function nameOf(person: Person): string {
  return person.name?.displayName?.trim() || person.email || person.id
}

/**
 * Invite one contact: render, send, record, and move the pipeline.
 *
 * THE ADDRESS IS THE **PRIMARY** ONE, AND NOTHING ELSE ([[REQ-191]]). A contact
 * holds several; exactly one may be primary, enforced by a partial unique index,
 * so "the default address" is a fact the schema guarantees rather than a rule
 * this file maintains.
 *
 * A CONTACT WITH NO PRIMARY ADDRESS REFUSES AND IS NOT SENT TO. It must not fall
 * back to "the first one" or "the oldest": picking silently is how a message
 * goes to somebody's decommissioned work address and nobody finds out. Reaching
 * for any address at all here would also make the primary flag decorative, which
 * is the state [[REQ-191]] wrote an index to prevent.
 *
 * IT NEVER THROWS FOR A SEND THAT FAILED, on {@link sendRecordedEmail}'s own
 * rule: the failure is the thing being recorded, and turning it into an
 * exception would hand the caller the one outcome the record exists to preserve.
 * A REFUSED TEMPLATE DOES throw, and the difference is that nothing was
 * attempted and nothing exists to look at — the copy is wrong for everybody in
 * the selection, not for this contact, so the whole send should stop rather than
 * report the same refusal N times.
 */
export async function invitePerson(deps: InviteDeps, contactId: string): Promise<InviteResult> {
  // READ BEFORE ANYTHING IS SENT, and scoped by tenant as well as id — which is
  // what stops a caller in one business mailing a row in another by guessing.
  // The refusal has to arrive before the provider is called rather than after.
  const person = await personOf(deps.env, deps.scope, contactId)
  if (!person) throw new UnknownInviteeError(contactId)
  const primary = (await emailsOf(deps.env, contactId)).find((row) => row.is_primary === 1)
  if (!primary) {
    return {
      contactId,
      who: nameOf(person),
      to: null,
      status: 'refused',
      reason: 'They have no primary address, so there is nowhere to send this.',
      message: null,
      person: null,
    }
  }

  // MINTED BEFORE ANYTHING IS SENT, and a refusal arrives before the provider is
  // called rather than after — the same ordering the missing-address refusal
  // above keeps, and for the same reason.
  const ctaUrl = await deps.inviteUrl(primary.email)
  if (!ctaUrl) {
    return {
      contactId,
      who: nameOf(person),
      to: primary.email,
      status: 'refused',
      reason:
        'They cannot sign in at the moment, so an invitation would arrive with a ' +
        'link that does not work.',
      message: null,
      person: null,
    }
  }

  const rendered = renderCopy(deps.copy ?? (await defaultCopy(deps)), { cta_url: ctaUrl })
  const message = await sendRecordedEmail(
    deps.store,
    {
      contactId,
      addressId: primary.id,
      templateKey: rendered.templateKey,
      templateUid: rendered.templateUid,
      subject: rendered.subject,
      from: deps.from,
      // ONE RECIPIENT, AND THE TYPE IS WHAT SAYS SO. `OutgoingMessage.to` is a
      // string rather than a list, so a multi-recipient message is not a thing
      // this code path can express even by mistake — which is the ticket's
      // falsifier closed by the shape rather than by a rule.
      to: primary.email,
      body: rendered.body,
    },
    deps.send,
  )

  // THE TRANSITION LANDS AFTER THE ATTEMPT AND REGARDLESS OF ITS OUTCOME. See
  // the header: a refused provider is still an invite this business sent, and
  // [[REQ-198]]'s record carries the failure where it can be read.
  const moved = await markInvited(deps.env, deps.scope, contactId)
  return {
    contactId,
    who: nameOf(moved),
    to: primary.email,
    status: message.status === 'failed' ? 'failed' : 'sent',
    reason: message.failure,
    message,
    person: moved,
  }
}

/**
 * Invite a selection, one message each.
 *
 * SEQUENTIAL AND NOT CONCURRENT, deliberately. A beta selection is a handful of
 * rows, and a provider that rate-limits answers a burst with a refusal recorded
 * against a contact whose address was perfectly fine — a failure that reads as
 * "their mailbox rejected us" and is nothing of the kind.
 *
 * THE COPY IS RESOLVED ONCE, before the loop. The operator's edit is one piece
 * of copy for the whole send, and reading the template per contact would be N
 * queries for one answer — and would let a template replaced mid-send give two
 * contacts in one press two different messages.
 */
export async function invitePeople(
  deps: InviteDeps,
  contactIds: readonly string[],
): Promise<InviteResult[]> {
  const copy = deps.copy ?? (await defaultCopy(deps))
  const out: InviteResult[] = []
  for (const contactId of contactIds) {
    out.push(await invitePerson({ ...deps, copy }, contactId))
  }
  return out
}

/** The template's own copy, for a send the operator did not edit. */
async function defaultCopy(deps: InviteDeps): Promise<MessageCopy> {
  return copyOf(await templateFor(deps.store, INVITE_TEMPLATE))
}

/** Refused because the id names nobody in this business. */
export class UnknownInviteeError extends Error {
  constructor(readonly contactId: string) {
    super('No such contact in this business.')
  }
}
