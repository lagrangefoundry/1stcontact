---
uid: epic-ce0874f2
id: EPIC-9
type: epic
title: 'Billing and payments: Stripe, subscriptions, invoices'
created_by: CHAT-48
created_at: '2026-09-12T20:49:33.626917+00:00'
updated_at: '2026-09-12T20:49:57.456139+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: medium
---

## What the client asked for

> "Billing and payments - required for 3 it will provide a billing tab, stripe
> integration, subscription billing, invoices, payments (through stripe).
> billing and payment records"

## The principle

**An account can always see what it owes, always pay it, and always get an
invoice for what it paid — including when its subscription has lapsed.**

The last clause is the one that shapes the design, and it is why the surface
cannot be where the client asked for it. See below; everything else in this epic
is ordinary.

## What exists today

Nothing. There is no Stripe dependency anywhere in `apps/` or `packages/`, no
subscription concept, no entitlement record beyond the grant check the shell
already performs, and no invoice.

## A naming collision worth settling first

[[DOC-40]] §2 says a **business** owns *"a website, a customer list, a calendar,
payments, marketing, monitoring"*. Those "payments" are **the customer's own
customers paying them** — a future product, business-scoped.

This epic is the other thing: **what the account pays us.** Two different
payment systems, different scopes, different Stripe objects, possibly different
Stripe accounts. They should not share a vocabulary, and the word "payments"
should probably belong to the customer-facing one, since that is the one their
customers see.

## The billing tab does not work, for two independent reasons

Both are provable from code and documents that already exist, and either alone is
sufficient.

**1. Billing is account-scoped, and the tab strip is uniformly business-scoped.**

[[DOC-40]] §2 is explicit: *"**Account** — the payer, and **not a tenant of its
own**. One account may own several businesses."* The example given is Lagrange
Foundry holding *Lagrange Foundry*, *1st Contact* and *XGD*.

The tab strip's rule ([[REQ-179]],
`apps/control-app/src/builder/app.js:194-209`) is that every tab is
business-scoped, so the shell's business switcher applies to all of them. The
Account surface was kept *out* of the strip for exactly this reason — it is
*"the one surface that is not business-scoped, so a tab for it would be the
single place where the shell's switcher is present and silently does not apply
— and a control that is present and ignored reads as a bug."*

A billing tab reproduces that bug precisely. Switch business, and the invoice
list does not change.

**2. A billing tab is blocked exactly when it is needed.**

`apps/control-app/src/builder/app.js:270` records the line from [[DOC-42]] §5:
*"the tab strip is the entitled product, and the chrome is a fact about this
person's relationship with us. So the switcher, the account, Theme and About all
stay live, and only what a grant buys goes."* When a grant lapses, `blockTabs`
blocks the strip.

So a billing tab would be blocked when the subscription lapses — which is the one
moment a customer needs to reach billing, in order to pay and un-lapse. That is a
deadlock, not an inconvenience, and it is the kind that generates support mail
from people actively trying to give us money.

**The recommendation: billing lives in the Account surface.**
`openAccountSurface` (`apps/control-app/src/builder/business.js:253`) already
sits in the header's trailing slot, is already account-scoped, and already stays
live when tabs are blocked. It is currently a thin modal and would need to grow
into a real surface — but it is growing in the direction it was designed for,
and both problems above disappear rather than being worked around.

This is the client's call. It is written at length because it is cheap now and
expensive after a tab exists.

## Scope

1. **Stripe integration** — customer, subscription, payment method, webhooks.
2. **Subscription billing** — the recurring product charge, per account, with
   whatever per-business dimension pricing turns out to need.
3. **One-off charges** — domain registration and renewal at cost, from the
   registrar epic. Not everything is a subscription, and Stripe models the two
   differently.
4. **Invoices and payment records** — retrievable history, downloadable, and
   retained independently of Stripe.
5. **The surface** — Account, per above, pending the client's decision.
6. **Entitlement** — the grant the shell already checks becomes something billing
   actually drives.

## Decisions taken, and why

