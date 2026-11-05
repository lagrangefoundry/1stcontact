---
uid: request-2a88fb08
id: REQ-641
type: request
title: 'Payments: connect a business''s Stripe account (Settings → Payments)'
created_by: EPIC-9
created_at: '2026-11-03T21:18:46.761340+00:00'
updated_at: '2026-11-03T21:54:09.264675+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-ce0874f2
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-743baa10
  commits:
  - working_sha: 92fcb721097bf1ec401e9d870fa2ce8e262b5d7e
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 95fca4e45847951ad1929e5477c56ca251568613
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  version: 0.2.747
  story_points: 13
---

## Purpose

**The UI and plumbing that let a business owner link their own Stripe account to the 1st Contact platform account**, so that later work can take payments on their behalf ([[EPIC-9]], "Stripe Connect is the consequence"; [[GOAL-55]] payments minimum, item 1). It is the first Stripe-calling piece of [[EPIC-9]] and is **connection only**: no payments, no Checkout, no webhooks.

Everything it needs from Stripe exists in the **sandbox** ([[TODO-18]], done): Connect with Standard accounts and OAuth, the test client ID, and `STRIPE_SECRET_KEY_TEST` in the secrets file. It is built and tested end to end in test mode. Live mode switches on with configuration alone, once [[TODO-20]] supplies the live client ID and key.

## The owner's experience: Settings → Payments

A new **Payments** section in the Settings tab (operator decision, 2026-11-02: it covers the whole business and outlives the Shop). Write it as a section module like the others in `apps/control-app/src/builder/settings.js` (`currency.js`, `domain.js` and so on).

The section shows exactly one of four states:

| State | When | What the owner sees |
|---|---|---|
| **Not connected** | no link | what connecting does, and a **Connect Stripe** button |
| **Ready** | linked, and Stripe reports the account can take charges (`charges_enabled`) | "Connected", the Stripe account's display name, and **Disconnect** |
| **Needs attention** | linked, but Stripe can't take charges yet or has requirements due (`requirements.currently_due` / `past_due`, `disabled_reason`) | what Stripe is waiting for, a link to the owner's Stripe dashboard to fix it, and **Disconnect** |
| **Disconnected by Stripe** | the owner removed 1st Contact from their Stripe dashboard, so the platform can no longer read the account | that the link was removed in Stripe, and **Connect Stripe** again |

- **Connect Stripe** sends the owner to Stripe's own hosted OAuth page. There they sign in to an existing account, or create one, and approve 1st Contact. They then come back to this section with the new state shown. They never type an account id or key.
- **Disconnect** asks for confirmation, revokes our access in Stripe (OAuth deauthorize), and returns to **Not connected**.
- **The state is read from Stripe** when the section opens, never trusted from our own storage, because Stripe can disable an account or the owner can unlink it at any time without telling us. A Stripe error or timeout shows "can't check Stripe right now", not a wrong state.
- **Only a member allowed to manage the business's settings** can connect or disconnect, under the same authorisation the other Settings sections use. The link records who made it and when.
- **The Shop tab**, if present, shows "Connect Stripe to start selling" with a link to this section whenever the business isn't **Ready**. The question "can this business take payments?" is answered by one exported function, so the Shop and later Checkout code ask it rather than re-deriving it.

## Under the hood

- **OAuth, done safely:**
  - The `state` parameter is signed, single-use and short-lived, and is bound to the business and the signed-in member who started it.
  - A return with a missing, expired, reused or mismatched `state` is refused and links nothing.
  - The code is exchanged server-side with the platform's secret key.
  - We store **only the connected account id** (`acct_…`). The Standard OAuth token response also carries keys for the connected account, and **those are discarded, never stored**: every later call uses our platform key with the `Stripe-Account` header.
- **One stored record per business and mode**, in a new migration (the next number in `db/migrations/`):
  - business, mode (`test` / `live`), Stripe account id, who connected, when, and when disconnected
  - no copy of Stripe's status, apart from an optional last-checked snapshot used only for display while Stripe is unreachable
  - Reconnecting the same Stripe account reuses or replaces the record. One business never holds two live links.
  - The same Stripe account must not be linked to two businesses. Refuse the second, unless it belongs to the same platform operator's businesses; see the open question below.
- **Mode comes from configuration, not from the request:**
  - Dev links in test mode.
  - Production links in live mode once the live client ID and key exist. Until then, production's Payments section says payments aren't available yet, and does not quietly fall back to test.
  - Every Stripe call takes its key from **one function**, chosen by the mode stored on the record.
  - At startup the worker refuses a key whose prefix contradicts its slot: a `sk_live_` / `rk_live_` key in the test slot, or the reverse.
