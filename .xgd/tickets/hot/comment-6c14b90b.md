---
uid: comment-6c14b90b
id: COMMENT-2612
type: comment
title: Comment on bug BUG-78
created_by: xgd
created_at: '2026-09-10T21:43:34.354314+00:00'
updated_at: '2026-09-11T02:10:33.378127+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-f6c3fedf
  kind: chat_transcript
---

<!-- xgd-turn id="a1e0ed38-410f-4e2b-b7af-13567f01ff10-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T21:43:19.110475+00:00" -->
#### You
The email capture module on 1st contact homepage "Apply to join the early beta" is raising an error when I hit it it says "Could not reach the server. Please try again."

<!-- xgd-turn id="a1e0ed38-410f-4e2b-b7af-13567f01ff10-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T21:48:00.675529+00:00" -->
#### Claude
I've traced it. Here's what's happening.

Diagnosed. BUG-78 is written up — no code yet, because the fix is a scope decision.

**What's wrong.** The form is the `contact-form` module (`beta-form`) on the `1stcontact` home page, configured with:

```
"action": "https://app.1stcontact.io/beta-apply"
```

That address can't work, for two independent reasons:

1. **`/beta-apply` doesn't exist.** `control-app`'s router serves `/`, `/index` and `/api/*`. The string `beta-apply` appears nowhere in the repo. It was never built.
2. **`app.1stcontact.io` is entirely behind Cloudflare Access.** `client.js` sends a cross-origin JSON `fetch`, which needs a CORS preflight first. I checked it just now: the `OPTIONS` preflight comes back **403 from Access with no `Access-Control-Allow-Origin`** (and a plain `GET` 302s to the Access login origin). So `fetch()` *rejects* rather than returning a status — which is precisely the `catch` branch that prints "Could not reach the server. Please try again."

The no-JS fallback is no better: a native POST would land on the Access login redirect.

**The real gap.** This isn't specific to our homepage. There is no form-submission endpoint anywhere in the product — `public-site` answers any non-GET with 405 by construction, and `control-app` is gated. That's exactly what DOC-47 records: *"there is no 1st Contact inbox behind the form yet."* The homepage was configured as though one existed.

**Same page, same cause:** `account-chrome` is configured with `signIn: "https://app.1stcontact.io/auth/request-link"` — also a route that doesn't exist, also behind Access. The Sign in dialog will fail identically.

**How do you want this fixed?**

- **A — content only, no code.** Stop promising a destination that isn't there: an email address on the page, or point the action at a mailbox you already have. Honest today, captures nobody.
- **B — build the endpoint.** A public POST handler in `public-site` (not behind Access, and *same origin as the page*, so no preflight at all), landing the submission as a `lead` contact in that site's tenant. That's the generic enquiry-landing capability DOC-47 lists as missing; it needs spam handling (the honeypot already renders, the Turnstile mount is present but unwired) and rate limiting. This is a feature, not a bug fix — arguably its own REQ.
- **C — narrow B**, apex site only.

My recommendation: **B**, because the beta form is the one thing our own shop window exists to do and A leaves it collecting nothing — but it's genuinely bigger than a bug, so tell me whether you want it under BUG-78 or split. And say whether the sign-in URL comes with it.

<!-- xgd-turn id="9662df59-a4e2-44f4-954c-7937ca7a870b-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T21:50:00.455991+00:00" -->
#### You
I think B but I don't understand C?

<!-- xgd-turn id="9662df59-a4e2-44f4-954c-7937ca7a870b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T21:54:03.347630+00:00" -->
#### Claude
Fair question — let me answer that first, then get moving on B.

**C** was the same endpoint but deliberately crippled to one site: it would only accept submissions for the apex (our own `1stcontact` site, named by `APEX_SITE_KEY`), and any form on a customer's published site would still get nothing. The appeal is that it's less code — no deciding *which* tenant a submission belongs to, because there's only ever one. The cost is that it's the literalism trap: an endpoint shaped around our own homepage that has to be rebuilt properly the first time a customer wants a working contact form. Since `public-site` already resolves a site key from the URL for every request it serves, B barely costs more than C. So C isn't worth having, and you picked the right one.

Let me read the design record before I write anything.

Two things worth knowing before I write code:

<!-- xgd-turn id="da9b5eac-472d-4b88-bec3-de3db1d4dce2-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T22:09:27.008813+00:00" -->
#### You
Lets take a step back and talk about requirements rather than implementation for a moment.

