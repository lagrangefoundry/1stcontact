---
uid: epic-2d9e2d56
id: EPIC-14
type: epic
title: User Notifiations
created_by: martin-github@westhead.me
created_at: '2026-09-17T00:22:56.755347+00:00'
updated_at: '2026-09-17T00:44:21.170877+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: medium
  chat_comment: comment-e2f4d75b
---

> "We need a platform capability to notify users of things. Notification will be
> primarily email but we will add push (when we do the app) and maybe SMS so the
> delivery must be separated from the notification control.
>
> As with all our features there are three levels 0 - me and my team, 1 - 1c
> customers, 2 - their customers.
>
> All levels will have coarse grained controls in their User portal, basically an
> opt-in/out to notifications — at this point I am not sure what notifications
> will be for level 2, let's assume that we will have them and work through the
> details later. There are probably two levels of notification: informational ("a
> new user just requested the whitepapers") and transactional ("your payment
> failed"). I don't think we offer an opt-out for the second.
>
> Notifications would have finer grained controls on the Settings tab. As we add
> platform notification capabilities we will add the controls and configure them
> to be informational or transactional.
>
> This epic then is for the framework that supports notifications and their
> controls."

Designed in this ticket's chat transcript.

## The principle

**A notification is a declaration about an event, a class and an audience. It
names no channel, no address and no provider — and everything that decides
whether a person is actually reached happens once, in one place, and leaves a
record.**

Both halves are load-bearing.

The first is what the client asked for in the words *"the delivery must be
separated from the notification control"*. A producer — a form submission, a
failed payment, a DNS verdict — says *this happened, it matters to these people,
it is this class*. It does not know whether that becomes an email, a push or
nothing at all, and it must never learn, or the day push lands is the day every
producer is rewritten.

The second is the part that is easy to leave out and is the reason a framework is
worth having. There are already three independent reasons a person might not be
reached — they said no, their address is burned, or the producer was told to stay
quiet — and today each of those lives in a different file, or nowhere. Scattered
across a dozen producers they become a class of bug with no symptom: *"I never
got an email"* is unanswerable, and the worst case is not a missing lead alert
but a customer who can no longer receive a sign-in link and nothing anywhere
says so.

## What exists today, verified

The delivery half is in better shape than the control half, which does not exist.

**There is exactly one way an email leaves this building.**
`messages.ts:220`'s `sendRecordedEmail` is it, and every send site reaches it —
`invites.ts:269`, `sessions.ts:449` (`signInMailer`, which is what `sign-in.ts`
hands to the passwordless component), and `lead.ts:1113`. That single chokepoint
is the single most valuable thing this epic inherits: the notification layer goes
*above* it and does not need to add a second path.

**The sender is a port.** `mail.ts`'s `SendEmail` takes `{ to, from, subject,
body }` and returns a non-optional `providerId`; a Resend adapter is selected by
the presence of `RESEND_API_KEY` and a recording local adapter by its absence. It
already mints a `providerId` on the local path so the record shape is the same in
a test as in production. Moving provider is one adapter and no call sites.

**Sends are recorded before they are attempted.** The record is written `queued`
ahead of the provider call and updated after, so a crash leaves evidence rather
than silence. Statuses are `queued → sent | failed` (the send path's) and
`sent → delivered | bounced | complained` (the webhook's), and `email-webhook.ts`
maps the provider's events onto `contact_events`.

**Address suppression already exists, for exactly one caller.** `lead.ts`'s
`suppressed(history)` reads the message ledger and returns `'send' |
'already_sent' | 'suppressed'` before an address is written to. It is consulted
by asset delivery and by nothing else. `messages.ts` says why `complained` is a
distinct status from `bounced` and names the failure mode this epic inherits:
*"abuse of a marketing form breaks the login."*

**A preference store exists and is the right one.** `user_acceptances`
(`0001_baseline.sql:745`, [[REQ-240]]) holds one row per `(contact, key)` with
`granted` under a two-value CHECK, `business_id` derived from the contact and
never supplied, and an index on `(business_id, acceptance_key, granted)` put
there for exactly the query shape a notification fan-out asks. Its registry
(`builder/acceptances.js`) already distinguishes a `preference` — revocable by
the contact, both directions recorded — from a `document` and a `request`, and
`recordAcceptance` is deliberately a function rather than a route so a caller
outside the authenticated gate can reach it.

**A contact can already change their own preferences without the builder.**
`/api/acceptances` ([[REQ-245]]) is the signed-in contact's own read and write,
reached from the portal at `/account` (`portal.ts`). This is the coarse-control
surface the client describes, already standing.

**Message copy is already content rather than code.** `templates.ts` resolves a
template by key to the newest ticket in *that business's* store, records the
`template_uid` beside the key so a record made last month still points at the
text that was sent, and carries an optional per-template `from`. The key set is
closed at `invite`, `signin`, `lapsed`.

**The history spine is append-only.** `contact_events` refuses UPDATE at the
database, allows DELETE so erasure can reach it, and leaves `kind` unconstrained
so a new kind is a code change and not a migration.

**Who the operators of a business are is one query.** `memberships` is
`(user_id, business_id, role, status, revoked_at)` with an index on
`business_id`; platform operators are `users.platform_operator`.

**A business may send from its own domain.** `sending_domains` ([[REQ-259]])
records a customer domain registered and verified for sending. So the sender for
a level-2 notification is a fact the system already holds, and must be read
rather than reinvented.

### And these are the gaps

- **Nothing classifies a message.** There is no notion of informational versus
  transactional anywhere.
- **Nothing consults a preference before sending.** The one suppression check
  that exists is about the address, not the person's wishes.
- **No producer can raise anything.** Every send site today is a hand-written
  call from the flow that caused it.
- **There is no record of a notification that was *not* sent**, which is the
  record the question *"why didn't I get that"* needs.
- **No channel exists but email**, and the port is email-shaped: `to`, `subject`,
  `body`, HTML.
- **There is no address a phone could live at.** `user_emails` is email-only by
  name and by CHECK, and there is no `phone` column anywhere in the schema —
  [[DOC-42]] §4.1 already records this as a gap that bites hardest at level 2.
- **`List-Unsubscribe` is deliberately absent.** `MAIL.md` §4 defers it as
  *"incoherent on a sign-in link the recipient asked for thirty seconds ago"*,
  and says it becomes right *"if this platform ever sends marketing mail"*. This
  epic is where that deferral expires — see D8.

### The first consumer already exists and is already a known hole

[[DOC-47]] §3 records it in the product's own voice: a contact form on a published
site captures into the business's contact list, *"what is still missing is
notification — nobody is emailed when an enquiry arrives; it appears in the
contact list and waits to be looked at"*, and the guidance is to tell the client
to agree who is checking it.

That is the client's own *"a new user just requested the whitepapers"*, it is the
single most valuable notification this product can send, and it is why the
framework's first type is `lead.captured` with audience `operators`, class
`informational`, default **on**.

## The model

### 1. A notification type is a declaration, and the registry is closed

One declared object per kind of notification, in code, on `builder/acceptances.js`'s
precedent and for its reason: the definition has to be reachable from both sides
of the seam — the pane that draws the control and the worker that decides whether
to send — and a key spelt at either end is a second answer free to drift by a
character.

A type declares:

| | |
| --- | --- |
| **key** | `lead.captured`, `payment.failed` — stable, and what a preference row names |
| **class** | `informational` or `transactional` (§3) |
| **audience** | who it is for, relationally (§2) |
| **channels** | which channels it is *allowed* on; email only today |
| **default** | on or off for a recipient who has never expressed a view |
| **label and description** | what the control calls it, in the recipient's words |

The copy stays out of the registry: a body is a template ticket in the
business's own store, resolved exactly as `templates.ts` already resolves one, so
a customer's notification copy is the customer's.

**Falsifier:** a notification raised under a key nobody declared; a control label
spelt at a call site; a `switch` on the key anywhere but the registry.

### 2. Audience is relational, and there is no level

The client's three levels are the right way to *talk* about this and the wrong
way to build it. [[DOC-42]] §3 is explicit — *a level is a position, not a
property* — and its falsifier is *"a `level` column, an `is_platform_user`
predicate, or any query that branches on which level a row belongs to."* A
framework that took `level: 2` as a field would break that on day one.

So a type names its audience by **relation to the event**, and the same three
declarations serve all three levels because each is read from wherever the event
happened:

- **`subject`** — the contact the event is *about*. Their download is ready;
  their enquiry got a reply.
- **`operators`** — whoever may run the business the event happened in:
  `memberships` on that business, active and unrevoked, then their addresses. A
  new lead on Alice's Plumbing reaches Alice. The identical declaration on the
  1st Contact business reaches us, because we are the operators of ours.
- **`platform`** — `users.platform_operator`, for things that are ours to fix and
  meaningless to the customer. [[EPIC-7]] already states the routing rule this
  implements: *"Customer hears things they can act on, or must legally know. We
  hear everything else, and fix it before it becomes a question."*

Read against [[DOC-42]]'s example: `lead.captured` with audience `operators` is
level 1 when the form is on Alice's site and level 0 when it is on ours. One
declaration, no branch, and the recursion stays exactly two deep without anything
knowing how deep it is standing.

**Falsifier:** a `level` field on a notification type; an audience resolver that
consults `TENANT_ID`; a notification type that exists only for the platform.

### 3. Two classes, and the discipline that keeps the second one small

`informational` consults the recipient's preferences. `transactional` does not —
which is the client's *"I don't think we offer an opt-out for the second"*, and
it is correct.

The hazard is entirely in the second word. A class with no opt-out is the class
every producer would prefer its notification to be in, and a framework that lets
the producer choose will find everything is transactional within a year. So
classification is a property of the **type**, set when the type is declared and
not passed at the raise, and it is decided by a written test:

> If this person had switched off everything they are permitted to switch off,
> would withholding this leave them unable to act on something they are
> responsible for, or leave us in breach of something? If the honest answer is
> *no, they would merely be less informed*, it is informational.

*"Your payment failed"* passes: withholding it costs them their access. *"A new
user just requested the whitepapers"* does not: they can read it in the CRM
whenever they like, and that is exactly why the client picked those two examples.

**And a transactional notification is still not a guarantee of delivery.** It
skips the preference check and nothing else — §4's third suppression still
applies to it, and pretending otherwise is how a lockout becomes invisible.

**Falsifier:** a class argument on the raise call; a transactional type whose
withholding costs the recipient nothing; a producer that can promote its own
notification's class.

### 4. Three suppressions, and they are not the same thing

They arrive from three different places, mean three different things, and have
three different remedies. Conflating any pair produces a silent failure, so the
framework names them separately and applies them in this order:

| | Means | Applies to | Who owns it |
| --- | --- | --- | --- |
| **Producer** | *do not raise this at all* | everything | the caller that raises |
| **Preference** | *this person said no* | informational only | the recipient |
| **Address** | *this address is burned* | everything, including transactional | delivery |

**Producer suppression** is [[EPIC-7]]'s propagation window (*"I just changed
this, expect it to be wrong until T"*) and [[EPIC-13]] §5's synthetic traffic
(*"customer notifications are suppressed for synthetic traffic"*). Both are facts
the raiser knows and the framework cannot infer, so they travel as flags on the
raise and are honoured in one place rather than re-implemented per producer.

**Preference suppression** is §5 and §6.

**Address suppression** is the existing bounce/complaint rule, generalised from
`lead.ts` to every send. It overrides the class, because a hard bounce is the
mailbox saying it cannot take mail and a complaint is a person saying they did
not want it, and continuing either destroys the sending domain that also carries
every sign-in link.

**So the hardest case in this epic is a transactional notification to a
suppressed address**, and it must be loud rather than silent: recorded as a
refusal with its reason, visible on the contact's record, and raised to the
operators as its own notification. The person on the other end of it cannot log
in and cannot be told why by mail. §9 OQ3 is the channel that would actually
reach them.

**Falsifier:** one suppression check that answers all three questions; a
transactional send that bypasses the address check; a producer flag that some
producers honour and others do not.

### 5. Control lives in two places, and both are about a person

The client's split is right and the two surfaces are for two different moments.

- **The portal — coarse.** One switch: *informational notifications, on or off*.
  It is the switch for somebody who does not want to think about it, and it is
  the only control a level-2 contact has today, because Bob has no app
  ([[DOC-42]] §1) and therefore no Settings tab. It goes where the existing
  preference control already is — `/api/acceptances` and `/account`
  ([[REQ-245]], `portal.ts`).
- **Settings — fine.** One control per declared informational type, which is the
  client's *"as we add platform notification capabilities we will add the
  controls"*: adding a type adds its control, because the pane is drawn from the
  registry and never from a list somebody maintains beside it.

**The coarse switch wins.** Off means off, regardless of a fine-grained control
left on, because *"I turned notifications off and still got notifications"* is
the one outcome that destroys trust in the whole surface. It is an AND, not a
default.

**Transactional types appear on neither surface as a control, and should appear
on Settings as a list.** A person is owed knowing what we will send them
regardless; a pane that shows only what is switchable implies the rest does not
exist.

**Falsifier:** a notification control list maintained separately from the
registry; a coarse switch that a fine-grained one can override; a transactional
type rendered with a toggle.

### 6. A preference is a preference acceptance, and absence means the default

Notification preferences go in `user_acceptances` as `preference`-type keys.
Nothing new is needed, and three properties of that table are exactly right for
this:

- `granted` is a two-value CHECK, so **absence of a row is the third state** and
  it means *the type's declared default*. That is the shape that makes a new
  notification type a code change: the type arrives with a default and every
  existing contact already has the right answer.
- `business_id` is derived from the contact on every write, so a preference
  cannot be filed under a business its holder does not belong to.
- The `(business_id, acceptance_key, granted)` index already answers *every
  contact in this business who wants this*, which is the fan-out query.

The history is `contact_events`, append-only, and it already distinguishes
`acceptance.granted` from `acceptance.withdrawn` — because *never asked* and
*withdrew last week* are different facts and a consent record that cannot tell
them apart is not a consent record.

**Falsifier:** a second preference table; a migration that backfills a row per
contact per type (which is both an N×M write and [[DOC-42]] §5's *"a constant
that can go missing"*); any reader that treats a missing row as *off*.

### 7. Channel is chosen at delivery, and the raise never names one

A raise names a type, a cause and a recipient. A **channel resolver** then asks,
per recipient: which channels does this type allow, which of them can this person
actually be reached on, and which of those have they not refused. Email is the
only implemented channel; adding SMS or push is an adapter, an address kind and a
per-channel template, and no producer changes.

`sendRecordedEmail` stays the one way an email leaves the building. What changes
is who calls it.

**Falsifier:** a producer that names a channel or composes a subject line; a
notification type whose per-channel copy is authored in code; `SendEmail` imported
anywhere outside the email adapter.

## Scope

### 1. The type registry and the raise

The registry of §1, and one verb — a raise that takes a type key, the cause, the
business the event happened in, and the producer-suppression flags. Nothing else.

### 2. The decision record

One record per `(cause, recipient, type)`, written **whether or not anything was
sent**, carrying the outcome and its reason: delivered, refused by preference,
refused by address, suppressed by the producer, or failed. This is the answer to
*"why didn't I get that"* and it does not exist today in any form.

It is also where **at-most-once** lives, on `lead.ts`'s precedent: the ledger is
what is consulted, not a counter, because a counter can say yes for a send that
never left.

### 3. The two control surfaces

The coarse switch on the portal (extending [[REQ-245]]'s endpoint and pane) and
the registry-driven fine-grained pane on Settings, following [[EPIC-4]]'s
existing section pattern.

### 4. Email as the first channel, behind a channel seam

No second adapter is built. What is built is the seam, and the proof that it is a
seam is that the email adapter is the only thing in the tree that knows a message
has a subject line.

### 5. Unsubscribe without a login

A level-2 contact who filled in a form has no session and may never have one, so
every informational mail carries a link that flips one preference and a
`List-Unsubscribe` / `List-Unsubscribe-Post` header pair so a mail client can do
it in one click.

The token is modelled on `asset_grants` and is emphatically not a credential: it
opens no session, names no membership, and reaches nothing but one preference for
one person. `asset_grants`' own docstring is the precedent for why that is a
separate table from `login_tokens` rather than one with a `purpose` column.

### 6. Volume

At minimum a per-`(recipient, type)` cap over a window, because the concrete
hazard is not gradual growth — it is one afternoon of form spam turning into four
hundred emails from a domain that also delivers our logins. Coalescing and digests
are §9 OQ5.

## Decisions

**D1. The registry is closed and lives in code.** A key nobody declared is a
write nobody designed — `builder/acceptances.js`'s own reasoning, which this
follows rather than restates.

**D2. Audience is relational.** `subject` / `operators` / `platform`, resolved
from the event. No level anywhere ([[DOC-42]] §3).

**D3. Class is on the type, not on the raise**, and is decided by §3's test.

**D4. The three suppressions stay three**, applied in order, each recorded with
its own reason.

**D5. Preferences are `user_acceptances` preference rows**, and absence means the
type's declared default.

**D6. The coarse switch is an AND over the fine-grained ones.**

**D7. The three identity messages become transactional notification types in the
same pass.** `invite`, `signin` and `lapsed` are notifications in everything but
name, and leaving them beside the framework would leave two ledgers, two
suppression stories and two answers to *what have we sent this person*. Routing
them through it is cheap precisely because transactional consults no preference —
and XGD's simplicity mandate makes this the choice rather than an option: the new
path replaces the old rather than sitting next to it.

The risk is named and closed by construction: **a sign-in link must never be
withheld because of a preference**, and it cannot be, because its class forbids
consulting one.

**D8. `MAIL.md`'s `List-Unsubscribe` deferral expires here.** That deferral was
conditional on this platform never sending bulk mail, and an informational
notification stream is bulk mail in the sense the bulk-sender rules mean.

**D9. Informational notifications must not share their return path with
sign-in.** `messages.ts` already names the failure — complaints degrade the
sending domain, and the first casualty of a degraded domain is sign-in links not
arriving. `MAIL.md` already prescribes the remedy: *"a separate subdomain with
separate reputation."* For a level-2 notification the domain at risk is the
*customer's*, via `sending_domains`, which raises the stakes rather than lowering
them and puts this squarely against [[EPIC-13]]'s *never break the business's
mail*.

**D10. Nothing is built for push or SMS.** Not an adapter, not a stub, not a
disabled config key. What is owed to them is the seam and §7's falsifier; what
they actually need before they can exist is §"Before another channel can exist".

## Before another channel can exist

Recorded here because both are prerequisites in the schema, not work inside a
delivery adapter.

- **SMS needs an address of kind phone.** `user_emails` is email-only by name and
  by a CHECK that casefolds, and nothing in the schema holds a phone number.
  Recommendation: generalise the address table rather than add a sibling
  `user_phones`, because suppression is per-address and `messages.addressId`
  already treats the address as the thing a bounce is a fact about — two tables
  would mean two suppression lists and eventually one of them being consulted.
- **Push registrations are not addresses.** A device token is per-install,
  refreshed silently by the OS and revoked without telling us; an address is
  something a person has. Distinct table, distinct lifecycle, and its own
  invalidation path. [[DOC-11]] is the reference.

## Boundaries

- **The mail channel's health** — deliverability, authentication, capture, lists,
  campaigns, ramping, scheduled windows → [[EPIC-13]]. This epic does not own the
  channel; it owns what decides whether to use it. A campaign is a human
  composing to a list; a notification is the product reacting to an event. They
  share a preference store and a suppression list and nothing else.
- **Deciding what an observation means** → [[EPIC-7]]. It computes verdicts and
  raises; this delivers and controls.
- **The rest of the Settings tab** → [[EPIC-4]]. The notification pane is this
  epic's; the pane pattern is that one's.
- **The events that cause billing notifications** → [[EPIC-9]].
- **The contact timeline** → [[EPIC-11]] owns the spine. A notification decision
  is a new `kind` on it, which is a code change by that table's design.
- **Erasure** → [[DOC-37]]. Preferences and decisions cascade on contact delete
  today because `user_acceptances` and `contact_events` both do; **message
  tickets do not**, and that is worth checking rather than assuming.

## Open questions

1. **Can an audience be an address that is not a contact?** *"Send enquiries to
   `enquiries@alicesplumbing.com`, not to every operator"* is an ordinary
   small-business want, and a shared mailbox is not a person — it has no
   preferences, no suppression history and no erasure rights. Allowing it is
   useful and puts a non-contact in a path that assumes a contact everywhere.
2. **What are the level-2 notification types?** Explicitly deferred by the
   client. Candidates, none committed: the artifact they asked for is ready; a
   reply to their enquiry; a booking made, confirmed or approaching (not built);
   a receipt (not built); their own sign-in link (exists, and becomes a
   transactional type under D7).
3. **Is there an in-product inbox as a channel?** It needs no address, no
   consent and no deliverability, and it is the only honest answer to §4's
   hardest case — a person whose every external channel is suppressed. Strong
   candidate; it is also the thing that makes *"we could not reach you"*
   recoverable rather than terminal.
4. **Does the coarse switch reach transactional at all?** Recommendation: no, and
   the pane says so in words rather than by omission. But a person who switches
   everything off and still receives mail needs to have been told why, on the
   surface where they switched it.
5. **Digest and coalescing.** Six leads in an hour is one notification or six.
   The cap in §6 is the floor, not the answer.
6. **Quiet hours.** [[EPIC-13]] already wants *"nothing before 8am on the launch
   day"*. Informational could respect a window; transactional must not. There is
   no timezone on a contact today.
7. **Where does the decision ledger live?** One row per recipient per
   notification *including refusals* is far more volume than one ticket per email
   sent. A ticket per decision is consistent with `messages.ts` and may not be
   the right shape at fan-out scale.
8. **Does a business declare its own notification types?** The acceptance
   registry says per-business custom keys *"slot into this same table later"*. The
   same question arrives here the first time a customer wants to be told
   something we did not think of.

## Amendments this epic owes

- **[[EPIC-7]]'s notification section becomes a consumer.** It scopes
  *"Notification — what happens on a verdict change, with severity, routing
  (operator vs customer) and suppression"* and calls it *"the part most likely to
  be under-built"*. Under this epic it is not built there at all: routing is an
  audience declaration per check, suppression is §4's producer flag, and severity
  is either a class or a property of the check's own verdict. Its
  check/notify framing needs narrowing to check/raise.
- **[[EPIC-13]] §3's *"consent and opt-out — per-list and per-category"* is the
  same store as §6's.** Two opt-out surfaces for one person is the failure,
  whichever epic builds the second one.
- **`MAIL.md` §4** records `List-Unsubscribe` as out of scope. D8 supersedes that
  for informational mail; the file should say so where the deferral is stated.

## Children

None yet.

## Siblings

| Epic | | |
| --- | --- | --- |
| [[EPIC-4]] | Settings tab | where the fine-grained controls land |
| [[EPIC-7]] | DNS checks and monitoring | the first non-form producer |
| [[EPIC-10]] | Forms | where `lead.captured` is raised from |
| [[EPIC-9]] | Billing and payments | where *"your payment failed"* comes from |
| [[EPIC-11]] | Contact activity log | the spine a decision is recorded on |
| [[EPIC-13]] | Email | the channel, its health, and campaigns |
