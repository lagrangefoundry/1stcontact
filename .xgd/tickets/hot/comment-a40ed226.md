---
uid: comment-a40ed226
id: COMMENT-2261
type: comment
title: Comment on request REQ-170
created_by: xgd
created_at: '2026-09-04T01:52:48.555922+00:00'
updated_at: '2026-09-04T23:29:28.681345+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-420e1a6e
  kind: chat_transcript
---

<!-- xgd-turn id="10e6ef8a-1677-4d86-84a6-bc3da93816fd-user" -->

<!-- xgd-chat role="user" ts="2026-09-04T01:52:32.280050+00:00" -->
#### You
please read the discussion in REQ-180 about the user portal.

This admin page has the same goals - there are two things here:
1) a site-owner portal for seeing their users
2) the portal needs to have the ability to be extended - the extension will be functionality specific to the 1stcontact site owner, specifically tools for mananging the 1c application.

Lets talk about if this is really one page or two?

<!-- xgd-turn id="10e6ef8a-1677-4d86-84a6-bc3da93816fd-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-04T01:56:29.556745+00:00" -->
#### Claude
Read REQ-180 (and REQ-183, which it split out), plus the current REQ-170 body. Here's where I land.

## First: "portal" is already taken, and by the other direction

REQ-183 claimed the word for an **account looking at itself** — my plan, my details, my delete button. What you're describing is the opposite arrow: an **owner looking at their people**. Both are "portals" in speech, and DOC-40 §2.1's table already asserts both diagonals of a 2×2:

|  | owner-facing (*my people*) | customer-facing (*my relationship with you*) |
|---|---|---|
| a customer's business | their contact list — deferred | the portal they give their customers — deferred |
| the platform business | **REQ-170** | **REQ-183** |

So REQ-170 and REQ-183 are different cells and stay separate tickets. REQ-183 §6 already draws that line ("the portal reads and never grants"; "the portal has no list of accounts") and it holds — an owner acting on their own people is other-regarding by construction, which is exactly why the no-granting rule doesn't reach it.

## Within REQ-170's cell: one page, not two

Your (1) and (2) are one surface with one seam. And the argument is §2.1 rule 1: an `/admin` route whose left list is "all accounts" is the same shape as the bespoke admin billing page REQ-180 refused. §2.1's table row 2 already commits us — *"our pipeline **is** the platform tenant's CRM"*.

But be precise about what's shared, because there's a weak version of this claim and a strong one:

- **Weak:** both pages mount `webui/list-detail` and `mountFields`. True, unremarkable, not an architecture.
- **Strong, and the one worth holding:** **the people list is tenant-parameterised from day one.** `users WHERE tenant_id = <current business>`, off the scoped handle, never `TENANT_ID`, never a platform special case. That's cheap now and expensive to retrofit, and it's the whole of the property §2.1 asks for.

Hang the decision on the query, not the layout.

## The seam is a parameter, not a framework

Both components already take everything needed — `list-detail` takes rows and columns, `mountFields` takes descriptors and a save callback. So the extension is three things:

- extra field descriptors (memberships → businesses → grants)
- extra actions (invite, grant, revoke, add-business)
- a gate

No plugin registry, no manifest, no extension-point object. If a manifest appears we've built a framework for one extension, which is its own failure mode.

## The tenancy barrier falls exactly on your seam — which is why the seam is real

The page **reads** inside one tenant. Every operator action that matters **escapes** it: `provisionInvite` writes a `users` row *and* a `tenants` row; a grant is written against a business that isn't this one.

So: reads stay scoped, always, for everyone. The extension's actions call the already-unscoped provisioning functions — REQ-178's `provisionBusiness`, and `POST /api/admin/businesses`, which REQ-180 already landed gated at `router.ts:964` with no UI. REQ-170 is the console that calls it rather than reimplements it.

And the navigation that makes this work without any cross-tenant read: the operator reaches a customer's grant **through the account that owns it** — account (a platform-tenant row) → memberships → business → grants. That's REQ-170's revision note ("entitlements are edited against a business, not against a person") made reachable without the page ever leaving its tenant. Seeing *inside* another business is DOC-40 §7's parked switcher and stays parked.

## Three things this changes in REQ-170 as written

1. **`/admin` is the wrong route and the wrong name.** It names the extension rather than the surface, and that naming is precisely what would ossify the platform-only reading. It should be an ordinary section showing the current business's people; the 1c toolkit appears when the current business is the platform one and the caller is `platform_admin`.

2. **"Gate before any admin asset is served" largely dissolves.** If the surface is generic, gating its assets is meaningless — everyone gets them. The gate that matters is at the API, where REQ-180 already put it. Keep asset gating only for genuinely admin-only markup, if any survives, and not as the primary control.

3. **The left list stops being *accounts* and becomes *people in this business*.** Still accounts for the platform business — ours happen to be accounts — but written as the specialisation, not the definition.

## The counterargument, honestly

A customer's contact and our account share email, created, name, and almost nothing else. If most of each page is extension, "one page" really means "both mount list-detail," and dressing that up as shared architecture is overselling. That's fair — which is why I'd rest the claim on the tenant-parameterised query and not on the layout. The query is genuinely one thing and genuinely expensive to retrofit.

## Two things I'd want you to decide

