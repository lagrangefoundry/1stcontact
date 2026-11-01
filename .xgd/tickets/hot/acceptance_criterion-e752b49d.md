---
uid: acceptance_criterion-e752b49d
id: AC-2140
type: acceptance_criterion
title: GET /terms stays readable for any admitted person and shows the acceptance
  date once accepted
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:40:03.424320+00:00'
updated_at: '2026-11-01T10:46:01.783234+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0cd18650
  kind: behavior
  regression_only: false
---

## Criterion
`GET /terms` (and its business-prefixed form) answers 200 HTML with the terms text and version for any admitted person, accepted or not, ahead of any builder asset at that path. While an acceptance is outstanding, the page carries the accept control. Once the person has accepted the current version, the page carries the text "Accepted on YYYY-MM-DD" (the date of their recorded acceptance) and no accept control.

## Verification
As an admitted, unaccepted person, GET `/terms` and assert 200 HTML with the accept control. Accept, then GET `/terms` again and assert 200 HTML containing the terms text, "Accepted on" followed by the acceptance date, and no accept button. Assert the recognisable assets-binding body is never returned for `/terms`.