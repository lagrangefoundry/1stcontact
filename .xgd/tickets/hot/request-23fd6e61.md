---
uid: request-23fd6e61
id: REQ-147
type: request
title: 'The builder is private: Cloudflare Access on app.1stcontact.io'
created_by: xgd
created_at: '2026-08-15T20:34:01.076509+00:00'
updated_at: '2026-08-31T14:22:44.216414+00:00'
completed_at: '2026-08-31T14:22:44.216414+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: high
  story_points: 5
  auto_merge_back: true
  needs_review: false
  ready_since: '2026-08-15T20:34:18.239366+00:00'
  depends_on:
  - REQ-144
  commits:
  - working_sha: de2e29930271cafaa00ac20cd8c7e5fdc8bf7c80
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - 10532707034369e07d0c4cc20d81d1eb51daba10
    - fc75f0ca26d8e2953514bca9dc9b04cc1b6d0b6d
  version: 0.1.53
  chat_comment: comment-d6476701
  bundled_in: bundle-b3b7c399
---

# The builder is private: Cloudflare Access on `app.1stcontact.io`

The builder must not be publicly visible. Cloudflare Access is the operator gate, chosen over
building custom auth now.

## 1. Why Access rather than a login module

Access costs **zero application code**, enforces at the edge before the Worker runs, validates a
signed JWT, and covers assigning permissions by adding identities to a policy. It is free to 50
users.

It is not throwaway, because it is not the same thing as customer login. A customer signing in to
their own builder is a different product surface, and it belongs with the tenancy model that
arrives in [[REQ-143]] — where `@lagrangefoundry/ticketing` already provides a `tenants` registry
and scoped handles. Building custom auth now would mean building it twice, and the second one
would be the real one.

## 2. `workers_dev = true` is a hole in this

**Access on a custom domain does not protect a Worker's `workers.dev` URL.** `control-app` sets
`workers_dev = true`, so `1stcontact-control-app.<subdomain>.workers.dev` would serve the builder
to anyone who guesses it, entirely bypassing an Access policy on `app.1stcontact.io`.

A policy on the hostname alone is therefore **not** sufficient. Close it by disabling
`workers_dev` for control-app, verifying the JWT inside the Worker, or both. Given
[[DOC-2]] is the security policy, both.

Note this is latent rather than live: control-app currently 503s everywhere ([[REQ-144]]), so
nothing is exposed *yet*. It becomes real the moment the builder works.

## 3. Interactions worth checking, not assuming

- The preview iframe is same-origin, so it inherits the Access cookie — but the SSE streaming
  turn (`/api/ai/prompt`) must be confirmed to survive Access rather than presumed to. That
  confirmation needs a running assistant, so it is carried by [[REQ-146]]; it is recorded here
  because this is where the risk originates.
- Draft snapshots served by `public-site` stay **link-private, not authenticated** — an
  unguessable URL, per [[DOC-12]] §5.1 and the decision recorded in [[CHAT-11]]. Access does not
  change that, and this ticket does not revisit it. [[DOC-12]]'s "author only (private)" wording
  is still flagged as needing amendment there.
- Any automation calling `app.1stcontact.io` needs an Access **service token**.
- `wrangler dev` is unaffected — Access sits in front of the deployed Worker only.

## 4. Acceptance criteria

1. An unauthenticated request to `app.1stcontact.io` is challenged, not served.
2. An identity not on the policy is refused after authenticating.
3. The Worker's `workers.dev` URL does not serve the builder to an unauthenticated caller —
   asserted, because this is the failure mode the hostname policy misses.
4. The Worker rejects a request carrying no valid Access JWT even if it reaches it directly, so
   the gate does not depend on routing alone.
5. An authenticated identity on the policy reaches the Worker and receives its response —
   whatever that response currently is. **This ticket does not require a working builder.** The
   gate is provable against the Worker as it stands, and asserting an edit or an AI turn here
   would make Access depend on [[REQ-145]] while [[REQ-145]] depends on Access. Those
   end-to-end assertions belong to [[REQ-145]] and [[REQ-146]].
6. Access configuration is recorded in the repository as documentation — the policy lives in
   Cloudflare, but which identities are granted and why must not live only in a dashboard.

## Origin

[[CHAT-25]] — operator: "I don't want it publicly visible". Access chosen as the operator gate;
customer accounts deferred to the tenancy model in [[REQ-143]].
---

## Implementation (free-coded, REQ-147)

### What changed

| File | Change |
|---|---|
| `apps/control-app/wrangler.toml` | `workers_dev = false` (top level **and** restated under `[env.production]`); `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD` vars declared on both sides of the inheritance line |
| `apps/control-app/src/access.ts` | new — Access JWT verification: JWKS fetch + cache, RS256 signature, `aud` / `iss` / `exp` / `nbf` / `iat`, and the `guardAccess` gate |
| `apps/control-app/src/index.ts` | the gate runs **first**, before the origin is read or proxied |
| `apps/control-app/ACCESS.md` | new — the policy record: why Access, the two controls, the vars, granted identities and reasons, service tokens, how to verify (AC6) |
| `tools/generate/bin/smoke.mjs` | `--control-origin` / `--workers-dev-origin`: an unauthenticated caller is challenged, and the workers.dev door is shut (AC1, AC3) |
| `tests/support/access.ts` | new — a stand-in Access team (real loopback JWKS + real RS256 signing) so the gate can be driven through real `workerd` |

