---
uid: acceptance_criterion-d7e8837a
id: AC-1596
type: acceptance_criterion
title: 'Logging in creates nothing: an unknown verified email, or an identity with
  no email, is refused and nothing is provisioned'
created_by: xgd
created_at: '2026-09-04T05:52:31.890444+00:00'
updated_at: '2026-09-04T06:00:22.808917+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e7871ed7
  kind: behavior
  regression_only: false
---

## Criterion

Logging in creates nothing. A verified identity that names no known person — an email
address never invited — is refused, and afterwards no person, account, ownership or grant
exists for it: the system does not sign anyone up on first sight.

An identity carrying no email address at all (an automated caller authenticating as
something other than a person) is likewise refused, as a refusal and not a crash.

## Verification

Present a verified but never-invited email address for admission; assert the result is a
refusal, and assert by counting records that no person, account, ownership or grant was
created for it. Present an identity with no email address; assert the result is a refusal
naming that as the reason and that no error escapes.