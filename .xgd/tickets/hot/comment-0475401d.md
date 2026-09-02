---
uid: comment-0475401d
id: COMMENT-2157
type: comment
title: Comment on chat CHAT-36
created_by: xgd
created_at: '2026-09-02T21:22:45.844195+00:00'
updated_at: '2026-09-02T21:34:59.136088+00:00'
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

<!-- xgd-chat-end -->