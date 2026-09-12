---
uid: epic-ce0874f2
id: EPIC-9
type: epic
title: 'Billing and payments: Stripe, subscriptions, invoices'
created_by: CHAT-48
created_at: '2026-09-12T20:49:33.626917+00:00'
updated_at: '2026-09-12T21:01:25.387679+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: medium
---

> **Rewritten 2026-09-12.** The first draft of this epic scoped billing as *"what
> the account pays us"* and argued at length that it could not be a tab. That was
> wrong, and wrong in a way [[DOC-40]] §2.1 rule 1 names explicitly: it split one
> capability into a platform-only half and a customer-facing half, which is *"the
> failure mode … it is the same page a customer needs, and building it twice
> forfeits the whole of this section."* Corrected below. The tab objection is
> withdrawn; the reason it fails is recorded in "The deadlock does not exist"
> rather than deleted, because it was the thing that surfaced the error.

## What the client asked for

> "Billing and payments - required for 3 it will provide a billing tab, stripe
> integration, subscription billing, invoices, payments (through stripe).
> billing and payment records"

And, correcting the first draft:

> "NO Epic 9 is the whole system both sides are needed"
>
> "There are two control surfaces required - one for the site owner which is
> exactly per-business - and one for the customer which is account scoped. I need
> a control surface in first contact to set up pricing, cadences, special offers
> and review state. The customer needs a billing and payments area for them to
> pay me. But the system has two levels - the 1st level users are site owners who
> need the billing tab to charge their customers (2nd level users), right?"

Yes — and it is already written down.

## The principle

**One billing capability, built once, pointed at a different business depending
on who is looking.**

[[DOC-42]] §1 states it in the product's own example and leaves nothing to
interpret:

> Bob logs in to Alice's Plumbing and reaches a **User Portal**: his payments to
> Alice, his details, his delete button. Alice logs in to 1st Contact and reaches
> **her** User Portal: her payments to 1st Contact, her details, her delete
> button. **Those two are the same thing.** Not analogous, not one level up — the
> same surface, the same code, pointed at a different business.

[[DOC-40]] §2.1's table says the same of the configuring half: *"bills a customer
from that portal → our billing is the platform business's payments surface"*.

## The two surfaces, and which is which

| | Surface | Scope | Who uses it | Where it lives |
| --- | --- | --- | --- | --- |
| **Configure** | set pricing, cadences, offers, review state; see what is owed to this business | **business** | the business owner | a **tab** — this is the billing tab |
| **Pay** | see what I owe, pay it, get an invoice, change my card | **account**, relative to a business ([[DOC-42]] §6) | that business's customers | the **User Portal** |

Both are used by both levels, because level is a position and not a property
([[DOC-42]] §3):

- Alice opens the **billing tab** in her business to set what she charges Bob.
- Bob opens his **Portal** on Alice's Plumbing to pay her.
- 1st Contact opens the **same billing tab**, in the 1st Contact business, to set
  what it charges Alice.
- Alice opens her **Portal** on 1st Contact to pay us — which is the Account
  surface already in the builder chrome, and [[DOC-40]] §2.1 is explicit that it
  *"is not a builder feature … it appears in the builder chrome because that is
  where a person looks for it"*.

**There is no platform-only billing anything.** [[DOC-42]] §2: *"'Platform
tenant' names a kind of tenant, and no such kind exists. Once the phrase is in
the vocabulary the code follows it, and the result is capability built
platform-only."*

## The deadlock does not exist, and §5 is why

The first draft objected that a billing tab would be blocked by `blockTabs` when
a grant lapsed — locking a customer out of the surface they need in order to pay.
That was a real mechanism read against the wrong surface.

**You do not pay in the tab. You pay in the Portal.** And [[DOC-42]] §5 makes
Portal access structurally unblockable, for this exact reason:

> A member reaches their User Portal by virtue of being a member … If that access
> were a row, it could be absent … and the failure mode is a person who can log
> in but cannot reach the surface where they would fix anything.

So the entitled-product line at `apps/control-app/src/builder/app.js:270` is
correct as it stands: the billing **tab** is a capability Alice pays for, and
blocking it on lapse is right. The billing **Portal** is membership, and cannot
lapse. The architecture had already answered this.

## What exists today

Nothing. No Stripe dependency anywhere in `apps/` or `packages/`, no
subscription, invoice or price concept, and no Portal — [[DOC-42]] §5 specifies
it and nothing implements it. `openAccountSurface`
(`apps/control-app/src/builder/business.js:253`) is a thin modal showing the
signed-in email, and is the seed the Portal grows from.

## Stripe Connect is the consequence, and it is the biggest fact in this epic

Alice charging Bob is **not** us taking a payment. It is us facilitating a
payment between two third parties, and that is Stripe **Connect**, not plain
Stripe. This changes the epic's size and its risk profile:

- **Every business that charges anyone needs its own connected account**, created
  and verified before it can take a penny.
- **That verification is KYC and it is regulatory, not a form we can soften.**
  Legal identity, date of birth, address, bank details, and for companies the
  ownership structure. Stripe can host it (Express), but Alice still has to do
  it.
- **It will be the single highest-dropout step in the product** — comparable to
  the nameserver paste in [[EPIC-5]], and worse, because it asks a sole trader
  for photo ID before they have earned anything. It deserves the same treatment
  that epic gives its cliff: detect, explain in their language, and do every part
  of it we are allowed to do for them.
