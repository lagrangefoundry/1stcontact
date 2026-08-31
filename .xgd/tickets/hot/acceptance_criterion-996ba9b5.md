---
uid: acceptance_criterion-996ba9b5
id: AC-1453
type: acceptance_criterion
title: The automation identity is provisioned by a documented command that persists
  no secret
created_by: xgd
created_at: '2026-08-31T17:03:19.759168+00:00'
updated_at: '2026-08-31T17:13:35.421329+00:00'
completed_at: null
last_field_updated: status
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

Read its source and the policy record beside the control application, and
observe: it creates a Service Auth policy rather than an identity one; it never
mentions the forwarded assertion header; it writes to no file; and the policy
record carries the service identity as a granted row with a reason, describes
what an automation caller presents, and contains no secret value.