---
uid: acceptance_criterion-d79ee7c2
id: AC-2224
type: acceptance_criterion
title: If the caller's account facts cannot be loaded, the portal says so and the
  explanation is unaffected
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:16:20.432833+00:00'
updated_at: '2026-11-01T20:16:20.432833+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-83ff6262
  kind: behavior
  regression_only: false
---

## Criterion
When the account request fails (network error or non-success status), the page shows "Your account details could not be loaded just now.". The account line and holdings sentence are not shown as empty text, and the Delete account control and erasure explanation still work exactly as when the load succeeds.

## Verification
Make the account endpoint return 401/500 and also throw. Check the error notice becomes visible, the identity and holdings elements show no text, and pressing Delete account still reveals the full explanation.
