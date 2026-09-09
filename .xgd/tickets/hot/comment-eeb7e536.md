---
uid: comment-eeb7e536
id: COMMENT-2321
type: comment
title: Comment on chat CHAT-48
created_by: xgd
created_at: '2026-09-09T17:14:38.134425+00:00'
updated_at: '2026-09-09T18:48:03.941329+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-07e7eb23
  kind: chat_transcript
---

<!-- xgd-turn id="0a245ba2-cb89-4aa9-8261-876cc4e763a6-user" -->

<!-- xgd-chat role="user" ts="2026-09-09T17:14:15.610665+00:00" -->
#### You
This is a horrible area for non-tech people - its a place where they might indeed spend several hundred dollars to get someone to solve it for them.

For a first contact site we will initially offer a fallback domain: lets say yoursite.1stc.site (1stc.site is available) - that part is easy [yoursite] has to be unique across our platform, but that's fairly easy. However, this is not a real solution - I assume that all 1c customers want their own domain. The question here is how to support it.

Usecases:
1. Customer has a domain and its on cloudflare
2. Customer has a domain with a different registra (a) prepared to/want to move to CF (b) want to stay where they are
3. Customer wants to buy a domain

How far with the CF APIs take us here? Can we sell users their own domain without exposing them to the CF UI (opaque and intimidating)? How far do they go to help us with (1) and 2a - what do we do about 2b?

<!-- xgd-turn id="0a245ba2-cb89-4aa9-8261-876cc4e763a6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-09T17:18:45.465593+00:00" -->
#### Claude
I'll verify the load-bearing facts rather than answer from memory — the whole recommendation hinges on whether Cloudflare Registrar has a registration API.

That first result changes the picture materially. Let me get the detail.

Short answer: the ground moved in your favour about five months ago. Cloudflare shipped a **Registrar API in beta (April 2026)** that can search, check and register domains programmatically at cost, and a proper registrar-as-a-service/reseller layer is stated as landing "later this year" — i.e. roughly now. Use case 3, which used to be the impossible one, is now the *easiest* one.

But there's a wall in a place you probably weren't expecting it. Details below.

## First, split the problem

Almost all the fear non-technical people have here is misattributed. Three independent things:

| | What it is | Who has to act |
|---|---|---|
| **Registrar** | Who bills them for the name, annually | Only matters for buying/transferring |
| **DNS** | Which nameservers answer for the domain | The lever that actually matters |
| **Routing + cert** | Getting traffic to our origin with valid TLS | Us, invisibly |

The customer's registrar is almost irrelevant to us. What matters is **whose nameservers answer**. Conflating those two is why this feels like a $300 problem.

## What Cloudflare actually gives us

**1. Cloudflare for SaaS (custom hostnames) is absurdly cheap.** 100 custom hostnames included on *Free, Pro and Business*; $0.10/hostname/month beyond that, up to 50,000. Our first hundred customers' domains cost us nothing. Cloudflare issues and auto-renews the certs.

**2. The Registrar API exists now.** `search` / `check` / `register`, at-cost with no markup (.com ~$8.57). Registrant contact can be passed **inline per-domain**, so the customer can be the legal registrant even though the domain sits in our account. Not yet in the API: **transfers, renewals, contact updates**.

**3. Zone management has always been fully API-driven.** Add zone, get assigned nameservers, write records — no UI, ever.

So: **yes, we can sell a customer a domain and stand up their site with them never seeing a Cloudflare screen.** That's real today.

## The wall: apex proxying is Enterprise-only

This is the thing that will actually bite you, and it's worth understanding precisely.

`www.theirbusiness.com` → CNAME → our fallback origin. Legal DNS, works everywhere, works on the Free plan.

`theirbusiness.com` (bare apex) → **CNAME at the apex is illegal in DNS.** Cloudflare's fix is CNAME flattening, which only works if the zone is *on Cloudflare*. The alternative — pointing an apex A record at IPs allocated to us — is "apex proxying", and Cloudflare lists it as a **paid Enterprise-only add-on**.

