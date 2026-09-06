---
uid: comment-5200935a
id: COMMENT-2286
type: comment
title: Comment on chat CHAT-39
created_by: xgd
created_at: '2026-09-05T22:42:15.049823+00:00'
updated_at: '2026-09-06T00:02:29.577363+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-998e7ab3
  kind: chat_transcript
---

<!-- xgd-turn id="5877f09b-712a-476c-a9f7-2ccbb8d1d95e-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T22:42:05.719812+00:00" -->
#### You
OK, so we have most of the infrastructure that we now need in order to start seriously discussing how to create the basic on boarding flows I need for my early beta trials.

The flow must start in my view of users in the 1stcontact app.

I think "Invite" is the wrong action - the first and more fundamental is add - so I need a "+" CTA that pops up a model to add a Contact (important naming - the general term here is no People, Users, Customers it is "Contact" - I hope our table has that name)

Next once I have them I need to "Invite" them. I am not sure that this is a general action beyond the beta flow but lets assume it will be for now. So each row in the item list needs a check box, I check N and click the "Invite" button (which should be disabled unless there is at least one box checked). Invite pops up a modal which is an email form, With a From, Subject a To-List that lists the email addresses (note this will be sent as N emails hence To-List: not To: - I'd like a mouse hover on the To-List that explains this - basically we do not want to give contact emails to each other), and a body - the body must come from a new ticket type "template" we will manually create a ticket for this for now. Critically it needs to contain a welcome message and a CTA with an button and a "cut and paste this link if that doesn't work"

The link will take them to a sign-up page - agree to the T&C (we do not have text right now - leave that until later - use Ipsum Lorem or some  place holder text - make sure it DOES NOT look like T&C) and then they should get through to the app.

Secondary flow: we also need a similar flow for when their login expires

We need a placeholder 1c site page it can say nothing for now (stealth mode ;-) ) but it should have top right a Sign In link - clicking Sign In -> modal Enter your email -> Please check your email for a sign in link. Sign in template used - clicking the link signs the user in.

Signed in user on 1stcontact.io should see the stealth mode home page with links at the top right "My Businesses", "User Portal Icon"

<!-- xgd-turn id="5877f09b-712a-476c-a9f7-2ccbb8d1d95e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-05T22:45:18.246852+00:00" -->
#### Claude
I'll survey what exists before we design this — naming, current User tab, auth, and email capability are the four things that will shape the answer.

I've surveyed the existing code. There's more here than you might expect — and two hard blockers that shape everything.

## Naming: the table is `users`, and that's deliberate

`db/migrations/0004_identity.sql` creates `users`, tenant-scoped, unique on `(tenant_id, email)`. There is no `contacts` table and there should not be one — DOC-42 §9's falsifier is literally *"a User list and a CRM list that can disagree about a person who is both"*. Contact, invited and member are **three states of one row**:

| State | Marker |
|---|---|
| contact | `invited_at` null |
| invited | `invited_at` set, `tos_accepted_at` null |
| member | `tos_accepted_at` set |

So your instinct is right at the product level and the schema already agrees with it. What changes is the **surface vocabulary** — the tab, the modals, the API responses say "Contact". One collision to settle: if the population is called Contact, state 1 can't also be called "contact". Suggest **Added / Invited / Signed up**.

## Two blockers

**1. There is no email sender in this repository.** `invitePerson` says so in its own docstring: *"AND NO MAIL IS SENT. There is no sender in this repository."* Cloudflare's `send_email` binding only delivers to addresses pre-verified in your account, so it's useless for inviting strangers. You need an ESP (Resend or Postmark) plus SPF/DKIM/DMARC on `1stcontact.io`. **This is the critical path** — DNS propagation and sender reputation have lead time that no amount of coding removes.

**2. Cloudflare Access owns login, and your flows collide with it.** Today `app.1stcontact.io` is fronted by Access with the OTP provider; `access.ts` verifies the JWT on every request and there is no cookie or session concept anywhere in the codebase. If you send an invite email with a link to the app, the invitee clicks it and gets **Cloudflare's** OTP challenge and a **second, Cloudflare-branded email** before they ever see your welcome page. And "Sign In → check your email for a sign-in link" on the 1c site cannot exist at all under Access.

So the flows as described **force the auth migration** DOC-40 §3 parks as *"Later: our own magic link"* — an `auth_tokens` table, a `sessions` table, and turning the Access policy off. That's the largest single piece of work here, and everything else queues behind it.

