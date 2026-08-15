---
uid: request-23fd6e61
id: REQ-147
type: request
title: 'The builder is private: Cloudflare Access on app.1stcontact.io'
created_by: xgd
created_at: '2026-08-15T20:34:01.076509+00:00'
updated_at: '2026-08-15T21:31:27.237906+00:00'
completed_at: null
last_field_updated: status
status: draft
fields:
  priority: high
  story_points: 5
  auto_merge_back: true
  needs_review: false
  ready_since: '2026-08-15T20:34:18.239366+00:00'
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
  turn (`/api/ai/prompt`) should be confirmed to survive Access rather than presumed to.
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
5. An authenticated operator can complete an edit and an AI turn, streaming included.
6. Access configuration is recorded in the repository as documentation — the policy lives in
   Cloudflare, but which identities are granted and why must not live only in a dashboard.

## Origin

[[CHAT-25]] — operator: "I don't want it publicly visible". Access chosen as the operator gate;
customer accounts deferred to the tenancy model in [[REQ-143]].