both the email capture form AND the sign in form are behavior modules, right? Both need to work, we built part of then because we did not have email wired up, we do now, so we need endpoints for both.

We also need appropriate security solutions so that they do not become spam relays or DOC attack surfaces.

<!-- xgd-turn id="da9b5eac-472d-4b88-bec3-de3db1d4dce2-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T22:11:03.186347+00:00" -->
#### Claude
Stepping back is right — and one premise needs correcting before we build on it. Let me check two things first.

Both are behavior modules, yes — `contact-form` and `account-chrome`, and both post their JSON to a URL held in module config. But they are not in the same state, and the difference changes what we have to build.

## Where each one actually stands

**Sign-in is built.** `/sign-in` exists (REQ-202) and is not a stub: CORS preflight, a per-subject rate limit of 5/hour, mail through the wired mailer and templates, and the message recorded against the contact. It was finished *after* email landed. Two things are wrong with it, neither a missing endpoint:

- the homepage config says `https://app.1stcontact.io/auth/request-link`, a route that has never existed — REQ-200 set it to `/sign-in`, and something later replaced that with an invented URL;
- in production Cloudflare Access blocks `/sign-in` at the edge anyway. I checked: `GET` → 302 to the Access login, `OPTIONS` preflight → 403. Same for `/api/email/webhook`.

**Email capture has no endpoint at all.** That one is a real build.

So the Access point deserves emphasis: there are already two routes in the codebase written to sit ahead of the gate (the delivery webhook, the four sign-in routes) and *neither is reachable in production*. Whatever we build for capture lands behind the same wall. The bypass policy is owed today, before any of this.

## The security requirement that shapes the design

The two endpoints differ on one axis that decides everything else: **does it send mail to an address the caller supplies?**

Sign-in does send mail — but `subjectFor` only resolves addresses **already in the database**, and an unknown address gets nothing, indistinguishably. That is what stops it being a relay: the worst an attacker achieves is mailing someone we already know, five times an hour. `sessions.ts` names Turnstile's absence there as a deliberate decision resting on exactly that.

Capture cannot use that defence — accepting unknown addresses *is the feature*. So I'd propose one invariant across both, rather than two rulebooks:

> **A public endpoint may only cause mail to be sent to an address the database already holds.**

Sign-in already satisfies it. Capture satisfies it by *not* mailing the submitter at all — no confirmation, no double opt-in — and by sending any notification to the business's own address, which we hold. The moment we add a confirmation email to the submitter, we have built an open relay to arbitrary victims, and it stops being fixable by rate limiting.

The rest follows from that:

- **Turnstile stops being optional for capture.** Sign-in's argument for skipping it doesn't transfer, because capture has no known-address rule to lean on. This is REQ-7's unwired mount — the markup is already rendered.
- **Rate limiting must key on something the caller cannot vary.** Sign-in counts per subject, which works because the subject pre-exists. Everything a capture submission carries is caller-chosen, so the cap has to be per site and per IP. Note the tension: a per-site cap is itself a denial-of-service against the customer — fill the bucket, real enquiries get refused — which is another reason the sharp instrument needs to be Turnstile and the cap a backstop.
- **Body and field caps enforced before parsing**, so a large body is refused rather than read.
- **One frozen acknowledgement**, so capture can't be used to test whether an address is already a contact — the property sign-in already has.
- **Submitted text never reaches mail headers**, and is escaped in any body. A form field is attacker-controlled content arriving in something we send.
- **Mail quota is a shared resource.** If every capture notifies the owner, a flood burns provider quota and the first thing that breaks is sign-in.
- **Consent provenance.** The tenant is IE, we're storing an address off a public form, and `contact_events` is append-only and already carries a `detail` blob — recording what the person was shown and when costs nothing now and is unreconstructable later.

## What I need from you

1. **Does an enquiry notify the business owner, or only appear in the contacts list?** DOC-47 warns that a form which posts nowhere visible is the worst outcome — a row in a list nobody logs into is a soft version of that.
2. **Turnstile now, or honeypot plus rate limit and accept the spam?** Wiring it needs Cloudflare keys and reopens REQ-7.
3. **Scope.** BUG-78 is currently the diagnosis. Cleanest split I see: BUG-78 keeps the two content fixes and the Access policy; the capture endpoint becomes its own REQ, since it's a capability with its own acceptance criteria. Say the word and I'll write both up — I won't file anything until you do.

