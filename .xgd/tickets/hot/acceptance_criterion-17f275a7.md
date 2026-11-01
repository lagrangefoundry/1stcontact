---
uid: acceptance_criterion-17f275a7
id: AC-1741
type: acceptance_criterion
title: A business's (account's) identifier is opaque and derived from nothing a human
  chose; the label is separate
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:28:26.036516+00:00'
updated_at: '2026-11-01T22:22:32.106514+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

A business's identifier, which is also its account identifier, is opaque. It is
not a function of anything supplied when the business was set up, and it is not a
function of anything a human chose. Two businesses provisioned with identical
human inputs (the same business name) for two different invited people get two
unrelated identifiers, and neither identifier contains any word it was given. The
human-readable label supplied at provisioning is stored on the business record,
where it can be changed later without changing the identifier.

(Since REQ-186 the invite writes the person only. The business, and so its
identifier and label, is written by `provisionBusiness`, the add-a-business act.)

## Verification

Invite two addresses, then provision a business for each with an identical
business name (the `inviteAccount` fixture is exactly this invite +
`provisionBusiness` sequence). Assert that the two business identifiers differ,
that neither contains any fragment of the supplied name, and that the supplied
label can be read back from the business record.
