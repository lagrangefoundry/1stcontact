---
uid: comment-60287e32
id: COMMENT-3016
type: comment
title: Comment on chat CHAT-54
created_by: xgd
created_at: '2026-09-16T03:41:11.059648+00:00'
updated_at: '2026-09-16T18:55:53.492528+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-3f06fa6a
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "69c2d3d5-5316-4508-b53d-63764ade0808",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="606b5568-da7b-470a-b41c-04f1eaa23058-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T03:40:32.410541+00:00" -->
#### You
I want to have a quick sidebar conversation about email receipt.

It is desirable for us to record all the communications between the small business and their contacts. Obviously it is easy for us to record all our outgoing communications, but what about incoming communications and replies. So, we could run a mailbox for the email. But I am nervous about that in most cases a small business site outage is easily spotted and not disastrous, but an email outage could be huge. I also feel like the more moving parts with an email server with a jamstack site. So long as Cloudflare stays up it is hard to imagine many things going wrong with site delivery. There are of course things that could go wrong with the user of being able to get access to their billing records or being able to register for the beta list I don't know I have more concerns about running an email server anyway.

So what I had in mind was that we would use the existing cloud capabilities to forward email to the chosen email provider. So, for example I have Martin@1stcontanct.io set up to send to my gmail account.

Then when the business sends out an email to a customer they CC a special collection address: e.g. contact@1stcontact.io

That comes into our system, we parse the headers figure out which contact it was sent to and record it...

Questions:
 - Are my fears of running a mailbox founded? Are there 3rd parties we coudl whitelabel to solve this for us? (email is a desirable capability if we can keep it lightweight?)
 - Does my workaround land?

<!-- xgd-turn id="606b5568-da7b-470a-b41c-04f1eaa23058-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T03:44:17.533142+00:00" -->
#### Claude
Useful context from the repo first: outbound already exists — `apps/control-app/src/mail.ts` is a sender port with Resend behind it, and `email-webhook.ts` already lands delivery/bounce events on the record. So "we send, and we know what happened to it" is built. The gap is genuinely the inbound half.

## 1. Are the fears founded?

Partly — but they're aimed at the wrong object. Three different things get conflated under "running a mailbox":

**Being the authoritative mailbox** (IMAP, storage, we are their email provider). Fear is **fully founded**. Never do this. Blast radius is total, the migration is the moment they churn, and the support burden is "where's my email" forever. It isn't our product.

**Running our own SMTP/MX server.** **Fully founded.** Nobody should do this in 2026.

**Being a forwarder in the inbound path** — MX points at a managed service, we see the message, we pass it on. **Much less scary than it feels**, for a reason worth internalising: SMTP is a store-and-forward protocol with retries built in. If our forwarder is down and returns a 4xx, the *sending* server queues and retries for several days. The business sees delayed mail, not lost mail. The catastrophic failures are specific and avoidable:

- **Accept-then-drop.** Returning 250 and then losing the message. This is the only true data-loss mode, and it's entirely ours to avoid.
- **MX pointing at nothing.** NXDOMAIN → hard bounce → the sender is told the business doesn't exist. This is a DNS mistake, not a runtime one.
- **Us filtering.** The moment we make delivery decisions (spam, greylisting, size) we've become a mail provider and we own false positives — the worst failure in email, because it's silent.
- **Breaking DKIM.** Forwarding rewrites nothing if you forward verbatim; modify the body (footer, re-encode MIME) and DKIM fails, DMARC fails, and the forward lands in spam. Non-obvious, easy to do by accident.

Two design rules fall straight out and they're the whole safety story:

> **Forward first, record second. Recording failure must never fail delivery.** (`await message.forward()`, then `ctx.waitUntil(record())`.)
>
> **Forward the bytes verbatim. Never filter, never modify, never hold.**

**The one genuinely risky thing on your roadmap isn't inbound at all — it's outbound lists.** Marketing email to a list a small business assembled is how you get a shared IP pool blocklisted and one customer's bad habits poisoning everyone else's deliverability. That deserves more of your anxiety budget than MX does.

### Third parties

You don't need to whitelabel anything — the capability is already under you. **Cloudflare Email Routing + Email Workers** is exactly the shape you want: inbound receipt, a Worker that inspects the message, `message.forward()` to their real inbox. Free, in-stack, does SRS so forwarding doesn't break SPF. Its constraint is that the domain must be on Cloudflare and Email Routing takes MX for that zone.

If you ever want it decoupled from the zone, the mature options are Postmark inbound streams (best reliability reputation), Mailgun Routes, SendGrid Inbound Parse, SES receipt rules. All the same shape: MX to them, MIME parsed to a webhook.

The *different* category you may not have considered is **OAuth mailbox sync** — Nylas, Unipile, Aurinko, or Gmail/Graph APIs direct. This is the only thing that gives complete capture with zero behaviour change. The cost is Google's restricted-scope verification (annual third-party security assessment, real money, real calendar time) and the fact that you'd be ingesting their personal mail too. Worth knowing it exists; not worth reaching for yet.

## 2. Does the workaround land?

**Yes as a first move, no as the answer.** It's the proven pattern — HubSpot, Pipedrive, Copper all ship exactly this — and it's zero-risk because we're never in the delivery path. Three corrections and one gap:

**BCC, not CC.** CC shows the customer a weird third-party address on their quote, which reads unprofessional and invites "who is this?". BCC is invisible and the `To:`/`Cc:` headers are still there to parse.

