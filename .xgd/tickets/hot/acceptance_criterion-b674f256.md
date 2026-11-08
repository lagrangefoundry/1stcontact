---
uid: acceptance_criterion-b674f256
id: AC-1384
type: acceptance_criterion
title: Granted identities, both controls, how to verify them and which service tokens
  act as which person are recorded in the repository, with no credential
created_by: xgd
created_at: '2026-08-31T09:32:31.520341+00:00'
updated_at: '2026-11-08T01:40:57.834251+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-182e8cb9
  kind: behavior
  regression_only: false
  uat_coverage: pass
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
- **which service-token names act as which person**: the deployment setting
  that maps a service token's machine name to a person's address, by name, with
  its `name=address` form, the mapping the production deployment declares, and
  its rules — empty means nobody, it is configuration and never caller input, a
  human's own address always wins, it names an existing person rather than
  creating one, and revoking either the token or the mapping entry is
  sufficient;
- where customer sign-in goes instead, so the operator gate is not later
  mistaken for the product's login.

No credential appears in the record. An audience identifier belongs there; a
service-identity secret does not. A service-token name and the address it maps
to are not credentials and belong there.

## Verification

Read the policy record held in the repository beside the control application.
Observe each item above is present as substance rather than as a heading, that
every granted-identity row carries a reason as well as an address, that the
service-token mapping setting is named with its form and the person the
production automation identity acts as, and that no service-identity secret
value appears anywhere in it.

## Out of scope for this criterion

That an identity which authenticates but is **not** on the policy is refused is
enforced by the identity gateway before the request ever reaches the
application. The application never observes such a request, so no test in this
repository can assert it. It is recorded in this policy record instead, which is
the whole reason the record exists.
