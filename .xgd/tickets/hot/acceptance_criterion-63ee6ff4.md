---
uid: acceptance_criterion-63ee6ff4
id: AC-2129
type: acceptance_criterion
title: An admitted account with nothing selectable still loads the builder chrome
  and the businesses listing
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:26:46.396361+00:00'
updated_at: '2026-11-01T10:26:46.396361+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7102ffe3
  kind: behavior
  regression_only: false
---

## Criterion
When an admitted caller (live membership) has no selectable business, for example because every grant has lapsed:
- the builder chrome document at `/` returns HTTP 200
- the businesses listing endpoint returns HTTP 200 and lists each of the caller's businesses, each marked not selectable with its reason

so that the switcher can explain why each business is closed.

## Verification
Seed a caller whose only business's grant has lapsed. Request `/` and the businesses endpoint and assert 200 for both, with every business in the listing marked not selectable.