**A. Do customer businesses get the (empty) people surface today, or only the platform business?** Nothing captures contacts yet, so a customer's list is empty. Building it parameterised but only routing to it for the platform business gets the property without shipping a feature nobody can use — but it risks the generality being theoretical, never exercised, and quietly false by the time someone needs it. Routing it for everyone forces the generality to be real at the cost of an empty tab. I lean slightly to the first, with a UAT that mounts it against a second business so the parameterisation is exercised even where it isn't routed.

**B. What is it called?** "Portal" is spoken for. DOC-40 §2.1's own word is CRM. *People* reads right for a customer and slightly odd for us; *Accounts* reads right for us and wrong for them. I'd take the customer's word — the point of the whole exercise is that ours is the special case.

I'd keep it as one ticket, incidentally: the seam is a parameter, and splitting would put the surface in one ticket and its only current reason to exist in another.

Say which way you want A and B and I'll write the outcome into REQ-170.

<!-- xgd-turn id="0e60c63f-532b-4af8-9153-0a224b0e8c10-user" -->

<!-- xgd-chat role="user" ts="2026-09-04T20:50:37.317438+00:00" -->
#### You
So I'm more worried about ensuring that the model is correct that splitting hairs on vocabulary.

Let me state it again and try to cement concepts and vocabulary with an example.

Alice is a first contact customer and user (Level 1 user/customer)
She has a site Alice's plumbing
Bob is a customer of Alice's plumbing (Level 2 user/customer)

Bob can go to Alice's Plumbing and log in to a "User portal" it shows him his billing and payments history with Alice, perhaps other details including the ability to delete his private info.

Now Alice is a user of 1stcontact (which is a first contact website). She can log in to 1st contact and see her "User portal" which shows her billing and payment history with 1c.

Logging in to 1c website also gives her access to the 1c application. This shows her the tabs we have been building - the Site builder, the library, the CRM, the billing any payments UI etc. One of those tabs is what you are building - lets call it the "User" tab, it allows the site owner (admin) to view and manage users site access.

I am the owner and admin for 1c. When I log into 1c I can get access to the 1c app with the tenancy set to the 1c site. So far my view is similar to Alices view - I see Alice as one of my customers - I do not see Bob (I only see level one users).

Because this is the 1c site admin console, in addition to the controls available to Alice (site controls everyone sees) there are additional 1c app controls that only I see - these allow me to provision new business for customers (or remove them).

The key point is not about language it is about the idea that I see what Alice sees with some additions.

And I agree this isn't a portal it is the User tab of the 1c application

<!-- xgd-turn id="0e60c63f-532b-4af8-9153-0a224b0e8c10-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-04T20:52:41.794659+00:00" -->
#### Claude
Let me check two load-bearing claims in the model against the schema and DOC-40 before I agree with it.

Your model is right, and it checks out against the schema rather than just against the prose. Three confirmations, then the consequences I think you haven't drawn yet.

**Bob's invisibility to you is structural, not a filter.** `users.tenant_id` (`identity.ts:71`); Bob is a row in Alice's Plumbing's tenant, Alice is a row in the platform tenant — `provisionInvite` writes her there explicitly (`identity.ts:398`). Your User tab reads off the scoped handle for the current business, so it *cannot* return Bob; there's no rule to enforce and none to forget. DOC-40 §2.1 rule 2 backs it from the other side: the recursion is exactly two deep, Bob never becomes a tenant.

**"I see what Alice sees plus additions" is §2.1 rule 1**, and it's a better framing than the one I gave you last turn. I reached for an extension seam; you don't need one. It's one tab, one tenancy, and some controls that render for `platform_admin`. A seam is a parameter at most.

**The level is relative, not absolute** — and this is the sharpening worth keeping. "I only see level-one users" and "I see the people of my business" are the same sentence; you see level 1 because you're level 0, Alice sees level 2 because she's level 1. That gives a falsifiable test for the model: **if any code ever needs to know a person's level, the model has been broken.** No `level` column, no `is_platform_user` predicate. Today only `tenant_id` is consulted, so we're clean.

## The consequence you haven't drawn: the CRM tab and the User tab are one population

DOC-40's *Contacts are users*: a contact is a `users` row in that tenant **with no authentication fields set** — explicitly *not a second table*, with `(tenant_id, email)` unique as the one place identity is decided. And §2.1's table runs: capture a visitor as a contact → see them in the CRM → invite them into a portal.

So across your example, uniformly:

- a CRM row and a User row are the same row, differing by whether auth fields are set
- **the invite is the verb that moves someone from one to the other**
- your CRM is prospects who landed on 1stcontact.io; your Users are the ones you invited, who became accounts. Alice's CRM is people her contact form captured; her Users are the ones she gave portal logins.

That bears directly on REQ-170: **the User tab must not create its own population.** If it reads "users who have accounts" as a distinct kind while the CRM reads "contacts", they'll disagree the first time someone is both — which is the exact failure DOC-40 says the single unique index exists to prevent. The tab is a facet over one list. One tab with a filter, or two tabs over one query, is open; two lists is ruled out.

## What actually characterises "the additions"

They're not admin-only because they're powerful. **They're admin-only because they write outside the tenant the tab is scoped to.** Provisioning a business writes a `tenants` row; a grant writes an `entitlements` row keyed to *Alice's* business, not yours. Everything else in the tab — for you and Alice alike — reads and writes inside one tenant.

That gives a test for any future control: does it stay inside the current business? Then it's in the shared half. Does it leave? Then it's an addition, and it's reached *through* the person's row rather than being an operation on it.

