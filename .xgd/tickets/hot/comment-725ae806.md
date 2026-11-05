---
uid: comment-725ae806
id: COMMENT-7325
type: comment
title: Comment on todo TODO-18
created_by: claude-chat
created_at: '2026-11-03T20:52:15.288063+00:00'
updated_at: '2026-11-03T20:52:15.288063+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: todo-8efd37b5
  kind: note
---

**Stripe setup progress (2026-11-03), so far**

- Account A (1st Contact platform) and account B (1st Contact business) are created, in a Stripe organization named "Lagrange Foundry".
- Account A **sandbox**: Connect is enabled with these answers: platform (not a marketplace), connected accounts use the full Stripe Dashboard (Standard), direct charges, Stripe is liable for seller losses (not the platform), no platform fee. OAuth for Stripe Dashboard accounts is enabled.
- **Test Connect client ID (sandbox):** `ca_VYwFlZmxEUHrcvX5SAvDoEZaBnNzI2iw`
- Test secret key (`sk_test_…`) copied from the sandbox; it goes in `1c.dev.env` as `STRIPE_SECRET_KEY_TEST`.

Still to do: two-factor authentication; activation of A and B; live Connect and OAuth on A plus the **live** client ID; both `acct_…` ids; legal entity and country.

Notes for the payments foundation ticket:
- The platform fee is zero for the beta, but one may be charged after it. With direct charges that is a per-payment amount set in our code, so the checkout code should leave room for it.
- Stripe Radar and Stripe Tax are left at the defaults (Lite, off) on A, because A takes no payments itself. Decide them for B when it starts charging our own customers.
- Unverified: whether B can link to A by OAuth while both are in the same organization. Check this at the first real link; if Stripe refuses, take B out of the organization.
