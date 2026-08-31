---
uid: acceptance_criterion-b674f256
id: AC-1384
type: acceptance_criterion
title: Granted identities, both controls and how to verify them are recorded in the
  repository, with no credential
created_by: xgd
created_at: '2026-08-31T09:32:31.520341+00:00'
updated_at: '2026-08-31T09:41:07.343916+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-182e8cb9
  kind: behavior
  regression_only: false
---

## Criterion

Which identities are granted, and why, is recorded in the repository beside the
application the gate protects — not only in the identity provider's dashboard.

The record carries, as substance an operator could act on six months later:

- both configuration settings the gate reads, by name, and where each value is
  obtained;
- both controls that close the builder — the removed default hostname and the
  in-application verification — and what each one protects against;
- **at least one granted identity, each with a stated reason** for being
  granted; an identity table with no identity in it, or with identities and no
  reasons, records nothing;
- how automation authenticates (a service identity), and that its secret belongs
  in a secret store rather than in the repository;
- where customer sign-in goes instead, so the operator gate is not later
  mistaken for the product's login.

No credential appears in the record. An audience identifier belongs there; a
service-identity secret does not.

## Verification

Read the policy record held in the repository beside the control application.
Observe each item above is present as substance rather than as a heading, that
every granted-identity row carries a reason as well as an address, and that no
service-identity secret value appears anywhere in it.

## Out of scope for this criterion

That an identity which authenticates but is **not** on the policy is refused is
enforced by the identity gateway before the request ever reaches the
application. The application never observes such a request, so no test in this
repository can assert it. It is recorded in this policy record instead, which is
the whole reason the record exists.