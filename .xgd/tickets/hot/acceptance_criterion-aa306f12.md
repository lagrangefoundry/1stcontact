---
uid: acceptance_criterion-aa306f12
id: AC-2153
type: acceptance_criterion
title: 'Adding a business creates the whole business in one operation: active business,
  owner membership, live grant attributed to the operator, and a starter site'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T11:57:18.074069+00:00'
updated_at: '2026-11-04T21:41:03.154973+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-387c9dfe
  kind: behavior
  regression_only: false
---

## Criterion
A single successful add-a-business request produces all four parts of a business:
1. An active business record with the submitted name, under the returned business id.
2. An active membership with role `owner` joining the named account's person to that business.
3. An active grant on that business whose `granted_by` is the operator's email address, which serves as the audit record of who fulfilled the order.
4. A starter site belonging to that business, whose slug is the starter word `unnamed` — not the business id: the slug is unique only inside its business (REQ-190).
After a successful request every part exists. The membership and grant are written in one atomic batch; the business record and starter site are written in separate steps before and after that batch, so the four parts are not one atomic write.

## Verification
As a privileged operator, add a business for an invited owner. From the response's business id, assert: the business record has the submitted name and status `active`. The owner's membership is `{role: owner, status: active}`. The grant has status `active` and `granted_by` equal to the operator's email. The returned `siteSlug` is `unnamed`, differs from the business id, and is the only site row that business holds.

## Reconciliation Decisions
- (review report-0cfddba5) "No part exists without the others" overstated atomicity: identity.ts writes the tenant row and the starter site outside the membership/grant batch. Softened to what the code guarantees on success.
