---
uid: acceptance_criterion-3763fb6b
id: AC-1451
type: acceptance_criterion
title: Half a service token is refused before any request is sent, and before the
  first site moves
created_by: xgd
created_at: '2026-08-31T17:03:10.438447+00:00'
updated_at: '2026-08-31T17:03:10.438447+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-182e8cb9
  kind: behavior
  regression_only: false
---

## Criterion

Half a service token is refused **before any request is sent**, not after the
edge declines it.

- A push configured with exactly one of the two halves — by option or by
  environment, in either combination — fails immediately, naming both halves,
  saying the credential is a pair, and naming the command that provisions one.
- The same refusal guards the production publish path **before the first site
  moves**: a run targeting the gated deployment with either half missing exits
  without pushing anything, naming both halves, the options that carry them and
  the provisioning command. A run that half-succeeded would leave the operator
  working out which sites moved.
- A run targeting an ungated origin is not subject to this refusal; the check is
  attached to the gated target, not to publishing.

There is no single-value credential to supply. The name that formerly denoted
one, and the option that carried it, are gone rather than deprecated: it never
denoted anything the gateway accepts, and leaving the name in place is how the
defect survived a written policy record.

## Verification

Invoke the push with only the client id set, and again with only the secret set,
and observe each fails without a request being made and names both halves and
the provisioning command.

Invoke the publish path against the gated production target with each half
missing in turn, and observe it exits before the first site is pushed with the
same substance. Observe also that no single-value credential name or option
remains anywhere in the publish path.
