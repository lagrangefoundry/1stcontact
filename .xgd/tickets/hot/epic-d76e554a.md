---
uid: epic-d76e554a
id: EPIC-13
type: epic
title: 'Email: capture, send, and never break the business''s mail'
created_by: CHAT-54
created_at: '2026-09-16T19:20:31.585909+00:00'
updated_at: '2026-09-16T19:20:31.585909+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
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
