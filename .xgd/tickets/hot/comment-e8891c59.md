---
uid: comment-e8891c59
id: COMMENT-3001
type: comment
title: Comment on epic EPIC-5
created_by: xgd
created_at: '2026-09-15T00:39:51.674778+00:00'
updated_at: '2026-09-15T23:11:31.563112+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: epic-c5175c8f
  kind: chat_transcript
---

<!-- xgd-turn id="e75729eb-a1aa-4793-8a34-64ecab6869c6-user" -->

<!-- xgd-chat role="user" ts="2026-09-15T00:39:24.117178+00:00" -->
#### You
ok lets start to discuss the product specs for this ticket.

I want to start by expanding the scope slighty - there is a related requirement to choose the 1stc.site hostname. That's a user experinence that we need to design, and the first piece of this epic that I would like to take on - but before we dive into those details lets talk about the broader questions

I believe we have basically the following scenarios:
1. User has no domain - they use domain.1stc.site that is the first experience we will build - I think the only thing here is a UX to choose a unique name
2. User bought a domain through us - domain registra functionality is a whole separate epic with a lot of details to handle BUT we have multiple sites today where I own the domain (on my cloudflare account) and I would like to publish those sites and I think that is the same situation as if the user bought the domain from us
3. User owns a domain through some provider. I believe this is (a) we need a flow to move their DNS to us and then (b) this becomes the same as 2.

A special case of 3 is where the users domain's registra is Cloudflare but I don't actually a separate case, I think its the same based on what we discussed earlier. We will need to provide detailed instructions with screenshots of how to do the change.

So (1) is just a UX experience
(3)a is its own flow, copy the current state, document how to change, let the AI guide the user - tools for checking success etc.
(3)b is 2 (please confirm)

So I would like to discuss (2) what management do we need to expose to the user? I think would like the answer to be just a selector - here is the list of domains that we control the DNS for you. please select which one this site should be published on...

Interestingly (1) the list as at an account level not a business level (2) we need to manage exclusivity - one site per domain

As we configure web, we should also configure email send to go through out resend system.

How you should respond:
 - do you agree with the framing? Any big categories of functionality I missed
 - can we discuss first what config is needed for 2

<!-- xgd-turn id="e75729eb-a1aa-4793-8a34-64ecab6869c6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-15T00:43:50.412627+00:00" -->
#### Claude
Read the ticket, REQ-238, the `site_domains` migration, and `apps/control-app/MAIL.md`. Here's where I agree, where I'd cut the framing differently, and what I think the config for (2) actually is.

## First, a useful fact about your "first piece"

REQ-238 (*The 1stc.site hostname: chosen once, and required before publishing*) is already `free_coded` / `ready_to_reconcile` with two commits. It shipped `site_domains`, `check`, `claim`, the reserved-name refusals, revocation, and the publish gate. Its own closing note says:

> **The gap:** REQ-239 built the Settings pane and deliberately left the hostname field out... nothing owns building the field. Where it goes — appended to REQ-239, or its own ticket — is the operator's call.

So scenario (1) really is UX-only, literally: one field on an existing pane calling two existing operations, plus the assistant wiring so it can propose names that are actually free. That's the smallest possible first piece and you've already paid for the hard half.

## The framing

**3(b) = 2: confirmed.** Once nameservers point at us the zone is in our account and the record surface is identical — that's the epic's own "all paths end in the same place." No disagreement.

**But I think the three-way split is cutting on the wrong axis for design purposes.** "Who owns the domain" decides *billing and transfer authority* — which is EPIC-6, not here. What decides the work in *this* epic is a different question:

> **Is there a live business on this domain today?**

That cuts across all three of your scenarios. A domain bought through us is green field: write the records, done, nothing to break. A domain you already own that's been sitting parked is also green field. A domain that is currently running the customer's email and their old Wix site is the dangerous case — and it can arrive via (2) *or* (3). The entire snapshot/DKIM-probe/SPF-merge apparatus in the ticket exists for that case and is dead weight for the others.

Your own case is instructive: you own domains on your Cloudflare account and want to publish sites on them. Some of those probably have mail configured and some don't, and the flow should behave differently — not because of how you acquired them, but because of what's on them.

I'd restate it as: **one on-ramp (get the zone into our account), one gate (is anything live on it), one config surface (pick a domain, sending on/off).**

## Categories I think are missing

