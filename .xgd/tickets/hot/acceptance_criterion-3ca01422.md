---
uid: acceptance_criterion-3ca01422
id: AC-2116
type: acceptance_criterion
title: Only per-business capacity grants decide selectability; a grant naming an account
  leaves its business unselectable and never_granted
created_by: xgd
created_at: '2026-11-01T09:54:39.422164+00:00'
updated_at: '2026-11-01T09:54:39.422164+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

Whether a business may be entered is decided only by grants against it that name
no account. A grant that names an account against a business, however current,
does not make that business selectable for the people holding memberships on it,
and a business whose only grants name an account reports the lapse reason
`never_granted`, not `expired`. Conversely, adding a grant naming the person's
account beside a lapsed capacity grant changes nothing about whether the business
may be entered.

## Verification

Give a person a business whose only grant is a current one naming an account.
Attempt admission and assert it succeeds with that business listed, unselectable
and reporting `never_granted`. Give another business an ended capacity grant
plus a current grant naming the person's account; assert it remains unselectable
with reason `expired`.
