---
uid: acceptance_criterion-99c540d7
id: AC-1060
type: acceptance_criterion
title: An assistant that cannot run is explained without losing the operator's conversation
created_by: xgd
created_at: '2026-08-10T08:36:12.102287+00:00'
updated_at: '2026-08-10T08:42:33.096066+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion
When the assistant cannot run because a required credential is absent from the
origin's environment, opening a conversation still succeeds: it returns the stored
turns and reports that a turn cannot be run, with an operator-readable explanation
naming what is missing and what to do about it — not a developer's error text and
not a failed request. The capability answer reports the same unreadiness for the
same reason, so a caller can say so before opening anything. The transcript is not
collateral damage.

## Verification
Hold a real conversation, then restart the origin without the credential. Opening
the same site returns the previously stored turns, reports it is not ready, and
carries an explanation naming the missing credential. The capability answer
reports not ready while still naming the assistant's role.