- **Merchant of record determines who eats chargebacks.** Recommendation: direct
  charges with Alice as merchant of record, so disputes on Alice's sales are
  Alice's, and we stay out of the flow of funds. Destination or separate
  charges pull liability onto us and bring obligations worth avoiding at this
  stage.
- **Account type.** Standard gives Alice a full Stripe dashboard and the least
  work for us; Express is Stripe-hosted onboarding with a lighter dashboard and
  fits a sole trader better; Custom means we own the whole compliance surface and
  should be ruled out now rather than considered later.

**The 1st Contact business holds a connected account like every other business.**
If it did not — if charging Alice used the platform account directly — the code
would need a predicate meaning *"is this our own tenant"*, which is precisely
[[DOC-42]] §3's falsifier and §2's named failure. It also works out
arithmetically without a branch: the platform fee on a 1st Contact charge is
simply the whole of it.

## Scope

1. **Connect onboarding** — connected account creation, the KYC journey, and the
   states a business can be in before it may charge.
2. **The billing tab** — business-scoped: prices, cadences, offers, review state,
   and what is currently owed to this business.
3. **The User Portal** — [[DOC-42]] §5's surface: what I owe, pay it, invoices,
   card, details, delete button. Built once, used at both levels.
4. **Charging** — one-off and recurring, on a connected account.
5. **Invoices and payment records** — retained by us, not fetched live from
   Stripe on every read.
6. **Entitlement** — the grant the shell already checks
   (`apps/control-app/src/builder/app.js:270`) becomes something billing drives.
   Note [[DOC-42]] §6: the subject is an **account**, and per-business capacity
   and per-account access are different grants.
7. **One-off charges for domains** at cost, from [[EPIC-6]].

## Decisions taken, and why

**Webhooks are the source of truth, not the checkout redirect.** A customer who
closes the tab after paying must still end up paid-up. Treating the success
redirect as confirmation produces "I paid and it didn't work", which is the worst
support ticket a young product can take — and at level 2 it is *Alice's* support
ticket, from *her* customer, caused by us.

**Webhook handling is idempotent and signature-verified.** Stripe retries and the
endpoint is public. [[TODO-5]] established the pattern for the Resend webhook —
signing secret as a per-environment Worker secret — and this is the same shape
with money in it.

**Nothing is built platform-only** ([[DOC-40]] §2.1 rule 1). Every screen in this
epic must be reachable by a customer business, or it is the bespoke admin billing
page the document forbids. This is the acceptance test for the whole epic.

## What this epic must not get wrong

- **SCA / 3-D Secure.** A UK/EU customer base means a real share of payments need
  a second authentication step, including on automatic renewals, which fail
  asynchronously. Adding SCA after the happy path is a rewrite.
- **VAT.** Place-of-supply, VAT numbers on invoices, and — at level 2 — *Alice's*
  VAT position, which is hers and not ours but which our invoices represent.
- **Dunning**, and the fact that [[EPIC-6]]'s domain lapse must not share a
  dunning path with a subscription lapse: one blocks the tabs, the other takes a
  customer's website and email off the internet.
- **Refunds and disputes at level 2**, where the aggrieved party is a stranger to
  us and the merchant is our customer.

## Boundaries

- **What a domain costs and when it renews** → [[EPIC-6]] owns the data; this
  epic charges for it.
- **Alerting on a failed card or an approaching renewal** → [[EPIC-7]], which
  owns notification routing.
- **Which surface a control appears on** → [[EPIC-4]] for the tab strip's shape;
  this epic owns what is on the billing tab.

## Open questions

1. **"Review state" — what is being reviewed?** Read as an approval step before
   a charge goes out (Alice approves an invoice before Bob is billed). Could
   equally mean customer reviews/testimonials, which is a different feature
   entirely. Needs one sentence from the client before anything is scoped.
2. **Connect account type** — Express recommended; Standard defensible; Custom
   ruled out.
3. **Do we take a cut of Alice's sales**, or is Connect purely a feature she pays
   a subscription for? This decides the pricing model and whether application
   fees exist at all.
4. **Is this one epic?** It now contains a regulated onboarding flow, a
   two-sided payment system and the Portal — the Portal in particular is
   load-bearing for [[DOC-42]] §5 and [[DOC-37]] erasure, neither of which is
   about money. Splitting the Portal out is worth considering.

## Siblings

The six epics scoped together in [[CHAT-48]].

| Epic | | |
| --- | --- | --- |
| [[EPIC-4]] | Settings tab | business, site and subdomain (1stc.site) management |
| [[EPIC-5]] | DNS management | nameservers, records, and AI tools |
| [[EPIC-6]] | Registrar management | purchase, transfer, renewal |
| [[EPIC-7]] | DNS checks and monitoring | the check/notify engine |
| [[EPIC-8]] | Monitoring tab | site health and site metrics |
| [[EPIC-9]] | Billing and payments | Stripe, subscriptions, invoices | ← **this epic**

**The one cross-epic interface** among the domain four is the propagation
suppression window: [[EPIC-5]] and [[EPIC-6]] tell [[EPIC-7]] *"I just changed
this, expect it to be wrong until T"*.

**Also see** [[TODO-6]] — `1stc.site` housekeeping, whose PSL submission has a
multi-week lead time and no shortcut.

## Children

None yet.
