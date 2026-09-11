---
uid: story-182e8cb9
id: STORY-120
type: story
title: 'The builder is private: only granted identities reach it, on every address
  it answers on'
created_by: xgd
created_at: '2026-08-31T09:31:03.958986+00:00'
updated_at: '2026-09-10T04:34:23.159639+00:00'
completed_at: null
last_field_updated: uat_coverage
status: updated
fields:
  intent_uid: bundle-b3b7c399
  capability_uid: capability-3606e35b
  story_kind: upgrade
  story_points: 3
  updated_by: bundle-78f4e2fe
  uat_coverage: pass
---

## Story

**As the** operator of the platform, **I want** the builder to be reachable only
by identities I have granted, on every address it answers on, **so that** the
surface that edits and publishes every site is not exposed to whoever finds it —
and **so that** my own automation can actually be one of those identities.

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

**The gate answers with *who*, not with *whether*.** Its verdict is the identity
it proved — the machine-or-person name it always has, and the email address it
has only for a human, because an automation service identity authenticates as a
machine name and carries no address at all. Whatever decides admission is handed
that identity rather than the token, so the address the gate proved is never
recovered by verifying the same token a second time: one signature check and one
signing-key lookup per request, not two.

That matters because **passing this gate is the first of two checks, not
admission.** The gateway's policy is identity-only — anyone who can receive an
email at a permitted address can obtain a valid token — so a verified identity
establishes who the caller is and says nothing about whether they may be here.
The second check, and everything it reads, is a different surface's; this story
owns only the first, and its criteria assert only the first's verdict: that this
caller was *not refused as unauthenticated*, and that what came back is *not one
of this gate's own refusals*. What the caller then receives is decided behind the
gate and is not asserted here.

**And a granted automation identity can actually present itself.** A gate that
admits a service identity nobody can produce a credential for is shut to
everyone, which is the state this surface was in: the copy-a-site-up command
sent the gateway's *own forwarded assertion header* as though it were an inbound
credential, so every call to the deployed builder was bounced to the sign-in
page — and, because the bounce was followed, the operator met a document-parse
error rather than an authentication refusal. So this story also owns the
caller's side of admission:

- what an automation caller **presents** — the client-id/client-secret pair the
  gateway exchanges at the edge for the assertion it forwards inward, never the
  assertion header itself, which is the far side's and proves nothing coming the
  other way;
- what a **partial or absent** credential does — half a pair is refused before a
  request is made and before the first site moves, naming both halves and the
  command that provisions them, because a run that half-succeeded leaves the
  operator working out which sites moved;
- how a **bounce** is reported — the redirect is not followed, and neither a
  redirect status nor an opaque response is permitted to read as success;
- how the identity is **minted** — one documented, operator-run provisioning
  command, driven by a management API credential that is never itself a gate
  credential, adding a *separate* Service Auth policy so the automation revokes
  without touching the operator's own rule, printing the secret once and writing
  it nowhere.

Finally, the granted identities, the two controls, the settings and how to
verify them are recorded in the repository, because a policy that lives only in
a dashboard is one nobody can review — and the granted automation identity is a
row in that same record, with its reason, and without its secret.

**In scope**: the refusal behaviour of the gate and the verdict it hands onward;
what a granted automation caller presents to it and how it is told when it is
refused; the provisioning of that automation identity; the deployment
configuration that leaves one door; the repository record of who is granted and
why.

**Out of scope**: what lies *behind* the gate — which now includes the decision
about whether a verified identity may be here at all, together with the records
that decision reads and the refusal it sends. This story requires only that a
granted identity is not stopped *by this gate*, and that the gate hands onward
what it proved; it does not require that the caller is then served, and it does
not require that the builder works. Asserting an edit, a model turn, or a
particular status code for an admitted caller here would make the gate depend on
both the builder and the check behind it, while both depend on the gate. The
automation criteria hold to the same line: they assert what is presented and
what a refusal says, never what the import behind the gate then does with the
site — that belongs to the store's copy path. Also out of scope: customer
sign-in to a tenant's own builder (a different product surface, belonging with
the tenancy model), and the public site's link-private draft addressing, which
this story does not revisit.

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

**The automation-credential criteria are provable without the gate being
deployed either.** What a caller presents, what a partial credential does and
how a bounce reads are all properties of the client and the operator scripts,
observable against a stub answering as the gate does; the provisioning command's
properties are observable in its own source and in the policy record it writes
into. The one thing that needed a live gate — that the pair is in fact admitted
— was confirmed empirically by the operator (BUG-36's implementation record: a
real push against the real Access gate landed a site into production storage).

## Reconciliation Decisions

