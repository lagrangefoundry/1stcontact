---
uid: epic-d76e554a
id: EPIC-13
type: epic
title: 'Email: capture, send, and never break the business''s mail'
created_by: CHAT-54
created_at: '2026-09-16T19:20:31.585909+00:00'
updated_at: '2026-09-17T03:17:44.871600+00:00'
completed_at: null
last_field_updated: status
status: underway
fields:
  priority: high
  chat_comment: comment-a687a6e5
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