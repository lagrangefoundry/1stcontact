---
uid: epic-2d9e2d56
id: EPIC-14
type: epic
title: User Notifiations
created_by: martin-github@westhead.me
created_at: '2026-09-17T00:22:56.755347+00:00'
updated_at: '2026-09-17T21:39:48.754851+00:00'
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

## Where the focus is

**The first pass is 1st Contact's own notifications to our level-1 customers**, and
the bigger picture above is held rather than built. That means, concretely:

- The producer is an event in the product — a form submission, a DNS verdict, a
  payment — and the recipient is a **member of the 1st Contact business**: Alice,
  who signed up and has a Settings tab.
- The audience resolver exercised is `operators` (§3), and because level is a
  position rather than a property the same declaration reaches us on our own
  business the moment we are the ones with the lead.
- Both control surfaces are built, because the fine-grained one is what the client
  asked for and the coarse one already half exists.
- **Level 2 is designed for and not built.** §2 gives the structural reason it
  waits, which is stronger than "we have not decided which ones": a level-2
  notification needs a level-2 *member*, and a business's own sign-up flow is
  barely a thing yet.

This focus decides what is *implemented*, not what is *modelled*. Every rule below
is written so that the level-2 case is a set of registry entries and a portal
pane rather than a second code path — which is [[DOC-40]] §2.1 rule 1's named
failure mode, and the one thing this epic cannot afford to get wrong, because a
platform-only notification framework would have to be rewritten to serve the
customers it was built for.

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
- **Nothing can ask whether a notification *would* arrive.** There is no
  reachability question anywhere, which is the primitive the contextual prompt
  turns on.
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

### 2. A notification goes to a member, and to nobody else

A **member** is [[DOC-42]] §4's access axis: a contact who has signed up, which
is `tos_accepted_at` set and written by an act of their own. Not a lead, not a
form submitter, not somebody we invited and who never answered.

This is a narrowing of the audience resolvers in §3 and it is the constraint that
makes the rest of this epic coherent, for three reasons that are all the same
reason:

- **A member has somewhere to put a preference.** They have an account, a portal
  and a login, so every control in §6 is reachable by them. A stranger who cannot
  reach any control should not be receiving preference-governed mail — the
  framework would be claiming to honour a choice they were never able to express.
- **A member has a relationship worth notifying about.** A notification says
  *something happened that concerns your standing with this business*. A lead has
  no standing yet.
- **A member is erasable through a path that already exists.** Their preferences
  and their decision records hang off a `users` row that cascades.

**So the things we already send to non-members are not notifications**, and that
is a statement about what they are rather than an exemption. An invite goes to
somebody who is by definition not yet a member; a sign-in link and a gated
download go to whoever just performed the act that asked for them. All three are
**replies to an act**, addressed to the person who acted, and the distinction is
sharp enough to build on:

> A **reply** answers something this person just did. A **notification** tells
> them about something that happened elsewhere, or later, or to somebody else.

A reply consults no preference because there is none to consult — they asked
thirty seconds ago. A notification always does, unless its class forbids it.

**Falsifier:** a notification type whose audience can resolve to a contact with
no `tos_accepted_at`; a preference consulted before a reply; the word
*notification* used for the invite.

### 3. Audience is relational, and there is no level

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

### 4. Two classes, and the discipline that keeps the second one small

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
skips the preference check and nothing else — §5's third suppression still
applies to it, and pretending otherwise is how a lockout becomes invisible.

**Falsifier:** a class argument on the raise call; a transactional type whose
withholding costs the recipient nothing; a producer that can promote its own
notification's class.

### 5. Three suppressions, and they are not the same thing

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

**Preference suppression** is §6 and §7.

**Address suppression** is the existing bounce/complaint rule, generalised from
`lead.ts` to every send. It overrides the class, because a hard bounce is the
mailbox saying it cannot take mail and a complaint is a person saying they did
not want it, and continuing either destroys the sending domain that also carries
every sign-in link.

**So the hardest case in this epic is a transactional notification to a
suppressed address**, and it must be loud rather than silent: recorded as a
refusal with its reason, visible on the contact's record, and raised to the
operators as its own notification. The person on the other end of it cannot log
in and cannot be told why by mail. OQ3 is the channel that would actually
reach them.

**Falsifier:** one suppression check that answers all three questions; a
transactional send that bypasses the address check; a producer flag that some
producers honour and others do not.

### 6. Control lives in two places, and both are about a person

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

### 7. A preference is a preference acceptance, and absence means the default

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

### 8. Channel is chosen at delivery, and the raise never names one

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

### 9. A flow may ask in advance whether a notification would arrive

The decision in §5 is normally taken at send time, once, and recorded. It is also
worth **asking ahead of time**, by the flow that is about to depend on it: *if I
raise `domain.ready` for this person, will it reach them?*

