---
uid: acceptance_criterion-676666fc
id: AC-2216
type: acceptance_criterion
title: A request with neither an admitted identity nor a business scope gets 404 for
  the portal
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:16:09.278536+00:00'
updated_at: '2026-11-01T20:16:09.278536+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-83ff6262
  kind: behavior
  regression_only: false
---

## Criterion
When /account is requested with no admitted identity and no business scope, the response is 404 "Not found". No portal page is rendered for any business. When there is no admission but a business scope is present (e.g. a local run without the access layer), the portal of that scoped business is served.

## Verification
Request /account with no identity headers and no scope and check 404 with the not-found body. Request it with a scope and no admission and check 200 with that business's portal.
