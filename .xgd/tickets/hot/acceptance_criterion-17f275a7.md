---
uid: acceptance_criterion-17f275a7
id: AC-1741
type: acceptance_criterion
title: A business's identifier is opaque, distinct from its owning account's identifier,
  and derived from nothing a human chose; the label is separate
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:28:26.036516+00:00'
updated_at: '2026-11-04T17:10:24.003530+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

A business's identifier is opaque. It is not a function of anything supplied when
the business was set up, and not a function of anything a human chose. It is also
distinct from the identifier of the account that owns it (REQ-194). The business
and its account are two records with two keys, and a business key carries the
business prefix (`biz_`), never the account prefix (`acct_`). Two businesses
provisioned with identical human inputs (the same business name) for two
different invited people get two unrelated identifiers, and neither identifier
contains any word it was given. The human-readable label supplied at provisioning
is stored on the business record, where it can be changed later without changing
the identifier.

(Since REQ-186 the invite writes the person and their account only. The business,
and so its identifier and label, is written by provisioning a business.)

## Verification

Invite two addresses, then provision a business for each with an identical
business name (the `inviteAccount` fixture is exactly this invite-then-provision
sequence). Assert that the two business identifiers differ, that neither contains
any fragment of the supplied name, that each reads `biz_` followed by opaque hex,
that each differs from its owning account's key, and that the supplied label can
be read back from the business record.