### Design decisions

**The gate is stated twice, and neither statement is redundant.** `workers_dev = false`
removes the hostname an Access policy cannot cover; the in-Worker check refuses anything that
reached the Worker without a valid JWT, whatever route it took. Opening the builder now takes two
independent mistakes rather than one.

**The algorithm is pinned from the JWKS, never read from the token.** `alg: none` and the HS256
confusion attack are both "believe the header", and a token is untrusted input including its
statement about how to check it.

**`aud` is checked, not just the signature.** Every Access application in a team is signed by the
*same* keys, so a valid signature alone proves "someone in this team's Access", not "allowed into
this application".

**Fail closed, with no exception path.** Empty vars → 503 naming the missing var; unfetchable
JWKS → 401; no token → 401. There is no configuration under which "we could not check" becomes
"let it through". Two refusal codes on purpose: 503 sends the operator to `wrangler.toml`, 401 to
the identity, and conflating them sends them hunting for the wrong problem.

**No local-development bypass.** A "skip Access when local" flag would be a security control with
an off switch, so there is none. The consequence is that `wrangler dev` on `control-app` needs
Access configuration and a real token — the local builder surface is the Node origin itself
(`1c builder`, `http://localhost:8790`), which is unproxied and unaffected. **Reversible if the
workflow proves painful**; see the open question below.

### ACs

| AC | Evidence |
|---|---|
| 1 — unauthenticated is challenged, not served | `bin/smoke --control-origin`; UAT `smoke_accepts_a_protected_control_app` / `smoke_fails_when_the_builder_is_public` |
| 2 — an identity off the policy is refused | Cloudflare-side; Access refuses before the Worker sees the request (recorded in ACCESS.md, not asserted here — it is Cloudflare's own enforcement) |
| 3 — workers.dev does not serve | `control_app_answers_on_no_workers_dev_hostname` (the file that governs every deploy) + `bin/smoke --workers-dev-origin` |
| 4 — the Worker rejects a request with no valid JWT | `worker_refuses_a_request_without_a_valid_access_jwt` (8 cases: absent, malformed, forged signature, `alg: none`, wrong `aud`, wrong `iss`, expired, unknown `kid`), plus the unconfigured and unfetchable-JWKS cases |
| 5 — an admitted identity reaches the Worker | `a_valid_access_identity_reaches_the_worker`, `the_access_cookie_is_accepted_like_the_header`, `a_service_token_identity_is_accepted`, and the REQ-115 / story-e674c60a ACs below |
| 6 — configuration recorded in the repository | `the_access_policy_is_recorded_in_the_repository` asserts the substance, not the file's existence |

### Superseded matrix behaviour (intent conflict, deliberate)

Three existing ACs pinned the pre-gate behaviour that *any* caller reaches the origin. What they
are actually about — one host, verbatim forwarding, and distinct origin failures — is unchanged
for an **admitted** caller, so their UATs now authenticate and each additionally asserts that an
unadmitted caller gets 401:

- `test_UAT_AC964_one_host_answers_every_route_with_the_origin_response_verbatim`
- `test_UAT_AC965_unconfigured_and_unreachable_origins_are_distinct_failures`
- `test_UAT_FC_REQ-115_control_app_fronts_the_builder_same_origin`

`test_UAT_FC_REQ-144_smoke_passes_against_a_correct_origin` was widened: the two new control-app
checks skip against a public-site origin, which the assertion now names rather than forbids.

### Not done here, and why

- **The Cloudflare-side objects** (the Access application, the policy, the identities) are created
  in the dashboard. `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` therefore **ship empty**, and the Worker
  is closed until they are filled in — which is the correct state for a private builder that is
  not yet in use. ACCESS.md says exactly where both values come from.
- **AC5 does not require a working builder.** It asserts the gate is not what stops one; the
  end-to-end assertions belong to REQ-145 and REQ-146.
- **SSE through Access** (`/api/ai/prompt`) is carried by REQ-146 — it needs a running assistant to
  confirm against, and confirming it is the point.
- **Draft snapshots on `public-site`** are untouched: still link-private, not authenticated
  (DOC-12 §5.1).

### Open questions for the operator

1. **The two values.** What is the Access team domain and, once the application exists, its AUD
   tag? Both are non-secret and go straight into `wrangler.toml`.
2. **The identity list.** ACCESS.md records `martin-github@westhead.me` (from git config) as the
   sole operator. Is that the address the Cloudflare identity will authenticate as, and is anyone
   else to be granted?
3. **Local `wrangler dev`.** The no-bypass decision above means `pnpm dev:control` answers 503
   until the vars are set, and needs a real token thereafter. Acceptable, or is a documented local
   escape wanted?