**1. Which *host*, not which domain.** `alicesplumbing.com` or `www.alicesplumbing.com`? The selector answers "which domain" and leaves this open. My recommendation: **don't ask** — serve the apex, redirect `www` → apex, write both. One decision, made once, right for essentially every small business, and a question no customer can meaningfully answer. It only becomes a real question when the apex is already occupied by their existing site, and then the honest form is *"your main address is in use — shall we put the new site on a subdomain while you decide?"*, which they can answer.

**2. `site_domains` has no canonical/redirect distinction, and www needs one.** The table as built maps host → site, full stop. The moment two hosts point at one site (apex + www, or a second domain they also own), something has to say which is *the* address — for redirects, for SEO, and for anything that constructs a URL. DOC-45 §4's "a site has exactly one address" is a statement about the canonical one, not about how many hosts resolve. This is a real schema gap and it's cheap now.

**3. Your exclusivity rule is slightly too strong.** The unique index on `host` already gives you "one site per host," globally, enforced by the database. "One site per *domain*" would additionally forbid `alicesplumbing.com` → site A and `shop.alicesplumbing.com` → site B, which is a legitimate case (DOC-45 §2.3 already commits to several sites per business) and is also the natural way to trial our site on a domain whose apex is still running their old one. I'd keep the constraint at the host level, which costs nothing because it's already there.

**4. Custom domains are *not* final, and the asymmetry needs stating out loud.** The 1stc.site finality rule exists because that namespace is scarce, public and first-come. Your own domain is none of those. You must be able to move it between sites, take it off a site, and take it away entirely. So `site_domains` needs a release/reassign path for `kind='custom'` that is explicitly forbidden for `kind='platform'` — same table, opposite rules. If that isn't written down somebody will apply the finality rule uniformly because it's the one already implemented.

**5. Offboarding.** The zone lives in our account. When a customer leaves, it has to go back — zone deleted from ours, they repoint nameservers at whoever's next. That's DNS work, so it belongs here even though the registrar half (transfer-out, auth codes) is EPIC-6. It's also the thing that makes "move your nameservers to us" an acceptable ask: the answer to *"can I leave?"* has to be yes, and demonstrably.

**6. The waiting is a first-class part of the UX, and there are three separate waits.** Nameserver propagation (hours), certificate issuance (minutes, after the zone is active), and Resend domain verification (minutes). Each can fail independently and each needs its own "checking… done" state. The ticket covers the first one well; the other two are currently invisible and will read as "it's broken" when they're just slow.

**7. Ownership proof.** Worth writing down that there isn't one and doesn't need to be: you cannot change nameservers without registrar access, so the nameserver change *is* the proof. Otherwise somebody will build a TXT-verification step out of habit.

## Config for (2)

I agree with your instinct, and I'd go further — **it should be less than a selector's worth of config.** The user-facing surface is three things:

| Control | Default | Why it's exposed |
|---|---|---|
| **Which domain** — a selector over the account's pool | none | the only genuine choice |
| **Send email from this domain** — one toggle | on | changes what recipients see; has a real failure mode |
| **Release** — take it off this site | — | makes the relationship reversible |

Everything else is machinery and must never surface as a field: A/AAAA vs CNAME, the www redirect, the certificate, SPF/DKIM/DMARC values, the propagation wait, the Cloudflare zone id. If a customer is being shown a record type, we've failed.

**The data model I'd propose** — two objects, and one of them already exists:

- **`zones`** — new, and **account-scoped, as you said.** `(id, account_id, apex, cf_zone_id, assigned_ns, status, created_at)`. Account-level is right and the reason is already in the schema: `entitlements` is account-scoped because payment is an account concern, and a domain is a thing you paid for. A business is where sites live; an account is where money and assets live.
- **`site_domains`** — exists. The assignment is a row with `kind='custom'`, plus the canonical/redirect field from point 2 above. Exclusivity falls out of the unique index already in the migration.

The selector's query is then: *zones for this account, `status='active'`, minus hosts already claimed by another site.* One join, no new exclusivity logic.

**Authorization is the one thing the selector hides.** The pool is account-level but the assignment happens inside a business. Can a business member who isn't the account owner point one of the account's domains at their site? I'd say no — the pool is visible and selectable only to whoever holds the account, and a non-owner member sees "ask the account owner to attach a domain." Otherwise a member of one business can consume an asset belonging to a sibling business.