<!-- xgd-turn id="8b165770-6441-4fc1-aa8e-e02e510066ad-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T22:23:19.613414+00:00" -->
#### You
Unfortunately, if you read our documentation and look at the XGD draft site you will see that email capture needs to send links to the White papers, to the email address that was captured.

1. I think notifications as a feature in its own right for now just update the contact database
2. Can you tell me exactly what turnstile and honey pot do? Are these cloud flare features or new dependencies? I was expecting that Cloudflare could provide us with the necessary rate limiting etc.

Once we have clarity on these design decisions we should determine whether that is the need for additional tickets

<!-- xgd-turn id="8b165770-6441-4fc1-aa8e-e02e510066ad-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T22:26:09.745817+00:00" -->
#### Claude
Let me go read the whitepaper flow before I answer — my proposed invariant may not survive it.

You're right, and it kills the invariant I proposed. Let me correct it, then answer the Turnstile/honeypot question precisely.

## The whitepaper requirement, confirmed

`storage/sites/xgd/draft/pages/whitepapers.json` — submit label *"Send me both papers"*, success *"On their way — check your inbox."* Both XGD forms post to `/api/lead`. And CHAT-56 records the state: *"Papers are email-gated now"*, plus *"Whitepaper delivery has no artifact and no backend. No PDFs exist in either repo; the papers are ticket bodies. `/api/lead` does not exist. Deferred by the operator as 'easy mechanics'."*

So mail to an address we've never seen is a product requirement, not an edge case. "Only mail addresses we already hold" is dead.

**The replacement.** An open relay is one where the attacker controls the recipient *and* the content. Here we author the content absolutely — our template, our links, our domain. What's left isn't arbitrary spam, it's four narrower things: mail-bombing a victim, deliverability damage, quota burn, and list poisoning. Deliverability is the one that actually frightens me — unsolicited mail earns spam complaints, complaints degrade the sending domain, and the first casualty is sign-in links not arriving. Abuse of the marketing form breaks the login.

The rule that survives:

> A public endpoint sends **at most one** message per address, with content **we** author, and never to an address that has bounced or complained.

One-per-address is the structural control, and it's nearly free: `addContact` is already idempotent on `(tenant_id, email)`, and `contact_events` is already an append-only log, so *"have we sent this address the papers"* is a query the schema can answer today. An attacker can cause a victim to receive exactly one email, once — the same exposure as any newsletter on the internet, and irreducible for an email-gated asset. Suppression on bounce/complaint comes free too: REQ-198's webhook already brings delivery outcomes back.

## What Turnstile and the honeypot actually are

**Honeypot — not a product, not a dependency, and already half-built.** It's a technique: a form field hidden from humans and tempting to naive bots; if it comes back filled, discard the submission. `contact-form/component.ts` already renders ours (`hp_company_url`, CSS-hidden, `tabindex="-1"`, `autocomplete="off"`, marked `data-fc-invariant` so a designer can't restyle it visible), and `client.js` deliberately includes it in the payload — its comment says *"the honeypot field rides along so the server can reject filled-honeypot submissions."* The client half shipped. The server half has never existed because the server has never existed. Zero cost, catches only unsophisticated bots.

**Turnstile — Cloudflare's own product, and also already half-built.** It's their CAPTCHA replacement, free and unlimited on every plan including free. Not an npm dependency: a `<script>` tag from `challenges.cloudflare.com`, and one server-side `fetch` to their siteverify endpoint with a secret key. Two config values per deployment. The module already renders the mount — `<div class="contact-form__turnstile" data-turnstile-target>`. The code comments say it's "wired in REQ-7", but REQ-7 is a D1 schema ticket that was **abandoned**, so those references are stale and nothing owns this work.

**Rate limiting — yes, Cloudflare provides it, in three different places.** WAF rate limiting rules at the zone level (dashboard config, matches path/method/IP — good for crude flood protection on `/api/lead`); the Workers **rate limiting binding**, declared in `wrangler.toml` and called as `env.LIMITER.limit({ key })`, which is native, dependency-free, and lets us choose the key; and Bot Fight Mode for bot scoring. The exact allowances on the free plan I'd want to confirm against your dashboard rather than assert — say the word and I'll check the zone via the API.

