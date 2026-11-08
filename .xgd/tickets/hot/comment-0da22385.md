---
uid: comment-0da22385
id: COMMENT-7947
type: comment
title: Comment on todo TODO-20
created_by: xgd
created_at: '2026-11-07T21:52:48.767540+00:00'
updated_at: '2026-11-07T23:45:14.024135+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: todo-c4b5e9ea
  kind: chat_summary
  framing: |-
    TODO-20: take Stripe live for GOAL-55. Operator does dashboard work; I advise, change config, file tickets. Agent CLI: use /Users/martin/lagrangefoundry/xgd/.venv-working/bin/python.

    DONE (2026-11-07): A active (via sign-up wizard); 2FA; bank accounts on A and B; A live restricted key rk_live_ (Full access except sensitive ops) in macOS keychain -a 1stcontact -s stripe-live-platform (renamed from stripe-secret-key-live; operator to run rename); REQ-667 filed (keychain-backed live secrets in bin/deploy); webhook walkthrough given.

    OPEN (waiting on operator): live webhook on A (Connected accounts, 10 events, https://app.1stcontact.io/api/stripe/webhook/live, whsec_ to keychain -s stripe-live-webhook-platform); sandbox via Stripe CLI stripe listen --forward-connect-to https://127.0.0.1:8789/api/stripe/webhook/test --skip-verify, whsec_ into 1c.dev.env as STRIPE_WEBHOOK_SECRET_TEST; send me live ca_ client id (and confirm redirect https://app.1stcontact.io/api/stripe/connect/return registered), pk_live_, pk_test_, both acct_ ids, legal entity/country, B active status. THEN I: set STRIPE_CONNECT_CLIENT_ID_LIVE in production wrangler.toml (~line 719); ADD STRIPE_PUBLISHABLE_KEY_LIVE/_TEST vars (gap: orders.ts blocks checkout without them); optional STRIPE_PLATFORM_ACCOUNT_ID; operator deploys production with both live secrets from keychain via command substitution; post report-back comment; settle/move ticket section-3 decisions.

    RULES: live secrets never in 1c.dev.env (hooks 70/75 refuse) nor chat nor repo. No live key for B (nothing uses it; B links via OAuth as a shop). Unverified: rk_ tier allows OAuth token exchange; first sandbox link proves it.

    LESSON: I asserted wrong Stripe UI specifics (standard sk_ key; live Connect not done though operator says done in TODO-18). Ask what the operator sees; hedge menu paths.

    REJECTED: standard sk_ key (not offered; rk_ accepted by code/probe); B live key now; sandbox webhook pointed at production (production links only live accounts, no staging env); live secrets in 1c.dev.env.
---

<!-- xgd-summary-entry -->
2026-11-07: Operator asked whether item 2 (activate A) was done. Tickets record it as outstanding (TODO-18 comment-725ae806). Operator says they gave all required info in the account-creation wizard and see no activation banner. Advised: likely activated or pending; confirm via Settings > Business > Account details, Payouts (bank listed), live API keys present; grab acct_ ids. Awaiting their status report for A and B.


<!-- xgd-summary-entry -->
2026-11-07: Operator reports the live account status page says Active (presumed account A; B not yet confirmed). Item 2 treated as done via the sign-up wizard. Next: confirm B, 2FA (item 1), live Connect + live client ID on A (item 4), live key to password manager (item 5), acct_ ids for report-back.


<!-- xgd-summary-entry -->
2026-11-07: Operator has 2FA (item 1 done). No bank account added yet on either account. Advised: A takes no payments (direct charges land on connected accounts, zero fee), so a bank is not needed for payments, but add one anyway (activation completeness, possible live-Connect gate, future platform fee). B needs one: it takes real live-test payments; Stripe holds payouts and may eventually restrict charges without it. Same bank for both is fine.


<!-- xgd-summary-entry -->
2026-11-07: Bank accounts added (operator). Asked what else production needs. From code: production wrangler.toml (line ~717) STRIPE_MODE=live, STRIPE_CONNECT_CLIENT_ID_LIVE="" (needs live ca_), redirect https://app.1stcontact.io/api/stripe/connect/return (register in live OAuth settings). Secrets STRIPE_SECRET_KEY_LIVE and STRIPE_WEBHOOK_SECRET_LIVE are pushed by hooks 70/75 in bin/deploy.d/secrets ONLY when exported in the shell (STRIPE_SECRET_KEY_LIVE=… bin/deploy --env production); refused if found in 1c.dev.env. Gap found: orders.ts needs STRIPE_PUBLISHABLE_KEY_LIVE/_TEST (checkout blocked without), but no wrangler.toml var sets them; offered to add once operator supplies pk_ values. Optional STRIPE_PLATFORM_ACCOUNT_ID lets the deploy probe check the key belongs to account A.


<!-- xgd-summary-entry -->
2026-11-07: Live secret key created as restricted rk_live_ with "Full access except sensitive operations" (Stripe offered no standard sk_ option; same tier as the sandbox rk_test_). Confirmed acceptable: stripe-connect.ts:120-133 and probe.mjs:217 accept (sk|rk)_ prefixes; the excluded op (creating connected accounts) is unused because linking is OAuth. Unverified: that this tier permits the OAuth token exchange/deauthorize; the first sandbox link with the rk_test_ key proves it before live.


<!-- xgd-summary-entry -->
2026-11-07: Item 5 done: the live platform (account A) rk_live_ key is in the macOS keychain. First stored as service stripe-secret-key-live (ambiguous); advised copying it to -a 1stcontact -s stripe-live-platform and deleting the old item. B, if keyed, uses stripe-live-business; the code needs only A's key. Deploy: STRIPE_SECRET_KEY_LIVE="$(security find-generic-password -a 1stcontact -s stripe-live-platform -w)" bin/deploy --env production.


<!-- xgd-summary-entry -->
2026-11-07: Filed REQ-667 (request-17a53732, parent EPIC-9 epic-ce0874f2): production bin/deploy reads STRIPE_SECRET_KEY_LIVE / STRIPE_WEBHOOK_SECRET_LIVE from the macOS keychain (-a 1stcontact, services stripe-live-platform / stripe-live-webhook-platform) when not exported; production only; --no-keychain; export wins; secrets-file refusal unchanged; fake security stub in tests.


<!-- xgd-summary-entry -->
2026-11-07: Webhook walkthrough given. Live: endpoint on A live, https://app.1stcontact.io/api/stripe/webhook/live, Connected accounts events (10: checkout.session.completed/expired/async_payment_failed, payment_intent.succeeded/payment_failed, refund.created/updated, charge.refunded, account.updated, account.application.deauthorized); whsec_ into keychain -s stripe-live-webhook-platform; pushed by the production deploy. Sandbox: no staging env exists and production links only live accounts (payments.ts:271 livemode check), so a sandbox endpoint pointed at production is useless; use Stripe CLI stripe listen --forward-connect-to https://127.0.0.1:8789/api/stripe/webhook/test (likely --skip-verify for the local cert); its whsec_ goes in 1c.dev.env as STRIPE_WEBHOOK_SECRET_TEST. Operator installs the CLI themselves.


<!-- xgd-summary-entry -->
2026-11-07 recap before compaction: operator corrected me that Connect was all done in TODO-18 and that my Stripe UI guesses were wrong; live account is set up. Advised no live key for B. Frame rewritten with the full open list; next step is the operator returning ids/keys and creating webhooks.