- **The gate's verdict is the identity, and its criteria assert the verdict
  rather than the served response** (decided at reconciliation, 2026-09-10):
  REQ-167 states the request path as "after `access.ts` has produced a verified
  email" and then makes four further checks of its own before serving, but it
  does not say in as many words what this story's criteria should then assert.
  Two things follow from what it does say, and both are formalized here.

  First, the gate now reports the identity it proved — the machine-or-person
  name always, the email address only when the token carries one — instead of a
  yes/no. The intent's own reason for the change is that the address is what an
  account binds to; recovering it downstream would mean verifying the same token
  and fetching the same signing keys twice per request. Formalized as a new
  criterion on this story, because the verdict's shape is the gate's own output
  and nothing else on the matrix describes it.

  Second, AC-1375, AC-1376 and AC-1380 asserted that a valid token yields the
  *surface's* response. That was exact while passing the gate was admission; it
  is not any more, and holding it would set regression against intent the
  operator has deliberately changed. All three are restated as the gate's own
  verdict — not refused as unauthenticated, and no gate refusal in the body —
  which is the claim each was always making and which survives whatever is put
  behind the gate next. The end-to-end admitted path (a real grant, the chrome
  served) is evidence for the story that owns the second check, where there is a
  database to be entitled in; approximating it here would make this story depend
  on that one.

- **A granted automation service identity passes the gate and is then refused
  behind it, and that boundary is stated rather than quietly widened** (decided
  at reconciliation, 2026-09-10): a service token authenticates as a machine
  name and carries no address, and the address is what an account binds to. The
  gate's acceptance of such an identity — AC-1376 — is unchanged and remains
  true, because it is a claim about this gate's verdict and this gate's verdict
  is where this story's boundary is. What that identity then reaches is the
  second check's business. Whether the operator's automation is given a standing
  entitlement is a question for the identity work and is deliberately not
  answered here; no criterion below asserts either outcome for it.

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

- **The automation caller's side of admission belongs to this story** (decided
  at reconciliation, 2026-08-31): BUG-36's approved scope addition landed the
  credential fix in the copy-a-site-up command, which sits alongside the store's
  copy path (AC-1402) and the deploy-secret mechanism (AC-1342). Neither of
  those is about *identity*. This story already owns "only granted identities
  reach the builder" and already both admits an automation service identity
  (AC-1376) and requires the granted identities be recorded in the repository
  (AC-1384); "who may reach the builder" is incomplete while nothing states what
  a granted automation caller presents or what it is told when refused. Filed
  here as AC-1450 through AC-1453 rather than against the copy path. It is not
  behind the gate, so it does not cross this story's out-of-scope boundary.

- **An opaque response is a bounce too** (decided at reconciliation,
  2026-08-31): the intent ticket names the redirect and the parse error it
  caused, and is silent on the opaque response a redirect reads as under a
  client that returns one instead of the 3xx. The landed code reports both
  identically. Formalized inside AC-1452 rather than as its own criterion,
  because it is the same event observed through two conforming clients and a
  criterion covering only one would let the other regress into "refused with 0:
  (no body)".

- **The single-value credential name is deleted, not deprecated** (decided at
  reconciliation, 2026-08-31, following the repository's no-legacy-modes rule
  which the intent ticket invokes explicitly): the former option and environment
  variable never denoted anything the gateway accepts, so there is no working
  path to preserve. AC-1451 asserts their absence, because leaving the name in
  place is precisely how this defect survived a written policy record — an
  operator who reads the record then hunts for a value that cannot be obtained.

- **Two deliberate non-changes, recorded and not formalized** (2026-08-31): the
  proxy environment opt-in that the operator needed to reach the edge from a
  sandboxed network was deliberately kept out of the publish path — it is a
  property of one caller's network, not of publishing — and no criterion asserts
  it. Nor does any criterion assert the live-gate admission itself, which is
  CAP-102's live-origin territory and cannot be proved from this repository.

- **The provisioning command gained a management-API base-URL seam** (decided
  at reconciliation, 2026-08-31): AC-1453's claims are all properties of the
  requests `bin/access-token` makes — which account it resolves, which
  application it matches by domain, the shape of the policy it posts, whether it
  reads a refusal reported inside a 200 as a refusal, and whether it leaves the
  operator's own rule alone. None of those can be observed by reading the script,
  and provisioning against the live interface would mint a real credential, so
  the criterion was originally verified by pattern-matching the script's source.
  That proves a string is present, not that the branch carrying it runs. The base
  URL is now overridable, the command is driven against a stub, and the criterion
  asserts the requests. The override is not a credential and grants nothing —
  anyone who can set it can already set the management API token — and unset,
  which is every operator invocation, the command talks to Cloudflare.

## Dependencies

None. This story is deliberately independent of the builder working: the gate is
provable against the Worker as it stands, and the surface behind it depends on
the gate rather than the other way round. It is likewise independent of the
check that decides admission behind the gate: that check consumes this gate's
verdict, so it depends on this story and not the reverse. The
automation-credential criteria are similarly independent — they are properties
of what a caller sends and of what the operator scripts refuse, not of what the
builder does once a caller is in.

## Story Points

3