It must be the **same code** that answers both, or the two disagree and the
product starts telling people things about their own settings that are not true.
So the probe is the decision function run without sending, and it returns the
reason rather than a boolean — the reasons are §5's, and they want different
things said about them:

| Reason | What is true | What to offer |
| --- | --- | --- |
| would arrive | nothing to say | nothing |
| preference is off | they switched it off, or never switched it on | turn it on |
| no address for any allowed channel | we have no way to reach them | add one |
| address suppressed | mail to them bounces or was reported | **a different address** — a preference cannot fix this |

The fourth row is the reason this is a typed reason and not a boolean. A prompt
that offers *"turn notifications on and we'll tell you when your domain is
ready"* to somebody whose address is burned has made a promise the system cannot
keep, and it is the most confident-sounding lie the framework could tell.

**Falsifier:** a probe that reproduces the decision logic instead of calling it; a
probe that returns true/false; any surface that offers a preference toggle as the
remedy for a suppressed address.

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
are OQ5.

### 7. The contextual prompt

**The feature:** when a person starts a flow whose payoff arrives later by
notification, and §9's probe says it would not reach them, the flow may raise a
prompt at the moment it is relevant — *"turn this on and we'll tell you when your
new domain is ready."*

It is the answer to a specific failure: notifications off is a perfectly
reasonable standing choice that becomes the wrong choice for the twenty minutes
somebody is waiting on a DNS cutover, and the only moment they would ever think
about it is the moment they press the button. A settings pane cannot reach that
moment; only the flow can.

Six rules, and each one is there because the obvious version of this feature
breaks it:

1. **The flow decides where, the framework decides whether.** The flow picks the
   moment — it is the only thing that knows when the request has been made and the
   waiting has started. Whether the prompt appears at all is §9's probe, never the
   flow's own guess at a preference.
2. **It names the notification, in that notification's words.** Not *"enable
   notifications"*. So the registry carries a **promise** string written for
   exactly this sentence — *"when your new domain is ready"* — beside the control
   label, because a prompt and a control that describe the same type differently
   is how somebody turns the wrong thing on.
3. **One click grants that one type.** Not everything. Turning the whole category
   on to get one thing is the move people resent, and resenting the prompt is how
   a useful prompt becomes the cookie banner.
4. **If the coarse switch is what is blocking, say so.** §6 makes it an AND, so
   granting the single type changes nothing while the master switch is off — and
   flipping the master switch starts delivering every other default-on type too.
   That is a real consequence and the prompt states it in words; it does not
   quietly flip it and it does not silently fail.
5. **It never blocks the flow.** The domain gets configured whether they answer,
   dismiss, or ignore it. A modal that gates the work would make the notification
   feel like a toll.
6. **Dismissal is an answer and is recorded**, and the prompt does not return for
   that person and that type. Asking twice is asking for a no.

It is a surface in an app, so it exists at levels 0 and 1 and has no level-2 form
at all — Bob has no app to be prompted in ([[DOC-42]] §1). That is a limit of the
mechanism rather than a gap to fill: the level-2 equivalent is the copy on the
form he is filling in, which is a site edit.

## Decisions

**D1. The registry is closed and lives in code.** A key nobody declared is a
write nobody designed — `builder/acceptances.js`'s own reasoning, which this
follows rather than restates.

**D2. Audience is relational, and resolves only to members.** `subject` /
`operators` / `platform`, resolved from the event, and every one of them filtered
to contacts who have signed up (§2). No level anywhere ([[DOC-42]] §3).

**D3. Class is on the type, not on the raise**, and is decided by §4's test.

**D4. The three suppressions stay three**, applied in order, each recorded with
its own reason.

**D5. Preferences are `user_acceptances` preference rows**, and absence means the
type's declared default.

**D6. The coarse switch is an AND over the fine-grained ones.**

**D7. The identity messages stay outside the notification layer — amended.** An
earlier draft of this decision absorbed `invite`, `signin` and `lapsed` as
transactional notification types, to get one ledger and one suppression check.
**§2 overturns it.** An invite by definition goes to somebody who is not a member;
a sign-in link and a gated download go to whoever just performed the act that
asked for them. They are **replies**, and making a reply a notification would mean
the audience resolver had to admit non-members — which is the one thing §2
forbids, and it would forbid it for the sake of tidiness rather than for a reader.

**What the earlier draft was right about is kept, and it needs no reversal**: the
one ledger and the one address-suppression check live in the **delivery** layer,
below both. `sendRecordedEmail` stays the single way an email leaves the building
and the single place the address check is made. A notification is one caller of
it; a reply is another. One path, several callers — which is already true today
across `invites.ts`, `sessions.ts` and `lead.ts`.

