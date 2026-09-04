---
uid: acceptance_criterion-1bb7935b
id: AC-1594
type: acceptance_criterion
title: Inviting an already-known email reports the existing person and account and
  creates nothing, and letter case is not a difference
created_by: xgd
created_at: '2026-09-04T05:52:23.495182+00:00'
updated_at: '2026-09-04T06:00:23.098872+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e7871ed7
  kind: behavior
  regression_only: false
---

## Criterion

Inviting an email address that is already known reports the person and the account that
already exist — flagged as not newly created — rather than failing with a storage
constraint error and rather than creating a second person or a second account.

Letter case is not a difference: an address differing from a known one only in
capitalisation, or in surrounding whitespace, is the same person, both when invited again
and when logging in.

## Verification

Invite an address, then invite the same address again, and again with its capitalisation
changed. Assert each repeat invitation completes without error, reports that it created
nothing new, and reports the same person and the same account as the first. Assert exactly
one person record and one account exist for that address afterwards. Then log in with the
differently-capitalised form and assert the same person is admitted.