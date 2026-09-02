---
uid: comment-0475401d
id: COMMENT-2157
type: comment
title: Comment on chat CHAT-36
created_by: xgd
created_at: '2026-09-02T21:22:45.844195+00:00'
updated_at: '2026-09-02T23:14:25.445925+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-b2147b5c
  kind: chat_transcript
---

<!-- xgd-turn id="e01ade04-f0bb-4f6b-9af1-de454f406939-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T21:22:33.602353+00:00" -->
#### You
I encountered this question in thinking about the library tab. However it extends to all our tabs. I wanted to talk it through. So let's think about the functionality that we are proposing for first contact:
Site

<!-- xgd-turn id="e01ade04-f0bb-4f6b-9af1-de454f406939-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T21:23:28.614159+00:00" -->
#### Claude
Your message got truncated — it ends at "Site" with nothing after it. So I have the setup ("this question came up on the Library tab but it generalises to all tabs") but neither the question nor the functionality list.

While you retype, here's the ground state so you don't have to re-establish it:

**Shipped today** — exactly two tabs, in `apps/control-app/src/builder/config.js`:
- `SITE_TAB` — a `webui/split`: chat left, preview iframe right. Scoped to *one site*.
- `LIBRARY_TAB` — `webui/list-detail` over the client's material tickets. Explicitly **tenant-wide, not site-scoped**, and deliberately placed beside the site tab rather than inside it (the comment cites DOC-38 §7.7 / DOC-10 §4.1 — a client's second site shares one Library).

**Proposed but unbuilt**, from DOC-4's MVP scope: CRM Lite (leads/customers/follow-ups/conversations), invoicing & payments, the user portal/subscriptions, and monitoring. Each of those is a plausible future tab, and each has a different scope answer — leads are arguably per-site (which form did they come from?) while customers, invoices and the account are clearly tenant-wide.

That scope question — *what is this tab about: the site, the tenant, or something else* — is the one the Library forced you to answer first, and it's the one I'd guess generalises. But say it in your own words; I don't want to answer a question you didn't ask.

<!-- xgd-turn id="9c531e7d-6e48-463a-b167-7b3fc92cd41f-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T21:32:52.131042+00:00" -->
#### You
I encountered this question in thinking about the library tab. However it extends to all our tabs. I wanted to talk it through. So let's think about the functionality that we are proposing for first contact: 

- Site

- Library
  - site 
   - CRM
   - Marketing
   - Monitoring
   - Payments
   - Scheduling (this is new)
  
  I think all of these are going to be specific to a site in most cases. Take my example I want a site for first contact which will have customers and payments and customer portal and monitoring and I will have a site for XGD which will have different customers and different payments and different monitoring.  It is conceivable that there are documents that I might want to see on both sites but this is a very narrow use case I think all our functionality is site-specific for v1. Maybe there is a world in which the are complicated business ecosystems which will have multiple sites for multiple products but share customers? I don't think that is our core use-case.
  
  There are tabs that would not be site specific. I can think of one which we might call "Account" that would be the site owner account details, billing etc. - at some level this is not even a 1stcontact app tab (although it would appear as one) it is a 1stcontact site customer portal. 
  
  So, there are two questions one how do we model this as a data structure two what is the user experience. Let's take them in reverse order.
  UX options
  (1) We promote the "site selection" capability to the top menu (first item) and it applies across all tabs
  (2) We have a site selector in each tab
  
  I strongly favor (1) I will have jobs to be done that are site specific and involve multiple tabs. Having to reselect the site I am on on a per tab basis sounds painful. I'm ok with Account being an anomaly in this model.
  
  How do we model us in the back end? Do we already have this capability? Library has "used on"? Should we have site <--> tenant and allow an account to be associated with multiple tenants?

<!-- xgd-turn id="9c531e7d-6e48-463a-b167-7b3fc92cd41f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T21:34:59.098376+00:00" -->
#### Claude
Both questions are answerable from what's already in the schema, and the second one has a sharper answer than the two options you laid out. Let me take them in your order.

