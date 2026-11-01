---
uid: acceptance_criterion-3608323b
id: AC-2118
type: acceptance_criterion
title: A named business the caller holds no membership on is refused with 403, never
  substituted
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:25:37.617024+00:00'
updated_at: '2026-11-01T10:25:37.617024+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7102ffe3
  kind: behavior
  regression_only: false
---

## Criterion
For a non-admin caller, a request under `/b/<X>/…` where X is a business the caller holds no membership on (or which does not exist) gets:
- HTTP 403, `content-type: text/plain`, `cache-control: no-store`
- the same uniform body as an admission denial ("Your access to 1st Contact has ended. Please get in touch and we will sort it out."), so the response does not reveal whether X exists
- no data from X and no data from any business the caller *can* reach. The request is not resolved to a fallback business.

The specific reason (`not_a_member`) is written to the invocation log as a `scope_refused` event carrying the requested id, and is not sent on the wire.

## Verification
As a member of A only, request a business-scoped route under `/b/<B>/`. Assert the 403, the exact uniform body, and that nothing from A or B appears in the response. Assert the logged `scope_refused` event with reason `not_a_member`.
