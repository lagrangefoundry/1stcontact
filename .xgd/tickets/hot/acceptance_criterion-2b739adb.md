---
uid: acceptance_criterion-2b739adb
id: AC-2319
type: acceptance_criterion
title: The real verifier refuses a simulator-minted token under a different audience
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:17:22.674843+00:00'
updated_at: '2026-11-04T18:17:22.674843+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-5b5be809
  kind: behavior
  regression_only: false
---

## Criterion
The same token that is accepted under the simulator's aud is refused by the product's real Access verifier when the verifier is configured with a different aud. This shows the gate checks claims and does not accept anything signed.

## Verification
Mint one token and verify it twice: once with the matching aud (accepted) and once with a different aud (refused).
