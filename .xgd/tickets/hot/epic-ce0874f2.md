---
uid: epic-ce0874f2
id: EPIC-9
type: epic
title: 'Billing and payments: Stripe, subscriptions, invoices'
created_by: CHAT-48
created_at: '2026-09-12T20:49:33.626917+00:00'
updated_at: '2026-11-03T21:20:54.096168+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: medium
  chat_comment: comment-cb96f2ef
---

> **Revised 2026-11-02 ([[CHAT-86]]).** Decisions from scoping the first shop ([[EPIC-31]], [[GOAL-55]]) are in "Decisions taken 2026-11-02" below. Where an earlier line in this epic says otherwise, that section wins. Scope item 5 and open questions 2 and 3 are amended in place.

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
   *Split 2026-11-02:* **linking an existing account** (Stripe-hosted OAuth, plus a Payments section in the Settings tab (operator confirmed) showing the business's connected state) is in [[GOAL-55]]'s minimum. **Creating an account inside our UI** is a fast follow: we create the account through Stripe's API and embed Stripe's onboarding component, so Stripe collects the identity details without the owner leaving 1st Contact. A business with no account can already create one from Stripe's hosted page at launch. Confirm at design time that embedded onboarding supports accounts with full Stripe dashboard access (Standard-like); if not, a Stripe-hosted Account Link is the fallback.
2. **The billing tab** — business-scoped: prices, cadences, offers, review state,
   and what is currently owed to this business.
3. **The User Portal** — [[DOC-42]] §5's surface: what I owe, pay it, invoices,
   card, details, delete button. Built once, used at both levels.
4. **Charging** — one-off and recurring, on a connected account. One-off charging must support **manual capture** (hold, then capture or release) and partial refunds. [[EPIC-31]] captures when the owner ships.
5. **Invoices and payment records.** ~~Retained by us, not fetched live from
   Stripe on every read.~~ *Amended 2026-11-02:*
   - One-off invoices, orders and credit notes are **our** records.
   - Subscription invoices are **Stripe's**.
   - Every Stripe-owned record we hold (payments, refunds, subscriptions, subscription invoices) is a **cache**, not a copy. See "Decisions taken 2026-11-02".
6. **Entitlement** — the grant the shell already checks
   (`apps/control-app/src/builder/app.js:270`) becomes something billing drives.
   Note [[DOC-42]] §6: the subject is an **account**, and per-business capacity
   and per-account access are different grants.
7. **Domain charges** at cost, from [[EPIC-6]]. *Corrected 2026-11-02:* these are a **subscription** (a domain renews yearly), not a one-off charge.

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

## Decisions taken 2026-11-02 ([[CHAT-86]])

Taken while scoping [[EPIC-31]] (the Shop) for its first customer, Lauren Owens Jewellery.

**Stripe is the only payments integration.** No other third party: no cart service, and no billing engine such as Lago or Kill Bill. The open-source commerce and billing engines (Medusa, Vendure, Saleor, Lago, Kill Bill, Invoice Ninja) all need their own server and Postgres. Running one would mean a second backend outside Cloudflare. Open source is welcome at the library level: `stripe` (runs on Workers), Dinero.js for money, and `pdf-lib` for invoice PDFs.

**Subscriptions are owned by Stripe Billing.** Running subscriptions ourselves was considered and rejected by the operator as "way more complex than people give it credit". Stripe Billing owns the subscription, its invoices, failed-renewal retries, re-authentication and dunning emails. Its fee is roughly 0.7% of subscription volume; check the current rate.

**One-off invoices are ours, not Stripe Invoicing's.** Shop orders and deposits are invoiced by us (domain charges are a subscription; see scope item 7), and the money is taken by a plain Stripe payment. Stripe Invoicing charges 0.4% per paid one-off invoice (Starter tier), and Checkout's `invoice_creation` option triggers that fee. **Never enable `invoice_creation`.**

**One Invoice concept, two sources.**
- An invoice record has a source of either `internal` or `stripe`.
- `internal` invoices are authoritative records. `stripe` invoices are cache entries keyed by the Stripe invoice ID.
- The owner sees one invoice list.
- Numbering uses two series with distinct prefixes. Our series is gap-free per business and assigned when the money is taken, so an abandoned checkout never consumes a number. As far as we know, EU VAT permits more than one sequential series; confirm with an Irish accountant.

**Every payment is linked to an invoice.** *Strengthened 2026-11-02 (operator: "every payment and payment attempt should have an invoice that links the payment to an order or a subscription").*
- **Invoice objects always exist.** Whether an invoice becomes a PDF, is emailed, or is shown to the buyer is a separate, later question. The record is not optional, and it is not deferred, whatever the business's VAT position.
- **Every payment attempt has an invoice, from the moment the attempt is made.** The invoice exists, as a draft, before any money moves. One invoice can have many attempts, for example a declined card followed by a retry.
- **Every invoice links to exactly one order or exactly one subscription.** The invoice is the join between a payment and what it pays for. Payments never link to orders or subscriptions directly.
- A one-off payment carries `{business_id, invoice_id}` (plus `order_id` for shop orders) in its Stripe metadata.
- A subscription payment is linked to its Stripe invoice (`source = stripe`), and that invoice links to the subscription.
- **A draft invoice has no number.** The gap-free number is assigned when the money is taken. An abandoned or expired attempt voids its draft invoice, so it never consumes a number.
- A refund issues our credit note against an internal invoice.
- **Domain charges are a subscription** (operator, 2026-11-02), so their invoices link to a subscription like any other, and no third kind of target is needed. Two constraints carry over from [[EPIC-6]]:
  - **The consequence of a failed renewal differs.** A lapsed subscription blocks the tabs; a lapsed domain takes the website and email off the internet. Stripe Billing's retry settings are largely account-wide, so the difference has to live in how we handle a domain subscription that is `past_due`.
  - **The charge must lead the registrar's renewal date**, with enough margin to retry a failed card before the domain actually expires.

**Cache, not copy** (operator: "I am nervous about maintaining a copy of the data").
- Stripe is the single source of truth for every money state.
- Our D1 rows for Stripe objects are a cache keyed by Stripe ID. A webhook refreshes or drops a row, and a cache miss reads from Stripe.
- Any cache row can be deleted with no loss.
- Records we own (orders, internal invoices, credit notes, inventory) are not cache, and each one points at Stripe by ID.

**Connect account type: Standard,** because it is the only type that can **link an existing Stripe account**. Lauren already has one, through the WooCommerce Stripe Gateway, and must keep her history and payouts. Express always creates a new account. Confirm Stripe's current mechanism for connecting an existing account at design time. Charges are direct charges, with the business as merchant of record, as recommended above.

**No platform fee during the beta.** The operator, 2026-11-02: Lauren is a friend and this is a beta. Revisit later.

## Decisions taken 2026-11-02: the launch shape for [[GOAL-55]]

Agreed with the [[EPIC-31]] session through [[GOAL-55]], which holds the full minimum, the ownership split and the handshake.

- **Automatic capture at launch.** Manual capture (hold, capture on ship, release) is a fast follow. It is not a legal requirement in Ireland or the EU.
- **Cards, Apple Pay and Google Pay only**, so every payment confirms during checkout.
- **Dashboard refunds reach us by webhook**, with our credit note. The refund operation comes with the Shop's Refund button.
- **The mode is stored on each order at creation**, and every later call and webhook for that order uses it. **One webhook endpoint per mode**, each with its own signing secret; an event whose `livemode` does not match its endpoint or its order is rejected.
- **`account.application.deauthorized` is handled.** A Standard account holder can disconnect us from their own dashboard, and the business must then stop taking money.
- **The live smoke test is a small real purchase plus a refund**, since authorise-and-void needs manual capture. It runs on our own test business (below), with our own card.

### Testing on our own Stripe accounts (operator, 2026-11-02)

*"This is not all about Lauren's stripe account, we need our own for testing."*

- **Our platform account** is 1st Contact's own Stripe account with Connect enabled. Its test keys run in dev and local; production holds both test and live keys as per-environment Worker secrets. At start-up, check that the test and live keys are the right way round (`sk_test_`, `sk_live_`).
- **A test business of ours** is a 1st Contact business with its own Standard Stripe account that we own, linked through the same Connect flow every business uses. This proves the link flow before any customer uses it, and is consistent with "the 1st Contact business holds a connected account like every other business": testing needs no predicate meaning "is this our own tenant".
- **Its test side** carries all repeatable testing, including [[EPIC-15]]'s synthetic probes. **Its live side** carries live smoke tests with our own card, refunded; the money is ours.
- **A customer's account** gets one test-mode run once linked, then goes live. Routine testing never touches it.
- **Test orders are never shippable**, in any business: a test-mode order never appears in a "to ship" list. A bug that puts a real shop into test mode then leaves buyers unable to pay, not goods sent for a test card.

### Test customers on a customer's shop (proposed, operator to decide)

The operator proposed a small set of test customers, identified by email, whose payments go to Stripe test mode. The trade-off: easy repeatable tests against the real deployed code, against the risk of a bug sending real payments to the wrong place. **Our own test business covers most of this need with none of the risk**, so this is only needed for testing on a real customer's shop.

- **The email alone must not select test mode.** The buy flow has no login, so the email is typed by an anonymous buyer. A real buyer routed to test mode "pays" with a test card and could be shipped real goods; a test buyer routed to live is only declined or refunded. Live is therefore the default, and test mode needs proof.
- **If built:** only a signed marker ([[DOC-54]] R1) selects test mode; the email allowlist becomes the list of people who can be sent the marker by magic link. A missing or bad marker means live. Test orders are synthetic ([[DOC-54]] R2/R3) and hidden from the Shop tab, test purchases use a hidden test product so a real piece is never held, and test invoices use their own number series.

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
   **Answered 2026-11-02: Standard**, so existing Stripe accounts can be linked. See "Decisions taken 2026-11-02".
3. **Do we take a cut of Alice's sales**, or is Connect purely a feature she pays
   a subscription for? This decides the pricing model and whether application
   fees exist at all.
   **Answered for the beta, 2026-11-02: no platform fee.** Revisit after the beta.
4. **Is this one epic?** It now contains a regulated onboarding flow, a
   two-sided payment system and the Portal — the Portal in particular is
   load-bearing for [[DOC-42]] §5 and [[DOC-37]] erasure, neither of which is
   about money. Splitting the Portal out is worth considering.

5. **Contact deletion and invoices.** *Settled 2026-11-03; the rules now live in [[DOC-37]]* (§4.2 closing a business, §6.1 what is kept and why, §6.3 the reduced identity record, §7.1 the automated lifecycle). In short: every record of money moving is kept for 7 years from when the money moved, joined to an identity record reduced to name and billing address, and everything else is deleted by one daily job, 30 days after the request unless deferred with a reason. What this epic and [[EPIC-31]] must build to match:
   - **Orders** ([[EPIC-31]]): `orders.contact_id` is `ON DELETE SET NULL` for an order with a `paid`, `part credited` or `credited` invoice. An order whose invoices are all `draft` or `void` goes with the contact. Delivery address and buyer notes live in the identity store, never on the order.
   - **Subscriptions:** deletion cancels them, and cancellation only turns off renewal (`cancel_at_period_end`). The service runs to the end of the term with no refund. The person's Stripe customer on the connected account is deleted once the last subscription ends.
   - **The statutory cooling-off period overrides "no refund"** (found 2026-11-03; a lawyer must confirm the details). UK and EU **consumers** buying at a distance can cancel within **14 days of the contract starting**: from sign-up, not "14 days before the end of the term". This applies to annual and monthly billing alike. If they asked the service to start straight away, they are refunded the unused part, pro rata. UK only: the Digital Markets, Competition and Consumers Act 2024 adds a fresh 14-day window after each renewal of a subscription of 12 months or more, and after a free or discounted trial converts to paid. Its commencement date needs checking. Physical goods from the Shop have their own 14 days from delivery, plus return of the goods ([[EPIC-31]]). **Operator requirement: these refunds are automated, never done by hand.** The rule therefore becomes:
     - **Cancelling inside a cooling-off window ends the subscription at once and refunds the unused part automatically**, by a pro-rata Stripe refund with its credit note ([[REQ-637]]).
     - **Cancelling outside one only turns off renewal**, as above.
     - **It applies to everyone (operator, 2026-11-03)**: every buyer, in every country, consumer or business. There is no consumer or country test. **The windows:**
       - 14 days from the start of any subscription
       - 14 days after each renewal of a subscription of 12 months or more
       - 14 days after a free or discounted trial converts to paid
       - We give these whether or not the UK DMCC Act is yet in force, so the rule never depends on its commencement date.
     - The same automated rule applies to subscriptions businesses sell to their own customers, by default.
   - **Money records hold no identity of their own**: invoices, lines, credit notes and the payment cache reference the person or the order only.
   - **Registry declarations** for [[DOC-37]] §7, once the registry exists: paid live invoices, their lines, credit notes and payment-cache rows are `retain-with-reason`, with their clock running from when the money moved. Every other invoice row is `delete`, and `orders` is `retain-with-reason` when paid.
   - **[[REQ-637]]'s delete guard** refuses deleting a paid live invoice for ever. The job that runs [[DOC-37]] §7.1 rule 5 must loosen it to "refused until 7 years after it was paid".
   - **Synthetic records** are always collected by the test-data sweep, whatever their state.
   - **Terms and privacy notice** must disclose that we keep money records, including a business's own sales, for disputes ([[DOC-37]] §6.1). That work is [[REQ-640]], and the text needs a lawyer's review.

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

- [[TODO-18]]: operator task, set up the Stripe accounts: the 1st Contact platform account (Connect, OAuth, keys) and 1st Contact's own business account. Blocks the payments foundation.
- [[REQ-637]]: invoice records, gap-free numbering and credit notes. No Stripe calls; can start before [[TODO-18]].
- [[REQ-641]]: connect a business's Stripe account. Settings → Payments, OAuth linking, the four connection states, Disconnect, and key and mode safety. Connection only, with no webhooks or payments. Buildable now in the sandbox; live mode needs [[TODO-20]].
- [[REQ-640]]: erasure disclosures. Brings the portal's erasure page, the Privacy Notice and the Terms into line with [[DOC-37]]'s deletion lifecycle. Must land before the first live payment.

## Related

- [[EPIC-31]], the Shop tab: the first consumer of one-off charging, manual capture, refunds and internal invoices.
- [[GOAL-55]], "Simple ecom site": names the minimum of this epic needed to get the first shop live.

## The test gutter — this epic's share ([[DOC-54]])

Two obligations, and the second is larger than it looks because nothing here is built
yet — which makes both of them free today.

**1. Any table that hangs off a contact carries the mark and cascades.** [[DOC-54]] §3:
add `synthetic NOT NULL DEFAULT 0` and `run_id`, and declare
`FOREIGN KEY (contact_id) REFERENCES users (id) ON DELETE CASCADE` as
`user_acceptances`, `asset_grants` and `contact_events` already do. **The one exception is
financial records:** an order with a paid invoice is kept and its contact link is set to null
rather than cascaded, because [[DOC-37]] §6.1 keeps the transaction and reduces the person (§6.3).
See open question 5. Without the
cascade, [[EPIC-15]]'s collector and the delete-contact affordance both silently leave
this epic's rows behind — a contact removed from the list whose payment history
survives is the *"we deleted them but kept the history"* mistake `0001_baseline.sql`
warns about, in the one domain where it is also a legal problem.

**2. This epic owns how the payments path is made synthetically testable**, and the
client's requirement is settled even though the mechanism is not: *we need a full
synthetic test path available.* [[EPIC-15]]'s decisions section holds the analysis; the
decision is this epic's to take when it designs credential handling, which is the
moment it is cheap.

The constraining fact: **Stripe test mode is a separate environment, not a sandbox
overlay on live.** Test and live objects occupy different ID spaces and cannot
reference each other, and the two modes deliver webhooks under **different signing
secrets** — so any design must know which mode a request is in before it can even
verify the callback. The two viable shapes are complementary rather than alternatives:
test credentials loaded in production and selected by the marker (full production code
path including capture, canary tier only, because test objects cannot reference a live
connected account), and a real card authorised-and-voided on live keys (the only shape
that reaches a real connected account, and cheaper than charge-and-refund because a
void leaves no processing fee behind).

**The rule that follows, whichever is chosen: the signed marker is the only permitted
input to credential selection.** This promotes [[DOC-54]] R1's unforgeability from
tidiness to load-bearing for money — the dangerous failure is silent, since picking a
test key for a real customer means the money never moves while our record says a
payment succeeded.

**Available regardless, and worth having anyway:** `charges_enabled` / `payouts_enabled`
per connected account, which catches the real failure mode — Stripe disables an account
when verification requirements change and the business finds out when the money stops —
and `requirements.currently_due` / `past_due`, where warning the business *before* the
deadline is a product feature rather than monitoring.