Worth naming the cost: Access is currently also a *cost* boundary (unauthenticated traffic never reaches the Worker). Removing it makes denial server-side. Fine at beta volume, an open question at signup volume.

## The design insight that collapses three flows into one

**The invite link and the sign-in link are the same primitive.** An invite email is just a sign-in link issued to someone whose `tos_version` is unset. They click it, get a session, and `guardTerms` — which already exists — routes them to the T&C interstitial. No separate "sign-up page" is needed.

That means one token mechanism serves: invite, sign-in, and (probably) your expiry flow. Three templates, one machine.

## What already exists

Genuinely useful amount:

- **T&C page** — `terms.ts` already serves Lorem Ipsum placeholder copy at `/terms`, with `guardTerms` blocking everything behind it and `acceptTerms` stamping `tos_version`/`tos_accepted_at`. Your "use Lorem Ipsum, make sure it doesn't look like real T&C" requirement is already met.
- **Invite** — `invitePerson` writes the row and stamps `invited_at`, correctly updating rather than inserting for an existing contact.
- **Lapse model** — `identity.ts` has `LapseReason` with four cases (`expired`, `revoked`, `not_yet`, `never_granted`) and `BusinessLapse`. Your expiry email has a data model waiting for it.
- **Portal** at `/account`, and `businessesFor` for "My Businesses".

## The gaps, concretely

| Flow piece | State |
|---|---|
| "+" Add Contact | `invitePerson` conflates add and invite. Needs splitting into `addContact` (no `invited_at`) and `invitePerson`. Small, clean, the model already anticipates it. |
| Row checkboxes + bulk Invite | `invitePerson` takes one email; needs to take N person ids. UI work in `builder/people.js`. |
| Invite modal (From / Subject / To-List / Body) | All new. |
| `template` ticket type | New type in `productTypePack()` (`tickets.ts`). Good fit — and because templates are tenant tickets, Alice gets the same capability for free, which satisfies DOC-40 §2.1 rule 1. |
| Sending | Nothing. |
| Magic link + sessions | Nothing. |
| Stealth apex with Sign In | `public-site/src/index.ts` serves `APEX_BODY = 'Hello from 1stcontact.io'` and declares *"There is no authentication"*. Making it session-aware amends that premise — cookie scoped to `.1stcontact.io` so both Workers read it. |

## Decisions I need from you

1. **Own auth now, or keep Access for the beta?** I don't think there's a real choice — the flows don't work under Access — but it's a big commitment and worth you saying so explicitly.
2. **ESP: Resend or Postmark?** And who does the DNS records — that should start today regardless of anything else.
3. **Is the invite body editable in the modal before sending?** My recommendation: prefilled from the template, editable for *this send*, and the edit is **not** written back to the template (editing a template is a different act). Also: **From should be display-only** — an arbitrary From breaks DKIM.
4. **Template placeholders** — I'd have the template declare its required tokens (`{{cta_url}}`, `{{name}}`) and have the sender **refuse to send** if one is missing, rather than mailing out a dead button.
5. **"When their login expires"** — do you mean session expiry (which the sign-in flow already covers) or **entitlement lapse** (`LapseReason`, i.e. their grant ran out)? These are different emails with different copy.
6. **Stealth page** — hardcoded HTML, or an actual published 1c site in the `1stcontact` tenant? Dogfooding says the latter; speed says the former. I lean hardcoded for now, but built so the sign-in chrome is separable, because you'll want it over a real site later.

## Suggested decomposition

Six tickets, in dependency order — the first two are the ones that block everything:

1. **Email sender** — ESP binding, verified domain, a `sendEmail` port with a no-op local implementation
2. **Own auth** — `auth_tokens` + `sessions` migration, token issue/redeem, cookie on `.1stcontact.io`, Access policy retired
3. **`template` ticket type** — schema, placeholder contract, three seed templates
4. **Contacts tab: add + bulk invite** — split `addContact`/`invitePerson`, checkboxes, invite modal, To-List tooltip
5. **Stealth apex + sign-in** — public-site session awareness, Sign In modal, signed-in chrome
6. **Lapse email** — once (5) settles what "expires" means

Tell me which of the six decisions you want to settle now and I'll write the tickets.

<!-- xgd-turn id="162f9d43-7c72-44c1-bdce-3a3615c6a6e8-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T23:13:07.291276+00:00" -->
#### You
See DOC-44 users is wrong we are deliberately changing it to Contacts. The inital state of a contact will be  a Lead.