**What Cloudflare can't do** is the part that matters most: it sees traffic, not meaning. It cannot know that this address already received the papers, or that this one hard-bounced last week. So the split is clean rather than either/or — Cloudflare handles volume, IPs and bots; we handle the identity-level rules, which are cheap because the data model already holds them.

Worth noting you already wrote this down: DOC-5's *Public Form Strategy* specifies exactly Turnstile + rate limiting + honeypot + AI spam detection + reputation checks, and *"do not solve spam by forcing visitors to create accounts."* I'm not proposing a new dependency, I'm proposing we finally wire the documented one.

## Two things that change the scope

**The two sites disagree about where forms post.** XGD uses `/api/lead` — relative, same-origin, which on a published site means public-site, and public-site is read-only by construction and 405s every non-GET. The 1st Contact homepage uses an absolute `https://app.1stcontact.io/…`, which means cross-origin, CORS, and an Access bypass. Those are two different architectures for one job and we should pick one deliberately. This is the one design decision I still need from you, and I'd want to lay out the tradeoff properly rather than bury it here.

**The beta form and the whitepaper form are not the same problem.** "Apply to join the early beta" promises no artifact — a place on a list is the whole deliverable, so capture alone satisfies it completely. "Send me both papers" promises two PDFs *that do not exist in either repo*. So BUG-78 is fixable end-to-end now; whitepaper delivery is blocked on content that hasn't been written, regardless of what we build.

## Proposed tickets

Given #1 — contact database only, no notifications — here's the split I'd suggest:

- **BUG-78** (this one): the two broken configs — `beta-apply` → the real endpoint, and `auth/request-link` → `/sign-in`, which REQ-200 had set correctly before something replaced it.
- **New REQ — lead capture endpoint.** `/api/lead`: honeypot enforcement, one-send-per-address, bounce suppression, rate limiting, the frozen acknowledgement. The capability BUG-78 depends on.
- **New REQ — Turnstile wiring.** Both forms, both halves. REQ-7 is abandoned, so this is unowned.
- **New REQ — mailing-list opt-in checkbox.** CHAT-56 already flags that `contact-form` supports `text|email|tel|textarea` only and that a checkbox is a module config addition needing its own ticket. This is also the consent record for GDPR, and the tenant is IE.
- **New BUG or ops task — the Access bypass policy.** `/sign-in` and `/api/email/webhook` are both edge-blocked in production today. Nothing we build is reachable until that's set.
- **Not mine to file — the whitepaper PDFs.** Content, and it blocks the XGD site's promise.

Confirm the split and answer the same-origin-vs-cross-origin question, and I'll write them up.

<!-- xgd-turn id="645868fb-8651-43f5-b389-be224501c63e-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T22:39:54.363269+00:00" -->
#### You
There is a fairly significant over head to me for each ticket - the scope of tickets can be large - please reduce the number of REQs you need

<!-- xgd-turn id="645868fb-8651-43f5-b389-be224501c63e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T22:40:50.450759+00:00" -->
#### Claude
One REQ. Here's the compression.

## One new ticket: *Public forms accept a submission, safely*

Everything I listed collapses into a single capability with one acceptance story — a visitor submits a public form, they land in the contact database, and the endpoint cannot be turned into a spam or DoS instrument. Splitting it was me organising by implementation area, which is your overhead, not a real boundary. In particular:

- **Turnstile isn't separable.** Shipping the endpoint without it means knowingly deploying an under-defended public surface and filing a ticket against ourselves. DOC-5 already specifies honeypot + Turnstile + rate limiting as *one* strategy, not three features.
- **The opt-in checkbox isn't separable.** It's a small `contact-form` config addition, and it's the consent record — which is part of capturing an address in an IE tenant, not a follow-up to it.

So: endpoint, honeypot enforcement, Turnstile, rate limiting, one-send-per-address, bounce suppression, frozen acknowledgement, opt-in checkbox. One ticket, one branch, one reconciliation.

## Two things that don't become tickets

**The Access bypass policy** is Cloudflare configuration, not code — a deployment step recorded inside the REQ. It's owed regardless: `/sign-in` and `/api/email/webhook` are edge-blocked in production today.

**The whitepaper PDFs** are content you'd write, and they don't block the REQ. The delivery mechanism can be built and tested against the asset as an abstraction; the beta form needs no artifact at all. I'll note the dependency in the ticket and leave it with you.

**BUG-78 stays as it is** — it already exists, it's the record of what you actually hit, and its fix is two config values once the endpoint is live. No new overhead there.

