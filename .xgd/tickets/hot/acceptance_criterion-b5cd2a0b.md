---
uid: acceptance_criterion-b5cd2a0b
id: AC-2053
type: acceptance_criterion
title: Capturing a reference, successful or refused, leaves the site's change counter,
  definition and draft journal unchanged
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T21:20:00.354486+00:00'
updated_at: '2026-10-28T04:07:34.890247+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-31204812
  kind: behavior
  regression_only: false
---

## Criterion
Capturing a reference does not change the site. After a successful `capture_site`, and after a refused one, the site's change counter, stored definition and draft journal are exactly as they were before the call. The reference is held in the reference store, not in the site.

## Verification
Through the composed surface over an in-memory site, record the change counter, definition bytes and journal length. Run one successful and one refused `capture_site`, then assert all three are unchanged and the successful capture appears in `list_references`.