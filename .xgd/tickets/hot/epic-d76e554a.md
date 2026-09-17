---
uid: epic-d76e554a
id: EPIC-13
type: epic
title: 'Email: capture, send, and never break the business''s mail'
created_by: CHAT-54
created_at: '2026-09-16T19:20:31.585909+00:00'
updated_at: '2026-09-17T22:00:00.555369+00:00'
completed_at: null
last_field_updated: epic_children
status: underway
fields:
  priority: high
  chat_comment: comment-a687a6e5
  epic_children:
  - request-042df82b
---

## What the client asked for

> "I want you to create an Email Epic […] let's talk about what it needs to cover:
> 1) A new Email tab for all the UI modeled on the settings tab (do we need two?
>    Lets start with two and simplify if we can later)
> 2) Incoming mail — configuration of incoming mailing pipeline, config of mail
>    addresses for forwarding to one or many recipients, (possible — config of
>    catchall), instructions with AI guidance on setting up your gmail/hotmail etc
>    to SEND from your forwarding address, capturing of emails and showing them on
>    contact activity log and make them visible on contact page
> 3) outgoing — management of multiple email lists, opt in/out management for
>    users, creation of email content (md editor + AI) and styling (by AI —
>    template) — send ramping, timed send (do not send emails before 8am on the
>    launch day)
> 4) deliverability — GlockApps integration, AI support documentation, UX and AX
> 5) functional (BFM) monitoring — I will actually have an entire separate EPIC for
>    BFM, but we should plan for it here — we need 'test-specific code paths' that
>    have to be engineered into the product from the outset."
>
> "We will NOT build all this in one pass, we will nibble away at it but I'm trying
> to capture the vision."

Designed in [[CHAT-54]].

## The principle

**Every message between the business and a contact belongs on that contact's
record — and reaching for that must never put the business's email at risk.**

Both halves are load-bearing. [[DOC-46]] §2.3 is that *the machinery remembers the
conversation*, and today the machinery remembers only what we sent. Email is the
largest missing piece of the record, and the only one the business already
generates without us.

The second half is the constraint that shapes every decision below. A site outage
is visible and survivable. An email outage is invisible, total, and the fastest way
to lose a customer permanently. So the product gets into the mail path only where
the failure mode is *delay*, never *loss*, and it never becomes the place the
business's mail lives.

## What exists today, verified

**Outbound exists, and only for our own messages.** `apps/control-app/src/mail.ts`
is a sender port with a Resend adapter behind it ([[REQ-196]]); its docstring
records why Cloudflare's own `send_email` binding was rejected — *"it delivers only
to addresses pre-verified in the account, which is precisely the set an invitee is
not in."* The port exists so that moving to Postmark or SES is one adapter and no
call sites. `providerId` is returned and non-optional, so a provider event can be
joined back to what we sent.

**Delivery events already land on the record.** `email-webhook.ts` ([[REQ-198]])
verifies the Svix signature over raw bytes ahead of the Access gate, and maps
`email.delivered` / `email.bounced` / `email.complained` onto the contact spine
(`email-webhook.ts:189-191`).

**Live config.** Resend is set up for `1stcontact.io`; `RESEND_API_KEY` ships via
`bin/deploy.d/secrets/20-resend-api-key`, `EMAIL_WEBHOOK_SECRET` is set manually
([[CHAT-41]]).

**DNS reading is already built, and was built for this question.**
`apps/control-app/src/resolver.ts` ([[REQ-257]], [[EPIC-5]]) reads DNS *from
outside*, following the domain's current delegation rather than reading our own
zone back. It probes `MX`, `TXT` and DKIM selectors by name (`DKIM_SELECTORS:112`,
because selectors cannot be enumerated), classifies known mail hosts
(`MAIL_HOSTS:135`) and SPF includes (`SPF_SENDERS:194`) into a `DomainSnapshot:228`.
Its stated purpose is *"is there a live business on this domain today?"* — which is
exactly the question that decides whether touching a domain's mail is safe. This
epic consumes that; it does not rebuild it.

**Nothing inbound exists.** No Email Routing configuration, no Email Worker, no
inbound parse, no stored message bodies, no threading.

**No email surface.** `TABS = [SITE_TAB, LIBRARY_TAB, PEOPLE_TAB, SETTINGS_TAB]`
(`apps/control-app/src/builder/config.js:109`).

**The contact spine is milestones, not content.** `contact_events` ([[REQ-195]],
[[DOC-44]] §4.1) is immutable with an `ABORT` trigger on `UPDATE`, and [[EPIC-11]]
commits to keeping it *"milestones, not noise."* A 40KB message body is not a
milestone — see Open Questions.

## Scope

### 1. The surface

A business-scoped surface, or two, alongside the existing four tabs. Email is a
property of a business and the business switcher applies to all of it, so it needs
no exception to the rule the strip is built on ([[EPIC-4]], [[REQ-179]]).

The client's instinct is two tabs, simplify later. The seam worth testing is **not**
incoming/outgoing — it is **configure-once versus work-daily**. Addresses,
forwarding, DNS health and send-as setup are read-many/write-once and are exactly
what [[EPIC-4]] calls a *record-and-status surface*. Reading the conversation and
composing a campaign are workshop surfaces used constantly. See Open Questions.

### 2. Incoming

- **The pipeline.** Cloudflare Email Routing with an Email Worker in front, so we
  see the message and forward it on. MX moves only where that is safe.
- **Addresses.** N per domain, each forwarding to one or many verified recipients.
  Catch-all optional and off by default.
- **`noreply@` is refused**, and named addresses are the encouraged default. Three
  independent reasons converge: a recipient who cannot reply and wants to escalate
  has exactly one button and it is *Report spam*; replies are the strongest positive
  engagement signal a small sender has; and a reply is the thing we are trying to
  capture, so an address that cannot receive one defeats the epic. `info@` is
  discouraged with a default, not banned.
- **Send-as setup.** Guided, AI-assisted configuration so the business can *send
  from* the forwarded address in Gmail/Outlook. This is the most fragile
  customer-facing step in the epic and it is a subsystem, not a help page — Gmail's
  "Send mail as" requires working SMTP credentials and a confirmation round-trip.
- **Capture.** Messages recorded against the contact, visible on the contact page
  and on the activity log ([[EPIC-11]]).

### 3. Outgoing

- **Lists** — several per business, with membership derived from the contact record
  rather than maintained separately.
- **Import** — mandatory, not optional. A twenty-year customer list *is* the small
  business's asset, and a product that cannot ingest it is not usable by the people
  we are building for.
- **Consent and opt-out** — per-list and per-category, with service reminders
  separable from marketing.
- **Composition** — markdown editor with AI assistance; styling and template by AI.
- **Ramping** — tranched first sends with automatic halt on complaint or bounce
  thresholds.
