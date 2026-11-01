---
uid: acceptance_criterion-672b19e8
id: AC-2141
type: acceptance_criterion
title: The terms page offers only an agree control and declining records nothing
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:40:04.819493+00:00'
updated_at: '2026-11-01T10:40:04.819493+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0cd18650
  kind: behavior
  regression_only: false
---

## Criterion
The terms page offers exactly one control, which is to agree. Declining is not a recorded state: no control, endpoint or stored value records a refusal. A person who does not accept simply keeps receiving the terms page for navigations and 403 for everything else, and their record stays as it was.

## Verification
Fetch the terms page as an unaccepted person and assert it contains exactly one button, labelled to agree, and no decline/refuse wording. Assert no decline route exists (e.g. a POST to a decline-style path under the terms API is refused by the gate and does not change the user row).
