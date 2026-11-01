---
uid: acceptance_criterion-4aa71bb2
id: AC-2152
type: acceptance_criterion
title: The operator adds a business to an existing account and it is immediately selectable
  for that account's owner
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T11:57:15.006394+00:00'
updated_at: '2026-11-01T11:57:15.006394+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-387c9dfe
  kind: behavior
  regression_only: false
---

## Criterion
A caller holding the fulfilment privilege submits an add-a-business request naming an existing account's email and a business name. The request succeeds with HTTP 200 and a JSON body carrying the new business's opaque id, its name (equal to the submitted name), and its site slug. Afterwards the named account's owner is admitted with both their original business and the new one. The new business is selectable and carries no lapse.

## Verification
Invite an owner (business "Salon") and an operator holding the privilege. As the operator, add business "Studio" for the owner's email with no end date. Assert 200 and `name == "Studio"`. Then assert admission for the owner succeeds, lists business names exactly ["Salon", "Studio"], and the entry matching the returned id has `selectable == true` and `lapse == null`.