- **Scheduled send** — with recipient-sensible windows ("nothing before 8am on
  launch day").

### 4. Deliverability

Authentication health, reputation signals, placement testing and — the actual
product — translation of all of it into language a plumber can act on, with the
diagnostic ladder ordered correctly (authentication → list quality → engagement →
content → cadence) so the assistant never suggests rewriting subject lines while
DKIM is failing.

### 5. BFM hooks — a constraint on everything above, not a section

The client's position: *"inherently we engineer the platform for BFM tests and as
such these are hidden from the user and the stats — this is an upfront requirement
of the system, not an afterthought."*

The execution of BFM is a separate epic. What this epic owns is the **contract that
makes it possible**, and it constrains the data model, so it cannot be retrofitted:

- A **signed synthetic marker**, HMAC'd with a platform secret, that can ride any
  inbound or outbound path and cannot be forged from outside.
- **Every record write carries `synthetic`**, and every read, count, aggregate and
  customer-visible metric filters it by default.
- **Customer notifications are suppressed** for synthetic traffic — a daily bot
  enquiry must never reach the business.
- A **reserved address namespace** per domain that never appears in any UI.
- The synthetic path runs the **full real code path**. Short-circuiting on the
  marker would stop testing the thing the test exists to test.

## Decisions taken in [[CHAT-54]], and why

**We never become the authoritative mailbox.** Not IMAP, not storage, not their
provider. The blast radius is total, the migration is the moment they churn, and it
is not our product.

**Forward first, record second; recording failure must never fail delivery.** If
recording breaks we lose a record, which is annoying and recoverable. If delivery
breaks we lose a message, which is not.

**Forward the bytes verbatim — never modify, never filter, never hold.** Modifying
a message breaks its DKIM signature, which fails DMARC, which lands the forward in
spam. And the moment we make delivery decisions we have become a mail provider and
we own false positives.

**Record filtering and delivery filtering are different decisions.** We forward
everything unfiltered. We must *not* record everything unfiltered, or a published
address fills the activity log with spam. Separating the two resolves what looks
like a contradiction.

**Per-business sending domain, with that business's own DKIM key.** DMARC requires
alignment between the domain that passed DKIM and the visible `From:` — so mail from
`alice@alicesplumbing.com` signed by `1stcontact.io` fails. Beyond correctness this
is reputation *isolation*: on a pooled sending identity, one bad customer sets the
floor for every other customer.

**Which makes a domain a precondition for outbound.** A business on a bare
`@gmail.com` address cannot be a properly authenticated sender at all. That is an
onboarding requirement, not an email feature.

**There is no `isTransactional` flag anywhere.** Any boolean is a thing somebody
eventually flips. Instead, two genuinely different functions: a transactional path
taking a system-template enum and a reference to a *live obligation* — and **taking
no body** — and a broadcast path that takes composed content and cannot bypass
suppression. Misclassification becomes structurally impossible rather than policed.

**Three suppression tiers, not one:**

| Event | Effect |
| --- | --- |
| Unsubscribe | Marketing suppressed. Transactional continues. |
| Spam complaint | Everything automated suppressed. |
| Hard bounce | Everything suppressed. |

**A complaint stops the robot, not the human.** Automated sequences halt on
complaint with no override. A person composing one message to one contact about one
debt is correspondence, not bulk mail — allowed, with a plain warning that it likely
will not be delivered. Unsubscribing from a newsletter never stops an invoice.

**Service reminders get their own category.** The pressure to misclassify comes from
a real third case — "your annual boiler service is due" — that is genuinely useful,
feels transactional to the business, and is legally marketing. Give the legitimate
need a proper channel and nobody goes hunting for a loophole.

**Import is gated on evidence and ramping, not attestation.** Alice's real list and
a purchased list arrive as the same file; provenance is not in the artifact. The
readable signals are role-address density, the bounce-to-*complaint* ratio (an old
genuine list bounces high and complains low — bounce rate alone would punish exactly
the customer we want), accompanying columns, plausibility against business size, and
account history. Pre-send validation is sold to the client as list cleaning, because
that is what it is.

**Functional monitoring and placement measurement are different jobs with opposite
disciplines.** The functional bot engages hard — opens, clicks, rescues from spam —
because a healthy account is a reliable canary, and placement failure *despite* that
engagement is a high-specificity alarm. Measurement seeds must never engage with our
own sends, or the measurement becomes circular; read them with IMAP `BODY.PEEK[]`,
which yields folder placement without setting `\Seen`.

**Google Postmaster Tools will return nothing for most customers.** It suppresses
data below a daily-volume threshold our market will never reach, and per-domain
sending guarantees no single customer aggregates into visibility. **DMARC aggregate
reports (`rua=`) are the low-volume sender's instrument** — they work at any volume,
report authentication results from every major receiver, and we can publish the
record automatically at provision because we hold the zone.

**Placement testing is event-triggered per customer, not continuous.** Test sends are
unengaged volume, and against a sender doing 200 messages a month they would degrade
the reputation being measured. Weekly while new, monthly once established, plus
on-demand debug send, plus triggers on first send to an imported list and on a
complaint or bounce alarm.

## Gaps worth naming

1. **Threading.** Replies must join to the thread they answer, via `Message-Id`,
   `In-Reply-To` and `References`. Without it the activity log is a heap of
   disconnected messages rather than a conversation, and the epic's whole claim fails.
2. **Attachments.** Inbound mail carries them. Size limits, scanning, retention, and
   whether they belong in the Library.
3. **Erasure reaches message bodies.** [[DOC-37]] treats erasure as identity
   severance; capturing correspondence means holding a third party's words, where the
   business is controller and we are processor. Retention policy is also a cost
   decision, not only a legal one.
4. **Consent surface at import.** The UK soft opt-in covers existing customers for
   *similar* goods and services with an opt-out offered at collection and since.
   Telling the client the rule at the moment of import is cheap and genuinely helps.
   Needs review by someone qualified.
5. **Fan-out is not a shared inbox.** Forwarding `support@` to three people produces
   three copies with no shared state and the classic everyone-assumed-someone-else
   failure. We see all three copies and every reply, so "Dave replied 20 minutes ago"
   falls out of the record nearly free — but only if designed for.
6. **Abuse and open-relay safety.** Destination verification is the control that stops
   us forwarding to arbitrary addresses; a catch-all on a real domain will attract
   volume; forwarding needs rate limits.
7. **Sender identity within a business.** If Alice has staff, which human does a
   broadcast come from, and what happens to replies.
8. **Cost model.** Per-message ESP cost, body storage, placement-test subscription,
   per-address list validation. What is included, what is metered.
9. **Bulk-sender compliance is pass/fail.** One-click unsubscribe (RFC 8058
   `List-Unsubscribe-Post`) on broadcast and *not* on transactional, aligned
   SPF/DKIM/DMARC, complaint rate under 0.3%.
10. **Do not allowlist our senders** in any monitoring mailbox's admin console. It is
    the natural 2am reflex when a monitor's mail starts going to spam, and it silently
    destroys the only placement signal the system has.

## Boundaries

- **Writing DNS records** → [[EPIC-5]]. This epic knows which records a sending
  domain needs and whether they are correct; it does not own the zone editor.
- **Reading live DNS** → `resolver.ts` ([[REQ-257]]) already does it.
- **The contact timeline and session rollup** → [[EPIC-11]]. Captured mail is a new
  event kind on a spine that epic owns.
- **Contact identity and merge** → [[DOC-44]]. Matching an inbound address to a
  contact uses that model; it does not invent a second one.
- **BFM execution** → its own epic. This one owns only the synthetic contract.
- **Billing for metered email** → the billing epic.

## Open questions

1. **One tab or two, and where is the seam?** The client's instinct is two,
   simplifying later. The candidate seam is configure-once versus work-daily rather
   than in versus out — which would put addresses, forwarding and DNS health in
   Settings where the precedent already lives ([[EPIC-4]]), and leave one new tab for
   reading the conversation and running campaigns. Decide before any surface is built.
2. **Where does a message body live?** [[EPIC-11]] commits the spine to milestones.
   An event pointing at a body in R2 keeps that promise; a body on the spine breaks
   it. Also decides retention and erasure mechanics.
3. **Which domains are safe to take MX for?** `resolver.ts` can tell us whether a
   domain already carries live mail. The policy on top of it — refuse, warn, or guide
   a migration — is unwritten, and it is the difference between a pure upgrade and the
   catastrophic case.
4. **Do we offer a sending subdomain for domainless businesses**, accepting pooled
   reputation, or require a domain for outbound?
5. **What does capture do about spam** arriving at a published address? Forwarded
   regardless — but recorded, discarded, or quarantined pending a human look?
6. **Is OAuth mailbox sync ever in scope?** It is the only route to complete capture
   and retroactive history, and it costs an annual third-party security assessment for
   Google's restricted scopes plus ingesting the client's personal mail. Out of scope
   for now; recorded so it is a decision rather than an oversight.


## Decisions taken since drafting ([[CHAT-54]])

These resolve Open Questions 1 and 2. The questions are left standing above so the
reasoning that produced the answers stays legible.

### OQ1 — resolved: the seam is configure-once vs work-daily

**Email configuration goes into Settings, not into a tab of its own.** Addresses,
forwarding rules, catch-all, authentication and DNS health, and send-as setup status
are all written once and read many times — which is exactly what [[EPIC-4]] built
Settings to be: *"a record-and-status surface, not a workshop."* A second tab holding
configuration would duplicate that surface rather than extend it.

**The per-contact conversation stays on the contact.** The client's requirement is
that captured mail is *"visible on contact page"* and on the activity log, which is
the People tab and [[EPIC-11]]'s timeline. It is not a new location.

**One new tab, for the cross-contact work**: lists, composition, sending, ramping and
scheduling, with deliverability as a panel inside it rather than a surface of its own.

**Which may make the second tab unnecessary sooner than expected.** With
configuration in Settings and per-contact history on the contact, what is left in the
new tab is substantially *campaigns* — and a unified cross-contact inbox is a
hypothesis about how a one-van business works, not a known requirement. This is the
simplification the client anticipated ("simplify if we can later"), and it may arrive
before the first tab is built rather than after. Do not build a unified inbox until
someone asks for one.

### OQ2 — resolved: a message body is a ticket; the event records the envelope

**The body lives in the product ticket store** (`apps/control-app/src/tickets.ts`,
[[REQ-162]], [[DOC-38]] §6) — the same store that already holds the client's uploads,
captures, briefs and conversations. **`contact_events` records the milestone only**:
header fields, body size, whether attachments are present, and the ticket it points
at. That keeps [[EPIC-11]]'s promise that the spine stays *"milestones, not noise"*
and keeps the immutable table small.

**Why this store is the right one, verified:**

- **Tenancy is structural, not remembered.** `forTenant` returns a handle carrying
  `WHERE tenant_id = ?` on every read and stamping it on every write, and the handle
  is terminal — `forTenant` on it throws. Correspondence is the most confidential
  thing the product will ever hold, and this is the one store where *"no call site is
  trusted to remember the tenant, because no call site is given the chance to forget
  it."*
- **Attachments are already first-class**, as `ATTACHMENT_SCHEMA` records against a
  ticket with blobs in `R2BlobStore` — and deliberately **not** in the
  `1stcontact-sites` bucket, because that one is bound by the Worker serving the
  public internet and attachments are confidential client material. An email
  attachment needs exactly that property and would otherwise need it invented.
- **The bundle precedent is MIME multipart.** The `reference` type is documented as
  *"N attachment records on one ticket, one per member, each with `meta.member`
  naming its role."* A message with three attachments and two inline images is the
  same shape, and addressing is content-derived — so the same document forwarded
  around a thread dedups to one blob without anyone arranging it.
- **Retrieval comes free.** `knowledge.ts` embeds tickets, so "what did we agree with
  this customer about the boiler" becomes answerable by the assistant as a
  consequence of the storage decision rather than a feature built on top.

**What this decision obliges, and none of it is automatic:**

1. **A message ticket must be write-once.** The spine is immutable by database
   trigger; the ticket store is not — tickets carry `version` and `updated_at` and
   are meant to change. A record of what was actually said must not. This is a schema
   and enforcement requirement, not an inherited property.
2. **KB corpus membership is an explicit decision.** Every ticket being embeddable
   does not mean every message should be embedded — that is per-message Workers AI
   cost and it would swamp a corpus currently made of briefs and material. Default
   out; opt in deliberately.
3. **Threading maps to ticket-plus-comments.** A thread is the ticket, each message a
   comment on it, following the existing `chat_transcript` comment precedent. The
   contact event then points at the thread *and* the specific comment, which is more
   useful than pointing at a bare message.
4. **Volume.** This store was sized for uploads, captures, briefs and chats. It is
   about to take every message every business sends and receives. D1 row counts and
   index behaviour under that load are an open engineering question, not a blocker.
5. **Erasure must reach the blobs.** [[DOC-37]]'s identity severance gets easier with
   a tenant-scoped terminal handle, but deleting ticket rows while attachment blobs
   survive in R2 would be erasure that reads correct and is not.
6. **The synthetic marker applies here too.** Message tickets carry it and every
   ticket query filters it by default, exactly as for the spine.


## The Campaigns surface, and its objects ([[CHAT-54]])

### Correction: one entity, several representations

An earlier draft of the list decision confused the data structure with where it is
drawn. Corrected by the client: *"we have one set of email lists and we decide where
they are represented, contacts or Campaigns or both."* There is **one list entity**.
Placement is a separate and later decision, and the answer may legitimately be both.

### Three ticket types, and one that must not be

**A campaign is a ticket. A list is a ticket. A content email is a ticket.**

This is not a new pattern here — `apps/control-app/src/templates.ts` ([[REQ-197]])
already establishes it in terms this epic simply inherits: *"A MESSAGE BODY IS
CONTENT, AND CONTENT IS A TICKET… this repository already has exactly one place
where that is true of anything: the tenant's own ticket store."* It also records why
it lives in the tenant store rather than the platform's — nothing in that file knows
which business it serves, so *"the same code gives a customer their own templates for
their own contacts with no second path and no platform-only branch."* [[DOC-40]]
§2.1 rule 1 names the alternative — a capability built only for the platform — as
the failure mode.

The decomposition is campaign = **content × list × schedule**, plus the record of
what happened. Each part is separable because each is reused independently: one list
receives many campaigns, one content may be sent to more than one list or tested
against another.

**`template` and campaign content are different types, deliberately.** The existing
`template` type is *keyed* — `TemplateKey`, newest-ticket-wins — because a platform
message like the invite or the lapse notice is a role that gets re-filled. A
marketing email is not a role; it is a specific thing said once, referenced by uid
from the campaign that sent it. Same principle, different lifecycle, so a new type.

**But `template`'s key convention is the precedent for immutability**, and it is a
better one than a lock: *"replacing a template is writing a new ticket rather than
editing a live one in place… the record of what was sent last month still points at
the ticket that said it."* Campaign content follows the same rule — edit produces a
new ticket, and a sent campaign keeps pointing at the bytes that actually went out.

**Per-recipient sends are NOT tickets.** A campaign to 800 people is one campaign
ticket, one content ticket, and 800 events on the `contact_events` spine. Making
each send a ticket would multiply the store by the size of every list for no gain —
the per-recipient facts are milestones, which is what the spine is for.

**Which yields the rule for where a body lives:** a **broadcast** send references
shared content, so the contact's event points at the campaign's content ticket. A
**one-to-one** message — transactional, or a human writing to one person — owns its
body, so it gets its own message ticket. Both end up on the timeline; only the second
duplicates bytes, and only because those bytes are genuinely unique.

### The surface: the 1+2 pane pattern

The tab uses the established `[item list][detail][chat associated with detail]`
pattern (the Intent tab in xgd), for which a reusable framework implementation is
being built. The item list switches between **Lists / Content / Campaigns**.

**The chat pane is the AI panel** this epic asked for in scope item 4 — not a
separate surface. Scoped to the selected ticket, it is the copywriter on a content
ticket, the audience advisor on a list, and the deliverability diagnostician on a
campaign. Standing authentication and DNS health remain in Settings; per-send
diagnosis belongs to the campaign it is about.

### Where lists are represented

One entity, three possible representations, and only the first is needed now:

1. **Campaigns** — the list as an object: membership, rules, consent state, and the
   size *after suppression*, which is the only count that predicts what will happen.
   Build this.
2. **Contacts — "save this selection as a list."** The client's observation is that
   *"the contacts page has the right UI for creating a list"*, and it does: you are
   already looking at contacts, filtering them, choosing. But that is an **action**
   that mints a list ticket, not a second representation of the entity. Later.
3. **The contact detail — "which lists is this person on."** A field, the cheapest of
   the three. Later.

Note that the first lists will mostly not be hand-built: an import creates one, and
contact state supplies the obvious others. Rich selection UI can wait for (2).

### Inbound from an unknown sender

Owned by this epic, landing on the Contacts tab: a pending/unidentified state in the
contact list rather than a mail surface, where triage is promote-to-contact or
discard. **Discard must be sticky** — a decision that does not persist re-surfaces
the same sender every day and trains the client to ignore the queue.

### Open

- **Personalisation and the record.** If content carries merge fields, each recipient
  received slightly different text. Does the record show what was actually received,
  or the content plus the merge values, rendered on read? The second is far cheaper
  and is probably right, but it is a decision about what the record *means*.
- **Is visual styling its own ticket?** The client wants AI styling as a template,
  reusable across content. That is plausibly a per-business ticket in the `template`
  key-resolved style rather than a field on each content.


---

## The cutover mail gap, and the ordering that closes it ([[EPIC-5]], 2026-09-16)

Settled with the operator while scoping [[EPIC-5]]'s nameserver-change flow.
**This epic now owns a seam neither epic owned before**, and records an ordering
expectation for when it is built. **It is not a dependency and nothing here blocks
[[EPIC-5]]** — that flow ships without it.

### The gap

[[EPIC-5]]'s flow moves a customer's nameservers to us. **That breaks their
existing email**, and it cannot not break it: a `secureserver.net` `MX` copied
forward points at a service that stops honouring the domain once its nameservers
move, and the forwarding destinations behind it are private configuration inside
the old provider's account — not discoverable from DNS at any price.

So [[EPIC-5]]'s acceptance bar has been rewritten to match reality:

> **Moving a customer's DNS to us breaks their existing email. They are told so, by
> name, before they act — and it is reconfigured with their help before anyone
> notices.**

That epic owns the first half — detecting the incumbent provider from
`resolver.ts`'s snapshot and naming it in the warning before the paste. **The
second half is this epic's**, and was previously written down nowhere:
[[EPIC-5]]'s Boundaries never mentioned email reconfiguration and this epic's
Boundaries only hand DNS writes the other way.

### The ordering, for when this is built

**Configure the customer's email here first, so that mail comes up as control
transfers rather than after it.** The operator's framing: *"we can actually do our
email configuration first so that as soon as we have control we can have their
email fixed — that is probably the correct ordering."*

The window already exists and is free. [[EPIC-5]]'s pre-cutover sequence creates
the Cloudflare zone in `pending` and populates it **before** the nameserver pair is
ever shown, so there is an interval in which the zone is ours and fully written
while nothing yet resolves from it. Email Routing configuration, the addresses and
the forwarding destinations belong **in that window**:

1. zone created `pending`, swept, web records written — [[EPIC-5]]
2. **the customer is asked who their email should go to, and Routing is configured
   in the pending zone** — this epic
3. the nameserver pair is shown and pasted — [[EPIC-5]]
4. mail resolves to our pipeline at the moment the delegation flips

**Step 2 is the ordering claim, and it is what turns the gap from *however long it
takes somebody to come back and finish* into minutes.** Retrofitting it later is
strictly harder than leaving room for it now, which is why it is recorded before
anything is built.

**Send-as is not in that window and does not need to be.** Configuring Gmail to
*send from* the forwarded address needs working SMTP credentials and a confirmation
round-trip — already named above as the most fragile step in this epic. Mail
arriving is the urgent half; replying from the right address can follow, and the
customer is not cut off while it does.

### The one question that must be asked, and why it is allowed

Forwarding destinations are undiscoverable, so **the customer has to tell us where
their email should go.** That is the single genuinely unanswerable-from-outside
fact in the whole flow.

It does not violate [[EPIC-5]]'s rule against questions a customer cannot answer,
because that rule bans asking them to **validate** — *"is this MX correct?"* — and
not asking them what they know. *"Who should your email go to?"* is a question a
furniture restorer can answer, and there is no other source for it.

### Until this is built

[[EPIC-5]]'s flow warns and proceeds. The customer is told by provider name that
their mail will stop, and some will choose to schedule the move rather than do it
now — **which is the correct outcome, not a failure of the flow.**


---

## The forwarding test: a real message, on the test rails, confirmed by a human

Operator, 2026-09-16, recorded so it is not lost. **Configuring forwarding and
believing it works are different things**, and the gap between them is where a
business silently stops receiving enquiries.

So: **send a test email to the address under test, let it travel the whole
forwarding path, and let the customer confirm they received it — with a button in
the message itself.**

### Why a human click and not a delivery event

We already receive `email.delivered` from the provider (`email-webhook.ts`,
[[REQ-198]]). **It is not sufficient here and the difference is the whole point.**
A delivery event proves the message reached the forwarding destination's mail
server. It proves nothing about whether it reached the human:

- foldered as spam — invisible to every signal we hold;
- accepted by the destination MTA and then dropped by a downstream rule;
- forwarded to an address that no longer belongs to anyone who reads it.

**The click is the only evidence that crosses the last hop.** Everything else stops
at a server. That is why the confirmation is a button in the message rather than an
inference from a webhook, and it is why the test is worth building at all rather
than trusting configuration.

### It rides the rails in §5, and is their first consumer

Every bullet of the BFM contract applies unchanged — the signed synthetic marker,
`synthetic` on every write, default-filtered reads, the reserved address namespace,
and the full real code path with no short-circuit. **This is the first concrete
thing that needs that contract**, which makes it a useful check on it: if the
forwarding test cannot be expressed in those five rules, the rules are wrong and it
is cheaper to find out here than after the BFM epic is built.

Consequences, stated so nobody has to re-derive them:

- **It does not appear in the contact list**, on any activity log, in campaign
  statistics, or in any customer-visible count. It creates no contact and no
  contact event.
- **It does not count as a send** for reputation, metering or billing.
- **It runs the real pipeline.** A test that took a shortcut past Email Routing or
  past the Email Worker would be testing something other than the thing being
  configured.

### One place it inverts the contract, and the BFM epic needs to know

§5 says *"customer notifications are suppressed for synthetic traffic — a daily bot
enquiry must never reach the business."* **Here the business is deliberately the
recipient**: the entire purpose is for a human at that address to see the message
and press a button.

That contract was written for **platform-initiated** synthetic traffic on a
schedule. This is **customer-initiated** synthetic traffic, and it is the one class
that must reach a person. The suppression rule therefore needs a narrow, explicit
exception keyed on the initiator — not a general softening, which would let a bot
enquiry through the same hole.

**The initiator is the distinction to build in**, and it should exist in the marker
rather than being inferred later.

### Three states, and *no answer* is not *failed*

`sent` → `confirmed` → and, crucially, **`no answer yet`**, which is a third state
and not a failure. A customer who has not looked at their email for two hours has
told us nothing. Rendering that as a red failure trains everyone to ignore the
indicator, and the indicator is the product here.

A real failure is only: the provider rejected it, or it bounced. Silence is
silence, and it says so.

### The button is a token, and the mechanism already exists

The recipient may be signed out, on a phone, on a device that has never seen this
product. So the link carries its own authority — the same shape as [[REQ-244]]'s
gated download (`GET /api/download/<token>` reaching `AssetGate` over a service
binding, with no URL into the tenant). **Reuse that mechanism; a second
token-bearing public endpoint is a second thing to get wrong.**

### One hazard to guard

The test is sent **to** the address being configured, so it enters our own `MX`,
runs the Email Worker, and is forwarded back out to the customer's real mailbox.
That round trip is exactly what makes it a real test — **and a forwarding
destination that points back at the same domain is a mail loop.** It needs a hop
guard, and the configuration surface should refuse that destination outright
rather than discovering it at send time.

### Open

**One button or two?** *"I got it"* is the minimum. *"I found it in spam"* is the
other outcome worth distinguishing, because spam-foldering is both common and
invisible to us — and it is a deliverability finding ([[EPIC-13]] §4) that no other
signal we hold can produce. Two buttons cost nothing in the message and turn a
binary into a diagnosis. Not decided.


## Vocabulary, and the campaign as a single send ([[CHAT-54]], 2026-09-16)

The client opened this: *"We are using the term email and the associated ticket type
for an actual email sent to a user. We are proposing to use the word campaign to
describe an outgoing email sent to many users."* Then the question that forces the
issue: *"is a campaign a single message? Or is it multiple messages to the same group
of users, perhaps over time? If it's the latter then we need another word for the
message because I don't want to overload email which seems to have been appropriate
already."*

### Four words, and one reserved

**A campaign is a single send of a single message to a single list.** Not a
programme of messages, and not an umbrella over several sends.

| word | what it names |
|---|---|
| **list** | the audience |
| **content** | the composed message — the bytes themselves |
| **campaign** | one send: content × list × schedule |
| **email** | one actual message to one person |

**This is also what the tools our customers came from mean.** Mailchimp and Klaviyo
both use *campaign* for a single send and reserve a different word for the series;
HubSpot is the outlier that makes campaign the umbrella. A small business's intuition
for the word was formed by the first two, so we follow them.

**`email` is not at risk of overload, because the model already prevents it.**
Per-recipient sends are not tickets: a campaign to 800 people is one campaign, one
list, and 800 events on the `contact_events` spine — **zero `email` tickets**. An
`email` ticket exists only where a message owns its own body, which means one-to-one
and transactional. The term keeps the meaning it already had.

**`sequence` is reserved, and deliberately unbuilt.** When multiple messages go to
the same list over time, that is a `sequence` — an ordered set of campaigns with
relative timing. Naming it now is not a commitment to build it; it is so that nobody
reaches for *campaign* to describe it and collapses the distinction that makes
campaign mean one thing. *flow* and *journey* were the alternatives and say less.

### Correction: the three-type decomposition rested on the other meaning of "campaign"

§"Three ticket types, and one that must not be" above separates `content` from
`campaign` as distinct ticket types. **That separation is withdrawn**, and the reason
matters more than the outcome: it was not a different judgement about the same
question, it was the answer to a different question. The client: *"when I said that I
was thinking that a campaign was a sequence of email sends, not one."*

Under that reading the separation was correct and near-forced — a programme of sends
obviously cannot keep one body in its own body, and the content each send reaches for
has to live somewhere addressable. Under **campaign = one send**, the premise is gone
and so is the entity. There is no second thing for a content ticket to be separate
*from*.

**So: two ticket types, not three.** A campaign ticket's **body is the message
content** — the markdown the operator composed. Its fields carry the list reference,
the schedule, the pinned template, the lifecycle state and the send outcome. The
surface's item list is **Lists / Campaigns**, not Lists / Content / Campaigns.

**The immutability argument survives intact.** §"Three ticket types" grounded the
separate content type in the `template` precedent — *"edit produces a new ticket, and
a sent campaign keeps pointing at the bytes that actually went out."* Freezing the
campaign body preserves that property exactly, with one entity fewer, one hop fewer
from the contact event to the bytes, and one lock instead of two. Reuse of one body
across sends becomes **duplicate-as-draft**, which is what the client described:
*"it can be copied for another email blast."*

### The lifecycle, and where the freeze falls

**`draft → scheduled → sending → sent`**, plus `paused`, `cancelled` and `failed`.
The client's framing: *"once the send is triggered the campaign would move into a
different state… The sending could take a while particularly if it is a new list or a
large list, that's fine. But my point is that once it is out of draft mode the
content is frozen. And then becomes a historical record."*

**The freeze falls at the exit from draft, and the reason is stronger than the
record.** `sending` is a long state by design — scope item 3 above asks for ramping
and an 8am floor, so slowness is a feature, not a degradation. Which means an edit
during `sending` would not merely rewrite history; it would send recipients 401–800 a
**different message** from the one recipients 1–400 received, with nothing in the
system recording that two different things went out under one name. Freeze at the
draft boundary and that is structurally impossible.

**This is the one place the campaign rule must differ from [[REQ-263]], and the
difference must be written at the declaration.** REQ-263 freezes an `email` from
create *with no `when`*, because the record is written before the provider is called
and no legitimate editing window exists. A campaign has exactly such a window — the
draft, where the copywriter in the chat pane is the whole point. So the campaign rule
carries `when: "fields.status != draft"`, which is the shape REQ-263 examined and
deliberately rejected for its own type. Same mechanism ([[REQ-160]] in
`@lagrangefoundry/ticketing`), different predicate, for a reason that must be recorded
or someone will later "fix" the inconsistency.

### What freezing the body does not cover, and six constraints it implies

The simplification is sound — it is close to what Mailchimp and Klaviyo actually do,
so it is a well-trodden model rather than a novel one. But *content* is only one of
the three things a campaign is made of, and freezing it leaves the other two open.

1. **The audience must be snapshotted too, and it is not the same as freezing it.**
   A list is a living entity — people join and leave while a send is running. If the
   campaign resolves its recipients lazily, *"who did we send this to"* is
   unanswerable a month later and a resume after failure cannot know where it got to.
   So the draft→sending transition **resolves the list to a recipient set and records
   it**, after suppression, and that set is what the send walks.
2. **But suppression stays live, and this is the exception that must not be tidied
   away.** If someone unsubscribes twenty minutes into an 800-person send they must
   not receive it — so suppression is re-checked **per recipient at the moment of
   sending**, against the frozen set. Snapshot the audience; never snapshot consent.
   §"Outgoing" above makes this the hard rule it derives from: no broadcast path may
   bypass the suppression check.
3. **Cancel is a first-class state, not a failure.** The operator who spots a typo or
   the wrong list at recipient 50 must be able to stop the send. `cancelled` is a
   legitimate terminal state that records how far it got; modelling it as `failed`
   would make an intentional act read as an incident, which is exactly the confusion
   the BFM hooks in §5 exist to avoid.
4. **`sent` means accepted, not delivered.** The lifecycle ends when the provider has
   accepted every recipient. Delivery, bounce and complaint arrive later, per
   recipient, by webhook, and land on the `contact_events` spine — per §OQ2, not on
   the campaign. The campaign may aggregate them for display; it must not be the
   record of them.
5. **A test send must not move the lifecycle.** *"Send this to me first"* is what
   every operator does before a blast, and it is not a send of the campaign. It
   leaves the campaign in `draft`, writes no contact events, and is the one path that
   renders frozen-able content without freezing it.
6. **Resume must not double-send.** A long ramped send will be interrupted —
   deployment, Worker eviction, provider outage. Resuming safely needs a progress
   cursor over the frozen, ordered recipient set, and per §OQ2 the per-recipient
   facts live on the spine rather than in tickets. That is a hard engineering
   constraint on the send path, and it is only satisfiable *because* the recipient
   set is frozen — constraint 1 is what makes it possible.

**And one note on duplicate-as-draft:** it copies the body and the template
reference. It does **not** copy the list, the schedule, the recipient snapshot or the
outcome. Copying any of those would make the new campaign a claim about a send that
never happened.



### The template is the other half of the content, and it stays separate

The client: *"there is in my mind two aspects to the content of our campaign. There
is the message content… But then there is also the associated styling and boiler
plate. By which I mean logo, a copyright notice, terms and conditions, unsubscribe,
all the things that a professional email needs, and of course the HTML styling that
goes around it. All of that is a template and I think it's appropriate that the
templates and the message body are kept separate."*

**Agreed.** A campaign's rendered output is **body × template**: the operator's
markdown inside the business's chrome. The two are edited by different people at
different rhythms — the copy changes every send, the chrome changes when the brand
does — and that is why they are separate objects rather than two fields of one.

### The template is identified by its ticket, and the operator chooses it

**There is no key, no newest-wins resolution and no version chain.** An earlier draft
of this section carried [[REQ-197]]'s `TemplateKey` convention over to campaign
styling, and the client removed it: *"no key, the key is the ticket number the user
changes it, they EXPLICITLY CHOOSE which template they want… User is in control —
don't confuse them with hidden keys and versions."*

The worked example is the specification:

> template-125 is chosen by the user to be associated with campaign-2551 which is
> sent on July 12 2027
> template-125 (unchanged) chosen by the user to be associated with campaign-2583
> which is sent on July 28 2027
>
> Users site undergoes an upgrade, logo is changed. User cannot edit template-125
> they hit [Make a copy] to create template-132
>
> template-132 chosen by the user to be associated with campaign-2653 which is sent
> on Aug 7 2027

**Three things this fixes in what was written above.**

1. **The campaign holds a template's ticket id from the moment the operator picks
   it.** Nothing is resolved later. The earlier claim that a draft holds a key which
   resolves to a uid at the draft boundary is withdrawn — the reference was never in
   doubt, so the draft boundary settles **three** things, not four: the body freezes,
   the list resolves to a recipient set, and the template latches to `used`.
2. **Frozen is not retired.** July 28's campaign uses template-125 *after* it froze.
   A `used` template stays fully selectable in the picker forever; the latch blocks
   **editing**, never **reuse**. This needs saying because "frozen" reads as
   "archived" to whoever builds that picker, and the example depends on it not being.
3. **"Set up your brand once" is not a mechanism, it is the operator choosing.** The
   propagation argued for earlier — correct the logo and future campaigns pick it up
   — was solving a problem the client does not have, and the propagation *was* the
   hidden behaviour rather than something paid for by it. When the brand changes the
   operator copies once and picks the copy from then on.

### Preview and test send are two different tools, and both are required

The client: *"We obviously need a Preview that will allow the user to see the styled
message before they hit send. We probably need a test message so they can actually
send an email to themselves and see what it looks like in gmail."*

They answer different questions and neither substitutes for the other. **Preview
shows our rendering; a test send shows Gmail's**, and Gmail, Outlook and Apple Mail
each rewrite HTML in ways no preview can predict. That is why every tool in the
category has both.

**One renderer, and no preview-only path.** Preview must run the exact same render as
the real send or it is a lie in the one place a lie is most expensive. Note also that
**previewing a *sent* campaign is the same operation** — it is how the historical
record is read back — which is what makes the reconstructibility obligation stated
below testable rather than aspirational.

Per §"six constraints" item 5, a test send leaves the campaign in `draft`, writes no
contact events, and renders freezable content without freezing it.

### What per-recipient substitution does to "frozen" and "reconstructible"

**The unsubscribe link cannot live in the frozen bytes.** It is template boilerplate,
but it carries a token identifying *which* recipient is unsubscribing, so it is
resolved per recipient at send time — as is every personalisation merge field.

**Which requires stating the obligation this creates, and then its limit.** Because a
broadcast writes no per-recipient ticket, nothing stores the bytes that reached any
individual — so what went out must be **reconstructible** from the frozen body plus
the chosen template, which makes deterministic rendering a requirement rather than a
convenience. And the limit: a sent campaign reconstructs to the message **modulo
per-recipient substitution**, not byte for byte. Stated plainly because the
unqualified claim is false, and a record whose guarantee is overstated is worse than
one whose limits are written down.

**And the unsubscribe mechanism is not the template author's option.** The send path
refuses a broadcast whose rendered output carries no unsubscribe affordance, matching
the `List-Unsubscribe` header rule in §"Decisions taken in [[CHAT-54]]" — header and
body are two expressions of one requirement. A broadcast without it is a compliance
failure and a deliverability one, and §"Outgoing"'s rule that no broadcast path may
bypass suppression is the same principle applied one step earlier.



### The template's own lifecycle: a latch, not a lifecycle

The client: *"the template should go through the same lifecycle as the campaign, they
are joined at the hip. One template can serve multiple campaigns but once a template
has gone out it is frozen."*

**The preservation goal is accepted without qualification** — *"we want to see what
the user actually received, the actual logo that was used, the actual unsubscribe
statement."* What follows is only about which mechanism delivers it.

**A shared lifecycle is not available, and the client's own constraint is why.** One
template serves multiple campaigns. In the example above template-125 is `used` by
campaign-2551 from July 12 while campaign-2583 is still in draft. The template cannot
be `sent` and `draft` at once, and a shared object cannot share the lifecycle of each
of its several owners.

**So the template gets a one-way latch: `editable → used`.** It closes the first time
a campaign carrying it leaves draft, and never reopens. `sending` is meaningless for a
template. This is exactly *"once it has gone out it is frozen"*, without the
contradiction — and per the picker rule above, a latched template remains selectable.

### Copy-to-write: the refusal is explicit, and so is the copy

The client: *"we just need a mechanism to tell the user 'this cannot be edited, if you
want changes here is a CTA to make a copy'. This should be clear and explicit — what
we were discussing before sounded like there were automated versioning things going
on, that would be confusing."*

**The term is copy-to-write, and the correction is more than naming.**
*Copy-on-write* is a term of art for a mechanism whose defining property is that the
copy is **invisible** — the system performs it and the actor never learns it
happened. That invisibility is exactly what is being rejected. The earlier draft named
the mechanism by the one attribute the product must not have.

**So the write is refused, the refusal is shown, and the copy is a deliberate act.**
Editing a `used` template produces a real store refusal — [[REQ-160]]'s `immutable`
rule with `when: "fields.status != draft"` — surfaced as an explicit message and a
single **[Make a copy]** call to action. The copy is a **new, independent template
with its own ticket id**: template-132 is not a version of template-125, does not
supersede it, and changes nothing about any campaign. Nothing is intercepted,
repointed or resolved behind the operator's back.

**This is also the simpler build, which is why it wins on more than clarity.** The
rejected alternative needed that same lock *plus* a silent interception layer to catch
the refusal and transparently repoint the campaign in hand. Copy-to-write is the lock
and a message. One mechanism and one UI pattern, applied identically to a `used`
template and to a `sent` campaign — the client's earlier *"it can be copied for
another email blast"* is the same affordance on the other type.

**Which means the refusal must be legible everywhere a write can land**, not only in
the styling editor: the AI chat pane adjusting chrome, a bulk action, a `sent`
campaign opened from the contact timeline. Enforcement belongs in the store, and that
is the right place for it, but any surface that lets the raw store error through gives
the operator a stack trace where an explanation was intended.

### Freezing the template does not preserve the logo

The client named *"the actual logo that was used"*, and **the freeze does not deliver
it.** A logo is not bytes in the template; it is a URL to an image. Replace the file
at that address and every preserved campaign silently re-renders with the new logo —
the frozen HTML intact, and the claim it supports false.

1. **Template assets must be content-addressed.** The URL derives from the bytes, so
   a new logo is a new URL and the old one keeps resolving. §OQ2 already establishes
   the precedent for attachments — *"addressing is content-derived, so the same
   document forwarded around a thread dedups to one blob without anyone arranging
   it"* — and template assets are the same problem.
2. **An asset referenced by a pinned template can never be deleted, and this is worse
   than an archive problem.** Email images are hot-linked: the recipient's client
   fetches that logo *when the message is opened*, which may be a year later.
   Deleting an old asset does not merely break the record, it breaks mail already
   sitting in inboxes. This is a retention obligation on the blob store, and it has
   to be reconciled with [[DOC-37]]'s erasure path rather than discovered by it.

### A campaign style template is not [[REQ-197]]'s `template` type

Recorded as an inference from the client's identity rule rather than as something they
specified, because it follows from it and will otherwise be discovered late.

**The two have different identity models, and that is not a detail.** REQ-197's
`template` is keyed — `TemplateKey`, newest-ticket-wins — *because nobody chooses it*:
the platform reaches for "the invite template" and fills a role, with no human in the
loop to pick a ticket. A campaign style template is the opposite case by the client's
rule: it is chosen explicitly, by ticket id, by the operator, every time.

Different identity, different lifecycle (latched versus newest-wins), so **a distinct
type** rather than one type behaving two ways depending on which code path created the
row. This is the same reasoning §"Three ticket types" applied when it separated
campaign content from `template` — *"same principle, different lifecycle, so a new
type"* — and the original statement there about the existing `template` being keyed
remains true of the platform templates it was describing.

**This dissolves a dependency flagged earlier in this section.** An earlier draft
warned that latching `template` would extend a type with existing consumers and that
the claim needed verifying against REQ-197's call sites. With a distinct type, the
platform's invite and lapse notices are untouched and there is nothing to verify.



### This design supersedes [[REQ-197]]'s keyed resolution

The client: *"REQ-197 is wrong, we need to supersede it with this design."* Accepted,
with one distinction that decides how much of it goes.

**Verified state before deciding:** REQ-197 is coded and sits at
`ready_to_reconcile` with two working commits. `apps/control-app/src/templates.ts`
serves three system messages — `invite`, `signin`, `lapsed` — through
`templateFor(store, key)` with seed-if-absent, called from `invites.ts` (two sites)
and `sessions.ts` (one). Nothing is on main.

**Two separable things are bundled in it, and only one is wrong.**

1. **Role resolution** — `invite` resolves to *some* ticket. This is necessary and is
   not what the client objected to. A signin message fires for a tenant who has never
   opened the templates surface; there is no human present to choose a ticket id, and
   a new tenant has no templates at all. Something must answer *which ticket is this
   business's invite email*.
2. **Newest-ticket-wins as the resolution rule** — *"THE SENDER LOOKS A TEMPLATE UP
   BY TemplateKey, NEVER BY UID… the newest ticket carrying the key wins."* This is
   precisely the hidden versioning the client rejected: nobody points at anything, the
   winner is implicit, and it changes as a **side effect of creating a ticket**.

**So (2) is superseded and (1) is kept, in the form this section already
established: a role is a pointer the business sets, not a query that picks a
winner.**

- A system role is a **named slot** in the business's settings holding a template's
  ticket id — `invite → template-125`.
- Sending reads the slot. One answer, inspectable, with no dependence on creation
  order or clock skew between two tickets sharing a key.
- template-125 latches to `used` on first send and refuses edits. **[Make a copy]**
  yields template-132.
- The business then **explicitly repoints the slot**. The surface may offer it at the
  moment of the copy — *use template-132 for invites?* — but it is a choice, never a
  consequence. This is the whole of the client's rule applied to platform messages.
- **Seed-if-absent survives unchanged.** A new tenant's slot is empty; seeding mints
  the ticket and sets the slot. `ensureTemplates` keeps its job.

**This reverses the two-type recommendation recorded above.** §"A campaign style
template is not REQ-197's `template` type" split them *because* their identity models
differed — chosen-by-ticket versus keyed. Superseding newest-wins removes that
difference: both are chosen by ticket id, both latch on first send, both are copied
rather than edited. **So it is one type**, and the split loses its premise. The only
remaining difference is that a system message needs a named slot because no human is
present when it sends, and a campaign does not because the operator picks at
composition time.

### Timing: REQ-197's body must not be edited to carry this

**The change is cheap now and will not stay cheap.** Three call sites, no migration,
nothing on main — this is the least expensive moment this decision will ever have.

**But `ready_to_reconcile` is exactly the state in which that ticket's text is
committed to.** A reconcile cycle derives its technical design and capability matrix
from the body; rewriting it underneath produces a matrix describing a spec nobody can
now read, and nothing reports the discrepancy. That is the hazard framework
[[EPIC-3]] exists to prevent, and it applies here in full.

**And the client owns every cycle, which settles the route:** *"It has been built, we
need a new ticket to change it — simple as that. REQ-197 cannot be changed now."* So
the supersession is recorded **here**, in the epic that owns the design, and lands
through a **new ticket** that changes the built behaviour. REQ-197 is left exactly as
it is — not edited, not reopened, not pulled back.


## Scoping session, 2026-09-17: the web-builder completion cut

The client: *"I am focusing on the features that complete the web builder
functionality — this includes email configuration, inbound and outbound but not the
campaigns tab."* Plus the constraint on how it is broken up: *"I favor fewer tickets —
each ticket ideally has something that I can see working."*

**The cut lands on a seam this epic already drew.** §OQ1 put configuration in Settings
and left *"one new tab, for the cross-contact work"* which is substantially campaigns.
So "everything except the Campaigns tab" is not a new boundary; it is the one OQ1
isolated.

**No design doc covers this and none is needed.** [[DOC-46]] is *"What 1st Contact is,
and how to say it"* — positioning, not design. **This epic is the design record.**

### Verified against the code, and one claim in this epic corrected

**Outbound already records the body.** `apps/control-app/src/messages.ts` writes an
`email` ticket per send carrying the rendered message — *"THE BODY IS THE RENDERED
MESSAGE. The template changes; what we sent does not."* It is called from `lead.ts`
(form confirmations), `sessions.ts` (signin) and `invites.ts` (invite). §"What exists
today" says outbound exists and that delivery events land on the spine; it does not
say the **content** is already stored, and a reader could conclude it is not. It is.

**So path 1's remaining gaps are two, and neither is the record itself:** the
immutability lock ([[REQ-263]], blocked on framework [[REQ-160]]), and the synthetic
mark (below). Migration head is `0012_sending_domains.sql` and no `synthetic` column
exists yet, both as [[DOC-54]] §2.4 assumes.

### The three paths, and what is true of each

**1 — outbound from 1st Contact** (forms, transactions, notifications, campaigns).
Built for everything that exists today, per above. Campaigns are out of this cut.

**3 — inbound.** Nothing exists. The largest piece of new work in the cut.

**2 — outbound from the business's own mail client**, sent as their forwarded address.
**We cannot intercept it, and that is SMTP rather than a gap in our plumbing.** `MX`
governs inbound only; outbound routing is chosen by the sending client, so a message
Gmail sends never consults our DNS.

**But the reply half is captured for free**, which lowers the urgency considerably. A
customer replying to that message sends to the forwarded address, through our `MX`,
and lands on the contact. The contact log gets the customer's entire side of every
conversation regardless; what is missing is only the business's own sent copy.

### The capture address, and the correction to a flaw that was not one

The client's proposal: *"it doesn't matter what the actual address is — contact, info,
biz, system. The point is it gets an email into our system that we can then process.
We treat emails to this address specially, look at the addressees and add the email to
their contact logs… it is not reliable but is nice to have, some users will use it
religiously."*

**Accepted, and it is in this cut, at the end.** An earlier objection here — that such
an address would forward the business a copy of its own mail — was wrong. The address
is ours and we decide it does not forward. There is nothing else to it.

**One thing must be designed in from the start, or it becomes a migration:**

> **Direction is derived from the `From`, not from the pipe a message arrived
> through.**

A BCC'd capture is an **outbound** message arriving on the **inbound** path. A record
that infers *inbound means from a contact* files it backwards and makes the business a
contact of itself. And the filing target differs: ordinary inbound files to the
**sender**; a capture files to the **addressees**, so one message ticket produces N
contact events. Both are trivial with direction and filing-target as explicit fields,
and both are expensive without them. This is the accommodation the client asked for —
*"I don't want to build something that cannot accommodate it."*

**The other three ways to close path 2 are recorded as considered, not chosen:**
mailbox sync over the Gmail API or IMAP (what HubSpot and Streak do — reliable, large
privacy surface); custom SMTP submission so their send-as routes through us (**Workers
cannot accept SMTP — no TCP listen — so this needs infrastructure we do not have**);
and a Workspace admin routing rule BCC-ing all outbound (near-free, but Workspace only,
and consumer Gmail cannot auto-BCC).

### Settings, and the minimum configuration that makes cutover safe

The controls, with the two that are not ours marked:

| control | note |
|---|---|
| which domain | **[[EPIC-5]]'s selector** — not rebuilt here |
| forwarding table | N rows, local-part → one or more destinations; ~20 is the cap |
| destination verification | Cloudflare requires each destination to confirm by link |
| catch-all | on/off plus destination — see below |
| `noreply@` refused, `info@` discouraged | already decided above |
| send-as status | read-only; the setup subsystem stays deferred |
| record-vs-forward | we forward everything, we do not record everything |
| deliverability status | **deferred** — *"more of a campaigns consideration… that is where we will meet it head on"* |

**Destination verification is a real multi-step flow, and the machinery exists.** It
is the same shape as §"The button is a token, and the mechanism already exists".

**The minimum viable configuration is a primary forwarding address plus a catch-all**,
and that is what makes step 2 of the cutover window safe to complete. The client:
*"if the user's DNS already has email configured, we might suggest doing basic email
config before switching the DNS so that email is always up."* The ordering was already
recorded above; what is new is **what "configured enough to flip" means**, and this is
it.

**Which decides the catch-all default, against what §"Incoming" says.** That section
has *"catch-all optional and off by default"* — correct steady-state, because a
catch-all is a spam magnet. But at cutover it is precisely what stops mail being lost
to an address nobody remembered. **Catch-all defaults on through cutover**, with a
later prompt to turn it off once the real addresses are known. §"Incoming"'s default
applies to a green-field domain, not to a migrating one.

### What [[DOC-54]]'s gutter imposes on this cut

Four constraints, all structural rather than additive:

1. **Inbound email is a marker entry point on day one.** R1 requires the mark to reach
   *"any entry point — form post, inbound email, webhook"*. Not a retrofit.
2. **The mark must ride in the message.** §2.4's rule is *"in-flight mark where there
   is one, parent's mark where there is not, never a default of false"* — and an
   inbound message has no request context to carry one. The **reserved address
   namespace** this epic already specifies under §5 is what supplies it. Two
   requirements written independently turn out to be the same mechanism.
3. **Message tickets are already in scope of the mark.** §2.4 names `messages.ts` —
   `sendRecordedEmail` — as carrying `synthetic` in the ticket record, and migration
   `0013` covers four tables today. Inbound adds message tickets and contact events to
   what it must cover.
4. **[[DOC-54]] depends on a state this epic has not built.** Its forwarding test
   resolves by saying the test message *"lands where [[EPIC-13]] already sends
   unmatched inbound mail — a pending / unidentified state in the contact list rather
   than a mail surface."* **That state does not exist yet.** It is therefore not a
   nicety of the inbound work; [[EPIC-15]]'s design is resting on it.

### The shape: four tickets, each with something visible

Proposed, not cut. Ordered; 4 may follow at any distance.

1. **Inbound end-to-end.** Email Routing, the Email Worker, parse, message ticket,
   contact event, visible on the contact — plus **unmatched sender → pending /
   unidentified**, and the synthetic mark from the reserved namespace.
   *Visible: mail sent to the domain appears on the contact; mail from a stranger
   lands in pending.*
2. **Email configuration in Settings.** Forwarding table, destination verification,
   catch-all. *Visible: configure it, send, it forwards.*
3. **Cutover integration.** The ask, Routing written into the pending zone, the
   minimum-config floor. *Visible: run [[EPIC-5]]'s flow end to end and mail never
   drops.*
4. **The capture address.** Reserved, non-forwarding, filed to addressees.
   *Visible: BCC it and the sent message appears on every recipient's log.*

Outside the cut and small: the ticket superseding [[REQ-197]] (below), and
[[REQ-263]]'s lock, which is blocked on framework [[REQ-160]].

---

## Security notes ([[EPIC-17]])

Added from the [[EPIC-17]] threat-model pass. Each clause is spec language, not
commentary: a REQ under this epic is expected to trace a UAT to it.

### 1. Inbound mail is untrusted input, and `From` proves nothing

An SMTP sender is unauthenticated. Every capture and threading decision below
follows from that one fact, and the epic's existing §2 does not yet say it.

- **Inbound mail may never write a contact's consent state.** Consent changes
  come from a surface the contact authenticated to, or from an explicit
  acceptance event — never from the content or the claimed sender of a message.
  Without this, a spoofed `From` attributes an opt-in to a real person, and the
  record we keep as evidence becomes evidence of something that did not happen.
- **Attribution is a claim, recorded with its evidence.** A captured message
  carries the SPF/DKIM/DMARC alignment result *as evaluated at receipt*, on the
  event. An unaligned message is captured and shown as **unverified**; it is not
  silently threaded onto the contact as their words.
- **Address matching does not upgrade trust.** Resolving an address to a contact
  ([[DOC-44]]) says who the sender *claims* to be, and nothing more.

### 2. Inbound bodies are this product's first anonymous path into model context

[[EPIC-17]] §3.4 calls this AI-I6 and rates it the highest-value injection
channel the product will ever have: today only an invited client can put text in
front of the assistant; after this epic, anyone with an email address can.

- A captured body reaches an assistant **only inside an untrusted-content
  envelope** — marked as data, with the instruction that it is never to be
  obeyed — and that envelope must be proven by UAT before the first tool that
  reads mail is granted.
- **A tool that summarises correspondence is not a read-only capability.** It is
  an injection sink with whatever authority the session holds, so it is gated on
  §1's marking and on [[EPIC-17]] §5's confirmation seam, not on the tab
  shipping.

### 3. Forwarding is a relay, and a relay decides from configuration only

The epic's §6 has destination verification and rate limits; this adds the part
that closes the redirect: **a forwarding destination is read from configuration
and never from the message** — not from `Reply-To`, not from an address in the
body, not from a header a sender controls.

### 4. Key and credential custody

- **DKIM private keys are secrets** with a rotation story, held as
  `wrangler secret` and never in a repo file or a `[vars]` block.
- **Send-as SMTP credentials are the customer's, and we prefer never to hold
  them.** If the Gmail flow requires holding one, it is per-business,
  write-only, never logged, and never echoed into a chat — the register a
  credential leaks in ([[REQ-146]] AC4, `redact.ts`).

### 5. Reputation is a shared asset, and beta is when it is set

Every business sends through infrastructure the others share, so one abusive or
careless sender degrades deliverability for all of them ([[EPIC-17]] §1, A6).
Because reputation is established once and cannot be re-established, these are
**beta-time and not GA-time**:

- per-business send quotas from the first send;
- a complaint-rate circuit breaker that stops sending rather than degrading;
- no shared-IP send for a business that has not passed the deliverability gate.

### 6. Attachments inherit the upload rule

Bytes arriving by mail are bytes an anonymous party chose. They are never served
as a *document* from an origin that holds a session — [[EPIC-17]] F1, which
exists today on the upload path and would be re-opened here from the anonymous
side.

## The test gutter — this epic's share ([[DOC-54]])

**§5 of this epic is superseded by [[DOC-54]], which is now the normative statement of
the contract.** What §5 recorded was an early form, written before the mechanism was
designed against the code. Three things changed, and §5 should be read through them:

**1. The initiator class is withdrawn.** §5 carried an inversion — that a
customer-initiated test is synthetic traffic whose delivery to the business is the
point — and proposed keying an exception on the initiator. **Not needed.** The site
owner is not a contact of her own site; she is a contact of 1st Contact. A forwarding
test addressed *to* her business from a sender matching no contact lands where this
epic already sends unmatched inbound mail — the pending/unidentified state on the
Contacts tab — creating no contact, no timeline entry and no metric. There is nothing
to suppress and the rule never engages. Landing there is arguably the feature: seeing
the test arrive, having travelled the real path, is the end-to-end confidence the
confirmation button exists to give. It should be dismissible on confirmation, or the
queue accumulates one message per configuration change and becomes a queue nobody
reads.

The general rule that replaced the exception: **suppression keys on the record, not on
the traffic** — one rule in [[EPIC-14]]'s resolver instead of two classes in the marker.

**2. The marker carries a run id**, `newId('run')` ([[REQ-190]]'s minter, never a
second shorter format). Verification and collection are both *"the rows stamped
`run`"*; a boolean alone makes collection a time sweep and verification a guess. Where
an email envelope is the only channel — an inbound probe with no request to attach a
marker to — the reserved address carries it: `bfm+run_<hex>@…`, 40 characters against a
64-character local-part limit.

**3. Message bodies and attachments need the mark in two places.** The ticket record
carries the column; **R2 blobs carry it in the key as a reserved prefix**, not in object
metadata, because a bucket has no `WHERE` clause. A prefix makes the exclusion visible
in the key, makes the sweep a prefix listing, and makes an accidental exposure
greppable. Erasure must reach those blobs too, or it is erasure that reads correct and
is not.

**One obligation this epic should note now, since it is cheap only while unbuilt:** KB
corpus membership must default *out* for synthetic messages. This epic already requires
that for volume reasons; the gutter adds a second: a support answer citing a bot's
enquiry is a retrieval failure with no symptom.

**Ordering unchanged:** [[DOC-54]] is the contract, not a dependency. Nothing here waits
on it beyond carrying the column when the tables are written.