## Email — better news than the epic implies

I read `apps/control-app/MAIL.md`. Resend's record set on `1stcontact.io` is:

| Name | Type | Collides with existing mail? |
|---|---|---|
| `send.<domain>` | TXT (SPF) | **no** — own subdomain |
| `send.<domain>` | MX (`feedback-smtp...`) | **no** — own subdomain |
| `resend._domainkey.<domain>` | TXT (DKIM) | **no** — own selector name |
| `_dmarc.<domain>` | TXT | **yes** |
| apex | TXT (SPF) | **yes**, if we touch it |

Resend deliberately isolates its return-path onto `send.`, which means **turning on sending for a customer domain does not require touching their apex SPF or their MX at all.** Three records under names nobody else uses. That defuses the single biggest footgun in the ticket for this particular use — the SPF-merge rule stays a rule, it just doesn't fire here.

The one genuinely dangerous record is **DMARC**, and in a direction the ticket doesn't currently name: publishing a DMARC policy on a domain that already sends from Mailchimp, Outlook, or a booking system can start binning *their existing mail*, not ours. So: write `_dmarc` only if absent, only at `p=none`, and never tighten it on a domain we didn't start from zero.

The product question underneath — and I don't think it's settled anywhere — is **whether we want to send as their domain at all.** Sending lead notifications from `alicesplumbing.com` is better for trust and deliverability. It also entangles our sending reputation with theirs in both directions, and it means their domain is configured for sending by a party they can't see. The alternative (send from ours, with their name in the display name) is safer and slightly worse. Worth deciding deliberately rather than by default.

## One question back, and it's operational

**Which Cloudflare account are your domains in right now?** If they're in the same account the platform's Workers are in, case (2) is real today and needs only zone-listing plus the selector. If they're in a personal account that isn't the platform's, then by the epic's own reckoning they are case (3) — the trap case — and the zones have to be deleted and re-added, which reassigns nameservers. That's worth doing once by hand as operator work rather than building a flow for, but it changes what "the first real custom domain" costs and it's better known now than discovered mid-build.

I haven't touched the ticket yet — say the word once you're happy with the framing and I'll fold the agreed parts into the body (the live-vs-greenfield axis, the canonical/redirect gap, the custom-vs-platform asymmetry, the Resend finding, and the three waits), and we can then go deep on the 1stc.site UX as the first piece.

<!-- xgd-turn id="b2943e3a-d43b-4386-b3cd-f03f579fbdd4-user" -->

<!-- xgd-chat role="user" ts="2026-09-15T21:53:13.541921+00:00" -->
#### You
They are in the same account that everything is running from.

Question: how do we know to associate certain domains with a particular account?

<!-- xgd-turn id="b2943e3a-d43b-4386-b3cd-f03f579fbdd4-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-15T21:54:30.308549+00:00" -->
#### Claude
Good — that removes the trap case for your own domains entirely. They're already in the right Cloudflare account and already active; nothing has to move.

## The short answer: Cloudflare can't tell us, so we record it at the moment of intent

There's no field on a Cloudflare zone that means "this belongs to customer 47." Everything in the account looks equally like ours, because it *is* ours — that's the whole point of the model. So the association is a fact we write down, and the only reliable source for it is **how the zone got there.** There are exactly three ways, and each one has an account identity present at the moment it happens:

| How the zone arrives | Where `account_id` comes from | Ambiguity |
|---|---|---|
| **We registered it** (EPIC-6) | the account that paid | none — it's a property of the purchase |
| **They pointed nameservers at us** | the logged-in account that started the flow | the interesting case, below |
| **Operator attaches an existing zone** | an operator names the account | none — human decision, recorded |

The third is your case: your domains are already there, so attribution is a **backfill**, not a flow. One operator route, run once. Not worth designing a customer experience around.

## The second case is where the design actually lives

The sequence has a chicken-and-egg in it: we can't tell them which nameservers to use until the zone exists in our Cloudflare account, because Cloudflare assigns the pair when the zone is added. So the zone must be created *before* any proof of ownership exists.

Which means the association is created by a **claim**, and confirmed by a **proof**, and they're separated in time:

- **Claim** — customer types `alicesplumbing.com` while logged in. We create the Cloudflare zone, write `zones(apex, account_id, status='pending')`, and hand back the assigned nameserver pair. Nothing is proven.
- **Proof** — the nameservers actually change. **This is the proof, and it's a good one**: you cannot repoint nameservers without registrar access. Cloudflare flips its own zone from `pending` to `active` when it observes the change, so we don't implement the check — we mirror it.

