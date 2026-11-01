---
uid: acceptance_criterion-79e972b6
id: AC-2078
type: acceptance_criterion
title: Inviting and additional-business provisioning go through one operation; membership
  and grant are written together so no business exists that nobody may operate
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T01:33:57.196862+00:00'
updated_at: '2026-11-01T10:22:23.451307+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

Inviting a person and provisioning an additional business for an existing person
go through one business-provisioning operation, so both produce the same business
shape for the same inputs: a registered tenant carrying the business's name, an
owner membership, an active grant from an administrator source, and a starter site
the person can edit immediately. The membership and grant are written together, so
no business exists that nobody may operate or that carries no access. Provisioning
a business with no owning person or with an empty name is refused before anything
is written.

## Verification

Provision one business by invite and another for an existing person with the same
plan and window, then read the tenant, membership and grant rows for each back
from storage and assert they match field for field apart from identifiers and
names. Admit the person and assert the additional business is listed selectable
and its starter site is readable. Attempt to provision a business with an empty
owner and, separately, with an empty name, and assert each is refused and no new
tenant, membership or grant was stored.