- **Stripe calls use plain `fetch`** to the handful of endpoints this needs: OAuth token, OAuth deauthorize, retrieve account. Add no dependency without asking the operator, who runs installs.
- **Configuration and secrets:**
  - The client IDs (`STRIPE_CONNECT_CLIENT_ID_TEST`, later `_LIVE`) are not secret, so they go in Worker vars. The test one is `ca_VYwFlZmxEUHrcvX5SAvDoEZaBnNzI2iw` ([[TODO-18]]).
  - `STRIPE_SECRET_KEY_TEST` gets a secret hook in `bin/deploy.d/secrets/`, following the README there. **The hook checks capability, not just presence:** it calls Stripe with the key and checks that it is a test-mode key on the expected platform account.
  - **The live key never goes in the shared secrets file**, because `bin/deploy` pushes that file to production and the dev servers read it too ([[TODO-18]] §3). The live key's hook pushes `STRIPE_SECRET_KEY_LIVE` only when the operator has exported it in the shell for that deploy, from their password manager. Otherwise it leaves the production secret as it is and says so.
- **Redirect addresses:** the Done-when report gives the exact OAuth redirect URI(s) for the operator to register in Stripe: dev (localhost, test mode) and production. [[TODO-18]] and [[TODO-20]] left them empty for this.

## Out of scope

- Webhooks, the payment cache, Checkout sessions and taking money: the next [[EPIC-9]] child, and [[EPIC-31]]'s Checkout.
- Creating a Stripe account inside our own UI with embedded onboarding ([[GOAL-55]], fast follow). Stripe's hosted page already offers account creation.
- The platform fee: zero for the beta, and set per payment later in checkout code.
- Live mode actually working: that needs [[TODO-20]]. This REQ must make it a configuration change only.

## Open question for the operator

- **Our own test business and the same-organization check** ([[TODO-20]] §3). Account B, our own business, is the first real live link. Linking it in test mode is done with Stripe's one-click test account. Recording whether linking B live succeeds while A and B share a Stripe organization is [[TODO-20]]'s job, not a code concern.

## Test plan

UATs named `test_UAT_FC_<this ticket>_*`, against real D1 (miniflare). **Stripe itself is replaced by a local fake HTTP server** for the OAuth token, deauthorize and account endpoints: Stripe is the external boundary. Nothing of ours is mocked.
1. **Connect round trip:** starting a connection redirects to Stripe's OAuth URL with our client ID, the configured redirect and a `state`. The return with a valid code stores the account id against the business and mode, and the section then shows **Ready**.
2. **The account's own keys are never stored:** after a connect, no column or record holds the token response's keys.
3. **Bad `state` is refused:** missing, expired, reused, or minted for another business or member. Each links nothing.
4. **Needs attention:** an account the fake reports with `charges_enabled: false` and requirements due shows **Needs attention**, with the dashboard link.
5. **Disconnected by Stripe:** the fake answers "no access" for the account, and the section shows **Disconnected by Stripe** and offers Connect again.
6. **Disconnect:** calls deauthorize, records the disconnection, and shows **Not connected**.
7. **Authorisation:** a member without settings rights can't start, finish or remove a connection.
8. **Can this business take payments?** True only in **Ready**. The Shop tab's prompt appears in every other state.
9. **Mode and key safety:** a link records its mode. A swapped key (live prefix in the test slot) is refused at startup. Production without a live client ID shows "not available yet" and never links in test mode.
10. **One account, one business:** linking a Stripe account that is already linked to another business is refused.

**Optionally**, one smoke test against the real Stripe sandbox, skipped unless `STRIPE_SECRET_KEY_TEST` is present: retrieving the platform account succeeds and reports test mode.


## As built (free-coded, 2026-11-03)

**Server** — `apps/control-app/src/stripe-connect.ts`, routed from `router.ts` beside Default currency:
- `GET /api/settings/payments` — the state, read from Stripe on every open: `not_connected`, `ready`, `needs_attention`, `disconnected_by_stripe`, plus `unreachable` ("We can't check Stripe right now") and `not_available` ("Payments aren't available yet"). The answer carries `canTakePayments` and `canManage`.
- `POST /api/settings/payments/connect` → `{url}` of Stripe's hosted OAuth page (`connect.stripe.com/oauth/authorize`, `scope=read_write`, our client id, the configured redirect, a signed `state`). The section sends the browser there.
- `GET /api/stripe/connect/return` — **unscoped**, because the redirect URI registered in Stripe must be one fixed address. The business comes from the signed `state`. It always answers 302 to `/b/<business>/#payments=<outcome>` (`connected`, `cancelled`, or `refused:<code>`), and the builder opens Settings → Payments and says how it went.
- `POST /api/settings/payments/disconnect` — OAuth deauthorize, then records `disconnected_at` / `disconnected_by`. If Stripe doesn't confirm, nothing is recorded (503).
- **`canTakePayments(env, businessId)`** is the one exported answer, true only in `ready`. The Shop reads the same flag from the Payments state.
- **Authorisation:** connect, finish and disconnect use `operatesBusiness` (owner or delegate), the same gate as the business-name setting. A `support` member sees the state and no controls.

