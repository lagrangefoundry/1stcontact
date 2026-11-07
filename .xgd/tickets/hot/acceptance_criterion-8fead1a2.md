---
uid: acceptance_criterion-8fead1a2
id: AC-2171
type: acceptance_criterion
title: A re-invite does not restamp the invitation time; a name given at the add fills
  in and never supersedes an existing current name
created_by: xgd
created_at: '2026-11-01T18:27:37.841424+00:00'
updated_at: '2026-11-07T07:22:45.138623+00:00'
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
person already invited leaves it unchanged; re-inviting is an ordinary send that
reports the person, not an error. A name is supplied only at the add: it gives a
person who has no current name their first name, with the supplied text as the
displayed name. A person who already has a current name keeps it whatever name a
later add carries: that add writes no new name row and supersedes nothing, so the
person's name history is unchanged. The invite carries no name at all.

## Verification

Add an address with no name and assert the person has no current name. Add it
again with a name: assert the request succeeds, reports "not created", and the
current displayed name is the supplied one. Add it a third time with a different
name: assert the current displayed name is still the first one supplied and the
person still holds exactly one name row, none superseded. Invite the contact and
record the invitation timestamp; invite them again and assert the second invite
succeeds and the timestamp is unchanged.