6. A published 1stcontact site - definitely
5. We have a REQ to deal with that lets make initial tokens long lived 3 months? and figure this out a little later
4. Yes agree
3. agree that is the intent - separate UI for template modification
2. I don't understand this
1. Lets discuss

Also I missed something.  I want a ticket type "email" and I want to store all outgoinng email associated with the user we sent it to starting with the invite - these records will be visible on the Contacts/Users page

<!-- xgd-turn id="162f9d43-7c72-44c1-bdce-3a3615c6a6e8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-05T23:15:46.348500+00:00" -->
#### Claude
Read DOC-44. One correction to my last message: the three-state table I gave you is exactly what DOC-44 §3 forbids — Contact is the entity, Member is an *access* fact, Lead→Invited is a separate *pipeline* axis, and the stage is a stored value rather than something derived from which timestamps are set. REQ-188 is already `free_coded` against that shape (branch `59b9839`, not yet reconciled), so Lead/Invited and the Member axis exist in code.

## First: a sequencing problem I hit while reading

REQ-190/191/192/193/194 are sitting in `draft` and they all land in **one baseline migration**:

| | |
|---|---|
| REQ-190 | `users` → the contacts table; every key becomes opaque |
| REQ-191 | **`users.email` is dropped** — addresses move to `user_emails` with `is_primary` |
| REQ-193 | names become a table |
| REQ-194 | Account becomes a table |

This sits directly underneath everything we just designed. If I build invite / send / email-log against `users.email`, the rebaseline rewrites all of it — the To-List, the invite's identity resolution, and the `contact_id` on your new email records. And REQ-191 specifically turns "which address do we send to?" into a real question with a real answer (`is_primary`) that the invite modal needs to ask.

**Proposed split** — build the parts that barely touch the schema now, and let the rebaseline land in parallel:

- **Now, schema-independent:** email sender (a port), `template` ticket type, `email` ticket type. These are tickets and an HTTP adapter; almost nothing to rewrite.
- **After the rebaseline:** Contacts tab (add/bulk-invite), magic-link auth, published stealth site.

That way nothing gets written twice and the beta doesn't wait on the rebaseline for the slow part (DNS/domain warm-up).

## #2 — what the email question actually is

You can't send mail from a Worker. There's no SMTP: Workers have no outbound port 25, so sending is always an HTTPS call to someone else's service. Cloudflare's own `send_email` binding doesn't help — it only delivers to addresses you've **pre-verified in your account**, so it can't email a new invitee. That's the whole reason this is a decision rather than a line of code.

Two things are needed.

**a) A sending service.** You POST JSON, they deliver, they tell you about bounces.

| | Fit |
|---|---|
| **Resend** | Workers-native, simplest integration, 3k/month free. Newer company. |
| **Postmark** | Best transactional deliverability reputation, very mature, ~$15/mo for 10k. |
| **Amazon SES** | Cheapest at volume, most setup, no Workers SDK — you'd hand-roll SigV4 signing. |

**I'd take Resend for the beta.** Least work inside a Worker, free tier covers you, and if we put a `sendEmail` port in front of it the switch to Postmark later is one adapter.

**b) Three DNS records on `1stcontact.io`**, which is what makes Gmail and Outlook accept your mail instead of binning it:

- **SPF** — a TXT record naming who's allowed to send as `@1stcontact.io`
- **DKIM** — a public key in DNS; the sender signs each message with the matching private key so the recipient can prove it wasn't forged
- **DMARC** — what to do when the other two fail, and where to send reports

In practice: sign up, add `1stcontact.io` as a sending domain, they hand you 3–4 records to paste into Cloudflare DNS, click verify. Maybe 30 minutes, plus propagation. Since your DNS is already at Cloudflare it's quick.

I flagged it as critical path because it's the only piece with *waiting* in it and the only piece I can't do — it needs your account. **Also pick the From address now** (`hello@1stcontact.io`?) and whether replies go anywhere real.

## #1 — Access vs our own login

**Today:** Cloudflare Access sits in front of `app.1stcontact.io`. Someone hits it, Cloudflare bounces them to its own login page, emails a 6-digit code, sets its cookie, mints a JWT, and `access.ts` verifies it. You never touch a credential.

**What breaks with your flows:**

1. Your invite CTA points at the app. The invitee clicks → Cloudflare intercepts → asks for their email → sends a **second, Cloudflare-branded email** with a code → *then* they reach your welcome page. Two emails per invite, and the first thing a beta user sees isn't yours.
2. "Sign In → modal → check your email for a sign-in link" **cannot exist**. Access does codes, not links, and won't let you start the flow from your own page.
3. Your `template` tickets can't own the sign-in email, because Cloudflare sends it.
4. Access is free to 50 users. A beta above that starts costing per seat.