**Per-business opaque address, not one shared `contact@`.** With a shared address you'd have to identify the business from `From:`, which is trivially spoofable — anyone who learns the address could inject fabricated history into any business's record. Give each business `b-<opaque>@in.1stc.site`. And treat the address as a secret that *will* leak (it ends up in forwarded threads and people's sent folders), so ingested records should still be marked lower-trust than what we captured ourselves.

**It captures one side only, and only when they remember.** Realistically 50–70% at first, decaying. It misses cold inbound entirely, and it misses replies unless the customer hits reply-all.

**The gap it can't close is the important one**: someone emailing the business cold never touches our system at all.

## What I'd actually build, in order

**0. The contact form — already done.** Per BUG-86 form submissions land server-side in the contact list. That's the highest-volume cold-inbound channel and it's already ours, with no email involved.

**1. Own the address we publish on their site.** Here's the thing that changes the risk calculus entirely: **for a business currently using `alicesplumbing@gmail.com`, there is no incumbent MX to displace.** Giving them `hello@alicesplumbing.com` forwarding to that same Gmail is a pure upgrade — a failure means "the new address doesn't work yet", not "our email died". That's probably most of our market, and it's a real product benefit they'd value independently ("a proper business email address"). It also fixes the acknowledged gap in DOC-47: nobody is notified when an enquiry arrives. The forward *is* the notification. For businesses that already have MX on their domain, skip this tier — don't touch it.

**2. Per-business BCC address.** Your proposal, corrected as above. Cheap, do it.

**3. `Reply-To:` routing on everything we send.** This is the one that's nearly free given `mail.ts` already exists. Set `Reply-To: r+<thread>@reply.1stc.site` on outbound; the reply comes to us, gets recorded, gets forwarded. It's how every support tool threads, and it captures replies with zero human discipline required. As the front office starts sending on their behalf — follow-ups, invoices, lists — this covers a growing share of all correspondence automatically.

**4. OAuth mailbox sync — later, bought not built,** and only if demand justifies the Google verification cost.

Layers 1+3 are the interesting pair: between them, anything that starts with us or arrives at the address we published is captured without asking the business to do anything. Layer 2 is the discipline-dependent patch over what's left.

One thing to fold into terms and the deletion path: storing both sides means holding the *customer's* words, not just the business's. Business is controller, we're processor — fine, but DOC-55's erasure story needs to reach it.

---

Want me to write this up as a DOC, or open a ticket for layer 3 (Reply-To capture)? That one's small and mostly sits on rails `mail.ts` already laid.

<!-- xgd-turn id="5922e08f-e47b-4dd6-b99b-c590352cd82d-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T04:03:52.108456+00:00" -->
#### You
What is 4?

<!-- xgd-turn id="5922e08f-e47b-4dd6-b99b-c590352cd82d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T04:04:44.997288+00:00" -->
#### Claude
Layers 1–3 are all **interception** — they see mail only because it flows through a path we control. Layer 4 is different in kind: we stop intercepting and instead **read the mailbox itself**.

## The mechanic

The business clicks "Connect Gmail" in the control app. They get Google's consent screen. We get a refresh token. From then on we call the Gmail API (or Microsoft Graph, for Outlook shops) and read their mail directly — `users.watch` with Pub/Sub for push, or poll on `historyId`.

What that buys you is the thing nothing else can:

- **Both directions, always.** No BCC discipline, no reliance on the address we published.
- **Retroactively.** Their last three years of correspondence with every contact, backfilled on connect. Layers 1–3 only ever start recording from the day they're switched on.
- **Zero behaviour change.** They keep using Gmail exactly as they do now, including from their phone at 7am on a job.

That's complete capture. It's what Attio, Folk, Streak and every serious CRM do, and it's why their contact records feel alive from day one.

## Why it's "later"

**Google's restricted scopes.** `gmail.readonly` is classed restricted, which means public distribution requires OAuth verification *plus* an annual third-party security assessment (CASA, via an authorized assessor). That's real money every year and weeks-to-months of calendar time, with ongoing obligations on retention and incident response. Check current pricing and tiers directly — that regime shifts and my figures would be stale. Microsoft Graph is materially easier: publisher verification, no CASA equivalent.

**The consent screen is a churn moment.** "1st Contact wants to read, compose, send and permanently delete all your email" is the most alarming dialog we will ever put in front of a plumber. Some fraction just closes the tab. It's a categorically different ask from "add this BCC address".

**We'd be ingesting their personal life.** A business running on `alicesplumbing@gmail.com` has their kids' school, their bank and their GP in that same mailbox. We'd pull all of it and filter afterwards — meaning we've processed personal data of third parties who have no relationship with us whatsoever. Filtering at read time helps; it doesn't undo having touched it.

**And it's more engineering than it looks**: per-account sync cursors, token refresh and revocation, backfill, rate limits, re-auth when they change password, MIME parsing at volume.

## Why "bought"

Nylas, Unipile and Aurinko all sell this as a product — one API over Gmail + Graph + raw IMAP, normalized message schema, sync state and webhooks handled. The question worth asking each of them directly is whether **their** verification covers the integration or whether we still need our own, because Google has tightened on "the app the user sees is the app that gets assessed". That single answer is the difference between an afternoon and a quarter.

Watch the unit economics: these price per connected account per month. On a small-business product with thin margins, that's plausibly a paid-tier feature rather than something every customer gets.

## The cheaper cousin

**IMAP with an app password.** Same completeness, no OAuth verification at all — the customer pastes a credential and we sync. Clunkier, stores a secret instead of a revocable token, and Google has been steadily squeezing app passwords (worth checking where that stands now). But for a beta-era customer who actively wants complete history, it's a fraction of the work and a reasonable way to find out whether anyone cares before paying for CASA.

## The honest case against ever doing it

Layers 1 + 3 may make it unnecessary. If we publish the address *and* we send the outbound, what's left uncaptured is "the business types a cold email, from their own phone, to someone who has never contacted them and never will reply." For a plumber or a caterer that's a thin slice. Layer 4 earns its cost when businesses start telling us the record has holes that hurt — or when we move upmarket to people with actual sales pipelines. Until then it's a solution sized for a problem we haven't confirmed we have.

<!-- xgd-turn id="930d3a1b-64e4-4d19-b4f4-8864e9559a61-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T04:05:40.302154+00:00" -->
#### You
ok lets talk about outbound and mailing lists. I was expecting to use a 3rd party for that...

<!-- xgd-turn id="930d3a1b-64e4-4d19-b4f4-8864e9559a61-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T04:07:01.541794+00:00" -->
#### Claude
Worth splitting "third party" in two, because they're completely different decisions and only one of them is obviously right.

## Two different third parties

**Sending infrastructure** — Resend, Postmark, SES, Mailgun. We compose, we own the list, we own the record; they do SMTP, reputation, bounce handling. We already do this: `mail.ts` is a port with Resend behind it, and its docstring explicitly anticipates swapping to Postmark when deliverability makes that the answer.

**A marketing platform** — Mailchimp, Klaviyo, Kit, Brevo. *They* own the list, the campaign editor, the unsubscribe page, the analytics. The customer logs into their UI.

Using the first is obviously correct and already done. I suspect you mean the second, and that one I'd argue against — not on cost, on product.

## Why not hand the list to Mailchimp

**It breaks the record.** DOC-46 §2.3 is "the machinery remembers the conversation." If campaigns live in Mailchimp, the contact's history is split: we hold the form submission and the correspondence, Mailchimp holds the fact that Alice mailed them on Tuesday and they opened it twice. The one-place-that-remembers thesis dies quietly.

**It's a second login and a second mental model.** The promise is that a plumber doesn't have to become a marketing operator. "Now go set up Mailchimp" is precisely becoming a marketing operator.

**Two systems both believing they own contact state is a miserable sync problem.** An unsubscribe in Mailchimp must suppress in ours, instantly and permanently, or we mail someone who opted out. That bug is a legal problem, not a glitch.

## The thing a third party does *not* offload

This is the bit I'd flag hardest. Resend and Postmark will not suspend *a customer* — they'll suspend **our account**, because we're the customer of record. So using shared infrastructure doesn't transfer the risk, it **pools** it: one business importing a purchased list can take down sending for everyone.

The mitigations are architectural and worth deciding now:

- **Per-business sending domain with their own DKIM.** Mail goes from `alice@alicesplumbing.com`, signed with her key, not from `noreply@1stcontact.io`. Modern inbox reputation is heavily domain-scoped, so this contains blast radius *and* it looks right to her customers. It needs DNS records on her domain — which is free if we hold her zone, and that's already the direction for custom domains.
- **Separate marketing from transactional streams, hard.** If campaign complaints poison the domain that sends password resets and invoices, the product breaks. Postmark enforces this structurally; note also that Postmark was transactional-only for years and is still opinionated about it — don't design marketing onto a transactional stream.
- **Sub-accounts per business** where the ESP supports it (SES configuration sets, Mailgun subaccounts, Postmark servers), so suspension scopes to one customer.
- **Skip dedicated IPs.** They need roughly 50k/month sustained to warm and hold. Below that a shared pool has *better* reputation than anything we could build. Not our problem for a long time.

**The single biggest control, though, is where addresses come from.** Our lists are small and warm — people who filled in a form or bought something. That's a far better starting position than the median Mailchimp account. The thing that destroys it is arbitrary CSV import, which is how purchased lists get in. I'd either not ship import at first, or gate it behind attestation plus a throttled first send with complaint-rate watching.

## What I'd build

The thin campaign product on top of infra ESP. It's smaller than it sounds because we're not competing with Klaviyo. A business mailing 200 warm contacts needs: pick a segment, write it, preview it, send it, see opens and unsubs. No automation builder, no A/B, no journey canvas.

And check whether Resend's Audiences/Broadcasts already covers the early version — same vendor, same API, list stays ours, and it'd buy time before building. I'd verify current feature depth rather than trust my sense of it.

At volume the economics flip hard toward SES (roughly an order of magnitude cheaper per thousand), which is exactly the swap the existing port was built to make cheap.

## Non-negotiables whatever we choose

Google and Yahoo's bulk-sender rules have been in force since early 2024 and they're pass/fail:

- **One-click unsubscribe** (RFC 8058 — the `List-Unsubscribe-Post` header, not just a footer link)
- **SPF + DKIM + DMARC** aligned on the sending domain
- **Spam complaint rate under 0.3%**, measured by them, enforced by silent junking

Plus one of our own: **suppression is global per business and absolute.** Once someone unsubscribes, no code path emails them again — including anything reclassified as "transactional" to slip past. That's the rule most homegrown senders get wrong.

The bounce/complaint plumbing for this already exists in `email-webhook.ts`; broadcast events are the same shape landing on the same record.

---

Short version: third party yes, but as infrastructure under our product, not as the product. Where does the list live is the decision, and I'd keep it.

<!-- xgd-turn id="558653a9-92ee-4e28-b90d-04c7ac26fe5f-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T04:16:05.072439+00:00" -->
#### You
**The single biggest control, though, is where addresses come from.** Our lists are small and warm — people who filled in a form or bought something. That's a far better starting position than the median Mailchimp account. The thing that destroys it is arbitrary CSV import, which is how purchased lists get in. I'd either not ship import at first, or gate it behind attestation plus a throttled first send with complaint-rate watching. <-- that's funny, I was just thinking about list import. We need it, there is no around it. If I have been working as a plumber for the last 20 years I have a mailing list of customers not being able to leverage that mailing list would be seriously damaging our product.

## Once someone unsubscribes, no code path emails them again — including anything reclassified as "transactional" to slip past. That's the rule most homegrown senders get wrong. <-- transactional has to get through - "Your payment method failed" is a message they want - unless they are no longer a customer altogether. But we do not want Alice trying to reclassify mail..

<!-- xgd-turn id="558653a9-92ee-4e28-b90d-04c7ac26fe5f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T04:17:29.198358+00:00" -->
#### Claude
Both corrections are right, and the second one I overstated. Taking them in turn.

## Import: the problem is provenance, not import

You're right that blocking it is product suicide — that 20-year list *is* the plumber's business, and it's the warmest list in the world. People who paid him money.

The real difficulty is that **Alice's list and a purchased list arrive as the same file.** The distinction lives entirely in provenance, which the artifact doesn't carry. So the question isn't whether to allow import, it's how to read provenance from evidence and how to cap the damage when you read it wrong.

**There's more signal than you'd think, and none of it is attestation:**

- **Role-address density.** Alice's list is `gmail.com`, `hotmail.co.uk`, `btinternet`, `sky`. A scraped B2B list is full of `info@`, `sales@`, `enquiries@`. Cheap to compute, very discriminating.
- **Bounce-to-complaint *ratio*, not bounce rate.** A genuine 20-year list bounces heavily — people change ISPs, move, die. So does a purchased one. But the old genuine list bounces high and complains *low*, because people remember Alice. Purchased lists do both. The ratio separates them; the bounce rate alone doesn't, which is why naive "high bounce = bad list" gating would punish exactly the customer we want.
- **Accompanying columns.** A real customer list has names, addresses, job dates, amounts. A purchased one is often bare addresses. An import straight out of QuickBooks, Xero or Google Contacts is near-conclusive provenance.
- **Plausibility against the business.** A one-van plumber with 40,000 addresses is lying.
- **Account behaviour.** This is the strongest one. A business that's had a site up for three months, sent invoices and taken form submissions, then imports 800 addresses, is a completely different risk from a fresh signup whose *first action* is a 50k import. The abuser you're actually defending against looks nothing like Alice, and behaviour separates them before content does.

**Then the ramp, which is the control that matters.** Never blast a freshly imported list. Send in growing tranches — 50, then 150, then the rest — watching complaint and bounce rates between each, halting automatically on a threshold. Alice's 800 becomes 50 sends of exposure if it goes wrong instead of 800. This is standard IP-warming machinery doing double duty as list defence.

**And the nice part: the control and the customer benefit are the same action.** Run the list through validation (ZeroBounce, Kickbox, Emailable — cents per address) before the first send. For a 20-year-old list that's genuinely valuable to *Alice*: "412 of your 800 addresses are dead, and we cleaned them out before you sent" is a feature she'd pay for, not a compliance tax. It also catches recycled spam traps, which are the specific thing that will hurt you on an old list and which she has no way to see.

One thing worth surfacing to her at import time, since it's cheap and it's the actual UK rule: the soft opt-in under PECR covers marketing to existing customers about **similar** goods and services, provided an opt-out was offered when you took the address and appears every time since. So Alice mailing plumbing customers about plumbing is lawful. Alice mailing them about the cafe she just opened is not. We can't police that, but telling her the rule at the moment she imports is worth doing — and get it checked by someone qualified rather than taking my word.

## Transactional: you're right, and the fix is structural

I overstated. "Your payment failed" must arrive, and an unsubscribe from the newsletter isn't consent to lose your invoices.

The correct rule is that **unsubscribe scopes to a category, not to an address** — and the important design move is your instinct: the category must not be something Alice can set.

**So don't have a flag at all.** No `isTransactional` boolean anywhere, because any boolean is a thing someone eventually flips. Instead, two genuinely different functions:

- `sendTransactional(kind, subject)` — `kind` is an enum of system-authored templates; the recipient is computed from system state; **it takes no body.** Alice cannot route a composed message through it because it won't accept one.
- `sendBroadcast(segment, body)` — Alice writes it, Alice picks who; cannot bypass suppression.

Reclassification stops being policed and becomes impossible, which is the only kind of enforcement that survives contact with a motivated user.

Your qualifier does real work here too: *unless they're no longer a customer at all.* Transactional legitimacy comes from a live obligation, not a permission. Make `sendTransactional` require a reference to a live object — an open invoice, a booking, an active subscription — and it self-limits. No live object, nothing to notify about, no send. No extra rule needed.

**The three suppression events are not the same, and this is where I was wrong to collapse them:**

| Event | Effect |
|---|---|
| Unsubscribe | Marketing suppressed. Transactional continues. |
| Spam complaint | **Everything** suppressed — they've told Gmail we're abusive; continuing is reputational suicide regardless of who's technically right. |
| Hard bounce | Everything suppressed — the address is dead. |

The two paths also diverge on headers, which is a nice consistency check: one-click unsubscribe belongs on broadcast and is meaningless — arguably harmful — on a failed-payment notice.

**The last piece is the one that actually prevents Alice going hunting for loopholes.** There's a third category between the two, and it's where the pressure lives: "we've changed our opening hours", "your annual boiler service is due." That feels transactional to Alice, is genuinely useful to the customer, and is legally marketing. If the only two boxes are newsletter and invoice, she will try to force the boiler reminder into the invoice box — and she'll be *sort of* right, which is what makes it dangerous.

So give it its own home: a separate subscription preference for service reminders, so a customer can drop the newsletter and keep the thing that stops their boiler dying in January. It honours unsubscribe as marketing, but it's a distinct preference, so opting out of one doesn't kill the other.

The general principle: the defence against reclassification isn't enforcement, it's making sure the legitimate need has a proper channel. Alice isn't trying to spam anyone. She's trying to reach people who'd want to hear it, and if that route exists she'll take it.

<!-- xgd-turn id="c523ffc2-9f5a-4e9f-992e-a669f2ae00a0-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T04:22:46.801698+00:00" -->
#### You
**Everything** suppressed — they've told Gmail we're abusive; continuing is reputational suicide regardless of who's technically right. <-- are you saying I can't attempt to collect my outstanding $3000 bill because the customer hit "unsubscribe" on the invoice email?

<!-- xgd-turn id="c523ffc2-9f5a-4e9f-992e-a669f2ae00a0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T04:23:52.378457+00:00" -->
#### Claude
No — and my own table says so. An unsubscribe suppresses marketing and leaves transactional running, so the invoice reminders keep going. Belt and braces: there shouldn't be a `List-Unsubscribe` header on an invoice in the first place, so that click shouldn't exist to make.

But you're pointing at the real case, which is the **spam complaint** on an invoice — the customer who doesn't want to pay hits "Report spam" precisely to make the reminders stop. And there I was too absolute.

## Why the rule still mostly holds

The thing worth internalising is that **we aren't the ones deciding.** A spam complaint isn't a preference we're honouring out of manners — it's a signal that already went to Google. Gmail has recorded it against Alice's sending domain and it's now filtering accordingly.

Which means the fourth reminder probably **isn't reaching the inbox anyway.** Alice isn't chasing her debt; she's feeling like she's chasing it while the messages land in a spam folder nobody opens, and paying for that feeling with the deliverability of every other email she sends. The reminders that *do* still matter — to the customers who'd pay — get worse.

So suppression isn't confiscating a working tool. It's declining to keep charging for one that already broke. That's the honest version of the rule and it's the one I should have led with.

## What the product should actually do

Not "sorry, this contact is suppressed." A spam complaint on a payment reminder is a **signal to escalate the channel**, and the product knows things that help:

> *This customer marked your reminder as spam, so email is no longer reaching them. For £3,000 the next step is a written demand — here's their postal address, and here's a letter-before-action template.*

That's better advice than silently continuing. A £3,000 debt was always going to end up at letter, phone, or small claims; email reminders are just the cheap first rung of that ladder, and the complaint told you the rung broke.

And there's a bonus that falls out of the record-keeping thesis: **the complaint is evidence.** It proves receipt and engagement. "We notified you on these four dates and you marked the notifications as spam" is a considerably stronger position in a dispute than "we sent some emails." We captured it, so Alice gets to use it. Also worth knowing — chasing a debt you're owed yourself is far less regulated than collecting one on someone else's behalf, so Alice has more room here than the framing implies. Worth a proper check for the jurisdictions we operate in.

## Where I'd soften it

The absolutism was wrong because I collapsed two things that aren't alike. It's three paths, not two:

**Automated sequences** — dunning reminders firing on a schedule. These stop on complaint, no override. They're what generates *repeated* complaints, and repetition is what does the reputational damage.

**Alice writing to one person about one debt** — that's correspondence, not bulk mail. It isn't subject to the bulk-sender rules, it doesn't move complaint-rate metrics meaningfully, and it's a human making a deliberate decision about a specific person rather than a system emitting a sequence. Allow it, with a plain warning that the recipient marked her as spam and it likely won't land. Honestly, that's what a £3,000 debt warranted anyway — the automated sequence is for the £80 ones.

**Marketing** — never, no override, no attestation. Any override Alice controls gets used, and the customer most likely to use it is the one whose list is worst.

There's a second reason the softer line is affordable, and it comes straight out of the per-business-domain decision from earlier: if Alice sends from `alicesplumbing.com` under her own DKIM, **she bears most of her own reputational cost.** That's not true of a pooled `1stcontact.io` sending domain, where her choice taxes everyone. The shared IP pool is still shared, so there's a floor we protect regardless — but per-domain sending is what makes it defensible to let her make an informed call about her own customer rather than having us make it for her.

So: unsubscribe never blocks the invoice. A complaint stops the *robot* from chasing, not Alice.

<!-- xgd-turn id="9e692f84-26f2-41ef-b7da-6fee32a3306d-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T18:14:51.526125+00:00" -->
#### You
ok good discussion. If we pay attention to these constraints - do you think we can expect reasonable (90%+) delivery to Inbox from 1c sites?

<!-- xgd-turn id="9e692f84-26f2-41ef-b7da-6fee32a3306d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T18:16:03.303801+00:00" -->
#### Claude
Yes for two of the three cases, no for the third — and the split matters more than the headline number.

| Message class | Realistic sustained inbox placement |
|---|---|
| Transactional (invoice, receipt, booking, form notification) | **97–99%** |
| Marketing to an organically grown list (form submissions, recent customers) | **90–95%** |
| First send to an imported 20-year list | **60–75%** |

For scale: the industry-wide average across all senders sits in the low-to-mid 80s, and has for years. Treat these as the right order of magnitude rather than precise current figures — the benchmarks move.

Transactional is close to a solved problem when authentication is right: low volume, high engagement, the recipient is expecting it and often replies. Organic marketing at 90%+ is genuinely achievable and sustainable, because a list of people who filled in a form last month is a fundamentally better asset than what most senders are working with.

## The one that won't hit 90%, and why that's fine

Alice's legacy list won't clear 90% on the first send, and no amount of good engineering changes that — the addresses are genuinely stale, some are recycled spam traps, and a fraction of recipients honestly won't remember her.

But the important reframe: **90% placement on a cleaned list is achievable; 90% of the original CSV reaching an inbox is not.** After validation, the ramp, and pruning non-engagers, the *survivors* get to 90%+ and stay there. You'll have pruned 30–50% of the file to get there.

Alice will measure it the second way unless we frame it the first way from the start. That's the support-load risk in quoting any number to customers, and I'd be careful about ever putting 90% in marketing copy without the qualifier attached.

## What the number is actually conditional on

**Per-business sending domains.** This is load-bearing, and it's still an open decision. If marketing goes out from `noreply@1stcontact.io` on behalf of everyone, then once we have a few hundred customers our floor is set by our worst one, and 90% stops being achievable platform-wide no matter how good Alice is. If each business sends from `alicesplumbing.com` under its own DKIM, the figures above hold. The number follows from that decision more than from anything else on the list.

**Which surfaces a product finding:** proper outbound email effectively *requires the business to have their own domain.* We can't DKIM-sign as `gmail.com`, and sending `From: alice@gmail.com` through our infrastructure fails DMARC alignment outright — Yahoo went `p=reject` in 2024 and the direction of travel is one-way. So a plumber on a Gmail address either gets a domain or sends from a subdomain of ours with pooled reputation. Given layer 1 wanted a domain too, I'd make domain registration a more central part of onboarding than it currently is. It's also an upsell rather than a tax.

**New-domain warm-up, and Microsoft specifically.** A brand-new sending domain has no reputation. At low volume with high engagement it warms in weeks, but Outlook/Hotmail is consistently harder than Gmail and more opaque about it — new domains get junked there for a while even when everything is configured correctly. Enrol in Microsoft SNDS/JMRP and expect the first month to underperform. This is the single most common "why is my mail in spam" complaint and it mostly resolves with time.

**Shared IP pool.** At our volumes a shared pool beats anything we could warm ourselves, but it means our floor is partly set by the ESP's other customers. That's a real argument for staying with a curated vendor while volumes are low, even at higher per-message cost, rather than jumping to SES's cheaper shared pool early.

## The measurement trap

Worth knowing before we promise anything: **our own metrics cannot see inbox placement.** Resend will report 98% delivered, and that is entirely compatible with all of it sitting in spam — "delivered" means the receiving server accepted it, not that a human will see it. Open rates aren't a rescue either; Apple's Mail Privacy Protection has pre-fetched images since 2021, so opens are inflated and unreliable.

Three things give actual visibility:

- **Google Postmaster Tools** — free, gives real domain reputation and spam rate for Gmail. Needs DNS verification per domain, which we could automate if we hold the zone. Per-customer deliverability health, essentially for free.
- **Microsoft SNDS** — the equivalent for the harder half.
- **Seed-list testing** (GlockApps, Inbox Monster, Validity) — the only direct measurement of folder placement, by sending to a panel across providers.

And as health signals, **click rate and reply rate beat open rate** now. Replies especially — they're the strongest positive engagement signal to Gmail there is, and a plumber's customers actually do reply.

So: 90%+ is a reasonable expectation for everything except the first pass at a legacy list, conditional on per-domain sending, and we should instrument it rather than assume it.

<!-- xgd-turn id="5961d172-018f-4150-b596-ef2ed520988f-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T18:27:20.255440+00:00" -->
#### You
I know that small business have delivery problems even for handwritten transactional emails so improving on that and giving them visibility is high value.
Are there APIs to Google and Postmaster? - we need to be able to show this to our customers (in language they can understand) and make it available to the AI to give them advise.

**Seed-list testing** - hmm I have not seen this - how much does this cost? How many accounts do you need? We could set up some bots by hand - harder to do these days but we could probably create half a dozen or so on each major provider and access them via SMPT?

What is DKIM?

I am thinking that the customer gets to configure N (where N can be large) email addresses to be forwarded places on their domain and intercepted by us for metrics. We disallow no-reply and maybe even info@ and encourage the use of names. Can we support 1 email being forwarded to many addresses (e.g. support@ might want multiple recipients). The email dashboard will have an AI panel next to it and a custom playbook/set of advice/instructions for the AI to help the customers navigate all this

<!-- xgd-turn id="5961d172-018f-4150-b596-ef2ed520988f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T18:29:10.322406+00:00" -->
#### Claude
Four questions, taking them in order. The first one has a catch that matters a lot.

## Google Postmaster Tools API

Yes — `gmailpostmastertools.googleapis.com`, v1. You verify the domain (DNS TXT, which is automatic if we hold the zone), OAuth with `postmaster.readonly`, then `domains.trafficStats.list` gives you daily records: domain reputation (BAD/LOW/MEDIUM/HIGH), user-reported spam ratio, SPF/DKIM/DMARC pass ratios, delivery errors, encryption. Data lags two to three days.

**The catch: there's a minimum volume threshold.** Gmail suppresses the data unless you're sending meaningful daily volume to Gmail — the figure I remember is in the low hundreds per day, and it's worth verifying current behaviour. A plumber sending 200 emails a *month* will never cross it. The API will return empty for most of our customers, indefinitely.

That's an awkward interaction with the per-domain decision: isolating reputation per business is right, but it guarantees no single customer generates enough volume to be visible in Postmaster. Pooling would give us data we could actually see, at the cost of the isolation that makes the numbers good. I'd still isolate — but it means Postmaster isn't the visibility answer for this market.

**The thing that does work at any volume is DMARC aggregate reports.** Publish `rua=mailto:...` in their DMARC record and every major receiver — Google, Microsoft, Yahoo — sends us daily XML describing authentication results for that domain: how much mail claimed to be from them, from which IPs, and whether SPF and DKIM passed. Works for a sender doing ten messages a week. It doesn't measure inbox placement, but it measures the authentication health that placement depends on, and it catches anyone spoofing them.

Since we'd hold their DNS, we can set that up at domain-provision time with no customer action at all. Postmark runs a free DMARC digest service; Dmarcian and URIports are the paid tier. Parsing the XML ourselves is not hard, and it keeps the data in the record.

For the Microsoft side, SNDS is keyed to IP ownership, so on a shared pool that's the ESP's data rather than ours. Less useful.

So the visibility stack for a low-volume sender is: DMARC RUA (auth health) + ESP bounce/complaint webhooks (which we already land in `email-webhook.ts`) + reply and click rates. Postmaster only once someone gets big.

## Seed-list testing

GlockApps is the accessible tier — roughly $60–100/month for a small plan, worth checking current pricing. Inbox Monster and Validity Everest are enterprise, thousands a year. Panels typically use 50–100+ addresses to get a statistically meaningful read across providers.

**On DIY: I'd advise against it, and the reason isn't account creation.** It's that a freshly created, never-used Gmail account is not a representative recipient. Gmail's filtering is heavily personalised and engagement-driven — it learns from what that specific user opens, replies to and rescues from spam. A dormant account with no history doesn't behave like a real mailbox, so you'd be measuring something, but not the thing you care about. Commercial panels maintain *aged* accounts with activity histories, and that's most of what you're paying for.

The mechanics are also worse than they used to be: Gmail wants phone verification and flags accounts created in a batch from one IP; Microsoft has deprecated basic auth for personal accounts, so reading them means OAuth per account, not IMAP with a password. And bulk account creation is a ToS violation they enforce.

**But here's the reframe that makes it cheap:** you don't need per-customer seed testing. Most of what you're measuring is the health of *our sending path* — the IP pool, the ESP, the template HTML, the auth setup. That's a handful of tests per week for the whole platform, not per customer. One subscription covers it. Then spend targeted tests on the genuinely risky moments: the first send from each newly provisioned domain, and any account where complaint rate alarms.

## What DKIM is

**DKIM (DomainKeys Identified Mail) is a cryptographic signature on an email.** You generate a keypair; the private key lives with the sending service, the public key goes in DNS as a TXT record at `<selector>._domainkey.alicesplumbing.com`. On send, the server hashes certain headers plus the body, signs that with the private key, and attaches a `DKIM-Signature:` header. The receiver reads the header, fetches the public key from DNS, and verifies. If it checks out, the message genuinely came from someone holding that domain's key *and* hasn't been altered in transit.

It's one of three, and they do different jobs:

- **SPF** — a DNS record listing which IP addresses may send for your domain. Cheap, but it breaks on forwarding, because the forwarder's IP isn't on the list. (That's what SRS works around, and why Cloudflare does SRS for you.)
- **DKIM** — the signature above. Survives forwarding, *provided nothing modifies the message*. This is the real reason "forward verbatim" was a hard rule earlier.
- **DMARC** — a policy record saying what to do when the other two fail, plus where to send reports.

**The concept that ties it together is alignment**, and it's the bit that's non-obvious: DMARC requires that the domain which passed SPF or DKIM *matches the domain in the visible `From:` header*. You can pass SPF perfectly for some unrelated domain and still fail DMARC.

Which is exactly why per-business sending needs per-business DKIM keys. Mail from `alice@alicesplumbing.com` signed by `1stcontact.io` fails alignment, and Yahoo and Gmail will act on that. So we need a key published on *her* domain — one more DNS record we write automatically if we hold her zone. It's the same reason a plumber on a bare `@gmail.com` address can't be a proper sender at all.

## The N-addresses design

This lands, and it's a better shape than a single collection address. Cloudflare Email Routing does multiple rules per zone, plus catch-all, and Email Workers let you inspect before forwarding. Check the current per-zone rule and destination limits — they're generous but finite.

**Banning `noreply@` is right for more reasons than aesthetics.** It correlates with spam complaints (a recipient who can't reply and wants to escalate has exactly one button), it forfeits replies — the strongest positive engagement signal Gmail has — and it destroys the record, since replies are the whole thing we're trying to capture. Three of our concerns point the same way.

`info@` I'd *discourage* rather than ban. Role addresses are mainly a spam-trap signal when you're sending *to* them, which isn't this case. The real arguments are that nobody owns an unnamed inbox so it gets ignored, you can't attribute who replied, and a named sender gets better human response. That's advice with a strong default, not a prohibition — some businesses have a genuine reason, and a hard block on a reasonable request is where people start working around you.

**One address to many recipients: yes.** Plain routing rules are one-to-one, but an Email Worker can `message.forward()` to several destinations in a single handler, so the capability is there. Two caveats worth designing for:

- **Every destination must be verified** by clicking a confirmation link. That's friction, but it's also the thing that stops us being an open relay, so keep it.
- **Fan-out to three people is three copies, not a shared inbox.** No shared state, three separate reply threads, and the classic failure where everyone assumes someone else replied. That's a genuine product gap — and one we're unusually placed to fix, because we see all three copies and every reply. "Dave replied to this 20 minutes ago" is a feature that falls out of the record almost for free.

**On the AI panel** — this domain suits it unusually well, because the inputs are numeric, the diagnostic ladder is well-established (authentication → list quality → engagement → content → cadence), and the customer has no vocabulary for any of it. The value is translation: "domain reputation: LOW" means nothing to a plumber, while "Gmail has started distrusting mail from your domain, here's the likely cause and the fix" means everything.

Two things to build in: ground every piece of advice in *their* actual figures rather than generic best practice, and give it the diagnostic ladder as an ordering so it doesn't suggest rewriting subject lines when DKIM is failing.

---

Want me to capture any of this? There's a DOC's worth of design here, and the DMARC-RUA-instead-of-Postmaster finding in particular is the kind of thing that'll get rediscovered painfully in six months if it isn't written down.

<!-- xgd-turn id="54a5807a-714c-42db-b009-4f2f2b3271bb-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T18:38:08.619164+00:00" -->
#### You
**On DIY: I'd advise against it, and the reason isn't account creation.** It's that a freshly created, never-used Gmail account is not a representative recipient. Gmail's filtering is heavily personalised and engagement-driven — it learns from what that specific user opens, replies to and rescues from spam. A dormant account with no history doesn't behave like a real mailbox, so you'd be measuring something, but not the thing you care about. Commercial panels maintain *aged* accounts with activity histories, and that's most of what you're paying for. <-- I'm still not quite discouraged yet if we only need a small number of accounts to do the test tests then those could be created overtime from different IP addresses if necessary. It's only if we need volume that it becomes a real problem. And the accounts would get email I'm assuming this is something that we would want to test on a regular basis whatever once a week perhaps more frequently when an account is new. So out of the gate no the account would be fresh and disregarded but after a year of operation we could have a dozen Google accounts and they would be getting daily emails, we could also reply as well that helps boost our ratings.

GlockApps is the accessible tier — roughly $60–100/month for a small plan <-- so cost is one thing but control and visibility is another I recognize that people in this business probably have better infrastructure but do they have a PI can we access that stuff directly and can we do regular tests.

**But here's the reframe that makes it cheap:** you don't need per-customer seed testing. Most of what you're measuring is the health of *our sending path* — the IP pool, the ESP, the template HTML, the auth setup. That's a handful of tests per week for the whole platform, not per customer. <-- really? Why not per customer? Why not as just a part of our ongoing basic flow monitoring?

I am expecting to establish a basic flow monitoring (BFM) system that should test the functionality of all aspects of the platform and where necessary individual sites. There is obviously some thought needs to go in to what things must be tested at a per domain level versus being tested at a platform level. Platform level tests should be done very frequently individual site tests could be less frequent potentially but one of the things that I want to be able to guarantee to customers is that they know that their site is up and functioning as expected including the email forms and payments (I am assuming that stripe will offer some kind of sandbox for us to test against in production).

<!-- xgd-turn id="54a5807a-714c-42db-b009-4f2f2b3271bb-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T18:40:02.084705+00:00" -->
#### Claude
You've moved me on the seeds, and you're right that I under-argued the per-customer point. Taking them in order.

## DIY seeds: viable, with one trap that would silently invalidate it

Your reasoning holds. The aging objection dissolves if the accounts are aging *while doing the job* — a year in, they're a year old and have received daily mail, which is most of what the commercial panels are actually selling.

Two things you'd need to get right, and one of them isn't obvious:

**Give them diverse third-party inbound.** A mailbox that only ever receives mail from 1stcontact customers has a bizarre profile. Gmail's per-user filter would learn "this account gets mail from these domains and never complains," and start inboxing us more readily than a real recipient would. That's failure in the dangerous direction — false confidence. Fix is cheap: subscribe each seed to twenty or thirty real newsletters, retail, news, whatever. Now it looks like a mailbox.

**Never engage with your own test sends.** This is the trap. If you auto-open and auto-reply to the test mail, you train the filter to trust exactly the thing you're measuring, and the measurement becomes circular. The fix is technical and clean: read via IMAP with `BODY.PEEK[]`, which fetches without setting `\Seen`. You get folder placement — which is the entire signal you want — while generating no engagement at all. Build account health from the newsletter traffic; keep the test corpus strictly observed.

So: engage with everything *except* us.

**The reframe that makes your instinct correct** is that monitoring and measurement are different jobs. Four Gmail seeds cannot tell you whether your placement is 87% or 91%. They can absolutely tell you that mail which landed in Inbox yesterday is landing in Spam today — and that's the question BFM is asking. A small panel is fine for regression detection and inadequate for absolute measurement, and you're asking for the first.

Residual risk worth planning around: Google may nuke the accounts, and you'd lose the aging. Create them slowly from different IPs with real phone verification, and don't build anything load-bearing on a single provider's goodwill. One legitimate alternative for part of the panel — seats on your own Workspace/365 domains, which is entirely above board. Note the caveat that Workspace filtering differs from consumer Gmail, so it complements the consumer seeds rather than replacing them.

## APIs

Yes, and worth splitting into two capabilities that get conflated:

**Spam-score / auth checking** — mail-tester.com has a cheap API, and it's genuinely useful: SpamAssassin rule hits, SPF/DKIM/DMARC verification, blocklist checks. Fast, cheap enough to run constantly. But it is *not* inbox placement. It tells you the message is well-formed and authenticated, not where Gmail put it.

**Actual folder placement** — GlockApps has an API with scheduled tests; Inbox Monster and Validity are enterprise with APIs to match. Verify current GlockApps API surface before committing, my confidence there is moderate.

Sensible shape: mail-tester-style checking constantly (cheap, catches auth regressions immediately), own seeds for continuous placement monitoring, and a commercial panel occasionally as *calibration* — to check that your dozen seeds haven't drifted into unrepresentativeness. That last use is the one that justifies the subscription, and it's a much smaller subscription than running everything through them.

## Per-customer testing: I was wrong, with a real constraint

My platform-only framing assumed a shared sending identity. It contradicts the per-domain decision — if Alice sends from `alicesplumbing.com` with her own DKIM, her domain is its own reputation entity with its own age, its own complaint history and its own content. Platform tests tell you nothing about it.

But there's a constraint that does limit the frequency, and it's specific to this market: **the test traffic is a material fraction of a small sender's volume, and it's entirely unengaged.** A plumber sending 200 real emails a month, plus 12 seeds weekly, is now 20% test mail that nobody ever opens or replies to. Gmail reads that as a negative engagement signal. You'd be degrading the reputation you're trying to measure.

So per-customer placement testing should be **event-triggered rather than continuous**:

- on first provisioning of a new sending domain (the riskiest moment)
- before the first send to a newly imported list
- on any complaint-rate or bounce-rate alarm
- monthly baseline

Whereas the *cheap* per-customer checks — DNS records present and correct, DKIM selector resolving, DMARC policy intact, mail-tester score — carry no volume cost and can run as often as you like. That's the right split: continuous on the zero-cost checks, event-driven on the ones that consume sending volume.

## BFM

The platform/per-site division roughly falls out as:

**Platform, high frequency** — control app, publish pipeline, Access, ESP API reachable, Cloudflare Email Routing accepting, D1/KV/R2, Stripe API reachable, our own DNS resolving.

**Per-site, lower frequency** — 200 with an expected content marker, TLS validity and expiry runway, DNS correctness across the full set (A/CNAME, MX, SPF, DKIM, DMARC), contact form submitting end-to-end into the contact list, forwarding working, payments working.

Two wrinkles worth knowing now:

**You cannot verify the last hop.** Sending to `hello@alicesplumbing.com` and confirming it reached Alice's actual Gmail is impossible — we can't read her mailbox. What you *can* do is provision a `bfm-@` address on her domain routed to one of our seeds, which exercises the identical path end to end and proves the routing, the Worker and the forward all work. It doesn't prove her personal destination is healthy, but the failure mode there is a bounce coming back to us, so silence plus acceptance is decent evidence.

**Your monitor shares fate with the thing it monitors.** Cron Workers on Cloudflare checking Cloudflare-hosted sites will go quiet exactly when you most need them to shout. If you want to make an uptime claim to customers, at least the outermost check needs to run somewhere else — even a cheap external synthetic as a dead-man's switch on the monitor itself.

**On Stripe, one correction to the assumption:** test mode is a genuinely separate environment, not a sandbox overlay on live. Test keys never touch live data, and you can't run a test-mode transaction through a live account's live keys. So a synthetic payment against the real path isn't available.

What is available, and is arguably better:

- **`charges_enabled` and `payouts_enabled` on each connected account.** This is the highest-value check on the list, because it catches the actual failure mode — Stripe disables a Connect account when verification documents expire or requirements change, and the business typically finds out when the money stops.
- **`requirements.currently_due` and `past_due`** — monitoring these daily and warning Alice *before* the deadline is a real product feature, not just monitoring. "Stripe needs a document from you by the 14th or your payments stop" is exactly the kind of thing a one-van business misses.
- **Creating a Checkout session with live keys**, which charges nothing but exercises most of the integration.
- **Webhook endpoint reachable and signature-verifying.**
- A genuine small charge-and-refund occasionally, accepting that the processing fee isn't returned on refund. Monthly at most, and probably only per-platform rather than per-customer.

---

This has turned into a substantial design with several findings that'll be expensive to rediscover — the Postmaster volume threshold, the `BODY.PEEK` engagement trap, test-volume-versus-small-sender-volume, and the Stripe test-mode correction in particular. Want me to write it up as a DOC under CHAT-54?

<!-- xgd-turn id="08b22919-94a6-4f31-891f-9ef12f6e9d1e-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T18:54:30.622135+00:00" -->
#### You
I think we need to be careful about mixing jobs here. Inbox vs Spam is one problem - getting the email to arrive at all is another. BFM is mostly about the latter. Spam treatment is something that will change slowly and is perhaps better measured by a third party.

So lets say we have a single bot account (on paid gmail) and every day we trigger every email sending form on every customer to send and email to that account. We open the email, we click on (test) the links in the email and we despam it if it went to spam. That should not harm our interaction score for those accounts and it tells us that the forms are working. There is also signal there if emails end up in spam despite all that love so that would be something worth tracking too - it would give us a lower bound on spam classification problems.

For measuring spam lets get a third party and work through questions of cost and frequency - I think once a week for a new account, once a month for an established one plus a debug send option if mail seems to be getting spammed.

<!-- xgd-turn id="08b22919-94a6-4f31-891f-9ef12f6e9d1e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T18:55:53.320694+00:00" -->
#### Claude
The separation is right, and it's cleaner than what I was proposing. It also resolves the tension in my earlier advice: `BODY.PEEK` and never-engage applies to *measurement* seeds, where engagement biases the result. Your functional bot has the opposite requirement — engage hard, because a healthy well-fed account is what makes it a reliable canary. Two different accounts with two different disciplines, no conflict.

And the lower-bound logic is sound: if mail survives an account that opens everything, clicks everything and rescues it from spam, and *still* lands in spam, something is badly broken. Low sensitivity, very high specificity — exactly what you want in an alarm rather than a gauge.

## The gotcha: synthetic submissions pollute the record

Triggering Alice's contact form daily creates a fake lead in her contact list every day, fires her notification, and distorts every metric we show her. The record is the thing we're selling; filling it with 365 bot enquiries a year would be self-inflicted.

So synthetic submissions need a marker — HMAC'd with a platform secret so it isn't forgeable — that the handler recognises. The instinct is to short-circuit on it, but that would stop testing the code path you're trying to test. Better to run the **full real path and write the record flagged synthetic**, then filter it from every view, count, and metric Alice sees, and suppress her notification. You exercise everything and keep the data clean.

The metrics point matters as much as the list: a bot that opens and clicks 100% of 30 messages a month will wreck Alice's reported open rate if those sends are counted. Same flag, applied to reporting.

**One upside you may not have counted:** that synthetic traffic is guaranteed-positive engagement on her domain — opened, clicked, rescued from spam. It's gentle continuous domain warming, which is genuinely valuable for a low-volume sender whose reputation would otherwise be built on 200 messages a month.

## Shared code paths vs per-customer config

Worth splitting, because it cuts the volume several-fold with almost no loss.

The **code paths** — contact form, booking, quote request, receipt, invoice, newsletter confirmation — are shared across every customer. They break for everyone at once. Test all of them frequently against a canary site we own, where synthetic data costs nothing and there's no record to pollute.

What's genuinely **per-customer** is the configuration: their DNS, their DKIM selector, their sending domain's reputation, their template. That needs one representative send per customer per day, not six.

So: full path matrix on the canary, high frequency; one path per real customer daily, to validate their specific config. Six times less mail, and you'd still catch both classes of failure.

## Addressing

You'll need per-customer attribution in the mailbox — with a few hundred arrivals a day, "which customer's form is broken" has to be answerable without parsing bodies. Plus-addressing (`bfm+<customer-id>@`) or a catch-all on the Workspace domain both work, and the catch-all is more robust since some form validators choke on `+` in an email field.

I'd also run more than one destination mailbox eventually — a single address is a single point of blindness if it ever gets classified oddly, and you'd lose visibility across the whole fleet simultaneously.

## Two notes on the paid-Gmail choice

Workspace filtering isn't consumer Gmail filtering — different defaults, admin-configurable. For functional testing that's irrelevant, and for your lower-bound signal it actually *strengthens* the logic: Workspace is the friendlier environment, so spam placement there is even more damning.

But it means: **do not allowlist our senders in the Workspace admin console.** The reflex when a monitoring account's mail starts going to spam is to allowlist it so the monitor keeps working — and that would silently destroy the only placement signal the system has. Worth writing down somewhere an admin will find it, because it's a very natural thing to do at 2am.

## Measurement cadence

Weekly for new, monthly for established, plus on-demand debug send — I'd take that as-is. Two triggers I'd add:

- **Before the first send to a newly imported list**, since that's the highest-risk moment in the whole system.
- **On complaint or bounce rate crossing a threshold**, so the test fires before Alice notices rather than after.

The debug send is the best part of it as product: Alice says "my emails are going to spam," and instead of a support conversation she gets a real placement test back within minutes, with evidence and a specific cause. That's a good moment for the AI panel to earn its place.

---

Still happy to write this up as a DOC under CHAT-54 whenever you want it — the separation of functional-vs-placement, the canary/config split, and the don't-allowlist warning are the bits most likely to get lost otherwise.

<!-- xgd-chat-end -->