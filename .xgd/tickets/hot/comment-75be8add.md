---
uid: comment-75be8add
id: COMMENT-7282
type: comment
title: Comment on todo TODO-18
created_by: xgd
created_at: '2026-11-03T19:45:06.730943+00:00'
updated_at: '2026-11-03T20:56:28.401238+00:00'
completed_at: null
last_field_updated: framing
status: null
fields:
  subject_uid: todo-8efd37b5
  kind: chat_summary
  framing: 'TODO-18 (Stripe platform account A and business account B) is DONE as
    of 2026-11-03. The sandbox side is complete: Connect with Standard accounts, direct
    charges, Stripe liable for seller losses, no fee; OAuth on; test client ID ca_VYwFlZmxEUHrcvX5SAvDoEZaBnNzI2iw;
    sk_test_ key in 1c.dev.env as STRIPE_SECRET_KEY_TEST. Progress comment: comment-725ae806.
    Everything outstanding moved to TODO-20 (todo-c4b5e9ea): 2FA, activation of A
    and B, live Connect and OAuth plus the live client ID, the live key to the password
    manager, webhooks, report-back, and the open decisions (same-org linking unverified;
    possible platform fee after beta; Radar/Tax/Managed Payments for B later; separate
    read-only sandbox key for an AI agent, storage still undecided). Rejected: Connect
    to a platform instead (on both A and B); Managed Payments on B now (B must mirror
    Lauren''s setup); paid Radar or Stripe Tax on A (A takes no payments).'
---

<!-- xgd-summary-entry -->
2026-11-03: Operator signing up account A as platform@1stcontact.io. Advised: one Stripe login owns both A and B (B via account menu > New account), so no second email is needed. At sign-up, do NOT pick "Connect to a platform instead" (that makes A a connected account of someone else); skip the product recommendations and enable Connect later via Connect > Get started.


<!-- xgd-summary-entry -->
2026-11-03: Stripe offered live account vs sandbox after sign-up. Advised: go to the live account first (2FA, activation, Connect platform profile, branding, OAuth all live there). Test keys and test client ID: the ticket assumed a test-mode toggle; newer accounts may offer Sandboxes instead. Create a sandbox after Connect is set up on live, and check whether it copies the Connect settings or needs them set again. Not yet confirmed.


<!-- xgd-summary-entry -->
2026-11-03: Radar choice for account A: advised Lite (included). With direct charges, payments run on each connected account under that account's own Radar, and A takes no payments itself, so a paid tier on A screens nothing. Account B may want Standard later when it charges real customers.


<!-- xgd-summary-entry -->
2026-11-03: Creating account B. Stripe offered to put it in an organization; operator chose org "Lagrange Foundry" holding A and B. Advised: fine. An org is only a dashboard grouping (team, reporting); each account keeps its own legal details and keys. Unverified: whether Stripe lets B link to A by OAuth while both sit in the same org. Check at the first real link; if refused, take B out of the org. A and B already chose Lite Radar and no Stripe Tax.


<!-- xgd-summary-entry -->
2026-11-03: Account B set-up offered "Let them handle tax, fraud and disputes"; operator leaned yes. Advised NO for now. This is probably Stripe Managed Payments (Stripe becomes merchant of record, digital goods only, extra fee); identification not confirmed. It would make B unlike Lauren's account (a Standard connected account where she is merchant of record, taking direct charges), which defeats B's purpose as the live-test shop, and it may not work with direct charges at all. Revisit for B's own SaaS subscriptions later, as a separate decision. Also advised on B's product picks: Accept online payments (subscriptions optional); not "Connect to a platform instead".


<!-- xgd-summary-entry -->
2026-11-03: The Connect wizard on account A keeps redirecting to a sandbox. Advised: go along with it. Do the Connect setup in the sandbox first (platform profile, OAuth Standard, test client ID, sk_test key); that is everything the code needs. Live Connect and the live client ID follow once A is activated, possibly by repeating the same answers; whether Stripe carries sandbox settings to live is unconfirmed. This reverses my earlier "live first" advice for Connect only. Activation and 2FA still happen on the live account.


<!-- xgd-summary-entry -->
2026-11-03: In the sandbox Connect wizard the operator chose "Stripe Dashboard" (Standard accounts). The operator says we may charge a platform fee after the beta. Advised: nothing to configure now. With direct charges, a fee is set per payment in our code (application_fee_amount), so adding it later is a code and product decision that needs no change to the Stripe account. Worth mentioning to the foundation ticket so the checkout code leaves room for it.


<!-- xgd-summary-entry -->
2026-11-03: Stripe's key screen now creates restricted keys (rk_test_…), not sk_test_. Operator picked "Full access except sensitive operations" for the code's sandbox key; that tier excludes Connect account creation, which the foundation ticket must check if its tests create accounts through the API. The operator wants an AI agent to have Stripe access for testing and debugging. Advised: a SEPARATE sandbox-only key, read-only to start, through the "AI agent" key option, so it can be revoked on its own and its actions are distinguishable. Never a live key for an agent. The agent sandbox cannot read ~/Documents/secrets, so how the agent receives that key is still to be decided.