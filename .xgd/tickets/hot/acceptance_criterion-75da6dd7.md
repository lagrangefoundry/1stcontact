---
uid: acceptance_criterion-75da6dd7
id: AC-2114
type: acceptance_criterion
title: A lapse reason is only ever reported for a business on which the person holds
  a live membership
created_by: xgd
created_at: '2026-11-01T09:54:36.617205+00:00'
updated_at: '2026-11-01T10:22:21.423418+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7b1025b8
  kind: security
  regression_only: false
---

## Criterion

Through admission, a lapse reason is reported only for businesses the person
holds a live membership on, so the reason is a fact about their own business and
discloses nothing about anyone else's. A lapsed business the person has no
membership on, or whose membership has been withdrawn or has expired, is absent
from the admission entirely rather than listed with a reason.

## Verification

Create two people, each with a business whose grant has lapsed. Admit the first
and assert only their own business is listed, with its reason, and the second
person's lapsed business does not appear. Withdraw the first person's membership
on their lapsed business and assert it is no longer listed, with or without a
reason.