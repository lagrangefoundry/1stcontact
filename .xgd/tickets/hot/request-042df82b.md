---
uid: request-042df82b
id: REQ-267
type: request
title: 'Inbound mail, end to end: capture against the contact, pending for a stranger,
  and the synthetic mark'
created_by: EPIC-13
created_at: '2026-09-17T22:00:00.005762+00:00'
updated_at: '2026-09-17T22:00:00.005762+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  epic_parent: epic-d76e554a
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-9120f6e1
---

# Inbound mail, end to end

Mail sent to a business's domain arrives, is recorded against the person who sent
it, and appears on their contact page. Mail from a stranger lands in a pending
queue instead of inventing a contact. Nothing about either is trusted because the
sender said so.

This is ticket 1 of [[EPIC-13]]'s four-ticket cut: *"Email Routing, the Email
Worker, parse, message ticket, contact event, visible on the contact — plus
unmatched sender → pending / unidentified, and the synthetic mark from the
reserved namespace."*

It also carries two things [[EPIC-13]] and [[EPIC-11]] share, and which are
cheapest in whichever ticket ships first — this one:

- **migration `0013`**, [[DOC-54]] §2.4's `synthetic` / `run_id` columns, which
  [[REQ-235]] depends on and which must land before anything reads the spine;
- **paging the contact timeline**, because this ticket is what makes a timeline
  longer than the existing cap.

## 1. What is true today, verified 2026-09-17

**Outbound mail is a ticket; inbound has no counterpart.** `messages.ts`
(`sendRecordedEmail`, `MessageRecord`, `toMessageRecord`) mints an `email` ticket
per outgoing message, and `applyDeliveryEvent` moves it through
`queued → sent → delivered → bounced` ([[REQ-198]]). There is no inbound path at
all: no `email` export in either Worker, no MX, no parse.

**The spine is ready for the event and not for the volume.** `contact_events`
takes an unconstrained dotted `kind`, splits `occurred_at` from `recorded_at`, and
refuses `UPDATE` at the database (`contact_events_are_immutable`). But
`eventsOf` caps at `TIMELINE_LIMIT = 100` with no cursor, and its own docstring
says why that was right: *"paging it would be a control nobody has asked for over
data nobody has enough of."* This ticket is what stops that being true.

**Identity resolution exists and must not be reinvented.** `user_emails`, keyed
`(tenant_id, email)` with `idx_user_emails_tenant_email`, is how an address
becomes a person ([[DOC-44]]); `normaliseEmail` (`identity.ts:494`) is the one
normaliser. An address lookup here is that mechanism, not a second one.

**Tenancy for a domain exists.** `sending_domains` (migration `0012`) holds
`(domain, business_id, zone_id)` with a unique index on `domain`. A recipient
domain therefore resolves to exactly one business by table lookup.

**The platform gives us an envelope and a stream, and no parser.** Verified
against `@cloudflare/workers-types`: `ForwardableEmailMessage` carries `from` and
`to` (**the envelope, not the headers**), `headers`, `raw` as a
`ReadableStream<Uint8Array>`, `rawSize`, and the three actions `setReject`,
`forward`, `reply`. MIME parsing is ours. Nothing in the type surfaces an SPF or
DMARC verdict — the evidence arrives as a header on the message, and which header
and its exact spelling is to be read from current Cloudflare documentation before
the parse is written, not assumed here.

## 2. The pipeline

Cloudflare Email Routing delivers to an Email Worker, which is the only thing that
sees the message. It records, then forwards — **in that order**, because a
forward that throws must not cost us the record, while a record that throws must
not silently swallow the customer's mail.

