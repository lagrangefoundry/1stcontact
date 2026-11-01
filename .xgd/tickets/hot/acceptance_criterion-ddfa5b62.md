---
uid: acceptance_criterion-ddfa5b62
id: AC-1752
type: acceptance_criterion
title: A revoked grant makes its business unselectable whatever its dates say
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:29:08.821156+00:00'
updated_at: '2026-11-01T10:15:19.250564+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

A grant marked revoked makes its business unselectable whatever its dates say,
with no effective grant and the lapse reason `revoked`. Revocation and expiry
are independent: a revocation that only took effect once an end date arrived
would make revoking an open-ended grant a no-op. The revoked business stays in
the person's list, and the person is not refused on its account — membership
admits, so a person whose only business is revoked is admitted with nothing
selectable.

## Verification

Invite an address with an open-ended grant, mark that grant revoked without
changing any date, and attempt admission. Assert it succeeds, listing the
business as unselectable with no grant and lapse reason `revoked`. Give the
person a second, entitled business and assert the revoked one stays listed and
unselectable beside it.