This is structurally identical to REQ-238's `check`/`claim` split, which is a good sign. There, a check reserves nothing and the unique index is the authority. Here, a claim proves nothing and the nameserver change is the authority. Same shape, same reasoning.

## The squatting problem, and why it's smaller than it looks

If claiming creates a zone, what stops someone typing `google.com`? Two things, and they cover most of it:

**Cloudflare refuses outright** if the zone is active in another Cloudflare account — which is precisely the mechanism the ticket already describes as making case (3) painful. So every domain already on Cloudflare anywhere is simply unclaimable. That's a large fraction of the domains worth squatting.

**For the rest, the claim is weak and expires.** A `pending` zone that never sees a nameserver change is deleted after some window (14 days feels right) and the apex returns to the pool. The real cost of a squat is that it locks the apex inside *our* Cloudflare account, since CF allows one zone per apex per account — so a second, legitimate claimant hits "that domain is already being set up." That's rare enough to be a support path rather than a self-service one, and an operator release covers it.

What I'd avoid is adding a separate ownership-verification step (a TXT record, an email to `admin@`). It's a second proof of the same fact, it adds a step to the one flow that already has the most steps in it, and the nameserver change subsumes it completely.

## A property this ordering gives you for free

Because the zone exists in `pending` before cutover, we get a window where **the zone is ours and populated, but nothing resolves from it yet.** That's exactly the window the preservation work needs:

1. Create the zone (pending) — we now have somewhere to write.
2. Sweep their live DNS from outside, against their *current* authoritative nameservers, plus Cloudflare's own scan, plus the DKIM selector probing the ticket describes.
3. Write everything into the pending zone, including our records.
4. *Then* show them the nameservers.

By the time they paste, the zone is already a complete copy of what's live plus what we're adding. The cutover becomes a no-op in terms of what resolves — which is what makes "their mail survives" a structural property rather than something we're hoping for. The current ticket describes snapshot-and-copy but not this ordering, and the ordering is the thing that makes it true.

## Two hard guards

**`1stc.site` and `1stcontact.io` must be permanently unattributable.** They're in the same Cloudflare account and they'll show up in any naive zone listing. `1stc.site` in particular holds *every* customer's platform hostname — attributing it to one account would hand that account the whole namespace. I'd want this as an explicit deny list in code, not just "an operator wouldn't do that."

**A zone with no `account_id` is selectable by nobody.** Default closed. This also gives you the drift check for free: list Cloudflare's zones, diff against the table, and anything in Cloudflare with no row is either a platform zone or a mistake — and someone adding a zone by hand in the dashboard is a thing that will happen.

## Schema, concretely

```
zones(
  id,               -- our surrogate, `zon` prefix
  account_id,       -- NULL = unattributed, selectable by nobody
  apex,             -- UNIQUE
  cf_zone_id,       -- Cloudflare's, for API calls
  assigned_ns,      -- the pair we showed them
  origin,           -- 'registered' | 'nameserver' | 'operator' | 'platform'
  status,           -- 'pending' | 'active' | 'released' | 'revoked'
  claimed_at, activated_at
)
```

`origin` earns its place: it's the provenance that answers the question you asked, and it's also what the offboarding path needs (a domain we registered leaves differently from one they pointed at us). `status` mirrors Cloudflare's rather than inventing a parallel one.

---

Want me to fold this into the EPIC-5 body now — the provenance model, the claim/proof split, the pre-cutover ordering, and the two guards — before we move on to the 1stc.site UX?

<!-- xgd-turn id="2db4b397-08eb-4229-81a3-06596cdadac9-user" -->

<!-- xgd-chat role="user" ts="2026-09-15T22:25:24.450502+00:00" -->
#### You
yes

<!-- xgd-turn id="2db4b397-08eb-4229-81a3-06596cdadac9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-15T22:27:30.453956+00:00" -->
#### Claude
Folded into EPIC-5 as a dated design-session section appended to the body — original 7,956 chars all preserved, now 24,651. Document change only, so no branch or UAT.

**What went in:**

