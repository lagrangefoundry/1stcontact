---
uid: acceptance_criterion-32149b5c
id: AC-1595
type: acceptance_criterion
title: An unconfigured platform tenant, or an invitation with no email, refuses with
  an actionable message rather than guessing
created_by: xgd
created_at: '2026-09-04T05:52:30.816153+00:00'
updated_at: '2026-09-04T05:52:30.816153+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e7871ed7
  kind: behavior
  regression_only: false
---

## Criterion

When the deployment has not been told which tenant its own people belong to, both
provisioning and admission refuse with an error naming the missing configuration and where
to set it, rather than defaulting to some tenant and filing real people into it.

An invitation with no email address to invite is likewise refused with a message saying so,
and creates nothing.

## Verification

With the platform tenant setting absent or blank, attempt an invitation and attempt a
login; assert both raise an error whose message names the missing setting. Assert no person,
account, ownership or grant was created. Separately, with the tenant configured, attempt an
invitation carrying an empty email address and assert it is refused and creates nothing.