Consequence: if a customer keeps their DNS at GoDaddy/123-reg/wherever, we can serve `www.` and we **cannot** serve the bare apex, unless their DNS provider happens to support ALIAS/ANAME records (Route 53, DNSimple, DNS Made Easy, Namecheap do; many small registrars don't).

And "just redirect apex → www" doesn't escape it — the redirect itself needs an apex record pointing somewhere we control.

For an audience who types `theirbusiness.com` into a card and expects it to work, this is not a cosmetic limitation.

## The two architectures

**(A) Custom hostname** — they keep their zone, we're a guest on it. One CNAME + one TXT. Low risk, low control, apex problem.

**(B) We hold the zone** — their nameservers point at our Cloudflare account. Apex works free via flattening, we control everything forever, and after the one-time nameserver change they never touch anything again. Cost: we inherit their MX/SPF/DKIM, so we become a single point of failure for their **email**.

Mapping your cases onto that:

| Case | Best path | Customer effort |
|---|---|---|
| **1. Domain already on Cloudflare** | (B) — move the zone to our account, or (A) if they won't | Change NS at registrar, or add 2 records in CF |
| **2a. Elsewhere, willing to move** | (B) — move **DNS only**, don't transfer the registrar | Paste 2 nameservers at their registrar. Once. |
| **2b. Elsewhere, staying put** | (A), `www.` only | Add 1 CNAME + 1 TXT. Apex is a real conversation. |
| **3. Wants to buy** | Registrar API → our account → (B) | **None.** |

Two things worth pulling out of that table:

Case 1's real advantage isn't that they're "already on Cloudflare" in a way we can exploit — we get no delegated access to their account, there's no consumer OAuth for that. The advantage is that **CNAME flattening means their apex just works**. That's it, and it's worth a lot.

For 2a, push the **DNS** move, never the registrar transfer. A nameserver change is free, instant-ish, reversible and one paste. A registrar transfer means EPP codes, a 60-day lock, and isn't in the API anyway. There is no reason to make them do the hard one.

## What we cannot automate away

- **The one-time action at their existing registrar** (cases 1, 2a, 2b). Nobody can automate this — Vercel, Shopify and Squarespace all make the customer do it too. What we *can* do is make it a single copy-paste with a screenshot for their specific registrar, and verify it ourselves by polling.
- **Registrar transfers**, if anyone insists — manual, Cloudflare dashboard, not in the API.
- **Renewals**, currently. Not in the API beta yet.

## The liabilities nobody costs in

These are the ones that turn a nice feature into a support disaster, and they're all in path (B) or use case 3:

**Killing their email.** If we take over DNS and miss an MX or DKIM record, the business stops receiving mail and won't connect it to their new website for days. Cloudflare's zone-add scan imports what it can guess, and it does not guess everything. Mitigation: our own `dig` sweep of MX/TXT/SPF/DKIM selectors before cutover, shown to them for confirmation, re-verified after. This is non-negotiable and it's real work.

**Renewal is now our fault.** A failed card means the domain lapses and the business goes dark. Auto-renew, dunning, a long grace policy, and — since the API doesn't do renewals yet — a manual path. This is an ongoing operational commitment, not an integration.

**ICANN registrant verification.** 15 days to verify the registrant email or the domain gets suspended. If we set the customer as registrant, that email goes to them and they will ignore it.

**60-day transfer lock** after registration. A customer who buys through us and changes their mind is stuck for two months. Must be disclosed up front.

**Exit.** Holding a client's domain hostage is the single most notorious bad-agency behaviour, and it's directly against the positioning in DOC-46. We should make them the registrant, and commit in writing to releasing the auth code on request, no questions. Cheap to promise, and it's exactly the kind of thing worth saying out loud.

## Recommendation

**Default to (B): we hold the zone.** Register-on-their-behalf for new domains, DNS-only nameserver move for existing ones. It's the only path where the customer's total technical involvement is zero or one action, apex works, and we never have to explain a CNAME. Offer (A) as the explicit "I want to keep control of my DNS" path, with an honest `www.`-only caveat.

Three things I'd verify before committing:

1. **Is `.co.uk` in the Registrar API's TLD subset?** Cloudflare Registrar supports it (Nominet), but the API beta is explicitly "a subset". For a UK small-business base this is close to decisive — one `check` call with a token settles it.
2. **Whether the registrar-as-a-service tier changes the registrant/billing model.** If it lands with proper on-behalf-of semantics, that's strictly better than what I've described.
3. **What Enterprise apex proxying actually costs.** If it's reachable, it collapses case 2b's apex problem entirely and is worth pricing.

One cheap thing to do now while it's still cheap: **get `1stc.site` onto the Public Suffix List.** Once you're handing out `yoursite.1stc.site` subdomains to unrelated businesses, they share cookie scope unless the parent is a public suffix. `pages.dev`, `workers.dev` and `github.io` are all on it for exactly this reason. Trivial now, unpleasant to retrofit after you have customers.

Want me to write this up as a DOC ticket? It's design substance that belongs somewhere more durable than a chat transcript.

**Sources:**
- [Register domains wherever you build: Cloudflare Registrar API now in beta](https://blog.cloudflare.com/registrar-api-beta/)
- [Registrar API · Cloudflare Registrar docs](https://developers.cloudflare.com/registrar/registrar-api/)
- [Cloudflare for SaaS plans](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/plans/)
- [Cloudflare for SaaS quotas and billing](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/quotas-and-billing/)
- [Set up apex proxying · Cloudflare for Platforms docs](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/start/advanced-settings/apex-proxying/setup/)
- [Top Level Domains supported · Cloudflare Registrar docs](https://developers.cloudflare.com/registrar/top-level-domains/)
- [Cloudflare launches domain registration API — Domain Name Wire](https://domainnamewire.com/2026/04/15/cloudflare-launches-domain-registration-api/)

<!-- xgd-turn id="00ba9aca-50db-4289-ba97-ed5dd09433f1-user" -->

<!-- xgd-chat role="user" ts="2026-09-09T17:47:00.540042+00:00" -->
#### You
Cost: we inherit their MX/SPF/DKIM, so we become a single point of failure for their **email**. <-- Look at our feature set, this isn't just about webhosting, I think we need to control their email, don't we? Also BTW surely it is Cloudflare that takes over their email, not us?

At some level all these liabilities are opportunities - these are places we can solve problems for customers with automated solutions...

1. Doesn't have to be day 1
2. 3. ok

So help me understand the apex proxy experience: The customer owns mybiz.com on GoDaddy. By shifting to CF as nameserver we can serve www.mybiz.com - what happens if a user types mybiz.com into a browser?

<!-- xgd-turn id="00ba9aca-50db-4289-ba97-ed5dd09433f1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-09T17:48:44.765840+00:00" -->
#### Claude
Two corrections owed, and your apex question has a better answer than my last message implied. Let me verify a few things first.

Both corrections are owed. Taking them in order, because the second one changes the architecture.

## No, Cloudflare does not take over their email

Changing nameservers makes Cloudflare the **authoritative DNS** for the domain — it answers the question *"where does mail for mybiz.com go?"*. The mail itself still flows directly from sender to Google/Microsoft/whoever their MX points at. Cloudflare never sees a message.

So the failure mode isn't Cloudflare mishandling mail. It's **us publishing a zone with the MX record missing**, at which point senders are authoritatively told "no mail server here" and mail bounces — and it bounces cleanly and permanently, which is worse than a soft failure. Cloudflare will faithfully serve whatever we put there, including nothing.

And when it breaks, the customer calls us. Not Cloudflare, not GoDaddy. So the liability is ours regardless of whose infrastructure is technically at fault.

## You're right that we're already in their email

This is the more important correction. Per the SPF setup we already have — apex plus the `send.` subdomain — the platform already sends on the business's behalf. That means we already need SPF, DKIM and a return-path in their zone.

Which kills the premise of my "cost" framing. We were never going to be able to stay out of their DNS-for-email. The alternative to controlling the zone isn't "avoid the risk", it's **"email a non-technical customer four TXT records and ask them to paste them into GoDaddy correctly"** — which is precisely where deliverability setups go to die, and it fails silently. Mail doesn't bounce; it just quietly lands in spam for months.

So: controlling the zone isn't a new liability we're taking on. It's the thing that makes the email feature deliverable at all. Path (B) is the *safer* option for email, not the riskier one.

And the opportunity you're pointing at is right there: **Cloudflare Email Routing is free on every plan, API-driven, and requires exactly the thing path (B) gives us** — nameservers on Cloudflare. `hello@mybiz.com` forwarding to the Gmail they already use, provisioned in one click. For a sole trader currently printing `bristolfurniture@gmail.com` on their van, that's a real upsell that costs us nothing. (It's forwarding — receiving. Sending *as* that address is a further step.)

## The apex question: it just works

Here's the thing I under-explained last time. **Apex proxying is irrelevant to your scenario.** That Enterprise-only feature exists solely for the case where the zone is *not* on Cloudflare.

Your setup — mybiz.com registered at GoDaddy, nameservers pointed at Cloudflare, zone in our account:

1. We add a CNAME at the apex, `mybiz.com` → our origin, proxied.
2. Cloudflare applies **CNAME flattening** at the apex automatically — default, all plans, including Free.
3. The DNS answer is Cloudflare's anycast IPs, so it's a legal A-record response and every resolver on earth is happy.
4. The cert covers apex and www both.

User types `mybiz.com` → the site loads. Types `www.mybiz.com` → the site loads. HTTPS on both. GoDaddy stays the registrar, bills them annually, and is otherwise entirely out of the picture.

The customer's total involvement was pasting two nameservers, once.

**The wall only applies to case 2b** — customer keeps DNS at GoDaddy and just adds a `www` CNAME. Then the apex still resolves to whatever GoDaddy has there, which is usually a parking page. Someone types `mybiz.com`, gets a GoDaddy ad. That's the genuinely bad outcome, and it's the case worth designing around or pricing an Enterprise plan for. Some registrars offer apex forwarding as an escape hatch, but coverage and HTTPS support vary enough per registrar that I wouldn't rely on it without checking each one.

## Two things that fall out of this

**Path (B) scales, and it's simpler than I described.** There's no zone cap on the free plan — unlimited zones per account. And if we hold the zone, we don't need Cloudflare for SaaS *at all*; custom hostnames exist only for zones we don't own. So path (B) is one product, not two. (I'd sanity-check the unlimited claim at volume — it's community consensus rather than a documented SLA, and Cloudflare does throttle rapid zone creation for abuse reasons.)

**Nameserver pairs are per-zone.** Cloudflare assigns a random pair per zone, so there's no single "always paste these two" instruction — each customer gets different ones. The onboarding UI has to generate them per customer and verify propagation by polling. Minor, but it shapes the screen.

On liabilities-as-opportunities — agreed, and the MX one is the best example. "We checked, your email still works" as a visible step during cutover is a trust moment that costs us a `dig` and buys a lot. Same with renewal warnings. Noted as not-day-1.

Want me to write this up as a DOC ticket now that the shape is clearer?

**Sources:**
- [Cloudflare Email Routing](https://www.cloudflare.com/developer-platform/products/email-routing/)
- [Set up apex proxying · Cloudflare for Platforms docs](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/start/advanced-settings/apex-proxying/setup/)
- [Cloudflare for SaaS plans](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/plans/)
- [Is there a limit to how many domains I can add for DNS on the free plan? — Cloudflare Community](https://community.cloudflare.com/t/is-there-a-limit-to-how-many-domains-i-can-add-to-my-account-for-dns-with-the-free-plan/501353)

<!-- xgd-turn id="fa790da3-81db-4209-8665-0151899a8d40-user" -->

<!-- xgd-chat role="user" ts="2026-09-09T18:17:32.958776+00:00" -->
#### You
On email - a part of our solution is monitoring - we should devise checks to ensure email send and receive is correctly routing.

I have lost track of A and B at this point - can you summarize what you are proposing the solution to be?

I'm uncomfortable with any solution in which www.mybiz.com goes to a page, but mybiz.com says "This site is not yet set up - would you like to buy this domain?" - that just doesn't feel like its really a solution - if we take that off the table where are we left?

<!-- xgd-turn id="fa790da3-81db-4209-8665-0151899a8d40-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-09T18:19:16.905951+00:00" -->
#### Claude
Let me check one thing before I answer the email part, because I was too enthusiastic about Email Routing last message.

Confirmed — and that's a correction to my last message: **Email Routing cannot coexist with an existing mail provider.** It takes over MX for the whole domain, and Cloudflare blocks MX edits while it's on. So it's for customers with *no* email on the domain, never for someone on Google Workspace. Enabling it on a Workspace customer would destroy their mail. That constraint has to be a hard branch in the onboarding logic, not a footnote.

Dropping the A/B labels. Here's the proposal.

## The proposal: we run the DNS

**One architecture.** The customer's nameservers point at Cloudflare, in an account we control. We hold the zone. Everything else — apex, www, SSL, email records, monitoring, future changes — follows from that and needs no further customer involvement, ever.

Three on-ramps to it:

**They buy a domain from us.** Registrar API registers it at cost, zone lands in our account, site is live. Customer actions: zero. This is the flagship path and the one to optimise for.

**They have a domain.** They paste two nameservers at their existing registrar. We snapshot their DNS first, import it, verify nothing broke. Registrar stays wherever it is — GoDaddy keeps billing them, we don't care. Customer actions: one, once. This is identical whether their domain is currently on Cloudflare, GoDaddy, or anywhere else — which collapses your cases 1, 2a and 2b into a single flow.

**They won't move nameservers.** They get `theirname.1stc.site`. No custom domain.

That third branch is the direct consequence of your apex constraint, and I think you're right to force it.

## What ruling out the broken apex costs

You're right that `www` works / apex sells you a domain is not a solution. It's worse than not offering the feature, because it looks like we shipped something broken.

Ruling it out kills the custom-hostname approach entirely — the one where they keep DNS elsewhere and add a CNAME. Apex needs either CNAME flattening (requires the zone on Cloudflare) or apex proxying (Enterprise-only paid add-on). There's no free hack: pointing an A record at Cloudflare's shared IPs for a zone we haven't configured returns an error page, not our site.

The remaining ways to serve an apex without holding the zone are all bad:

- **Their DNS provider supports ALIAS/ANAME.** Route 53, DNSimple, DNS Made Easy do. GoDaddy — the one that matters most for our audience — does not. Covers a minority, and we'd have to detect provider capability per customer. Complexity for a partial answer.
- **Registrar-level apex forwarding.** Varies per registrar, HTTPS support is inconsistent, and when it breaks it breaks invisibly.
- **Our own redirect box on a static IP.** Genuinely works, and it's how platforms did this pre-Cloudflare. But it's non-Cloudflare infrastructure, its own cert story, and a new single point of failure — to serve customers who've told us they don't want to change a DNS setting.
- **Enterprise apex proxying.** Real money for a case we can decline.

So the honest accounting: **the cost of your constraint is the customer who has a domain and refuses to repoint nameservers.** I think that population is small and largely outside the ICP — someone with enough attachment to their DNS setup to refuse usually already has a webmaster and a website. The furniture restorer in Bristol does not have an opinion about nameservers.

And we're not turning them away. They get a working `1stc.site` address today and can upgrade whenever they're ready. That's a much better story than a half-working custom domain.

The upside of the constraint is large: one code path, apex free, email records automatable, and — the thing you're asking about next — monitoring that can actually *fix* problems rather than just report them.

## Email monitoring

The structural point first: **almost every useful check here is only possible because we hold the zone.** Observing from outside gets you detection. Holding the zone gets you detection *and* remediation, plus a known-good intended state to diff against. Monitoring is another argument for the single architecture.

**At cutover — blocking, must pass before we call it done**

Snapshot their live DNS *before* the nameserver change: MX, all TXT, SPF, DMARC, and a sweep of common DKIM selectors (`google`, `selector1`/`selector2` for M365, `k1` for Mailchimp, and the rest of the usual suspects). Import, then re-sweep after propagation and diff. The diff must be empty apart from our intended additions. Show the customer their own mail setup and have them confirm it before we touch anything — that's both a safety check and a trust moment.

**Continuously — receive path**

- MX present and matching the snapshot. This is the catastrophic one; missing MX means senders get an authoritative "no mail server here" and bounce permanently. Page on it.
- MX targets resolve and answer on SMTP.
- **Live delivery probe** — send a real message to an address on their domain and confirm arrival. This is the only check that tests the thing we actually care about. Feasible when Email Routing is ours; needs them to create a probe alias when they're on Workspace.

**Continuously — send path** (us sending as them)

- **Exactly one SPF record per name.** Two TXT SPF records at the same name is a permanent error that fails every send. Note the trap: apex and `send.` are *different* names, so a record at each is correct and expected — the check must key on name, not on "count SPF records in the zone", or it'll flag our own correct setup.
- **SPF lookup count ≤ 10.** Exceeding it is a permerror and it's the silent killer — a customer who adds Xero, Mailchimp and a booking system tips over the limit and their mail quietly stops authenticating. Nobody counts these by hand. Cheap for us to compute, genuinely valuable.
- DKIM selector present, parses as a valid key, matches what our sender expects.
- DMARC present and syntactically valid — and if their policy is `p=reject`, check our sends actually align, or every message we send gets rejected.
- Return-path/bounce CNAME present.

**Continuously — outcomes**

- Bounce and complaint rates from our sending provider's API. This is the real signal; record checks are a proxy for it.
- Blocklist status.

**Zone drift**

Diff the live zone against our intended state on a schedule. Someone will eventually log in and "fix" something, or another vendor will ask them to add a record and they'll replace instead of append. Because we hold the zone, we can detect it and offer a one-click revert.

Rough cadences: cutover checks blocking; DNS-level checks every 15 minutes since they're just DNS queries; delivery probe and reputation daily. Severity split so MX-missing pages immediately and DMARC drift only warns.

One implementation note worth knowing early: **Workers can't do outbound SMTP**, so the delivery probe and any SMTP-banner check need to run somewhere else or go through our sending provider's API.

---

Shall I write this up as a DOC ticket now? There's enough here — the single architecture, the decline case and its rationale, the Email Routing/Workspace branch, and the check list — that it's worth having somewhere durable before it scrolls away.

<!-- xgd-turn id="e2e82044-0988-4694-bd9f-a161789f9161-user" -->

<!-- xgd-chat role="user" ts="2026-09-09T18:46:28.434195+00:00" -->
#### You
**Email Routing cannot coexist with an existing mail provider.** It takes over MX for the whole domain, and Cloudflare blocks MX edits while it's on. <-- I don't understand this statement - what is the context? We have assumed that we control the nameserving, correct? So this is a scenario where the user has an existing email provider, we take their nameserving over and (correctly!) copy their configuration. You are saying that will keep their current email provider?

We need to decide if we have to take over email provision or whether we can live with other third parties doing it - aside from configuration complexity I'm not sure how much we care?

<!-- xgd-turn id="e2e82044-0988-4694-bd9f-a161789f9161-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-09T18:48:03.619003+00:00" -->
#### Claude
You're right, and I wrote that badly. Let me separate two things I ran together.

**Taking over nameservers does not affect who provides their email.** We hold the zone, we copy their MX pointing at Google Workspace, mail continues to flow to Google exactly as before. Nothing changes for them. That's the default and it's correct.

**Cloudflare Email Routing is a separate optional product** — free forwarding — that we would have to deliberately switch on. *That's* what seizes MX. It's not a consequence of holding the zone; it's a consequence of enabling one specific feature. My sentence made it sound like the former.

So the constraint is narrow: never enable Email Routing for a customer who already has email on that domain. It's only interesting for customers who have none.

Let me check one thing before answering your actual question, since it bears on the sending side.

## The question splits three ways

"Email" is three different products with three different answers, and they keep getting welded together:

**1. Sending as them.** Not optional — we already do it, that's what the SPF at apex and `send.` is for. Our deliverability *is* our product quality: if an enquiry confirmation lands in spam, the whole thing failed. We care enormously.

**2. Receiving enquiries.** Plausibly core. The product is called First Contact; if a prospect emails the business, handling that is arguably the thing we exist to do.

**3. Hosting their mailboxes.** Being their Google Workspace. Commodity.

Your instinct is right that we don't care much — but only about (3).

## The recommendation

**Never host mailboxes.** It's zero-margin against Google at £5–6/user, and the risk profile is completely different from web hosting: a website being down is embarrassing, email being down means the business cannot operate, and lost mail is unrecoverable. On top of that, mailbox migration — years of mail, calendars, contacts — is the single most painful job in small-business IT, and we'd be signing up to do it repeatedly, for free, at the exact moment we're trying to make a good first impression.

Third parties doing this is *good* for us. It's someone else's uptime obligation.

**Always own sending.** Already true. Worth noting per-domain DKIM and sender reputation isolation matter here — if we send everyone from one shared pool and one customer's content trips a filter, everyone's deliverability suffers.

**Get enquiry ingestion without touching their MX.** This is the bit that dissolves the apparent conflict, and it's the thing worth knowing:

**MX is per-name, not per-domain.** `mybiz.com` can point at Google while `enquiries.mybiz.com` points at us. Both valid, no conflict, no risk to their existing mail. So receiving enquiries never requires becoming their email provider.

Three ways to ingest, in preference order:

- **Website form.** Plain HTTP, no email involved, no DNS, no risk. This is the primary path and probably covers most of the volume.
- **One forwarding rule in their existing provider** — `hello@mybiz.com` → our ingest address. Works with Workspace, M365, anything. One-time config, doesn't touch MX.
- **MX on a subdomain** we control. Fully automatable, but the address is uglier.

## Where Email Routing actually fits

Only one segment: the customer with **no email on that domain** — currently handing out `bristolfurniture1987@gmail.com`. For them, `hello@bristolfurniture.co.uk` forwarding to the inbox they already use is free, one API call, and squarely on-brand. An enquiry arriving at a professional address instead of a personal Gmail is literally first-contact quality.

But there's a sharp edge worth deciding on before offering it: **Email Routing is forwarding only.** They receive at `hello@` and then reply *from* their Gmail address. So we'd sell them a professional address that visibly isn't one the moment they answer. Closing that means giving them an outbound path too — Gmail's "send mail as" needs SMTP credentials from somewhere, which Email Routing doesn't provide. So either we solve the reply path or we're shipping half a feature that undercuts its own pitch.

Relevant to that: Cloudflare now has an **Email Sending** product (transactional, Workers Paid plan) alongside Email Routing. It might be the outbound half. But it's beta and the docs don't say whether it supports multi-tenant sending on behalf of customer domains, which is the only way it's useful to us. Worth watching, not worth betting the design on yet.

## So the boundary

We take responsibility for **the records being correct**. We don't take responsibility for **the mail servers being up**.

That's a clean line, it's the one the monitoring enforces, and it means a customer on Workspace is fully supported without us being anywhere near their mail.

<!-- xgd-chat-end -->