- **The operator's domains are in the platform Cloudflare account** — recorded as settled, with the consequence that the trap case doesn't apply to them and on-ramp 2 is buildable first.
- **The axis correction** — live-vs-greenfield cuts across the three on-ramps rather than along them; the preservation apparatus exists for one case only.
- **Provenance** — Cloudflare can't tell us, so we record it at arrival; four origins, and the note that provenance is what offboarding reads rather than bookkeeping.
- **`zones`** — the schema, account-scoped with the `entitlements` precedent as the argument, and `status` mirroring Cloudflare's rather than computing a second one that can disagree.
- **Claim and proof** — separated in time, nameserver change is the proof, and the observation that this is REQ-238's `check`/`claim` shape appearing a second time. Includes the explicit *don't build a TXT verification step* as a written refusal.
- **Squatting** — Cloudflare's own refusal plus a 14-day expiry, with operator release rather than self-service (self-service would hand the squatter a second lever).
- **Pre-cutover ordering** — the four-step sequence, and why it makes "their mail survives" a property of the order rather than an intention. Also gives the mechanism behind the existing "must not be reachable on its own" rule.
- **Two guards** — `platform` origin unattributable in code, NULL `account_id` selectable by nobody, drift check falls out.
- **The config surface** — three controls, the selector query, and "if a customer is being shown a record type, we have failed" as the standard. Plus the authorisation point the selector hides.
- **Three gaps in REQ-238's table** — canonical/redirect, finality-is-platform-only, exclusivity-is-per-host.
- **Resend** — the collision table, `send.` isolation as the reason sending can ride along with the web records, and `_dmarc` as the one dangerous record in a direction the epic hadn't named.
- **Three waits**, **offboarding**, eight new falsifiers, and Open question 3 narrowed rather than answered.

One new open question added: whether we want to send as the customer's domain at all. The toggle assumes yes; that assumption is now visible rather than buried.

Ready to go at the 1stc.site UX whenever you are. Worth knowing before we start: REQ-238 left that field explicitly homeless — its closing note says whether it appends to REQ-239 as a further commit or gets its own ticket is your call, so that's the first thing to decide.

<!-- xgd-turn id="953b1390-7520-47ad-9115-0982ad5ef3a4-user" -->

<!-- xgd-chat role="user" ts="2026-09-15T22:52:34.584769+00:00" -->
#### You
Lets talk about the 1stc.site UX and AX

1. Hitting "publish" should fail if the user has neither a domain of their own or a 1stc.site configured. The failure should be in a popup modal.
2. Lets keep the ux simple - something like "Your free domain: {text box}.1stc.site [CHECK AVAILABILITY] 
3. Hitting the check availability CTA triggers one of two lines to appear underneath A - "{RED X} Sorry xxxx.1stc.site is taken - try something else or ask the AI for help" B - "{GREEN CHECKMARK} xxxxx.1stc.site is available [LOCK IT IN]"
4. Hitting the [LOCK IT IN] CTA opens a modal "You have chosen xxxxx.1stc.site as your free 1st Contact domain. Are you sure this is correct? Once you hit OK this is locked in for this site and cannot be undone. [Cancel] [OK]
5. The AI should have a tool that gives them access to the availability check API they can help the user by suggesting lists of names that are available. 

I think (1) is a ticket, 2,3,4 is another ticket and 5 is a third - agree?

<!-- xgd-turn id="953b1390-7520-47ad-9115-0982ad5ef3a4-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-15T22:54:42.400231+00:00" -->
#### Claude
Dug through the existing code before answering, and it changes the split.

## (5) is already built and wired

`check_hostname`, `claim_hostname` and `read_addresses` are live on the settings assistant surface today — `tools/generate/src/cli/ai/settings-surface.json`, implemented at `settings-core.ts:322-356`, bound to the real functions at `business.ts:425`. It's not a stub. It has:

- a `ReadAddresses` group whose description is *"a check is a question, asked as many times as you like"*
- a sequence, *"Your client wants their site to have a public address"* → `read_addresses` → `check_hostname` → `claim_hostname`, with the note that you may check several candidates before saying anything *"so that what you offer is a short list of names that are actually free"* — exactly the behaviour you're asking for
- an `absences` entry, *"Choosing a hostname for them"*, so it proposes and checks but never claims on the customer's behalf
- per-refusal guidance for taken / reserved / invalid / already-held

So no ticket. Worth a manual run against a real conversation to confirm it behaves, but there's nothing to build.

## (1) is smaller than it sounds — the refusal exists, the modal doesn't

