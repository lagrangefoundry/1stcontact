---
uid: comment-e8891c59
id: COMMENT-3001
type: comment
title: Comment on epic EPIC-5
created_by: xgd
created_at: '2026-09-15T00:39:51.674778+00:00'
updated_at: '2026-09-15T21:53:14.076823+00:00'
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

<!-- xgd-chat-end -->