---
uid: acceptance_criterion-aa306f12
id: AC-2153
type: acceptance_criterion
title: 'Adding a business creates the whole business in one operation: active business,
  owner membership, live grant attributed to the operator, and a starter site'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T11:57:18.074069+00:00'
updated_at: '2026-11-01T12:03:13.815014+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-387c9dfe
  kind: behavior
  regression_only: false
---

## Criterion
A single successful add-a-business request produces all four parts of a business together:
1. An active business record with the submitted name, under the returned business id.
2. An active membership with role `owner` joining the named account's person to that business.
3. An active grant on that business whose `granted_by` is the operator's email address, which serves as the audit record of who fulfilled the order.
4. A starter site whose slug equals the business id.
No part exists without the others.

## Verification
As a privileged operator, add a business for an invited owner. From the response's business id, assert: the business record has the submitted name and status `active`. The owner's membership is `{role: owner, status: active}`. The grant has status `active` and `granted_by` equal to the operator's email. The returned `siteSlug` equals the returned business id.