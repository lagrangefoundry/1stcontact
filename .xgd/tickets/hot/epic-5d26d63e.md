---
uid: epic-5d26d63e
id: EPIC-6
type: epic
title: 'Registrar management: purchase, transfer, renewal'
created_by: CHAT-48
created_at: '2026-09-12T20:49:21.083111+00:00'
updated_at: '2026-09-12T20:49:53.273157+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: medium
---

## What the client asked for

> "We need a flow/experience for dns purchase"
>
> "Registra management including purchase flow, transfer flow, billing reminders
> etc."

## The principle

**The customer owns their domain, and can leave with it.**

[[DOC-45]] §9 records the commercial half — *"registering `alicesplumbing.com` on
their behalf at cost removes the single largest friction step between forms C and
D"*. This epic is that, plus the obligations that come with holding something on
someone else's behalf.

## What exists today

Nothing. `1stc.site` is registered manually ([[TODO-6]] §5). There is no
registrar integration, no domain record, and no renewal tracking.

## Scope

1. **Purchase** — search, availability, price, and registration via the
   Cloudflare Registrar API, at cost.
2. **Registrant verification** — see below; it is a step, not a footnote.
3. **Transfer in** — a domain the customer already owns elsewhere, moved to us.
4. **Transfer out** — the exit path. Non-negotiable, see below.
5. **The domain record** — registrar, registrant, renewal date, lock state,
   auto-renew state, WHOIS privacy. This is the data the monitoring epic alerts
   on and the billing epic charges for.
6. **Renewal** — auto-renew, and what happens when the card fails.

## Decisions taken, and why

**The customer is the legal registrant, not us.** Anything else means we own
their business's front door, and it makes the exit promise below meaningless.

**Transfer out is built, not promised.** "Transfer flow" reads as transfer *in*;
both directions are in scope. Releasing the authorisation code on request, no
questions and no retention call, is cheap to build and is the thing that makes
*"we'll register it in your name"* credible rather than a lock-in story. A
customer who cannot picture leaving will not commit in the first place.

**Registration is at cost.** [[DOC-45]] §9's framing is friction removal, not
margin. Reselling domains at a markup turns a trust-building step into a line
item someone will price-check and find worse.

## Registrant verification is a state, with a clock

ICANN requires the registrant's email to be verified, and the mail goes to
**them**, not to us. They will ignore it — it arrives from an unfamiliar sender,
about a thing they just paid for and believe is done.

**They have 15 days before the domain is suspended.** A suspended domain does not
resolve, so the site and the mail both stop. This needs its own state, its own
visible status in Settings, and its own nag — the nag being ours, because we are
the only party who knows the deadline is running.

## The card, the expiry, and the failure that is not recoverable

A domain that lapses is not a billing incident, it is a business losing its
address — and during the redemption period, recovering it costs an order of
magnitude more than the renewal did. After that it is gone and anyone may take it.

- Auto-renew on, registrar lock on, and a card whose expiry is itself watched.
- A failing renewal charge escalates differently from a failing subscription
  charge: the subscription lapsing blocks the tabs, the domain lapsing takes the
  customer's website and email off the internet.
- The renewal date is **exposed here and alerted on elsewhere** — this epic owns
  the data, the monitoring epic owns the nagging.

## Boundaries

- **Taking the money** → billing epic. This epic knows what a domain costs and
  when it renews; Stripe lives over there.
- **Zone records and nameservers** → DNS management epic.
- **Alerting on approaching expiry** → monitoring epic, reading this epic's data.
- **`1stc.site`'s own registration hygiene** → [[TODO-6]] §5, which is operator
  work rather than product.

## Open questions

1. **Cloudflare Registrar's TLD coverage is narrower than a general registrar's**
   — notably around some ccTLDs, which matters for a UK customer base wanting
   `.co.uk`. What is the fallback when a customer wants a TLD we cannot register?
2. **Do we hold domains for customers who have not yet paid** for a full period,
   and what happens to the domain if they stop paying us but the domain is in
   their name?
3. **Who is the technical contact**, given the registrant is the customer but the
   nameservers are ours?

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
| [[EPIC-6]] | Registrar management | purchase, transfer, renewal | ← **this epic**
| [[EPIC-7]] | DNS checks and monitoring | the check/notify engine |
| [[EPIC-8]] | Monitoring tab | site health and site metrics |
| [[EPIC-9]] | Billing and payments | Stripe, subscriptions, invoices |

**Surfaces:** [[EPIC-4]], [[EPIC-8]], and [[EPIC-9]]'s (contested — see that
ticket).
**Capabilities:** [[EPIC-5]], [[EPIC-6]], [[EPIC-7]].

**The one cross-epic interface** is the propagation suppression window:
[[EPIC-5]] and [[EPIC-6]] tell [[EPIC-7]] *"I just changed this, expect it to be
wrong until T"*. Specified by the writers, consumed by the checker. Nothing else
crosses.

**Also see** [[TODO-6]] — `1stc.site` housekeeping, whose PSL submission has a
multi-week lead time and no shortcut, so it wants starting before any of this.