**What it's worth keeping for:** it's a genuine edge shield — bots never reach the Worker, so they cost you nothing.

**The options:**

- **(a) Keep Access, live with the double email.** Zero auth work. Kills the public-site Sign In outright.
- **(b) Own magic link, retire Access.** A `login_tokens` table and a `sessions` table; issue a token, email the link, redeem it at `/signin/<token>`, mint a session, set the cookie on `.1stcontact.io` so both Workers read it. Genuinely small — a migration and a few hundred lines. The care is all in details: single-use, constant-time compare, don't leak whether an address exists, `HttpOnly; Secure; SameSite=Lax`, and **rate-limit the issue endpoint** or it's a spam cannon pointed at arbitrary addresses.
- **(c) Both for a window, then (b).**

**I'd do (c) as the route to (b).** It's the same code as (b), and it's purely additive: `access.ts` already produces a verified identity and everything downstream consumes only that, so a session cookie becomes a second producer of the same thing. Access JWT **or** valid session admits. You keep logging in normally while the new path is half-built, then drop the policy when it's proven.

**One correction on your 3 months** — there are two different lifetimes and they want different numbers:

- the **login token** (the thing in the emailed link) — single-use. 3 months is defensible for an *invite* since people don't check mail promptly, but a sign-in link should be short. Suggest **30 days for invites, 30 minutes for sign-in**, both re-issuable.
- the **session** (the cookie) — this is the one you want at **90 days**. That's what actually defers the expiry problem: nobody in the beta gets logged out, and the lapse flow can wait as you said.

## The `email` ticket type — yes, and it does more than you asked

Every outgoing message becomes an `email` ticket in the tenant's ticket store:

```
contact_id     who it went to
template       which template ticket it rendered from
to / from / subject
sent_at
status         queued | sent | delivered | bounced | failed
provider_id    the ESP's message id
body           the RENDERED body actually sent
```

**Store the rendered body, not just a template reference.** The template changes; what you sent doesn't. The record has to answer "what did this person actually receive" months later — same reasoning that makes `TERMS_VERSION` a date rather than "v3".

What this buys beyond the history pane you asked for:

- **Bounce handling for free.** The ESP webhooks back, you find the ticket by `provider_id`, set `status=bounced` — and the Contacts list can now show a bad address, which in a beta is the single most valuable signal you'll get.
- **Resend becomes "render that template again"**, and you can see how many times you already asked.

**One question:** is the `email` ticket the **queue** or the **log**? Does Invite write N tickets as `queued` and something else sends them, or does it send and then record? I'd write the ticket first as `queued`, send, then update — about five extra lines, and it means a send that fails halfway leaves evidence instead of vanishing.

## Revised plan

**Track A — start now, schema-independent**
1. Email sender: `sendEmail` port, Resend adapter, no-op local impl, verified domain
2. `template` ticket type + placeholder contract (refuse to send on a missing token) + three seed templates
3. `email` ticket type: queue-then-send, bounce webhook

**Track B — after the rebaseline lands**
4. Contacts tab: split add-Lead from invite, checkboxes, bulk invite modal, To-List tooltip, email history pane
5. Magic-link auth alongside Access, then retire the policy
6. Published 1stcontact stealth site with Sign In

## What I need from you

1. **Resend, or do you want Postmark?** And the From address.
2. **Does the rebaseline go first**, per the split above — or do you want the beta flows on the current schema and accept rewriting them?
3. **Queue or log** for the `email` ticket.
4. Confirm **(c)** — magic link alongside Access, policy retired once proven.

Say the word on those four and I'll write the six tickets.

<!-- xgd-turn id="4eace566-66b7-4b46-b654-b2d302aa2318-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T23:18:57.532914+00:00" -->
#### You
If I build invite / send / email-log against `users.email`, the rebaseline rewrites all of it - THIS IS A DESIGN DISCUSSION DON"T BUILD ANYTHING!

<!-- xgd-turn id="4eace566-66b7-4b46-b654-b2d302aa2318-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-05T23:19:14.221322+00:00" -->
#### Claude
Understood — nothing has been built and nothing will be. I've only read files this session; no branch, no code, no tickets.

That sentence was a sequencing argument, not a plan. Let me restate it as the design question it actually is:

**Which schema do the onboarding flows get designed against?** REQ-191 drops `users.email` and moves addresses to their own table with `is_primary`. So the design has to pick one:

- **Against the current schema** — a contact has exactly one address, and "who does the invite go to" has no question in it.
- **Against the post-rebaseline schema** — a contact has *many* addresses, and the invite has to decide which one it sends to. That changes the To-List (does it show the primary, or let you pick?), it changes what "invite this contact" means, and it changes what the `email` record points at — an address, or a contact.

That's a real fork in the design and it isn't about build order. The second is the shape you've already decided you want; designing against the first bakes in the one-address assumption DOC-44 and REQ-191 exist to remove.

My view: **design against the post-rebaseline shape.** The `email` record should reference the contact *and* the address it went to, because a bounce is a fact about an address, not about a person — and that distinction only exists in the new schema.

Still open from my last message:

1. **Resend or Postmark**, and the From address
2. **Queue or log** for the `email` ticket — I lean queue (a failed send leaves evidence)
3. **Magic link alongside Access, policy retired once proven** — confirm?

And the fork above.

<!-- xgd-turn id="13ec9199-76d7-41a7-9b7d-d7bbdbc003a8-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T23:31:42.174996+00:00" -->
#### You
Plan against the future schema.

**One question:** is the `email` ticket the **queue** or the **log**? Does Invite write N tickets as `queued` and something else sends them, or does it send and then record? I'd write the ticket first as `queued`, send, then update — about five extra lines, and it means a send that fails halfway leaves evidence instead of vanishing. <-- agree

Lets do Resend

I think the Cloudflare auth sound horrible is creating our own really so hard? Surely all the code exists we just have to wire it up?

<!-- xgd-turn id="13ec9199-76d7-41a7-9b7d-d7bbdbc003a8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-05T23:32:45.358848+00:00" -->
#### Claude
Locked in: future schema, queue-then-send, Resend.

## On our own auth — your instinct is right, it's not hard

But "all the code exists, just wire it up" is the part I'd push back on. The *mechanism* is well-known and small; the *library* situation is worse than you'd expect. Lucia — which was the standard answer for exactly this shape — was deprecated by its author and turned into a set of reference implementations, i.e. "copy this code into your project". Better Auth is the live option, but it brings its own user and session tables with its own key shapes, landing directly on top of REQ-190's "no data is ever a key" rebaseline. Its user table would fight your contacts table, and you'd be adopting OAuth providers, password hashing and 2FA to get the one thing you need.

So: hand-roll it. Here's the honest size.

**Two tables**, in the same baseline as the rebaseline:

```
login_tokens   id (opaque), contact_id, email_id, purpose, expires_at, used_at, created_at
sessions       id (opaque), contact_id, expires_at, created_at, last_seen_at
```

**Four small pieces:** issue (find contact → mint token → render template → send), redeem (look up → check → mark used → mint session → set cookie), verify (read cookie → look up session → return contact), and wire (`access.ts` tries session, falls back to Access JWT). Call it 150 lines of substance plus tests.

**Three things already in this codebase make it that small:**

- `newId()` (`identity.ts:357`) already mints 128-bit CSPRNG opaque ids. That's your token generator, done.
- `admit()` already converts a verified identity into an admission, and *everything* downstream — scope, terms gate, portal — consumes only that. So you're adding a second producer, not rewiring consumers.
- `guardTerms` already handles "signed in but hasn't signed up", which is the invitee's exact state on arrival.

## The bits that are actually fiddly

Not hard, but this is where auth bugs live:

1. **Rate-limit the issue endpoint.** Without it, anyone can make your Worker email arbitrary addresses — a spam relay with your domain's reputation attached. This is the one that genuinely bites. Cloudflare's Rate Limiting binding makes it more config than code.
2. **Don't leak existence.** "Check your email" with identical response and timing whether or not we hold the address.
3. **Single-use enforced in the DB**, not in code — `UPDATE … WHERE used_at IS NULL` and check rows-affected, so two simultaneous clicks can't both redeem.
4. **Email scanners click links.** Outlook and most enterprise filters fetch every URL in a message to check for malware, which burns a single-use token before the human ever sees it. The standard fix changes your design: the emailed link lands on a page with a **Continue** button that POSTs to redeem, rather than redeeming on GET. Worth deciding now, because it changes what the invite CTA does.
5. **Cookie on `.1stcontact.io`** so both Workers read it. `HttpOnly; Secure; SameSite=Lax` — Lax not Strict, or following the link from a mail client won't send it.

## Two consequences worth noticing