**Forwarding still happens when recording fails.** The business's mail reaching a
human is the promise [[EPIC-13]] is built on (*"never break the business's
mail"*); capture is the product on top of it. A capture failure is logged and
surfaced, and the message is forwarded anyway.

**A message is never rejected for a capture reason.** `setReject` returns a
permanent SMTP error to the sender, which tells a real correspondent their mail
bounced. It is reserved for the cases in §4 and §5 where we genuinely are not the
right recipient.

## 3. The recipient decides the business, and nothing else does

**Tenancy resolves from the envelope recipient** — `message.to`, matched to
`sending_domains.domain` after `normaliseEmail`. Not the `To:` header, which a
sender writes and which says nothing about where SMTP actually delivered; a
message can be `Bcc`'d to us with a `To:` naming somebody else entirely.

**An unresolvable recipient domain is refused, not filed.** If the domain is in no
`sending_domains` row, we are not the mailbox for it and there is no business to
file it under. Rejecting is correct and says so to the sender.

**No message ever reaches a business other than the one its recipient domain
resolves to.** This is the one tenancy boundary on the inbound path and every
write below is scoped by the business it produces.

## 4. `From` proves nothing, and the record says how much it proved

An SMTP sender is unauthenticated ([[EPIC-13]] §Security 1, [[EPIC-17]] FUT-1).
Everything here follows from that:

**Alignment is evaluated at receipt and stored with the message.** The SPF / DKIM
/ DMARC result as the platform reports it is recorded on the message ticket and on
the contact event, as the evidence for an attribution rather than as a check that
gates it.

**An unaligned message is captured and shown as unverified.** It is not discarded
— a small business receives real mail from misconfigured senders every day — and
it is not threaded onto the contact as their words without the reader being told.

**Address matching does not upgrade trust.** Resolving `alice@example.com` to a
contact says who the sender *claims* to be. The contact event records the claim
and its alignment, never a conclusion.

**Inbound mail may never write consent state.** No path from a received message
touches `user_acceptances`, a list membership, an opt-in or an opt-out. Consent
comes from a surface the contact authenticated to, or from an explicit acceptance
event. A spoofed `From` that could manufacture an opt-in would turn the record we
keep as evidence into evidence of something that did not happen.

**Nor does it create or promote a contact.** Matching finds an existing person or
it does not; §5 is what happens when it does not.

## 5. What gets written

**The body is a ticket; the event is the envelope** ([[EPIC-13]] §OQ2).

A **message ticket** of the inbound counterpart to `messages.ts`'s `email` type,
carrying: the envelope `from` and `to`, the header `From`, `To`, `Subject`,
`Date`, `Message-ID`, `In-Reply-To` and `References`; the alignment result; the
body; the size; and attachment metadata. It reuses the existing ticket store
(`tickets.ts`, [[REQ-162]]) — the same store that already holds captures, briefs
and outbound messages.

A **`contact_events` row** of a new kind, `ref` pointing at that ticket. The spine
keeps [[EPIC-11]]'s promise that it is *"milestones, not noise"*: the event
carries the header fields, the body size, whether attachments are present, and the
ticket id. It does not carry the body.

**Threading is by `Message-ID` / `In-Reply-To` / `References`, recorded and not
inferred.** [[EPIC-13]] §Gaps: without it *"the activity log is a heap of
unrelated messages."* Storing the identifiers is this ticket; rendering a thread
from them is not.

**Attachments are stored and are not served.** Bytes arriving by mail are bytes an
anonymous party chose ([[EPIC-17]] F1, [[EPIC-13]] §Security 6). They are written
to R2 under the message's prefix, their metadata goes on the ticket, and **this
ticket ships no download surface for them** — that re-opens F1 from the anonymous
side and belongs with F1's separate-origin work, not here.

**A message above the size bound is recorded as refused, not dropped.** `rawSize`
is available before the body is read. The bound's value is a configuration
constant, and the platform's own message-size limit is to be read from current
documentation rather than assumed. A refusal that leaves no trace is
indistinguishable from mail that never arrived, which is the failure a business
cannot forgive.

## 6. An unknown sender lands in pending, and a discard sticks

Owned here per [[EPIC-13]] §"Inbound from an unknown sender": a
**pending / unidentified** state in the contact list, where triage is
promote-to-contact or discard.

**No contact row, no timeline entry, no metric.** [[DOC-54]] §"What changed" rests
on exactly this: a forwarding test from a sender matching no contact *"lands where
[[EPIC-13]] already sends unmatched inbound mail … creating no contact, no
timeline entry and no metric. There is nothing to suppress and the rule never
engages."* Creating a speculative contact for every stranger would both break that
and fill the list with spam.

**Pending is a state of the message, not a new entity.** The message ticket is
written either way; what an unmatched message lacks is a resolved contact. The
queue is therefore a read over message tickets with no contact, scoped to the
business — not a second representation of a person.

**Promote is the existing path.** Promoting runs `addContact` ([[DOC-44]]) and
then attaches the already-stored message; it does not mint a contact by a second
route.

**Discard is sticky, per business and per sender address.** A decision that does
not persist re-surfaces the same sender every day and trains the client to ignore
the queue. A discarded sender's later mail is still forwarded and still recorded;
it does not re-enter the queue.

**A suppression is reversible and is not erasure.** Undoing it is a control; the
messages it suppressed were never deleted.

## 7. The synthetic mark

**The reserved address namespace carries it.** An inbound message has no request
context to attach an in-flight marker to, so the mark rides the address:
`bfm+run_<hex>@…` ([[DOC-54]] §"the marker carries a run id" — `newId('run')`,
never a second shorter format; 40 characters against a 64-character local-part
limit). This is the one channel where the envelope is the only thing available,
and [[EPIC-13]] §5's reserved namespace and [[DOC-54]] R1's *"any entry point —
form post, inbound email, webhook"* turn out to be the same mechanism.

**A bad marker degrades to real** ([[DOC-54]]). Marking real traffic as test is
the attack; an unparseable or unverifiable marker means the message is ordinary
mail.

**The reserved namespace never appears in any UI**, and never forwards.

### Migration `0013` — [[DOC-54]] §2.4, landed here

`synthetic` (`NOT NULL DEFAULT 0`) and the run id, across the four tables the
capture chain writes — `users`, `contact_events`, `user_acceptances`,
`asset_grants` — plus the field on message tickets. `NOT NULL` is not tidiness: a
nullable flag makes an unstamped row ambiguous under three-valued logic, and
ambiguity in the collector's delete predicate is how a real contact gets taken.

**Derived, never supplied.** `recordEvent` already inserts
`SELECT ?, u.id, u.tenant_id, … FROM users u`, which the baseline schema justifies
as the reason an event cannot be filed under a business its contact does not
belong to. `synthetic` rides that same `SELECT` as `u.synthetic`, which answers
[[DOC-54]] R2's hardest case — an async continuation with no request context, such
as a delivery webhook arriving thirty seconds later — with a pattern the table
already has.

**Every read of the spine filters by default**, through the scoped path rather
than by each call site remembering.

**This migration is separate from, and lands before, anything else in this
ticket**, because [[REQ-235]] depends on it and on nothing else here. This
ticket's own tables (the sender suppression of §6) are a later migration, so that
dependency stays narrow.

## 8. The timeline reads past 100

`eventsOf` caps at `TIMELINE_LIMIT = 100` with no cursor, on a stated assumption —
*"data nobody has enough of"* — that this ticket falsifies: every message in both
directions lands on the spine, and a campaign writes an event per recipient.

**A contact's history is readable beyond the cap**, by a cursor over
`(occurred_at, rowid)` — the same ordering the existing index and the existing tie
break already use, so the pagination is the query's own order rather than a second
one.

**`provenanceOf` stays its own query.** It already is, for this exact reason:
reading provenance off a capped list would make it quietly wrong for precisely the
contacts with the longest histories.

**Folding is not this ticket.** Collapsing runs of low-value kinds into a readable
row is presentation and stays [[EPIC-11]] scope item 5. What is here is the
correctness half: a reader can reach every event, rather than the hundredth being
where a contact's history appears to begin.

## 9. Rendering captured mail is a new untrusted-content surface

Not covered by [[EPIC-13]]'s existing security notes, and this is the first ticket
that displays anonymous input inside the builder.

**A captured body is rendered as text, not as markup.** HTML mail is stored as
received — it is evidence — and the contact page renders it inert: no script, no
remote loads, no active content, and no `innerHTML` path from a received body to
the DOM. Rendering a stranger's HTML on the origin that holds an operator session
is stored XSS with an email address as the delivery mechanism, and it is
[[EPIC-17]] F1's shape arriving through a different door.

**Remote images do not load by default.** A remote image in a mail body is a
read-receipt beacon and an IP disclosure for the operator who opened it.

**A captured body reaches an assistant only inside an untrusted-content
envelope.** [[EPIC-17]] §5 item 10 gates this explicitly: the envelope is
*"mandatory before inbound mail … reach a role's tools."* This ticket grants no
tool access to captured mail, and states the gate so the next ticket cannot pick
it up by accident.

## 10. What this ticket does not do

- **No Settings surface.** The forwarding table, destination verification and
  catch-all are ticket 2.
- **No cutover integration.** Writing Routing into a pending zone is ticket 3.
- **No capture address.** The BCC-to-file-against-addressees path is ticket 4.
- **No send-as setup, no DKIM key custody, no outbound change.**
- **No attachment download surface** (§5).
- **No thread rendering**, no folding (§8), no AI access to bodies (§9).
- **No spam policy.** [[EPIC-13]] §OQ5 is open; until it is answered, spam is
  captured and forwarded like any other mail, which is the behaviour a forwarding
  service has today.

## 11. Security, traced to [[EPIC-17]]

Each clause above that carries a security obligation, and where it comes from:

| Clause | Source |
|---|---|
| §3 tenancy from the envelope recipient; unresolvable domain refused | [[EPIC-17]] §5b *"no metric crosses a business boundary"*, applied to the write side |
| §4 alignment recorded; unverified shown as unverified; no consent write | [[EPIC-17]] FUT-1, §5b [[EPIC-13]] row |
| §5 attachments stored, never served | [[EPIC-17]] F1, §5 item 1 |
| §5 size bound, refusal recorded | availability — an unbounded parse is a Worker that dies on the largest message |
| §6 no speculative contact from an anonymous sender | [[DOC-54]] R5, and the spam surface [[EPIC-13]] §Gaps names |
| §7 bad marker degrades to real | [[DOC-54]], [[EPIC-17]] FUT-8 |
| §9 inert rendering, no remote images | **new** — [[EPIC-17]] F1's shape through a new door; not in [[EPIC-13]]'s notes before this ticket |
| §9 untrusted-content envelope before any tool reads mail | [[EPIC-17]] §5 item 10, AI-I6 |

Out of scope and named so they are not assumed: DKIM private-key custody and
send-as credentials ([[EPIC-17]] FUT-2) belong to tickets 2 and 4; the
Content-Security-Policy that would harden §9 further is [[EPIC-17]] §5 item 3 and
ships independently of this.

## 12. Acceptance criteria

1. Mail addressed to a domain in `sending_domains` from an address in
   `user_emails` for that business produces a message ticket and exactly one
   `contact_events` row, and the message appears on that contact's page.
2. Tenancy resolves from the envelope recipient: a message whose `To:` header
   names a different business's address is filed under the business its envelope
   recipient resolves to. A message whose recipient domain is in no
   `sending_domains` row is rejected and nothing is written.
3. A message that fails DMARC alignment is captured, its alignment result is
   stored on both the ticket and the event, and the contact page shows it as
   unverified.
4. No inbound message writes `user_acceptances`, a list membership or any consent
   field. Asserted by there being no code path from a received message to one.
5. Recording and forwarding are independent: a message whose capture throws is
   still forwarded, and a message that cannot be forwarded is still recorded. Both
   asserted.
6. A message from an address matching no contact in that business creates **no**
   `users` row and **no** `contact_events` row, and appears in the pending queue.
7. Discarding a pending sender is sticky: a second message from that address is
   recorded and forwarded but does not re-enter the queue. Promoting one runs
   `addContact` and attaches the already-stored message.
8. A message over the size bound is recorded as refused, with its envelope and
   size, and no body is read.
9. `synthetic` is `NOT NULL DEFAULT 0` on all four tables; an event written for a
   synthetic contact is synthetic without the caller supplying it, derived through
   `recordEvent`'s existing `SELECT … FROM users`; and a scoped read excludes
   synthetic rows by default.
10. A message to a reserved `bfm+run_<hex>@` address is marked synthetic with that
    run id, is never forwarded, and does not appear in any customer-visible read.
    A malformed marker is treated as real mail.
11. A contact with more than `TIMELINE_LIMIT` events can be read to the end
    through the cursor, `provenanceOf` returns the genuinely earliest event for
    that contact, and the ordering across page boundaries matches the single-query
    ordering.
12. A captured HTML body reaches the contact page inert: a body containing a
    script, an event-handler attribute and a remote image neither executes nor
    issues a remote request when the page renders it.