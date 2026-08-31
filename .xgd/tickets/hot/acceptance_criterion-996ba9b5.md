---
uid: acceptance_criterion-996ba9b5
id: AC-1453
type: acceptance_criterion
title: The automation identity is provisioned by a documented command that persists
  no secret
created_by: xgd
created_at: '2026-08-31T17:03:19.759168+00:00'
updated_at: '2026-08-31T18:02:49.795320+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-182e8cb9
  kind: behavior
  regression_only: false
---

## Criterion

The service identity the policy record names is minted by a documented,
operator-run command, and that command persists no secret.

The command is executable, is gated on an **API credential** for the provider's
management interface — which is emphatically not an Access credential and is
refused at the gate exactly as no credential is — and, given one:

- resolves the account explicitly, inferring it only when the credential sees
  exactly one; several accounts get a refusal naming them rather than a guess;
- locates the access application by the **domain** it guards, not by its
  display name, because the name is a label an operator can change without
  meaning to change anything;
- mints the named service token, or reuses it when it already exists, or issues
  a fresh secret on request — and says which of the three happened;
- ensures the application carries a **Service Auth** policy including that
  token, as a *separate* policy rather than by widening the operator's own, so
  the automation can be revoked without touching the rule that keeps the
  operator signed in; an existing policy already including the token is left
  alone;
- treats a refusal reported inside a successful transport envelope as a
  refusal, so "you may not do that" is never read as a successful no-op.

It prints the pair to the terminal once, for the operator to place in a password
manager, and **writes no secret to any file** — not into the repository, not
into a dotfile, not into a log. When the secret is no longer obtainable it says
so plainly and names the one command that produces a fresh one.

The granted service identity, and the reason it is granted, is recorded in the
repository's policy record alongside the human identities, and the record states
that the secret belongs in a secret store rather than in the repository. The
public half of the pair is not a secret; the secret half appears nowhere.

## Verification

Observe the provisioning command is executable and refuses to run without the
management API credential, naming the permissions it needs.

Then **run it**, against a stub standing where the provider's management
interface stands, and assert on the requests it makes. Every clause above is a
property of a request, and none of them can be observed by reading the command's
source: a string present in a file says nothing about whether the branch
carrying it runs, and the same request built a different way would fail a
reading while satisfying the criterion. Provisioning against the live interface
is not the alternative — that mints a real credential. Assert, across separate
runs:

- given several accounts and no explicit one, it refuses, names the setting that
  disambiguates and the accounts it saw, and creates nothing;
- given no application guarding the domain, it refuses, names the domain and
  reports the applications that are present, and creates nothing;
- given one account, and an application whose display name is misleading beside
  a decoy whose display name is the recognisable one, it mints the token and
  attaches the policy to the application matched on the **domain** — never the
  decoy — and every request after the account lookup is scoped to the inferred
  account;
- the policy it posts is a Service Auth rule including the token just minted,
  posted as a **new** policy: the operator's own rule is neither edited nor
  removed, and the only mutations made are creations;
- given the token and an including policy already present, it creates nothing at
  all, says the token was not recreated and the inclusion was left alone, and
  says plainly that the secret is no longer obtainable while naming the one
  command that produces a fresh one;
- asked to rotate, it rotates the token that exists rather than minting a second
  one, and prints the fresh secret;
- given a refusal reported inside a successful transport envelope, it fails
  rather than reporting a successful no-op, and repeats the refusal it was
  given.

Run the minting case with a writable working directory and a writable home
directory, and assert both are still empty afterwards: the pair reached the
terminal and no file.

Read the policy record beside the control application and observe it carries the
service identity as a granted row with a reason, describes what an automation
caller presents, says the secret belongs in a secret store, and contains no
secret value. The record *is* the artifact that clause is about, so reading it
is the observation rather than a substitute for one.

## Reconciliation note

The stub is reached through a base-URL override on the command, which is the one
concession it makes to being driven. It is not a credential and grants nothing —
setting it needs the same environment access as setting the management API token
itself, which is the thing actually worth having — and unset, which is every
operator invocation, the command talks to the provider.

Left as a stated non-guarantee: that the minted pair is in fact admitted by a
live Access edge. That needs a deploy and was confirmed by the operator against
production, not from this repository.