## The origin decision — my recommendation

Same-origin, on public-site, forwarding to control-app over a **service binding**. Concretely: the form posts to `/api/lead` (relative), public-site takes it, and hands the write to control-app through a binding rather than a public request.

That buys four things at once. No CORS and no preflight. No Access bypass needed for lead capture, because a service-binding call never traverses the edge — which matters a lot given the bypass is currently missing and is precisely what's breaking sign-in. The site key comes from the URL grammar public-site already parses, so a spammer can't retarget another tenant by editing the action. And relative URLs work identically in local dev and production, whereas the absolute `https://app.1stcontact.io/…` on the homepage is broken locally for exactly the reason you hit it.

The cost is honest: public-site is emphatically read-only today and this makes it accept exactly one POST on exactly one path, with everything else still 405. I'd state that as a deliberate, narrow amendment in the ticket rather than let it be discovered. It also means XGD's existing `/api/lead` was the right convention all along and the homepage's absolute URL is the anomaly.

One caveat so it isn't a surprise later: this does **not** fix sign-in in production. That stays cross-origin on control-app and still needs the bypass policy. Proxying sign-in the same way would fix it, but that's a different change and I'm not folding it in.

Say go and I'll write the REQ, update BUG-78 to depend on it, and start on the branch. If you'd rather the endpoint live on control-app after all, tell me now — it changes the shape of the whole ticket.

<!-- xgd-turn id="2a5de84e-c61a-4fc1-9e8d-10c2bb73158c-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T22:57:22.710752+00:00" -->
#### You
Please create the ticket - I will use the tickets own agent to build it.

<!-- xgd-turn id="2a5de84e-c61a-4fc1-9e8d-10c2bb73158c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T23:00:34.064336+00:00" -->
#### Claude
Done — one ticket.

## REQ-223 — *Public forms accept a submission: lead capture, asset delivery, and the controls that keep it safe*

`request-7d9f8b2e`, status `draft`, priority high. Eleven sections, fifteen numbered acceptance criteria, written for an agent that wasn't in this conversation — so every claim carries its evidence and every deliberate choice carries the reason it was chosen, to survive a builder who'd otherwise "fix" it.

What's in it:

