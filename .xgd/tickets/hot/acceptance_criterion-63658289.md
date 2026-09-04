---
uid: acceptance_criterion-63658289
id: AC-1593
type: acceptance_criterion
title: The account's identifier is opaque and is not derived from anything the invitation
  was given
created_by: xgd
created_at: '2026-09-04T05:52:22.474238+00:00'
updated_at: '2026-09-04T06:00:23.245968+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e7871ed7
  kind: behavior
  regression_only: false
---

## Criterion

The account identifier an invitation produces is opaque: it is not a function of anything
the invitation was given. Two invitations carrying identical human-chosen inputs — the same
account name, the same display name — for two different people produce unrelated
identifiers, and neither identifier contains any of the inputs it was given (not the email,
not the local part of the email, not the account name, not the display name), in any
casing.

The human-readable label the invitation supplied is recorded as the account's name, where
it can be changed later, and is not the identifier.

## Verification

Issue two invitations differing only in email address, both supplying the same account name
and display name. Assert the two account identifiers differ. Assert that neither identifier
contains, case-insensitively, the account name, the display name, the email address or its
local part. Assert the supplied account name is readable back as the account's label.