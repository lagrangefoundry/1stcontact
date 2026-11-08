---
uid: request-17a53732
id: REQ-667
type: request
title: 'bin/deploy: read live Stripe secrets from the macOS keychain for production'
created_by: claude-chat
created_at: '2026-11-07T22:21:55.723273+00:00'
updated_at: '2026-11-07T22:46:46.611745+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  parent_uid: epic-ce0874f2
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-1ea384c7
  commits:
  - working_sha: 4fab73b0d43ec62e2c040b7628448c4cff4f0df2
    reconcile_sha: null
    main_sha: null
  - working_sha: 174a3dd038bdef3dabfd5443d99491037f8a287d
    reconcile_sha: null
    main_sha: null
  version: 0.2.819
  story_points: 3
---

**Production deploys read the live Stripe secrets from the operator's macOS keychain**, so `bin/deploy --env production` is the whole command and the operator never pastes or exports a live secret. Follows from [[TODO-20]], where the live platform key was stored in the keychain.

## Today

`bin/deploy.d/secrets/70-stripe-secret-key-live` and `75-stripe-webhook-secret-live` push `STRIPE_SECRET_KEY_LIVE` / `STRIPE_WEBHOOK_SECRET_LIVE` only when exported in the shell for that deploy. They refuse a value that came from the shared secrets file (`1c.dev.env`). When neither is set they leave production's secret as it is. The operator currently runs:

    STRIPE_SECRET_KEY_LIVE="$(security find-generic-password -a 1stcontact -s stripe-live-platform -w)" bin/deploy --env production

## Change

1. A shared helper in `bin/deploy.d/lib/secret.sh`, e.g. `secret_from_keychain NAME SERVICE`. It reads `security find-generic-password -a 1stcontact -s SERVICE -w` into the hook's own variable, never into the shared environment.
2. Hooks 70 and 75 call it **only when** the value is not exported, `DEPLOY_ENV` is `production`, and `security` exists. Keychain entries:
   - `STRIPE_SECRET_KEY_LIVE` → service `stripe-live-platform` (account A, the platform)
   - `STRIPE_WEBHOOK_SECRET_LIVE` → service `stripe-live-webhook-platform`
3. A keychain value goes through the same probe and the same `wrangler secret put` as an exported one. The report says "taken from the keychain" and never prints the value.
4. `--no-keychain` on `bin/deploy` skips the lookup, next to `--no-secrets-file`.
5. Document it in `bin/deploy.d/secrets/README.md` and in the hooks' header comments.

## Must stay true

- An exported value wins over the keychain.
- The secrets-file refusal is unchanged: a live secret found in `1c.dev.env` still fails the deploy.
- Not production (dev, staging): the keychain is never read.
- Keychain entry missing, `security` absent (not macOS), or the read fails: the hooks behave exactly as today (leave production's secret alone and say so). Never a hard failure.
- No value is written to a file, logged, or passed as a command argument.
- `--dry-run` probes the keychain value and pushes nothing.

## Tests

Use a fake `security` on `PATH` (a stub script). Never touch the real keychain. Cases:

- keychain used on production
- export wins
- not read for dev or staging
- missing entry → leave
- `--no-keychain` → leave
- secrets-file refusal still fires
- the value never appears in output

Run the deploy suites with `--no-file-parallelism` (they collide in parallel).

## Out of scope

Account B (the business account) has no live key, on purpose. Keychain lookup for any non-Stripe secret.


## Implementation (as landed)

- `secret_from_keychain NAME SERVICE` in `bin/deploy.d/lib/secret.sh`: skips (returns 1, never fails) when NAME is already set, `DEPLOY_ENV` ≠ `production`, `DEPLOY_NO_KEYCHAIN=1`, `security` is absent, or the read fails / is empty. Otherwise it sets and exports NAME **in the hook's own process only** (the probe reads it from the environment, as it does an exported value) and prints `NAME taken from the keychain (service …)`.
- Hooks 70 and 75 call it after the secrets-file refusal and the local-target check. The "would push" / "pushed" lines, and the refusal message, add "(taken from the keychain)" when it came from there. The leave line now reads "not exported in this shell or taken from the keychain … (export it, or add keychain service …)".
- `bin/deploy --no-keychain` passes `DEPLOY_NO_KEYCHAIN=1` to every hook (in the help text, the usage line, and the hook-environment list).
- The shared hook harness (`tests/support/secret-hook.ts`) installs a stub `security` for **every** hook, so no suite can reach the developer's real keychain through `/usr/bin/security`. The stub answers from a fake keychain and records every lookup.
- UATs: `tests/test_UAT_FC_REQ-667_live_stripe_keychain.test.ts`. Cases: both secrets taken from the keychain on production and probed, with the value absent from output; an export wins and the keychain is not read; never read for dev or staging; a missing entry or `--no-keychain` leaves production's secret alone; `--dry-run` probes and pushes nothing; a refused keychain value fails without printing it; the secrets-file refusal still fires; `bin/deploy --no-keychain` is accepted.
- Not tested directly: "`security` absent". The real `/usr/bin/security` is always on PATH in the harness, so its absence cannot be simulated there. The `command -v security` guard covers it.