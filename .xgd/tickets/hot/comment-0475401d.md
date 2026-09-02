---
uid: comment-0475401d
id: COMMENT-2157
type: comment
title: Comment on chat CHAT-36
created_by: xgd
created_at: '2026-09-02T21:22:45.844195+00:00'
updated_at: '2026-09-02T22:11:59.270975+00:00'
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

<!-- xgd-chat-end -->