So the risk the earlier draft closed by construction is closed more simply: **a
sign-in link cannot be withheld by a preference** because it never reaches the
layer that consults one.

**D8. `MAIL.md`'s `List-Unsubscribe` deferral expires here, and the unauthenticated
token is demoted.** The deferral was conditional on this platform never sending
bulk mail, and an informational notification stream is bulk mail in the sense the
bulk-sender rules mean — so the header pair is required regardless.

**What §2 changes is the token behind it.** An earlier draft made the token the
only route, on the grounds that a level-2 form submitter has no session and may
never have one. Under §2 that person receives no notifications at all, so every
recipient is a member with a login and a portal, and the control is always
reachable the ordinary way. The token therefore exists for *one-click*, which a
login-gated link is not, and not because there is no other route — a smaller claim
on a smaller mechanism.

**D9. Informational notifications must not share their return path with
sign-in.** `messages.ts` already names the failure — complaints degrade the
sending domain, and the first casualty of a degraded domain is sign-in links not
arriving. `MAIL.md` already prescribes the remedy: *"a separate subdomain with
separate reputation."* For a level-2 notification the domain at risk is the
*customer's*, via `sending_domains`, which raises the stakes rather than lowering
them and puts this squarely against [[EPIC-13]]'s *never break the business's
mail*.

**D10. The contextual prompt is part of the framework, not of the flow that shows
it.** The registry carries the promise string, §9's probe decides whether to
appear, and the prompt component is shared; a flow supplies the moment and nothing
else. Each flow writing its own would produce as many answers to *have you got
notifications on* as there are flows, and they would drift apart in the direction
of optimism.

**D11. Nothing is built for push or SMS.** Not an adapter, not a stub, not a
disabled config key. What is owed to them is the seam and §8's falsifier; what
they actually need before they can exist is the section below on other channels.

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
- **The flows that show the contextual prompt** → [[EPIC-5]] and [[EPIC-6]] own the
  cutover and purchase flows and choose the moment. This epic owns the probe, the
  promise string and the component; a flow that reimplemented any of the three
  would be the thing D10 exists to prevent.
- **The contact timeline** → [[EPIC-11]] owns the spine. A notification decision
  is a new `kind` on it, which is a code change by that table's design.
- **Erasure** → [[DOC-37]]. Preferences and decisions cascade on contact delete
  today because `user_acceptances` and `contact_events` both do; **message
  tickets do not**, and that is worth checking rather than assuming.

## Open questions

1. **Can an audience be an address that is not a contact?** *"Send enquiries to
   `enquiries@alicesplumbing.com`, not to every operator"* is an ordinary
   small-business want, and a shared mailbox is not a person — it has no
   preferences, no suppression history and no erasure rights.

   §2 gives the shape of the answer rather than settling it: to receive
   notifications, be a member. A shared mailbox *can* be one — a contact whose
   address happens to be read by several people, signed up like anybody else — and
   that keeps the whole path honest with no non-contact in it. Whether that is the
   answer we want, or a dodge that will read as absurd the first time somebody has
   to accept terms on behalf of `enquiries@`, is the open part.
2. **What are the level-2 notification types?** Explicitly deferred by the
   client, and §2 adds a structural reason to be in no hurry: a level-2
   notification needs a level-2 member, and a business's own sign-up is barely a
   thing yet. Candidates, none committed: a booking made, confirmed or approaching
   (not built); a receipt (not built); a reply to a thread they started. Note that
   the artifact they asked for and their own sign-in link are **replies** under §2
   and so are not on this list at all.
3. **Is there an in-product inbox as a channel?** It needs no address, no
   consent and no deliverability, and it is the only honest answer to §5's
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
  audience declaration per check, suppression is §5's producer flag, and severity
  is either a class or a property of the check's own verdict. Its
  check/notify framing needs narrowing to check/raise.
- **[[EPIC-13]] §3's *"consent and opt-out — per-list and per-category"* is the
  same store as §7's.** Two opt-out surfaces for one person is the failure,
  whichever epic builds the second one.
- **`MAIL.md` §4** records `List-Unsubscribe` as out of scope. D8 supersedes that
  for informational mail; the file should say so where the deferral is stated.

## The first pass, and where its line is

**As simple as possible, and a real framework rather than one hardcoded email.**
The test of that is the second producer: if adding it is a registry entry and a
raise, this worked; if it is a new send path, it did not. So the first pass ships
*two* producers deliberately, and they are the two that already have a hole where
a notification should be.

**What is in.** The registry, one audience resolver, the decision, the record, the
two control surfaces, two producers, and the probe the contextual prompt turns on.

**What is deliberately out, and why it is safe to leave out for now — not why it
does not matter:**

- **`subject` and `platform` audience resolvers.** Every notification worth
  sending at level 1 goes to the operators of a business, so `operators` alone
  covers the whole first pass. The other two are registry-shaped additions, not a
  second mechanism.