- **§1 what's true today** — three shipped forms pointed at routes that have never existed, with the verification dates. Includes CHAT-56's prior record of the same gap, and the finding that REQ-7 (cited in code comments as wiring Turnstile) is an abandoned D1-schema ticket, so that work is unowned.
- **§3 the architecture** — `/api/lead` on `public-site`, same-origin, tenant from the URL, write handed to `control-app` over a service binding. §3.2 requires the internal seam be an RPC entrypoint rather than a path, on the grounds that a path is something a request can name and `access.ts` argues at length against surfaces that are one misconfiguration from public.
- **§5 asset delivery** — the whitepaper requirement, the reframing of relay risk (we control the content; recipient choice is what's dangerous), and *at most one send per address per asset, ever*. Flagged explicitly as **not** a rate limit and not to be softened into one, with the real cost stated: someone who loses the email can't re-request it, and the remedy is an authenticated operator re-send.
- **§6 the controls** — honeypot, Turnstile, rate limiting, body limits, each with what it's actually for and how it fails. Turnstile fails closed when unconfigured. Includes the note that CORS constrains browsers and nothing else, so the UATs should assume a non-browser caller.
- **§7 the opt-in checkbox** as the consent record rather than a feature — storing the answer *and* the wording shown, since wording reconstructed later evidences nothing.
- **§9 out of scope**, with your notification decision recorded as a dated operator decision, plus the two limbs of DOC-5's strategy we're not doing, so their absence reads as a choice.
- **§10 deployment steps** — Turnstile keys, the service binding, and the Access bypass policies.

BUG-78 is updated: `blocked_by: [REQ-223]`, existing diagnosis preserved, with an appended section giving the two config values that close it and the note that the sign-in half additionally needs the Access policy, which lead capture deliberately doesn't.

One thing worth carrying forward: **the missing Access bypass is not created by any of this**. `/sign-in` and `/api/email/webhook` are unreachable in production right now, which means REQ-202's sign-in and REQ-198's delivery webhook are both dead there today. REQ-223 routes around it for lead capture, but nothing routes around it for sign-in.

Unrelated housekeeping: the Gmail, Google Calendar and Google Drive connectors need authorising in your claude.ai connector settings before I can use them — nothing here needed them, but the session flagged them as unauthenticated.

<!-- xgd-turn id="25dd74ab-4a13-4436-aa30-c16c3e455533-user" -->

<!-- xgd-chat role="user" ts="2026-09-11T02:03:33.913209+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="25dd74ab-4a13-4436-aa30-c16c3e455533-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-11T02:07:48.030900+00:00" -->
#### Claude
Let me read the protocol and the code I'll be touching before I ask anything.

REQ-223 was built and merged while I was away — two commits, now at `ready_to_reconcile`. Let me confirm what it delivered before touching anything.

The implementation is complete and matches the ticket closely. Let me verify it actually passes before I decide anything.

All 27 pass. Let me pin down exactly what's left for BUG-78.

Before I touch anything — REQ-223 is already built, and I need to check I'm not about to duplicate it.

## What I found

While I was idle, the ticket's own agent implemented REQ-223 and it's merged into `xgd-working`:

- `c1c41b1983 feat(lead): public forms accept a submission [FREE-CODED]` — 31 files, ~2,800 lines, plus a version bump commit.
- Status is **`ready_to_reconcile`**, which is operator-only — so you promoted it.
- I ran its four UAT suites: **27 tests, all passing.**

Spot-checking the implementation against what I wrote: `/api/lead` on public-site, site key from the URL grammar, a `LeadIntake` `WorkerEntrypoint` rather than a path (`worker.ts` splits along the runtime boundary so the ~60 node suites importing `index.ts` don't break on the workerd built-in), honeypot before Turnstile so bots don't spend siteverify budget, `asset`/`assetName`/`assetUrl` as both-or-neither read from the published definition rather than the submission, and `checkbox` added to `FIELD_TYPES`. It follows the ticket closely and in places improved on it.

So **if "this ticket" meant REQ-223, there's nothing to implement** and re-doing it would produce a conflicting second implementation. That's the one outcome worth a question rather than a guess.

## If you meant BUG-78 — which is what I assume

Then the honest answer is that **almost none of it is code**. REQ-223 built the endpoint; BUG-78 is now configuration and data:

1. **Page config** — `beta-form.action` → `/api/lead`, and `signin.signIn` → `https://app.1stcontact.io/sign-in`. This lives in D1 as site content, not in the repo (`db/dev-seed.sql` has no sites, and `storage/sites/1stcontact/` is an older copy of the site without the beta form). I can edit the local draft and republish.
2. **`APEX_SITE_KEY`** in `apps/public-site/wrangler.toml` → `site_62d3d0097bbc7b6e86bdcdb3728389a3`, in both `[vars]` and `[env.production.vars]`. It's `""` today, and `leadTarget` returns null for the apex without it, so the homepage's form would refuse even with the right action. A repo file, but a config value.
3. **Turnstile keys** — `TURNSTILE_SITEKEY` (var) and `TURNSTILE_SECRET` (secret). Both empty. The endpoint answers `503` with no secret, by design, and the widget isn't stamped into the page with no sitekey. **This one I can't do**: it needs a Turnstile widget created in your Cloudflare account. Cloudflare publishes always-pass test keys for development, and I can wire those into local dev if you want — but they must not reach production, since they'd switch the control off.
4. **The Access bypass policy** — still outstanding, still only affects sign-in, not lead capture.

The free-coding protocol exempts configuration and document changes, so items 1, 2 and 4 wouldn't involve a branch or UATs. Item 3 is yours.

## The question

**Did you mean BUG-78, or did you want me to review or redo REQ-223?**

If BUG-78: say so and I'll do items 1 and 2 immediately, then hand back with 3 and 4 named as blocked on you — and I'll tell you plainly that the form still won't work end-to-end until the Turnstile keys exist, rather than declaring it fixed.

If you want me to **review** REQ-223's implementation rather than rebuild it — a fresh pair of eyes on 2,800 lines of security-sensitive code that its own author tested — say that instead. Given it's an unauthenticated public write endpoint that sends mail, I'd actually recommend it, and `/code-review` is the better instrument than me re-reading it inline.

<!-- xgd-turn id="e8296109-ec09-49e2-990a-c155ba1d56ea-user" -->

<!-- xgd-chat role="user" ts="2026-09-11T02:10:32.980271+00:00" -->
#### You
REQ-233 is already done - you said there was additional work on your ticket (BUG-78) that was dependent on 233 please can you do that work now?

<!-- xgd-chat-end -->