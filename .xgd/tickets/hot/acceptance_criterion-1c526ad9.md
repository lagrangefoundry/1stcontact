---
uid: acceptance_criterion-1c526ad9
id: AC-2056
type: acceptance_criterion
title: A session whose stored role is the legacy name reopens with its turns intact
  and takes a further turn that reaches the tools and changes the site, with nothing
  written under the legacy name
created_by: xgd
created_at: '2026-10-28T04:10:03.694146+00:00'
updated_at: '2026-10-28T04:10:03.694146+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion
A conversation whose stored transcript records the role under its former name
— the state of every conversation begun before the rename — is not stranded.
Opening it after a restart reports it ready, with no error, as the same
conversation with every turn it already had. A further turn in it reaches the
assistant's operations and changes the site. The former name is accepted on
read only: there is no migration of stored conversations, and nothing new is
recorded or reported under the former name.

## Verification
Run one turn, then rewrite the stored transcript's session header so its role
is the former name, and drop the in-process host so the next request must
resume from storage. Opening the conversation for the same site answers ready,
with no error, and two turns whose first carries the original message. A further
turn instructing a headline change, scripted to call the site-editing
operation, leaves the site's headline changed. Removing the read alias makes
this verification fail.