**There is no sign-up flow, because there's no password.** Sign in and sign up are the same act; the only difference is whether `tos_accepted_at` is set, which `guardTerms` already decides. So the public site's Sign In modal also works for an invitee who lost their invite email — they just ask again. That collapses your first and third flows into one mechanism.

**What happens when someone signs in with an address we don't hold?** Under Access, anyone could pass the edge and get denied by `admit`. Now it's our choice: say "check your email" and send nothing, or self-signup and mint a Lead. For a stealth beta I'd say **send nothing, mint nothing** — but that's a decision, not a default.

## On keeping Access briefly

You're right that it's horrible and it should go. My only argument for the overlap is that if the magic link has a bug you're locked out of your own builder — Access is cheap insurance for a short window, not a long coexistence. If you'd rather just cut over, the mitigation is a break-glass path for your own address.

---

Two things still unanswered and I need them for the tickets:

- **The From address** (`hello@1stcontact.io`?) and whether replies go anywhere real
- **Unknown address on sign-in** — silent, or self-signup?

Plus the new one: **link-with-Continue-button, or redeem-on-click?** I'd take the button; the failure mode of the alternative is invisible and intermittent.

<!-- xgd-turn id="9b6efc77-9192-4419-9369-c4a819ee1fb3-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T23:37:57.796645+00:00" -->
#### You
Ok I want to do the auth ourselves, but I would like to do it as a lagrange-framework component. You can write the tickets, I'll implement it their and then we get a reusable system. If we need to I can do the reverse, build it here, extract it and then reconsume but that feels like much more work and it only makes sense if we don';t understand the APIs well enough.

**Rate-limit the issue endpoint.** Without it, anyone can make your Worker email arbitrary addresses — a spam relay with your domain's reputation attached. This is the one that genuinely bites. Cloudflare's Rate Limiting binding makes it more config than code. <-- why would this not have access controls? (I mean rate limit too sure but does this really need to be public?)

4. Sure - you said that before lets do it that way
5. Sure - but can't rely on the user being on the default browser or the right device

<!-- xgd-turn id="8390cca8-36bf-4a09-aef8-09fe35187914-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T23:39:20.661654+00:00" -->
#### You
Ok I want to do the auth ourselves, but I would like to do it as a lagrange-framework component. You can write the tickets, I'll implement it their and then we get a reusable system. If we need to I can do the reverse, build it here, extract it and then reconsume but that feels like much more work and it only makes sense if we don';t understand the APIs well enough.

**Rate-limit the issue endpoint.** Without it, anyone can make your Worker email arbitrary addresses — a spam relay with your domain's reputation attached. This is the one that genuinely bites. Cloudflare's Rate Limiting binding makes it more config than code. <-- why would this not have access controls? (I mean rate limit too sure but does this really need to be public?)

1. Sure - you said that before lets do it that way
2. Sure - but can't rely on the user being on the default browser or the right device

no-reply@1stcontact.io
**Unknown address on sign-in** — silent, or self-signup <-- today silent fail just drop it - tomorrow self-signup

<!-- xgd-turn id="8390cca8-36bf-4a09-aef8-09fe35187914-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-05T23:45:17.190702+00:00" -->
#### Claude
Both points are good and one of them you've already solved. Let me answer, then look at the framework before writing tickets.

Both good. Let me answer, then the component boundary, then tickets.

## Rate limiting — you're right that I blurred two things

There are **two** send paths and only one is exposed:

- **Invite send** — initiated by an authenticated operator from the Contacts tab. Fully access-controlled already. Needs none of this.
- **Sign-in issue** — this is the bootstrap, and it genuinely cannot have access controls. It's the endpoint an anonymous person hits *in order to become* authenticated; there is no credential they could present, because not having one is the reason they're calling. You can't put auth in front of the thing that grants auth.

**But your "silent fail on unknown address" decision already defused most of it.** Because we only ever send to addresses we already hold, an attacker cannot make the endpoint email arbitrary strangers — **it is not an open relay**. Your domain reputation is not exposed. The worst available attack is pestering contacts already in your database with sign-in emails.

That turns it from "reputation catastrophe" into "nuisance + ESP bill". What's left worth having:

- **Turnstile on the sign-in modal** — this is the actual answer to your question. You can't require *authentication* on an anonymous endpoint, but you can require *proof of a human in a browser*. Cloudflare-native, free.
- **Per-address limit** so one contact can't be mail-bombed.

Turnstile plus a per-address cap, both closer to config than code.

## Device / browser — two distinct failure modes