## Two flags

**"Billing and payments UI" as a tab** collides with something REQ-180 already landed as an asserted prohibition: *no plan, billing or invoice view exists as a builder route*. It isn't a real conflict — your example contains two different billing surfaces, and they're uniform across levels:

- Alice's billing *with 1c* → her User portal (REQ-183), reached from the avatar. This is what the prohibition covers.
- Alice billing *Bob* → a business tool, legitimately a tab. Yours is the same tab pointed at Alice.

The risk is that someone builds "Billing" as a tab and it quietly grows Alice's own plan view, tripping REQ-180's guard. Worth writing down which one the tab is.

**"provision new business for customers (or remove them)."** Provision exists — `POST /api/admin/businesses`, gated at `router.ts:964`, no UI yet; REQ-170 is the console that calls it. **Remove does not, and is far bigger than the parenthesis suggests**: DOC-37 is an entire document on it, REQ-183 §4.1 explicitly ships a delete *button* without a delete *mechanism*, and its open question 3 is precisely "does delete mean the account or its businesses." I'd keep removal out of REQ-170 rather than let it in on a parenthetical.

## The one real gap the model exposes

You describe the tab as managing *users' site access*, uniformly. But the two levels don't yet have the same mechanism:

- Alice's access to 1c is `memberships` + `entitlements`.
- Bob's access to Alice's portal is neither. He holds no membership — he's not an operator — and `entitlements.account_id` holds a *tenant* id, which Bob doesn't have.

So the shared half of the tab is only half-shared today: your case works, Alice's has nothing behind it. That doesn't block REQ-170 — but it's exactly how the tab would end up platform-only by accident, which is the thing the model exists to prevent. It should be named as a known gap with a ticket, not discovered when Alice's tab is built.

---

Want me to write this into REQ-170 — the uniform statement of the tab, the no-`level`-column test, the CRM/User one-population constraint, the "additions are the writes that leave the tenant" rule, and the level-2 access gap as a noted dependency?

<!-- xgd-turn id="9c09caf8-5f1e-4ca5-a5d1-3c892ca53f84-user" -->

<!-- xgd-chat role="user" ts="2026-09-04T21:05:33.436154+00:00" -->
#### You
No you are still confused.

