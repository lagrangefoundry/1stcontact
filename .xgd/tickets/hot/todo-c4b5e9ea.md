---
uid: todo-c4b5e9ea
id: TODO-20
type: todo
title: 'Stripe: go live on both accounts (2FA, activation, live Connect) and the deferred
  decisions'
created_by: claude-chat
created_at: '2026-11-03T20:55:22.849186+00:00'
updated_at: '2026-11-06T21:56:15.605729+00:00'
completed_at: null
last_field_updated: status
status: open
fields:
  kind: user_task
  parent_uid: epic-ce0874f2
  auto_merge_back: true
  session_id: 07b695d0-07b6-4cbf-9235-c7b128ad9348
---

**Operator task, follow-up to [[TODO-18]].** TODO-18 finished the sandbox side: Connect, OAuth for Standard accounts, the test client ID and `STRIPE_SECRET_KEY_TEST` in the secrets file. Those unblock the [[EPIC-9]] foundation code. This ticket covers what remains before anything works in **live mode** for [[GOAL-55]]. See TODO-18's comments for the setup as built.

## 1. Live actions (Stripe dashboard, production)

1. **Two-factor authentication** on the login (`platform@1stcontact.io`).
2. **Activate account A** (1st Contact platform): business details, representative, bank account, website `https://1stcontact.io`, statement descriptor, support email and phone. Stripe's verification can take days, so start early.
3. **Activate account B** (1st Contact business): its own statement descriptor; the same legal entity and bank account are fine. **No Connect on B, and don't link it yet.**
4. **Live Connect on A**, once activation allows it: repeat the sandbox answers (platform, Stripe Dashboard / Standard accounts, direct charges, Stripe liable for seller losses, no platform fee). Enable **OAuth for Stripe Dashboard accounts** and copy the **live client ID** (`ca_…`). Leave the redirect addresses empty until the foundation ticket supplies them. Check whether Stripe carried the sandbox settings across.
5. **Live secret key** goes in the **password manager only**, never `1c.dev.env` (`bin/deploy` pushes that file to production). How production receives it is the foundation ticket's decision.
6. **Webhooks** (TODO-18 section 4), once the foundation endpoints are deployed: one endpoint in the sandbox and one live, listening to events on **Connected accounts**. The sandbox signing secret goes in the secrets file; the live one waits with the live key.

## 2. Report back (comment here; none of it is secret)

- the legal entity and country
- account A's and account B's ids (`acct_…`)
- the **live** client ID (the test one is already on TODO-18: `ca_VYwFlZmxEUHrcvX5SAvDoEZaBnNzI2iw`)
- the activation status of A and B
- confirmation that the live key is in the password manager

## 3. Open decisions and checks

- **Same-organization linking (unverified).** A and B sit in one Stripe organization ("Lagrange Foundry"). It isn't confirmed that B can link to A by OAuth while both are in the same organization. Check at the first real link; if Stripe refuses, take B out of the organization.
- **Platform fee after the beta.** Zero now. With direct charges a fee is a per-payment amount set in our code (`application_fee_amount`), so it needs no account change. The foundation checkout code should leave room for it. Before switching a fee on: pricing page and terms. The business keeps paying Stripe's own fees.
- **Account B, once it charges our own customers (subscriptions):** whether to use Radar Standard instead of Lite, and whether to use Stripe Tax. Stripe's "Managed Payments" (Stripe as merchant of record, which handles VAT on SaaS) is worth a look for B's subscriptions at that point; it was declined for now because B must mirror Lauren's setup for live tests. A stays on Lite and no Tax, because it takes no payments.
- **An AI agent key for testing and debugging.** A separate **sandbox-only, read-only to start** key, created with Stripe's "AI agent" key option so it can be revoked on its own. Never a live key. Still to decide: where it is stored so agent sessions can read it, since agent sessions cannot read `~/Documents/secrets`.
- **The code's key permissions.** Dev uses the sandbox's full `sk_test_` key. If production moves to a restricted key, note that "Full access except sensitive operations" blocks creating connected accounts through the API.

## 4. For Lauren (pass this on; nothing for her to do yet)

Unchanged from TODO-18 section 6: she must be an owner or administrator of her Stripe account, linking doesn't affect WooCommerce, and the capture-setting check in [[GOAL-55]] still applies.

## Done when

A and B are both activated (or waiting only on Stripe), live Connect and OAuth are on A, the live key is in the password manager, the report-back comment is posted, and each open decision above is either settled or moved to the ticket that owns it. Webhooks may close later, with the foundation ticket.