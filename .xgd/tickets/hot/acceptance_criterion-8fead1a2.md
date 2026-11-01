---
uid: acceptance_criterion-8fead1a2
id: AC-2171
type: acceptance_criterion
title: A re-invite does not restamp the invitation time and never overwrites an existing
  display name
created_by: xgd
created_at: '2026-11-01T18:27:37.841424+00:00'
updated_at: '2026-11-01T18:57:27.363619+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

The invitation timestamp records when a person was first invited, so inviting a
person already invited leaves it unchanged. A name supplied at the invite fills
the person's display name only when it is empty; a person who already has a
display name keeps it whatever name the invite carries. Re-inviting is a
successful no-op that reports the person, not an error.

## Verification

Invite an address with no name and record the invitation timestamp. Invite it
again with a name: assert the request succeeds, the timestamp is unchanged and the
display name is now the supplied one. Invite it a third time with a different
name: assert the timestamp is still unchanged and the display name is still the
first one supplied.