"Alice's access to 1c is `memberships` + `entitlements" `<-- this is incorrect Alice's access to 1c is exactly the same as Bob's access to Alice's plumbing.

Alice has access to a 1c user portal that shows her HER payments to 1c her delete button etc.

IN ADDITION Alices login to 1c gives her access to the 1c app. (this does not exist in our example - Alice is a plumber "Alice's Plumbing"  does not have an app) Within the App there is a User tab where Alice can manage membership and entitlements.

BTW we have not discussed it but there could be Level 1 entitlements made available to level 2 customers/members - for example content kept behimd a paywall on Alice's Plumbing which bob can only see if he is paying the membership fee.

<!-- xgd-turn id="9c09caf8-5f1e-4ca5-a5d1-3c892ca53f84-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-04T21:07:29.058437+00:00" -->
#### Claude
Let me look at what `entitlements` can actually key to before I respond, because your paywall point lands directly on it.

Got it — I merged two relations that your example keeps apart. Restating so the correction is on the record:

- **Alice ↔ 1c is exactly Bob ↔ Alice's Plumbing.** Customer of a business: a portal, their payments, their details, their delete button. No qualification, no level asymmetry.
- **The 1c app is the product 1c sells.** Alice's login reaches it because that is what they bought. Alice's Plumbing has no app because Alice sells plumbing. That's a difference between two businesses' products, not between two levels.

So `memberships` and `entitlements` aren't "how level 1 works" — they're how 1c grants access to *its* product. Your paywall example is the proof, and it's the load-bearing one: Bob paying Alice to see gated content is the same mechanism one level down. Entitlements are general.

## Where the schema stops supporting that, precisely

`entitlements` (0004): `account_id`, `email`, `plan`, `source`, `status`, `starts_at`, `ends_at`. DOC-40 §5 pins `account_id` to a **business**, and says why the payer is someone else:

> the grant is per business and the meter is per business: an account with three of them holds three grants and receives one invoice, because invoicing rolls up by payer and the payer is the account.

So a grant already has two parties held apart — **the subject** (what access attaches to) and **the payer** (who owes). For 1c's product they differ: subject = Alice's Plumbing, payer = Alice. For Alice's paywall they coincide: subject = Bob, payer = Bob.

The table can't currently say that. `account_id` is a tenant id, and Bob has no tenant — by DOC-40 §2.1 rule 2 he must never get one. `email` isn't a second kind of subject; 0004's comment makes it a pre-provisioning key for the *same* subject ("today's admin flow fills both"). What's missing is a grant whose subject is a **person within a tenant**.

Nothing about the table is hostile to it — no unique index on either column, `plan`/`status` unconstrained TEXT, exactly so this kind of thing lands without a migration of meaning. But it isn't there, and it's a DOC-40 §5 amendment rather than something REQ-170 invents.

What it binds on REQ-170 is one thing, and it's testable: **the entitlement editor must not be written as though the subject is always a business.** If it is, Alice's paywall arrives and the editor gets built a second time — §2.1 rule 1's named failure mode, one level down.

## Which makes the seam narrower than I had it

Last turn I said the additions are "the writes that leave the tenant." That's true but it's a symptom, and taking it as the definition would invite a generic privileged-action mechanism. The right statement is: **the additions are 1c's product-fulfilment actions.** Provisioning a business *is* 1c filling an order; it happens to write a `tenants` row outside 1c's tenant, which is why it needs `platform_admin`. Alice will eventually have product-fulfilment actions too, they'll look nothing like these, and they won't live here.

So: no extension framework. One business's product controls, rendered for that business.

## Two things in REQ-170 that are now inconsistent

**1. Memberships.** You said the tab is where Alice manages membership and entitlements. REQ-170's body currently lists "Editing memberships" under *Not in scope*. And `0005_operator_membership.sql:14` says the opposite:

> joining an existing business — which DOC-40 §9 leaves undefined and **REQ-170 owns**.

So the migration already assigns it here and the ticket disclaims it. That needs settling either way — under your model it belongs in the tab, uniformly (Martin manages who may operate 1c; Alice manages who may operate Alice's Plumbing).

**2. A vocabulary collision that will bite in code.** Bob pays a "membership fee" and holds no `memberships` row. In the schema `memberships` means *may operate this business* — Alice→Alice's Plumbing, Martin→1c, a future employee of Alice's. Bob's membership is an entitlement. Same English word, two tables. Worth one line in the ticket so nobody wires Bob's paywall to `memberships`.

---

Shall I write into REQ-170: the uniform statement of the tab, entitlements as a general mechanism with the subject-vs-payer distinction called out as a DOC-40 §5 amendment, the seam as 1c product-fulfilment rather than generic admin, and resolve the memberships scope contradiction against `0005`?

<!-- xgd-turn id="d50d5db7-ba4e-4216-98dd-16c430b9e1d7-user" -->

<!-- xgd-chat role="user" ts="2026-09-04T21:18:06.264848+00:00" -->
#### You
I don't understand your statements about membership. Let me clarify how I was using the word, I don't see an ambiguity.

"Bob is a member of Alice's Plumbing" means exactly: Bob can login and get access to pages that require login (specifically right now this is the User Portal but someday there could be other things)

There is no membership fee today - that is an entitlement please keep then separate - it just means Bob can log in. As Admin I can provision business and "entitle" users to have access to them - soimeday that will be done automatically when they pay.

<!-- xgd-turn id="d50d5db7-ba4e-4216-98dd-16c430b9e1d7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-04T21:19:26.179045+00:00" -->
#### Claude
That's a cleaner split than I had, and it makes the two relations orthogonal rather than layered. Let me check whether the schema and the admission code already agree with it.

You're right, there's no ambiguity — I'd wrongly read `memberships` as operator-only. Dropping that.

Your split is already in the code, and cleanly:

- `businessesFor` joins through `memberships` (`identity.ts:621`) — membership puts a business in your set.
- `selectable: entitlement !== null` (`identity.ts:665`) — the entitlement is what lets you in.

That is exactly "membership = can log in; entitlement = access to the thing," and the `role` column (`owner`, `support`) is where Bob would land as a third kind of member.

## The one place the code doesn't agree

`admit` collapses the two back together at the door (`identity.ts:541`):

```
if (businesses.length === 0) return no_membership
if (!businesses.some(b => b.selectable)) return no_entitlement
```

So today **login itself requires a live entitlement.** Under your model that's wrong in general — Bob is a member of Alice's Plumbing with no entitlement, and he must be able to log in and reach the User Portal. And it's wrong one level up too, in a way that bites harder: Alice with a lapsed grant is still a member of 1c, and denying admission means they cannot reach the portal showing their payment history — including the page where they would *pay*, which is the only thing that would restore the entitlement. A lockout loop.

DOC-40 §5 half-anticipates this:

> For the alpha an expired grant denies with a message; read-only access to one's own site is the better product answer and the model supports it unchanged, so it waits for the payments funnel.

Your model gives it a stronger reason than "better product answer." And REQ-183 sharpens it into something with a deadline: that ticket puts a **Delete account** button in the portal because DOC-37 makes erasure a compliance obligation. If admission requires a live entitlement, a lapsed customer cannot reach their own delete button — the compliance surface ends up gated on payment.

So `no_entitlement` should stop being an admission refusal and become a state *inside* an admitted session: you're logged in, the app isn't open to you, here's why. `no_membership` stays a refusal. That's not REQ-170's work, but REQ-170 is the surface that creates lapsed members, so it's the ticket that makes the loop reachable.

## What this fixes in the User tab

Membership and entitlement are two independent things the tab manages per person, not one layered thing:

- Martin's tab, tenancy = 1c: Alice is a member (can log in), and entitled to Alice's Plumbing.
- Alice's tab, tenancy = Alice's Plumbing: Bob is a member (can log in, reaches the portal), and someday entitled to the paywalled pages.

Which makes REQ-170's *Not in scope: editing memberships* clearly wrong now — membership is the **primary** thing the tab manages, since "manage users' site access" is precisely the login relation. `0005_operator_membership.sql:14` already says REQ-170 owns it. I'd delete that exclusion.

## One question I don't want to answer for you

You wrote: *"provision business and entitle users to have access to them."* That reads as a grant on the pair **(user, business)**. The schema's grant is on the **business** alone — `entitlements.account_id` is a tenant id, and who pays is inferred by joining memberships (DOC-40 §5).

Those differ the moment two people are members of one business: under the schema they necessarily share its entitlement; under the pair reading they could differ. Bob's paywall needs the pair reading — two members of Alice's Plumbing, one paying, one not. So I think the pair is where this ends up, but it's a DOC-40 §5 amendment and I'd rather ask than assume.

**Is an entitlement a grant to a business, or to a person's access to a business?**

Once you answer that I'll write up REQ-170: the uniform tab, membership and entitlement as two orthogonal columns, memberships back in scope against `0005`, the 1c-specific controls as product-fulfilment rather than generic admin, and the admission lockout noted as a dependency.

<!-- xgd-turn id="6e4070dc-d46c-46bc-a3f1-452677be98ba-user" -->

<!-- xgd-chat role="user" ts="2026-09-04T22:29:23.448707+00:00" -->
#### You
Provision a business <-- create it new role in the db
entitle user <-- actually this is incorrect this should be entitle account (right now we have one user one account but I want to leave the door open to multi-user accounts in the future.) Give account access to something.

So, modeling question: membership is ability to login, Membership implies access to the User Portal. That could be modeled as a free, automatic entitlement - or it could just be what membership gives you...what do you think?

<!-- xgd-turn id="6e4070dc-d46c-46bc-a3f1-452677be98ba-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-04T22:30:40.804729+00:00" -->
#### Claude
## On the question: make the portal what membership *is*, not a free entitlement

Recommendation is (b), and the deciding argument is the lockout loop from last turn.

A free automatic entitlement is a row that is always created and never revoked — a constant modelled as data. Constants modelled as data can go missing: a failed insert, a partial provision, a migration that misses a backfill. And the failure mode here is specifically that someone can log in but cannot reach the surface where they'd see their payment history or press their delete button. DOC-37 makes that surface a compliance obligation, so it must not depend on a row that could be absent. Under (b) it can't be: member ⇒ portal, structurally, the same way Bob's invisibility to you is structural rather than a filter.

It also stops a control existing that shouldn't. If portal access is a grant, someone will build "revoke portal access" because the machinery is right there — and that's close to blocking a person's erasure request.

The secondary argument is that (a) makes the entitlement table lie about itself. DOC-40 §5's design is that grants *accumulate* and *expire*, and effective access is "the best active grant covering now." A grant that is always present and never expires is a degenerate row that every such query has to skip over.

The cost of (b) is two gate mechanisms in code instead of one. I think that's honest rather than regrettable — they answer two different questions — and it gives you a sharp test for which one applies:

> **Is it a fact about this person's relationship with this business?** → membership, no grant. Their payments, their details, their delete button.
> **Is it something the business provides?** → entitlement. The 1c app; Alice's paywalled pages.

That line falls exactly where REQ-183 and REQ-170 already sit, which is a decent sign it's the real one.

**One dependency this creates.** Choosing (b) makes last turn's `admit` problem load-bearing rather than theoretical: membership alone must admit, so `no_entitlement` (`identity.ts:542`) has to stop being a refusal and become a state inside an admitted session. Nothing else in (b) works until it does. Revoking a login stays expressible without entitlements — `memberships.revoked_at` is already there for it (0004: *"a withdrawal that refuses independently of any date"*).

## On "entitle the account" — this collides with the column name

You've answered my pair question and corrected it in the same move: subject = account, object = the thing. But note what the schema holds today. DOC-40 §5:

> `account_id` here is a **business** (§2)

So `entitlements.account_id` holds a **tenant id** — it is the *object* wearing the *subject's* name, and the account (payer) is derived by joining memberships. Under your model the table needs both, and the column that says `account_id` is the one that isn't.

That name will produce a bug: someone will put a user id in `account_id` because the name tells them to, and it will half-work. I'd rename it to `business_id` when the subject column lands rather than run two migrations.

**Two things it also lets me flag as still true, not broken by this:**

- Per-business capacity and per-account access are genuinely different grants, not one generalised. "Alice's Plumbing has pro" must not require re-granting every member on join. So the subject column is an addition, not a replacement.
- **"Account" is relative to the business, like "level" was.** Bob is an account *of Alice's Plumbing*. If account gets defined as "a `users` row in the platform tenant," it becomes platform-only vocabulary and §2.1 rule 1 breaks the first time Alice needs to bill two people at one address — which is your multi-user case, one level down.

Multi-user accounts stay cheap to leave open: today the subject id happens to equal a user id, as long as nothing asserts that it *is* one.

---

If (b) is agreed, I'll write REQ-170 up: the uniform tab; membership and entitlement as two orthogonal columns per person with membership as the primary one (deleting the *Not in scope* exclusion, against `0005:14`); the portal as membership-derived rather than granted; the 1c-only controls as product-fulfilment; and two noted dependencies — the `admit` change and the DOC-40 §5 subject/object amendment — as things REQ-170 makes reachable rather than owns.

<!-- xgd-turn id="77b37c0c-a82c-4f82-9957-c67a55c4c3fd-user" -->

<!-- xgd-chat role="user" ts="2026-09-04T23:07:53.158988+00:00" -->
#### You
I don't think we should talk about a platform tenant - there is a 1stcontact tenant - that owns the 1c site

<!-- xgd-turn id="77b37c0c-a82c-4f82-9957-c67a55c4c3fd-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-04T23:09:13.078494+00:00" -->
#### Claude
Agreed, and it's a model point rather than a naming one — "platform tenant" names a *kind* of tenant, and there isn't one. There's the 1stcontact tenant, it owns the 1c site, and its users are its customers. Same sentence Alice says about theirs.

What's actually distinguished about it is three facts about what that business *does*, none of which is a kind:

- the app is deployed against it (`TENANT_ID`) — a deployment fact, and REQ-180 D5 already classified `TENANT_ID` as deployment vocabulary for exactly this reason
- it hosts the others, so support access into them is possible at all
- **its product is other businesses**, so `provisionBusiness` is its fulfilment action

## The structural consequence: `platform_admin` is two things

Dropping the platform-tenant idea splits a flag that's currently one column:

- **owner/admin of the 1stcontact business.** Not special. Alice is owner of Alice's Plumbing; you are owner of 1stcontact. That's `memberships.role = 'owner'`, which exists already.
- **may enter a business without holding a membership** — `scope.ts:237`'s bypass. Genuinely special, and special because 1stcontact *hosts* the others, not because of level.

DOC-40 §6 defends the flag on bootstrapping grounds — *"it works before any membership row exists, and it cannot lock its holder out of the system that grants it."* That defence holds for the **env var**, which is a break-glass seed. It doesn't carry the **column**, which is a persistent model fact and is precisely the shape §2.1 rule 1 forbids: a platform-only flag standing in for a capability (*admin of my own business*) that every owner needs.

§6 already names the replacement for the second half — time-boxed `support` membership rows, *"the auditable alternative, and the table exists for them from day one."* What's new is that the *first* half shouldn't be a flag at all.

## What that gives REQ-170

The tab's 1c-only controls stop being gated on an admin flag. They're gated on two conditions:

1. **you are an owner of this business** — uniform; Alice is, of theirs
2. **this business's product is businesses** — which is what makes the control appear for 1stcontact and nowhere else

So the tab renders product-fulfilment controls for whichever business you're in, according to what that business sells. 1stcontact sells businesses → provision. Alice sells plumbing → nothing here yet.

Notice that states the seam without the word "admin" in it, which is the test that the platform-tenant idea is really gone. And today those two conditions select exactly the same person `platform_admin` does — so modelling it correctly costs nothing now and doesn't need the column changed to ship.

The support bypass stays where it is and REQ-170 should **not** use it as its gate. That's cross-tenant reach, DOC-40 §7 parks it, and borrowing it here would put the one genuinely special power behind an ordinary product control.

## Cost, honestly

The doc sweep is real — DOC-40 §2 and §6 say "platform tenant" throughout, and so do REQ-167/170/178/180. In code it's mostly naming: `accountFor` already delegates to `findUser(env, tenant, email)`, so it's generic and only its name is special. The one substantive change is REQ-170's gate, and eventually `users.platform_admin`. REQ-180 D5 already set the precedent for enforcing a vocabulary rule with a guard rather than an audit.

---

Updated write-up for REQ-170, if you want it: the uniform tab; membership and entitlement as two orthogonal columns with membership primary (deleting *Not in scope: editing memberships*, against `0005:14`); the portal as membership-derived rather than granted; the 1c controls gated on owner-of-this-business plus what-this-business-sells rather than on an admin flag; and three noted dependencies it makes reachable but doesn't own — the `admit` lockout, DOC-40 §5's subject/object, and `users.platform_admin` vs `memberships.role`.

<!-- xgd-turn id="5619f9d5-6e86-4509-ae60-3dbf8caf74e5-user" -->

<!-- xgd-chat role="user" ts="2026-09-04T23:19:15.418893+00:00" -->
#### You
Good can you capture this model in a way that will be really clear - I think its probably worth a new doc just for this. It can be short but its complicated - it took us a long time to work through the kinks.

Please create the doc first and the list the ticket updates that it drives

<!-- xgd-turn id="5619f9d5-6e86-4509-ae60-3dbf8caf74e5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-04T23:21:40.713887+00:00" -->
#### Claude
Docs aren't code, so no free-coding branch needed. Let me check the ticket CLI and the DOC numbering first.

Next is DOC-42. Writing the doc.

Created **DOC-42** (`doc-95b51bb6`), status draft. Let me size the vocabulary sweep before listing.

**DOC-42** is created (`doc-95b51bb6`, draft, `doc_kind: architecture`) — 10 sections, each with a falsifier, and §10 records the three things the model says are currently wrong. The local commit landed; the push failed on a proxy auth error, so it'll need a manual push.

Here are the updates it drives.

## REQ-170 — this session's ticket, the largest set

1. **Reframe the surface.** `/admin` becomes the **User tab**: the people of the business you're in. The route and the name both change — `/admin` names the extension rather than the surface, which is what would ossify the platform-only reading. (§7)
2. **Delete "Editing memberships" from *Not in scope*.** It contradicts `0005_operator_membership.sql:14` — *"joining an existing business — which DOC-40 §9 leaves undefined and REQ-170 owns"* — and under §4/§7 membership is the *primary* thing the tab manages, since "manage users' site access" is exactly the login relation.
3. **Replace the gate.** Currently `PLATFORM_ADMINS` gating the page. Becomes: owner of this business **+** this business's product is businesses. `PLATFORM_ADMINS` survives as the break-glass seed (§10.3), not as the model. Consequence: "the gate is checked before any admin asset is served" mostly dissolves — the surface is generic, so the gate that matters is at the API, where REQ-180 already put it.
4. **Constrain the entitlement editor.** The revision note says entitlements are edited against a business. True today, but it must not be baked in — subject is the account, object is the thing (§6), or Alice's paywall rebuilds the editor.
5. **The list is the CRM's population.** Not a separate "users who have accounts" query (§9).
6. **Strip "platform tenant"** — one occurrence, "a `users` row in the platform tenant (the account)".
7. **Keep "remove a business" out of scope** — DOC-37 territory, and REQ-183 §4.1 already ships a delete button without a delete mechanism.
8. Link `[[DOC-42]]`.

## REQ-183 — customer portal (draft)

1. **Add §10.1 as a blocking dependency.** Its headline capability is a Delete-account button that DOC-37 makes an obligation — and today a lapsed member can't log in at all, so that surface is gated on payment. Its open-questions list doesn't cover this.
2. **Record that the portal is membership-derived, not entitlement-gated** (§5).
3. Its §6 line against the admin console stays right; point it at §7 for *why* — product fulfilment, not privilege.

## DOC-40 — the parent, four amendments

1. §2/§2.1 — "platform tenant" → the 1st Contact business (8 occurrences).
2. §5 — record the subject/object correction and the `account_id` → `business_id` rename (§10.2).
3. §5 — amend *"the check runs at login; an expired grant denies"* per §10.1.
4. §6 — split `platform_admin`: env var stays as the seed, the column's ownership half becomes `memberships.role` (§10.3).
5. Pointer to `[[DOC-42]]`.

## REQ-179 / REQ-180 — a reachability note

REQ-180 D4 landed lapse reasons and insists *"IT REACHES THE PERSON."* It half-does: `admit` refuses when *no* business is selectable, so someone with a mix sees their expired one's reason and someone with **all** businesses lapsed — the person the feature was written for — never gets in to see any of it. Worth noting against whichever of the two you want carrying it; §10.1 is the fix.

## REQ-167 / REQ-178 — vocabulary only

3 occurrences in REQ-167, and `identity.ts` has 12 (`platformTenant`, and `accountFor`'s *"the platform's own tenant"*). `accountFor` already delegates to `findUser(env, tenant, email)`, so it's generic and only the naming is special. REQ-178 is `ready_to_reconcile`, so a note rather than a rewrite.

## New tickets this implies — not created, session is scoped to REQ-170

- **`admit` requires membership, not entitlement** (§10.1). The largest and the one with a compliance edge.
- **Entitlement subject column + `business_id` rename** (§10.2).
- **`users.platform_admin` → `memberships.role`** (§10.3), env var retained.
- **"Platform tenant" guard**, on REQ-180 D5's guard-not-audit precedent.

---

Want me to apply the REQ-170 edits now? That's the one this session owns; the DOC-40 and REQ-183 amendments I'd rather do as explicit follow-ups than fold in silently.

<!-- xgd-turn id="401cd136-460b-409a-ac79-435b459a0243-user" -->

<!-- xgd-chat role="user" ts="2026-09-04T23:25:35.824438+00:00" -->
#### You
Go ahead

<!-- xgd-turn id="401cd136-460b-409a-ac79-435b459a0243-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-04T23:27:17.429775+00:00" -->
#### Claude
Done. Both tickets are updated locally.

## DOC-42 — created
`doc-95b51bb6`, `doc_kind: architecture`, status draft. Ten sections, each with a falsifier; §10 carries the three amendments the model forces on what's already written.

## REQ-170 — updated

**Retitled** from *"The admin console: users, entitlements, and the invite that provisions an account"* to *"The User tab: the people of a business, their membership and their grants."* The old title was the platform-only framing in its most visible position, and it contradicted the new body. I did this on the strength of "the route and the name both change" — easy to revert if you meant only the route.

**Two in-place corrections**, everything else preserved verbatim:
- *Not in scope* — "Editing memberships" removed (it contradicted `0005_operator_membership.sql:14`), "removing a business" added in its place with the DOC-37 reason, and both changes annotated so the deletion is visible rather than silent.
- The one "platform tenant" phrase → "the 1st Contact business".

**Appended** a 2026-09-04 revision with nine subsections: the tab rather than `/admin`; membership and entitlement as two orthogonal columns with membership primary; the entitlement editor constrained against assuming a business subject (with the paywall as the breaking case); the CRM one-population rule plus the UAT that enforces it; the gate as owner-of-this-business + what-this-business-sells, including the asset-gate dissolution and an explicit *don't borrow the support bypass*; provisioning called rather than reimplemented; no extension framework; and the three DOC-42 §10 dependencies recorded as reachable-but-not-owned.

## Two things to note

**The DOC-42 push failed** — proxy auth error, local commits are fine. Both tickets need a manual push.

**`story_points: 3` is now probably low.** That estimate predates membership editing being in scope. I left it alone — that's your call, not a consequence of the model.

Still outstanding as the explicit follow-ups I said I wouldn't fold in: DOC-40's four amendments, REQ-183's blocking dependency on §10.1, the REQ-179/180 lapse-reason reachability note, and the four new tickets.

<!-- xgd-turn id="bb557da3-bce9-429c-9693-9b8a52eddd77-user" -->

<!-- xgd-chat role="user" ts="2026-09-04T23:27:54.004501+00:00" -->
#### You
Be careful, some of the tickets that you are proposing to modify are under reconciliation right now. We will need to create follow on tickets to modify what they built instead - before you change anything else can you make a plan please?

<!-- xgd-turn id="bb557da3-bce9-429c-9693-9b8a52eddd77-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-04T23:29:26.580066+00:00" -->
#### Claude
Good catch — let me get the actual statuses before planning anything.

No in-flight ticket has been touched — the only edits so far were REQ-170 (`draft`) and the new DOC-42. Here's the picture and the plan.

## Status of everything in scope

| Ticket | Status | Safe to edit? |
|---|---|---|
| REQ-170 | `draft` | ✅ already done |
| REQ-183 | `draft` | ✅ |
| DOC-42 | `draft` | ✅ mine |
| DOC-40 | `open`, no commits | ⚠️ append-only — see below |
| REQ-168 | `ready_to_reconcile` v0.2.59 | ❌ frozen |
| REQ-169 | `ready_to_reconcile` v0.2.62 | ❌ frozen |
| REQ-178 | `ready_to_reconcile` v0.2.51 | ❌ frozen |
| REQ-179 | `ready_to_reconcile` v0.2.61 | ❌ frozen |
| REQ-180 | `ready_to_reconcile` v0.2.63 | ❌ frozen |
| REQ-161, REQ-167 | `bundled` | ❌ historical |

So four of the seven follow-ups I listed last turn were aimed at frozen tickets. Those become follow-ons.

## A risk I'd want to handle before anything else

**DOC-42 asserts that three things currently under reconciliation are wrong.** §10.1 targets `admit` (REQ-178/179), §10.2 targets the entitlements schema (REQ-167), §10.3 targets `platform_admin` (REQ-167/178/180). If a reconciler reads docs as intent, a live document saying "what you built is incorrect" is a drift generator aimed at five in-flight tickets.

Two mitigations, and I'd take both:
- **Keep DOC-42 in `draft`** until the in-flight set clears. It's already there; the point is not to promote it yet.
- **Reframe §10 as forward-looking.** It currently reads as "this is wrong." It should read as "this is correct for what was asked at the time, and here is the amendment it now needs" — which is also more accurate. That's an edit to my own draft, not to anyone's ticket.

Same logic for **DOC-40**: it has no commits so nothing reconciles against it, but it's cited as rationale by every frozen ticket. I'd make the amendments **append-only** — one new section pointing at DOC-42 — and leave §2/§5/§6 untouched in place until the in-flight set lands.

## Plan

**Phase 0 — now, zero risk**
1. Soften DOC-42 §10 to amendment framing; add a note that it is draft pending the in-flight set.
2. REQ-183 (draft): add the §10.1 dependency — its delete button is unreachable for a lapsed member — plus the membership-derived-portal statement.
3. Nothing else edited.

**Phase 1 — file the follow-ons now, as `draft`, blocked**

They can be written and reviewed immediately; only their *branches* need to wait.

- **F1 — Admission requires membership, not entitlement.** `admit`'s `no_entitlement` (`identity.ts:542`) stops refusing and becomes an admitted session with nothing selectable; deny copy; `firstAdmissible` in `scope.ts`. **Absorbs the lapse-reachability point** — REQ-180 D4's reasons are currently invisible to anyone whose businesses have *all* lapsed, and F1 is the fix, so it's an acceptance criterion here rather than its own ticket. Carries the DOC-37 compliance edge. *Blocked on REQ-178, REQ-179.*
- **F2 — Entitlement subject column.** Add the account subject; rename `account_id` → `business_id`. Migration + every entitlement reader. Amends DOC-40 §5. *Blocked on REQ-178, REQ-179; needs F1's shape settled first.*
- **F3 — Split `users.platform_admin`.** Ownership half → `memberships.role`; hosting/support half stays at `scope.ts:237`; `PLATFORM_ADMINS` env var retained as the seed. *Blocked on REQ-178, REQ-179, REQ-180.* **REQ-170 does not depend on this** — it models the gate correctly without the column changing.
- **F4 — "Platform tenant" sweep + guard.** `identity.ts` (12 occurrences, mostly comments and the `platformTenant` local), DOC-40 (8), on REQ-180 D5's guard-not-audit precedent. Leave the bundled tickets historical. *Code half blocked; the DOC-40 half is not.*

**Phase 2 — after the in-flight set reconciles**

Unblock F1 → F2 → F3 in that order, then F4's code half. And REQ-170's own implementation, which is where the sequencing actually bites (below).

## The sequencing problem worth deciding now

`identity.ts` and `scope.ts` are touched by four frozen tickets *and* by F1–F4 *and* by REQ-170. Cutting a free-coded branch on any of them before reconciliation completes will collide.

So: **REQ-170 can't be implemented yet either**, even though its ticket is editable. Unless you want to scope its first slice to the parts that don't touch those two files — the tab, the list, `mountFields` — and leave the gate reading `platform_admin` as-is, which F3 corrects later. That's a real option and it keeps REQ-170 moving.

## Two things I need from you

1. **Do the follow-ons get filed now as blocked drafts, or after the in-flight set lands?** Filing now captures the reasoning while it's fresh; the cost is four more open tickets. I'd file them now.
2. **Does REQ-170 wait, or ship a first slice that avoids `identity.ts`/`scope.ts`?**

I've changed nothing since your message. Say which way on those two and I'll execute Phase 0 and whatever you want of Phase 1.

<!-- xgd-chat-end -->