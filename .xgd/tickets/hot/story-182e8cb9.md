---
uid: story-182e8cb9
id: STORY-120
type: story
title: 'The builder is private: only granted identities reach it, on every address
  it answers on'
created_by: xgd
created_at: '2026-08-31T09:31:03.958986+00:00'
updated_at: '2026-08-31T09:33:09.588722+00:00'
completed_at: null
last_field_updated: body
status: unplanned
fields:
  intent_uid: bundle-b3b7c399
  capability_uid: capability-3606e35b
  story_kind: feature
  story_points: 3
---

## Story

**As the** operator of the platform, **I want** the builder to be reachable only
by identities I have granted, on every address it answers on, **so that** the
surface that edits and publishes every site is not exposed to whoever finds it.

## Description

The builder is private, and shut by two independent controls.

**Control one — there is only one door.** Authorisation is attached to a
hostname, so a deployment that also answers on a platform-assigned address is
open no matter how correct the policy on the intended hostname is. That second
address is removed in the deployment configuration, and removed for every
environment the Worker deploys to rather than only the one an inheritance rule
happens to cover.

**Control two — the application verifies the caller itself.** Before a route is
matched, a store handle exists or a byte is read, the request must carry a
currently-valid identity issued by the operator's identity gateway for *this*
application. Verification is against the gateway's published signing keys, with
the algorithm taken from those published keys rather than from the token's own
claim about how to check it, and with the audience checked as well as the
signature — every application in a team is signed by the same keys, so a
signature alone proves only "someone in this team", not "allowed in here".

It fails closed, with two refusals that are deliberately distinguished because
they need different fixes: an unconfigured gate refuses naming the setting it is
missing, which sends the operator to the configuration file; anything else —
absent, malformed, forged, unsigned, wrong-audience, wrong-issuer, expired or
signed by a key the gateway does not publish — refuses as an authorisation
failure, which sends the caller to sign in. Signing keys that cannot be fetched
deny rather than admit.

The same identity is accepted however it arrives: on the header the gateway
attaches, in the cookie a browser holds, and as an automation service identity
that carries a machine name instead of a person's address.

Finally, the granted identities, the two controls, the settings and how to
verify them are recorded in the repository, because a policy that lives only in
a dashboard is one nobody can review.

**In scope**: the refusal and admission behaviour of the gate; the deployment
configuration that leaves one door; the repository record of who is granted and
why.

**Out of scope**: what lies *behind* the gate. This story requires only that an
admitted identity reaches the surface and receives whatever it currently
answers — not that the builder works. Asserting an edit or a model turn here
would make the gate depend on the builder while the builder depends on the gate.
Also out of scope: customer sign-in to a tenant's own builder (a different
product surface, belonging with the tenancy model), and the public site's
link-private draft addressing, which this story does not revisit.

## Technical Context

Delegates the *live-origin* half of this capability's verification to CAP-102
(Platform Build, Deploy & Live-Origin Verification): the smoke checks that an
unauthenticated caller to the deployed control origin is challenged and that the
platform-default hostname does not answer are owned there, alongside the rest of
the live-origin check set. This story owns the behaviour those checks observe
and the configuration that produces it.

The surface behind the gate is CAP-85 (Builder Workspace). Three of its
acceptance criteria previously pinned the pre-gate behaviour that *any* caller
reaches the origin; the property each is about is unchanged for an **admitted**
caller, and their qualification by this gate is carried by the Builder Workspace
Origin item, not here.

**REQ-147 AC2 is not assertable in this repository, and no criterion below
tries.** "An identity not on the
policy is refused after authenticating" is enforced by the identity gateway
before the request reaches the application — the application never sees it.
There is therefore no acceptance criterion for it below and no test can exist
for it; it is recorded in the repository policy record instead, and AC-1384
states that exclusion explicitly so the story cycle does not write a UAT that
cannot exist.

**Nothing here is deployed.** At reconciliation time the account has no control
app Worker and the hostname does not resolve. The gate's behaviour is provable
against the real handler driven with real signatures, and against the
deployment configuration that governs every future deploy; the live-origin
assertions are CAP-102's and are provable against a deploy rather than against
production.

## Reconciliation Decisions

- **Signing-key rotation is survived without a restart** (decided at
  reconciliation, 2026-08-31): REQ-147 is silent on key rotation — it names
  signature, algorithm, audience, issuer and expiry, and says the keys are
  cached, but not what happens when the gateway starts signing with a key the
  cache predates. The landed code refreshes the cache once when a token names an
  unknown key, because the alternative is that every valid token is refused for
  the cache lifetime, and "valid identity, refused" is an outage that reads as a
  break-in. Formalized as AC-1380; this is reconciliation filling a gap in the
  original spec, not an operator request.

- **Refusals are neither cached nor indexed** (decided at reconciliation,
  2026-08-31): REQ-147 is silent on the shape of a refusal beyond its status.
  The landed code marks every refusal uncacheable and non-indexable, because a
  cached refusal is as wrong as a cached admission — an intermediary that stores
  one 401 serves it to the admitted identity too — and an indexed one advertises
  the private surface it is protecting. Formalized as AC-1381.

- **The identity is read from the cookie as well as the header, header first**
  (decided at reconciliation, 2026-08-31): REQ-147 notes the preview iframe is
  same-origin and "inherits the Access cookie", but does not state that the gate
  reads the cookie or which source wins when both are present. The landed code
  reads the header first and falls back to the cookie, because the header is
  what the gateway attaches to the request it forwards and the cookie is the
  copy the client controls. Formalized as AC-1376.

- **The one exception path, and why no criterion below forbids it** (decided at
  reconciliation, 2026-08-31): REQ-147's implementation record states "no
  local-development bypass ... a security control with an off switch is not
  one", and leaves it as an open question to the operator. REQ-145 — later in
  this same bundle — answers that question: a loopback-only opening was added,
  and the operator's own review note names it as a bypass and says it should be
  read as one. It is shaped so it cannot open a deployed Worker: it applies only
  when the gate is entirely unconfigured, and it is declared where a named
  environment cannot inherit it. The later intent supersedes the earlier
  statement, so the criteria below assert that a **configured** gate has no
  exception path — which is true, durable, and survives the exception being
  removed. The containment of the exception itself (its absence from the
  production environment) is asserted by the Builder Workspace Origin and
  Platform Build items, which own the configuration files it lives in. No
  criterion here asserts "no bypass exists", because that would set regression
  against intent the operator has since restated.

- **The repository policy record's "both settings ship empty" note is now
  stale** (noted at reconciliation, 2026-08-31, deliberately not formalized):
  REQ-147 shipped both settings empty because the gateway-side objects did not
  exist yet; they have since been filled in, which is exactly the lifecycle the
  record itself instructs. This is prose drift in a document, not a behavioural
  claim, and pinning a transient state as an acceptance criterion would make the
  correct next step a test failure.

## Dependencies

None. This story is deliberately independent of the builder working: the gate is
provable against the Worker as it stands, and the surface behind it depends on
the gate rather than the other way round.

## Story Points

3