## UX: (1), and the Account anomaly can disappear entirely

Agree with the global selector, for exactly the reason you gave — the jobs-to-be-done cross tabs. "A lead came in from the contact form, is the form still working, did they pay" is one job spanning CRM, Monitoring and Payments, all about one site. Re-selecting per tab is the same failure as a filter that resets on navigation.

But I'd go further than "I'm OK with Account being an anomaly." The convention that every multi-project SaaS has converged on puts **the scope switcher on the left of the header and the account behind the avatar on the right**. Account isn't a tab that breaks the rule — it isn't a tab. That gives you:

- tab strip: uniformly site-scoped, no exceptions to explain
- header left: site selector, applies to the whole strip
- header right: avatar → account, billing, sign out

And it matches what Account actually is in your own framing: not a 1stcontact app surface, but the customer portal of the 1stcontact *site*. Putting it in the tab strip would be the only place in the product where the selector silently doesn't apply, and users read a disabled/ignored control as a bug.

## Back end: two questions are being conflated

The question "is CRM site-specific?" is really two:

1. **Where does the data live** — the isolation boundary, the deletion unit, the billing unit.
2. **What is the default filter on the working view** — what the operator is looking at right now.

Your reasoning ("my 1stcontact customers aren't my XGD customers") is entirely about (2). Making it drive (1) is the expensive direction, because (1) is a schema-and-billing migration to undo and (2) is a `WHERE` clause.

**Recommendation: tenant stays the account; site becomes a scope axis *inside* it.**

Concretely, the site-scoped record types carry a `slug`, and the selector is a filter over it. In the ticket store `fields` is opaque JSON, so a `site` field costs zero migration; in the site store the `(tenant_id, slug)` composite key already is this.

### Why not site == tenant

You asked directly, so: it breaks four things, and the fourth is a product bug rather than an inconvenience.

- **Billing splits.** `entitlements.account_id` — one customer with two sites becomes two accounts, two subscriptions, two invoices. That's the wrong bill and it's the hardest thing to un-migrate.
- **The assistant starts cold on site two.** The project KB corpus, the blob prefix (`t/<tenant>/blob/…`) and the knowledge index prefix are all tenant-keyed. Your brand voice, your positioning documents, everything the AI learned about you building 1stcontact would be invisible when you open XGD. `config.js` already flags this as the reason Library sits beside the site tab rather than under it: *"a client's second site should not start as cold as their first."*
- **Contacts fragment.** `idx_users_tenant_email` is `(tenant_id, email)`. Two tenants means the same human is two rows with no relationship.
- **Scheduling double-books you.** This one is decisive and it's the new item on your list. If both sites offer bookings and each has its own calendar, you can be booked twice at 3pm. One person has one calendar regardless of how many sites point at it. So scheduling *availability* is tenant-level even though the booking *page* is site-level — which is a direct counterexample to "all functionality is site-specific."

### And you already have the escape hatch

`memberships` exists (unique on `user_id, account_id`) and nothing uses it yet. So the genuinely-separate case — two legal entities, two bills, hard isolation — is already representable as **two accounts and one person with two memberships**. You don't need to collapse site into tenant to get isolation; you get it by creating a second account when isolation is actually what's wanted.

That makes the choice non-binary, which is the useful part:

| Want | Model |
|---|---|
| Two sites, one business, shared knowledge and billing | one tenant, two sites, selector filters |
| Two genuinely separate businesses | two tenants, two memberships, account switcher |

Both already fit. The only thing missing is the `slug` axis on the per-site record types, and the resolution plumbing (`TENANT_ID` is still a deployment var — the builder resolves one tenant today).

## What "site-specific" actually means, per domain

Worth being precise, because the domains aren't uniform:

| Domain | Owner | Notes |
|---|---|---|
| Monitoring | site | Unambiguous — uptime, SSL, forms on *that* site |
| Marketing | site | Campaigns drive traffic to a site |
| CRM | tenant, site-**attributed** | A lead arrived *through* a site; the person belongs to the business |
| Payments | tenant, site-attributed | Same shape; and the Stripe account is one account |
| Scheduling | **tenant**, site-facing | One calendar, many booking pages |
| Library | tenant, site-attributed | Already the design |
| Account | tenant | Not a tab |

