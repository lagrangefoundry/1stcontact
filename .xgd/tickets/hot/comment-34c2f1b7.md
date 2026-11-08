---
uid: comment-34c2f1b7
id: COMMENT-7958
type: comment
title: Comment on todo TODO-20
created_by: xgd
created_at: '2026-11-07T23:52:20.377022+00:00'
updated_at: '2026-11-08T00:01:17.668054+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: todo-c4b5e9ea
  kind: chat_summary
  framing: |-
    TODO-20: take Stripe live for GOAL-55. The operator does the dashboard work; I advise, change config and file tickets. Agent CLI: /Users/martin/lagrangefoundry/xgd/.venv-working/bin/python.

    DONE (2026-11-07):
    - Account A active; 2FA on; bank accounts on A and B.
    - A's rk_live_ key in the keychain (-a 1stcontact -s stripe-live-platform).
    - REQ-667 filed (keychain read in bin/deploy).
    - Webhook walkthrough given.
    - Legal entity: Lagrange Foundry LLC, California.
    - STRIPE_PUBLISHABLE_KEY_TEST/_LIVE added to all 3 var blocks of apps/control-app/wrangler.toml (uncommitted). The wrangler dry-run is blocked by a docker sandbox error, also at baseline.

    OPEN (waiting on the operator):
    - Live webhook on A; its whsec_ goes in the keychain as stripe-live-webhook-platform.
    - Sandbox webhook via `stripe listen` (whsec_ into 1c.dev.env).
    - Live ca_ client id, plus confirmation that the redirect https://app.1stcontact.io/api/stripe/connect/return is registered.
    - Both acct_ ids, unconfirmed. Guesses from the pk prefixes: acct_1UXnYm4GZw3Z6WOc (live), acct_1UXcwqKnVczzlCeP (sandbox).
    - Whether B is active.

    THEN (me): set STRIPE_CONNECT_CLIENT_ID_LIVE (production block); optionally STRIPE_PLATFORM_ACCOUNT_ID; commit. The operator then deploys production with both live secrets from the keychain. After that: the report-back comment and the section-3 decisions.

    RULES:
    - Live secrets never go in 1c.dev.env, chat or the repo. pk_ keys are public and fine in the repo.
    - No live key for B.
    - Unverified: whether the rk_ tier allows the OAuth exchange.

    LESSON: ask what the operator sees; don't assert Stripe UI specifics.

    REJECTED:
    - standard sk_ key
    - B live key now
    - sandbox webhook pointed at production (no staging)
    - live secrets in 1c.dev.env
---

<!-- xgd-summary-entry -->
2026-11-07: Operator sent pk_live_/pk_test_ (account A + sandbox) and the legal entity (Lagrange Foundry LLC, California). Added STRIPE_PUBLISHABLE_KEY_TEST/_LIVE to the top-level, production and dev var blocks of wrangler.toml. Checkout runs in the Worker (checkout-intake.ts), so CONTAINER_VARS needs no change. The production dry-run fails on a docker buildx sandbox error, same at baseline. Still waiting on: the live ca_ id, the acct_ ids, the live webhook and B status.


<!-- xgd-summary-entry -->
2026-11-07: Operator believes both A and B are active (not confirmed on the dashboard). Remaining: live ca_ client id + redirect registration, acct_ id confirmation, live webhook, sandbox stripe listen.


<!-- xgd-summary-entry -->
2026-11-07: Live client id ca_VYwFQ9zZRyX33EwpuRPjIRm6EtVzvcAz set in the production block only (top-level and dev are test mode). Committed d635b7f2d6 on xgd-working together with the pk_ vars. TOML parses. Next: the operator confirms the redirect registration, sets up the live webhook (whsec_ to keychain), then deploys production.


<!-- xgd-summary-entry -->
2026-11-07: REQ-667 landed (4fab73b0d4): hooks 70/75 read keychain services stripe-live-platform and stripe-live-webhook-platform at production. Operator stored the live whsec_. stripe listen is already running for the sandbox. Next: operator runs bin/deploy --env production, then I post the TODO-20 report-back.
