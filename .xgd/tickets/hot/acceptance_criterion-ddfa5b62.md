---
uid: acceptance_criterion-ddfa5b62
id: AC-1752
type: acceptance_criterion
title: A revoked grant refuses whatever its dates say
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:29:08.821156+00:00'
updated_at: '2026-09-11T06:29:08.821156+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

A grant marked revoked refuses whatever its dates say. Revocation and expiry are
independent: a revocation that only took effect once an end date arrived would
make revoking an open-ended grant a no-op.

## Verification

Invite an address with an open-ended grant, mark that grant revoked without
changing any date, and attempt admission. Assert it is refused and the reported
reason is the entitlement.