- **The unauthenticated unsubscribe token and `List-Unsubscribe`** (D8). Every
  recipient is a member with a portal, so the control is always reachable; and the
  bulk-sender rules that require the header bite at a volume one email per lead
  does not approach. **It becomes required before any type fans out to a list.**
- **A separate sending subdomain for informational mail** (D9). Same reason and
  the same trigger: the risk is proportional to volume and complaint rate, and at
  one-per-lead it is not yet the thing most likely to hurt the sending domain.
  **It becomes required before volume, and before any level-2 notification.**
- **Push and SMS** (D11), **digests, quiet hours and an in-product inbox** (OQ3,
  OQ5, OQ6). Nothing is stubbed for any of them.

**The one thing kept that could have been cut:** a per-`(recipient, type)` cap
over a window. It is a handful of lines because the decision record is already
being read, and the hazard it removes — an afternoon of form spam becoming four
hundred emails from the domain that also delivers our logins — is live the day the
first producer ships.

## Children

Two.

### 1. The framework, its first notification, and its controls

Everything that decides whether a person is told, plus the first thing they are
told about, plus the two places they control it. One branch, because none of the
three is testable in the product without the other two — and in particular
**shipping an informational notification with no way to switch it off is the one
thing §4 forbids**, so the controls are not a follow-on.

- The registry, in `src/builder/` with no imports, on `acceptances.js`'s and
  `contact-events.js`'s precedent: the one definition has to be readable by the
  pane that draws a control and the worker that decides a send.
- The preference keys registered in the existing acceptance registry, so
  `user_acceptances` holds them and absence means the declared default.
- The decision: the `operators` resolver, the member filter, the class rule, the
  preference check with the coarse switch as an AND **enforced here rather than in
  the pane**, the address-suppression check, and the cap.
- The decision record, written whether or not anything sends.
- `lead.captured` — the producer, its template ticket, and the first real send.
- The coarse switch on the portal and the registry-driven pane on Settings.

The sender is injected throughout, so every rule above is provable with no
provider and no browser — `messages.ts`'s own discipline, which already states it:
*"a suite drives `sendRecordedEmail` with a stub, and there is no import here that
could reach a network."*

### 2. The contextual prompt

The probe (§9), the shared prompt component, the promise string, and
`sending.ready` — raised from `refreshSending`'s `pending → verified`, whose copy
already says *"you can carry on, and it will come right on its own"* — shown at the
moment the customer presses **Send email from this domain**.

**It is separate because it is the falsifier for the first.** Adding a second
producer should be a registry entry and a raise; if it turns out to be a second
send path, the first ticket got the seam wrong, and that is evidence worth
collecting rather than obscuring by building both sides at once. It is also
separable in the other direction: the first ticket is complete and useful without
it.

## Siblings

| Epic | | |
| --- | --- | --- |
| [[EPIC-4]] | Settings tab | where the fine-grained controls land |
| [[EPIC-7]] | DNS checks and monitoring | the first non-form producer |
| [[EPIC-10]] | Forms | where `lead.captured` is raised from |
| [[EPIC-9]] | Billing and payments | where *"your payment failed"* comes from |
| [[EPIC-11]] | Contact activity log | the spine a decision is recorded on |
| [[EPIC-13]] | Email | the channel, its health, and campaigns |

## The test gutter — this epic's share ([[DOC-54]])

[[EPIC-15]] manufactures traffic through real code paths to prove they work.
[[DOC-54]] R3 requires that traffic reach no customer — and **the notification half of
that rule lives here, in one place, by design**.

**What this epic owns: the audience resolver drops a declaration whose originating
event is synthetic.** Nothing else in the product decides it.

The rule is stated deliberately as *suppression keys on the **record**, not on the
traffic* ([[DOC-54]] §2.8). A notification fires because a contact event happened; if
that event carries the mark, it is suppressed. Traffic that produces no contact event
has nothing to decide — which is how the client's forwarding-test case resolves
without an exception, and why the marker did **not** need to carry an initiator class.

**This epic's existing architecture is what makes the single point possible**, and the
dependency runs the other way round from how it looks: because a producer *declares*
and never sends — *"it does not know whether that becomes an email, a push or nothing
at all, and it must never learn"* — there is exactly one place to put the check. Were
any producer allowed to reach a mailer directly, suppression would have to be
re-implemented at each one, and the bot enquiry that emails a business every morning
would arrive through whichever producer forgot.

So the obligation is small and the reason it is small is this epic's own design: **one
predicate in the resolver, and the existing ban on producers sending directly is what
keeps it to one.**

**The falsifier:** any notification delivered to anyone but us on synthetic traffic.

**Not this epic's:** the mark itself, the columns, the collector. [[DOC-54]] §2.