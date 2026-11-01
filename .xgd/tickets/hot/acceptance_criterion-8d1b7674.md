---
uid: acceptance_criterion-8d1b7674
id: AC-2178
type: acceptance_criterion
title: The Contacts list holds exactly the people of the scoped business, contacts
  included, oldest first, for every business alike
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:00:32.508312+00:00'
updated_at: '2026-11-01T19:28:19.138631+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0034d937
  kind: behavior
  regression_only: false
---

## Criterion
The Contacts list for a caller scoped to business B contains exactly the person rows belonging to B, ordered by when each was created, oldest first. The order does not change when someone signs in. The list includes contacts who were never invited, as well as invited and signed-up people. It contains no person from any other business. The same request, made by a caller scoped to a customer's business, returns that customer's people and none of the 1st Contact business's people. The list is available to the people of every business on the same terms, with no branch on which business it is.

## Verification
Seed two businesses through shipped entry points: the platform business and a customer business. Each gets people, including one uninvited contact. Read the list scoped to each. Assert each list contains exactly its own business's rows, in creation order, and includes the uninvited contact. Record a sign-in for an earlier person, re-read, and assert the order is unchanged.