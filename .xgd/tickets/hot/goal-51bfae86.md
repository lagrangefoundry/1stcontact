---
uid: goal-51bfae86
id: GOAL-55
type: goal
title: Simple ecom site
created_by: CHAT-86
created_at: '2026-11-02T17:23:17.717403+00:00'
updated_at: '2026-11-02T17:23:17.717403+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  provenance: planned
  workstream: false
  children:
  - epic-ce0874f2
  - epic-8146aecd
---

## Purpose

**A simple ecom site:** a sole trader sells physical goods from a 1st Contact site, with Stripe for payments only and no other third party. The first customer is **Lauren Owens Jewellery** (laurenowensjewellery.ie), a friend of the operator who is moving from a WooCommerce site whose renewal is due. This goal is **done when her shop is live on 1st Contact and taking real orders**. Scoped in [[CHAT-86]] on 2026-11-02.

The work lives in two epics:
- [[EPIC-9]]: billing and payments
- [[EPIC-31]]: the Shop tab

This goal names the **minimum** from each to get her live. Everything else in those epics waits.

## Minimum from EPIC-9 (payments)

1. **Connect: link her existing Stripe account.** She already takes payments through Stripe, via the WooCommerce Stripe Gateway. Her account is connected as a Standard account, so her history and payouts stay where they are. We hold the business's connected state and check `charges_enabled`. Charges are direct charges, with her as merchant of record.
2. **No platform fee** during the beta.
3. **Webhooks.** A public endpoint that is signature-verified, idempotent, and aware of test versus live mode. It handles the checkout-session, charge, payment-intent and refund events the Shop needs.
4. **The cache rule.** Payment attempts and refunds are cached from Stripe, keyed by Stripe ID. Stripe is the truth. Any cache entry can be dropped and re-read.
5. **One-off invoices are ours.**
   - Invoice and line records.
   - Gap-free numbering per business, assigned when the money is taken.
   - Credit notes against refunds.
   - **Invoice PDFs are not in the minimum.**
6. **Charging and refunds.** Checkout with **manual capture**, capture of a held payment, release of a hold, and full or partial refunds, all on the connected account.
7. **A test path.** Stripe test mode end to end against her connected account, before she switches to live.

**Not needed for Lauren:**
- the billing tab
- subscriptions and Stripe Billing
- the User Portal
- entitlement
- domain charges

## Minimum from EPIC-31 (Shop)

1. **The model.** Inventory items with an integer availability, plus orders, invoices, payment attempts and refunds with the states in [[EPIC-31]].
2. **Purchase flow:** Buy → atomic hold → order `pending` → draft invoice → Checkout with manual capture → attempts → `reserved`.
   - An expired checkout releases the hold.
   - An item flagged made to order is captured at purchase.
3. **Owner ships, and that captures the money.** Mark shipped, with optional tracking, takes the money and numbers the invoice. The "ship by" date and the day-5 reminder are included. **A lapsed hold can be cancelled. The pay link is not in the minimum.**
4. **Returns and refunds.** Record return (with optional restock) and Refund (any amount).
5. **The Shop tab:**
   - the **Inventory** list with nested orders, invoices and attempts
   - the "to ship" filter
   - the item detail page (photos, name, description, price, availability, section, hidden, made to order)
   - the order detail page with its timeline and actions
6. **Emails:** the owner's new-order email, plus buyer confirmation and buyer shipped, each a per-business on/off setting.
7. **Shipping rates** by zone, and the list of countries she ships to.
8. **Public site:**
   - the product grid and product pages
   - the Buy button
   - sold pieces kept as a portfolio, with the "Commission something like this" link
   - rebuild on every availability change
9. **WooCommerce import.** All 365 products, their photos and sold history, so she re-types nothing.

**Not needed for Lauren:**
- the Shop assistant
- deposits
- price on request
- the pay link for lapsed holds

## Also needed, but outside both epics

- **Her site, rebuilt in the builder.** The current site is to be captured, and the capture has to be run by the operator because live captures cannot run in the agent sandbox. Then the home page, the commission enquiry form (onto existing lead capture), and the refund, shipping, privacy and terms pages.
- **The domain** moved to us, or pointed at us, before her current hosting renewal date.
- **For her to check, not us:** her 7-day return window against the EU 14-day withdrawal right, and whether she is VAT-registered.

## Related

[[GOAL-54]]'s first launch blocker is payments. This goal delivers the slice of [[EPIC-9]] that a shop needs, ahead of the subscription work.
