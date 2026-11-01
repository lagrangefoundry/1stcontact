---
uid: acceptance_criterion-e6d7c451
id: AC-2150
type: acceptance_criterion
title: 'The refusal of add-a-business reveals nothing: body is ''Not found.'' and
  names neither admin nor business'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T11:57:09.628527+00:00'
updated_at: '2026-11-01T11:57:09.628527+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-387c9dfe
  kind: behavior
  regression_only: false
---

## Criterion
When add-a-business is refused to a caller without the fulfilment privilege, the response is HTTP 404 with the body `Not found.`. Compared case-insensitively, the body contains neither the word "admin" nor the word "business". An unprivileged caller can't tell from the response that an operator surface exists at that address.

## Verification
As an ordinary admitted customer, submit an add-a-business request. Assert status 404 and assert the lowercased body contains neither `admin` nor `business`.