`POST /api/publish` already refuses with 409 and a sentence naming both fixes (`router.ts:3093`, gate at `publishSite`). What happens to it today: `app.js:541` calls `block.fail(message)`, which puts the text in the publish progress block. So the behaviour is right and the presentation is wrong.

That reshapes the ticket from *"make publish fail"* to **"render the existing refusal as a modal that offers the way out"** — and the design content is in that second half. A modal that only says no is a dead end. It should carry a button that takes you to the hostname field, because the customer who hits this is by definition someone who doesn't know what an address is.

## So: two tickets, not three

| | |
|---|---|
| **A** — Choosing the hostname: the field, the check, the lock-in | your 2, 3, 4 — one interaction, splitting it would ship a Check button leading nowhere |
| **B** — Publish refuses without an address, and the refusal offers the way out | your 1, but as presentation over an existing refusal |

A first, so B's "take me there" button has somewhere real to point.

## Eight things the spec doesn't cover yet

Most are small; three I'd argue about.

**1. "Your free domain" is the wrong noun, and it will cost us later.** It isn't a domain, and when EPIC-6 lands and the customer goes to connect `alicesplumbing.com`, they'll say *"but I already have a free domain."* We'd be teaching the word we then have to unteach. `Your free web address` keeps the commercially useful word and drops the wrong one. This is the one I'd push hardest on — it propagates into the assistant's vocabulary, the docs, and support.

**2. There are three refusals, not one.** The server already distinguishes them and the spec collapses them into one red line:

- **taken** (409) — "somebody has it" → try something else
- **reserved** (400) — `mail`, `admin`, `api`... kept for the product → *not* taken, and a variant will also be refused
- **invalid** (400) — broke a syntax rule → the refusal names which rule

Telling someone `mail` is *taken* sends them hunting for `mail2`, which is also refused. The distinction is free — it's already on the wire.

**3. "ask the AI for help" as plain text is a dead end.** It names help you then have to go find. Either make it a link that opens the chat primed with the candidate they just tried, or cut the clause. Given (5) is already built, the link is the cheap half.

**4. The already-held state is the common one and isn't in the spec.** A business that has claimed shows no text box — it shows `alice.1stc.site` and says it's permanent. Most businesses are in this state most of the time.

**5. Non-owners hit a 403 at lock-in.** `claim` is owners-only (`router.ts:2928`). As specified, a `support` member types, checks, gets a green tick, hits Lock It In and is refused. The section should be read-only for them with a sentence saying who can do it.

**6. "locked in for this site" should say business.** REQ-238's rule is one platform address per *business*. Minor wording, but it's a promise we'd be making in the one modal that can't be undone.

**7. `[OK]` is the weakest possible label for the most irreversible action in the product.** Name the act: `Lock in alice.1stc.site`. And default focus on Cancel.

**8. The check→claim race needs a defined landing.** Two people can be told `alice` is free in the same second; the loser is refused at claim, *after* passing the confirm modal. REQ-238 supplies the sentence — *"that one went while you were deciding"* — so: close the modal, return to the field, show that line.

**On the Check trigger:** REQ-238 says the field calls check *"on every return press"*, so Enter should fire it as well as the button. Not a change to your spec, just the part of it already written down.

---

Want me to write A and B up as tickets under EPIC-5 now? I'd fold the eight points into A's body as behaviour rather than leaving them as review comments, since every UAT has to trace to ticket language. Tell me where you land on "free domain" vs "free web address" first — that wording goes in the body and then into the assistant surface, so it's cheaper to settle before I write than after.

<!-- xgd-turn id="95c97dc5-8ed4-419b-b756-361d9e63da86-user" -->

<!-- xgd-chat role="user" ts="2026-09-15T23:11:31.486159+00:00" -->
#### You
**3. "ask the AI for help" as plain text is a dead end.** It names help you then have to go find. Either make it a link that opens the chat primed with the candidate they just tried, or cut the clause. Given (5) is already built, the link is the cheap half. <-- Lets refine later please one step at a time get the basics working

**5. Non-owners hit a 403 at lock-in.** `claim` is owners-only (`router.ts:2928`). As specified, a `support` member types, checks, gets a green tick, hits Lock It In and is refused. The section should be read-only for them with a sentence saying who can do it. <-- you have totally lost me - only owners see the app - what are you talking about?

Agree on the other points

<!-- xgd-chat-end -->