**a) Cross-device.** Request on desktop, read mail on phone, click there. You end up signed in on the phone. That's inherent and acceptable — *provided the token isn't bound to the requesting browser*. Some implementations record the requesting IP/UA/session and require a match on redeem, which is precisely what breaks this. **Design constraint: the token is bound to the address and nothing else.**

**b) In-app webview.** The Gmail or Outlook mobile app opens the link in its own embedded browser rather than the system one, cookies don't carry over, and the user gets signed in inside a webview they then close. This is the common real-world complaint and (a)'s fix doesn't touch it.

The real fix for both is what Slack does: **email a link *and* a short code.** Click the link on any device, *or* type the code into the tab you started from.

My recommendation: **ship link-only, but shape the token row so a code can be added without a migration.** The reason is your own 90-day session — if nobody signs in more than four times a year, this is a low-frequency annoyance, and the schema room costs nothing now while a migration later costs something.

## The component boundary

I looked at how `@lagrangefoundry/ticketing` is built — zero runtime deps, owns its own `SCHEMA_STATEMENTS`, one D1 injection point, ships conformance fixtures the host runs against its own binding, `PUBLIC-API.md` generated by the boundary check. The auth component follows that exactly.

**You're right that framework-first is the cheaper direction here**, and the reason is specific: `admit()` already exists and already consumes a verified identity, with scope, terms and portal all downstream of it. So the component's entire job is *"address → session"* and *"cookie → subject id"*. It never needs to know what a Contact is.

**Owns:** `login_tokens`, `sessions`, token mint/redeem, cookie serialisation.

**Two ports out** — and these are the whole surface:

- `resolveSubject(email) → subjectId | null` — the host answers it. The component must not know about contacts, addresses-as-a-table, or `is_primary`.
- `sendLoginEmail({ to, url, code })` — the host answers it. The component must not know about Resend, or about your `template` tickets.

**The one place I expect the abstraction to leak:** the cookie domain and the two-Worker split. `1stcontact.io` and `app.1stcontact.io` both reading one session is a deployment fact the framework can't own or test. The component should take cookie attributes as **configuration** rather than deciding them — that's the seam most likely to be got wrong by making it clever.

Let me check the framework's ticket store before I write.

House style noted. Writing the framework ticket.

Created **REQ-134** in lagrange-framework. One thing: the git push failed (proxy auth), so the ticket commit is local to that repo — it'll need a push when you're back on a working network.

Now the three 1stcontact tickets whose design is fully settled.

Cross-references in those bodies used placeholder ids. Fixing them to the real numbers.

Four tickets written.

| | | |
|---|---|---|
| **REQ-134** | lagrange-framework | Passwordless sessions: magic-link tokens and cookie sessions, as a component |
| **REQ-196** | 1stcontact | Email sending: `sendEmail` port, Resend adapter, verified domain |
| **REQ-197** | 1stcontact | The `template` ticket type, with a placeholder contract that refuses |
| **REQ-198** | 1stcontact | The `email` ticket type: every outgoing message is a record on the contact |

All four are `draft`. REQ-196/197/198 are designed against the post-rebaseline schema as you asked — REQ-198 in particular carries both `contact_id` and `address_id`, because a bounce is a fact about an address and only the new schema can express that.

REQ-134 captures the decisions we landed: two ports and nothing else, no address or IP stored, cookie attributes as host configuration, POST-only redemption, single-use enforced by rows-affected rather than check-then-act, `recentTokenCount` so you can rate-limit without reaching into its tables, and the `code` column reserved-but-unused for the webview problem.

Note: the framework repo's push failed on proxy auth, so REQ-134's commit is local there until you're on a working network. The 1stcontact ones committed cleanly.

## The remaining three, and what each is waiting on

**Contacts tab** (add Lead, checkboxes, bulk invite modal, email history pane) — blocked on the rebaseline. One design question I can't answer for you: now that a contact has *several* addresses, does Invite silently use the primary, or does the To-List let you pick? Silent-primary is simpler; picking is the thing you'll want the first time someone says "use my work address."

**Consuming the auth component** (wire the two ports, retire Access) — blocked on REQ-134 existing. One thing to decide before it's written: **break-glass.** If we take the Access policy off and the magic link has a bug, you're locked out of your own builder. Either keep Access on your address only for a window, or there's a documented recovery path.