"Attributed" rather than "owned" matters: the record carries the site it came from, the view filters by it, and nothing breaks when it's null (a lead that predates the site, material placed nowhere). Site-*owned* would make null unrepresentable and would make "show me everything" impossible.

## On Library and `placed_on`

You have `fields.placed_on` — an array of slugs, appended by `recordPlacement`. But note it means *published to that site*, not *scoped to it*, and **BUG-47 already settled that the distinction is load-bearing**: the fetch route deliberately drops the slug because "which site happened to be open" was being misread as placement. The router comment is explicit that "used on this site" is a badge the client filters by, "never a boundary this route enforces."

So under a global selector, Library wants three-ish states rather than a hard filter: *on this site* / *not placed* / *on another site* — with everything visible and the current site sorted first. That's the narrow-but-real case you identified, and it's the one place where a hard filter would actively hurt.

---

Want me to write this up as a DOC (it's a scope-model decision that several future REQs will need to cite), or leave it in the transcript for now?

<!-- xgd-turn id="028fc4f2-087a-423f-be59-9480431a5abf-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T22:10:20.576485+00:00" -->
#### You
Just to work through this:
**Billing splits -> no billing stays at the account level... There is an important recursion here that needs to be clear. The site owner is a customer of first contact, they have access to a First contact portal that will include the billing information. They in turn can also have a site, with customers, those customers have a billing portal on their site. We are not going to create tenants for our customers' customers => billing is associtate with accounts and it is data stored at the level of the offering site.**
**The assistant starts cold on site two.** The project KB corpus, the blob prefix (`t/<tenant>/blob/…`) and the knowledge index prefix are all tenant-keyed. Your brand voice, your positioning documents, everything the AI learned about you building 1stcontact would be invisible when you open XGD. <-- this is not a bug it's a feature. I do not want my first contact site discussion polluted by the discussion about XGD they are completely different products to the extent they overlap I can provide background documents but I expect to start from a blank sheet it would be extremely confusing for me not to I think.

**Contacts fragment.** `idx_users_tenant_email` is `(tenant_id, email)`. Two tenants means the same human is two rows with no relationship. <-- this is where it gets complicated for my personal use cases I consider this to be a feature. It is unlikely that I will have customers for both of these tools this is getting into the case that I brought up where there is an ecosystem of tools or products that share customers and markets this is where shared information is of value

**Scheduling double-books you.** How do you know the scheduling is booking me? It could be booking one of my employees, it could be booking the sites real owner and I just happened to pay for the site. Availability for one site does not necessarily mean availability for another. I think the relationship here is much more complicated than you are suggesting this doesn't make it decisive for me.

<!-- xgd-turn id="028fc4f2-087a-423f-be59-9480431a5abf-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T22:11:58.476754+00:00" -->
#### Claude
You've got me on three of the four, and on the fourth I had the asymmetry backwards. Let me go through it honestly rather than defend the position.

## Conceded

**Billing.** You're right and I conflated two levels. The recursion you describe is the clean model: the site owner is a *contact with a portal login* on the 1stcontact site, exactly as their customers are contacts with portal logins on theirs. Billing data lives at the level of the offering site, in both directions, and nobody's customers become tenants. My "two bills" objection assumed entitlement-per-tenant means invoice-per-tenant, which is just false — invoicing rolls up by payer. Two sites = two line items on one bill, which is what Vercel and Netlify already do. And it's arguably the *better* commercial shape: per-site is a natural meter.

**KB cold start.** Fully conceded, and I think you're right that it's the stronger design. Cross-product contamination in an assistant is worse than a blank sheet, because it's invisible and unfalsifiable — you'd never know which XGD framing leaked into a 1stcontact answer. The escape hatch (upload the background docs you actually want carried over) is explicit, cheap, and under your control. That beats an assistant that silently decides what's relevant.

**Contacts.** Conceded on the same grounds. Cross-site contact identity is the ecosystem case, and you've been clear that isn't core.

**Scheduling.** You're right that I assumed the payer is the bookable resource. Booking is against a *resource* — an employee, a room, the actual owner — and nothing says the account holder is one. The genuine risk is narrower than I stated: it only bites if the same human is bookable from two sites with two independent calendars. That's a real failure mode but it's a shared-staff-across-brands case, not a default. It's a "don't preclude a resource spanning sites later" note, not an argument about the boundary.

## The one that survives, and it's weak

Platform-side fan-out: support, admin, "all my sites" dashboards, and blob/extraction dedup (the same logo uploaded twice costs two extractions and two index entries). Mundane engineering, and the dedup cost is arguably the correct price for the isolation you're buying.

## And this one actually favors you — I had it backwards

I argued the filter model is safer because hiding is cheaper than merging. That's wrong on the asymmetry that matters. **Merging two well-attributed sets later is a union. Splitting one commingled set later requires attribution that was never recorded.** Site-as-boundary *enforces* attribution; site-as-filter merely *relies* on it, and the first time some code path forgets the `slug`, you have an un-splittable record and no way to know. For a decision you're uncertain about, enforcement is the safer default. So the ecosystem case being reachable-later actually argues for your model, not mine.

Related: under site==tenant, **membership is already per-site**, which gets you "this employee sees only the salon site" for free. Under my filter model that needs a new scope column on `memberships`. Another point I had backwards.

## So the model is Account → N site-tenants

And the payoff is bigger than the tab question. If Account is the 1stcontact site's own customer portal, then **the Account tab and the customer portal our customers give their customers are the same feature.** Building one well is building the other. That's worth committing to deliberately rather than discovering later — it changes how the portal gets designed.

Where the existing schema already fits, which surprised me:

- `memberships (user_id, account_id)` reads correctly as "this person operates that site-tenant" — no shape change, just vocabulary.
- `entitlements` carries both `account_id` and `email`, and is explicitly *not* unique on account. Plan-per-site with a person-level claim key already works.
- `users.tenant_id` gets *cleaner*: builder users belong to the platform tenant, contacts belong to their site's tenant, and the column stops carrying two meanings.

What actually changes is mostly vocabulary and a set of load-bearing comments written on the tenant-wide premise — `config.js` on why Library sits beside the site tab ("a client's second site should not start as cold as their first"), `router.ts`'s "TENANT-WIDE, and the `slug` the Library also holds is never sent here", and DOC-38 §7.7's one-blob-backs-two-sites. In this codebase those comments are the design record, so they'd need rewriting rather than leaving to rot. The Library tab becomes site-scoped and `placed_on` degenerates to placement-within-one-site.

## The cheap, reversible move

You don't have to migrate anything to adopt this. `sites (tenant_id, slug)` supports one-site-per-tenant as a *convention* — state the invariant, assert it, and the ecosystem case stays reachable without a schema change if it ever shows up. Decide by convention now, migrate never or later.

Two things worth deciding while it's fresh, since both shape work you'd otherwise redo:

1. **Is per-site the pricing meter?** If yes, entitlement-per-tenant is already right and needs no change.
2. **Is the Account tab literally the customer portal?** If yes, that constrains the portal design starting now.

Want me to scope this into CHAT-36 as a design decision, and draft the DOC that supersedes the tenant-wide Library premise?

<!-- xgd-turn id="aa6e0026-1561-44a3-900e-ba5cfdcb3d99-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T22:26:48.688960+00:00" -->
#### You
OK, so I think you are saying why I proposed per sight. Let's explore that design for a second. Is the following still possible:

1. Product ecosystem – I think this is a follow on product feature not a short-term goal but in this model what I want to be able to do is, for example, identify the customers who are using product a and product B and those customers using product a and product B and product C and use that information to help me m and extend my product usage. I might also want to do marketing planning at the ecosystem level, or for that matter billing at the ecosystem level. In today's model the simplest way to do this would be to have a single site for the ecosystem then there is no issue. And to be honest this would make sense if I am building such an ecosystem do I really need multiple sites and multiply identities and multiple brands probably not I'm certainly not for the kind of small business customer base that I'm considering that feels like a failure out of the gate. OK I'm talking myself into the idea that this is not really a particularly useful use case to chase. If it comes up again in the future and there is a real custom base clamoring for it one solution would be to allow multiple websites within a single tenant. Rather than building technology that crosses tenants. 

OK, I actually think that resolves my confusion I think there are two levels there is a top level which is a product – business grouping this should be a tenant and an account can own multiple of these. And then within a tenant we could in principle have multiple websites. In the case where we have multiple websites within a business grouping the kind of sharing that you talk about is appropriate. I think this is a V2 plus product when we have seen demand for it and today we should stick with the simpler idea of a business unit, a first contact business that has a single website a single calendar a single marketing and monitoring capability etc. We should build the data model so that the multiple sites within a business unit can be accommodated.

OK, great, I think that's the right model it changes slightly what we build today because I do not want the multi site within a single tenant story. I want multiple tenants within a single account. We need a user facing name for this concept. It is more than site.

In fact in general this is a useful conversation what does First contact provide, I have struggled to provide a succinct description of its capabilities the package makes complete sense to me as a product but I do not know how to capture that story to users. We could consider my use case. I am going to have a business called lagrange foundry with initially two products 1st Contact and XGD. There will be three sites and I believe I need three tenants. But there is only one business. Perhaps the concept I am grasping for here is "brand" these are three brands each one has its own marketing threads its own customers and its own products and of course its own website. Is brand the right idea here?

<!-- xgd-turn id="aa6e0026-1561-44a3-900e-ba5cfdcb3d99-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T22:28:05.905174+00:00" -->
#### Claude
That resolves it, and the resolution is better than either of the positions we started from. To state it back once:

**Account → N tenants → (v1: one site each; v2: N sites).** The tenant is the isolation boundary and owns customers, money, calendar, marketing, monitoring, knowledge. The ecosystem case, if it ever arrives, is served by allowing multiple sites *within* a tenant — never by building cross-tenant machinery. That's the right call for the reason you found yourself: an ecosystem player with shared customers probably wants one identity, not three, so "multiple sites, one customer base" is a truer model of that need than "three tenants that leak into each other."

Build-today consequence: the data model keeps `sites (tenant_id, slug)` as-is — it already expresses N sites per tenant — and v1 simply holds the invariant of one. Nothing gets migrated, nothing gets precluded. Everything else (CRM, payments, scheduling, monitoring, library, KB) keys on tenant and never on slug, which is *simpler* than what I was proposing, not harder.

## The name

Shortlist is **Business** vs **Brand**, and I'd take Business — but the reason is worth more than the verdict.

"Brand" names the *reason* two tenants are separate: different name, different voice, different market. That's exactly your intuition and it's why it feels right for Lagrange Foundry → 1stcontact, XGD. "Business" names the *contents* of the container. Products almost always want the second, because the name appears possessively next to the contents on every screen:

- "your business's customers" / "your brand's customers"
- "your business's calendar" / "your brand's calendar"
- "payments for this business" / "payments for this brand"

A brand doesn't have a calendar. The moment the container holds operational data rather than identity assets, "brand" starts reading slightly off — and that's the phrasing that recurs everywhere, whereas the "why are these separate" framing shows up once, in the switcher.

The other test is your modal customer, not you. A hairdresser with one shop has a business; they don't think of themselves as having a brand, and "Brand: Snip City" in the top-left reads like agency jargon aimed at someone else. Whereas you'd happily call 1stcontact a business — "I run two businesses" is ordinary English for exactly your situation. Lagrange Foundry is the *company*; the three things below it are the businesses. I'd let Account carry the company.

Brand wins only if the product's center of gravity turns out to be marketing and identity rather than operations. Given that the tenant owns money and bookings, I don't think it does. **Workspace** is the zero-risk generic option (Slack/Notion/Linear), and I'd avoid it — the whole pitch is that this isn't generic software.

Also: this is a *user-facing* name decision only. `tenant_id` stays `tenant_id` in the schema. Renaming the column to match the label is how you buy a migration for a word.

## What 1stcontact provides

I think the model you just landed on hands you the description, because the tenant's contents *are* the product:

> **1stcontact is the front office for a small business.**

Front office is the customer-facing half — reception, booking, invoicing, keeping in touch, and the shopfront itself. Back office is accounting, payroll, inventory, tax. Explicitly not you. A positioning line has to draw the boundary as well as claim the territory, and this one does both in five words.

It also explains the bundle as something other than a feature list. Right now "website + CRM + payments + scheduling + marketing + monitoring" sounds like six products stapled together, which is why it's hard to say succinctly. But run it as a single narrative and it's one thing:

> A stranger finds you *(website)*, gets in touch *(forms → CRM)*, books a time *(scheduling)*, pays you *(payments)*, and hears from you again *(marketing)* — and you get told the moment any of it stops working *(monitoring)*.

That's the first contact and everything downstream of it, which is the name doing its job. The name isn't just "the first contact" — it's the promise that the product owns that moment and every one after.

And it closes the naming loop: if the product is a front office, the container is a business, because a business is the thing that has one. The v2 multi-site case then reads naturally as *one front office, several doors*.

Two threads left open if you want them: whether per-tenant is the pricing meter, and whether the Account surface is literally the same portal your customers get. Want me to scope any of this into CHAT-36, or keep going in conversation?

<!-- xgd-turn id="27773b79-fda1-46a8-9374-4390ad7b40e1-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T22:35:36.537984+00:00" -->
#### You
Yes ok lets go with business - you are right it is somewhat more operational than brand - although I have worked in places that has used them relatively interchangably but cool lets go with businesss.

We need to (1) capture this in existing or a new doc - I suspect its best an update of existing content around tenancy - one thing I want to be really clear on is this recursive idea that I am building first contact as a first contact site, and my first contact customers will use the same access controls that their customers will have and will appear in a CRM system just the same way that customer as well and they will be billed from first contact just the way they can bill their customers. It's really important that we get this right it's not just an architectural elegance it is important for leverage otherwise I have to build all those features twice. (2) let's talk about specific changes to what we have today (and what is on deck) that will be needed to realize this new model

<!-- xgd-turn id="27773b79-fda1-46a8-9374-4390ad7b40e1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T22:40:30.694177+00:00" -->
#### Claude
Docs updated, and the change list turns out to be smaller than the conversation suggested — because the recursion you're describing is already half-built.

## (1) Captured in DOC-40 and DOC-10

**DOC-40 — Identity, Accounts & Entitlement** (the right home; it's where the conflation lived):

- **§2 "Three nouns" → "Four nouns."** It literally said *"**Account** — a tenant"*, so the section now opens by naming that as the collapsed level and separating them: **Business** (the tenant, the barrier, the thing that owns website/customers/calendar/payments/knowledge), **Account** (the payer, owns N businesses, not a tenant of its own), **User**, **Membership**.
- **§2.1 "The platform is a 1st Contact business"** — new, and written as the leverage argument rather than the elegance one. It carries the mapping table (a customer captures a contact / a prospect becomes a `users` row in the platform tenant; a customer bills from their portal / we bill from the platform business's payments surface), the conclusion that the Account surface **is** the customer portal rendered by the same code, and two rules stated as things a later hand will be tempted to break: *nothing is built platform-only* (the bespoke admin billing page is the named failure mode), and *our customers' customers never become tenants* — the recursion is exactly two levels by construction.
- **§2.2** records why the boundary is the business rather than the account, including the split-vs-merge asymmetry.
- **§2.3** records the ecosystem answer: several websites in one business, v2, already representable — and that this is what preserves DOC-10 §4.1 and DOC-38 §7.7 unchanged.
- **§4** provisioning table: the invite now creates *an account and its first business*; a second business is the same rows minus the user, self-serve rather than invited.
- **§5**: `account_id` is a business, so the meter is per business — three grants, one invoice, because invoicing rolls up by payer.
- **§9.3b**: new open item — where the account's billing-entity attributes live.

**DOC-10 §4.1**: *"The tenant is the account"* → *"the tenant is the business"*, with a parenthetical pointing at DOC-40 §2 and noting everything below was always describing the tenant. Also narrowed the "second site shouldn't start as cold as the first" rationale — still true inside a business, and across two businesses the cold start is now explicitly the feature.

## (2) What actually has to change

**Schema: nothing.** I went looking for the migration and there isn't one. `tenants`, `sites (tenant_id, slug)`, `tickets.tenant_id`, `memberships (user_id, account_id)`, `entitlements (account_id, email)` — every one of them reads correctly under the new model with only the word changing. `sites` is already keyed for N-per-tenant, so v2 is an invariant you relax, not a migration.

**And the identity half of the recursion is already built.** `identity.ts:33` — *"The PLATFORM's own tenant — where `users` rows for builder users live"* — and `provisionInvite` already writes the user into the platform tenant and the business as a separate `tenants` row. You built this correctly before naming it. What's *not* built is the leverage half: the CRM view over those rows, the billing, the portal.

**Landed code, one real change:**

- `identity.ts` — `accountFor()` returns a single account and `Admission` carries `accountId` singular (`identity.ts:102`). That is the only place the one-business-per-account assumption is baked into shipped code. It becomes a set plus a selection.

**On deck:**

| | Change |
|---|---|
| **REQ-168** (draft, high) *"The tenant comes from the identity"* | Biggest, but it already has the hook — `resolveScope(env, identity, requestedAccountId?)` takes an optional target. That target stops being an admin override and becomes the normal path, driven by the selector. Adds: enumerate the account's businesses, and persist last-selected so a returning user lands where they left. |
| **REQ-170** (draft, high) *admin console* | "The invite that provisions an account" → account **and** its first business; users pane gains a businesses column; entitlements are edited against a business. |
| **REQ-169** (draft) *terms of service* | Unaffected — acceptance is on the user, which is the account, which is where `tos_version` already lives. |
| **REQ-176 / 172 / 173 / 161 / 163** (Library, material) | **No change.** Tenant-scoped is now business-scoped. |
| **REQ-159 / 160** (project KB, session seeding) | **No change**, same reason. |

**New, not yet ticketed:**

1. **The selector moves to the shell header.** Today it's `'site-selector'` in the *site tab's toolbar* (`app.js:106`, `115`, `147`) — that is exactly UX option (2), the one you rejected. And `app.js:158` documents the rule that stops being true: *"the toolbar's selector is the one place a site is chosen."* Promoting it to shell chrome above the tab strip is the actual UX work.
2. **An endpoint listing the account's businesses**, to feed it.
3. **The Account surface behind the avatar** — and per §2.1 the scoping decision to make *before* building is whether it's the platform business's customer portal or a builder page. That decision is the difference between building the portal once and twice, which is your whole leverage argument.
4. **Naming pass** — user-facing "Business", schema stays `tenant_id`.

**One correction to what I said earlier:** I warned that the tenant-wide comments in `config.js`, `router.ts`'s "TENANT-WIDE" Library block, and DOC-38 §7.7 would need rewriting. They don't. Keeping N-sites-per-business as the v2 story leaves all of them true — they now describe the inside of a business. That's a real payoff of where you landed rather than where I was pushing.

Want me to scope REQ-168 and REQ-170's revisions into their bodies now, and open the selector work? The Account-is-the-portal decision (item 3) is the one I'd settle first, since it constrains the other two.

<!-- xgd-turn id="0b8b566a-3bad-45af-87b2-dfa7e04e73ad-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T23:14:25.403951+00:00" -->
#### You
Please creaat a ticket for the identity change and then update all the REQs that need adjusting. Note you are a design chat you do not write code.

Then (1) a ticket to move the selector (2) a ticket for 2,3 and 4.

Account now needs access to N business is that covered?

<!-- xgd-chat-end -->