**State (`stripe_connect_states`):** a random nonce, HMAC-signed with a key derived from the mode's platform secret key, bound in D1 to the business, member and mode, expiring after 15 minutes, and used up by compare-and-set before anything else happens. The return refuses a state that is missing, forged, expired or reused, or that was minted for another member. Under a `/b/<id>/` prefix it also refuses a state minted for another business. It refuses any business the returning member can't manage.

**Record (`stripe_connections`, migration `0045`):** one row per (business, mode). The columns are the account id, who connected, when, when disconnected and by whom (a user id, or `stripe`), and a `last_checked_json` display snapshot used only while Stripe can't be reached. A partial unique index on (mode, account) where not disconnected means one Stripe account maps to one business. Reconnecting upserts the same row. The token response's keys are dropped inside `exchangeCode` and no column could hold one.

**Disconnected by Stripe:** when the account read answers 403 / `account_invalid`, the row is marked `disconnected_by = 'stripe'`. That state then shows without calling Stripe again, since access can't come back without a new OAuth.

**Mode and keys:** `STRIPE_MODE` (a Worker var) chooses the mode, never the request. `stripeKey(env, mode)` is the only key reader and refuses a missing key or a key whose prefix contradicts its slot. "At startup" means once per isolate, on the first request (`checkStripeKeysAtStartup` in `index.ts`), logging `stripe_key_refused`. The Worker keeps serving and Payments shows `not_available` / misconfigured, so a bad Stripe key can't take the whole product down. Production is `STRIPE_MODE = "live"` with an empty `STRIPE_CONNECT_CLIENT_ID_LIVE`, so it says "not available yet" and never falls back to test. A test-mode state can't finish a link in live mode.

**Vars (`wrangler.toml`, all three environments):** `STRIPE_MODE`, `STRIPE_CONNECT_CLIENT_ID_TEST = ca_VYwFlZmxEUHrcvX5SAvDoEZaBnNzI2iw`, `STRIPE_CONNECT_CLIENT_ID_LIVE = ""`, `STRIPE_CONNECT_REDIRECT_URI`. Platform keys are added to the router's scrub list.

**Secret hooks:**
- `60-stripe-secret-key-test`: absent → deploy and say so. Refused → fail.
- `70-stripe-secret-key-live`: **refuses a value that came from the secrets file**, pushes only a value exported in the shell, and with no export leaves the production secret as it is and says so.
- Probes (`probe.mjs`): the prefix must match the slot (checked before any request), Stripe must accept the key on `GET /v1/account`, and where `STRIPE_PLATFORM_ACCOUNT_ID` is set the account must be that one. Otherwise the report says the platform account was not checked.
- The secrets-file loader (`env-file.mjs`) now exports `ONECONTACT_SECRETS_TAKEN`, the **names** it took from the file and never the values, which is how the live hook can tell.

**Builder:**
- `builder/payments.js`: the Payments section, placed after Default currency. Each state shows the message, the account display name, what Stripe is waiting for and a dashboard link, and Connect Stripe or Disconnect. Disconnect asks for confirmation first.
- `paymentsTransport` in `api.js`.
- The Shop tab shows **"Connect Stripe to start selling"** with a **Set up payments** button whenever `canTakePayments` is false. The button opens Settings → Payments.
- Payments is not re-read after each settings-assistant turn. The assistant can't change it, and a re-read would be a Stripe call per turn.

**Redirect URIs to register in Stripe (Connect → OAuth):**
- dev, test mode: `https://localhost:8789/api/stripe/connect/return`
- production, live mode (with [[TODO-20]]): `https://app.1stcontact.io/api/stripe/connect/return`

**Decisions on the open points:**
- **Same account, two businesses:** always refused. The refusal does **not** deauthorize, because the platform's access is shared with the business that already holds the link and revoking it would break theirs.
- **Operator "entering" a business:** may connect from inside it. The return itself requires a real owner or delegate membership.

## Test evidence

- `tests/test_UAT_FC_REQ-641_stripe_connect.workers.test.ts`: real D1 and the real router. A fake Stripe answers at the fetch boundary for token, deauthorize and account. Covers test-plan items 1–10, plus "Stripe unreachable is said, not guessed".
- `tests/test_UAT_FC_REQ-641_payments_section.test.ts` (jsdom): each state's display and buttons, the Disconnect confirmation, Connect navigating to Stripe's page, the landing outcome message, and the Shop prompt in every state except Ready.
- `tests/test_UAT_FC_REQ-641_stripe_secret_hooks.test.ts`: the probes (wrong slot, wrong account, refused key, capable), both hooks' decision tables, the loader naming what it took, and the optional real-sandbox smoke test (skipped unless `STRIPE_SECRET_KEY_TEST` is set).