**The published stealth site** — this one has a genuine design question rather than a dependency. You want it to be a real published 1c site, which means the content is *authored*, not coded. But the Sign In control and the signed-in chrome ("My Businesses", portal icon) are application behaviour. So: does the Worker inject that chrome into any published site it serves on the apex, or does the site get a component slot the builder can place? The first is quicker; the second is the thing that generalises, and REQ-192-era work on behavior modules in L1 slots may already be the mechanism.

Tell me how you want the addresses handled and the chrome question, and I'll write those two. The auth-consumption ticket I'd hold until you've built REQ-134 and know what its surface actually looks like.

<!-- xgd-turn id="b2b1e073-26ae-461c-9ca7-31b36e7b72e9-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T23:59:59.757890+00:00" -->
#### You
does Invite silently use the primary - yes - there must be a clearly defined default address use that.
ok we can keep Access as an alternative - but I'm the only one to use it - probably an acceptable long-term state

That is expected behavior for ANY 1c site - we may allow L1 to put the account portal icon and the sign in link in different locations and we should certainly allow them to get different styles but they are features of ALL 1c sites - actually I take that back - there may be sites with NO users  - so they are features of any sites which have users. OK?

<!-- xgd-turn id="b2b1e073-26ae-461c-9ca7-31b36e7b72e9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-06T00:02:29.377429+00:00" -->
#### Claude
Yes, OK — and that's a better framing than mine. Let me check the module mechanism exists before I write it that way.

Mechanism confirmed — `packages/framework/src/l2/` with `contact-form` as precedent and a preset registry keyed by behavior id. Your framing drops straight into it.

One constraint your generalisation surfaces, which I'll write into the ticket: the session cookie's `Domain` is host configuration in REQ-134, and a customer site on `alicesplumbing.com` **cannot read a `.1stcontact.io` cookie**. So sessions are per-cookie-domain — sites on `*.1stcontact.io` share one, a custom domain gets its own. Fine for the beta, but nothing may be built assuming a global session.

All six tickets are written.

| | Repo | Ticket |
|---|---|---|
| **REQ-134** | lagrange-framework | Passwordless sessions: magic-link tokens and cookie sessions, as a component |
| **REQ-196** | 1stcontact | Email sending: `sendEmail` port, Resend adapter, verified domain |
| **REQ-197** | 1stcontact | The `template` ticket type, with a placeholder contract that refuses |
| **REQ-198** | 1stcontact | The `email` ticket type: every outgoing message is a record on the contact |
| **REQ-199** | 1stcontact | The Contacts tab: add a Lead, invite a selection, see what was sent |
| **REQ-200** | 1stcontact | `account-chrome`: Sign In and account portal as an L2 module on any site with accounts |

All `draft`. Your three answers went in as written:

- **REQ-199** sends to the primary address only, and *refuses by name* when a contact has none rather than falling back to "the first one" — with the other selected contacts still sending. REQ-191's partial unique index means the default address is a schema guarantee, not a rule the tab maintains.
- **REQ-200** is built as an L2 behavior module next to `contact-form`, registered in `l2/presets.ts`, placeable in any L1 slot, with a preset so a site can use it without authoring L1. Enabled by declaration per site — I wrote in why it can't be derived: the first member signs up *by using the Sign In control*, so deriving from "has members" would hide it precisely when it's needed.
- I took your "My Businesses" correction one step further. Rather than a platform special case, the builder link appears when the signed-in person **operates at least one business** — a fact about the person, not the site. That makes it a general rule that happens to be true of one person today, and an agency customer would see it and be right to. The module carries an explicit falsifier against any branch on *which* site or business it's rendering for.

Access staying as your personal alternative is fine and I'd stop calling it break-glass — it's a second supported identity producer, and `access.ts` already returns the same verified identity `admit()` consumes, so it costs nothing to keep.

## What's left

**The auth-consumption ticket** — wiring 1stcontact's two ports (`resolveSubject`, `sendLoginEmail`) to REQ-134 and standing the sign-in routes up. I've deliberately not written it: it should be written against the component's actual surface once you've built it, not against my guess at it. REQ-200 assumes only that a session exists and that its cookie domain is configurable.

**Two things that don't need a ticket and are worth starting now:**

1. **The Resend domain setup.** It's the only item with waiting in it, and it gates any end-to-end test of REQ-197 through REQ-200.
2. **REQ-134's commit is still local** — that repo's push failed on proxy auth.

**One sequencing note:** REQ-199 depends on the rebaseline (REQ-190/191) landing, since it's written against multiple addresses and `is_primary`. REQ-196, 197, 198 and 200 don't — they can proceed in parallel.

<!-- xgd-chat-end -->