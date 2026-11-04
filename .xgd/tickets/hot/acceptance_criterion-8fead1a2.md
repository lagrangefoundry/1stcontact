---
uid: acceptance_criterion-8fead1a2
id: AC-2171
type: acceptance_criterion
title: A re-invite does not restamp the invitation time and never supersedes an existing
  current name
created_by: xgd
created_at: '2026-11-01T18:27:37.841424+00:00'
updated_at: '2026-11-04T16:29:50.649138+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

The invitation timestamp records when a person was first invited, so inviting a
person already invited leaves it unchanged. A name supplied at the invite gives a
person who has no current name their first name, with the supplied text as the
displayed name. A person who already has a current name keeps it whatever name
the invite carries: the re-invite writes no new name row and supersedes nothing,
so the person's name history is unchanged. Re-inviting is a successful no-op that
reports the person, not an error.

## Verification

Invite an address with no name and record the invitation timestamp; assert the
person has no current name. Invite it again with a name: assert the request
succeeds, the timestamp is unchanged and the current displayed name is the
supplied one. Invite it a third time with a different name: assert the timestamp
is still unchanged, the current displayed name is still the first one supplied,
and the person still holds exactly one name row, none superseded.
