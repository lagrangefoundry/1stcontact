---
uid: acceptance_criterion-c7f1513b
id: AC-2077
type: acceptance_criterion
title: A business whose membership is revoked or expired is absent from the list entirely
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T01:33:55.614432+00:00'
updated_at: '2026-11-01T01:33:55.614432+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

A business whose membership has been withdrawn, or whose membership expiry has
passed, is absent from the person's list entirely — not listed as unselectable —
so a former member is not told which businesses they used to be able to reach.
Withdrawal and expiry each exclude independently of the other.

## Verification

Give one person three businesses. Withdraw the membership to one and set the
membership expiry of another into the past, leaving both grants active. Attempt
admission and assert it succeeds listing only the third business, with neither
excluded business present in any form.