**Webhooks are the source of truth, not the checkout redirect.** A customer who
closes the tab after paying must still end up subscribed. Every Stripe
integration that treats the success redirect as confirmation has this bug, and it
presents as "I paid and it didn't work", which is the worst support ticket a
young product can receive.

**Webhook handling must be idempotent and signature-verified.** Stripe retries,
and the endpoint is public. [[TODO-5]] already established the pattern for the
Resend webhook — signing secret as a Worker secret, per environment — and this is
the same shape with more at stake.

**Keep our own record of what was charged.** Invoices and payment records are
retained by us, not fetched live from Stripe on every read. A billing history
that is unavailable when Stripe is unavailable is not a record.

## What this epic must not get wrong

- **SCA / 3-D Secure.** A UK or EU customer base means a meaningful share of
  payments need a second authentication step, including on *automatic renewals*,
  which fail asynchronously and need the customer brought back to authorise.
  Building the happy path first and adding SCA later is a rewrite.
- **VAT.** Selling to UK and EU businesses means tax handling, place-of-supply
  rules, and VAT numbers on invoices. Stripe Tax exists; the decision to use it
  should be made before invoices are designed rather than after.
- **Dunning.** What happens between a failed charge and a lapsed grant — how many
  retries, over how long, with what messages. Silence then sudden blockage is the
  failure mode.
- **The domain lapse is not the subscription lapse.** The registrar epic makes
  this point from the other side: a failed subscription charge blocks the tabs; a
  failed *domain renewal* takes the customer's website and email off the
  internet, and after redemption the domain is gone. These escalate differently
  and must not share a dunning path.

## Boundaries

- **What a domain costs and when it renews** → registrar epic owns the data; this
  epic charges for it.
- **Alerting on an approaching renewal or a failed card** → monitoring/checks
  epics, which already own notification routing.
- **The customer's own customers paying them** → not this epic, and ideally not
  this vocabulary. See the naming collision above.

## Open questions

1. **Is the subscription per account or per business?** [[DOC-40]] §2 says the
   account is the payer, which suggests per account with business count as a
   pricing dimension. But every business has its own site, so per business is
   defensible. This decision determines the data model and is hard to reverse.
2. **Where does the surface live** — Account (recommended) or a tab (as asked
   for), knowing the two failures above.
3. **Stripe Checkout or Elements**, which is mostly a question of how much of the
   SCA and card-update machinery we want to own.
4. **Trials, and what a lapsed account can still reach** — [[DOC-42]] §5 says the
   chrome stays and the tabs go, but a customer's *published site* going down
   because they missed a card update is a different severity again, and nothing
   currently says whether it does.

## Children

None yet.


## Siblings

The six epics scoped together in [[CHAT-48]]. Three are surfaces and three are
capabilities, and the split is deliberate: a surface renders what a capability
computes, and never computes it a second time.

| Epic | | |
| --- | --- | --- |
| [[EPIC-4]] | Settings tab | business, site and subdomain (1stc.site) management |
| [[EPIC-5]] | DNS management | nameservers, records, and AI tools |
| [[EPIC-6]] | Registrar management | purchase, transfer, renewal |
| [[EPIC-7]] | DNS checks and monitoring | the check/notify engine |
| [[EPIC-8]] | Monitoring tab | site health and site metrics |
| [[EPIC-9]] | Billing and payments | Stripe, subscriptions, invoices | ← **this epic**

**Surfaces:** [[EPIC-4]], [[EPIC-8]], and [[EPIC-9]]'s (contested — see that
ticket).
**Capabilities:** [[EPIC-5]], [[EPIC-6]], [[EPIC-7]].

**The one cross-epic interface** is the propagation suppression window:
[[EPIC-5]] and [[EPIC-6]] tell [[EPIC-7]] *"I just changed this, expect it to be
wrong until T"*. Specified by the writers, consumed by the checker. Nothing else
crosses.

**Also see** [[TODO-6]] — `1stc.site` housekeeping, whose PSL submission has a
multi-week lead time and no shortcut, so it wants starting before any of this.
